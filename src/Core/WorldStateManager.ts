/**
 * WorldStateManager - Per-world manager tracking
 *
 * Tracks GameManager and related entities for each world instance.
 * Enables lookup of the correct manager for a player's current world.
 * Handles cleanup when worlds are torn down.
 */

import type { World, Player } from 'hytopia';
import type { GameManager } from './GameManager.js';
import type { PickaxeManager } from '../Pickaxe/PickaxeManager.js';

/**
 * Collection of managers and entities for a single world instance
 */
export interface PerWorldManagers {
  gameManager: GameManager;
  pickaxeManager: PickaxeManager;
  // Entities created per-world
  merchantEntities: any[];
  mineResetUpgradeNPCs: any[];
  gemTraderEntities: any[];
  eggStationManager: any;
  goldenMachine: any;
  dailyChestController: any;
  dailyChestLabelManager: any;
  eggStationLabelManager: any;
  shopLabelManager: any;
}

/**
 * Singleton manager for tracking all world instances and their managers.
 * Use WorldStateManager.instance to access.
 */
export class WorldStateManager {
  private static _instance: WorldStateManager | null = null;

  private worldManagers: Map<number, PerWorldManagers> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static get instance(): WorldStateManager {
    if (!WorldStateManager._instance) {
      WorldStateManager._instance = new WorldStateManager();
    }
    return WorldStateManager._instance;
  }

  /**
   * Reset the singleton (for testing)
   */
  static reset(): void {
    WorldStateManager._instance = null;
  }

  /**
   * Register a world with its managers
   */
  registerWorld(worldId: number, managers: PerWorldManagers): void {
    this.worldManagers.set(worldId, managers);
    console.log(`[WORLD_STATE_MANAGER] Registered world ${worldId} with managers`);
  }

  /**
   * Get managers for a specific world
   */
  getManagersForWorld(worldId: number): PerWorldManagers | undefined {
    return this.worldManagers.get(worldId);
  }

  /**
   * Get GameManager for a player's current world
   */
  getGameManagerForPlayer(player: Player): GameManager | undefined {
    const world = player.world;
    if (!world) return undefined;
    return this.worldManagers.get(world.id)?.gameManager;
  }

  /**
   * Get PickaxeManager for a player's current world
   */
  getPickaxeManagerForPlayer(player: Player): PickaxeManager | undefined {
    const world = player.world;
    if (!world) return undefined;
    return this.worldManagers.get(world.id)?.pickaxeManager;
  }

  /**
   * Clean up a world and all its managers/entities
   */
  cleanupWorld(worldId: number): void {
    const managers = this.worldManagers.get(worldId);
    if (!managers) {
      console.log(`[WORLD_STATE_MANAGER] No managers found for world ${worldId}`);
      return;
    }

    console.log(`[WORLD_STATE_MANAGER] Cleaning up world ${worldId}`);

    // Stop interval-based systems
    try {
      if (managers.eggStationManager?.stop) {
        managers.eggStationManager.stop();
      }
      if (managers.dailyChestController?.stop) {
        managers.dailyChestController.stop();
      }
      if (managers.dailyChestLabelManager?.stop) {
        managers.dailyChestLabelManager.stop();
      }
      if (managers.eggStationLabelManager?.stop) {
        managers.eggStationLabelManager.stop();
      }
      if (managers.shopLabelManager?.stop) {
        managers.shopLabelManager.stop();
      }
    } catch (err) {
      console.error(`[WORLD_STATE_MANAGER] Error stopping managers for world ${worldId}:`, err);
    }

    // Remove from tracking
    this.worldManagers.delete(worldId);
    console.log(`[WORLD_STATE_MANAGER] World ${worldId} cleanup complete`);
  }

  /**
   * Get all registered world IDs
   */
  getRegisteredWorldIds(): number[] {
    return Array.from(this.worldManagers.keys());
  }

  /**
   * Check if a world is registered
   */
  isWorldRegistered(worldId: number): boolean {
    return this.worldManagers.has(worldId);
  }

  /**
   * Get count of registered worlds
   */
  getWorldCount(): number {
    return this.worldManagers.size;
  }
}
