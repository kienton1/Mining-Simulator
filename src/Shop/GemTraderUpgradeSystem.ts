/**
 * Gem Trader Upgrade System
 * 
 * Handles gem-based upgrades for players.
 * Manages upgrade levels, costs, and effects.
 * 
 * Reference: Planning/GemsSystemPlan.md section 2.1
 */

import { Player } from 'hytopia';
import type { PlayerData } from '../Core/PlayerData';

/**
 * Upgrade type enum
 */
export enum UpgradeType {
  MORE_GEMS = 'moreGems',
  MORE_REBIRTHS = 'moreRebirths',
  MORE_COINS = 'moreCoins',
  MORE_DAMAGE = 'moreDamage',
}

/**
 * Gem Trader Upgrade System class
 * Handles upgrade purchases and cost calculations
 */
export class GemTraderUpgradeSystem {
  private getPlayerDataCallback?: (player: Player) => PlayerData | undefined;
  private updatePlayerDataCallback?: (player: Player, data: PlayerData) => void;

  /**
   * Creates a new GemTraderUpgradeSystem instance
   */
  constructor() {
    // System initialized without dependencies
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
   * Calculates the cost for "More Gems" upgrade
   * Formula: y = 42.53732814 * e^(0.1985808056 * x) - 50.88152767
   * 
   * @param currentLevel - Current upgrade level
   * @returns Cost in gems (rounded to nearest integer, minimum 0)
   */
  calculateMoreGemsCost(currentLevel: number): number {
    const e = Math.E; // Euler's number
    const x = currentLevel;
    const cost = 42.53732814 * Math.pow(e, 0.1985808056 * x) - 50.88152767;
    return Math.max(0, Math.round(cost));
  }

  /**
   * Calculates the cost for "More Rebirths" upgrade
   * Formula: y = 177.8192150860 * e^(0.1936304553 * x) - 205.8098819448
   * 
   * @param currentLevel - Current upgrade level
   * @returns Cost in gems (rounded to nearest integer, minimum 0)
   */
  calculateMoreRebirthsCost(currentLevel: number): number {
    const e = Math.E; // Euler's number
    const x = currentLevel;
    const cost = 177.8192150860 * Math.pow(e, 0.1936304553 * x) - 205.8098819448;
    return Math.max(0, Math.round(cost));
  }

  /**
   * Calculates the cost for "More Coins" upgrade
   * Formula: y(x) = 47.83460235 * x^(1.395013237) * e^(0.375345887 * x)
   * 
   * Note: x represents the percentage increment (0.1, 0.2, 0.3, ...) not the level number
   * Level 0 = 0% = x = 0.0
   * Level 1 = 10% = x = 0.1
   * Level 2 = 20% = x = 0.2
   * 
   * @param currentLevel - Current upgrade level (0, 1, 2, ...)
   * @returns Cost in gems (rounded to nearest integer, minimum 0)
   */
  calculateMoreCoinsCost(currentLevel: number): number {
    const e = Math.E; // Euler's number
    // Convert level to percentage increment: level 0 = 0.0, level 1 = 0.1, level 2 = 0.2, etc.
    const x = currentLevel * 0.1;
    // Handle x=0 case: x^1.395013237 = 0, so cost will be 0 (which is correct)
    const powerTerm = x > 0 ? Math.pow(x, 1.395013237) : 0;
    const expTerm = Math.pow(e, 0.375345887 * x);
    const cost = 47.83460235 * powerTerm * expTerm;
    return Math.max(0, Math.round(cost));
  }

  /**
   * Calculates the cost for "More Damage" upgrade
   * Formula: y = 82.727459 * e^(1.515705435 * x) - 95.266667
   * 
   * Note: x represents the percentage increment (0.1, 0.2, 0.3, ...) not the level number
   * Level 0 = 0% = x = 0.0
   * Level 1 = 10% = x = 0.1
   * Level 2 = 20% = x = 0.2
   * 
   * @param currentLevel - Current upgrade level (0, 1, 2, ...)
   * @returns Cost in gems (rounded to nearest integer, minimum 0)
   */
  calculateMoreDamageCost(currentLevel: number): number {
    const e = Math.E; // Euler's number
    // Convert level to percentage increment: level 0 = 0.0, level 1 = 0.1, level 2 = 0.2, etc.
    const x = currentLevel * 0.1;
    const cost = 82.727459 * Math.pow(e, 1.515705435 * x) - 95.266667;
    return Math.max(0, Math.round(cost));
  }

  /**
   * Gets the cost for a specific upgrade type and level
   * 
   * @param upgradeType - Type of upgrade
   * @param currentLevel - Current upgrade level
   * @returns Cost in gems
   */
  getUpgradeCost(upgradeType: UpgradeType, currentLevel: number): number {
    switch (upgradeType) {
      case UpgradeType.MORE_GEMS:
        return this.calculateMoreGemsCost(currentLevel);
      case UpgradeType.MORE_REBIRTHS:
        return this.calculateMoreRebirthsCost(currentLevel);
      case UpgradeType.MORE_COINS:
        return this.calculateMoreCoinsCost(currentLevel);
      case UpgradeType.MORE_DAMAGE:
        return this.calculateMoreDamageCost(currentLevel);
      default:
        return 0;
    }
  }

  /**
   * Gets the current level of an upgrade for a player
   * 
   * @param player - Player to get upgrade level for
   * @param upgradeType - Type of upgrade
   * @returns Current upgrade level (0 if not set)
   */
  getUpgradeLevel(player: Player, upgradeType: UpgradeType): number {
    if (!this.getPlayerDataCallback) {
      return 0;
    }

    const data = this.getPlayerDataCallback(player);
    if (!data) return 0;

    switch (upgradeType) {
      case UpgradeType.MORE_GEMS:
        return data.moreGemsLevel || 0;
      case UpgradeType.MORE_REBIRTHS:
        return data.moreRebirthsLevel || 0;
      case UpgradeType.MORE_COINS:
        return data.moreCoinsLevel || 0;
      case UpgradeType.MORE_DAMAGE:
        return data.moreDamageLevel || 0;
      default:
        return 0;
    }
  }

  /**
   * Purchases an upgrade for a player
   * 
   * @param player - Player purchasing the upgrade
   * @param upgradeType - Type of upgrade to purchase
   * @returns Object with success status and message, or error information
   */
  purchaseUpgrade(player: Player, upgradeType: UpgradeType): {
    success: boolean;
    message?: string;
    error?: string;
    newLevel?: number;
    cost?: number;
    remainingGems?: number;
  } {
    if (!this.getPlayerDataCallback || !this.updatePlayerDataCallback) {
      return {
        success: false,
        error: 'System not properly initialized',
      };
    }

    const data = this.getPlayerDataCallback(player);
    if (!data) {
      return {
        success: false,
        error: 'Player data not found',
      };
    }

    // Get current level
    const currentLevel = this.getUpgradeLevel(player, upgradeType);
    const cost = this.getUpgradeCost(upgradeType, currentLevel);

    // Check if player has enough gems
    if (data.gems < cost) {
      return {
        success: false,
        error: 'Insufficient gems',
        cost,
        remainingGems: data.gems,
      };
    }

    // Deduct gems and increment level
    data.gems -= cost;
    const newLevel = currentLevel + 1;

    // Update the appropriate upgrade level
    switch (upgradeType) {
      case UpgradeType.MORE_GEMS:
        data.moreGemsLevel = newLevel;
        break;
      case UpgradeType.MORE_REBIRTHS:
        data.moreRebirthsLevel = newLevel;
        break;
      case UpgradeType.MORE_COINS:
        data.moreCoinsLevel = newLevel;
        break;
      case UpgradeType.MORE_DAMAGE:
        data.moreDamageLevel = newLevel;
        break;
    }

    // Save updated data
    this.updatePlayerDataCallback(player, data);
    return {
      success: true,
      message: `Upgrade purchased successfully`,
      newLevel,
      cost,
      remainingGems: data.gems,
    };
  }

  /**
   * Gets the More Coins sell multiplier for a player
   * Formula: multiplier = 1.0 + (moreCoinsLevel * 0.1)
   * Each level adds 10% (0.1) to the multiplier
   * 
   * @param player - Player to get multiplier for
   * @returns Sell multiplier (1.0 = 100%, 1.1 = 110%, etc.)
   */
  getMoreCoinsMultiplier(player: Player): number {
    if (!this.getPlayerDataCallback) {
      return 1.0; // Default multiplier
    }

    const data = this.getPlayerDataCallback(player);
    if (!data) {
      return 1.0; // Default multiplier
    }

    const moreCoinsLevel = data.moreCoinsLevel || 0;
    return 1.0 + (moreCoinsLevel * 0.1);
  }

  /**
   * Gets the More Damage multiplier for a player
   * Formula: multiplier = 1.0 + (moreDamageLevel * 0.1)
   * Each level adds 10% (0.1) to the damage multiplier
   * 
   * @param player - Player to get multiplier for
   * @returns Damage multiplier (1.0 = 100%, 1.1 = 110%, etc.)
   */
  getMoreDamageMultiplier(player: Player): number {
    if (!this.getPlayerDataCallback) {
      return 1.0; // Default multiplier
    }

    const data = this.getPlayerDataCallback(player);
    if (!data) {
      return 1.0; // Default multiplier
    }

    const moreDamageLevel = data.moreDamageLevel || 0;
    return 1.0 + (moreDamageLevel * 0.1);
  }

  /**
   * Gets the More Gems multiplier for a player
   * Formula: multiplier = moreGemsLevel + 1
   * Backend multiplier is always 1 ahead of display (UI shows 0x but backend is at 1x)
   * Level 0 = 1x multiplier, Level 1 = 2x multiplier, Level 2 = 3x multiplier, etc.
   * 
   * @param player - Player to get multiplier for
   * @returns Gem multiplier (1.0 = 1x, 2.0 = 2x, etc.)
   */
  getMoreGemsMultiplier(player: Player): number {
    if (!this.getPlayerDataCallback) {
      return 1.0; // Default multiplier (level 0 = 1x)
    }

    const data = this.getPlayerDataCallback(player);
    if (!data) {
      return 1.0; // Default multiplier (level 0 = 1x)
    }

    const moreGemsLevel = data.moreGemsLevel || 0;
    // Backend multiplier is always 1 ahead: level 0 = 1x, level 1 = 2x, etc.
    return moreGemsLevel + 1;
  }

  /**
   * Gets upgrade information for a player (level, cost, etc.)
   * 
   * @param player - Player to get upgrade info for
   * @param upgradeType - Type of upgrade
   * @returns Upgrade information object
   */
  getUpgradeInfo(player: Player, upgradeType: UpgradeType): {
    currentLevel: number;
    nextLevelCost: number;
    canAfford: boolean;
  } {
    if (!this.getPlayerDataCallback) {
      return {
        currentLevel: 0,
        nextLevelCost: 0,
        canAfford: false,
      };
    }

    const data = this.getPlayerDataCallback(player);
    if (!data) {
      return {
        currentLevel: 0,
        nextLevelCost: 0,
        canAfford: false,
      };
    }

    const currentLevel = this.getUpgradeLevel(player, upgradeType);
    const nextLevelCost = this.getUpgradeCost(upgradeType, currentLevel);
    const canAfford = (data.gems || 0) >= nextLevelCost;

    return {
      currentLevel,
      nextLevelCost,
      canAfford,
    };
  }

  /**
   * Gets available rebirth package sizes based on More Rebirths upgrade level
   * Each upgrade level unlocks additional package sizes
   * 
   * @param player - Player to get packages for
   * @returns Array of available rebirth package sizes
   */
  getAvailableRebirthPackages(player: Player): number[] {
    const moreRebirthsLevel = this.getUpgradeLevel(player, UpgradeType.MORE_REBIRTHS);
    
    // Base packages (always available): 1, 5, 20
    const basePackages = [1, 5, 20];
    
    // Additional packages unlocked by upgrade level
    const additionalPackages: number[] = [];
    
    // Level thresholds and their unlocked packages
    const packageUnlocks: Array<{ level: number; packages: number[] }> = [
      { level: 1, packages: [50, 100] },
      { level: 2, packages: [250, 500] },
      { level: 3, packages: [1000] },
      { level: 4, packages: [2500, 5000] },
      { level: 5, packages: [10000, 25000] },
      { level: 6, packages: [50000, 100000] },
      { level: 7, packages: [250000, 500000] },
      { level: 8, packages: [1000000] },
      { level: 9, packages: [2500000, 10000000] },
      { level: 10, packages: [25000000, 100000000] },
      { level: 11, packages: [1000000000] },
      { level: 12, packages: [50000000000] },
    ];
    
    // Add packages based on upgrade level
    for (const unlock of packageUnlocks) {
      if (moreRebirthsLevel >= unlock.level) {
        additionalPackages.push(...unlock.packages);
      } else {
        break; // Stop when we hit a level we haven't reached
      }
    }
    
    // Combine and return sorted packages
    return [...basePackages, ...additionalPackages].sort((a, b) => a - b);
  }
}

