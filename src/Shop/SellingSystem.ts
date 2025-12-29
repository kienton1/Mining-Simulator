/**
 * Selling System
 * 
 * Handles selling ores to gold conversion.
 * 
 * Reference: Planning/inventoryAndSellingSystem.md section 2
 */

import { Player } from 'hytopia';
import { OreType, ORE_DATABASE } from '../Mining/Ore/OreData';
import { InventoryManager } from '../Inventory/InventoryManager';
import type { PlayerData } from '../Core/PlayerData';
import { getPickaxeByTier } from '../Pickaxe/PickaxeDatabase';

/**
 * Callback to get the More Coins multiplier from upgrade system
 * This will be set by GameManager
 */
type GetMoreCoinsMultiplierCallback = (player: Player) => number;

/**
 * Selling System class
 * Handles selling ores for gold
 */
export class SellingSystem {
  private inventoryManager: InventoryManager;
  private getPlayerDataCallback?: (player: Player) => PlayerData | undefined;
  private updatePlayerDataCallback?: (player: Player, data: PlayerData) => void;
  private getMoreCoinsMultiplierCallback?: GetMoreCoinsMultiplierCallback;

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
    
    // Combined multiplier: pickaxe * moreCoins
    const sellMultiplier = pickaxeMultiplier * moreCoinsMultiplier;

    // Calculate total value before clearing (with combined multiplier)
    let totalGold = this.inventoryManager.calculateTotalValue(player, sellMultiplier);
    
    // Round to nearest 5 with no decimals
    totalGold = Math.round(totalGold / 5) * 5;

    if (totalGold === 0) {
      return 0;
    }

    // Get all ore types in inventory
    const inventory = this.inventoryManager.getInventory(player);
    const oreTypes = Object.keys(inventory) as OreType[];

    // Calculate base value (without multiplier) for logging
    let baseValue = 0;
    for (const oreType of oreTypes) {
      const amount = inventory[oreType] || 0;
      const oreData = ORE_DATABASE[oreType as OreType];
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
    
    // Combined multiplier: pickaxe * moreCoins
    const sellMultiplier = pickaxeMultiplier * moreCoinsMultiplier;

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

    // Round to nearest 5 with no decimals
    totalGold = Math.round(totalGold / 5) * 5;

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
    
    // Combined multiplier: pickaxe * moreCoins
    const sellMultiplier = pickaxeMultiplier * moreCoinsMultiplier;

    const baseValue = sellAmount * oreData.value;
    let goldEarned = baseValue * sellMultiplier;
    
    // Round to nearest 5 with no decimals
    goldEarned = Math.round(goldEarned / 5) * 5;

    // Remove ore from inventory
    this.inventoryManager.removeOre(player, oreType, sellAmount);

    // Add gold to player
    playerData.gold = (playerData.gold || 0) + goldEarned;
    this.updatePlayerDataCallback?.(player, playerData);
    return goldEarned;
  }

  /**
   * Gets the sell value for all ores in inventory (without selling)
   * 
   * REBALANCED: Now applies pickaxe sell value multiplier
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
    
    // Combined multiplier: pickaxe * moreCoins
    const sellMultiplier = pickaxeMultiplier * moreCoinsMultiplier;

    let totalValue = this.inventoryManager.calculateTotalValue(player, sellMultiplier);
    // Round to nearest 5 with no decimals
    return Math.round(totalValue / 5) * 5;
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
    
    // Combined multiplier: pickaxe * moreCoins
    const sellMultiplier = pickaxeMultiplier * moreCoinsMultiplier;

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

    // Round to nearest 5 with no decimals
    return Math.round(total / 5) * 5;
  }
}

