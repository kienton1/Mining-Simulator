/**
 * World Instance Management Configuration
 *
 * Controls multi-world load balancing behavior for Mining Simulator.
 * Players are distributed across world instances using a least-populated-first algorithm.
 */

/**
 * Multi-world configuration for player load balancing
 */
export const WORLD_INSTANCE_CONFIG = {
  /**
   * Maximum players allowed per world instance.
   * When a world reaches this capacity, new players join a different world.
   */
  MAX_PLAYERS_PER_WORLD: 10,

  /**
   * Minimum number of worlds to keep active.
   * At least one world is always ready for new players.
   */
  MIN_ACTIVE_WORLDS: 1,

  /**
   * Grace period (ms) before shutting down an empty world.
   * Prevents rapid create/destroy cycles when players leave.
   * 30 seconds default.
   */
  EMPTY_WORLD_GRACE_PERIOD_MS: 30_000,

  /**
   * Interval (ms) for checking world occupancy and cleanup.
   * Every 10 seconds, check for empty worlds to tear down.
   */
  WORLD_CLEANUP_INTERVAL_MS: 10_000,

  /**
   * World tag used for mining simulator instances.
   * Used by WorldManager to identify and query mining worlds.
   */
  WORLD_TAG: "mining-simulator",
} as const;

/**
 * Debug/development configuration for world management
 */
export const DEBUG_CONFIG = {
  /**
   * Enable verbose logging for world management events.
   * (world creation, shutdown, restart)
   */
  LOG_WORLD_EVENTS: true,

  /**
   * Enable verbose logging for player world assignments.
   * (which world each player is assigned to)
   */
  LOG_PLAYER_ASSIGNMENTS: true,
} as const;

/**
 * Type exports for external use
 */
export type WorldInstanceConfig = typeof WORLD_INSTANCE_CONFIG;
export type DebugConfig = typeof DEBUG_CONFIG;
