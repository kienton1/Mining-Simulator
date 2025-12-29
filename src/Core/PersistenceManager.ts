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
  // Note: gems is optional for backwards compatibility with old saves
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
  if (data.gems !== undefined && (typeof data.gems !== 'number' || isNaN(data.gems) || data.gems < 0)) return false;
  if (typeof data.wins !== 'number' || isNaN(data.wins) || data.wins < 0) return false;
  if (typeof data.currentPickaxeTier !== 'number' || isNaN(data.currentPickaxeTier) || data.currentPickaxeTier < 0) return false;
  // Upgrade levels are optional for backward compatibility
  if (data.moreGemsLevel !== undefined && (typeof data.moreGemsLevel !== 'number' || isNaN(data.moreGemsLevel) || data.moreGemsLevel < 0)) return false;
  if (data.moreRebirthsLevel !== undefined && (typeof data.moreRebirthsLevel !== 'number' || isNaN(data.moreRebirthsLevel) || data.moreRebirthsLevel < 0)) return false;
  if (data.moreCoinsLevel !== undefined && (typeof data.moreCoinsLevel !== 'number' || isNaN(data.moreCoinsLevel) || data.moreCoinsLevel < 0)) return false;
  if (data.moreDamageLevel !== undefined && (typeof data.moreDamageLevel !== 'number' || isNaN(data.moreDamageLevel) || data.moreDamageLevel < 0)) return false;
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
    gems: typeof savedData.gems === 'number' && !isNaN(savedData.gems) && savedData.gems >= 0 
      ? savedData.gems 
      : (defaults.gems || 0),
    wins: typeof savedData.wins === 'number' && !isNaN(savedData.wins) && savedData.wins >= 0 
      ? savedData.wins 
      : defaults.wins,
    currentPickaxeTier: typeof savedData.currentPickaxeTier === 'number' && !isNaN(savedData.currentPickaxeTier) && savedData.currentPickaxeTier >= 0 
      ? Math.min(savedData.currentPickaxeTier, 19) // Cap at max tier
      : defaults.currentPickaxeTier,
    ownedPickaxes: (() => {
      // Check if ownedPickaxes exists in saved data
      if (Array.isArray(savedData.ownedPickaxes) && savedData.ownedPickaxes.length > 0) {
        return savedData.ownedPickaxes.filter((t: any) => typeof t === 'number' && !isNaN(t) && t >= 0).sort((a: number, b: number) => a - b);
      }
      // Migration: If ownedPickaxes not set, initialize based on currentPickaxeTier
      // Assume player owns all pickaxes from tier 0 up to currentPickaxeTier
      const currentTier = typeof savedData.currentPickaxeTier === 'number' && !isNaN(savedData.currentPickaxeTier) && savedData.currentPickaxeTier >= 0
        ? Math.min(savedData.currentPickaxeTier, 19)
        : defaults.currentPickaxeTier;
      const owned: number[] = [];
      for (let i = 0; i <= currentTier; i++) {
        owned.push(i);
      }
      return owned.length > 0 ? owned : [0];
    })(),
    moreGemsLevel: typeof savedData.moreGemsLevel === 'number' && !isNaN(savedData.moreGemsLevel) && savedData.moreGemsLevel >= 0
      ? savedData.moreGemsLevel
      : (defaults.moreGemsLevel || 0),
    moreRebirthsLevel: typeof savedData.moreRebirthsLevel === 'number' && !isNaN(savedData.moreRebirthsLevel) && savedData.moreRebirthsLevel >= 0
      ? savedData.moreRebirthsLevel
      : (defaults.moreRebirthsLevel || 0),
    moreCoinsLevel: typeof savedData.moreCoinsLevel === 'number' && !isNaN(savedData.moreCoinsLevel) && savedData.moreCoinsLevel >= 0
      ? savedData.moreCoinsLevel
      : (defaults.moreCoinsLevel || 0),
    moreDamageLevel: typeof savedData.moreDamageLevel === 'number' && !isNaN(savedData.moreDamageLevel) && savedData.moreDamageLevel >= 0
      ? savedData.moreDamageLevel
      : (defaults.moreDamageLevel || 0),
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
        return null;
      }

      // Validate saved data
      if (!validatePlayerData(savedData)) {
        return null;
      }

      // Merge with defaults to ensure all fields exist
      const defaults = createDefaultPlayerData();
      const mergedData = mergeWithDefaults(savedData, defaults);
      
      // Ensure data version is set (for future migrations)
      mergedData.dataVersion = mergedData.dataVersion || CURRENT_DATA_VERSION;

      return mergedData;
    } catch (error) {
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
        return false;
      }

      // Use Hytopia's recommended PersistenceManager.instance singleton
      await PersistenceManager.instance.setPlayerData(player, data);
      
      // Enhanced logging for testing
      return true;
    } catch (error) {
      return false;
    }
  }
}

