/**
 * Miner Shop
 * 
 * Handles purchasing and equipping miners with coins.
 * 
 * Reference: Planning/MinerSystemPlan.md
 */

import { Player } from 'hytopia';
import { getMinerByTier, MINER_DATABASE } from '../Miner/MinerDatabase';
import type { PlayerData } from '../Core/PlayerData';

/**
 * Result of a miner purchase attempt
 */
export interface MinerPurchaseResult {
  success: boolean;
  message: string;
  newTier?: number;
  goldSpent?: number;
}

/**
 * Result of a miner equip attempt
 */
export interface MinerEquipResult {
  success: boolean;
  message: string;
  tier?: number;
}

/**
 * Miner Shop class
 * Handles purchasing and equipping miners
 */
export class MinerShop {
  private getPlayerDataCallback?: (player: Player) => PlayerData | undefined;
  private updatePlayerDataCallback?: (player: Player, data: PlayerData) => void;

  /**
   * Creates a new MinerShop instance
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
   * Attempts to purchase a miner
   * Enforces tier progression: players can only buy the next tier (currentTier + 1)
   * For new players (currentTier = -1), they can buy tier 0
   * 
   * @param player - Player attempting to purchase
   * @param tier - Tier of miner to purchase
   * @returns Purchase result with success status and message
   */
  buyMiner(player: Player, tier: number): MinerPurchaseResult {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return {
        success: false,
        message: 'Player data not found',
      };
    }

    // Validate tier
    if (tier < 0 || tier >= MINER_DATABASE.length) {
      return {
        success: false,
        message: `Invalid miner tier: ${tier}`,
      };
    }

    // Get miner data
    const miner = getMinerByTier(tier);
    if (!miner) {
      return {
        success: false,
        message: `Miner tier ${tier} not found`,
      };
    }

    // Check if player already owns this miner
    const ownedMiners = playerData.ownedMiners || [];
    if (ownedMiners.includes(tier)) {
      return {
        success: false,
        message: `You already own ${miner.name}`,
      };
    }

    // ENFORCE TIER PROGRESSION: Can only buy next tier
    // If currentTier is -1 (no miner), next tier is 0
    // Otherwise, next tier is currentTier + 1
    const currentTier = playerData.currentMinerTier ?? -1;
    const highestOwnedTier = ownedMiners.length > 0 ? Math.max(...ownedMiners) : -1;
    const effectiveTier = Math.max(currentTier, highestOwnedTier);
    const nextTier = effectiveTier + 1;
    
    if (tier !== nextTier) {
      return {
        success: false,
        message: `You can only purchase the next tier miner (Tier ${nextTier}). You cannot skip tiers.`,
      };
    }

    // Check if player has enough gold
    const currentGold = playerData.gold || 0;
    if (currentGold < miner.cost) {
      return {
        success: false,
        message: `Insufficient gold. Need ${miner.cost.toLocaleString()}, have ${currentGold.toLocaleString()}`,
      };
    }

    // Purchase miner
    playerData.gold = currentGold - miner.cost;
    
    // Add to owned miners list
    if (!playerData.ownedMiners) {
      playerData.ownedMiners = [];
    }
    playerData.ownedMiners.push(tier);
    playerData.ownedMiners.sort((a, b) => a - b); // Keep sorted

    // Update player data
    this.updatePlayerDataCallback?.(player, playerData);

