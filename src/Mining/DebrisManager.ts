/**
 * Debris Manager
 * 
 * Handles spawning and animating debris particles when blocks are broken.
 * Creates semi-translucent rock images that float upward and fade out.
 */

import { World, Entity, RigidBodyType, ColliderShape } from 'hytopia';
import { OreType, ORE_DATABASE } from './Ore/OreData';

/**
 * Mapping from OreType to block type ID (matches MiningSystem)
 * Block IDs 16-39 correspond to ore blocks in map.json
 */
const ORE_TO_BLOCK_ID: Map<OreType, number> = new Map([
  [OreType.STONE, 16],
  [OreType.DEEPSLATE, 17],
  [OreType.COAL, 18],
  [OreType.IRON, 19],
  [OreType.TIN, 20],
  [OreType.COBALT, 21],
  [OreType.PYRITE, 22],
  [OreType.GOLD, 23],
  [OreType.OBSIDIAN, 24],
  [OreType.RUBY, 25],
  [OreType.DIAMOND, 26],
  [OreType.AMBER, 27],
  [OreType.QUARTZ, 28],
  [OreType.TOPAZ, 29],
  [OreType.EMERALD, 30],
  [OreType.RELIC, 31],
  [OreType.AMETHYST, 32],
  [OreType.SAPPHIRE, 33],
  [OreType.LUMINITE, 34],
  [OreType.PRISMATIC, 35],
  [OreType.SUNSTONE, 36],
  [OreType.MITHRIAL, 37],
  [OreType.ASTRALITE, 38],
  [OreType.DRAGONSTONE, 39],
]);

/**
 * Data for a single debris piece
 */
interface DebrisData {
  /** The entity representing this debris piece */
  entity: Entity;
  
  /** Timestamp when debris was spawned */
  spawnTime: number;
  
  /** Lifetime in milliseconds (500ms = 0.5 seconds) */
  lifetime: number;
  
  /** Velocity vector for movement */
  velocity: { x: number; y: number; z: number };
  
  /** Rotation speed (radians per second) */
  rotationSpeed: { x: number; y: number; z: number };
  
  /** Current position (tracked manually since entity is out of simulation) */
  currentPosition: { x: number; y: number; z: number };
}

/**
 * Debris Manager class
 * Manages debris particle effects when blocks are broken
 */
export class DebrisManager {
  private world: World;
  private activeDebris: Map<Entity, DebrisData> = new Map();
  private updateInterval?: NodeJS.Timeout;
  private readonly DEBRIS_LIFETIME_MS = 500; // 0.5 seconds
  private readonly UPDATE_INTERVAL_MS = 16; // ~60 FPS updates
  private readonly MAX_DEBRIS_PER_PLAYER = 200; // Limit active debris
  
  /** Mining block type ID (same as MiningSystem uses) */
  private readonly MINING_BLOCK_TYPE_ID = 8;
  
  /** Debris size */
  private readonly DEBRIS_SIZE = { x: 0.2, y: 0.2, z: 0.2 }; // Larger size for visibility
  
  /** Initial opacity */
  private readonly DEBRIS_OPACITY = 1; // Increased opacity for visibility

  constructor(world: World) {
    this.world = world;
    this.startUpdateLoop();
  }

  /**
   * Starts the update loop for animating debris
   */
  private startUpdateLoop(): void {
    if (this.updateInterval) {
      return; // Already running
    }

    this.updateInterval = setInterval(() => {
      this.updateDebris();
    }, this.UPDATE_INTERVAL_MS);
  }

