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
import { isPetId, PET_EQUIP_CAPACITY, PET_INVENTORY_CAPACITY } from '../Pets/PetDatabase';
import { PICKAXE_DATABASE } from '../Pickaxe/PickaxeDatabase';

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

  // Pet system fields are optional for backward compatibility, but if present they must be arrays of strings.
  if (data.petInventory !== undefined && !Array.isArray(data.petInventory)) return false;
  if (data.equippedPets !== undefined && !Array.isArray(data.equippedPets)) return false;
  if (data.petDiscovered !== undefined && !Array.isArray(data.petDiscovered)) return false;

  // World system fields are optional for backward compatibility
  if (data.currentWorld !== undefined && typeof data.currentWorld !== 'string') return false;
  if (data.unlockedWorlds !== undefined && !Array.isArray(data.unlockedWorlds)) return false;

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
    currentPickaxeTier: (() => {
      const savedTier = typeof savedData.currentPickaxeTier === 'number' && !isNaN(savedData.currentPickaxeTier) && savedData.currentPickaxeTier >= 0
        ? savedData.currentPickaxeTier
        : defaults.currentPickaxeTier;
      // Validate that the tier actually exists in the database
      const maxValidTier = PICKAXE_DATABASE.length > 0 
        ? Math.max(...PICKAXE_DATABASE.map(p => p.tier))
        : 0;
      // If saved tier is valid (exists in database), use it; otherwise use default
      const pickaxeExists = PICKAXE_DATABASE.some(p => p.tier === savedTier);
      return pickaxeExists ? savedTier : defaults.currentPickaxeTier;
    })(),
    ownedPickaxes: (() => {
      // Check if ownedPickaxes exists in saved data
      if (Array.isArray(savedData.ownedPickaxes) && savedData.ownedPickaxes.length > 0) {
        // Filter to only include valid tiers that exist in the database
        const validTiers = savedData.ownedPickaxes.filter((t: any) => {
          if (typeof t !== 'number' || isNaN(t) || t < 0) return false;
          // Check if this tier exists in the pickaxe database
          return PICKAXE_DATABASE.some(p => p.tier === t);
        }).sort((a: number, b: number) => a - b);
        return validTiers.length > 0 ? validTiers : [0];
      }
      // Migration: If ownedPickaxes not set, initialize based on currentPickaxeTier
      // Assume player owns all pickaxes from tier 0 up to currentPickaxeTier
      const currentTier = typeof savedData.currentPickaxeTier === 'number' && !isNaN(savedData.currentPickaxeTier) && savedData.currentPickaxeTier >= 0
        ? savedData.currentPickaxeTier
        : defaults.currentPickaxeTier;
      const owned: number[] = [];
      for (let i = 0; i <= currentTier; i++) {
        owned.push(i);
      }
      return owned.length > 0 ? owned : [0];
    })(),
    currentMinerTier: typeof savedData.currentMinerTier === 'number' && !isNaN(savedData.currentMinerTier) && savedData.currentMinerTier >= -1
      ? savedData.currentMinerTier
      : (defaults.currentMinerTier ?? -1),
    ownedMiners: savedData.ownedMiners && Array.isArray(savedData.ownedMiners)
      ? savedData.ownedMiners.filter((tier: any) => typeof tier === 'number' && !isNaN(tier) && tier >= 0).sort((a: number, b: number) => a - b)
      : (defaults.ownedMiners ?? []),
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
    // Migrate old boolean format to per-world format
    mineResetUpgradePurchased: (() => {
      if (typeof savedData.mineResetUpgradePurchased === 'boolean') {
        // Old format: migrate to per-world (assume it was for island1)
        return savedData.mineResetUpgradePurchased ? { island1: true } : {};
      } else if (savedData.mineResetUpgradePurchased && typeof savedData.mineResetUpgradePurchased === 'object') {
        // New format: per-world object
        return savedData.mineResetUpgradePurchased;
      } else {
        // Default: no upgrades
        return {};
      }
    })(),
    inventory: savedData.inventory && typeof savedData.inventory === 'object'
      ? { ...defaults.inventory, ...savedData.inventory }
      : defaults.inventory,

    // Pet system (sanitize + cap)
    petInventory: (() => {
      const raw = Array.isArray(savedData.petInventory) ? savedData.petInventory : (defaults.petInventory ?? []);
      const sanitized = raw.filter(isPetId).slice(0, PET_INVENTORY_CAPACITY);
      return sanitized;
    })(),
    equippedPets: (() => {
      const raw = Array.isArray(savedData.equippedPets) ? savedData.equippedPets : (defaults.equippedPets ?? []);
      const sanitized = raw.filter(isPetId).slice(0, PET_EQUIP_CAPACITY);
      return sanitized;
    })(),
    petDiscovered: (() => {
      const raw = Array.isArray(savedData.petDiscovered) ? savedData.petDiscovered : (defaults.petDiscovered ?? []);
      // Discovered is a unique set; sanitize to valid PetIds and dedupe.
      const unique: string[] = [];
      for (const id of raw) {
        if (!isPetId(id)) continue;
        if (!unique.includes(id)) unique.push(id);
      }
      return unique;
    })(),
    // World system (with defaults)
    currentWorld: typeof savedData.currentWorld === 'string' && savedData.currentWorld.length > 0
      ? savedData.currentWorld
      : (defaults.currentWorld ?? 'island1'),
    unlockedWorlds: (() => {
      const raw = Array.isArray(savedData.unlockedWorlds) ? savedData.unlockedWorlds : (defaults.unlockedWorlds ?? ['island1']);
      // Ensure 'island1' is always unlocked and dedupe
      const unique: string[] = [];
      if (!raw.includes('island1')) unique.push('island1');
      for (const worldId of raw) {
        if (typeof worldId === 'string' && worldId.length > 0 && !unique.includes(worldId)) {
          unique.push(worldId);
        }
      }
      return unique;
    })(),
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

