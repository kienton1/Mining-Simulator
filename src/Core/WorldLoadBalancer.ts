/**
 * WorldLoadBalancer - Multi-world player distribution manager
 *
 * Handles creating multiple world instances and distributing players
 * across them using a least-populated-first algorithm.
 *
 * Key behaviors:
 * - New players join the world with the fewest players
 * - Creates new worlds when all existing worlds are at capacity
 * - Shuts down empty worlds after a grace period (keeps at least 1 active)
 * - Tracks world occupancy and provides stats
 */

import type { World, WorldManager, PlayerManager, Player, WorldMap } from 'hytopia';
import { WORLD_INSTANCE_CONFIG, DEBUG_CONFIG } from '../config/WorldInstanceConfig.js';

// Lazy-loaded HyTopia SDK singletons (only loaded when deps not injected)
let _hytopiaModule: typeof import('hytopia') | null = null;

async function getHytopiaModule(): Promise<typeof import('hytopia')> {
  if (!_hytopiaModule) {
    _hytopiaModule = await import('hytopia');
  }
  return _hytopiaModule;
}

// Cached singleton references (set on first access)
let _worldManagerInstance: IWorldManager | undefined = undefined;
let _playerManagerInstance: IPlayerManager | undefined = undefined;

/**
 * Get the default WorldManager singleton (lazy-loaded).
 * Only used when deps not injected.
 */
function getDefaultWorldManager(): IWorldManager {
  if (_worldManagerInstance === undefined) {
    // Synchronous access - module should already be loaded by game init
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const hytopia = require('hytopia');
    _worldManagerInstance = hytopia.WorldManager.instance as IWorldManager;
  }
  return _worldManagerInstance;
}

/**
 * Get the default PlayerManager singleton (lazy-loaded).
 * Only used when deps not injected.
 */
function getDefaultPlayerManager(): IPlayerManager {
  if (_playerManagerInstance === undefined) {
    // Synchronous access - module should already be loaded by game init
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const hytopia = require('hytopia');
    _playerManagerInstance = hytopia.PlayerManager.instance as IPlayerManager;
  }
  return _playerManagerInstance;
}

// ============================================================================
// Dependency Interfaces (for testability)
// ============================================================================

/** Interface for World-like objects (allows mocking in tests) */
export interface IWorld {
  id: number;
  name: string;
  tag?: string;
  start(): void;
  stop(): void;
  setAmbientLightIntensity(intensity: number): void;
  setDirectionalLightIntensity(intensity: number): void;
}

/** Interface for WorldManager-like objects (allows mocking in tests) */
export interface IWorldManager {
  createWorld(options: { name: string; skyboxUri: string; tag?: string; map?: unknown }): IWorld;
  getWorldsByTag(tag: string): IWorld[];
  getWorld(id: number): IWorld | undefined;
}

/** Interface for PlayerManager-like objects (allows mocking in tests) */
export interface IPlayerManager {
  getConnectedPlayersByWorld(world: IWorld): { id: string; username: string }[];
  worldSelectionHandler?: (player: { id: string; username: string }) => Promise<IWorld> | IWorld;
}

/** Interface for Player-like objects (allows mocking in tests) */
export interface IPlayer {
  id: string;
  username: string;
}

/** Configuration options for the load balancer */
export interface LoadBalancerConfig {
  maxPlayersPerWorld: number;
  minActiveWorlds: number;
  emptyGracePeriodMs: number;
  worldCleanupIntervalMs: number;
  worldTag: string;
  logWorldEvents: boolean;
  logPlayerAssignments: boolean;
}

/** Dependencies that can be injected for testing */
export interface LoadBalancerDependencies {
  worldManager: IWorldManager;
  playerManager: IPlayerManager;
  config: LoadBalancerConfig;
}

/** Stats for a single world instance */
export interface WorldStats {
  worldId: number;
  worldName: string;
  playerCount: number;
  maxPlayers: number;
  isFull: boolean;
}

/** Overall load balancer stats */
export interface LoadBalancerStats {
  totalWorlds: number;
  totalPlayers: number;
  maxPlayersPerWorld: number;
  worlds: WorldStats[];
}

/**
 * Manages multiple world instances with load balancing.
 *
 * Usage:
 * 1. Create instance with world map
 * 2. Call initialize() to set up the worldSelectionHandler
 * 3. Call startCleanupLoop() to enable automatic empty world cleanup
 *
 * For testing, pass LoadBalancerDependencies to inject mocks.
 */
