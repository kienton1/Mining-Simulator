/**
 * Pickaxe Shop
 * 
 * Handles purchasing pickaxes with gold.
 * 
 * Reference: Planning/inventoryAndSellingSystem.md section 3
 */

import { Player } from 'hytopia';
import { getPickaxeByTier, PICKAXE_DATABASE } from '../Pickaxe/PickaxeDatabase';
import type { PlayerData } from '../Core/PlayerData';
import { PickaxeManager } from '../Pickaxe/PickaxeManager';

/**
 * Result of a pickaxe purchase attempt
 */
export interface PickaxePurchaseResult {
  success: boolean;
  message: string;
  newTier?: number;
  goldSpent?: number;
}

/**
 * Pickaxe Shop class
 * Handles purchasing pickaxes
 */
export class PickaxeShop {
  private pickaxeManager: PickaxeManager;
  private getPlayerDataCallback?: (player: Player) => PlayerData | undefined;
  private updatePlayerDataCallback?: (player: Player, data: PlayerData) => void;

  /**
   * Creates a new PickaxeShop instance
   * 
   * @param pickaxeManager - Pickaxe manager instance
   */
  constructor(pickaxeManager: PickaxeManager) {
    this.pickaxeManager = pickaxeManager;
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
   * Attempts to purchase a pickaxe
   * Enforces tier progression: players can only buy the next tier (currentTier + 1)
   * 
   * @param player - Player attempting to purchase
   * @param tier - Tier of pickaxe to purchase
   * @returns Purchase result with success status and message
   */
  buyPickaxe(player: Player, tier: number): PickaxePurchaseResult {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return {
        success: false,
        message: 'Player data not found',
      };
    }

    // Validate tier
    if (tier < 0 || tier >= PICKAXE_DATABASE.length) {
      return {
        success: false,
        message: `Invalid pickaxe tier: ${tier}`,
      };
    }

    // Get pickaxe data
    const pickaxe = getPickaxeByTier(tier);
    if (!pickaxe) {
      return {
        success: false,
        message: `Pickaxe tier ${tier} not found`,
      };
    }

    // Check if player already has this tier or higher
    if (playerData.currentPickaxeTier >= tier) {
      return {
        success: false,
        message: `You already have a pickaxe of tier ${playerData.currentPickaxeTier} or higher`,
      };
    }

    // ENFORCE TIER PROGRESSION: Can only buy the next tier based on OWNERSHIP (not what's equipped)
    let ownedPickaxes = playerData.ownedPickaxes;
    if (!ownedPickaxes || ownedPickaxes.length === 0) {
      ownedPickaxes = [0];
    } else if (!ownedPickaxes.includes(0)) {
      ownedPickaxes = [0, ...ownedPickaxes];
    }

    const currentEquippedTier = playerData.currentPickaxeTier ?? 0;
    const highestOwnedTier = ownedPickaxes.length > 0 ? Math.max(...ownedPickaxes) : 0;
    const effectiveTier = Math.max(currentEquippedTier, highestOwnedTier);
    const nextTier = effectiveTier + 1;
    if (tier !== nextTier) {
      return {
        success: false,
        message: `You can only purchase the next tier pickaxe (Tier ${nextTier}). You cannot skip tiers.`,
      };
    }

    // Check if player has enough gold
    const currentGold = playerData.gold || 0;
    if (currentGold < pickaxe.cost) {
      return {
        success: false,
        message: `Insufficient gold. Need ${pickaxe.cost}, have ${currentGold}`,
      };
    }

    // Purchase pickaxe
    playerData.currentPickaxeTier = tier;
    playerData.gold = currentGold - pickaxe.cost;
    
    // Add to owned pickaxes list
    if (!playerData.ownedPickaxes) {
      playerData.ownedPickaxes = [0]; // Initialize with tier 0 if not set
    }
    if (!playerData.ownedPickaxes.includes(tier)) {
      playerData.ownedPickaxes.push(tier);
      playerData.ownedPickaxes.sort((a, b) => a - b); // Keep sorted
    }

    // Update player data
    this.updatePlayerDataCallback?.(player, playerData);

    // Update pickaxe visual
    this.pickaxeManager.attachPickaxeToPlayer(player, tier);

    return {
      success: true,
      message: `Purchased ${pickaxe.name} pickaxe!`,
      newTier: tier,
      goldSpent: pickaxe.cost,
    };
  }

