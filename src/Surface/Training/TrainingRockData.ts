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
 */
export enum TrainingRockTier {
  STONE = 'stone',
  IRON = 'iron',
  GOLD = 'gold',
  DIAMOND = 'diamond',
  CRYSTAL = 'crystal',
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
 * Based on TDD section 3.2: Example set
 */
export const TRAINING_ROCK_DATABASE: Record<TrainingRockTier, TrainingRockData> = {
  [TrainingRockTier.STONE]: {
    id: 'stone-rock',
    tier: TrainingRockTier.STONE,
    name: 'Stone Rock',
    requiredRebirths: TRAINING_ROCK_REQUIRED_REBIRTHS.STONE,
    requiredPower: TRAINING_ROCK_POWER_REQUIREMENTS.STONE,
    powerGainMultiplier: TRAINING_ROCK_MULTIPLIERS.STONE,
  },
  [TrainingRockTier.IRON]: {
    id: 'iron-rock',
    tier: TrainingRockTier.IRON,
    name: 'Iron Rock',
    requiredRebirths: TRAINING_ROCK_REQUIRED_REBIRTHS.IRON,
    requiredPower: TRAINING_ROCK_POWER_REQUIREMENTS.IRON,
    powerGainMultiplier: TRAINING_ROCK_MULTIPLIERS.IRON,
  },
  [TrainingRockTier.GOLD]: {
    id: 'gold-rock',
    tier: TrainingRockTier.GOLD,
    name: 'Gold Rock',
    requiredRebirths: TRAINING_ROCK_REQUIRED_REBIRTHS.GOLD,
    requiredPower: TRAINING_ROCK_POWER_REQUIREMENTS.GOLD,
    powerGainMultiplier: TRAINING_ROCK_MULTIPLIERS.GOLD,
  },
  [TrainingRockTier.DIAMOND]: {
    id: 'diamond-rock',
    tier: TrainingRockTier.DIAMOND,
    name: 'Diamond Rock',
    requiredRebirths: TRAINING_ROCK_REQUIRED_REBIRTHS.DIAMOND,
    requiredPower: TRAINING_ROCK_POWER_REQUIREMENTS.DIAMOND,
    powerGainMultiplier: TRAINING_ROCK_MULTIPLIERS.DIAMOND,
  },
  [TrainingRockTier.CRYSTAL]: {
    id: 'crystal-rock',
    tier: TrainingRockTier.CRYSTAL,
    name: 'Crystal Rock',
    requiredRebirths: TRAINING_ROCK_REQUIRED_REBIRTHS.CRYSTAL,
    requiredPower: TRAINING_ROCK_POWER_REQUIREMENTS.CRYSTAL,
    powerGainMultiplier: TRAINING_ROCK_MULTIPLIERS.CRYSTAL,
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
 * Gets all training rocks that a player can access based on their rebirth count
 * 
 * @param rebirths - Player's current rebirth count
 * @returns Array of accessible training rock data
 */
export function getAccessibleTrainingRocks(rebirths: number): TrainingRockData[] {
  return Object.values(TRAINING_ROCK_DATABASE).filter(
    rock => rock.requiredRebirths <= rebirths
  );
}

/**
 * Checks if a player can access a training rock
 * 
 * @param tier - Training rock tier to check
 * @param rebirths - Player's current rebirth count
 * @returns True if player can access this rock
 */
export function canAccessTrainingRock(tier: TrainingRockTier, rebirths: number): boolean {
  const rock = getTrainingRockByTier(tier);
  if (!rock) return false;
  return rock.requiredRebirths <= rebirths;
}

