/**
 * Island 2 Training Rock Data
 *
 * Defines training rock properties for Island 2 (Beach World).
 * Training rocks are where players gain Power through auto-hitting.
 * Uses ocean-themed names and different formulas from Island 1.
 *
 * Reference: Planning/BeachMapPlans/NewWorldIslandPlan.md section 3
 */

/**
 * Training rock tier enumeration for Island 2
 * 6 tiers based on ore block types:
 * - DUNESTONE: Rock 1 (+300 Power UI, always available)
 * - BARNACITE: Rock 2 (+500 Power UI)
 * - PRISMARINE: Rock 3 (+1,500 Power UI)
 * - BASALTITE: Rock 4 (+4,000 Power UI)
 * - WRECKITE: Rock 5 (+12,000 Power UI)
 * - TRADEWINDITE: Rock 6 (+25,000 Power UI)
 */
export enum ISLAND2_TRAINING_ROCK_TIER {
  DUNESTONE = 'dunestone',              // Rock 1 - Dunestone block (+300 Power UI)
  BARNACITE = 'barnacite',              // Rock 2 - Barnacite block (+500 Power UI)
  PRISMARINE = 'prismarine',            // Rock 3 - Prismarine block (+1,500 Power UI)
  BASALTITE = 'basaltite',              // Rock 4 - Basaltite block (+4,000 Power UI)
  WRECKITE = 'wreckite',                // Rock 5 - Wreckite block (+12,000 Power UI)
  TRADEWINDITE = 'tradewindite',        // Rock 6 - Tradewindite block (+25,000 Power UI)
}

/**
 * Training rock data structure for Island 2
 */
export interface Island2TrainingRockData {
  /** Unique identifier for this training rock */
  id: string;

  /** Tier of training rock */
  tier: ISLAND2_TRAINING_ROCK_TIER;

  /** Display name (ocean-themed) */
  name: string;

  /** Number of rebirths required to access this rock */
  requiredRebirths: number;

  /** Amount of power required to access this rock (alternative to rebirths) */
  requiredPower: number;

  /** UI power bonus display value */
  uiPowerBonus: number;

  /** Formula constant for power gain calculation */
  formulaConstant: number;

  /** Hit rate (hits per second) */
  hitRate: number;

  /** Block type used to identify this training rock */
  blockType: string;
}

/**
 * Database of all Island 2 training rocks
 * 6 tiers with exponential power gain functions based on rebirths
 * Reference: Planning/BeachMapPlans/NewWorldIslandPlan.md section 3
 */
export const ISLAND2_TRAINING_ROCK_DATABASE: Record<ISLAND2_TRAINING_ROCK_TIER, Island2TrainingRockData> = {
  [ISLAND2_TRAINING_ROCK_TIER.DUNESTONE]: {
    id: 'dunestone-rock',
    tier: ISLAND2_TRAINING_ROCK_TIER.DUNESTONE,
    name: 'Dunestone Training Area',
    requiredRebirths: 2500,
    requiredPower: 250000000000, // 250B
    uiPowerBonus: 300,
    formulaConstant: 10.157182969523832,
    hitRate: 3, // 3 hits per second
    blockType: 'Dunestone',
  },
  [ISLAND2_TRAINING_ROCK_TIER.BARNACITE]: {
    id: 'barnacite-rock',
    tier: ISLAND2_TRAINING_ROCK_TIER.BARNACITE,
    name: 'Barnacite Training Area',
    requiredRebirths: 25000,
    requiredPower: 5000000000000, // 5T
    uiPowerBonus: 500,
    formulaConstant: 16.928638282539723,
    hitRate: 3, // 3 hits per second
    blockType: 'Barnacite',
  },
  [ISLAND2_TRAINING_ROCK_TIER.PRISMARINE]: {
    id: 'prismarine-rock',
    tier: ISLAND2_TRAINING_ROCK_TIER.PRISMARINE,
    name: 'Prismarine Training Area',
    requiredRebirths: 150000,
    requiredPower: 100000000000000, // 100T
    uiPowerBonus: 1500,
    formulaConstant: 50.78591484761917,
    hitRate: 3, // 3 hits per second
    blockType: 'Prismarine',
  },
  [ISLAND2_TRAINING_ROCK_TIER.BASALTITE]: {
    id: 'basaltite-rock',
    tier: ISLAND2_TRAINING_ROCK_TIER.BASALTITE,
    name: 'Basaltite Training Area',
    requiredRebirths: 750000,
    requiredPower: 1000000000000000, // 1Q
    uiPowerBonus: 4000,
    formulaConstant: 135.42910626031778,
    hitRate: 3, // 3 hits per second
    blockType: 'Basaltite',
  },
  [ISLAND2_TRAINING_ROCK_TIER.WRECKITE]: {
    id: 'wreckite-rock',
    tier: ISLAND2_TRAINING_ROCK_TIER.WRECKITE,
    name: 'Wreckite Training Area',
    requiredRebirths: 10000000,
    requiredPower: 100000000000000000, // 100Q
    uiPowerBonus: 12000,
    formulaConstant: 406.28731878095334,
    hitRate: 3, // 3 hits per second
    blockType: 'Wreckite',
  },
  [ISLAND2_TRAINING_ROCK_TIER.TRADEWINDITE]: {
    id: 'tradewindite-rock',
    tier: ISLAND2_TRAINING_ROCK_TIER.TRADEWINDITE,
    name: 'Tradewindite Training Area',
    requiredRebirths: 45000000,
    requiredPower: 1000000000000000000, // 1S
    uiPowerBonus: 25000,
    formulaConstant: 848.6326371037162,
    hitRate: 4, // 4 hits per second
    blockType: 'Tradewindite',
  },
};

