/**
 * Selling System
 * 
 * Handles selling ores to gold conversion.
 * 
 * Reference: Planning/inventoryAndSellingSystem.md section 2
 */

import { Player } from 'hytopia';
import { OreType, ORE_DATABASE, type OreData } from '../Mining/Ore/OreData';
import { ISLAND2_ORE_DATABASE, ISLAND2_ORE_TYPE, type Island2OreData } from '../worldData/Ores';
import { InventoryManager } from '../Inventory/InventoryManager';
import type { PlayerData } from '../Core/PlayerData';
import { getPickaxeByTier } from '../Pickaxe/PickaxeDatabase';

/**
 * Callback to get the More Coins multiplier from upgrade system
 * This will be set by GameManager
 */
type GetMoreCoinsMultiplierCallback = (player: Player) => number;

/**
 * Callback to get the miner coin bonus percentage
 * This will be set by GameManager
 */
type GetMinerCoinBonusCallback = (player: Player) => number;

/**
 * Selling System class
 * Handles selling ores for gold
 */
export class SellingSystem {
  private inventoryManager: InventoryManager;
  private getPlayerDataCallback?: (player: Player) => PlayerData | undefined;
  private updatePlayerDataCallback?: (player: Player, data: PlayerData) => void;
  private getMoreCoinsMultiplierCallback?: GetMoreCoinsMultiplierCallback;
  private getMinerCoinBonusCallback?: GetMinerCoinBonusCallback;

