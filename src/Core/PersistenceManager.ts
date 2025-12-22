/**
 * Persistence Manager
 * 
 * Handles saving and loading player data from Hytopia's persistence system.
 * Uses Hytopia's recommended pattern: PersistenceManager.instance
 * Provides data validation, error handling, and merging with defaults.
 * 
 * Based on Hytopia SDK best practices - uses singleton PersistenceManager.instance
 */

import { Player, PersistenceManager } from 'hytopia';
import type { PlayerData } from './PlayerData';
import { createDefaultPlayerData, CURRENT_DATA_VERSION } from './PlayerData';

/**
 * Validates player data structure
 * 
 * @param data - Data to validate
 * @returns True if data is valid, false otherwise
 */
function validatePlayerData(data: any): data is PlayerData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check required fields (dataVersion is optional for backwards compatibility)
  const requiredFields = ['power', 'rebirths', 'gold', 'wins', 'currentPickaxeTier', 'inventory'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      return false;
    }
  }

  // Validate types
  if (typeof data.power !== 'number' || isNaN(data.power) || data.power < 0) return false;
  if (typeof data.rebirths !== 'number' || isNaN(data.rebirths) || data.rebirths < 0) return false;
  if (typeof data.gold !== 'number' || isNaN(data.gold) || data.gold < 0) return false;
  if (typeof data.wins !== 'number' || isNaN(data.wins) || data.wins < 0) return false;
  if (typeof data.currentPickaxeTier !== 'number' || isNaN(data.currentPickaxeTier) || data.currentPickaxeTier < 0) return false;
  if (!data.inventory || typeof data.inventory !== 'object') return false;

  return true;
}

/**
 * Merges saved data with defaults to ensure all fields exist
 * 
 * @param savedData - Data loaded from persistence
 * @param defaults - Default player data
 * @returns Merged and validated player data
 */
function mergeWithDefaults(savedData: any, defaults: PlayerData): PlayerData {
  const merged: PlayerData = {
    dataVersion: typeof savedData.dataVersion === 'number' ? savedData.dataVersion : CURRENT_DATA_VERSION,
    power: typeof savedData.power === 'number' && !isNaN(savedData.power) && savedData.power >= 0 
      ? savedData.power 
      : defaults.power,
    rebirths: typeof savedData.rebirths === 'number' && !isNaN(savedData.rebirths) && savedData.rebirths >= 0 
      ? savedData.rebirths 
      : defaults.rebirths,
    gold: typeof savedData.gold === 'number' && !isNaN(savedData.gold) && savedData.gold >= 0 
      ? savedData.gold 
      : defaults.gold,
    wins: typeof savedData.wins === 'number' && !isNaN(savedData.wins) && savedData.wins >= 0 
      ? savedData.wins 
      : defaults.wins,
    currentPickaxeTier: typeof savedData.currentPickaxeTier === 'number' && !isNaN(savedData.currentPickaxeTier) && savedData.currentPickaxeTier >= 0 
      ? Math.min(savedData.currentPickaxeTier, 19) // Cap at max tier
      : defaults.currentPickaxeTier,
    inventory: savedData.inventory && typeof savedData.inventory === 'object'
      ? { ...defaults.inventory, ...savedData.inventory }
      : defaults.inventory,
  };

  // Sanitize inventory values (ensure they're numbers and non-negative)
  for (const key in merged.inventory) {
    const value = merged.inventory[key as keyof typeof merged.inventory];
    if (value !== undefined) {
      const numValue = typeof value === 'number' ? value : Number(value);
      if (isNaN(numValue) || numValue < 0) {
        delete merged.inventory[key as keyof typeof merged.inventory];
      } else {
        (merged.inventory as any)[key] = numValue;
      }
    }
  }

  return merged;
}

/**
 * Player Data Persistence Helper
 * Wraps Hytopia's PersistenceManager.instance with game-specific logic
 * 
 * Uses Hytopia's recommended singleton pattern: PersistenceManager.instance
 */
export class PlayerDataPersistence {
  /**
   * Loads player data from persistence using Hytopia's PersistenceManager
   * 
   * @param player - Player to load data for
   * @returns Player data (merged with defaults if needed) or null if load failed
   */
  static async loadPlayerData(player: Player): Promise<PlayerData | null> {
    try {
      // Use Hytopia's recommended PersistenceManager.instance singleton
      const savedData = await PersistenceManager.instance.getPlayerData(player);
      
      if (!savedData || Object.keys(savedData).length === 0) {
        // No saved data exists - return null to use defaults
        console.log(`[PersistenceManager] No saved data found for player ${player.username}, using defaults`);
        return null;
      }

      // Validate saved data
      if (!validatePlayerData(savedData)) {
        console.warn(`[PersistenceManager] Invalid saved data for player ${player.username}, using defaults`);
        return null;
      }

      // Merge with defaults to ensure all fields exist
      const defaults = createDefaultPlayerData();
      const mergedData = mergeWithDefaults(savedData, defaults);
      
      // Ensure data version is set (for future migrations)
      mergedData.dataVersion = mergedData.dataVersion || CURRENT_DATA_VERSION;

      console.log(`[PlayerDataPersistence] ✅ Loaded saved data for player ${player.username} (ID: ${player.id}):`, {
        power: mergedData.power,
        rebirths: mergedData.rebirths,
        gold: mergedData.gold,
        wins: mergedData.wins,
        pickaxeTier: mergedData.currentPickaxeTier,
        inventorySize: Object.keys(mergedData.inventory).length,
        inventory: mergedData.inventory,
      });
      console.log(`[PlayerDataPersistence] 📂 Loaded from: ./dev/persistence/player-${player.id}.json (in development mode)`);

      return mergedData;
    } catch (error) {
      console.error(`[PlayerDataPersistence] Failed to load data for player ${player.username}:`, error);
      return null;
    }
  }

  /**
   * Saves player data to persistence using Hytopia's PersistenceManager
   * 
   * @param player - Player to save data for
   * @param data - Player data to save
   * @returns True if save succeeded, false otherwise
   */
  static async savePlayerData(player: Player, data: PlayerData): Promise<boolean> {
    try {
      // Validate data before saving
      if (!validatePlayerData(data)) {
        console.error(`[PlayerDataPersistence] Cannot save invalid data for player ${player.username}`);
        return false;
      }

      // Use Hytopia's recommended PersistenceManager.instance singleton
      await PersistenceManager.instance.setPlayerData(player, data);
      
      // Enhanced logging for testing
      console.log(`[PlayerDataPersistence] ✅ Saved data for player ${player.username} (ID: ${player.id}):`, {
        power: data.power,
        rebirths: data.rebirths,
        gold: data.gold,
        wins: data.wins,
        pickaxeTier: data.currentPickaxeTier,
        inventorySize: Object.keys(data.inventory).length,
        inventory: data.inventory,
      });
      console.log(`[PlayerDataPersistence] 💾 Data saved to: ./dev/persistence/player-${player.id}.json`);
      console.log(`[PlayerDataPersistence] 📍 Location: dev/persistence/ folder in project root`);
      
      return true;
    } catch (error) {
      console.error(`[PlayerDataPersistence] ❌ Failed to save data for player ${player.username}:`, error);
      return false;
    }
  }
}

