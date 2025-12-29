/**
 * Stat Calculator
 * 
 * Contains all stat calculation formulas from the TDD.
 * All formulas match the specifications in gameOverview.txt section 10.
 * Power and training formulas use piecewise functions based on rebirths.
 * 
 * Reference: Planning/gameOverview.txt section 10 - Updated Math Section
 * Reference: Planning/PowerSystemPlan.md - Power System with Piecewise Functions
 */

import { PickaxeData } from '../Pickaxe/PickaxeData';
import { TrainingRockTier } from '../Surface/Training/TrainingRockData';
// Note: POWER_SCALING_CONSTANT and REBIRTH_MULTIPLIER_PER_REBIRTH are deprecated
// New system uses power-based damage formula and piecewise functions for power gain

/**
 * Calculates power gain per hit for Rock 1 (Dirt) using piecewise function
 * Reference: Planning/PowerSystemPlan.md section 4 - Rock 1 Power Gain Formula
 * 
 * @param rebirths - Number of rebirths (x)
 * @returns Power gained per hit (y)
 */
function calculateRock1PowerGain(rebirths: number): number {
  const x = rebirths;
  
  if (x >= 1 && x <= 36) {
    return Math.floor((x + 4) / 5);
  } else if (x > 36 && x <= 457) {
    return Math.floor((x + 7) / 6);
  } else if (x >= 2510) {
    return Math.floor(x / 10 + 0.5);
  } else {
    // Gap handling for 457 < x < 2510: use linear interpolation
    // At x = 457: y = floor((457 + 7) / 6) = 77
    // At x = 2510: y = floor(2510 / 10 + 0.5) = 251
    // Interpolate: y = 77 + ((251 - 77) / (2510 - 457)) * (x - 457)
    const y1 = Math.floor((457 + 7) / 6);
    const y2 = Math.floor(2510 / 10 + 0.5);
    return Math.floor(y1 + ((y2 - y1) / (2510 - 457)) * (x - 457));
  }
}

/**
 * Calculates power gain per hit for Rock 2 (Cobblestone) using piecewise function
 * Reference: Planning/PowerSystemPlan.md section 4 - Rock 2 Power Gain Formula
 * 
 * @param rebirths - Number of rebirths (x)
 * @returns Power gained per hit (y)
 */
function calculateRock2PowerGain(rebirths: number): number {
  const x = rebirths;
  
  if (x >= 1 && x < 57) {
    return Math.floor(x / 5);
  } else if (x >= 57 && x < 2510) {
    return Math.floor(0.15 * x + 2.5);
  } else if (x >= 2510) {
    return Math.floor(0.15 * x + 2);
  } else {
    return 0; // x < 1
  }
}

/**
 * Calculates power gain per hit for Rock 3 (Iron Deepslate) using piecewise function
 * Reference: Planning/PowerSystemPlan.md section 4 - Rock 3 Power Gain Formula
 * 
 * @param rebirths - Number of rebirths (x)
 * @returns Power gained per hit (y)
 */
function calculateRock3PowerGain(rebirths: number): number {
  const x = rebirths;
  
  if (x >= 1 && x <= 47) {
    return Math.floor(0.8 * x + 7);
  } else if (x > 47 && x < 2510) {
    return Math.floor(0.75 * x + 8);
  } else if (x >= 2510) {
    return Math.floor(0.75 * x);
  } else {
    return 0; // x < 1
  }
}

/**
 * Round Half function - rounds to nearest integer (0.5 rounds up)
 * 
 * @param value - Value to round
 * @returns Rounded value
 */
function roundHalf(value: number): number {
  return Math.round(value);
}

/**
 * Calculates power gain per hit for Rock 4 (Gold Deepslate) using piecewise function
 * Reference: Planning/PowerSystemPlan.md section 4 - Rock 4 Power Gain Formula
 * 
 * @param rebirths - Number of rebirths (x)
 * @returns Power gained per hit (y)
 */