  /**
   * Stops the update loop
   */
  private stopUpdateLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  /**
   * Converts hex color string to RGB object
   * 
   * @param hex - Hex color string (e.g., "#FFD700" or "FFD700")
   * @returns RGB object with r, g, b values (0-255)
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    return { r, g, b };
  }

  /**
   * Spawns debris particles across the entire mining area (7x7 floor)
   * 
   * @param oreType - Type of ore that was broken (determines color)
   * @param areaBounds - Bounds of the mining area { minX, maxX, minZ, maxZ, y }
   * @param count - Number of debris pieces to spawn (default: 20)
   */
  spawnDebris(
    oreType: OreType,
    areaBounds: { minX: number; maxX: number; minZ: number; maxZ: number; y: number },
    count: number = 20
  ): void {
    // Get ore color from database
    const oreData = ORE_DATABASE[oreType];
    if (!oreData) {
      return; // Invalid ore type
    }

    // Convert hex color to RGB
    const tintColor = this.hexToRgb(oreData.color);

    // Limit count to prevent too many particles
    const debrisCount = Math.min(count, 20);
    
    // Check if we're at the limit (clean up old debris first if needed)
    if (this.activeDebris.size >= this.MAX_DEBRIS_PER_PLAYER * 10) {
      // Clean up oldest debris if we're over limit
      this.cleanupOldestDebris(5);
    }

    // Calculate area dimensions
    const areaWidth = areaBounds.maxX - areaBounds.minX + 1; // 7 blocks
    const areaDepth = areaBounds.maxZ - areaBounds.minZ + 1; // 7 blocks

    // Spawn debris pieces randomly across the entire 7x7 area
    for (let i = 0; i < debrisCount; i++) {
      // Random position within the mining area bounds
      const randomX = areaBounds.minX + Math.random() * areaWidth;
      const randomZ = areaBounds.minZ + Math.random() * areaDepth;
      const spawnPosition = {
        x: randomX,
        y: areaBounds.y,
        z: randomZ,
      };
      
      this.spawnDebrisPiece(spawnPosition, tintColor, oreType);
    }
  }

  /**
   * Gets the texture URI for a specific ore type
   * 
   * @param oreType - The ore type to get texture for
   * @returns Texture URI for the ore block, or fallback texture
   */
  private getOreBlockTextureUri(oreType: OreType): string {
    try {
      // Get block ID from mapping
      const blockId = ORE_TO_BLOCK_ID.get(oreType);
      if (blockId === undefined) {
        return 'blocks/stone.png'; // Fallback
      }

      // Get block type from world's block type registry
      const blockType = this.world.blockTypeRegistry.getBlockType(blockId);
      if (blockType && blockType.textureUri) {
        return blockType.textureUri;
      }
    } catch (error) {
      // Fallback if block type not found
    }
    // Fallback to stone texture if block type not available
    return 'blocks/stone.png';
  }

  /**
   * Spawns a single debris piece
   * 
   * @param spawnPosition - Position to spawn the debris at
   * @param tintColor - RGB color to tint the debris
   * @param oreType - Type of ore for texture selection
   */
  private spawnDebrisPiece(
    spawnPosition: { x: number; y: number; z: number },
    tintColor: { r: number; g: number; b: number },
    oreType: OreType
  ): void {
    // Add small random offset for slight variation
    const offsetX = (Math.random() - 0.5) * 0.3; // -0.15 to +0.15
    const offsetY = Math.random() * 0.2; // 0 to 0.2 (slightly above)
    const offsetZ = (Math.random() - 0.5) * 0.3; // -0.15 to +0.15

    const finalPosition = {
      x: spawnPosition.x + offsetX,
      y: spawnPosition.y + offsetY,
      z: spawnPosition.z + offsetZ,
    };

    // Random upward velocity (floats upward)
    const upwardVelocity = 0.5 + Math.random() * 1.0; // 0.5 to 1.5 units/second
    const horizontalDrift = (Math.random() - 0.5) * 0.4; // -0.2 to +0.2
    
    // Random rotation speeds
    const rotationSpeed = {
      x: (Math.random() - 0.5) * 2.0, // -1 to +1 rad/s
      y: (Math.random() - 0.5) * 2.0,
      z: (Math.random() - 0.5) * 2.0,
    };

    // Get the texture from the ore-specific block type
    const blockTextureUri = this.getOreBlockTextureUri(oreType);

    // Create debris entity with FIXED rigid body type
    // FIXED type is excluded from debug rendering by default (RAPIER.QueryFilterFlags.EXCLUDE_FIXED)
    // We can still update position with setPosition() even for FIXED bodies
    // Use sensor collider so debris doesn't block players or other entities
    const debrisEntity = new Entity({
      name: 'Mining Debris',
      blockTextureUri: blockTextureUri,
      blockHalfExtents: this.DEBRIS_SIZE,
      tintColor: tintColor,
      opacity: this.DEBRIS_OPACITY,
      isEnvironmental: true,
      tag: 'mining-debris',
      rigidBodyOptions: {
        type: RigidBodyType.FIXED,
        colliders: [
          {
            shape: ColliderShape.BLOCK,
            halfExtents: this.DEBRIS_SIZE,
            isSensor: true, // Sensor = no physical collision, objects pass through
          },
        ],
      },
    });

    // Spawn the entity
    debrisEntity.spawn(this.world, finalPosition);

    // Store debris data
    const debrisData: DebrisData = {
      entity: debrisEntity,
      spawnTime: Date.now(),
      lifetime: this.DEBRIS_LIFETIME_MS,
      velocity: {
        x: horizontalDrift,
        y: upwardVelocity,
        z: horizontalDrift * (Math.random() > 0.5 ? 1 : -1), // Random Z drift
      },
      rotationSpeed: rotationSpeed,
      currentPosition: { ...finalPosition },
    };

    this.activeDebris.set(debrisEntity, debrisData);
  }

