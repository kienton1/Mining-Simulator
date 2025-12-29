/**
 * Training Rock Data
 * 
 * Defines training rock properties and data structures.
 * Training rocks are where players gain Power through auto-hitting.
 * 
 * Reference: Planning/gameOverview.txt section 3.2
 */

import {
  TRAINING_ROCK_MULTIPLIERS,
  TRAINING_ROCK_REQUIRED_REBIRTHS,
  TRAINING_ROCK_POWER_REQUIREMENTS,
} from '../../Core/GameConstants';

/**
 * Training rock tier enumeration
 * Updated to 6 tiers based on block types:
 * - DIRT: Cobblestone block (+1 Power) - always available
 * - COBBLESTONE: Deepslate Iron Ore block (+3 Power)
 * - IRON_DEEPSLATE: Deepslate Gold Ore block (+15 Power)
 * - GOLD_DEEPSLATE: Deepslate Diamond Ore block (+45 Power)
 * - DIAMOND_DEEPSLATE: Deepslate Emerald Ore block (+80 Power)
 * - EMERALD_DEEPSLATE: Deepslate Ruby Ore block (+175 Power)
 */
export enum TrainingRockTier {
  DIRT = 'dirt',              // Rock 1 - Cobblestone block (+1 Power, always available)
  COBBLESTONE = 'cobblestone', // Rock 2 - Deepslate Iron Ore block (+3 Power)
  IRON_DEEPSLATE = 'iron_deepslate', // Rock 3 - Deepslate Gold Ore block (+15 Power)
  GOLD_DEEPSLATE = 'gold_deepslate', // Rock 4 - Deepslate Diamond Ore block (+45 Power)
  DIAMOND_DEEPSLATE = 'diamond_deepslate', // Rock 5 - Deepslate Emerald Ore block (+80 Power)
  EMERALD_DEEPSLATE = 'emerald_deepslate', // Rock 6 - Deepslate Ruby Ore block (+175 Power)
}

/**
 * Training rock data structure
 * Contains all properties for a training rock
 */
export interface TrainingRockData {
  /** Unique identifier for this training rock */
  id: string;
  
  /** Tier of training rock */
  tier: TrainingRockTier;
  
  /** Display name */
  name: string;
  
  /** Number of rebirths required to access this rock */
  requiredRebirths: number;
  
  /** Amount of power required to access this rock (alternative to rebirths) */
  requiredPower: number;
  
  /** Power gain multiplier (1, 2, 4, 10, 25) */
  powerGainMultiplier: number;
  
  /** Optional HP (can be infinite) */
  hp?: number;
}

/**
 * Database of all training rocks
 * Updated to 6 tiers with piecewise power gain functions based on rebirths
 * Reference: Planning/PowerSystemPlan.md section 4
 */
