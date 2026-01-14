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
 * Training rock tier enumeration for Island 3 (Volcanic World)
 * 6 tiers based on volcanic ore block types:
 * - SULFURON: Rock 7 (+60,000 Power UI)
 * - FUMARO: Rock 8 (+200,000 Power UI)
 * - CHARBITE: Rock 9 (+450,000 Power UI)
 * - MINTASH: Rock 10 (+2,500,000 Power UI)
 * - MAGMAORB: Rock 11 (+7,500,000 Power UI)
 * - INFERNON: Rock 12 (+15,000,000 Power UI)
 */
export enum ISLAND3_TRAINING_ROCK_TIER {
  SULFURON = 'sulfuron',
  FUMARO = 'fumaro',
  CHARBITE = 'charbite',
  MINTASH = 'mintash',
  MAGMAORB = 'magmaorb',
  INFERNON = 'infernon',
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
 * Training rock data structure for Island 3
 */
export interface Island3TrainingRockData {
  /** Unique identifier for this training rock */
  id: string;

  /** Tier of training rock */
  tier: ISLAND3_TRAINING_ROCK_TIER;

  /** Display name (volcanic-themed) */
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
    requiredPower: 250000000, // 250M
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
    requiredPower: 5000000000, // 5B
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
    requiredPower: 100000000000, // 100B
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
    requiredPower: 1000000000000, // 1T
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
    requiredPower: 100000000000000, // 100T
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
    requiredPower: 1000000000000000, // 1Q
    uiPowerBonus: 25000,
    formulaConstant: 848.6326371037162,
    hitRate: 4, // 4 hits per second
    blockType: 'Tradewindite',
  },
};

/**
 * Database of all Island 3 training rocks
 * 6 tiers with exponential power gain functions based on rebirths
 * Reference: Volcanic training formulas (rocks 7-12)
 */
