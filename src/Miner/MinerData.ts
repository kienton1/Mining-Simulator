/**
 * Miner Data
 * 
 * Defines miner properties and data structures.
 * 
 * Reference: Planning/MinerSystemPlan.md
 */

/**
 * Miner data structure
 * Contains all stats for a miner tier
 */
export interface MinerData {
  /** Tier number (0-23, unique identifier) */
  tier: number;
  
  /** Display name */
  name: string;
  
  /** Coin bonus percentage (e.g., 15 = +15%) */
  coinBonus: number;
  
  /** Ore luck bonus percentage (e.g., 5 = +5%) */
  oreLuckBonus: number;
  
  /** Damage bonus percentage (e.g., 10 = +10%) */
  damageBonus: number;
  
  /** Cost to purchase this miner in coins */
  cost: number;
  
  /** Rarity tier */
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Exotic';
}