export class WorldLoadBalancer {
  private readonly worldMap: WorldMap;
  private worldInitializer?: (world: World) => void;
  private emptyWorldTimestamps: Map<number, number> = new Map();
  private stoppedWorlds: Set<number> = new Set();  // Track stopped worlds
  private cleanupIntervalId?: ReturnType<typeof setInterval>;

  // Injected dependencies (for testability)
  private readonly deps?: LoadBalancerDependencies;

  /**
   * Create a WorldLoadBalancer.
   * @param worldMap - The world map to use for creating worlds
   * @param deps - Optional dependencies for testing (mocked WorldManager, PlayerManager, config)
   */
  constructor(worldMap: WorldMap, deps?: LoadBalancerDependencies) {
    this.worldMap = worldMap;
    this.deps = deps;
  }

  // Accessor helpers for dependencies (use injected or default to lazy-loaded singletons)
  private get worldManager(): IWorldManager {
    return this.deps?.worldManager ?? getDefaultWorldManager();
  }

  private get playerManager(): IPlayerManager {
    return this.deps?.playerManager ?? getDefaultPlayerManager();
  }

  private get config(): LoadBalancerConfig {
    return this.deps?.config ?? {
      maxPlayersPerWorld: WORLD_INSTANCE_CONFIG.MAX_PLAYERS_PER_WORLD,
      minActiveWorlds: WORLD_INSTANCE_CONFIG.MIN_ACTIVE_WORLDS,
      emptyGracePeriodMs: WORLD_INSTANCE_CONFIG.EMPTY_WORLD_GRACE_PERIOD_MS,
      worldCleanupIntervalMs: WORLD_INSTANCE_CONFIG.WORLD_CLEANUP_INTERVAL_MS,
      worldTag: WORLD_INSTANCE_CONFIG.WORLD_TAG,
      logWorldEvents: DEBUG_CONFIG.LOG_WORLD_EVENTS,
      logPlayerAssignments: DEBUG_CONFIG.LOG_PLAYER_ASSIGNMENTS,
    };
  }

  /**
   * Initialize the load balancer.
   * Sets up the worldSelectionHandler to route new players.
   *
   * @param worldInitializer - Optional callback to initialize each new world
   *                           (set lighting, register commands, etc.)
   */
  initialize(worldInitializer?: (world: World) => void): void {
    this.worldInitializer = worldInitializer;

    // Ensure at least one world exists
    this.ensureMinimumWorlds();

    // Set up the player assignment handler
    this.playerManager.worldSelectionHandler = async (player: IPlayer) => {
      return this.selectWorldForPlayer(player as Player);
    };

    if (this.config.logWorldEvents) {
      console.log('[WORLD_LOAD_BALANCER] Initialized with worldSelectionHandler');
    }
  }

  /**
   * Start the cleanup loop that checks for empty worlds.
   * Empty worlds are shut down after the grace period (keeps MIN_ACTIVE_WORLDS).
   */
  startCleanupLoop(): void {
    if (this.cleanupIntervalId) {
      return; // Already running
    }

    this.cleanupIntervalId = setInterval(() => {
      this.cleanupEmptyWorlds();
    }, this.config.worldCleanupIntervalMs);

    if (this.config.logWorldEvents) {
      console.log('[WORLD_LOAD_BALANCER] Cleanup loop started');
    }
  }

