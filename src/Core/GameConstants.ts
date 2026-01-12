/**
 * Game Constants
 * 
 * Contains all global game constants and formula constants.
 * These values are used throughout the game for calculations.
 * 
 * Reference: Planning/gameOverview.txt sections 2, 3, 4, 6, 10
 */

/**
 * Power System Constants
 * 
 * DEPRECATED: POWER_SCALING_CONSTANT and REBIRTH_MULTIPLIER_PER_REBIRTH are no longer used.
 * 
 * NEW SYSTEM (from PowerSystemPlan.md):
 * - Damage Formula: EarlyBoost = 1 + 2 / (1 + (Power / 398107.17)^0.3)
 *                    Damage = 1 + 0.072 * Power^0.553 * EarlyBoost
 * - Power gain uses piecewise functions based on rock tier and rebirth count
 * - Rebirths unlock training rocks and scale power gain per rock (no direct multiplier)
 * 
 * See StatCalculator.ts for actual implementation.
 */
export const BASE_POWER_GAIN = 1; // DEPRECATED - kept for backwards compatibility only
/** @deprecated No longer used - damage now uses power-based formula. See StatCalculator.calculateMiningDamage() */
export const POWER_SCALING_CONSTANT = 5;
/** @deprecated No longer used - rebirths now unlock rocks and scale rock power gain, no direct multiplier */
export const REBIRTH_MULTIPLIER_PER_REBIRTH = 0.10;

/**
 * Rebirth System Constants
 */
export const REBIRTH_POWER_THRESHOLD = 1000; // Minimum power required to rebirth (configurable)

/**
 * Mining System Constants
 */
export const MINE_RESET_TIME_SECONDS = 120; // 2 minutes in seconds
export const MINE_DEPTH_START = 0; // Starting depth for mines (Y coordinate)
export const BLOCKS_PER_MINE_LEVEL = 3; // Each mine level is 3 blocks tall (7x3x7)

/**
 * Swing Rate Constants
 * Base swing rate is 2.0 swings/second (1 hit per 0.5 seconds)
 * This is the slowest possible mining speed
 * Reference: Planning/ProgressionBalanceBlueprint.md section 1
 */
export const BASE_SWING_RATE = 1 / 0.5; // 2.0 swings per second (1 hit per 0.5 seconds)

/**
 * DEPRECATED: Old depth-based HP scaling constants
 * 
 * NEW SYSTEM (Linear Scaling): Ores now have firstHealth and lastHealth properties
 * Health scales linearly from firstDepth to lastDepth (1000) using interpolation
 * Formula: HP = FirstHealth + ((CurrentDepth - FirstDepth) / (LastDepth - FirstDepth)) × (LastHealth - FirstHealth)
 * 
 * See src/Mining/Ore/World1OreData.ts for the new system
 * Reference: Planning/ProgressionBalanceBlueprint.md section 2
 */
// export const DEPTH_HP_SCALING = 0.1; // DEPRECATED - No longer used
// export const DEPTH_SCALING_INTERVAL = 100; // DEPRECATED - No longer used

/**
 * Note: Ore rarity, values, and health scaling are now in ORE_DATABASE
 * See src/Mining/Ore/OreData.ts for all 24 ores with linear scaling
 */

/**
 * Training Rock Constants
 * Base power gain per hit for each training rock tier (for UI display)
 * NOTE: Actual power gain uses piecewise functions based on rebirths
 * These values are shown in the UI as approximate power gains
 * Reference: Planning/PowerSystemPlan.md section 4
 */
export const TRAINING_ROCK_MULTIPLIERS = {
  DIRT: 1,              // Rock 1 - Shows "+1 Power" in UI
  COBBLESTONE: 3,       // Rock 2 - Shows "+3 Power" in UI
  IRON_DEEPSLATE: 15,   // Rock 3 - Shows "+15 Power" in UI
  GOLD_DEEPSLATE: 45,   // Rock 4 - Shows "+45 Power" in UI
  DIAMOND_DEEPSLATE: 80, // Rock 5 - Shows "+80 Power" in UI
  EMERALD_DEEPSLATE: 175, // Rock 6 - Shows "+175 Power" in UI
} as const;

