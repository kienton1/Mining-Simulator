/**
 * Stat Calculator
 * 
 * Contains all stat calculation formulas from the TDD.
 * All formulas match the specifications in gameOverview.txt section 10.
 * Power and training formulas are balanced per TrainingPowerBalanceBlueprint.md
 * 
 * Reference: Planning/gameOverview.txt section 10 - Updated Math Section
 * Reference: Planning/TrainingPowerBalanceBlueprint.md - Balanced Power System
 */

import { PickaxeData } from '../Pickaxe/PickaxeData';
import {
  BASE_POWER_GAIN,
  POWER_SCALING_CONSTANT,
  REBIRTH_MULTIPLIER_PER_REBIRTH,
} from '../Core/GameConstants';

/**
 * Calculates power gain per hit during training
 * 
 * REBALANCED: Pickaxes no longer affect power gain
 * Formula: BasePower × TrainingRockMultiplier × (1 + Rebirths × 0.1)
 * 
 * Reference: gameOverview.txt section 10.1
 * 
 * @param trainingRockMultiplier - Multiplier from the training rock (1, 2, 4, 10, 25)
 * @param rebirths - Number of rebirths the player has
 * @returns Power gained per hit
 */
export function calculatePowerGainPerHit(
  trainingRockMultiplier: number,
  rebirths: number
): number {
  const rebirthMultiplier = 1 + (rebirths * REBIRTH_MULTIPLIER_PER_REBIRTH);
  const powerGain = BASE_POWER_GAIN * trainingRockMultiplier * rebirthMultiplier;
  // Always return a whole number (round to nearest integer)
  return Math.round(powerGain);
}

/**
 * Calculates total mining damage
 * 
 * REBALANCED: Pickaxes no longer affect damage - damage comes from Power only
 * Formula: BaseDamage × (1 + Power / PowerConstant)
 * BaseDamage = 1 (constant)
 * Power scaling constant = 5 (every 5 power = +100% damage)
 * 
 * Design Goal: Balanced progression where training helps significantly but doesn't trivialize content
 * - 10 seconds training = 20 power → 5 damage (helps but stone still takes effort)
 * - 30 seconds training = 75 power → 16 damage (coal takes ~9-10 hits)
 * - 4 minutes training = 495 power → 100 damage (one-hits stone)
 * 
 * Reference: gameOverview.txt section 10.2
 * Reference: Planning/TrainingPowerBalanceBlueprint.md section 3
 * 
 * @param power - Player's current power level
 * @returns Total mining damage
 * 
 * Examples:
 * - Power 20 (10 sec training): 5 damage - Stone takes ~20 hits
 * - Power 75 (30 sec training): 16 damage - Coal takes ~9-10 hits
 * - Power 495 (~4 min): 100 damage - One-hits stone
 * - Power 1,000: 201 damage
 */
export function calculateMiningDamage(power: number): number {
  const BASE_DAMAGE = 1;
  return BASE_DAMAGE * (1 + power / POWER_SCALING_CONSTANT);
}

/**
 * Gets mining speed from pickaxe
 * 
 * Formula: MiningSpeed = PickaxeMiningSpeed
 * 
 * Reference: gameOverview.txt section 10.3
 * 
 * @param pickaxe - Player's current pickaxe
 * @returns Mining speed (swings per second)
 */
export function getMiningSpeed(pickaxe: PickaxeData): number {
  return pickaxe.miningSpeed;
}

/**
 * Calculates rebirth multiplier
 * 
 * Formula: 1 + (Rebirths × 0.10)
 * 
 * Reference: gameOverview.txt section 4.2
 * 
 * @param rebirths - Number of rebirths
 * @returns Rebirth multiplier
 */
export function calculateRebirthMultiplier(rebirths: number): number {
  return 1 + (rebirths * REBIRTH_MULTIPLIER_PER_REBIRTH);
}

/**
 * Calculates adjusted ore chance with luck
 * 
 * Formula: BaseChance × (1 + Luck)
 * Note: Percentages should be normalized to 100% after applying luck
 * 
 * Reference: gameOverview.txt section 10.4
 * 
 * @param baseChance - Base spawn chance (0.0 to 1.0)
 * @param luck - Luck percentage (0.0 to 1.0, e.g., 0.20 = 20%)
 * @returns Adjusted chance (before normalization)
 */
export function calculateAdjustedOreChance(
  baseChance: number,
  luck: number
): number {
  return baseChance * (1 + luck);
}

/**
 * Normalizes ore chances to sum to 1.0 (100%)
 * 
 * This ensures all ore probabilities add up to 100% after luck adjustments
 * 
 * @param chances - Map of ore types to their adjusted chances
 * @returns Normalized chances that sum to 1.0
 */
export function normalizeOreChances(
  chances: Record<string, number>
): Record<string, number> {
  const total = Object.values(chances).reduce((sum, chance) => sum + chance, 0);
  
  if (total === 0) {
    // If all chances are 0, return equal distribution
    const count = Object.keys(chances).length;
    const normalized: Record<string, number> = {};
    for (const key of Object.keys(chances)) {
      normalized[key] = 1 / count;
    }
    return normalized;
  }
  
  // Normalize to sum to 1.0
  const normalized: Record<string, number> = {};
  for (const [key, chance] of Object.entries(chances)) {
    normalized[key] = chance / total;
  }
  
  return normalized;
}