    return {
      success: true,
      message: `Purchased ${miner.name}!`,
      newTier: tier,
      goldSpent: miner.cost,
    };
  }

  /**
   * Attempts to equip a miner
   * Player must own the miner to equip it
   * 
   * @param player - Player attempting to equip
   * @param tier - Tier of miner to equip
   * @returns Equip result with success status and message
   */
  equipMiner(player: Player, tier: number): MinerEquipResult {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return {
        success: false,
        message: 'Player data not found',
      };
    }

    // Validate tier (-1 is allowed for unequipping)
    if (tier < -1 || tier >= MINER_DATABASE.length) {
      return {
        success: false,
        message: `Invalid miner tier: ${tier}`,
      };
    }

    // Check if trying to unequip
    if (tier === -1) {
      playerData.currentMinerTier = -1;
      this.updatePlayerDataCallback?.(player, playerData);
      return {
        success: true,
        message: 'Miner unequipped',
        tier: -1,
      };
    }

    // Get miner data
    const miner = getMinerByTier(tier);
    if (!miner) {
      return {
        success: false,
        message: `Miner tier ${tier} not found`,
      };
    }

    // Check if player owns this miner
    const ownedMiners = playerData.ownedMiners || [];
    if (!ownedMiners.includes(tier)) {
      return {
        success: false,
        message: `You must purchase ${miner.name} before equipping it`,
      };
    }

    // Equip miner
    playerData.currentMinerTier = tier;

    // Update player data
    this.updatePlayerDataCallback?.(player, playerData);

    return {
      success: true,
      message: `Equipped ${miner.name}!`,
      tier: tier,
    };
  }

  /**
   * Gets shop data for UI display
   * Returns all miners with availability status
   * Enforces tier progression: only next tier is available for purchase
   * 
   * @param player - Player requesting shop data
   * @returns Shop data with all miners and their status
   */
  getShopData(player: Player): {
    miners: Array<{
      tier: number;
      name: string;
      cost: number;
      coinBonus: number;
      oreLuckBonus: number;
      damageBonus: number;
      rarity: string;
      imageUri?: string;
      availability: 'owned' | 'equipped' | 'available' | 'locked';
      purchasable: boolean;
    }>;
    currentTier: number;
    gold: number;
  } {
    const playerData = this.getPlayerDataCallback?.(player);
    const currentGold = playerData?.gold || 0;
    const currentTier = playerData?.currentMinerTier ?? -1;
    const ownedMiners = playerData?.ownedMiners || [];
    
    // Calculate the highest owned tier (for determining next tier)
    const highestOwnedTier = ownedMiners.length > 0 ? Math.max(...ownedMiners) : -1;
    const effectiveTier = Math.max(currentTier, highestOwnedTier);
    const nextTier = effectiveTier + 1;

    const miners = MINER_DATABASE.map(miner => {
      const isOwned = ownedMiners.includes(miner.tier);
      const isEquipped = currentTier === miner.tier;
      const isNextTier = miner.tier === nextTier;
      const canAfford = currentGold >= miner.cost;

      let availability: 'owned' | 'equipped' | 'available' | 'locked' = 'locked';
      let purchasable = false;

      if (isEquipped) {
        availability = 'equipped';
      } else if (isOwned) {
        availability = 'owned';
      } else if (isNextTier) {
        // Next tier - always available, but purchasable based on affordability
        availability = 'available';
        purchasable = canAfford;
      } else {
        // Too far ahead
        availability = 'locked';
      }

      return {
        tier: miner.tier,
        name: miner.name,
        cost: miner.cost,
        coinBonus: miner.coinBonus,
        oreLuckBonus: miner.oreLuckBonus,
        damageBonus: miner.damageBonus,
        rarity: miner.rarity,
        imageUri: `ui/miners/tier-${miner.tier}.png`,
        availability,
        purchasable,
      };
    });

    return {
      miners,
      currentTier,
      gold: currentGold,
    };
  }

  /**
   * Gets the currently equipped miner for a player
   * 
   * @param player - Player to get miner for
   * @returns Miner data or null if none equipped
   */
  getEquippedMiner(player: Player): { tier: number; name: string; coinBonus: number; oreLuckBonus: number; damageBonus: number } | null {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return null;
    }

    const currentTier = playerData.currentMinerTier ?? -1;
    if (currentTier === -1) {
      return null;
    }

    const miner = getMinerByTier(currentTier);
    if (!miner) {
      return null;
    }

    return {
      tier: miner.tier,
      name: miner.name,
      coinBonus: miner.coinBonus,
      oreLuckBonus: miner.oreLuckBonus,
      damageBonus: miner.damageBonus,
    };
  }
}