function calculateRock4PowerGain(rebirths: number): number {
  const x = rebirths;
  
  if (x <= 457) {
    return roundHalf((9 * x + 91) / 4);
  } else if (x > 457 && x <= 2510) {
    return roundHalf(1051 + (4613 / 2053) * (x - 457));
  } else if (x > 2510 && x <= 3760) {
    return roundHalf(5664 + (1407 / 625) * (x - 2510));
  } else if (x > 3760 && x <= 6260) {
    return roundHalf(8478 + (2813 / 1250) * (x - 3760));
  } else if (x > 6260 && x <= 20260) {
    return roundHalf((9 * x / 4) + 19);
  } else if (x > 20260 && x <= 59040) {
    return roundHalf(45604 + (21824 / 9695) * (x - 20260));
  } else if (x > 59040 && x <= 209040) {
    return roundHalf((9 * x / 4) + 60);
  } else if (x > 209040) {
    return roundHalf((4297 / 1910) * x + (21912 / 191));
  } else {
    return 0; // x < 1
  }
}

/**
 * Rock 5 knot points for piecewise linear function
 * Reference: Planning/PowerSystemPlan.md section 4 - Rock 5 Power Gain Formula
 */
const ROCK5_KNOTS: Array<[number, number]> = [
  [1, 44], [6, 64], [11, 84], [16, 104], [21, 124], [26, 144], [31, 164], [36, 184],
  [41, 204], [47, 228], [57, 268], [77, 348], [97, 428], [117, 508], [137, 588],
  [157, 668], [207, 869], [257, 1068], [307, 1268], [357, 1468], [457, 1868],
  [2510, 10069], [3760, 15072], [6260, 25073], [12760, 51703], [20260, 81072],
  [59040, 236200], [79040, 316200], [119040, 476200], [129040, 516200],
  [209040, 836200], [400040, 1600000],
];

/**
 * Calculates power gain per hit for Rock 5 (Diamond Deepslate) using piecewise linear function
 * Reference: Planning/PowerSystemPlan.md section 4 - Rock 5 Power Gain Formula
 * 
 * @param rebirths - Number of rebirths (x)
 * @returns Power gained per hit (y)
 */
function calculateRock5PowerGain(rebirths: number): number {
  const x = rebirths;
  
  if (x < 1) return 44; // Minimum value
  if (x >= 400040) {
    return 4 * x - 160;
  }
  
  // Find the segment containing x
  for (let i = 0; i < ROCK5_KNOTS.length - 1; i++) {
    const [x1, y1] = ROCK5_KNOTS[i];
    const [x2, y2] = ROCK5_KNOTS[i + 1];
    
    if (x >= x1 && x <= x2) {
      // Linear interpolation
      const y = y1 + ((y2 - y1) / (x2 - x1)) * (x - x1);
      return Math.round(y);
    }
  }
  
  // Fallback: use last knot point
  const [, lastY] = ROCK5_KNOTS[ROCK5_KNOTS.length - 1];
  return lastY;
}

/**
 * Rock 6 knot points for piecewise linear function
 * Reference: Planning/PowerSystemPlan.md section 4 - Rock 6 Power Gain Formula
 */
const ROCK6_KNOTS: Array<[number, number]> = [
  [1, 620], [6, 650], [11, 680], [16, 710], [21, 740], [26, 770], [31, 800],
  [36, 830], [41, 860], [47, 900], [57, 970], [77, 1120], [97, 1270], [117, 1420],
  [137, 1570], [157, 1720], [207, 2000], [257, 2150], [307, 1849], [357, 2141],
  [457, 2724], [2510, 14683], [3760, 21980], [6260, 36564], [12760, 74480],
  [20260, 118200], [59040, 344400], [79040, 461100], [119040, 694400],
  [129040, 752800], [209040, 1200000], [400040, 2300000],
];

/**
 * Calculates power gain per hit for Rock 6 (Emerald Deepslate) using piecewise linear function
 * Reference: Planning/PowerSystemPlan.md section 4 - Rock 6 Power Gain Formula
 * 
 * @param rebirths - Number of rebirths (x)
 * @returns Power gained per hit (y)
 */