export const TRAINING_ROCK_DATABASE: Record<TrainingRockTier, TrainingRockData> = {
  [TrainingRockTier.DIRT]: {
    id: 'cobblestone-rock',
    tier: TrainingRockTier.DIRT,
    name: 'Cobblestone Training Area', // +1 Power (cobblestone block)
    requiredRebirths: TRAINING_ROCK_REQUIRED_REBIRTHS.DIRT,
    requiredPower: TRAINING_ROCK_POWER_REQUIREMENTS.DIRT,
    powerGainMultiplier: 1, // UI display value: "+1 Power" (actual power uses piecewise function)
  },
  [TrainingRockTier.COBBLESTONE]: {
    id: 'iron-deepslate-rock',
    tier: TrainingRockTier.COBBLESTONE,
    name: 'Iron Deepslate Training Area', // +3 Power (deepslate-iron-ore block)
    requiredRebirths: TRAINING_ROCK_REQUIRED_REBIRTHS.COBBLESTONE,
    requiredPower: TRAINING_ROCK_POWER_REQUIREMENTS.COBBLESTONE,
    powerGainMultiplier: 3, // UI display value: "+3 Power" (actual power uses piecewise function)
  },
  [TrainingRockTier.IRON_DEEPSLATE]: {
    id: 'gold-deepslate-rock',
    tier: TrainingRockTier.IRON_DEEPSLATE,
    name: 'Gold Deepslate Training Area', // +15 Power (deepslate-gold-ore block)
    requiredRebirths: TRAINING_ROCK_REQUIRED_REBIRTHS.IRON_DEEPSLATE,
    requiredPower: TRAINING_ROCK_POWER_REQUIREMENTS.IRON_DEEPSLATE,
    powerGainMultiplier: 15, // UI display value: "+15 Power" (actual power uses piecewise function)
  },
  [TrainingRockTier.GOLD_DEEPSLATE]: {
    id: 'diamond-deepslate-rock',
    tier: TrainingRockTier.GOLD_DEEPSLATE,
    name: 'Diamond Deepslate Training Area', // +45 Power (deepslate-diamond-ore block)
    requiredRebirths: TRAINING_ROCK_REQUIRED_REBIRTHS.GOLD_DEEPSLATE,
    requiredPower: TRAINING_ROCK_POWER_REQUIREMENTS.GOLD_DEEPSLATE,
    powerGainMultiplier: 45, // UI display value: "+45 Power" (actual power uses piecewise function)
  },
  [TrainingRockTier.DIAMOND_DEEPSLATE]: {
    id: 'emerald-deepslate-rock',
    tier: TrainingRockTier.DIAMOND_DEEPSLATE,
    name: 'Emerald Deepslate Training Area', // +80 Power (deepslate-emerald-ore block)
    requiredRebirths: TRAINING_ROCK_REQUIRED_REBIRTHS.DIAMOND_DEEPSLATE,
    requiredPower: TRAINING_ROCK_POWER_REQUIREMENTS.DIAMOND_DEEPSLATE,
    powerGainMultiplier: 80, // UI display value: "+80 Power" (actual power uses piecewise function)
  },
  [TrainingRockTier.EMERALD_DEEPSLATE]: {
    id: 'ruby-deepslate-rock',
    tier: TrainingRockTier.EMERALD_DEEPSLATE,
    name: 'Ruby Deepslate Training Area', // +175 Power (deepslate-ruby-ore block)
    requiredRebirths: TRAINING_ROCK_REQUIRED_REBIRTHS.EMERALD_DEEPSLATE,
    requiredPower: TRAINING_ROCK_POWER_REQUIREMENTS.EMERALD_DEEPSLATE,
    powerGainMultiplier: 175, // UI display value: "+175 Power" (actual power uses piecewise function)
  },
};

/**
 * Gets training rock data by tier
 * 
 * @param tier - Training rock tier
 * @returns Training rock data or undefined if tier doesn't exist
 */
export function getTrainingRockByTier(tier: TrainingRockTier): TrainingRockData | undefined {
  return TRAINING_ROCK_DATABASE[tier];
}

/**
 * Gets all training rocks that a player can access based on their rebirth count OR power
 * 
 * @param rebirths - Player's current rebirth count
 * @param power - Player's current power
 * @returns Array of accessible training rock data
 */
export function getAccessibleTrainingRocks(rebirths: number, power: number): TrainingRockData[] {
  return Object.values(TRAINING_ROCK_DATABASE).filter(
    rock => rock.requiredRebirths <= rebirths || rock.requiredPower <= power
  );
}

/**
 * Checks if a player can access a training rock
 * Player can unlock via EITHER power requirement OR rebirth requirement
 * 
 * @param tier - Training rock tier to check
 * @param rebirths - Player's current rebirth count
 * @param power - Player's current power
 * @returns True if player can access this rock
 */
export function canAccessTrainingRock(tier: TrainingRockTier, rebirths: number, power: number): boolean {
  const rock = getTrainingRockByTier(tier);
  if (!rock) return false;
  return rock.requiredRebirths <= rebirths || rock.requiredPower <= power;
}