/**
 * Training Rock Required Rebirths
 * Number of rebirths needed to access each training rock (alternative unlock path)
 * Reference: Planning/PowerSystemPlan.md section 4
 */
export const TRAINING_ROCK_REQUIRED_REBIRTHS = {
  DIRT: 0,           // Rock 1 - Always available
  COBBLESTONE: 5,    // Rock 2
  IRON_DEEPSLATE: 15, // Rock 3
  GOLD_DEEPSLATE: 50, // Rock 4
  DIAMOND_DEEPSLATE: 250, // Rock 5
  EMERALD_DEEPSLATE: 1000, // Rock 6
} as const;

/**
 * Training Rock Power Requirements
 * Amount of power needed to access each training rock (alternative to rebirth requirement)
 * Players can unlock via EITHER power OR rebirths
 * Reference: Planning/PowerSystemPlan.md section 4
 */
export const TRAINING_ROCK_POWER_REQUIREMENTS = {
  DIRT: 0,           // Rock 1 - Always available
  COBBLESTONE: 250,  // Rock 2
  IRON_DEEPSLATE: 5000, // Rock 3
  GOLD_DEEPSLATE: 75000, // Rock 4
  DIAMOND_DEEPSLATE: 500000, // Rock 5
  EMERALD_DEEPSLATE: 10000000, // Rock 6
} as const;

/**
 * Map Structure Constants
 * Block types used in the map for identification
 */
export const MAP_BLOCKS = {
  TRAINING_ROCK: 'cobbled-deepslate', // Cobbled-deepslate clusters = training rocks
  MINE_ENTRANCE: 'gold-block', // Gold blocks = mine entrance/portal (now stone blocks)
} as const;

/**
 * Mining Area Coordinates
 * Defines the bounds of the mining area where players can mine stone blocks
 * 
 * Coordinates format: { x, y, z }
 * All stone blocks (ID 8) within these bounds are mineable
 */
export const MINING_AREA_BOUNDS = {
  /** Minimum X coordinate */
  minX: -4,
  /** Maximum X coordinate */
  maxX: 2,
  /** Y coordinate (surface level) */
  y: 0,
  /** Minimum Z coordinate */
  minZ: 16,
  /** Maximum Z coordinate */
  maxZ: 22,
} as const;

/**
 * Mining Area Block Positions
 * List of all block positions in the mining area
 * Format: Array of { x, y, z } coordinates
 * 
 * Current mining area spans:
 * - X: -4 to 2 (7 columns)
 * - Z: 16 to 22 (7 rows)
 * - Y: 0 (surface level)
 */
