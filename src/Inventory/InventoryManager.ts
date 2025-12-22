/**
 * Inventory Manager
 * 
 * Manages player inventory operations (add, remove, get count, calculate value).
 * 
 * Reference: Planning/inventoryAndSellingSystem.md section 1
 */

import { Player } from 'hytopia';
import { OreType, ORE_DATABASE } from '../Mining/Ore/OreData';
import type { InventoryData, PlayerData } from '../Core/PlayerData';

/**
 * Inventory Manager class
 * Handles all inventory operations for players
 */
export class InventoryManager {
  /**
   * Gets the player data callback function
   * This should be set by GameManager to access player data
   */
  private getPlayerDataCallback?: (player: Player) => PlayerData | undefined;
  private updatePlayerDataCallback?: (player: Player, data: PlayerData) => void;

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
   * Adds ore to player's inventory
   * 
   * @param player - Player to add ore to
   * @param oreType - Type of ore to add
   * @param amount - Amount to add (default: 1)
   * @returns True if successful, false otherwise
   */
  addOre(player: Player, oreType: OreType, amount: number = 1): boolean {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      console.warn('[InventoryManager] Player data not found');
      return false;
    }

    if (amount <= 0) {
      console.warn('[InventoryManager] Invalid amount to add:', amount);
      return false;
    }

    // Initialize inventory if it doesn't exist
    if (!playerData.inventory) {
      playerData.inventory = {};
    }

    // Add ore to inventory
    const currentAmount = playerData.inventory[oreType] || 0;
    playerData.inventory[oreType] = currentAmount + amount;

    // Update player data
    this.updatePlayerDataCallback?.(player, playerData);

    console.log(`[InventoryManager] Added ${amount} ${oreType} to ${player.username}'s inventory (total: ${playerData.inventory[oreType]})`);
    return true;
  }

  /**
   * Removes ore from player's inventory
   * 
   * @param player - Player to remove ore from
   * @param oreType - Type of ore to remove
   * @param amount - Amount to remove (default: all)
   * @returns True if successful, false if insufficient ore
   */
  removeOre(player: Player, oreType: OreType, amount?: number): boolean {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData || !playerData.inventory) {
      console.warn('[InventoryManager] Player data or inventory not found');
      return false;
    }

    const currentAmount = playerData.inventory[oreType] || 0;

    // If no amount specified, remove all
    if (amount === undefined) {
      delete playerData.inventory[oreType];
      this.updatePlayerDataCallback?.(player, playerData);
      console.log(`[InventoryManager] Removed all ${oreType} from ${player.username}'s inventory`);
      return true;
    }

    if (amount <= 0) {
      console.warn('[InventoryManager] Invalid amount to remove:', amount);
      return false;
    }

    if (currentAmount < amount) {
      console.warn(`[InventoryManager] Insufficient ${oreType} in inventory (have: ${currentAmount}, need: ${amount})`);
      return false;
    }

    // Remove ore from inventory
    const newAmount = currentAmount - amount;
    if (newAmount === 0) {
      delete playerData.inventory[oreType];
    } else {
      playerData.inventory[oreType] = newAmount;
    }

    // Update player data
    this.updatePlayerDataCallback?.(player, playerData);

    console.log(`[InventoryManager] Removed ${amount} ${oreType} from ${player.username}'s inventory (remaining: ${newAmount})`);
    return true;
  }

  /**
   * Gets the quantity of a specific ore type in player's inventory
   * 
   * @param player - Player to check
   * @param oreType - Type of ore to check
   * @returns Quantity of ore, or 0 if not found
   */
  getOreCount(player: Player, oreType: OreType): number {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData || !playerData.inventory) {
      return 0;
    }

    return playerData.inventory[oreType] || 0;
  }

  /**
   * Gets the entire inventory for a player
   * 
   * @param player - Player to get inventory for
   * @returns Inventory data, or empty object if not found
   */
  getInventory(player: Player): InventoryData {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData || !playerData.inventory) {
      return {};
    }

    return { ...playerData.inventory }; // Return copy to prevent direct mutation
  }

  /**
   * Calculates the total gold value of all ores in player's inventory
   * 
   * REBALANCED: Now applies pickaxe sell value multiplier
   * 
   * @param player - Player to calculate value for
   * @param sellValueMultiplier - Pickaxe sell value multiplier (default: 1.0)
   * @returns Total gold value
   */
  calculateTotalValue(player: Player, sellValueMultiplier: number = 1.0): number {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData || !playerData.inventory) {
      return 0;
    }

    let total = 0;
    for (const [oreType, amount] of Object.entries(playerData.inventory)) {
      const oreData = ORE_DATABASE[oreType as OreType];
      if (oreData && amount) {
        total += amount * oreData.value * sellValueMultiplier;
      }
    }

    return total;
  }

  /**
   * Gets the value of a specific ore type
   * 
   * @param oreType - Type of ore
   * @returns Gold value per unit, or 0 if not found
   */
  getOreValue(oreType: OreType): number {
    const oreData = ORE_DATABASE[oreType];
    return oreData ? oreData.value : 0;
  }

  /**
   * Checks if player has any ores in inventory
   * 
   * @param player - Player to check
   * @returns True if inventory has at least one ore, false otherwise
   */
  hasAnyOres(player: Player): boolean {
    const inventory = this.getInventory(player);
    return Object.keys(inventory).length > 0;
  }

  /**
   * Clears all ores from player's inventory
   * 
   * @param player - Player to clear inventory for
   */
  clearInventory(player: Player): void {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      console.warn('[InventoryManager] Player data not found');
      return;
    }

    playerData.inventory = {};
    this.updatePlayerDataCallback?.(player, playerData);

    console.log(`[InventoryManager] Cleared inventory for ${player.username}`);
  }
}

