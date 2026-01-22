/**
 * Player Data
 * 
 * Represents persistent player statistics and progression.
 * This data is saved and loaded between sessions.
 * 
 * Reference: Planning/gameOverview.txt section 2
 */

import { OreType } from '../Mining/Ore/World1OreData';
import type { TutorialProgress } from '../Tutorial/TutorialTypes';

/**
 * Player's persistent statistics
 */
export interface PlayerData {
  /** Data version for migration support (increment when structure changes) */
  dataVersion?: number;
  
  /** Current power level (increases mining damage) - stored as string for BigInt support in JSON */
  power: string;
  
  /** Number of times player has rebirthed */
  rebirths: number;
  
  /** Current gold/currency amount */
  gold: number;
  
  /** Current gems/currency amount (secondary currency) */
  gems: number;
  
  /** Number of wins (reaching bottom of mines) */
  wins: number;
  
  /** Current pickaxe tier (0 = Rusty, 1 = Stone, etc.) */
  currentPickaxeTier: number;
  
  /** Array of owned pickaxe tiers (all pickaxes the player has purchased) */
  ownedPickaxes?: number[];
  
  /** Current miner tier (-1 = none equipped, 0-23 = equipped miner tier) */
  currentMinerTier?: number;
  
  /** Array of owned miner tiers (all miners the player has purchased) */
  ownedMiners?: number[];
  
  /** Whether the mine reset upgrade (5 minutes) has been purchased per world */
  mineResetUpgradePurchased?: Record<string, boolean>; // Key: worldId, Value: whether purchased
  
  /** Gem Trader upgrade levels */
  moreGemsLevel?: number;
  moreRebirthsLevel?: number;
  moreCoinsLevel?: number;
  moreDamageLevel?: number;
  
  /** Inventory of ores */
  inventory: InventoryData;

  /**
   * Pet System
   *
   * Stored as arrays of PetIds so duplicates are naturally supported (one entry per pet instance).
   * These fields are optional for backwards compatibility with older saves.
   */
  petInventory?: string[];
  equippedPets?: string[];
  /** Unique list of pets the player has ever obtained (used for "NEW" tagging). */
  petDiscovered?: string[];
  /** Pet IDs that should be auto-deleted on hatch (per player). */
  autoDeletePets?: string[];

  /** Tutorial progress for new players */
  tutorial?: TutorialProgress;

  /**
   * World System
   * 
   * Multi-world support for different maps/locations.
   */
  /** Currently active world ID (default: 'island1' for original map) */
  currentWorld?: string;
  /** Array of unlocked world IDs (default: ['island1'] for original map) */
  unlockedWorlds?: string[];
}

/**
 * Current data version
 * Increment this when PlayerData structure changes to trigger migrations
 */
export const CURRENT_DATA_VERSION = 5;

/**
 * Inventory data structure
 * Maps ore type to quantity
 * Supports all ore types from both Island 1 (OreType) and Island 2 (ISLAND2_ORE_TYPE)
 * Uses index signature to allow any string key for world-aware support
 */
export interface InventoryData {
  [oreType: string]: number | undefined;
}

/**
 * Creates a new player data object with default values
 * 
 * @returns Default player data
 */
export function createDefaultPlayerData(): PlayerData {
  return {
    dataVersion: CURRENT_DATA_VERSION,
    power: '1', // Base power when players join (stored as string for BigInt)
    rebirths: 0,
    gold: 0,
    gems: 0,
    wins: 0,
    currentPickaxeTier: 0,
    ownedPickaxes: [0], // Start with tier 0 (Wooden) pickaxe
    currentMinerTier: -1, // Start with no miner equipped
    ownedMiners: [], // Start with no miners owned
    mineResetUpgradePurchased: {}, // Start without the 5-minute upgrade for any world
    moreGemsLevel: 0,
    moreRebirthsLevel: 0,
    moreCoinsLevel: 0,
    moreDamageLevel: 0,
    inventory: {},
    petInventory: [],
    equippedPets: [],
    petDiscovered: [],
    autoDeletePets: [],
    currentWorld: 'island1', // Default to original map
    unlockedWorlds: ['island1'], // Original map is always unlocked
  };
}

/**
 * Gets the total value of all ores in inventory
 * 
 * @param inventory - Player's inventory
 * @param oreValues - Map of ore types to their values
 * @returns Total gold value of inventory
 */
export function calculateInventoryValue(
  inventory: InventoryData,
  oreValues: Record<string, number>
): number {
  let total = 0;
  for (const [oreType, amount] of Object.entries(inventory)) {
    const value = oreValues[oreType] || 0;
    total += (amount || 0) * value;
  }
  return total;
}