  /**
   * Creates a new SellingSystem instance
   * 
   * @param inventoryManager - Inventory manager instance
   */
  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager;
  }

  /**
   * Sets the callback function to get player data
   * 
   * @param callback - Function to get player data
   */
  setGetPlayerDataCallback(callback: (player: Player) => PlayerData | undefined): void {
    this.getPlayerDataCallback = callback;
  }

  /**
   * Sets the callback function to update player data
   * 
   * @param callback - Function to update player data
   */
  setUpdatePlayerDataCallback(callback: (player: Player, data: PlayerData) => void): void {
    this.updatePlayerDataCallback = callback;
  }

  /**
   * Sets the callback function to get More Coins multiplier
   * 
   * @param callback - Function to get More Coins multiplier
   */
  setGetMoreCoinsMultiplierCallback(callback: GetMoreCoinsMultiplierCallback): void {
    this.getMoreCoinsMultiplierCallback = callback;
  }

  /**
   * Sets the callback function to get miner coin bonus
   * 
   * @param callback - Function to get miner coin bonus percentage
   */
  setGetMinerCoinBonusCallback(callback: GetMinerCoinBonusCallback): void {
    this.getMinerCoinBonusCallback = callback;
  }

  /**
   * Sells all ores in player's inventory
   * 
   * REBALANCED: Now applies pickaxe sell value multiplier
   * Formula: TotalGold = Σ (OreAmount_i × OreValue_i × PickaxeSellMultiplier)
   * 
   * @param player - Player to sell ores for
   * @returns Total gold earned, or 0 if no ores or error
   */
  sellAll(player: Player): number {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return 0;
    }

    // Get player's pickaxe for sell value multiplier
    const pickaxe = getPickaxeByTier(playerData.currentPickaxeTier);
    const pickaxeMultiplier = pickaxe?.sellValueMultiplier ?? 1.0;
    
    // Get More Coins upgrade multiplier (1.0 + level * 0.1)
    const moreCoinsMultiplier = this.getMoreCoinsMultiplierCallback?.(player) ?? 1.0;
    
    // Get miner coin bonus percentage (e.g., 15 = +15%)
    const minerCoinBonus = this.getMinerCoinBonusCallback?.(player) ?? 0;
    
    // Calculate combined multiplier by adding all percentages
    const sellMultiplier = this.calculateCombinedCoinMultiplier(
      pickaxeMultiplier,
      moreCoinsMultiplier,
      minerCoinBonus
    );

    // Calculate total value before clearing (with combined multiplier)
    let totalGold = this.inventoryManager.calculateTotalValue(player, sellMultiplier);
    
    // Round to nearest integer (no decimals)
    totalGold = Math.round(totalGold);

    if (totalGold === 0) {
      return 0;
    }

    // Get all ore types in inventory
    const inventory = this.inventoryManager.getInventory(player);
    const oreTypes = Object.keys(inventory);

    // Calculate base value (without multiplier) for logging
    let baseValue = 0;
    for (const oreType of oreTypes) {
      const amount = inventory[oreType] || 0;
      if (!amount) continue;
      
      // Try Island 1 database first
      let oreData: OreData | Island2OreData | undefined = ORE_DATABASE[oreType as OreType];
      // Try Island 2 database if not found
      if (!oreData && oreType in ISLAND2_ORE_DATABASE) {
        oreData = ISLAND2_ORE_DATABASE[oreType as ISLAND2_ORE_TYPE];
      }
      
      if (oreData && amount > 0) {
        baseValue += amount * oreData.value;
      }
    }

    // Remove all ores from inventory
    for (const oreType of oreTypes) {
      this.inventoryManager.removeOre(player, oreType);
    }

    // Add gold to player
    playerData.gold = (playerData.gold || 0) + totalGold;
    this.updatePlayerDataCallback?.(player, playerData);
    return totalGold;
  }

  /**
   * Sells selected ores from player's inventory
   * 
   * @param player - Player to sell ores for
   * @param oreTypes - Array of ore types to sell
   * @returns Total gold earned, or 0 if no ores or error
   */
  sellSelected(player: Player, oreTypes: OreType[]): number {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return 0;
    }

    if (oreTypes.length === 0) {
      return 0;
    }

    // Get player's pickaxe for sell value multiplier
    const pickaxe = getPickaxeByTier(playerData.currentPickaxeTier);
    const pickaxeMultiplier = pickaxe?.sellValueMultiplier ?? 1.0;
    
    // Get More Coins upgrade multiplier (1.0 + level * 0.1)
    const moreCoinsMultiplier = this.getMoreCoinsMultiplierCallback?.(player) ?? 1.0;
    
    // Get miner coin bonus percentage (e.g., 15 = +15%)
    const minerCoinBonus = this.getMinerCoinBonusCallback?.(player) ?? 0;
    
    // Calculate combined multiplier by adding all percentages
    const sellMultiplier = this.calculateCombinedCoinMultiplier(
      pickaxeMultiplier,
      moreCoinsMultiplier,
      minerCoinBonus
    );

    let totalGold = 0;

    // Calculate total value and remove ores (with combined multiplier)
    for (const oreType of oreTypes) {
      const amount = this.inventoryManager.getOreCount(player, oreType);
      if (amount > 0) {
        const oreData = ORE_DATABASE[oreType];
        if (oreData) {
          const value = amount * oreData.value * sellMultiplier;
          totalGold += value;
          this.inventoryManager.removeOre(player, oreType);
        }
      }
    }

    // Round to nearest integer (no decimals)
    totalGold = Math.round(totalGold);

    if (totalGold === 0) {
      return 0;
    }

    // Add gold to player
    playerData.gold = (playerData.gold || 0) + totalGold;
    this.updatePlayerDataCallback?.(player, playerData);
    return totalGold;
  }

  /**
   * Sells a specific ore type
   * 
   * @param player - Player to sell ore for
   * @param oreType - Type of ore to sell
   * @param amount - Amount to sell (default: all)
   * @returns Gold earned, or 0 if no ore or error
   */
  sellOre(player: Player, oreType: OreType, amount?: number): number {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return 0;
    }

    const currentAmount = this.inventoryManager.getOreCount(player, oreType);
    if (currentAmount === 0) {
      return 0;
    }

    // If no amount specified, sell all
    const sellAmount = amount === undefined ? currentAmount : Math.min(amount, currentAmount);
    if (sellAmount <= 0) {
      return 0;
    }

    const oreData = ORE_DATABASE[oreType];
    if (!oreData) {
      return 0;
    }

    // Get player's pickaxe for sell value multiplier
    const pickaxe = getPickaxeByTier(playerData.currentPickaxeTier);
    const pickaxeMultiplier = pickaxe?.sellValueMultiplier ?? 1.0;
    
    // Get More Coins upgrade multiplier (1.0 + level * 0.1)
    const moreCoinsMultiplier = this.getMoreCoinsMultiplierCallback?.(player) ?? 1.0;
    
    // Get miner coin bonus percentage (e.g., 15 = +15%)
    const minerCoinBonus = this.getMinerCoinBonusCallback?.(player) ?? 0;
    
    // Calculate combined multiplier by adding all percentages
    const sellMultiplier = this.calculateCombinedCoinMultiplier(
      pickaxeMultiplier,
      moreCoinsMultiplier,
      minerCoinBonus
    );

    const baseValue = sellAmount * oreData.value;
    let goldEarned = baseValue * sellMultiplier;
    
    // Round to nearest integer (no decimals)
    goldEarned = Math.round(goldEarned);

    // Remove ore from inventory
    this.inventoryManager.removeOre(player, oreType, sellAmount);

    // Add gold to player
    playerData.gold = (playerData.gold || 0) + goldEarned;
    this.updatePlayerDataCallback?.(player, playerData);
    return goldEarned;
  }

  /**
   * Calculates the combined coin multiplier by adding all percentage bonuses
   * Converts pickaxe and upgrade multipliers to percentages, adds miner percentage,
   * then converts back to a single multiplier
   * 
   * @param pickaxeMultiplier - Pickaxe sell value multiplier (e.g., 1.5 = +50%)
   * @param moreCoinsMultiplier - More Coins upgrade multiplier (e.g., 1.2 = +20%)
   * @param minerCoinBonusPercent - Miner coin bonus percentage (e.g., 15 = +15%)
   * @returns Combined multiplier
   */
  private calculateCombinedCoinMultiplier(
    pickaxeMultiplier: number,
    moreCoinsMultiplier: number,
    minerCoinBonusPercent: number
  ): number {
    // Convert multipliers to percentages
    const pickaxePercent = (pickaxeMultiplier - 1.0) * 100; // e.g., 1.5 -> 50%
    const moreCoinsPercent = (moreCoinsMultiplier - 1.0) * 100; // e.g., 1.2 -> 20%
    
    // Add all percentages together
    const totalPercent = pickaxePercent + moreCoinsPercent + minerCoinBonusPercent;
    
    // Convert back to multiplier: 1.0 + (totalPercent / 100)
    return 1.0 + (totalPercent / 100);
  }

  /**
   * Gets the combined coin multiplier for a player (for UI display)
   * This calculates the multiplier using all bonuses: pickaxe, More Coins upgrade, and miner
   * 
   * @param player - Player to get multiplier for
   * @returns Combined multiplier
   */
  getCombinedCoinMultiplier(player: Player): number {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return 1.0;
    }

    // Get player's pickaxe for sell value multiplier
    const pickaxe = getPickaxeByTier(playerData.currentPickaxeTier);
    const pickaxeMultiplier = pickaxe?.sellValueMultiplier ?? 1.0;
    
    // Get More Coins upgrade multiplier (1.0 + level * 0.1)
    const moreCoinsMultiplier = this.getMoreCoinsMultiplierCallback?.(player) ?? 1.0;
    
    // Get miner coin bonus percentage (e.g., 15 = +15%)
    const minerCoinBonus = this.getMinerCoinBonusCallback?.(player) ?? 0;
    
    // Calculate combined multiplier by adding all percentages
    return this.calculateCombinedCoinMultiplier(
      pickaxeMultiplier,
      moreCoinsMultiplier,
      minerCoinBonus
    );
  }

  /**
   * Gets the sell value for all ores in inventory (without selling)
   * 
   * REBALANCED: Now applies pickaxe sell value multiplier, More Coins upgrade, and miner bonus
   * All percentage bonuses are added together before being applied as a multiplier
   * 
   * @param player - Player to calculate value for
   * @returns Total gold value
   */
  getSellValue(player: Player): number {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return 0;
    }

    // Get player's pickaxe for sell value multiplier
    const pickaxe = getPickaxeByTier(playerData.currentPickaxeTier);
    const pickaxeMultiplier = pickaxe?.sellValueMultiplier ?? 1.0;
    
    // Get More Coins upgrade multiplier (1.0 + level * 0.1)
    const moreCoinsMultiplier = this.getMoreCoinsMultiplierCallback?.(player) ?? 1.0;
    
    // Get miner coin bonus percentage (e.g., 15 = +15%)
    const minerCoinBonus = this.getMinerCoinBonusCallback?.(player) ?? 0;
    
    // Calculate combined multiplier by adding all percentages
    const sellMultiplier = this.calculateCombinedCoinMultiplier(
      pickaxeMultiplier,
      moreCoinsMultiplier,
      minerCoinBonus
    );

    let totalValue = this.inventoryManager.calculateTotalValue(player, sellMultiplier);
    // Round to nearest integer (no decimals)
    return Math.round(totalValue);
  }

  /**
   * Gets the sell value for selected ores (without selling)
   * 
   * REBALANCED: Now applies pickaxe sell value multiplier
   * 
   * @param player - Player to calculate value for
   * @param oreTypes - Array of ore types to calculate value for
   * @returns Total gold value
   */
  getSellValueForSelected(player: Player, oreTypes: OreType[]): number {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return 0;
    }

    // Get player's pickaxe for sell value multiplier
    const pickaxe = getPickaxeByTier(playerData.currentPickaxeTier);
    const pickaxeMultiplier = pickaxe?.sellValueMultiplier ?? 1.0;
    
    // Get More Coins upgrade multiplier (1.0 + level * 0.1)
    const moreCoinsMultiplier = this.getMoreCoinsMultiplierCallback?.(player) ?? 1.0;
    
    // Get miner coin bonus percentage (e.g., 15 = +15%)
    const minerCoinBonus = this.getMinerCoinBonusCallback?.(player) ?? 0;
    
    // Calculate combined multiplier by adding all percentages
    const sellMultiplier = this.calculateCombinedCoinMultiplier(
      pickaxeMultiplier,
      moreCoinsMultiplier,
      minerCoinBonus
    );

    let total = 0;

    for (const oreType of oreTypes) {
      const amount = this.inventoryManager.getOreCount(player, oreType);
      if (amount > 0) {
        const oreData = ORE_DATABASE[oreType];
        if (oreData) {
          total += amount * oreData.value * sellMultiplier;
        }
      }
    }

    // Round to nearest integer (no decimals)
    return Math.round(total);
  }
}

