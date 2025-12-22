/**
 * Pickaxe Manager
 * 
 * Manages the visual representation of the player's pickaxe.
 * Handles spawning and attaching the pickaxe model to the player entity.
 * 
 * Reference: Planning/fileStructure.md - Pickaxe/PickaxeManager
 */

import { World, Player, Entity, RigidBodyType, ModelRegistry } from 'hytopia';
import type { PickaxeData } from './PickaxeData';
import { getPickaxeByTier } from './PickaxeDatabase';

/**
 * Gets the pickaxe color based on tier
 * Colors represent different pickaxe materials
 * 
 * @param tier - Pickaxe tier
 * @returns RGB color tuple [r, g, b] (0-255)
 */
function getPickaxeColor(tier: number): [number, number, number] {
  const colors: Record<number, [number, number, number]> = {
    0: [139, 69, 19],   // Rusty - Brown
    1: [128, 128, 128], // Stone - Gray
    2: [192, 192, 192], // Iron - Silver
    3: [105, 105, 105], // Steel - Dark Gray
    4: [176, 196, 222], // Crystal - Light Blue
    5: [255, 215, 0],   // Mythic - Gold
  };
  
  return colors[tier] || colors[0];
}

/**
 * Pickaxe Manager class
 * Manages pickaxe entities attached to players
 */
export class PickaxeManager {
  private world: World;
  private playerPickaxeEntities: Map<Player, Entity> = new Map();

  /**
   * Creates a new PickaxeManager instance
   * 
   * @param world - Hytopia world instance
   */
  constructor(world: World) {
    this.world = world;
  }

  /**
   * Spawns and attaches a pickaxe to a player
   * 
   * @param player - Player to attach pickaxe to
   * @param pickaxeTier - Tier of pickaxe to spawn
   */
  attachPickaxeToPlayer(player: Player, pickaxeTier: number): void {
    // Remove existing pickaxe if any
    this.removePickaxeFromPlayer(player);

    const pickaxe = getPickaxeByTier(pickaxeTier);
    if (!pickaxe) {
      console.warn(`Pickaxe tier ${pickaxeTier} not found`);
      return;
    }

    // Get player entity
    const playerEntities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
    if (playerEntities.length === 0) {
      console.warn('Player entity not found when trying to attach pickaxe');
      return;
    }

    const playerEntity = playerEntities[0];
    const playerPosition = playerEntity.position;

    // List all available anchor points from the player model
    if (playerEntity.modelUri) {
      try {
        const modelRegistry = ModelRegistry.instance;
        const allNodes = modelRegistry.getNodeNames(playerEntity.modelUri);
        const anchorNodes = allNodes.filter(n => 
          n.toLowerCase().includes('anchor') || 
          n.toLowerCase().includes('hand') ||
          n.toLowerCase().includes('weapon') ||
          n.toLowerCase().includes('attach')
        );
      } catch (e) {
        // Silently handle node listing errors
      }
    }

    // Get pickaxe color for this tier
    const [r, g, b] = getPickaxeColor(pickaxeTier);
    const tintColor = { r, g, b };

    // Create pickaxe entity WITHOUT parent in constructor (spawn first, then attach)
    // This avoids fatal errors if the node doesn't exist
    // Using larger, more visible block and ensuring it's not hidden
    const pickaxeEntity = new Entity({
      name: `${pickaxe.name} Pickaxe`,
      blockTextureUri: 'blocks/stone.png', // Using stone texture as base
      blockHalfExtents: { x: 0.15, y: 0.4, z: 0.15 }, // Even larger for visibility
      tintColor: tintColor, // Color based on tier
      opacity: 1.0, // Ensure fully opaque
      tag: 'pickaxe',
      // Use KINEMATIC_VELOCITY so it can follow the player
      rigidBodyOptions: {
        type: RigidBodyType.KINEMATIC_VELOCITY,
      },
    });

    // Spawn the pickaxe first at a visible position to test
    const testPosition = {
      x: playerPosition.x + 1,
      y: playerPosition.y + 1,
      z: playerPosition.z + 1,
    };
    pickaxeEntity.spawn(this.world, testPosition);
    
    // Wait a moment to ensure entity is fully spawned, then attach
    setTimeout(() => {
      // Now try to attach to hand - use setParent which won't crash if node doesn't exist
      // Based on console output, the actual anchor name is 'hand-right-anchor' (with dashes)
      const possibleAnchorNames = [
        'hand-right-anchor',  // This is the actual anchor name from the model (with dashes)
        'hand_right_anchor',   // Try underscore version too
        'handRightAnchor',
        'hand_r_anchor',
        'rightHandAnchor',
        'weapon_anchor',
        'weaponAnchor',
      ];
      
      let attached = false;
      for (const anchorName of possibleAnchorNames) {
        try {
          pickaxeEntity.setParent(
            playerEntity,
            anchorName,
            { x: 0.15, y: 0, z: 0.15 }, // Position relative to anchor (forward and to the right)
            { x: 0, y: 0.707, z: 0, w: 0.707 } // Rotation: 90 degrees around Y axis (pointing forward)
          );
          attached = true;
          break;
        } catch (error) {
          // Try next anchor name
          // Try next anchor name
          continue;
        }
      }
      
      if (!attached) {
        console.warn(`[PickaxeManager] Could not attach to any hand anchor, attaching to root`);
        try {
          pickaxeEntity.setParent(
            playerEntity,
            undefined, // No specific node - attaches to root
            { x: 0.5, y: 0.5, z: 0.5 }, // Position relative to player
            { x: 0, y: 0, z: 0, w: 1 }
          );
        } catch (error) {
          console.error(`[PickaxeManager] Failed to attach pickaxe:`, error);
        }
      }
    }, 100);

    // Store reference for cleanup (do this immediately, attachment happens in setTimeout)
    this.playerPickaxeEntities.set(player, pickaxeEntity);
  }

  /**
   * Removes pickaxe from player
   * 
   * @param player - Player to remove pickaxe from
   */
  removePickaxeFromPlayer(player: Player): void {
    const pickaxeEntity = this.playerPickaxeEntities.get(player);
    if (pickaxeEntity) {
      pickaxeEntity.despawn();
      this.playerPickaxeEntities.delete(player);
    }
  }

  /**
   * Updates player's pickaxe (removes old, attaches new)
   * 
   * @param player - Player to update
   * @param newPickaxeTier - New pickaxe tier
   */
  updatePlayerPickaxe(player: Player, newPickaxeTier: number): void {
    this.attachPickaxeToPlayer(player, newPickaxeTier);
  }

  /**
   * Cleans up pickaxe when player leaves
   * 
   * @param player - Player who left
   */
  cleanupPlayer(player: Player): void {
    this.removePickaxeFromPlayer(player);
  }
}