  /**
   * Updates all active debris (called every frame)
   */
  private updateDebris(): void {
    const currentTime = Date.now();
    const deltaTime = this.UPDATE_INTERVAL_MS / 1000; // Convert to seconds

    const debrisToRemove: Entity[] = [];

    for (const [entity, data] of this.activeDebris.entries()) {
      // Calculate elapsed time
      const elapsedTime = currentTime - data.spawnTime;
      const lifetimeProgress = elapsedTime / data.lifetime;

      // Check if debris has expired
      if (lifetimeProgress >= 1.0) {
        debrisToRemove.push(entity);
        continue;
      }

      // Update position (float upward) - track manually since entity is out of simulation
      const newPosition = {
        x: data.currentPosition.x + data.velocity.x * deltaTime,
        y: data.currentPosition.y + data.velocity.y * deltaTime,
        z: data.currentPosition.z + data.velocity.z * deltaTime,
      };

      // Apply gravity (slow down upward velocity over time)
      data.velocity.y -= 0.5 * deltaTime; // Gravity effect

      // Update tracked position
      data.currentPosition = newPosition;

      // Update entity position - setPosition might still work on removed entities
      try {
        if (typeof entity.setPosition === 'function') {
          entity.setPosition(newPosition);
        }
      } catch (error) {
        // Entity might have been despawned, mark for removal
        debrisToRemove.push(entity);
        continue;
      }

      // Update opacity (fade out over lifetime)
      const opacity = this.DEBRIS_OPACITY * (1 - lifetimeProgress);
      try {
        entity.setOpacity(Math.max(0, opacity));
      } catch (error) {
        // Entity might have been despawned
        debrisToRemove.push(entity);
        continue;
      }

      // Update rotation (optional - if entity supports rotation)
      // Note: Hytopia entities might not support direct rotation updates
      // This is a placeholder for if rotation is needed
    }

    // Remove expired debris
    for (const entity of debrisToRemove) {
      this.removeDebris(entity);
    }
  }

  /**
   * Removes a debris piece
   * 
   * @param entity - Debris entity to remove
   */
  private removeDebris(entity: Entity): void {
    const data = this.activeDebris.get(entity);
    if (data) {
      try {
        if (entity.isSpawned) {
          entity.despawn();
        }
      } catch (error) {
        // Entity might already be despawned
      }
      this.activeDebris.delete(entity);
    }
  }

  /**
   * Cleans up oldest debris pieces
   * 
   * @param count - Number of oldest debris pieces to remove
   */
  private cleanupOldestDebris(count: number): void {
    // Sort by spawn time (oldest first)
    const sortedDebris = Array.from(this.activeDebris.entries())
      .sort((a, b) => a[1].spawnTime - b[1].spawnTime);

    // Remove oldest ones
    for (let i = 0; i < Math.min(count, sortedDebris.length); i++) {
      this.removeDebris(sortedDebris[i][0]);
    }
  }

  /**
   * Cleans up all debris (useful for cleanup/reset)
   */
  cleanupAllDebris(): void {
    for (const entity of this.activeDebris.keys()) {
      this.removeDebris(entity);
    }
  }

  /**
   * Cleanup when manager is destroyed
   */
  destroy(): void {
    this.stopUpdateLoop();
    this.cleanupAllDebris();
  }
}