function calculateRock6PowerGain(rebirths: number): number {
  const x = rebirths;
  
  if (x < 1) return 620; // Minimum value
  if (x >= 400040) {
    return 5.75 * x - 100230;
  }
  
  // Find the segment containing x
  for (let i = 0; i < ROCK6_KNOTS.length - 1; i++) {
    const [x1, y1] = ROCK6_KNOTS[i];
    const [x2, y2] = ROCK6_KNOTS[i + 1];
    
    if (x >= x1 && x <= x2) {
      // Linear interpolation
      const y = y1 + ((y2 - y1) / (x2 - x1)) * (x - x1);
      return Math.round(y);
    }
  }
  
  // Fallback: use last knot point
  const [, lastY] = ROCK6_KNOTS[ROCK6_KNOTS.length - 1];
  return lastY;
}

/**
 * Calculates power gain per hit during training using piecewise functions
 * 
 * UPDATED: Power gain now uses piecewise functions based on rock tier and rebirth count
 * Pickaxes no longer affect power gain - only rock selection and rebirth count matter
 * 
 * Reference: Planning/PowerSystemPlan.md section 4 - Training Rock Balance
 * 
 * @param rockTier - Training rock tier
 * @param rebirths - Number of rebirths the player has
 * @returns Power gained per hit
 */
export function calculatePowerGainPerHit(
  rockTier: TrainingRockTier,
  rebirths: number
): number {
  switch (rockTier) {
    case TrainingRockTier.DIRT:
      return calculateRock1PowerGain(rebirths);
    case TrainingRockTier.COBBLESTONE:
      return calculateRock2PowerGain(rebirths);
    case TrainingRockTier.IRON_DEEPSLATE:
      return calculateRock3PowerGain(rebirths);
    case TrainingRockTier.GOLD_DEEPSLATE:
      return calculateRock4PowerGain(rebirths);
    case TrainingRockTier.DIAMOND_DEEPSLATE:
      return calculateRock5PowerGain(rebirths);
    case TrainingRockTier.EMERALD_DEEPSLATE:
      return calculateRock6PowerGain(rebirths);
    default:
      return calculateRock1PowerGain(rebirths);
  }
}

/**
 * Calculates total mining damage using power-based scaling formula
 * 
 * UPDATED: Uses new power-based damage formula with EarlyBoost multiplier
 * Formula: EarlyBoost = 1 + 2 / (1 + (Power / 398107.17)^0.3)
 *          Damage = 1 + 0.072 * Power^0.553 * EarlyBoost
 * 
 * Pickaxes no longer affect damage - damage comes from Power only
 * 
 * Reference: Planning/PowerSystemPlan.md section 3 - Power Impact on Mining
 * 
 * @param power - Player's current power level
 * @returns Total mining damage
 */
export function calculateMiningDamage(power: number): number {
  const EARLY_BOOST_DIVISOR = 398107.17;
  const EARLY_BOOST_EXPONENT = 0.3;
  const DAMAGE_COEFFICIENT = 0.072;
  const DAMAGE_POWER_EXPONENT = 0.553;
  const BASE_DAMAGE = 1;
  
  // Calculate EarlyBoost
  const earlyBoost = 1 + 2 / (1 + Math.pow(power / EARLY_BOOST_DIVISOR, EARLY_BOOST_EXPONENT));
  
  // Calculate damage
  const damage = BASE_DAMAGE + DAMAGE_COEFFICIENT * Math.pow(power, DAMAGE_POWER_EXPONENT) * earlyBoost;
  
  return damage;
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
 * DEPRECATED: Calculates rebirth multiplier
 * 
 * This function is no longer used in the power system.
 * Rebirths now unlock training rocks and scale power gain per rock via piecewise functions,
 * rather than providing a direct multiplier.
 * 
 * @deprecated Rebirths no longer use a direct multiplier - see PowerSystemPlan.md
 * @param rebirths - Number of rebirths
 * @returns Rebirth multiplier (kept for backwards compatibility only)
 */
export function calculateRebirthMultiplier(rebirths: number): number {
  // DEPRECATED: Kept for backwards compatibility, but no longer used
  return 1 + (rebirths * 0.10);
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

