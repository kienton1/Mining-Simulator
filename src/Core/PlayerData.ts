/**
 * Player Data
 * 
 * Represents persistent player statistics and progression.
 * This data is saved and loaded between sessions.
 * 
 * Reference: Planning/gameOverview.txt section 2
 */

import { OreType } from '../Mining/Ore/OreData';

/**
 * Player's persistent statistics
 */
export interface PlayerData {
  /** Data version for migration support (increment when structure changes) */
  dataVersion?: number;
  
  /** Current power level (increases mining damage) */
  power: number;
  
  /** Number of times player has rebirthed */
  rebirths: number;
  
  /** Current gold/currency amount */
  gold: number;
  
  /** Number of wins (reaching bottom of mines) */
  wins: number;
  
  /** Current pickaxe tier (0 = Rusty, 1 = Stone, etc.) */
  currentPickaxeTier: number;
  
  /** Whether the mine reset upgrade (5 minutes) has been purchased */
  mineResetUpgradePurchased?: boolean;
  
  /** Inventory of ores */
  inventory: InventoryData;
}

/**
 * Current data version
 * Increment this when PlayerData structure changes to trigger migrations
 */
export const CURRENT_DATA_VERSION = 1;

/**
 * Inventory data structure
 * Maps ore type to quantity
 * Supports all 20 ore types from OreData
 */
export interface InventoryData {
  [OreType.STONE]?: number;
  [OreType.COAL]?: number;
  [OreType.CLAY]?: number;
  [OreType.SAND]?: number;
  [OreType.COPPER]?: number;
  [OreType.IRON]?: number;
  [OreType.LEAD]?: number;
  [OreType.NICKEL]?: number;
  [OreType.SILVER]?: number;
  [OreType.GOLD]?: number;
  [OreType.PLATINUM]?: number;
  [OreType.TITANIUM]?: number;
  [OreType.EMERALD]?: number;
  [OreType.RUBY]?: number;
  [OreType.SAPPHIRE]?: number;
  [OreType.TOPAZ]?: number;
  [OreType.DIAMOND]?: number;
  [OreType.MYTHRIL]?: number;
  [OreType.ADAMANTITE]?: number;
  [OreType.COSMIC]?: number;
}

/**
 * Creates a new player data object with default values
 * 
 * @returns Default player data
 */
export function createDefaultPlayerData(): PlayerData {
  return {
    dataVersion: CURRENT_DATA_VERSION,
    power: 1, // Base power when players join
    rebirths: 0,
    gold: 0,
    wins: 0,
    currentPickaxeTier: 0,
    inventory: {},
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

