/**
 * Mine Reset Upgrade NPC
 * 
 * Creates an immovable NPC that players can interact with to purchase the mine reset upgrade.
 * When a player gets within 3 blocks, they can interact to open the upgrade UI.
 * 
 * Position: x: 5.08, y: 1.79, z: 14.35
 */

import { World, Player, Entity, RigidBodyType } from 'hytopia';

/**
 * Mine Reset Upgrade NPC Manager
 * Handles NPC creation and proximity detection
 */
export class MineResetUpgradeNPC {
  private world: World;
  private npcEntity?: Entity;
  private npcPosition: { x: number; y: number; z: number };
  private proximityRadius: number = 3; // 3 block radius
  private playerProximityMap: Map<Player, boolean> = new Map();
  private trackedPlayers: Set<Player> = new Set();
  private proximityCheckInterval?: NodeJS.Timeout;
  public onProximityChange?: (player: Player, inProximity: boolean, distance: number) => void;

  /**
   * Model URI for the NPC entity
   */
  private npcModelUri: string = 'models/npcs/villager.gltf';

  /**
   * Creates a new MineResetUpgradeNPC instance
   * 
   * @param world - Hytopia world instance
   * @param position - Position to spawn NPC at
   * @param modelUri - Optional model URI (defaults to villager)
   */
  constructor(
    world: World,
    position: { x: number; y: number; z: number },
    modelUri?: string
  ) {
    this.world = world;
    this.npcPosition = position;
    if (modelUri) {
      this.npcModelUri = modelUri;
    }
  }

  /**
   * Spawns the NPC entity in the world
   */
  spawn(): void {
    if (this.npcEntity?.isSpawned) {
      return;
    }

    // Create NPC entity - make it immovable
    this.npcEntity = new Entity({
      name: 'Mine Reset Upgrade Vendor',
      modelUri: this.npcModelUri,
      modelLoopedAnimations: ['idle'],
      modelScale: 1.0,
      // Make entity immovable by using STATIC rigid body type
      rigidBodyOptions: {
        type: RigidBodyType.STATIC,
        enabledRotations: { x: false, y: true, z: false }, // Only allow Y rotation (yaw)
      },
      tag: 'mine-reset-upgrade-npc',
    });

    // Spawn at specified position
    this.npcEntity.spawn(this.world, this.npcPosition);
    // Start proximity checking
    this.startProximityChecking();
  }

  /**
   * Despawns the NPC entity
   */
  despawn(): void {
    if (this.npcEntity?.isSpawned) {
      this.npcEntity.despawn();
    }
    this.stopProximityChecking();
  }

  /**
   * Starts checking player proximity to NPC
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
    for (const player of this.trackedPlayers) {
      const playerEntities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
      if (playerEntities.length === 0) continue;

      const playerEntity = playerEntities[0];
      const playerPos = playerEntity.position;

      // Calculate distance to NPC
      const dx = playerPos.x - this.npcPosition.x;
      const dy = playerPos.y - this.npcPosition.y;
      const dz = playerPos.z - this.npcPosition.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const wasInProximity = this.playerProximityMap.get(player) || false;
      const isInProximity = distance <= this.proximityRadius;

      // Only trigger event if proximity state changed
      if (wasInProximity !== isInProximity) {
        this.playerProximityMap.set(player, isInProximity);
        
        if (this.onProximityChange) {
          this.onProximityChange(player, isInProximity, distance);
        }
      }
    }
  }

  /**
   * Gets the NPC position
   */
  getPosition(): { x: number; y: number; z: number } {
    return { ...this.npcPosition };
  }

  /**
   * Gets the proximity radius
   */
  getProximityRadius(): number {
    return this.proximityRadius;
  }
}

