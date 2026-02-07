/**
 * Pickaxe Data
 * 
 * Defines pickaxe properties and data structures.
 * 
 * Reference: Planning/gameOverview.txt section 5
 */

/**
 * Pickaxe data structure
 * Contains all stats for a pickaxe tier
 * 
 * REBALANCED: Pickaxes now only affect:
 * - Mining speed (how fast you mine)
 * - Luck (ore rarity chances)
 * - Sell value multiplier (how much money you get per ore)
 * 
 * Removed: Damage and power bonus (damage now comes from Power only)
 */
export interface PickaxeData {
  /** Tier number (0 = Rusty, 1 = Stone, etc.) */
  tier: number;
  
  /** Display name */
  name: string;
  
  /** Mining speed (Speed stat used to derive swings per second) */
  miningSpeed: number;
  
  /** Luck bonus percentage (0.0 to 1.0, e.g., 0.20 = 20%) */
  luckBonus: number;
  
  /** Sell value multiplier (1.0 = base value, 2.0 = double value, etc.) */
  sellValueMultiplier: number;
  
  /** Cost to purchase this pickaxe */
  cost: number;
}