  /**
   * Stop the cleanup loop.
   */
  stopCleanupLoop(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;

      if (this.config.logWorldEvents) {
        console.log('[WORLD_LOAD_BALANCER] Cleanup loop stopped');
      }
    }
  }

  /**
   * Select the best world for a new player.
   * Algorithm: Join the world with the least players that isn't full.
   * If all worlds are full, create a new one.
   */
  private selectWorldForPlayer(player: Player): World {
    const miningWorlds = this.getMiningWorlds();

    if (miningWorlds.length === 0) {
      // No worlds exist, create the first one
      return this.createNewWorld();
    }

    // Find the world with the least players that isn't full
    let bestWorld: World | null = null;
    let lowestPlayerCount = Infinity;

    for (const world of miningWorlds) {
      // Skip stopped worlds (they're still in WorldManager but not running)
      if (this.stoppedWorlds.has(world.id)) {
        continue;
      }

      const playerCount = this.playerManager.getConnectedPlayersByWorld(world).length;

      // Skip full worlds
      if (playerCount >= this.config.maxPlayersPerWorld) {
        continue;
      }

      // Pick the world with the fewest players
      if (playerCount < lowestPlayerCount) {
        lowestPlayerCount = playerCount;
        bestWorld = world;
      }
    }

    // If no world has space, try to restart a stopped world first
    if (!bestWorld) {
      bestWorld = this.restartStoppedWorld() ?? this.createNewWorld();
    }

    if (this.config.logPlayerAssignments) {
      const playerCount = this.playerManager.getConnectedPlayersByWorld(bestWorld).length;
      console.log(
        `[WORLD_LOAD_BALANCER] Assigning player ${player.username} to world ${bestWorld.id} ` +
        `(${playerCount}/${this.config.maxPlayersPerWorld} players)`
      );
    }

    // Clear empty timestamp since a player is joining
    this.emptyWorldTimestamps.delete(bestWorld.id);

    return bestWorld;
  }

  /**
   * Try to restart a stopped world instead of creating a new one.
   * This prevents memory leaks from accumulating stopped worlds.
   * Returns the restarted world, or null if no stopped worlds exist.
   */
  private restartStoppedWorld(): World | null {
    if (this.stoppedWorlds.size === 0) {
      return null;
    }

    // Find a stopped world to restart
    const miningWorlds = this.getMiningWorlds();
    for (const world of miningWorlds) {
      if (this.stoppedWorlds.has(world.id)) {
        if (this.config.logWorldEvents) {
          console.log(`[WORLD_LOAD_BALANCER] Restarting stopped world: ${world.name} (ID: ${world.id})`);
        }

        // Remove from stopped set
        this.stoppedWorlds.delete(world.id);

        // Restart the world loop
        world.start();

        // Re-run initializer (to re-register commands, event handlers, etc.)
        if (this.worldInitializer) {
          this.worldInitializer(world as World);
        }

        const activeWorlds = this.getActiveMiningWorlds();
        console.log(
          `[WORLD_LOAD_BALANCER] World restarted: ${world.name} (ID: ${world.id}), ` +
          `${activeWorlds.length} active worlds`
        );

        return world as World;
      }
    }

    return null;
  }

  /**
   * Create a new world instance with the mining game configuration.
   */
  private createNewWorld(): World {
    const worldCount = this.getMiningWorlds().length;
    const worldName = `Mining World ${worldCount + 1}`;

    // IMPORTANT: Pass map to createWorld() so it loads in constructor BEFORE
    // the world loop starts. Calling loadMap() after createWorld() causes a
    // race condition with Rapier physics ("recursive use of an object" error).
    const world = this.worldManager.createWorld({
      name: worldName,
      skyboxUri: 'skyboxes/partly-cloudy',
      tag: this.config.worldTag,
      map: this.worldMap,
    });

    // Set up lighting
    world.setAmbientLightIntensity(0.8);
    world.setDirectionalLightIntensity(1.0);

    // Call the world initializer if provided
    if (this.worldInitializer) {
      this.worldInitializer(world as World);
    }

    if (this.config.logWorldEvents) {
      console.log(`[WORLD_LOAD_BALANCER] Created new world: ${worldName} (ID: ${world.id})`);
    }

    const activeWorlds = this.getActiveMiningWorlds();
    const totalPlayerCount = activeWorlds.reduce(
      (sum, w) => sum + this.playerManager.getConnectedPlayersByWorld(w).length,
      0
    );

    console.log(
      `[WORLD_LOAD_BALANCER] World created: ${worldName} (ID: ${world.id}), ` +
      `${activeWorlds.length} active worlds, ${totalPlayerCount} total players`
    );

    return world as World;
  }

  /**
   * Ensure at least MIN_ACTIVE_WORLDS exist.
   */
  private ensureMinimumWorlds(): void {
    const activeWorlds = this.getActiveMiningWorlds();
    const needed = this.config.minActiveWorlds - activeWorlds.length;

    for (let i = 0; i < needed; i++) {
      // Try to restart a stopped world first, otherwise create new
      if (!this.restartStoppedWorld()) {
        this.createNewWorld();
      }
    }
  }

  /**
   * Check for and clean up empty worlds beyond the minimum.
   * Worlds are shut down after being empty for EMPTY_WORLD_GRACE_PERIOD_MS.
   */
  private cleanupEmptyWorlds(): void {
    // Only check active (non-stopped) worlds
    const activeWorlds = this.getActiveMiningWorlds();
    const now = Date.now();

    // Track which worlds are empty
    for (const world of activeWorlds) {
      const playerCount = this.playerManager.getConnectedPlayersByWorld(world).length;

      if (playerCount === 0) {
        // Mark as empty if not already tracked
        if (!this.emptyWorldTimestamps.has(world.id)) {
          this.emptyWorldTimestamps.set(world.id, now);

          if (this.config.logWorldEvents) {
            console.log(`[WORLD_LOAD_BALANCER] World ${world.id} is now empty, starting grace period`);
          }
        }
      } else {
        // World has players, clear empty timestamp
        this.emptyWorldTimestamps.delete(world.id);
      }
    }

    // Shut down worlds that have been empty past the grace period
    // But keep at least MIN_ACTIVE_WORLDS
    const emptyWorldsToShutdown: World[] = [];

    for (const world of activeWorlds) {
      const emptyTimestamp = this.emptyWorldTimestamps.get(world.id);

      if (emptyTimestamp && (now - emptyTimestamp) >= this.config.emptyGracePeriodMs) {
        emptyWorldsToShutdown.push(world as World);
      }
    }

    // Calculate how many we can shut down while keeping minimum active
    const maxToShutdown = Math.max(0, activeWorlds.length - this.config.minActiveWorlds);
    const actualShutdowns = Math.min(emptyWorldsToShutdown.length, maxToShutdown);

    // Shut down the oldest empty worlds first
    emptyWorldsToShutdown
      .sort((a, b) => {
        const aTime = this.emptyWorldTimestamps.get(a.id) ?? 0;
        const bTime = this.emptyWorldTimestamps.get(b.id) ?? 0;
        return aTime - bTime; // Oldest first
      })
      .slice(0, actualShutdowns)
      .forEach(world => {
        this.shutdownWorld(world);
      });
  }

  /**
   * Shut down a world instance.
   */
  private shutdownWorld(world: World): void {
    if (this.config.logWorldEvents) {
      console.log(`[WORLD_LOAD_BALANCER] Shutting down empty world: ${world.name} (ID: ${world.id})`);
    }

    const worldPlayerCount = this.playerManager.getConnectedPlayersByWorld(world).length;

    // Avoid shutting down a world that became active again due to join races.
    if (worldPlayerCount > 0) {
      if (this.config.logWorldEvents) {
        console.log(
          `[WORLD_LOAD_BALANCER] Abort shutdown: world ${world.id} has ${worldPlayerCount} player(s)`
        );
      }
      this.emptyWorldTimestamps.delete(world.id);
      return;
    }

    const activeWorlds = this.getActiveMiningWorlds();

    console.log(
      `[WORLD_LOAD_BALANCER] World shutdown: ${world.name} (ID: ${world.id}), ` +
      `${activeWorlds.length - 1} active worlds remaining`
    );

    // Mark as stopped BEFORE stopping (so concurrent player joins don't select it)
    this.stoppedWorlds.add(world.id);

    // Stop the world loop
    world.stop();

    // Clear from tracking
    this.emptyWorldTimestamps.delete(world.id);
  }

  /**
   * Get all mining game worlds (by tag), including stopped ones.
   */
  private getMiningWorlds(): World[] {
    return this.worldManager.getWorldsByTag(this.config.worldTag) as World[];
  }

  /**
   * Get only active (non-stopped) mining game worlds.
   */
  private getActiveMiningWorlds(): World[] {
    return this.getMiningWorlds().filter(world => !this.stoppedWorlds.has(world.id));
  }

  /**
   * Get current load balancer statistics.
   * Only includes active (non-stopped) worlds.
   */
  getStats(): LoadBalancerStats {
    const miningWorlds = this.getActiveMiningWorlds();
    const worldStats: WorldStats[] = miningWorlds.map(world => {
      const playerCount = this.playerManager.getConnectedPlayersByWorld(world).length;
      return {
        worldId: world.id,
        worldName: world.name,
        playerCount,
        maxPlayers: this.config.maxPlayersPerWorld,
        isFull: playerCount >= this.config.maxPlayersPerWorld,
      };
    });

    const totalPlayers = worldStats.reduce((sum, ws) => sum + ws.playerCount, 0);

    return {
      totalWorlds: miningWorlds.length,
      totalPlayers,
      maxPlayersPerWorld: this.config.maxPlayersPerWorld,
      worlds: worldStats,
    };
  }

  /**
   * Get a specific world by ID.
   */
  getWorld(worldId: number): World | undefined {
    return this.worldManager.getWorld(worldId) as World | undefined;
  }

  /**
   * Get all active mining worlds.
   */
  getAllWorlds(): World[] {
    return this.getActiveMiningWorlds();
  }

  /**
   * Check if a world is stopped.
   */
  isWorldStopped(worldId: number): boolean {
    return this.stoppedWorlds.has(worldId);
  }
}