export const MINING_AREA_POSITIONS: Array<{ x: number; y: number; z: number }> = [
  // X = -4
  { x: -4, y: 0, z: 16 }, { x: -4, y: 0, z: 17 }, { x: -4, y: 0, z: 18 }, { x: -4, y: 0, z: 19 },
  { x: -4, y: 0, z: 20 }, { x: -4, y: 0, z: 21 }, { x: -4, y: 0, z: 22 },
  // X = -3
  { x: -3, y: 0, z: 16 }, { x: -3, y: 0, z: 17 }, { x: -3, y: 0, z: 18 }, { x: -3, y: 0, z: 19 },
  { x: -3, y: 0, z: 20 }, { x: -3, y: 0, z: 21 }, { x: -3, y: 0, z: 22 },
  // X = -2
  { x: -2, y: 0, z: 16 }, { x: -2, y: 0, z: 17 }, { x: -2, y: 0, z: 18 }, { x: -2, y: 0, z: 19 },
  { x: -2, y: 0, z: 20 }, { x: -2, y: 0, z: 21 }, { x: -2, y: 0, z: 22 },
  // X = -1
  { x: -1, y: 0, z: 16 }, { x: -1, y: 0, z: 17 }, { x: -1, y: 0, z: 18 }, { x: -1, y: 0, z: 19 },
  { x: -1, y: 0, z: 20 }, { x: -1, y: 0, z: 21 }, { x: -1, y: 0, z: 22 },
  // X = 0
  { x: 0, y: 0, z: 16 }, { x: 0, y: 0, z: 17 }, { x: 0, y: 0, z: 18 }, { x: 0, y: 0, z: 19 },
  { x: 0, y: 0, z: 20 }, { x: 0, y: 0, z: 21 }, { x: 0, y: 0, z: 22 },
  // X = 1
  { x: 1, y: 0, z: 16 }, { x: 1, y: 0, z: 17 }, { x: 1, y: 0, z: 18 }, { x: 1, y: 0, z: 19 },
  { x: 1, y: 0, z: 20 }, { x: 1, y: 0, z: 21 }, { x: 1, y: 0, z: 22 },
  // X = 2
  { x: 2, y: 0, z: 16 }, { x: 2, y: 0, z: 17 }, { x: 2, y: 0, z: 18 }, { x: 2, y: 0, z: 19 },
  { x: 2, y: 0, z: 20 }, { x: 2, y: 0, z: 21 }, { x: 2, y: 0, z: 22 },
];

/**
 * Shared Mine Shaft (public drop-in hole)
 * Players jump down this 10-block-deep shaft; a trigger at the bottom
 * teleports them into their personal mine instance.
 */
export const SHARED_MINE_SHAFT = {
  bounds: {
    minX: MINING_AREA_BOUNDS.minX,
    maxX: MINING_AREA_BOUNDS.maxX,
    minZ: MINING_AREA_BOUNDS.minZ,
    maxZ: MINING_AREA_BOUNDS.maxZ,
  },
  topY: 0,
  bottomY: -10,
  /** Blocks of fall before teleporting to personal mine */
  teleportAfterDropBlocks: 5,
  /** Y threshold where we teleport (derived from topY - teleportAfterDropBlocks) */
  teleportThresholdY: -5.5,
} as const;

/**
 * Island 2 (Beach World) Mining Area Coordinates
 * Defines the bounds of the mining area where players can mine stone blocks in the beach world
 * 
 * Coordinates format: { x, y, z }
 * Volume defined by: (-285,0,23), (-291,1,17), (-285,1,17), (-291,1,23)
 */
export const ISLAND2_MINING_AREA_BOUNDS = {
  /** Minimum X coordinate */
  minX: -291,
  /** Maximum X coordinate */
  maxX: -285,
  /** Y coordinate (surface level) */
  y: 0,
  /** Minimum Z coordinate */
  minZ: 17,
  /** Maximum Z coordinate */
  maxZ: 23,
} as const;

/**
 * Island 2 (Beach World) Shared Mine Shaft (public drop-in hole)
 * Players jump down this 10-block-deep shaft; a trigger at the bottom
 * teleports them into their personal mine instance.
 */
export const ISLAND2_SHARED_MINE_SHAFT = {
  bounds: {
    minX: ISLAND2_MINING_AREA_BOUNDS.minX,
    maxX: ISLAND2_MINING_AREA_BOUNDS.maxX,
    minZ: ISLAND2_MINING_AREA_BOUNDS.minZ,
    maxZ: ISLAND2_MINING_AREA_BOUNDS.maxZ,
  },
  topY: 0,
  bottomY: -10,
  /** Blocks of fall before teleporting to personal mine */
  teleportAfterDropBlocks: 5,
  /** Y threshold where we teleport (derived from topY - teleportAfterDropBlocks) */
  teleportThresholdY: -5.5,
} as const;

/**
 * Spacing (in blocks) between per-player mine instances when using spatial offsets.
 * Keep large enough to avoid accidental overlap between players.
 */
export const MINE_INSTANCE_SPACING = 256;

