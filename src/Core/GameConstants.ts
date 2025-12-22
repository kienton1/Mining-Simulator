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
 * POWER_SCALING_CONSTANT: Controls how much power affects mining damage
 * Lower values = power has more impact (faster progression)
 * Balanced to allow ~10 seconds training to one-hit stone while maintaining meaningful progression
 * 
 * Formula: MiningDamage = PickaxeDamage × (1 + Power / POWER_SCALING_CONSTANT)
 * 
 * With POWER_SCALING_CONSTANT = 5:
 * - 20 power (10 sec training) = 1 × (1 + 20/5) = 5 damage (takes ~20 hits for stone)
 * - 95 power (~48 sec) = 1 × (1 + 95/5) = 20 damage (takes ~5 hits for stone)
 * - 495 power (~4 min) = 1 × (1 + 495/5) = 100 damage (one-hits stone)
 * - Coal (150 HP): Requires ~750 power (~6.25 min) to one-hit
 */
export const BASE_POWER_GAIN = 1; // Base power gained per hit
export const POWER_SCALING_CONSTANT = 5; // Used in mining damage formula (balanced for progression)
export const REBIRTH_MULTIPLIER_PER_REBIRTH = 0.10; // +10% per rebirth

/**
 * Rebirth System Constants
 */
export const REBIRTH_POWER_THRESHOLD = 1000; // Minimum power required to rebirth (configurable)

/**
 * Mining System Constants
 */
export const MINE_RESET_TIME_SECONDS = 120; // 2 minutes in seconds
export const MINE_DEPTH_START = 0; // Starting depth for mines

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
 * See src/Mining/Ore/OreData.ts for the new system
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
 * Base power gain per hit for each training rock tier
 * These are the base values before rebirth multiplier is applied
 */
export const TRAINING_ROCK_MULTIPLIERS = {
  STONE: 1,
  IRON: 3,
  GOLD: 15,
  DIAMOND: 40,
  CRYSTAL: 60,
} as const;

/**
 * Training Rock Required Rebirths
 * Number of rebirths needed to access each training rock
 */
export const TRAINING_ROCK_REQUIRED_REBIRTHS = {
  STONE: 0,
  IRON: 5,
  GOLD: 15,
  DIAMOND: 50,
  CRYSTAL: 150,
} as const;

/**
 * Training Rock Power Requirements
 * Amount of power needed to access each training rock (alternative to rebirth requirement)
 */
export const TRAINING_ROCK_POWER_REQUIREMENTS = {
  STONE: 0,
  IRON: 1000,
  GOLD: 5000,
  DIAMOND: 20000,
  CRYSTAL: 50000,
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
 * Spacing (in blocks) between per-player mine instances when using spatial offsets.
 * Keep large enough to avoid accidental overlap between players.
 */
export const MINE_INSTANCE_SPACING = 256;