  /**
   * Gets shop data for UI display
   * Returns all pickaxes with availability status
   * 
   * REBALANCED: Updated to reflect new pickaxe stats (no damage or power bonus)
   * Now supports equipping any owned pickaxe, not just the highest tier
   * 
   * @param player - Player to get shop data for
   * @returns Shop data with pickaxes and availability
   */
  getShopData(player: Player): {
    currentTier: number;
    playerGold: number;
    pickaxes: Array<{
      tier: number;
      name: string;
      miningSpeed: number;
      luckBonus: number;
      sellValueMultiplier: number;
      cost: number;
      imageUri?: string;
      availability: 'equipped' | 'owned' | 'available' | 'locked';
      purchasable: boolean;
    }>;
  } {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return {
        currentTier: 0,
        playerGold: 0,
        pickaxes: [],
      };
    }

    const equippedTier = playerData.currentPickaxeTier ?? 0;
    const playerGold = playerData.gold || 0;

    // Owned pickaxes drive progression (not what is currently equipped)
    let ownedPickaxes = playerData.ownedPickaxes;
    if (!ownedPickaxes || ownedPickaxes.length === 0) {
      ownedPickaxes = [0]; // Default to tier 0 if not set
    } else if (!ownedPickaxes.includes(0)) {
      ownedPickaxes = [0, ...ownedPickaxes];
    }

    const highestOwnedTier = ownedPickaxes.length > 0 ? Math.max(...ownedPickaxes) : 0;
    const effectiveTier = Math.max(equippedTier, highestOwnedTier);
    const nextTier = effectiveTier + 1;

    const pickaxes = PICKAXE_DATABASE.map(pickaxe => {
      let availability: 'equipped' | 'owned' | 'available' | 'locked' = 'locked';
      let purchasable = false;

      if (pickaxe.tier === equippedTier) {
        availability = 'equipped';
      } else if (ownedPickaxes.includes(pickaxe.tier)) {
        // Player owns this pickaxe but it's not equipped
        availability = 'owned';
      } else if (pickaxe.tier === nextTier) {
        // Next tier - always available, but purchasable based on affordability
        availability = 'available';
        purchasable = playerGold >= pickaxe.cost;
      } else {
        // Too far ahead
        availability = 'locked';
      }

      return {
        tier: pickaxe.tier,
        name: pickaxe.name,
        miningSpeed: pickaxe.miningSpeed,
        luckBonus: pickaxe.luckBonus,
        sellValueMultiplier: pickaxe.sellValueMultiplier,
        cost: pickaxe.cost,
        imageUri: `ui/pickaxes/tier-${pickaxe.tier}.png`,
        availability,
        purchasable,
      };
    });

