/**
 * Merchant Entity
 * 
 * Creates an immovable merchant NPC that players can interact with to sell ores.
 * When a player gets within 3 blocks, a selling UI appears.
 * 
 * Reference: Planning/inventoryAndSellingSystem.md
 */

import { World, Player, Entity, RigidBodyType, PlayerEvent } from 'hytopia';

/**
 * Merchant Entity Manager
 * Handles merchant NPC creation and proximity detection
 */
export class MerchantEntity {
  private world: World;
  private merchantEntity?: Entity;
  private merchantPosition: { x: number; y: number; z: number };
  private proximityRadius: number = 3; // 3 block radius
  private playerProximityMap: Map<Player, boolean> = new Map();
  private trackedPlayers: Set<Player> = new Set(); // Track players as they join
  private proximityCheckInterval?: NodeJS.Timeout;
  public onProximityChange?: (player: Player, inProximity: boolean, distance: number) => void;

  /**
   * Model URI for the merchant entity
   * Can be changed to any model in assets/models/
   * Examples: 'models/npcs/villager.gltf', 'models/npcs/merchant.gltf'
   */
  private merchantModelUri: string = 'models/npcs/villager.gltf'; // Default, can be changed

  /**
   * Creates a new MerchantEntity instance
   * 
   * @param world - Hytopia world instance
   * @param position - Position to spawn merchant at
   * @param modelUri - Optional model URI (defaults to villager)
   */
  constructor(
    world: World,
    position: { x: number; y: number; z: number },
    modelUri?: string
  ) {
    this.world = world;
    this.merchantPosition = position;
    if (modelUri) {
      this.merchantModelUri = modelUri;
    }
  }

  /**
   * Spawns the merchant entity in the world
   */
  spawn(): void {
    if (this.merchantEntity?.isSpawned) {
      return;
    }

    // Create merchant entity - make it immovable
    this.merchantEntity = new Entity({
      name: 'Merchant',
      modelUri: this.merchantModelUri,
      modelLoopedAnimations: ['idle'],
      modelScale: 1.0,
      // Make entity immovable by using STATIC rigid body type
      rigidBodyOptions: {
        type: RigidBodyType.STATIC, // STATIC = cannot move
        enabledRotations: { x: false, y: true, z: false }, // Only allow Y rotation (yaw)
      },
      tag: 'merchant',
    });

    // Spawn at specified position
    this.merchantEntity.spawn(this.world, this.merchantPosition);
    // Start proximity checking
    this.startProximityChecking();
  }

  /**
   * Despawns the merchant entity
   */
  despawn(): void {
    if (this.merchantEntity?.isSpawned) {
      this.merchantEntity.despawn();
    }
    this.stopProximityChecking();
  }

  /**
   * Starts checking player proximity to merchant
   */
  private startProximityChecking(): void {
    // Check proximity every 0.5 seconds
    this.proximityCheckInterval = setInterval(() => {
      this.checkPlayerProximity();
    }, 500);
  }

  /**
   * Stops proximity checking
   */
  private stopProximityChecking(): void {
    if (this.proximityCheckInterval) {
      clearInterval(this.proximityCheckInterval);
      this.proximityCheckInterval = undefined;
    }
  }

  /**
   * Adds a player to tracking (called when player joins)
   */
  addPlayer(player: Player): void {
    this.trackedPlayers.add(player);
  }

  /**
   * Removes a player from tracking (called when player leaves)
   */
  removePlayer(player: Player): void {
    this.trackedPlayers.delete(player);
    this.playerProximityMap.delete(player);
  }

  /**
   * Checks if any players are within proximity radius
   */
  private checkPlayerProximity(): void {
    // Check only tracked players (those who have joined)
    for (const player of this.trackedPlayers) {
      const playerEntities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
      if (playerEntities.length === 0) continue;

      const playerEntity = playerEntities[0];
      const playerPos = playerEntity.position;

      // Calculate distance to merchant
      const dx = playerPos.x - this.merchantPosition.x;
      const dy = playerPos.y - this.merchantPosition.y;
      const dz = playerPos.z - this.merchantPosition.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const wasInProximity = this.playerProximityMap.get(player) || false;
      const isInProximity = distance <= this.proximityRadius;

      // Only trigger event if proximity state changed
      if (wasInProximity !== isInProximity) {
        this.playerProximityMap.set(player, isInProximity);
        
        // Use callback pattern instead of events
        // The callback will be set by the code that creates the merchant
        if (this.onProximityChange) {
          this.onProximityChange(player, isInProximity, distance);
        }
      }
    }
  }

  /**
   * Gets the merchant position
   */
  getPosition(): { x: number; y: number; z: number } {
    return { ...this.merchantPosition };
  }

  /**
   * Gets the proximity radius
   */
  getProximityRadius(): number {
    return this.proximityRadius;
  }
}