/**
 * Calculate power gain per hit for Island 2 training rocks
 * Formula: y(x) = floor(Constant * x^(0.9993304728909983))
 * Where x = player rebirth count, y = power gained per training hit
 *
 * @param rockTier - The training rock tier
 * @param rebirthCount - Player's current rebirth count
 * @returns Power gained per hit
 */
export function calculateIsland2TrainingPowerGain(rockTier: ISLAND2_TRAINING_ROCK_TIER, rebirthCount: number): number {
  const rockData = ISLAND2_TRAINING_ROCK_DATABASE[rockTier];
  const exponent = 0.9993304728909983; // Same exponent as Island 1

  return Math.floor(rockData.formulaConstant * Math.pow(rebirthCount, exponent));
}

/**
 * Calculate power gain per second for Island 2 training rocks
 * Formula: Power/sec = (power per hit) * (hits per second)
 *
 * @param rockTier - The training rock tier
 * @param rebirthCount - Player's current rebirth count
 * @returns Power gained per second
 */
export function calculateIsland2TrainingPowerPerSecond(rockTier: ISLAND2_TRAINING_ROCK_TIER, rebirthCount: number): number {
  const powerPerHit = calculateIsland2TrainingPowerGain(rockTier, rebirthCount);
  const rockData = ISLAND2_TRAINING_ROCK_DATABASE[rockTier];

  return powerPerHit * rockData.hitRate;
}

/**
 * Gets Island 2 training rock data by tier
 *
 * @param tier - Training rock tier
 * @returns Training rock data or undefined if tier doesn't exist
 */
export function getIsland2TrainingRockByTier(tier: ISLAND2_TRAINING_ROCK_TIER): Island2TrainingRockData | undefined {
  return ISLAND2_TRAINING_ROCK_DATABASE[tier];
}

/**
 * Gets all Island 2 training rocks that a player can access based on their rebirth count OR power
 *
 * @param rebirths - Player's current rebirth count
 * @param power - Player's current power
 * @returns Array of accessible training rock data
 */
export function getAccessibleIsland2TrainingRocks(rebirths: number, power: number): Island2TrainingRockData[] {
  return Object.values(ISLAND2_TRAINING_ROCK_DATABASE).filter(
    rock => rock.requiredRebirths <= rebirths || rock.requiredPower <= power
  );
}

/**
 * Checks if a player can access an Island 2 training rock
 * Player can unlock via EITHER power requirement OR rebirth requirement
 *
 * @param tier - Training rock tier to check
 * @param rebirths - Player's current rebirth count
 * @param power - Player's current power
 * @returns True if player can access this rock
 */
export function canAccessIsland2TrainingRock(tier: ISLAND2_TRAINING_ROCK_TIER, rebirths: number, power: number): boolean {
  const rock = getIsland2TrainingRockByTier(tier);
  if (!rock) return false;
  return rock.requiredRebirths <= rebirths || rock.requiredPower <= power;
}

/**
 * Get block type to tier mapping for Island 2 training rocks
 * Used for auto-detection of training rocks in the world
 */
export const ISLAND2_BLOCK_TYPE_TO_TIER: Record<string, ISLAND2_TRAINING_ROCK_TIER> = {
  'Dunestone': ISLAND2_TRAINING_ROCK_TIER.DUNESTONE,
  'Barnacite': ISLAND2_TRAINING_ROCK_TIER.BARNACITE,
  'Prismarine': ISLAND2_TRAINING_ROCK_TIER.PRISMARINE,
  'Basaltite': ISLAND2_TRAINING_ROCK_TIER.BASALTITE,
  'Wreckite': ISLAND2_TRAINING_ROCK_TIER.WRECKITE,
  'Tradewindite': ISLAND2_TRAINING_ROCK_TIER.TRADEWINDITE,
};

/**
 * Get training rock tier from block type
 *
 * @param blockType - Block type string
 * @returns Training rock tier or undefined if not found
 */
export function getIsland2TierFromBlockType(blockType: string): ISLAND2_TRAINING_ROCK_TIER | undefined {
  return ISLAND2_BLOCK_TYPE_TO_TIER[blockType];
}