    return {
      currentTier: equippedTier,
      playerGold,
      pickaxes,
    };
  }

  /**
   * Equips a pickaxe that the player already owns
   * 
   * @param player - Player attempting to equip
   * @param tier - Tier of pickaxe to equip
   * @returns Equip result with success status and message
   */
  equipPickaxe(player: Player, tier: number): { success: boolean; message: string } {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return {
        success: false,
        message: 'Player data not found',
      };
    }

    // Validate tier
    if (tier < 0 || tier >= PICKAXE_DATABASE.length) {
      return {
        success: false,
        message: `Invalid pickaxe tier: ${tier}`,
      };
    }

    // Check if player owns this pickaxe
    const ownedPickaxes = playerData.ownedPickaxes || [0];
    if (!ownedPickaxes.includes(tier)) {
      return {
        success: false,
        message: `You do not own this pickaxe. Purchase it first.`,
      };
    }

    // Check if already equipped
    if (playerData.currentPickaxeTier === tier) {
      return {
        success: false,
        message: `This pickaxe is already equipped.`,
      };
    }

    // Equip the pickaxe
    playerData.currentPickaxeTier = tier;

    // Update player data
    this.updatePlayerDataCallback?.(player, playerData);

    // Update pickaxe visual
    this.pickaxeManager.attachPickaxeToPlayer(player, tier);

    const pickaxe = getPickaxeByTier(tier);

    return {
      success: true,
      message: `Equipped ${pickaxe?.name} pickaxe!`,
    };
  }

  /**
   * Gets the next available pickaxe tier for purchase
   * 
   * @param player - Player to check
   * @returns Next tier, or null if max tier reached
   */
  getNextAvailableTier(player: Player): number | null {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return null;
    }

    // Next tier is based on highest owned tier (not what is equipped)
    let ownedPickaxes = playerData.ownedPickaxes;
    if (!ownedPickaxes || ownedPickaxes.length === 0) {
      ownedPickaxes = [0];
    } else if (!ownedPickaxes.includes(0)) {
      ownedPickaxes = [0, ...ownedPickaxes];
    }

    const currentEquippedTier = playerData.currentPickaxeTier ?? 0;
    const highestOwnedTier = ownedPickaxes.length > 0 ? Math.max(...ownedPickaxes) : 0;
    const effectiveTier = Math.max(currentEquippedTier, highestOwnedTier);

    const nextTier = effectiveTier + 1;
    if (nextTier >= PICKAXE_DATABASE.length) {
      return null; // Max tier reached
    }

    return nextTier;
  }

  /**
   * Gets all available pickaxes for purchase (tiers higher than current)
   * 
   * @param player - Player to check
   * @returns Array of available pickaxe tiers
   */
  getAvailablePickaxes(player: Player): number[] {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return [];
    }

    const available: number[] = [];
    // Available tiers are based on highest owned tier (not what is equipped)
    let ownedPickaxes = playerData.ownedPickaxes;
    if (!ownedPickaxes || ownedPickaxes.length === 0) {
      ownedPickaxes = [0];
    } else if (!ownedPickaxes.includes(0)) {
      ownedPickaxes = [0, ...ownedPickaxes];
    }

    const currentEquippedTier = playerData.currentPickaxeTier ?? 0;
    const highestOwnedTier = ownedPickaxes.length > 0 ? Math.max(...ownedPickaxes) : 0;
    const effectiveTier = Math.max(currentEquippedTier, highestOwnedTier);

    for (let tier = effectiveTier + 1; tier < PICKAXE_DATABASE.length; tier++) {
      available.push(tier);
    }

    return available;
  }

  /**
   * Gets all affordable pickaxes (tiers higher than current that player can afford)
   * 
   * @param player - Player to check
   * @returns Array of affordable pickaxe tiers
   */
  getAffordablePickaxes(player: Player): number[] {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return [];
    }

    const affordable: number[] = [];
    const currentGold = playerData.gold || 0;
    const availableTiers = this.getAvailablePickaxes(player);

    for (const tier of availableTiers) {
      const pickaxe = getPickaxeByTier(tier);
      if (pickaxe && currentGold >= pickaxe.cost) {
        affordable.push(tier);
      }
    }

    return affordable;
  }

  /**
   * Checks if player can afford a specific pickaxe tier
   * 
   * @param player - Player to check
   * @param tier - Tier to check
   * @returns True if player can afford, false otherwise
   */
  canAffordPickaxe(player: Player, tier: number): boolean {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return false;
    }

    const pickaxe = getPickaxeByTier(tier);
    if (!pickaxe) {
      return false;
    }

    const currentGold = playerData.gold || 0;
    return currentGold >= pickaxe.cost;
  }
}