export const ISLAND3_TRAINING_ROCK_DATABASE: Record<ISLAND3_TRAINING_ROCK_TIER, Island3TrainingRockData> = {
  [ISLAND3_TRAINING_ROCK_TIER.SULFURON]: {
    id: 'sulfuron-rock',
    tier: ISLAND3_TRAINING_ROCK_TIER.SULFURON,
    name: 'Sulfuron Training Area',
    requiredRebirths: 100_000_000, // 100M
    requiredPower: 10_000_000_000_000_000, // 10 Qd
    uiPowerBonus: 60_000,
    formulaConstant: 1563.1250846645694,
    hitRate: 4,
    blockType: 'Sulfuron',
  },
  [ISLAND3_TRAINING_ROCK_TIER.FUMARO]: {
    id: 'fumaro-rock',
    tier: ISLAND3_TRAINING_ROCK_TIER.FUMARO,
    name: 'Fumaro Training Area',
    requiredRebirths: 250_000_000, // 250M
    requiredPower: 50_000_000_000_000_000, // 50 Qd
    uiPowerBonus: 200_000,
    formulaConstant: 5210.416948881898,
    hitRate: 4,
    blockType: 'Fumaro',
  },
  [ISLAND3_TRAINING_ROCK_TIER.CHARBITE]: {
    id: 'charbite-rock',
    tier: ISLAND3_TRAINING_ROCK_TIER.CHARBITE,
    name: 'Charbite Training Area',
    requiredRebirths: 1_000_000_000, // 1B
    requiredPower: 750_000_000_000_000_000, // 750 Qd
    uiPowerBonus: 450_000,
    formulaConstant: 11557.301919885911,
    hitRate: 4,
    blockType: 'Charbite',
  },
  [ISLAND3_TRAINING_ROCK_TIER.MINTASH]: {
    id: 'mintash-rock',
    tier: ISLAND3_TRAINING_ROCK_TIER.MINTASH,
    name: 'Mintash Training Area',
    requiredRebirths: 2_500_000_000, // 2.5B
    requiredPower: 25_000_000_000_000_000_000, // 25 Qn
    uiPowerBonus: 2_500_000,
    formulaConstant: 65491.37754602016,
    hitRate: 4,
    blockType: 'Mintash',
  },
  [ISLAND3_TRAINING_ROCK_TIER.MAGMAORB]: {
    id: 'magmaorb-rock',
    tier: ISLAND3_TRAINING_ROCK_TIER.MAGMAORB,
    name: 'Magmaorb Training Area',
    requiredRebirths: 20_000_000_000, // 20B
    requiredPower: 1_000_000_000_000_000_000_000, // 1 Sx
    uiPowerBonus: 7_500_000,
    formulaConstant: 195511.02414473664,
    hitRate: 4,
    blockType: 'Magmaorb',
  },
  [ISLAND3_TRAINING_ROCK_TIER.INFERNON]: {
    id: 'infernon-rock',
    tier: ISLAND3_TRAINING_ROCK_TIER.INFERNON,
    name: 'Infernon Training Area',
    requiredRebirths: 100_000_000_000, // 100B
    requiredPower: 50_000_000_000_000_000_000_000, // 50 Sx
    uiPowerBonus: 15_000_000,
    formulaConstant: 391022.0482894733,
    hitRate: 5,
    blockType: 'Infernon',
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
 * Calculate power gain per hit for Island 3 training rocks
 * Formula: y(x) = floor(Constant * x^(0.9993304728909983))
 * Where x = player rebirth count, y = power gained per training hit
 *
 * @param rockTier - The training rock tier
 * @param rebirthCount - Player's current rebirth count
 * @returns Power gained per hit
 */
export function calculateIsland3TrainingPowerGain(rockTier: ISLAND3_TRAINING_ROCK_TIER, rebirthCount: number): number {
  const rockData = ISLAND3_TRAINING_ROCK_DATABASE[rockTier];
  const exponent = 0.9993304728909983;

  return Math.floor(rockData.formulaConstant * Math.pow(rebirthCount, exponent));
}

/**
 * Calculate power gain per second for Island 3 training rocks
 * Formula: Power/sec = (power per hit) * (hits per second)
 *
 * @param rockTier - The training rock tier
 * @param rebirthCount - Player's current rebirth count
 * @returns Power gained per second
 */
export function calculateIsland3TrainingPowerPerSecond(rockTier: ISLAND3_TRAINING_ROCK_TIER, rebirthCount: number): number {
  const powerPerHit = calculateIsland3TrainingPowerGain(rockTier, rebirthCount);
  const rockData = ISLAND3_TRAINING_ROCK_DATABASE[rockTier];

  return powerPerHit * rockData.hitRate;
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
 * Gets Island 3 training rock data by tier
 *
 * @param tier - Training rock tier
 * @returns Training rock data or undefined if tier doesn't exist
 */
export function getIsland3TrainingRockByTier(tier: ISLAND3_TRAINING_ROCK_TIER): Island3TrainingRockData | undefined {
  return ISLAND3_TRAINING_ROCK_DATABASE[tier];
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
 * Gets all Island 3 training rocks that a player can access based on their rebirth count OR power
 *
 * @param rebirths - Player's current rebirth count
 * @param power - Player's current power
 * @returns Array of accessible training rock data
 */
export function getAccessibleIsland3TrainingRocks(rebirths: number, power: number): Island3TrainingRockData[] {
  return Object.values(ISLAND3_TRAINING_ROCK_DATABASE).filter(
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
 * Checks if a player can access an Island 3 training rock
 * Player can unlock via EITHER power requirement OR rebirth requirement
 *
 * @param tier - Training rock tier to check
 * @param rebirths - Player's current rebirth count
 * @param power - Player's current power
 * @returns True if player can access this rock
 */
export function canAccessIsland3TrainingRock(tier: ISLAND3_TRAINING_ROCK_TIER, rebirths: number, power: number): boolean {
  const rock = getIsland3TrainingRockByTier(tier);
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
 * Get block type to tier mapping for Island 3 training rocks
 * Used for auto-detection of training rocks in the world
 */
export const ISLAND3_BLOCK_TYPE_TO_TIER: Record<string, ISLAND3_TRAINING_ROCK_TIER> = {
  'Sulfuron': ISLAND3_TRAINING_ROCK_TIER.SULFURON,
  'Fumaro': ISLAND3_TRAINING_ROCK_TIER.FUMARO,
  'Charbite': ISLAND3_TRAINING_ROCK_TIER.CHARBITE,
  'Mintash': ISLAND3_TRAINING_ROCK_TIER.MINTASH,
  'Magmaorb': ISLAND3_TRAINING_ROCK_TIER.MAGMAORB,
  'Infernon': ISLAND3_TRAINING_ROCK_TIER.INFERNON,
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

/**
 * Get training rock tier from block type (Island 3)
 *
 * @param blockType - Block type string
 * @returns Training rock tier or undefined if not found
 */
export function getIsland3TierFromBlockType(blockType: string): ISLAND3_TRAINING_ROCK_TIER | undefined {
  return ISLAND3_BLOCK_TYPE_TO_TIER[blockType];
}
