/**
 * Mining System
 * 
 * Handles the core mining mechanics: raycast-based block mining with left click.
 * Tracks block HP per position and handles ore collection.
 * 
 * Reference: Planning/gameOverview.txt section 6.1, 6.2
 */

import { World, Player, Entity, RigidBodyType, ParticleEmitter, ColliderShape, CollisionGroup } from 'hytopia';
import { calculateMiningDamage, getSwingsPerSecond } from '../Stats/StatCalculator';
import type { PickaxeData } from '../Pickaxe/PickaxeData';
import type { PlayerData } from '../Core/PlayerData';
import { getBonuses } from '../Achievements/Achievements';
import { OreType, ORE_DATABASE } from './Ore/World1OreData';
import { ISLAND2_ORE_DATABASE, ISLAND2_ORE_TYPE } from './Ore/World2OreData';
import { ISLAND3_ORE_DATABASE, ISLAND3_ORE_TYPE } from './Ore/World3OreData';
import { ISLAND4_ORE_DATABASE, ISLAND4_ORE_TYPE } from './Ore/World4OreData';
import { ISLAND5_ORE_DATABASE, ISLAND5_ORE_TYPE } from './Ore/World5OreData';
import { OreGenerator } from './Ore/OreGenerator';
import { MineBlock } from './MineBlock';
import { ChestBlock, ChestType } from './ChestBlock';
import { DebrisManager } from './DebrisManager';
import { MINING_AREA_BOUNDS, MINING_AREA_POSITIONS, MINE_DEPTH_START, MINE_INSTANCE_SPACING, BLOCKS_PER_MINE_LEVEL, ISLAND2_MINING_AREA_BOUNDS, ISLAND3_MINING_AREA_BOUNDS, ISLAND4_MINING_AREA_BOUNDS, ISLAND5_MINING_AREA_BOUNDS } from '../Core/GameConstants';

/** Set to true to enable verbose mining debug logging. */
const DEBUG_MINING = false;
/** Toggle to use the entity pooling logic from MiningSystemWithEntityPooling. */
const USE_ENTITY_POOLING = true;
const FLOOR_ENTITY_POOL_SIZE = 4;
const FLOOR_ENTITY_HALF_EXTENTS = { x: 4.0, y: 0.5, z: 4.0 };
const POOLED_ENTITY_HALF_EXTENTS = { x: 4.0, y: 1.5, z: 4.0 };

/**
 * Mining block position key (x,y,z)
 */
type BlockPositionKey = string;

/**
 * Mining state for a player
 */
/** Level content type for entity pooling */
interface LevelContent {
  type: 'ore' | 'chest';
  value: string; // Ore type name or ChestType value
}

interface PooledFloorEntity {
  entity: Entity;
  mineLevel: number;
  content: LevelContent;
}

interface MiningState {
  /** Map of block positions to their MineBlock instances */
  blockMap: Map<BlockPositionKey, MineBlock>;

  /** Map of chest positions to their ChestBlock instances */
  chestMap: Map<BlockPositionKey, ChestBlock>;

  /** Currently targeted block position (if any) */
  currentTargetBlock: BlockPositionKey | null;

  /** Last hit timestamp (for cooldown) */
  lastHitTime: number;

  /** Mining cooldown interval ID */
  miningIntervalId?: NodeJS.Timeout;

  /** Current mining depth/level (Y coordinate) */
  currentDepth: number;

  /** Set of depths that have been generated */
  generatedDepths: Set<number>;

  /** Deepest depth that has been generated (most negative) */
  deepestGeneratedDepth: number;

  /** World-space offset applied to this player's personal mine */
  offset: { x: number; z: number };

  /** Whether the overhead dirt ceiling was built */
  ceilingBuilt: boolean;

  /** Depth of the bottommost floor (10 blocks below currentDepth) */
  bottomFloorDepth: number | null;

  /** Whether win condition has been triggered (prevents multiple triggers) */
  winTriggered?: boolean;

  /** Single BlockEntity representing the mine floor (7×3×7 block) - optimized approach */
  mineFloorEntity?: Entity;

  /** Whether the current level is a chest (for texture handling) */
  currentLevelIsChest?: boolean;

  /** Type of current chest (if currentLevelIsChest is true) */
  currentChestType?: ChestType;

  /** Current ore type for the floor entity (for texture tracking) */
  currentOreType?: string;

  /** Pool of floor entities (leapfrog) for the mine column */
  floorEntityPool: PooledFloorEntity[];

  /** Sequence of ore/chest types for generated levels: mineLevel -> content type */
  levelSequence: Map<number, LevelContent>;

  /** Pool of entities for each ore type (entity pooling mode) */
  oreEntityPool: Map<string, Entity>;

  /** Pool of entities for each chest type (entity pooling mode) */
  chestEntityPool: Map<ChestType, Entity>;

  /** Next occurrence tracking for pooled entities (entity pooling mode) */
  nextOccurrence: Map<string, number>;
}

/**
 * Mining System class
 * Manages mining state and block HP tracking for all players
 */
export class MiningSystem {
  private miningStates: Map<Player, MiningState> = new Map();
  private mineOffsets: Map<string, { x: number; z: number }> = new Map(); // Key: `${player.id}:${worldId}`
  private nextInstanceIndexPerWorld: Map<string, number> = new Map(); // Track instance indices per world
  private world: World;
  private getPlayerDataCallback?: (player: Player) => PlayerData | undefined;
  private firstBlockMined: Map<Player, boolean> = new Map();
  private onFirstBlockMinedCallback?: (player: Player) => void;
  private getPickaxeCallback?: (player: Player) => PickaxeData | undefined;
  private getMinerOreLuckBonusCallback?: (player: Player) => number; // Returns percentage (e.g., 5 = +5%)
  private getCombinedDamageMultiplierCallback?: (player: Player) => number; // Returns combined damage multiplier
  private oreGenerator: OreGenerator;
  private debrisManager: DebrisManager;
  
  /** Mining block type ID (stone = 8) - DEPRECATED: Use getBlockIdForOreType instead */
  private readonly MINING_BLOCK_TYPE_ID = 8;
  
  /**
   * Mapping from OreType to block type ID
   * Island 1 ores: Block IDs 16-39 from map.json
   * Island 2 ores: Block IDs 45-68 from map.json
   * Island 3 ores: Block IDs 73-96 from map.json
   * Island 4 ores: Block IDs 103-122 from map.json
   * Island 5 ores: Block IDs 127-146 from map.json
   */
  private readonly ORE_TO_BLOCK_ID: Map<string, number> = new Map([
    // Island 1 ores (OreType)
    ['stone', 16],
    ['deepslate', 17],
    ['coal', 18],
    ['iron', 19],
    ['tin', 20],
    ['cobalt', 21],
    ['pyrite', 22],
    ['gold', 23],
    ['obsidian', 24],
    ['ruby', 25],
    ['diamond', 26],
    ['amber', 27],
    ['quartz', 28],
    ['topaz', 29],
    ['emerald', 30],
    ['relic', 31],
    ['amethyst', 32],
    ['sapphire', 33],
    ['luminite', 34],
    ['prismatic', 35],
    ['sunstone', 36],
    ['mithrial', 37],
    ['astralite', 38],
    ['dragonstone', 39],
    // Island 2 ores (ISLAND2_ORE_TYPE) - Block IDs 45-68 from map.json
    ['dunestone', 45],     // Dunestone
    ['barnacite', 46],     // Barnacite
    ['prismarine', 47],    // Prismarine
    ['basaltite', 48],     // Basaltite
    ['wreckite', 49],      // Wreckite
    ['tradewindite', 50],  // Tradewindite
    ['driftite', 51],      // Driftite
    ['anchorite', 52],     // Anchorite
    ['seaglassium', 53],   // Seaglassium
    ['shellchromite', 54], // Shellchromite
    ['turtlite', 55],      // Turtlite
    ['opalstone', 56],     // Opalstone
    ['azurite', 57],       // Azurite
    ['mangrovite', 58],    // Mangrovite
    ['reefium', 59],       // Reefium
    ['kelpite', 60],       // Kelpite
    ['sunstonite', 61],    // Sunstonite
    ['riptidite', 62],     // Riptidite
    ['trenchite', 63],     // Trenchite
    ['stormium', 64],      // Stormium
    ['lavastone', 65],     // Lavastone
    ['biolumite', 66],     // Biolumite
    ['oceanium', 67],      // Oceanium
    ['palmitite', 68],     // Palmitite
    // Island 3 ores (Volcanic) - Block IDs 73-96 from map.json
    ['sulfuron', 73],      // Sulfuron
    ['fumaro', 74],        // Fumaro
    ['charbite', 75],      // Charbite
    ['mintash', 76],       // Mintash
    ['magmaorb', 77],      // Magmaorb
    ['infernon', 78],      // Infernon
    ['ashrock', 79],       // Ashrock
    ['cindrel', 80],       // Cindrel
    ['pyrestone', 81],     // Pyrestone
    ['emberite', 82],      // Emberite
    ['scorix', 83],        // Scorix
    ['heatstone', 84],     // Heatstone
    ['caldera', 85],       // Caldera
    ['vitrin', 86],        // Vitrin
    ['brimmet', 87],       // Brimmet
    ['nightash', 88],      // Nightash
    ['spirec', 89],        // Spirec
    ['ventara', 90],       // Ventara
    ['lapillo', 91],       // Lapillo
    ['tuffen', 92],        // Tuffen
    ['searin', 93],        // Searin
    ['cinderop', 94],      // Cinderop
    ['coreflare', 95],     // Coreflare
    ['darkglow', 96],      // Darkglow
    // Island 4 ores (Snow) - Block IDs 103-122 from map.json
    [ISLAND4_ORE_TYPE.FROSTBRICK, 103],         // Frostbrick
    [ISLAND4_ORE_TYPE.SNOWSPICE, 109],          // Snowspice
    [ISLAND4_ORE_TYPE.TINSEL_LEAD, 110],        // Tinsel Lead
    [ISLAND4_ORE_TYPE.EVERGREEN_CRYSTAL, 104],  // Evergreen Crystal
    [ISLAND4_ORE_TYPE.ICICLE_STEEL, 111],       // Icicle Steel
    [ISLAND4_ORE_TYPE.CANDYCANE_VEIN, 112],     // Candycane Vein
    [ISLAND4_ORE_TYPE.HEARTHFIRE_CRYSTAL, 113], // Hearthfire Crystal
    [ISLAND4_ORE_TYPE.STARFLARE, 105],          // Starflare
    [ISLAND4_ORE_TYPE.NORTHSTAR_PLATINUM, 114], // Northstar Platinum
    [ISLAND4_ORE_TYPE.TWINKLEITE, 115],         // Twinkleite
    [ISLAND4_ORE_TYPE.SNOWMOON_ORE, 116],       // Snowmoon Ore
    [ISLAND4_ORE_TYPE.COAL_OF_YULE, 106],       // Coal of Yule
    [ISLAND4_ORE_TYPE.RUDOLPHS_EYE, 117],       // Rudolph's Eye
    [ISLAND4_ORE_TYPE.YULETIDE_EMBERSTONE, 118], // Yuletide Emberstone
    [ISLAND4_ORE_TYPE.JINGLEVOLT_ORE, 119],     // Jinglevolt Ore
    [ISLAND4_ORE_TYPE.MOLTEN_COCOA_STONE, 107], // Molten Cocoa Stone
    [ISLAND4_ORE_TYPE.CANDLELIGHT_CRYSTAL, 120], // Candlelight Crystal
    [ISLAND4_ORE_TYPE.AURORALIGHT_ORE, 121],    // Auroralight Ore
    [ISLAND4_ORE_TYPE.FIRESNOW_CORE, 122],      // Firesnow Core
    [ISLAND4_ORE_TYPE.SUGARPLUM_QUARTZ, 108],   // Sugarplum Quartz
    // Island 5 ores (Void Village) - Block IDs 127-146 from map.json
    [ISLAND5_ORE_TYPE.VOID_DUST, 143],              // Void_Dust
    [ISLAND5_ORE_TYPE.BLACKSTONE_SHARD, 133],         // Blackstone_Shard
    [ISLAND5_ORE_TYPE.NULL_PEBBLE, 138],            // Null_Pebble
    [ISLAND5_ORE_TYPE.ECLIPSE_SAND, 127],             // Eclipse_Sand
    [ISLAND5_ORE_TYPE.UMBRAL_CLAY, 141],           // Umbral_Clay
    [ISLAND5_ORE_TYPE.GLOOM_QUARTZ, 135],        // Gloom_Quartz
    [ISLAND5_ORE_TYPE.RIFTSTONE, 139],        // Riftstone
    [ISLAND5_ORE_TYPE.ABYSSAL_BASALT, 128],          // Abyssal_Basalt
    [ISLAND5_ORE_TYPE.SHADOWGLASS, 140],            // Shadowglass
    [ISLAND5_ORE_TYPE.MIDNIGHT_OBSIDIAN, 137],          // Midnight_Obsidian
    [ISLAND5_ORE_TYPE.VEIL_CRYSTAL, 142],          // Veil_Crystal
    [ISLAND5_ORE_TYPE.WRAITH_ORE, 129],            // Wraith_Ore
    [ISLAND5_ORE_TYPE.SINGULARITY_FRAGMENT, 130],        // Singularity_Fragment
    [ISLAND5_ORE_TYPE.EVENTIDE_PRISM, 134],        // Eventide_Prism
    [ISLAND5_ORE_TYPE.GRAVITY_CORE, 136],        // Gravity_Core
    [ISLAND5_ORE_TYPE.ANTIMATTER_NODULE, 131],         // Antimatter_Nodule
    [ISLAND5_ORE_TYPE.DARKSTAR_ALLOY, 144],       // Darkstar_Alloy
    [ISLAND5_ORE_TYPE.VOIDHEART_GEM, 146],     // Voidheart_Gem
    [ISLAND5_ORE_TYPE.REALITY_TEAR, 145],        // Reality_Tear
    [ISLAND5_ORE_TYPE.OBLIVIONITE, 132],     // Oblivionite
  ]);
  
  /** Dirt block type ID for walls (dirt = 9) */
  private readonly DIRT_BLOCK_TYPE_ID = 9;
  private readonly DEEPSLATE_COBBLE_BLOCK_TYPE_ID = 2;
  
  /** Basic chest block type ID */
  private readonly BASIC_CHEST_BLOCK_TYPE_ID = 10;
  
  /** Golden chest block type ID */
  private readonly GOLDEN_CHEST_BLOCK_TYPE_ID = 11;

  /** Unminable gold block type ID for win condition */
  private readonly UNMINABLE_GOLD_BLOCK_TYPE_ID = 40;
  
  /** Callback for when a chest is broken (to award gems) */
  private onChestBrokenCallback?: (player: Player, gems: number) => void;

  /** Callback for when player reaches the win condition */
  private onWinCallback?: (player: Player) => void;
  
  /** Maximum mining distance */
  private readonly MAX_MINING_DISTANCE = 250;

  /** Initial mine levels to generate when (re)building a mine */
  private readonly INITIAL_MINE_LEVELS = 40;

  /** Mine levels to clear on reset (keeps deeper levels for perf) */
  private readonly RESET_CLEAR_MINE_LEVELS = 80;

  /** Whether to spawn manual debug markers for raycasts */
  private readonly DEBUG_RAYCAST_MARKERS_ENABLED = false; // Disabled - causes collision issues
  private readonly DEBUG_RAYCAST_MARKER_SEGMENTS = 12;
  private readonly DEBUG_RAYCAST_MARKER_LIFETIME_MS = 200;

  constructor(world: World) {
    this.world = world;
    this.oreGenerator = new OreGenerator();
    this.debrisManager = new DebrisManager(world);
  }

  /**
   * Sets callback to get player data
   * 
   * @param callback - Function to get player data
   */
  setPlayerDataCallback(callback: (player: Player) => PlayerData | undefined): void {
    this.getPlayerDataCallback = callback;
  }

  /**
   * Sets callback for when first block is mined (to start timer)
   * 
   * @param callback - Function to call when first block is mined
   */
  setFirstBlockMinedCallback(callback: (player: Player) => void): void {
    this.onFirstBlockMinedCallback = callback;
  }

  /**
   * Resets the first block mined flag for a player
   * This should be called when resetting the mine depth (e.g., when teleporting to a new world)
   * 
   * @param player - Player to reset flag for
   */
  resetFirstBlockMined(player: Player): void {
    this.firstBlockMined.delete(player);
  }

  /**
   * Sets callback to get player's pickaxe
   * 
   * @param callback - Function to get player's pickaxe
   */
  setGetPickaxeCallback(callback: (player: Player) => PickaxeData | undefined): void {
    this.getPickaxeCallback = callback;
  }

  setGetMinerOreLuckBonusCallback(callback: (player: Player) => number): void {
    this.getMinerOreLuckBonusCallback = callback;
  }

  /**
   * Sets callback to get combined damage multiplier (for chest HP initialization)
   */
  setGetCombinedDamageMultiplierCallback(callback: (player: Player) => number): void {
    this.getCombinedDamageMultiplierCallback = callback;
  }

  /**
   * Sets callback for when a chest is broken (to award gems)
   *
   * @param callback - Function called when chest is broken (player, gems)
   */
  setChestBrokenCallback(callback: (player: Player, gems: number) => void): void {
    this.onChestBrokenCallback = callback;
  }

  /**
   * Sets callback for when player reaches the win condition
   *
   * @param callback - Function called when player reaches the bottom (player)
   */
  setWinCallback(callback: (player: Player) => void): void {
    this.onWinCallback = callback;
  }

  /**
   * Handles left click input for mining
   * Performs raycast to detect mining blocks and deals damage
   * 
   * @param player - Player who clicked
   * @param pickaxe - Player's current pickaxe
   * @param onOreMined - Callback when ore is mined
   * @param onDamageDealt - Callback when damage is dealt
   */
  handleMiningClick(
    player: Player,
    pickaxe: PickaxeData,
    onOreMined: (player: Player, oreType: string, amount: number) => void,
    onDamageDealt: (player: Player, damage: number, currentOre: string | null, blockHP: number, maxHP: number, isChest?: boolean, chestType?: string | null, gemReward?: number | null) => void,
    damageMultiplier: number = 1.0,
    isBlockingModalOpen?: () => boolean,
    isAutoMining: boolean = false,
    onBlockDestroyed?: (player: Player) => void
  ): void {
    // First check if player is in the mine - if not, do nothing
    const existingState = this.miningStates.get(player);
    if (!existingState) {
      // Player is not in the mine, ignore mining click
      if (DEBUG_MINING) console.log('[MiningSystem] handleMiningClick: No mining state for player', player.username);
      return;
    }

    // Player is in the mine, proceed with mining
    // Check if blocking modal is open (if callback provided)
    if (isBlockingModalOpen && isBlockingModalOpen()) {
      if (DEBUG_MINING) console.log('[MiningSystem] handleMiningClick: Blocking modal open');
      return;
    }

    const playerEntity = this.getPlayerEntity(player);
    if (!playerEntity) {
      if (DEBUG_MINING) console.log('[MiningSystem] handleMiningClick: No player entity');
      return;
    }

    // Check if player.camera exists
    if (!player.camera) {
      if (DEBUG_MINING) console.log('[MiningSystem] handleMiningClick: No player camera');
      return;
    }

    // Use existing mining state (we already verified it exists above)
    const state = existingState;

    // RATE LIMITING: Enforce swing rate based on speed + world curve
    // Calculate minimum time between hits (in milliseconds)
    // Formula: SPS = getSwingsPerSecond(speed, world)
    const worldId = this.getPlayerWorldId(player);
    const worldNumber = this.getWorldNumberFromId(worldId);
    const pd = this.getPlayerDataCallback?.(player);
    const miningSpeedMult = pd ? (getBonuses(pd).miningSpeedMultiplier ?? 1) : 1;
    const effectiveHitRate = getSwingsPerSecond(pickaxe.miningSpeed, worldNumber) * (Number.isFinite(miningSpeedMult) && miningSpeedMult > 0 ? miningSpeedMult : 1); // swings per second
    const minTimeBetweenHits = Math.max(1, Math.ceil(1000 / effectiveHitRate)); // milliseconds between hits
    // Helpful debug (can be noisy if enabled elsewhere):
    // console.log('[MiningSystem] SPS calc:', { worldId, worldNumber, speed: pickaxe.miningSpeed, effectiveHitRate, minTimeBetweenHits });

    const currentTime = Date.now();
    const timeSinceLastHit = currentTime - state.lastHitTime;

    // If not enough time has passed, ignore this click (prevents spam clicking)
    if (timeSinceLastHit < minTimeBetweenHits) {
      // Click too soon - rate limit enforced
      return;
    }

    // Get player data for power calculation
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      if (DEBUG_MINING) console.log('[MiningSystem] handleMiningClick: No player data');
      return;
    }

    // PlayerData.power is stored as a string (BigInt-friendly in JSON). Coerce once for damage calcs.
    const powerNumRaw = Number(playerData.power || 0);
    const powerNum = Number.isFinite(powerNumRaw) ? powerNumRaw : 0;

    let resolvedBlockCoordinate: { x: number; y: number; z: number };
    let hitDepth: number;

    if (isAutoMining) {
      const currentMineLevel = this.yCoordinateToMineLevel(state.currentDepth);
      const topY = this.mineLevelToTopY(currentMineLevel);
      const center = this.getMineCenter(player);
      resolvedBlockCoordinate = {
        x: Math.floor(center.x),
        y: topY,
        z: Math.floor(center.z),
      };
      hitDepth = resolvedBlockCoordinate.y;
    } else {
      // Perform raycast from player's feet straight down
      // This allows the player to look around while mining the block they're standing on
      const playerFeetPosition = {
        x: playerEntity.position.x,
        y: playerEntity.position.y, // Player's feet position
        z: playerEntity.position.z,
      };

      // Raycast straight down to check what block the player is standing on
      const direction = { x: 0, y: -1, z: 0 }; // Straight down

      const petRigidBodyHandles = this.getPetRigidBodyHandles();
      // Prefer colliderMap-based filtering if available: it's the most reliable way
      // to ensure mining raycasts only hit voxel blocks (and never pets/other entities).
      const colliderMap = (this.world.simulation as any)?.colliderMap;

      // Draw manual debug markers so the player can see the ray in-game
      // Increased so mining still works reliably if the player is slightly above the block (step-up, jitter, etc.)
      this.drawRaycastDebugLine(playerFeetPosition, direction, 30);

      // Perform raycast straight down from player's feet
      // Exclude player's own rigid body to prevent self-hits
      const hitResult = this.world.simulation.raycast(
        playerFeetPosition,
        direction,
        30, // Increased: allow mining when slightly above the block
        {
          filterExcludeRigidBody: (playerEntity as any).rawRigidBody,
          filterPredicate: (collider) => {
            const handle = (collider as any)?.handle;

            // If colliderMap exists, only allow colliders that represent voxel blocks.
            // This prevents pets (and any other entities) from blocking mining rays.
            if (colliderMap?.getColliderHandleBlockType && typeof handle === 'number') {
              return !!colliderMap.getColliderHandleBlockType(handle);
            }

            // Fallback: exclude pet rigid bodies by handle.
            const parentHandle = (collider as any).parent?.();
            if (typeof parentHandle === 'number' && petRigidBodyHandles.has(parentHandle)) return false;
            return true;
          },
        }
      );
      
      if (!hitResult) {
        // No hit, clear target
        if (DEBUG_MINING) console.log('[MiningSystem] handleMiningClick: Raycast returned no hit at position', playerFeetPosition);
        state.currentTargetBlock = null;
        return;
      }

      // Check if hit block is a mining block
      const hitBlock = hitResult.hitBlock;
      const hitPoint = hitResult.hitPoint;
      const blockGlobalCoordinate = hitBlock?.globalCoordinate;
      
      if (!blockGlobalCoordinate && !hitPoint) {
        return;
      }
      
      const rawCoordinate = blockGlobalCoordinate ?? hitPoint!;
      resolvedBlockCoordinate = {
        x: Math.floor(rawCoordinate.x),
        y: Math.floor(rawCoordinate.y),
        z: Math.floor(rawCoordinate.z),
      };
      hitDepth = resolvedBlockCoordinate.y;
    }
    
    // Check if block is within the mining area bounds (X and Z)
    // Only blocks in the mining area can take damage
    const offsetBounds = this.getOffsetBounds(state.offset, worldId);
    const isInMiningArea = 
      resolvedBlockCoordinate.x >= offsetBounds.minX &&
      resolvedBlockCoordinate.x <= offsetBounds.maxX &&
      resolvedBlockCoordinate.z >= offsetBounds.minZ &&
      resolvedBlockCoordinate.z <= offsetBounds.maxZ;
    
    if (!isInMiningArea) {
      // Block is not in mining area, cannot mine it
      if (DEBUG_MINING) console.log('[MiningSystem] handleMiningClick: Block not in mining area', resolvedBlockCoordinate, 'bounds:', offsetBounds);
      state.currentTargetBlock = null;
      return;
    }
    
    // Check if player is mining the level they're standing on
    // Player should only be able to mine blocks within their current mine level (3 blocks tall)
    const currentMineLevel = this.yCoordinateToMineLevel(state.currentDepth);
    const isMiningCurrentLevel = isAutoMining ? true : this.isYCoordinateInMineLevel(hitDepth, currentMineLevel);
    
    if (!isMiningCurrentLevel) {
      // Can't mine blocks that aren't in the current mine level
      state.currentTargetBlock = null;
      return;
    }

    // Generate blocks ahead of player if needed (keep 20 levels ahead)
    // Note: pickaxe is already available from handleMiningClick parameters, but we get it again to ensure we have current luck
    const currentPickaxe = this.getPlayerPickaxe(player);
    if (currentPickaxe) {
      this.ensureLevelsAheadOfPlayer(player, state, currentPickaxe);
    }

    // Check if this mine level has a chest, win block, or a normal ore block
    // Use mine level for the key so all 3 Y coordinates share the same block
    const hitMineLevel = isAutoMining ? currentMineLevel : this.yCoordinateToMineLevel(hitDepth);
    const chestKey = `chest_level_${hitMineLevel}`;
    const miningAreaKey = `mining_area_level_${hitMineLevel}`;
    const unminableGoldKey = `unminable_gold_level_${hitMineLevel}`;

    const chest = state.chestMap.get(chestKey);
    const unminableGoldBlock = state.blockMap.get(unminableGoldKey);

    if (unminableGoldBlock) {
      // This is the win block at depth 1000
      // Win condition is now triggered automatically by block detection, not by mining
      state.currentTargetBlock = unminableGoldKey;

      // Don't deal damage - just update UI to show the block
      player.ui.sendData({
        type: 'MINING_UPDATE',
        damage: 0,
        currentOreName: 'Congratulations',
        blockHP: unminableGoldBlock.currentHP,
        maxHP: unminableGoldBlock.maxHP,
        isChest: false,
        sellValue: null,
        gemReward: null,
      });

      state.lastHitTime = Date.now();
      return; // Don't allow mining the gold block
    }

    if (chest) {
      // This is a chest - handle chest mining
      state.currentTargetBlock = chestKey;
      
      // Calculate base damage (REBALANCED: damage comes from Power only, not pickaxe)
      const baseDamage = calculateMiningDamage(powerNum);
      
      // Apply More Damage upgrade multiplier and round to integer
      const damage = Math.round(baseDamage * damageMultiplier);
      
      // Deal damage to chest
      const chestDestroyed = chest.takeDamage(damage);
      
      // Notify UI (health will be displayed in UI element)
      // For chests, we'll show the chest type name and gem reward
      const chestTypeName = chest.chestType === ChestType.BASIC ? 'Basic Chest' : 'Golden Chest';
      const gemReward = chest.getGemReward();
      onDamageDealt(
        player,
        damage,
        null, // No ore type for chests
        chest.currentHP,
        chest.maxHP,
        true, // isChest
        chestTypeName,
        gemReward
      );
      
      if (chestDestroyed) {
        // Check if this is the first block mined for this player
        if (!this.firstBlockMined.get(player)) {
          this.firstBlockMined.set(player, true);
          // Notify callback to start timer
          if (this.onFirstBlockMinedCallback) {
            this.onFirstBlockMinedCallback(player);
          }
        }
        
        // Chest broken - award gems
        const gemsReward = chest.getGemReward();
        
        // Apply More Gems upgrade multiplier if available
        // Note: The upgrade system should be checked via GameManager callback
        // For now, we'll use the callback to award gems (which will apply multipliers)
        if (this.onChestBrokenCallback) {
          this.onChestBrokenCallback(player, gemsReward);
        }
        
        // Spawn debris particles for chest break (use neutral brown color)
        const levelYCoords = this.getYCoordinatesForMineLevel(hitMineLevel);
        const middleY = levelYCoords[1]; // Middle Y coordinate of the 3-block level
        const mineBounds = this.getMineBounds(player);
        const areaBounds = {
          minX: mineBounds.minX,
          maxX: mineBounds.maxX,
          minZ: mineBounds.minZ,
          maxZ: mineBounds.maxZ,
          y: middleY + 0.5, // Center of the middle block
        };
        // Skip debris during auto mining to keep SPS consistent under load.
        if (!isAutoMining) {
          // Use stone ore type for neutral brown debris color (or could use a custom chest color)
          this.debrisManager.spawnDebris(OreType.STONE, areaBounds, 20);
        }
        
        // Remove chest from map
        state.chestMap.delete(chestKey);
        state.currentTargetBlock = null;

        // Player falls down to next mine level (drop 3 Y levels)
        const nextMineLevel = hitMineLevel + 1;
        const nextTopY = this.mineLevelToTopY(nextMineLevel);
        state.currentDepth = nextTopY;

        // Transition floor entity to next level (2 operations instead of ~294 setBlock calls)
        this.transitionFloorEntityToNextLevel(player, state, nextMineLevel, pickaxe);

        // Generate blocks ahead of player if needed (keep 20 levels ahead - walls only)
        this.ensureLevelsAheadOfPlayer(player, state, pickaxe);
        
        // Teleport player down to next mine level (position on top of the 3-block level)
        const center = this.getMineCenter(player);
        const newPosition = {
          x: center.x,
          y: nextTopY + 1, // Position player on top of next level
          z: center.z,
        };
        
        // Use setPosition on the rigid body to move the player
        const rigidBody = (playerEntity as any).rawRigidBody;
        if (rigidBody && rigidBody.setPosition) {
          rigidBody.setPosition(newPosition);
        } else {
          // Fallback: try to set position directly on entity if rigidBody method doesn't work

        }

        // Notify callback that block was destroyed (for animation reset)
        onBlockDestroyed?.(player);
      }

      state.lastHitTime = Date.now();
      return; // Chest handled, exit early
    }

    // Normal ore block mining (existing logic)
    // Get shared block for entire mining area at this mine level
    // All levels are pre-generated, so this should always exist
    let block = state.blockMap.get(miningAreaKey);
    if (!block) {
      // Fallback: regenerate this level if somehow missing (shouldn't happen)
      const worldId = this.getPlayerWorldId(player);
      const absoluteDepth = hitMineLevel + 1; // Mine level + 1 for ore generation (1-based)
      const oreType = this.generateOreType(pickaxe, absoluteDepth, player);
      const oreHP = this.calculateOreHP(oreType, absoluteDepth, worldId);
      block = new MineBlock(oreType, oreHP);
      state.blockMap.set(miningAreaKey, block);
    }

    state.currentTargetBlock = miningAreaKey;

    // Calculate base damage (REBALANCED: damage comes from Power only, not pickaxe)
    const baseDamage = calculateMiningDamage(powerNum);

    // Apply More Damage upgrade multiplier and round to integer
    const damage = Math.round(baseDamage * damageMultiplier);
    if (DEBUG_MINING) console.log('[MiningSystem] Mining! Power:', playerData.power, 'BaseDamage:', baseDamage, 'FinalDamage:', damage, 'Block:', block.oreType, 'HP:', block.currentHP);
    
    // Deal damage to shared block
    const blockDestroyed = block.takeDamage(damage);
    
    // Notify UI (health will be displayed in UI element)
    onDamageDealt(
      player,
      damage,
      block.oreType,
      block.currentHP,
      block.maxHP
    );

    if (blockDestroyed) {
      // Check if this is the first block mined for this player
      if (!this.firstBlockMined.get(player)) {
        this.firstBlockMined.set(player, true);
        // Notify callback to start timer
        if (this.onFirstBlockMinedCallback) {
          this.onFirstBlockMinedCallback(player);
        }
      }

      // Entire mining area at this depth destroyed - mine all blocks simultaneously
      const minedOre = block.oreType;
      const minedAmount = 1;

      // Add to inventory (for both manual and auto mining)
      onOreMined(player, minedOre, minedAmount);
      
      // Spawn debris particles across the entire 7x7 mining area
      const levelYCoords = this.getYCoordinatesForMineLevel(hitMineLevel);
      const middleY = levelYCoords[1]; // Middle Y coordinate of the 3-block level
      const mineBounds = this.getMineBounds(player);
      const areaBounds = {
        minX: mineBounds.minX,
        maxX: mineBounds.maxX,
        minZ: mineBounds.minZ,
        maxZ: mineBounds.maxZ,
        y: middleY + 0.5, // Center of the middle block
      };
      // Skip debris during auto mining to keep SPS consistent under load.
      if (DEBUG_MINING) console.log('[MiningSystem] Floor broken! isAutoMining:', isAutoMining, 'minedOre:', minedOre);
      if (!isAutoMining) {
        this.debrisManager.spawnDebris(minedOre, areaBounds, 20);
      }

      // Remove shared block from map
      state.blockMap.delete(miningAreaKey);
      state.currentTargetBlock = null;

      // Player falls down to next mine level (drop 3 Y levels)
      const nextMineLevel = hitMineLevel + 1;
      const nextTopY = this.mineLevelToTopY(nextMineLevel);
      state.currentDepth = nextTopY;

      // Transition floor entity to next level (2 operations instead of ~294 setBlock calls)
      this.transitionFloorEntityToNextLevel(player, state, nextMineLevel, pickaxe);

      // Generate blocks ahead of player if needed (keep 20 levels ahead - walls only)
      this.ensureLevelsAheadOfPlayer(player, state, pickaxe);
      
      // Teleport player down to next mine level (position on top of the 3-block level)
      const center = this.getMineCenter(player);
      const newPosition = {
        x: center.x,
        y: nextTopY + 1, // Position player on top of next level
        z: center.z,
      };

      // Spawn floor break particle effect
      this.spawnFloorBreakEffect(player, minedOre, nextTopY);

      // Use setPosition on the rigid body to move the player
      const rigidBody = (playerEntity as any).rawRigidBody;
      if (rigidBody && rigidBody.setPosition) {
        rigidBody.setPosition(newPosition);
      } else {
        // Fallback: try to set position directly on entity if rigidBody method doesn't work
        // The player will fall naturally due to physics, but we can at least set the position

      }

      // Notify callback that block was destroyed (for animation reset)
      onBlockDestroyed?.(player);

      // No need to generate levels ahead - all 1000 levels are already generated!
    }

    state.lastHitTime = Date.now();
  }

  /**
   * Starts continuous mining loop (for holding left click)
   * 
   * @param player - Player who is mining
   * @param pickaxe - Player's current pickaxe
   * @param playerData - Player's data
   * @param onOreMined - Callback when ore is mined
   * @param onDamageDealt - Callback when damage is dealt
   */
  startMiningLoop(
    player: Player,
    pickaxe: PickaxeData,
    playerData: PlayerData,
    onOreMined: (player: Player, oreType: string, amount: number) => void,
    onDamageDealt: (player: Player, damage: number, currentOre: string | null, blockHP: number, maxHP: number, isChest?: boolean, chestType?: string | null, gemReward?: number | null) => void,
    damageMultiplier: number = 1.0,
    isBlockingModalOpen?: () => boolean,
    onBlockDestroyed?: (player: Player) => void
  ): void {
    if (DEBUG_MINING) console.log('[MiningSystem] startMiningLoop called for player:', player.username);
    // Stop any existing loop
    this.stopMiningLoop(player);

    // Ensure state exists and initial level is generated
    this.getOrCreateState(player, pickaxe);

    // Get mining speed (hits per second) from speed + world curve
    // Formula: SPS = getSwingsPerSecond(speed, world)
    const worldId = this.getPlayerWorldId(player);
    const worldNumber = this.getWorldNumberFromId(worldId);
    const pd = this.getPlayerDataCallback?.(player);
    const miningSpeedMult = pd ? (getBonuses(pd).miningSpeedMultiplier ?? 1) : 1;
    const effectiveHitRate = getSwingsPerSecond(pickaxe.miningSpeed, worldNumber) * (Number.isFinite(miningSpeedMult) && miningSpeedMult > 0 ? miningSpeedMult : 1);
    const hitIntervalMs = 1000 / effectiveHitRate;
    const maxCatchupHits = Math.max(10, Math.ceil(effectiveHitRate * 5)); // Allow up to ~5s of catch-up
    if (DEBUG_MINING) console.log('[MiningSystem] startMiningLoop: hitInterval=', hitIntervalMs, 'ms');

    // Safety check: ensure hitInterval is a valid number (not Infinity or NaN)
    if (!isFinite(hitIntervalMs) || hitIntervalMs <= 0) {
      if (DEBUG_MINING) console.log('[MiningSystem] startMiningLoop: Invalid hitInterval, aborting');
      return; // Don't start mining loop with invalid interval
    }

    // Perform mining hits at regular intervals
    let hitCount = 0;
    const performHit = () => {
      hitCount++;
      const currentState = this.miningStates.get(player);
      if (!currentState) {
        if (DEBUG_MINING) console.log('[MiningSystem] performHit: No state for player, hit #', hitCount);
        return;
      }

      // Log every 5th hit to avoid spam
      if (hitCount <= 3 || hitCount % 10 === 0) {
        if (DEBUG_MINING) console.log('[MiningSystem] performHit #', hitCount, 'for player:', player.username, 'depth:', currentState.currentDepth);
      }

      // Perform mining click (auto-mining mode)
      this.handleMiningClick(player, pickaxe, onOreMined, onDamageDealt, damageMultiplier, isBlockingModalOpen, true, onBlockDestroyed);
    };

    // Perform first hit immediately
    if (DEBUG_MINING) console.log('[MiningSystem] startMiningLoop: Performing first hit');
    performHit();

    let lastTick = Date.now();
    let accumulatorMs = 0;
    const tickIntervalMs = Math.max(16, Math.min(100, Math.floor(hitIntervalMs / 2)));

    const tick = () => {
      const now = Date.now();
      const dt = now - lastTick;
      lastTick = now;
      accumulatorMs += dt;

      // Allow multiple hits in one tick to catch up after lag, but cap to avoid spirals.
      let loops = 0;
      while (accumulatorMs >= hitIntervalMs && loops < maxCatchupHits) {
        accumulatorMs -= hitIntervalMs;
        performHit();
        loops++;
      }
    };

    // Set up interval for continuous hits
    const currentState = this.miningStates.get(player);
    if (currentState) {
      currentState.miningIntervalId = setInterval(tick, tickIntervalMs);
      if (DEBUG_MINING) console.log('[MiningSystem] startMiningLoop: Mining interval set up');
    } else {
      if (DEBUG_MINING) console.log('[MiningSystem] startMiningLoop: No state after getOrCreateState, cannot set interval!');
    }
  }

  /**
   * Stops continuous mining loop
   * 
   * @param player - Player to stop mining for
   */
  stopMiningLoop(player: Player): void {
    const state = this.miningStates.get(player);
    if (!state) return;

    if (state.miningIntervalId) {
      clearInterval(state.miningIntervalId);
      state.miningIntervalId = undefined;
    }

    state.currentTargetBlock = null;
  }

  /**
   * Checks if a player is currently mining
   * 
   * @param player - Player to check
   * @returns True if player is mining
   */
  isPlayerMining(player: Player): boolean {
    const state = this.miningStates.get(player);
    return state?.miningIntervalId !== undefined;
  }

  /**
   * Gets current mining state for a player
   * 
   * @param player - Player to get state for
   * @returns Mining state or null if not mining
   */
  getMiningState(player: Player): MiningState | null {
    return this.miningStates.get(player) || null;
  }

  /**
   * Gets the current mine level (0-based) for a player
   * 
   * @param player - Player to get mine level for
   * @returns Current mine level (0, 1, 2, ...) or 0 if not in mine
   */
  getCurrentMineLevel(player: Player): number {
    const state = this.miningStates.get(player);
    if (!state) {
      return 0;
    }
    return this.yCoordinateToMineLevel(state.currentDepth);
  }

  /**
   * Returns the world-space center of the player's mine (with offset applied)
   */
  getMineCenter(player: Player): { x: number; z: number } {
    const worldId = this.getPlayerWorldId(player);
    const offset = this.getOrCreateOffset(player, worldId);
    const bounds = this.getMiningAreaBounds(worldId);
    const centerX = (bounds.minX + bounds.maxX) / 2 + offset.x;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2 + offset.z;
    return { x: centerX, z: centerZ };
  }

  /**
   * Returns the world-space bounds for the player's mine (with offset applied)
   */
  getMineBounds(player: Player) {
    const worldId = this.getPlayerWorldId(player);
    const offset = this.getOrCreateOffset(player, worldId);
    return this.getOffsetBounds(offset, worldId);
  }

  private despawnFloorEntityPool(state: MiningState): void {
    if (!state.floorEntityPool || state.floorEntityPool.length === 0) return;
    for (const pooled of state.floorEntityPool) {
      try {
        if (pooled.entity?.isSpawned) {
          pooled.entity.despawn();
        }
      } catch (error) {
        // Entity might already be despawned
      }
    }
    state.floorEntityPool = [];
  }

  private despawnTypeEntityPools(state: MiningState): void {
    for (const entity of state.oreEntityPool.values()) {
      try {
        if (entity.isSpawned) {
          entity.despawn();
        }
      } catch (error) {
        // Entity might already be despawned
      }
    }
    state.oreEntityPool.clear();

    for (const entity of state.chestEntityPool.values()) {
      try {
        if (entity.isSpawned) {
          entity.despawn();
        }
      } catch (error) {
        // Entity might already be despawned
      }
    }
    state.chestEntityPool.clear();

    state.nextOccurrence.clear();
  }

  /**
   * Prepares the player's mine (all 1000 levels are pre-generated upfront) and returns entry position
   * All dirt walls are generated instantly when player spawns
   */
  preparePlayerMine(
    player: Player,
    pickaxe: PickaxeData
  ): { x: number; y: number; z: number } {
    if (DEBUG_MINING) console.log('[MiningSystem] preparePlayerMine called for player:', player.username);
    const state = this.getOrCreateState(player, pickaxe);
    const center = this.getMineCenter(player);
    if (DEBUG_MINING) console.log('[MiningSystem] preparePlayerMine: state currentDepth:', state.currentDepth, 'center:', center);

    // Reset first block mined flag when entering mine (so timer can start on first block)
    this.firstBlockMined.delete(player);

    return { x: center.x, y: state.currentDepth + 1, z: center.z };
  }

  /**
   * Resets the player's mine to level 0 (beginning level)
   * Clears all mining blocks and regenerates all 1000 levels upfront
   * All dirt walls are regenerated instantly
   *
   * @param player - Player whose mine to reset
   */
  resetMineToLevel0(player: Player): void {
    if (DEBUG_MINING) console.log('[MiningSystem] resetMineToLevel0 called for player:', player.username);
    const state = this.miningStates.get(player);
    if (!state) {
      if (DEBUG_MINING) console.log('[MiningSystem] resetMineToLevel0: No mining state found!');
      return;
    }

    const startTime = Date.now();

    // Initialize new fields for legacy states that may not have them
    if (!state.floorEntityPool) state.floorEntityPool = [];
    if (!state.levelSequence) state.levelSequence = new Map();
    if (!state.oreEntityPool) state.oreEntityPool = new Map();
    if (!state.chestEntityPool) state.chestEntityPool = new Map();
    if (!state.nextOccurrence) state.nextOccurrence = new Map();

    // Despawn the old floor entity if it exists (legacy single-entity approach)
    if (state.mineFloorEntity) {
      try {
        if (state.mineFloorEntity.isSpawned) {
          state.mineFloorEntity.despawn();
        }
      } catch (error) {
        // Entity might already be despawned
      }
      state.mineFloorEntity = undefined;
    }

    // Despawn all floor entity pool entities
    this.despawnFloorEntityPool(state);
    // Despawn pooled entities (ore/chest type pooling)
    this.despawnTypeEntityPools(state);

    // Clear level sequence
    state.levelSequence.clear();
    state.nextOccurrence.clear();

    // Reset state (no floor blocks to clear - we use entity pool now)
    state.blockMap.clear();
    state.chestMap.clear();
    state.generatedDepths.clear();
    state.currentDepth = MINE_DEPTH_START;
    state.deepestGeneratedDepth = MINE_DEPTH_START;
    state.currentTargetBlock = null;
    state.winTriggered = false;
    state.currentLevelIsChest = undefined;
    state.currentChestType = undefined;
    state.currentOreType = undefined;
    // DON'T reset ceilingBuilt or bottomFloorDepth - walls stay permanent

    // Reset first block mined flag (so timer can start again on next entry)
    this.firstBlockMined.delete(player);

    // Regenerate initial levels with new ores and create new floor entity
    const pickaxe = this.getPlayerPickaxe(player);
    if (pickaxe) {
      this.generateInitialMiningLevels(player, state, pickaxe);
    }

    const elapsed = Date.now() - startTime;
    if (DEBUG_MINING) console.log('[MiningSystem] resetMineToLevel0 completed in', elapsed, 'ms');
  }

  /**
   * Gets player's pickaxe (helper method)
   */
  private getPlayerPickaxe(player: Player): PickaxeData | undefined {
    if (this.getPickaxeCallback) {
      return this.getPickaxeCallback(player);
    }
    return undefined;
  }

  /**
   * Cleans up mining state when player leaves
   * Removes all mine offsets for the player across all worlds
   * 
   * @param player - Player who left
   */
  cleanupPlayer(player: Player): void {
    if (DEBUG_MINING) console.log('[MiningSystem] cleanupPlayer called for player:', player.username);
    this.stopMiningLoop(player);

    // Despawn all entities before deleting state
    const state = this.miningStates.get(player);
    if (state) {
      // Despawn legacy single floor entity
      if (state.mineFloorEntity) {
        try {
          if (state.mineFloorEntity.isSpawned) {
            state.mineFloorEntity.despawn();
          }
        } catch (error) {
          // Entity might already be despawned
        }
      }

      // Despawn all floor entity pool entities (if pool exists)
      this.despawnFloorEntityPool(state);

      // Despawn pooled entities for ore/chest types
      this.despawnTypeEntityPools(state);
    }

    this.miningStates.delete(player);
    if (DEBUG_MINING) console.log('[MiningSystem] Mining state DELETED for player:', player.username);

    // Remove all offsets for this player (all worlds)
    const keysToDelete: string[] = [];
    for (const key of this.mineOffsets.keys()) {
      if (key.startsWith(`${player.id}:`)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.mineOffsets.delete(key);
    }

    this.firstBlockMined.delete(player);
  }

  /**
   * Detects what block/chest is at the current mining depth
   * Returns block information without dealing damage
   * Used to show UI indicator - always shows the block at currentDepth regardless of player position
   * 
   * @param player - Player to check
   * @param pickaxe - Player's pickaxe (for state initialization)
   * @returns Block info or null if no valid block detected
   */
  detectCurrentBlock(
    player: Player,
    pickaxe: PickaxeData
  ): {
    oreType: string | null;
    isChest: boolean;
    chestType: string | null;
    blockHP: number;
    maxHP: number;
    gemReward: number | null;
  } | null {
    const state = this.getOrCreateState(player, pickaxe);
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return null;
    }

    // Always check the block at currentDepth (the mine level the player is currently mining)
    // This shows the block the player will mine next, regardless of where they're standing
    const currentMineLevel = this.yCoordinateToMineLevel(state.currentDepth);
    const chestKey = `chest_level_${currentMineLevel}`;
    const miningAreaKey = `mining_area_level_${currentMineLevel}`;
    const unminableGoldKey = `unminable_gold_level_${currentMineLevel}`;

    const chest = state.chestMap.get(chestKey);
    const unminableGoldBlock = state.blockMap.get(unminableGoldKey);

    if (unminableGoldBlock) {
      // This is the win block at depth 1000
      return {
        oreType: null, // Not a regular ore
        isChest: false,
        chestType: 'Congratulations', // Special type for UI
        blockHP: unminableGoldBlock.currentHP,
        maxHP: unminableGoldBlock.maxHP,
        gemReward: null,
      };
    }

    if (chest) {
      // This is a chest
      // Initialize HP if not already initialized (needs player damage to calculate)
      // Check if maxHP is 0 (indicates HP hasn't been initialized yet)
      if (chest.maxHP === 0) {
        const powerNumRaw = Number(playerData.power || 0);
        const powerNum = Number.isFinite(powerNumRaw) ? powerNumRaw : 0;
        const baseDamage = calculateMiningDamage(powerNum);
        // Get combined damage multiplier (includes More Damage upgrade and miner damage bonus)
        const damageMultiplier = this.getCombinedDamageMultiplierCallback?.(player) ?? 1.0;
        const finalDamage = Math.round(baseDamage * damageMultiplier);
        chest.initializeHP(finalDamage);
      }
      
      const chestTypeName = chest.chestType === ChestType.BASIC ? 'Basic Chest' : 'Golden Chest';
      return {
        oreType: null,
        isChest: true,
        chestType: chestTypeName,
        blockHP: chest.currentHP,
        maxHP: chest.maxHP,
        gemReward: chest.getGemReward(),
      };
    }
    
    // Normal ore block
    let block = state.blockMap.get(miningAreaKey);
    if (!block) {
      // Block not in map - might have been deleted or not generated yet
      // Try to get or create it (similar to handleMiningClick logic)
      const worldId = this.getPlayerWorldId(player);
      const absoluteDepth = currentMineLevel + 1; // Mine level + 1 for ore generation (1-based)
      const oreType = this.generateOreType(pickaxe, absoluteDepth, player);
      const oreHP = this.calculateOreHP(oreType, absoluteDepth, worldId);
      block = new MineBlock(oreType, oreHP);
      state.blockMap.set(miningAreaKey, block);
    }
    
    return {
      oreType: block.oreType,
      isChest: false,
      chestType: null,
      blockHP: block.currentHP,
      maxHP: block.maxHP,
      gemReward: null,
    };
  }

  /**
   * Gets player entity
   */
  private getPlayerEntity(player: Player): Entity | undefined {
    const entities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
    if (!entities.length) return undefined;
    return entities[0];
  }

  /**
   * Gets the block type ID for a given ore type
   * 
   * @param oreType - The ore type to get block ID for
   * @returns Block type ID, or MINING_BLOCK_TYPE_ID as fallback
   */
  /**
   * Gets the block ID for an ore type
   * World-aware: Supports both Island 1 and Island 2 ores
   * 
   * @param oreType - Ore type as string (ore type name)
   * @param worldId - World ID ('island1', 'island2', 'island3', 'island4', or 'island5'), defaults to 'island1'
   * @returns Block type ID for the ore
   */
  private getBlockIdForOreType(oreType: string, worldId: string = 'island1'): number {
    return this.ORE_TO_BLOCK_ID.get(oreType) ?? this.MINING_BLOCK_TYPE_ID;
  }

  /**
   * Gets the texture URI for a given ore type
   * Used for the single BlockEntity floor approach
   *
   * @param oreType - The ore type to get texture for
   * @returns Texture URI string for the ore block
   */
  private getOreTextureUri(oreType: string): string {
    const blockId = this.ORE_TO_BLOCK_ID.get(oreType);
    if (blockId === undefined) {
      console.log('[MiningSystem] getOreTextureUri: No blockId for oreType', oreType, '- using fallback');
      return 'blocks/stone.png'; // Fallback
    }

    const blockType = this.world.blockTypeRegistry.getBlockType(blockId);
    if (blockType && blockType.textureUri) {
      const textureUri = blockType.textureUri;
      // Multi-texture folders need to reference a specific face
      // Use +y (top face) which shows the ore pattern
      if (!textureUri.endsWith('.png')) {
        const resolvedTexture = `${textureUri}/+y.png`;
        console.log('[MiningSystem] getOreTextureUri:', oreType, '-> blockId:', blockId, '-> texture:', resolvedTexture);
        return resolvedTexture;
      }
      console.log('[MiningSystem] getOreTextureUri:', oreType, '-> blockId:', blockId, '-> texture:', textureUri);
      return textureUri;
    }

    console.log('[MiningSystem] getOreTextureUri: No blockType for blockId', blockId, '- using fallback');
    return 'blocks/stone.png'; // Fallback
  }

  /**
   * Gets the texture URI for a chest type
   *
   * @param chestType - The chest type (BASIC or GOLDEN)
   * @returns Texture URI string for the chest block
   */
  private getChestTextureUri(chestType: ChestType): string {
    const blockId = chestType === ChestType.BASIC
      ? this.BASIC_CHEST_BLOCK_TYPE_ID
      : this.GOLDEN_CHEST_BLOCK_TYPE_ID;

    const blockType = this.world.blockTypeRegistry.getBlockType(blockId);
    if (blockType && blockType.textureUri) {
      return blockType.textureUri;
    }

    // Fallback - use a visible texture
    return chestType === ChestType.BASIC ? 'blocks/gold-block.png' : 'blocks/diamond-block.png';
  }

  /**
   * Ensures a mining state exists for the player (and initializes with an offset)
   * NEW SYSTEM: Generates all 1000 levels at once instead of progressive generation
   * World-aware: Creates separate mine instances for each world
   */
  private getOrCreateState(player: Player, pickaxe: PickaxeData): MiningState {
    const worldId = this.getPlayerWorldId(player);
    const correctOffset = this.getOrCreateOffset(player, worldId);

    let state = this.miningStates.get(player);
    if (state) {
      if (DEBUG_MINING) console.log('[MiningSystem] getOrCreateState: Existing state found for player:', player.username);

      // Initialize new fields for legacy states that may not have them
      if (!state.floorEntityPool) state.floorEntityPool = [];
      if (!state.levelSequence) state.levelSequence = new Map();
      if (!state.oreEntityPool) state.oreEntityPool = new Map();
      if (!state.chestEntityPool) state.chestEntityPool = new Map();
      if (!state.nextOccurrence) state.nextOccurrence = new Map();

      // Check if the state's offset matches the current world's offset
      // If not, regenerate the state for the current world
      const currentOffsetKey = `${player.id}:${worldId}`;
      const stateOffsetKey = this.findOffsetKeyForOffset(player, state.offset);

      if (stateOffsetKey !== currentOffsetKey || (state.offset.x === 0 && state.offset.z === 0)) {
        if (DEBUG_MINING) console.log('[MiningSystem] getOrCreateState: Regenerating state for different world');

        // Despawn the old floor entity before regenerating for new world
        if (state.mineFloorEntity) {
          try {
            if (state.mineFloorEntity.isSpawned) {
              state.mineFloorEntity.despawn();
            }
          } catch (error) {
            // Entity might already be despawned
          }
          state.mineFloorEntity = undefined;
        }

        // Despawn all floor entity pool entities (if pool exists)
        this.despawnFloorEntityPool(state);
        // Despawn pooled entities for ore/chest types (if pool exists)
        this.despawnTypeEntityPools(state);

        // Clear level sequence
        if (state.levelSequence) state.levelSequence.clear();
        if (state.nextOccurrence) state.nextOccurrence.clear();

        // State is for a different world or legacy state, regenerate for current world
        state.blockMap.clear();
        state.chestMap.clear();
        state.generatedDepths.clear();
        state.currentDepth = MINE_DEPTH_START;
        state.deepestGeneratedDepth = MINE_DEPTH_START;
        state.offset = correctOffset;
        state.ceilingBuilt = false;
        state.bottomFloorDepth = null;
        state.winTriggered = false;
        state.currentLevelIsChest = undefined;
        state.currentChestType = undefined;
        state.currentOreType = undefined;
        // Reset first block mined flag so timer starts when player mines first block in new world
        this.resetFirstBlockMined(player);
        // Regenerate initial 20 levels with new offset and new floor entity
        this.generateInitialMiningLevels(player, state, pickaxe);
      }
      return state;
    }

    if (DEBUG_MINING) console.log('[MiningSystem] getOrCreateState: CREATING NEW state for player:', player.username, 'worldId:', worldId);
    const offset = correctOffset;
    state = {
      blockMap: new Map(),
      chestMap: new Map(),
      currentTargetBlock: null,
      lastHitTime: 0,
      currentDepth: MINE_DEPTH_START,
      generatedDepths: new Set(),
      deepestGeneratedDepth: MINE_DEPTH_START, // Start at depth 0, will generate down from here
      offset,
      ceilingBuilt: false,
      bottomFloorDepth: null,
      winTriggered: false,
      floorEntityPool: [],
      levelSequence: new Map(),
      oreEntityPool: new Map(),
      chestEntityPool: new Map(),
      nextOccurrence: new Map(),
    };
    this.miningStates.set(player, state);
    if (DEBUG_MINING) console.log('[MiningSystem] getOrCreateState: State created and stored');

    // Generate initial 20 levels (will generate more ahead as player mines)
    this.generateInitialMiningLevels(player, state, pickaxe);

    return state;
  }

  /**
   * Helper to find the offset key for a given offset (for validation)
   */
  private findOffsetKeyForOffset(player: Player, offset: { x: number; z: number }): string | null {
    for (const [key, storedOffset] of this.mineOffsets.entries()) {
      if (storedOffset.x === offset.x && storedOffset.z === offset.z && key.startsWith(`${player.id}:`)) {
        return key;
      }
    }
    return null;
  }

  /**
   * Returns (and caches) a unique offset for the player's mine instance
   * Separate offset spaces per world to ensure Island 1 and Island 2 have separate mines
   */
  private getOrCreateOffset(player: Player, worldId: string): { x: number; z: number } {
    const key = `${player.id}:${worldId}`;
    const existing = this.mineOffsets.get(key);
    if (existing) {
      return existing;
    }

    // Get or create instance index for this world
    let instanceIndex = this.nextInstanceIndexPerWorld.get(worldId) ?? 0;
    instanceIndex++;
    this.nextInstanceIndexPerWorld.set(worldId, instanceIndex);

    // Simple grid allocation using spacing to avoid overlap
    // Start from index 1 so nobody uses the origin/shared area
    // Island 2 and Island 3 use different grid regions to avoid overlap with Island 1
    const baseOffsetX =
      worldId === 'island2'
        ? 10000
        : worldId === 'island3'
          ? 20000
        : worldId === 'island4'
            ? 30000
            : worldId === 'island5'
              ? 40000
              : 0;
    const index = instanceIndex;
    const spacing = MINE_INSTANCE_SPACING;
    const gridWidth = 16; // gives plenty of room before wrapping
    const row = Math.floor(index / gridWidth);
    const col = index % gridWidth;
    const offset = { x: baseOffsetX + col * spacing, z: row * spacing };

    this.mineOffsets.set(key, offset);
    return offset;
  }

  /**
   * Get mining area bounds based on world ID
   */
  private getMiningAreaBounds(worldId: string) {
    if (worldId === 'island2') {
      return ISLAND2_MINING_AREA_BOUNDS;
    }
    if (worldId === 'island3') {
      return ISLAND3_MINING_AREA_BOUNDS;
    }
    if (worldId === 'island4') {
      return ISLAND4_MINING_AREA_BOUNDS;
    }
    if (worldId === 'island5') {
      return ISLAND5_MINING_AREA_BOUNDS;
    }
    return MINING_AREA_BOUNDS;
  }

  /**
   * Get player's current world ID
   */
  private getPlayerWorldId(player: Player): string {
    const playerData = this.getPlayerDataCallback?.(player);
    return playerData?.currentWorld || 'island1';
  }

  /**
   * Collect rigid body handles for pets so mining raycasts ignore them.
   */
  private getPetRigidBodyHandles(): Set<number> {
    const handles = new Set<number>();
    const entities = this.world.entityManager.getAllEntities();
    for (const entity of entities) {
      if (entity.tag === 'pet') {
        const handle = (entity as any).rawRigidBody?.handle;
        if (typeof handle === 'number') {
          handles.add(handle);
        }
      }
    }
    return handles;
  }

  /**
   * Maps world IDs to numeric world indices for SPS curves.
   * Supports any world like "island4", "world5", etc. Defaults to 1.
   */
  private getWorldNumberFromId(worldId: string): number {
    const match = String(worldId || '').match(/(\d+)/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed >= 1) return parsed;
    }
    return 1;
  }

  /**
   * Generate mining area positions dynamically based on bounds
   */
  private getMiningAreaPositions(bounds: { minX: number; maxX: number; minZ: number; maxZ: number; y: number }): Array<{ x: number; y: number; z: number }> {
    const positions: Array<{ x: number; y: number; z: number }> = [];
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      for (let z = bounds.minZ; z <= bounds.maxZ; z++) {
        positions.push({ x, y: bounds.y, z });
      }
    }
    return positions;
  }

  /**
   * Get mining area positions for the player's current world
   */
  private getMiningAreaPositionsForPlayer(player: Player): Array<{ x: number; y: number; z: number }> {
    const worldId = this.getPlayerWorldId(player);
    const bounds = this.getMiningAreaBounds(worldId);
    return this.getMiningAreaPositions(bounds);
  }

  /**
   * Translate base mining bounds by an offset
   */
  private getOffsetBounds(offset: { x: number; z: number }, worldId: string) {
    const bounds = this.getMiningAreaBounds(worldId);
    return {
      minX: bounds.minX + offset.x,
      maxX: bounds.maxX + offset.x,
      minZ: bounds.minZ + offset.z,
      maxZ: bounds.maxZ + offset.z,
      y: bounds.y,
    };
  }

  /**
   * Converts a Y coordinate to a mine level number
   * Mine level 0 = Y: 0, -1, -2
   * Mine level 1 = Y: -3, -4, -5
   * Mine level 2 = Y: -6, -7, -8
   * etc.
   * 
   * @param yCoordinate - Y coordinate (can be positive or negative)
   * @returns Mine level number (0, 1, 2, ...)
   */
  private yCoordinateToMineLevel(yCoordinate: number): number {
    // For positive Y, mine level is 0
    if (yCoordinate >= 0) {
      return 0;
    }
    // For negative Y, divide by BLOCKS_PER_MINE_LEVEL and floor
    return Math.floor(Math.abs(yCoordinate) / BLOCKS_PER_MINE_LEVEL);
  }

  /**
   * Converts a mine level number to the top Y coordinate of that level
   * Mine level 0 -> Y: 0
   * Mine level 1 -> Y: -3
   * Mine level 2 -> Y: -6
   * etc.
   * 
   * @param mineLevel - Mine level number (0, 1, 2, ...)
   * @returns Top Y coordinate of that mine level
   */
  private mineLevelToTopY(mineLevel: number): number {
    return -mineLevel * BLOCKS_PER_MINE_LEVEL;
  }

  /**
   * Gets all Y coordinates for a given mine level
   * 
   * @param mineLevel - Mine level number (0, 1, 2, ...)
   * @returns Array of Y coordinates [topY, topY-1, topY-2]
   */
  private getYCoordinatesForMineLevel(mineLevel: number): number[] {
    const topY = this.mineLevelToTopY(mineLevel);
    return [topY, topY - 1, topY - 2];
  }

  /**
   * Checks if a Y coordinate is within a specific mine level
   * 
   * @param yCoordinate - Y coordinate to check
   * @param mineLevel - Mine level to check against
   * @returns True if Y coordinate is within the mine level's 3-block range
   */
  private isYCoordinateInMineLevel(yCoordinate: number, mineLevel: number): boolean {
    const levelYCoords = this.getYCoordinatesForMineLevel(mineLevel);
    return levelYCoords.includes(yCoordinate);
  }

  /**
   * Generates an ore type based on depth and luck using the NEW LINEAR SCALING SYSTEM
   * World-aware: Uses Island 1, Island 2, Island 3, or Island 4 ore database based on player's world
   * 
   * Uses OreGenerator which:
   * - Filters ores by firstDepth (ores only spawn at their unlock depth or deeper)
   * - Applies rarity-based weights (1 in X odds)
   * - Applies luck multiplier
   * - Normalizes and selects randomly
   * 
   * @param pickaxe - Player's pickaxe (contains luck bonus)
   * @param depth - Current mining depth (positive value, increases as you go deeper)
   * @param player - Player (used to get worldId)
   * @returns Randomly selected ore type as string based on depth and luck
   */
  private generateOreType(pickaxe: PickaxeData, depth: number, player?: Player): string {
    // Get player's world ID
    const worldId = player ? this.getPlayerWorldId(player) : 'island1';
    
    // Get pickaxe luck bonus (stored as decimal, e.g., 0.05 = +5%)
    const pickaxeLuckDecimal = pickaxe.luckBonus;
    
    // Get miner ore luck bonus percentage (e.g., 5 = +5%)
    const minerOreLuckBonus = player ? (this.getMinerOreLuckBonusCallback?.(player) ?? 0) : 0;
    
    // Convert both to percentages, add them together, then convert back to decimal
    const pickaxeLuckPercent = pickaxeLuckDecimal * 100; // e.g., 0.05 -> 5%
    const totalLuckPercent = pickaxeLuckPercent + minerOreLuckBonus; // Add percentages
    const luck = totalLuckPercent / 100; // Convert back to decimal (0.0-1.0 format)
    
    // Convert depth to positive value (depth increases as you go deeper)
    const absoluteDepth = Math.abs(depth);
    
    // Use OreGenerator with depth, luck, and worldId
    return this.oreGenerator.generateOre(absoluteDepth, luck, worldId);
  }

  /**
   * Calculates the HP for an ore at a given depth using NEW LINEAR SCALING SYSTEM
   * World-aware: Uses Island 1, Island 2, Island 3, or Island 4 ore database based on player's world
   * 
   * Uses linear interpolation from firstHealth to lastHealth based on depth
   * Formula: HP = FirstHealth + ((CurrentDepth - FirstDepth) / (LastDepth - FirstDepth)) × (LastHealth - FirstHealth)
   * 
   * @param oreType - Type of ore as string
   * @param depth - Current mining depth (should be positive)
   * @param worldId - World ID ('island1', 'island2', 'island3', 'island4', or 'island5')
   * @returns Calculated HP with linear depth scaling
   */
  private calculateOreHP(oreType: string, depth: number, worldId: string): number {
    // Ensure depth is positive
    const absoluteDepth = Math.abs(depth);
    
    // Use OreGenerator's getOreHealth method which uses linear interpolation
    return this.oreGenerator.getOreHealth(oreType, absoluteDepth, worldId);
  }

  /**
   * Generates all mine levels upfront for a player (1000 levels total for max depth of 3000 blocks)
   * Each mine level is 3 blocks tall (7x3x7)
   * Called when player first logs in or mine is reset
   *
   * NEW: Uses entity pooling - small leapfrog pool per column to avoid visible sliding
   *
   * @param player - Player who owns this mining state
   * @param state - Player's mining state
   * @param pickaxe - Player's pickaxe (for ore generation with current luck)
   */
  private generateInitialMiningLevels(
    player: Player,
    state: MiningState,
    pickaxe: PickaxeData
  ): void {
    // Get world ID once for this method
    const worldId = this.getPlayerWorldId(player);

    // Build overhead ceiling once
    if (!state.ceilingBuilt) {
      this.buildMineCeiling(state, worldId);
      state.ceilingBuilt = true;
    }

    // Initialize entity pool if not already done
    if (USE_ENTITY_POOLING) {
      if (state.oreEntityPool.size === 0 && state.chestEntityPool.size === 0) {
        this.initializeOreEntityPool(player, state, pickaxe, worldId);
      }
    } else {
      if (!state.floorEntityPool || state.floorEntityPool.length === 0) {
        this.initializeFloorEntityPool(player, state, pickaxe, worldId);
      }
    }

    // Generate a limited number of levels upfront for performance
    // With entity pooling:
    // - levelSequence already populated by initializeFloorEntityPool
    // - Generate MineBlock/ChestBlock objects for HP tracking
    // - Generate walls only
    const levelsToGenerate = this.INITIAL_MINE_LEVELS;
    for (let mineLevel = 0; mineLevel < levelsToGenerate; mineLevel++) {
      const levelYCoords = this.getYCoordinatesForMineLevel(mineLevel); // All 3 Y coordinates
      const absoluteDepth = mineLevel + 1; // 1, 2, 3, ..., 1000 (for ore generation)

      // Mark all 3 Y coordinates as generated
      for (const yCoord of levelYCoords) {
        state.generatedDepths.add(yCoord);
      }

      // Get what's at this level from the level sequence
      const levelContent = state.levelSequence.get(mineLevel);

      // Check if this is the win level (mine level 999 = depth 1000)
      if (mineLevel === 999) {
        // Create a win block for HP tracking (infinite HP, no damage taken)
        const miningAreaKey = `unminable_gold_level_${mineLevel}`;
        const goldOreType = worldId === 'island2' ? 'sunstonite' : OreType.GOLD;
        const goldBlock = new MineBlock(goldOreType, Number.MAX_SAFE_INTEGER);
        state.blockMap.set(miningAreaKey, goldBlock);
      } else if (levelContent) {
        if (levelContent.type === 'chest') {
          // Create chest for HP tracking - HP will be initialized on first hit
          const chestType = levelContent.value as ChestType;
          const chestKey = `chest_level_${mineLevel}`;
          const chest = new ChestBlock(chestType);
          state.chestMap.set(chestKey, chest);
        } else {
          // Create MineBlock for HP tracking
          const oreType = levelContent.value;
          const miningAreaKey = `mining_area_level_${mineLevel}`;
          const oreHP = this.calculateOreHP(oreType, absoluteDepth, worldId);
          const block = new MineBlock(oreType, oreHP);
          state.blockMap.set(miningAreaKey, block);
        }
      }

      // Generate walls for all 3 Y coordinates of this level
      for (const yCoord of levelYCoords) {
        this.generateMineShaftWalls(yCoord, state.offset, worldId);
      }

      // Update deepest generated depth (bottom Y of this level)
      const bottomY = levelYCoords[levelYCoords.length - 1];
      if (bottomY < state.deepestGeneratedDepth) {
        state.deepestGeneratedDepth = bottomY;
      }
    }

    // Set up current level state from level 0
    const level0Content = state.levelSequence.get(0);
    if (level0Content) {
      if (level0Content.type === 'chest') {
        state.currentLevelIsChest = true;
        state.currentChestType = level0Content.value as ChestType;
        state.currentOreType = undefined;
      } else {
        state.currentLevelIsChest = false;
        state.currentChestType = undefined;
        state.currentOreType = level0Content.value;
      }
    }

    // Generate bottom floor at the deepest level (10 blocks below deepest generated)
    const bottomDepth = state.deepestGeneratedDepth - 10;
    this.generateBottomFloor(bottomDepth, state.offset, worldId);
    state.bottomFloorDepth = bottomDepth;
  }

  /**
   * Initializes the floor entity pool for a player
   * Creates a fixed pool of entities that leapfrog down the mine column.
   *
   * @param player - Player who owns this mining state
   * @param state - Player's mining state
   * @param pickaxe - Player's pickaxe (for ore generation with current luck)
   * @param worldId - World ID for ore generation
   */
  private initializeFloorEntityPool(
    player: Player,
    state: MiningState,
    pickaxe: PickaxeData,
    worldId: string
  ): void {
    // Clear any existing pool before rebuilding
    this.despawnFloorEntityPool(state);
    state.floorEntityPool = [];

    // Generate level sequence for initial levels (if not already present)
    const levelsToGenerate = this.INITIAL_MINE_LEVELS;
    for (let mineLevel = 0; mineLevel < levelsToGenerate; mineLevel++) {
      if (state.levelSequence.has(mineLevel)) continue;

      const absoluteDepth = mineLevel + 1;
      const chestSpawnResult = this.shouldSpawnChest(absoluteDepth);

      if (chestSpawnResult.shouldSpawn && chestSpawnResult.chestType !== null) {
        state.levelSequence.set(mineLevel, { type: 'chest', value: chestSpawnResult.chestType });
      } else {
        const oreType = this.generateOreType(pickaxe, absoluteDepth, player);
        state.levelSequence.set(mineLevel, { type: 'ore', value: oreType });
      }
    }

    const poolDepth = Math.min(FLOOR_ENTITY_POOL_SIZE, levelsToGenerate);
    for (let mineLevel = 0; mineLevel < poolDepth; mineLevel++) {
      const content = state.levelSequence.get(mineLevel);
      if (!content) continue;
      const entity = this.createFloorEntity(state, content, mineLevel, worldId);
      state.floorEntityPool.push({ entity, mineLevel, content });
    }

    console.log('[MiningSystem] Floor entity pool initialized:', 'size:', state.floorEntityPool.length);
  }

  /**
   * Initializes the ore/chest entity pool for a player
   * Creates one entity per unique ore/chest type that appears in the first 40 levels
   * Each entity is positioned at its first occurrence
   *
   * @param player - Player who owns this mining state
   * @param state - Player's mining state
   * @param pickaxe - Player's pickaxe (for ore generation with current luck)
   * @param worldId - World ID for ore generation
   */
  private initializeOreEntityPool(
    player: Player,
    state: MiningState,
    pickaxe: PickaxeData,
    worldId: string
  ): void {
    // Track first occurrence of each ore/chest type
    const firstOccurrence: Map<string, number> = new Map();

    // Generate level sequence for initial levels
    const levelsToGenerate = this.INITIAL_MINE_LEVELS;
    for (let mineLevel = 0; mineLevel < levelsToGenerate; mineLevel++) {
      const absoluteDepth = mineLevel + 1;

      // Check if this level should be a chest
      const chestSpawnResult = this.shouldSpawnChest(absoluteDepth);

      if (chestSpawnResult.shouldSpawn && chestSpawnResult.chestType !== null) {
        // Chest level
        const chestTypeValue = chestSpawnResult.chestType;
        state.levelSequence.set(mineLevel, { type: 'chest', value: chestTypeValue });

        // Track first occurrence (use chest type prefixed to distinguish from ore types)
        const chestKey = `chest_${chestTypeValue}`;
        if (!firstOccurrence.has(chestKey)) {
          firstOccurrence.set(chestKey, mineLevel);
        }
      } else {
        // Normal ore level
        const oreType = this.generateOreType(pickaxe, absoluteDepth, player);
        state.levelSequence.set(mineLevel, { type: 'ore', value: oreType });

        // Track first occurrence
        if (!firstOccurrence.has(oreType)) {
          firstOccurrence.set(oreType, mineLevel);
        }
      }
    }

    // Calculate next occurrence for each ore/chest type
    this.updateNextOccurrences(state, 0);

    // Create entities for each unique ore/chest type at their first occurrence
    for (const [typeKey, firstLevel] of firstOccurrence) {
      if (typeKey.startsWith('chest_')) {
        const chestTypeValue = typeKey.replace('chest_', '') as ChestType;
        if (!state.chestEntityPool.has(chestTypeValue)) {
          this.createPooledEntity(state, 'chest', chestTypeValue, firstLevel, worldId);
        }
      } else {
        if (!state.oreEntityPool.has(typeKey)) {
          this.createPooledEntity(state, 'ore', typeKey, firstLevel, worldId);
        }
      }
    }

    console.log('[MiningSystem] Entity pool initialized:',
      'ore types:', state.oreEntityPool.size,
      'chest types:', state.chestEntityPool.size);
  }

  /**
   * Updates the nextOccurrence map for efficient repositioning
   * Scans levelSequence from the given start level to find next occurrences
   *
   * @param state - Player's mining state
   * @param afterLevel - Start scanning from this level + 1
   */
  private updateNextOccurrences(state: MiningState, afterLevel: number): void {
    state.nextOccurrence.clear();

    const occurrencesByType: Map<string, number[]> = new Map();

    for (const [level, content] of state.levelSequence) {
      const key = content.type === 'chest' ? `chest_${content.value}` : content.value;
      if (!occurrencesByType.has(key)) {
        occurrencesByType.set(key, []);
      }
      occurrencesByType.get(key)!.push(level);
    }

    for (const [key, levels] of occurrencesByType) {
      levels.sort((a, b) => a - b);
      const nextLevel = levels.find(l => l > afterLevel);
      if (nextLevel !== undefined) {
        state.nextOccurrence.set(key, nextLevel);
      }
    }
  }

  /**
   * Finds the next occurrence of an ore/chest type after a given level
   *
   * @param state - Player's mining state
   * @param typeKey - Ore type or "chest_<chestType>" key
   * @param afterLevel - Find occurrence after this level
   * @returns Mine level number or -1 if not found
   */
  private findNextOccurrence(state: MiningState, typeKey: string, afterLevel: number): number {
    for (let level = afterLevel + 1; level < afterLevel + 1000; level++) {
      const content = state.levelSequence.get(level);
      if (!content) continue;

      const key = content.type === 'chest' ? `chest_${content.value}` : content.value;
      if (key === typeKey) {
        return level;
      }
    }

    // Not found in generated levels - return a far level
    return afterLevel + 2000;
  }

  /**
   * Repositions a pooled entity to a specific mine level
   *
   * @param entity - Entity to reposition
   * @param toMineLevel - Target mine level
   */
  private repositionOreEntity(entity: Entity, toMineLevel: number): void {
    if (!entity.isSpawned) return;

    const topY = this.mineLevelToTopY(toMineLevel);
    const centerY = topY - 1; // Adjusted for 3-block height
    const currentPos = entity.position;

    entity.setNextKinematicPosition({ x: currentPos.x, y: centerY, z: currentPos.z });
  }

  /**
   * Creates a pooled entity for a new ore or chest type
   * Called when an ore/chest type is encountered for the first time
   *
   * @param state - Player's mining state
   * @param type - 'ore' or 'chest'
   * @param value - Ore type name or ChestType value
   * @param mineLevel - Mine level to position the entity at
   * @param worldId - World ID for bounds calculation
   */
  private createPooledEntity(
    state: MiningState,
    type: 'ore' | 'chest',
    value: string,
    mineLevel: number,
    worldId: string
  ): void {
    const bounds = this.getMiningAreaBounds(worldId);
    const centerX = (bounds.minX + bounds.maxX) / 2 + state.offset.x;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2 + state.offset.z;
    const topY = this.mineLevelToTopY(mineLevel);
    const centerY = topY - 1;

    const texture = type === 'chest'
      ? this.getChestTextureUri(value as ChestType)
      : this.getOreTextureUri(value);

    const entity = new Entity({
      name: type === 'chest' ? `Chest Floor ${value}` : `Ore Floor ${value}`,
      blockTextureUri: texture,
      blockHalfExtents: POOLED_ENTITY_HALF_EXTENTS,
      rigidBodyOptions: {
        type: RigidBodyType.KINEMATIC_POSITION,
        colliders: [{
          shape: ColliderShape.BLOCK,
          halfExtents: POOLED_ENTITY_HALF_EXTENTS,
          collisionGroups: {
            belongsTo: [CollisionGroup.BLOCK],
            collidesWith: [CollisionGroup.ALL],
          },
        }],
      },
    });

    entity.spawn(this.world, { x: centerX, y: centerY, z: centerZ });

    if (type === 'chest') {
      state.chestEntityPool.set(value as ChestType, entity);
    } else {
      state.oreEntityPool.set(value, entity);
    }

    console.log('[MiningSystem] Created new pooled entity:', type, value, 'at level', mineLevel);
  }

  /**
   * Ensures that there are at least 20 mine levels generated ahead of the player
   * Called when player mines or falls deeper
   * Each mine level is 3 blocks tall (7x3x7)
   * 
   * @param player - Player to generate ahead for
   * @param state - Player's mining state
   * @param pickaxe - Player's pickaxe (for ore generation with current luck)
   */
  private ensureLevelsAheadOfPlayer(
    player: Player,
    state: MiningState,
    pickaxe: PickaxeData
  ): void {
    // Get world ID once for this method
    const worldId = this.getPlayerWorldId(player);
    
    // Calculate target mine level (20 levels ahead of current)
    const currentMineLevel = this.yCoordinateToMineLevel(state.currentDepth);
    const targetMineLevel = currentMineLevel + 20;
    const targetBottomY = this.mineLevelToTopY(targetMineLevel) - (BLOCKS_PER_MINE_LEVEL - 1);
    
    // If we've already generated to or beyond the target, no need to generate more
    if (state.deepestGeneratedDepth <= targetBottomY) {
      return;
    }

    // Calculate which mine levels we need to generate
    const currentDeepestMineLevel = this.yCoordinateToMineLevel(state.deepestGeneratedDepth);
    const startMineLevel = currentDeepestMineLevel + 1; // Next level to generate

      for (let mineLevel = startMineLevel; mineLevel <= targetMineLevel; mineLevel++) {
        const topY = this.mineLevelToTopY(mineLevel);
        const levelYCoords = this.getYCoordinatesForMineLevel(mineLevel);
        const absoluteDepth = mineLevel + 1; // For ore generation (1-based)
      
      // Check if this mine level was already generated (check if top Y is in generatedDepths)
      if (state.generatedDepths.has(topY)) {
        continue;
      }
      
      // Mark all 3 Y coordinates as generated
      for (const yCoord of levelYCoords) {
        state.generatedDepths.add(yCoord);
      }

      // With single floor entity approach: only generate HP tracking objects and walls
      // No floor blocks are generated - the floor entity handles visuals

      // Win block at depth 1000
      if (mineLevel === 999) {
        const miningAreaKey = `unminable_gold_level_${mineLevel}`;
        const goldOreType = worldId === 'island2' ? 'sunstonite' : OreType.GOLD;
        const goldBlock = new MineBlock(goldOreType, Number.MAX_SAFE_INTEGER);
        state.blockMap.set(miningAreaKey, goldBlock);
        // Add to level sequence (gold ore for win block)
        state.levelSequence.set(mineLevel, { type: 'ore', value: goldOreType });
        if (USE_ENTITY_POOLING && !state.oreEntityPool.has(goldOreType)) {
          this.createPooledEntity(state, 'ore', goldOreType, mineLevel, worldId);
        }
      } else {
        // Check if a chest should spawn at this mine level
        const chestSpawnResult = this.shouldSpawnChest(absoluteDepth);

        if (chestSpawnResult.shouldSpawn && chestSpawnResult.chestType !== null) {
          // Create chest for HP tracking
          const chestType = chestSpawnResult.chestType;
          const chestKey = `chest_level_${mineLevel}`;
          const chest = new ChestBlock(chestType);
          state.chestMap.set(chestKey, chest);
          // Add to level sequence
          state.levelSequence.set(mineLevel, { type: 'chest', value: chestType });
          if (USE_ENTITY_POOLING && !state.chestEntityPool.has(chestType)) {
            this.createPooledEntity(state, 'chest', chestType, mineLevel, worldId);
          }
        } else {
          // Create MineBlock for HP tracking
          const oreType = this.generateOreType(pickaxe, absoluteDepth, player);
          const miningAreaKey = `mining_area_level_${mineLevel}`;
          const oreHP = this.calculateOreHP(oreType, absoluteDepth, worldId);
          const block = new MineBlock(oreType, oreHP);
          state.blockMap.set(miningAreaKey, block);
          // Add to level sequence
          state.levelSequence.set(mineLevel, { type: 'ore', value: oreType });
          if (USE_ENTITY_POOLING && !state.oreEntityPool.has(oreType)) {
            this.createPooledEntity(state, 'ore', oreType, mineLevel, worldId);
          }
        }
      }

      // Generate walls for all 3 Y coordinates of this level
      for (const yCoord of levelYCoords) {
        this.generateMineShaftWalls(yCoord, state.offset, worldId);
      }

      // Update deepest generated depth (bottom Y of this level)
      const bottomY = levelYCoords[levelYCoords.length - 1];
      if (bottomY < state.deepestGeneratedDepth) {
        state.deepestGeneratedDepth = bottomY;
      }
    }
    
    // Generate/update bottom floor when we reach deep enough (only once)
    if (state.bottomFloorDepth === null || state.deepestGeneratedDepth < state.bottomFloorDepth + 10) {
      const bottomDepth = state.deepestGeneratedDepth - 10; // 10 blocks below deepest generated
      this.generateBottomFloor(bottomDepth, state.offset, worldId);
      state.bottomFloorDepth = bottomDepth;
    }
  }

  /**
   * Generates dirt walls around the mining area to create a mine shaft
   * Creates two solid boxes: inner box at layer 1, outer box at layer 10, with empty space (2-9) between them
   * World-aware: Uses correct bounds and wall material based on world
   * 
   * @param depth - Y coordinate (depth) to generate walls at
   * @param offset - World-space offset for this mine instance
   * @param worldId - World ID ('island1', 'island2', 'island3', 'island4', or 'island5')
   */
  private generateMineShaftWalls(depth: number, offset: { x: number; z: number }, worldId: string): void {
    const wallThickness = 10;
    const bounds = this.getMiningAreaBounds(worldId);
    const wallBlockId = worldId === 'island2'
      ? 43
      : worldId === 'island3'
        ? this.DEEPSLATE_COBBLE_BLOCK_TYPE_ID
        : worldId === 'island4'
          ? 100
          : worldId === 'island5'
            ? 123
            : this.DIRT_BLOCK_TYPE_ID;
    
    // Generate inner box (layer 1) - solid walls around the mining area
    const innerMinX = bounds.minX - 1 + offset.x;
    const innerMaxX = bounds.maxX + 1 + offset.x;
    const innerMinZ = bounds.minZ - 1 + offset.z;
    const innerMaxZ = bounds.maxZ + 1 + offset.z;
    
    // Inner box: all four sides (left, right, front, back) as solid walls
    for (let x = innerMinX; x <= innerMaxX; x++) {
      // Front wall of inner box
      this.generateWallBlock(x, depth, innerMinZ, wallBlockId);
      // Back wall of inner box
      this.generateWallBlock(x, depth, innerMaxZ, wallBlockId);
    }
    for (let z = innerMinZ; z <= innerMaxZ; z++) {
      // Left wall of inner box
      this.generateWallBlock(innerMinX, depth, z, wallBlockId);
      // Right wall of inner box
      this.generateWallBlock(innerMaxX, depth, z, wallBlockId);
    }
    
    // Generate outer box (layer 10) - solid walls 10 blocks out
    const outerMinX = bounds.minX - wallThickness + offset.x;
    const outerMaxX = bounds.maxX + wallThickness + offset.x;
    const outerMinZ = bounds.minZ - wallThickness + offset.z;
    const outerMaxZ = bounds.maxZ + wallThickness + offset.z;
    
    // Outer box: all four sides (left, right, front, back) as solid walls
    for (let x = outerMinX; x <= outerMaxX; x++) {
      // Front wall of outer box
      this.generateWallBlock(x, depth, outerMinZ, wallBlockId);
      // Back wall of outer box
      this.generateWallBlock(x, depth, outerMaxZ, wallBlockId);
    }
    for (let z = outerMinZ; z <= outerMaxZ; z++) {
      // Left wall of outer box
      this.generateWallBlock(outerMinX, depth, z, wallBlockId);
      // Right wall of outer box
      this.generateWallBlock(outerMaxX, depth, z, wallBlockId);
    }
  }

  /**
   * Builds a 10-layer hollow dirt shell above the mine to hide the offset area, leaving headroom
   * Only layers 1 and 10 are dirt, layers 2-9 are air (matching wall pattern)
   * Also generates vertical walls connecting ceiling to floor with the same pattern
   * World-aware: Uses correct bounds and wall material based on world
   */
  private buildMineCeiling(state: MiningState, worldId: string): void {
    const offset = state.offset;
    const bounds = this.getMiningAreaBounds(worldId);
    const wallBlockId = worldId === 'island2'
      ? 43
      : worldId === 'island3'
        ? this.DEEPSLATE_COBBLE_BLOCK_TYPE_ID
        : worldId === 'island4'
          ? 100
          : worldId === 'island5'
            ? 123
            : this.DIRT_BLOCK_TYPE_ID;
    const ceilingLayers = 10;
    const startY = MINE_DEPTH_START + 1; // lowered by one to sit closer to the floor
    const floorY = MINE_DEPTH_START; // Floor level
    const wallThickness = 10;
    const ceilingTopY = startY + ceilingLayers - 1;
    
    // Calculate ceiling bounds (matching wall thickness)
    const minX = bounds.minX + offset.x - wallThickness;
    const maxX = bounds.maxX + offset.x + wallThickness;
    const minZ = bounds.minZ + offset.z - wallThickness;
    const maxZ = bounds.maxZ + offset.z + wallThickness;

    // Generate ceiling as two solid boxes: inner box (layer 1) and outer box (layer 10)
    // Inner box bounds (layer 1)
    const innerCeilingMinX = bounds.minX + offset.x - 1;
    const innerCeilingMaxX = bounds.maxX + offset.x + 1;
    const innerCeilingMinZ = bounds.minZ + offset.z - 1;
    const innerCeilingMaxZ = bounds.maxZ + offset.z + 1;
    
    // Outer box bounds (layer 10)
    const outerCeilingMinX = bounds.minX + offset.x - wallThickness;
    const outerCeilingMaxX = bounds.maxX + offset.x + wallThickness;
    const outerCeilingMinZ = bounds.minZ + offset.z - wallThickness;
    const outerCeilingMaxZ = bounds.maxZ + offset.z + wallThickness;
    
    // Generate inner box ceiling (layer 1) - solid perimeter
    const innerCeilingY = startY; // Layer 1 (index 0)
    for (let x = innerCeilingMinX; x <= innerCeilingMaxX; x++) {
      for (let z = innerCeilingMinZ; z <= innerCeilingMaxZ; z++) {
        const isPerimeter = x === innerCeilingMinX || x === innerCeilingMaxX || z === innerCeilingMinZ || z === innerCeilingMaxZ;
        if (!isPerimeter) continue; // Only perimeter for inner box
        try {
          this.world.chunkLattice.setBlock({ x, y: innerCeilingY, z }, wallBlockId);
        } catch (error) {

        }
      }
    }
    
    // Generate outer box ceiling (layer 10) - solid top cap
    const outerCeilingY = startY + ceilingLayers - 1; // Layer 10 (index 9)
    for (let x = outerCeilingMinX; x <= outerCeilingMaxX; x++) {
      for (let z = outerCeilingMinZ; z <= outerCeilingMaxZ; z++) {
        const isPerimeter = x === outerCeilingMinX || x === outerCeilingMaxX || z === outerCeilingMinZ || z === outerCeilingMaxZ;
        if (!isPerimeter) continue; // Only perimeter for outer box
        try {
          this.world.chunkLattice.setBlock({ x, y: outerCeilingY, z }, wallBlockId);
        } catch (error) {

        }
      }
    }
    
    // Generate vertical walls connecting ceiling to floor - only at inner and outer box positions
    // Inner box vertical walls (layer 1) - from floor to inner ceiling
    // Use the same bounds as inner ceiling
    const innerWallMinX = innerCeilingMinX;
    const innerWallMaxX = innerCeilingMaxX;
    const innerWallMinZ = innerCeilingMinZ;
    const innerWallMaxZ = innerCeilingMaxZ;
    
    // Inner box vertical walls: left, right, front, back
    // Make inner box same height as outer box (go all the way to ceiling top)
    for (let y = floorY; y <= outerCeilingY; y++) {
      // Left wall
      for (let z = innerWallMinZ; z <= innerWallMaxZ; z++) {
        try {
          this.world.chunkLattice.setBlock({ x: innerWallMinX, y, z }, wallBlockId);
        } catch (error) {}
      }
      // Right wall
      for (let z = innerWallMinZ; z <= innerWallMaxZ; z++) {
        try {
          this.world.chunkLattice.setBlock({ x: innerWallMaxX, y, z }, wallBlockId);
        } catch (error) {}
      }
      // Front wall
      for (let x = innerWallMinX; x <= innerWallMaxX; x++) {
        try {
          this.world.chunkLattice.setBlock({ x, y, z: innerWallMinZ }, wallBlockId);
        } catch (error) {}
      }
      // Back wall
      for (let x = innerWallMinX; x <= innerWallMaxX; x++) {
        try {
          this.world.chunkLattice.setBlock({ x, y, z: innerWallMaxZ }, wallBlockId);
        } catch (error) {}
      }
    }
    
    // Outer box vertical walls (layer 10) - from floor to outer ceiling
    // Use the same bounds as outer ceiling
    const outerWallMinX = outerCeilingMinX;
    const outerWallMaxX = outerCeilingMaxX;
    const outerWallMinZ = outerCeilingMinZ;
    const outerWallMaxZ = outerCeilingMaxZ;
    
    // Outer box vertical walls: left, right, front, back
    for (let y = floorY; y <= outerCeilingY; y++) {
      // Left wall
      for (let z = outerWallMinZ; z <= outerWallMaxZ; z++) {
        try {
          this.world.chunkLattice.setBlock({ x: outerWallMinX, y, z }, wallBlockId);
        } catch (error) {}
      }
      // Right wall
      for (let z = outerWallMinZ; z <= outerWallMaxZ; z++) {
        try {
          this.world.chunkLattice.setBlock({ x: outerWallMaxX, y, z }, wallBlockId);
        } catch (error) {}
      }
      // Front wall
      for (let x = outerWallMinX; x <= outerWallMaxX; x++) {
        try {
          this.world.chunkLattice.setBlock({ x, y, z: outerWallMinZ }, wallBlockId);
        } catch (error) {}
      }
      // Back wall
      for (let x = outerWallMinX; x <= outerWallMaxX; x++) {
        try {
          this.world.chunkLattice.setBlock({ x, y, z: outerWallMaxZ }, wallBlockId);
        } catch (error) {}
      }
    }
  }

  /**
   * Generates the bottom floor at the bottommost level
   * Fills wall depths 2-9 with dirt/sand to create a solid floor between inner and outer walls
   * Excludes the mining area itself so players can still mine
   * World-aware: Uses correct bounds and wall material based on world
   * 
   * @param floorDepth - Y coordinate (depth) of the floor
   * @param offset - Player's mine offset
   * @param worldId - World ID ('island1', 'island2', 'island3', 'island4', or 'island5')
   */
  private generateBottomFloor(floorDepth: number, offset: { x: number; z: number }, worldId: string): void {
    const wallThickness = 10;
    const bounds = this.getMiningAreaBounds(worldId);
    const wallBlockId = worldId === 'island2'
      ? 43
      : worldId === 'island3'
        ? this.DEEPSLATE_COBBLE_BLOCK_TYPE_ID
        : worldId === 'island4'
          ? 100
          : worldId === 'island5'
            ? 123
            : this.DIRT_BLOCK_TYPE_ID;
    
    // Mining area bounds (with offset) - this area should NOT be filled
    const miningMinX = bounds.minX + offset.x;
    const miningMaxX = bounds.maxX + offset.x;
    const miningMinZ = bounds.minZ + offset.z;
    const miningMaxZ = bounds.maxZ + offset.z;
    
    // Fill layers 2-9 with dirt/sand (wall depths 2-9)
    for (let wallOffset = 2; wallOffset <= 9; wallOffset++) {
      // Calculate bounds for this wall depth
      const floorMinX = bounds.minX - wallOffset + offset.x;
      const floorMaxX = bounds.maxX + wallOffset + offset.x;
      const floorMinZ = bounds.minZ - wallOffset + offset.z;
      const floorMaxZ = bounds.maxZ + wallOffset + offset.z;
      
      // Fill the area at this wall depth with dirt/sand, but exclude the mining area
      for (let x = floorMinX; x <= floorMaxX; x++) {
        for (let z = floorMinZ; z <= floorMaxZ; z++) {
          // Skip if this position is within the mining area
          if (x >= miningMinX && x <= miningMaxX && z >= miningMinZ && z <= miningMaxZ) {
            continue; // Don't fill the mining area - players need to mine here
          }
          
          try {
            this.world.chunkLattice.setBlock({ x, y: floorDepth, z }, wallBlockId);
          } catch (error) {
            // Silently fail
          }
        }
      }
    }

  }

  /**
   * Deletes the bottom floor at a specific depth
   * Removes dirt/sand blocks from wall depths 2-9 (excluding mining area and wall positions)
   * World-aware: Uses correct bounds based on world
   * 
   * @param floorDepth - Y coordinate (depth) of the floor to delete
   * @param offset - Player's mine offset
   * @param worldId - World ID ('island1', 'island2', 'island3', 'island4', or 'island5')
   */
  private deleteBottomFloor(floorDepth: number, offset: { x: number; z: number }, worldId: string): void {
    const wallThickness = 10;
    const bounds = this.getMiningAreaBounds(worldId);
    
    // Mining area bounds (with offset) - this area should NOT be deleted (it's not part of the floor)
    const miningMinX = bounds.minX + offset.x;
    const miningMaxX = bounds.maxX + offset.x;
    const miningMinZ = bounds.minZ + offset.z;
    const miningMaxZ = bounds.maxZ + offset.z;
    
    // Inner wall bounds (layer 1) - these should NOT be deleted (they're walls, not floor)
    const innerWallMinX = bounds.minX - 1 + offset.x;
    const innerWallMaxX = bounds.maxX + 1 + offset.x;
    const innerWallMinZ = bounds.minZ - 1 + offset.z;
    const innerWallMaxZ = bounds.maxZ + 1 + offset.z;
    
    // Outer wall bounds (layer 10) - these should NOT be deleted (they're walls, not floor)
    const outerWallMinX = bounds.minX - wallThickness + offset.x;
    const outerWallMaxX = bounds.maxX + wallThickness + offset.x;
    const outerWallMinZ = bounds.minZ - wallThickness + offset.z;
    const outerWallMaxZ = bounds.maxZ + wallThickness + offset.z;
    
    // Delete layers 2-9 (wall depths 2-9)
    for (let wallOffset = 2; wallOffset <= 9; wallOffset++) {
      // Calculate bounds for this wall depth
      const floorMinX = bounds.minX - wallOffset + offset.x;
      const floorMaxX = bounds.maxX + wallOffset + offset.x;
      const floorMinZ = bounds.minZ - wallOffset + offset.z;
      const floorMaxZ = bounds.maxZ + wallOffset + offset.z;
      
      // Delete blocks at this wall depth (set to air), but skip the mining area and wall positions
      for (let x = floorMinX; x <= floorMaxX; x++) {
        for (let z = floorMinZ; z <= floorMaxZ; z++) {
          // Skip if this position is within the mining area
          if (x >= miningMinX && x <= miningMaxX && z >= miningMinZ && z <= miningMaxZ) {
            continue; // Don't delete blocks in the mining area
          }
          
          // Skip if this position is part of the inner wall (layer 1)
          const isInnerWallX = (x === innerWallMinX || x === innerWallMaxX) && (z >= innerWallMinZ && z <= innerWallMaxZ);
          const isInnerWallZ = (z === innerWallMinZ || z === innerWallMaxZ) && (x >= innerWallMinX && x <= innerWallMaxX);
          if (isInnerWallX || isInnerWallZ) {
            continue; // Don't delete inner wall blocks
          }
          
          // Skip if this position is part of the outer wall (layer 10)
          const isOuterWallX = (x === outerWallMinX || x === outerWallMaxX) && (z >= outerWallMinZ && z <= outerWallMaxZ);
          const isOuterWallZ = (z === outerWallMinZ || z === outerWallMaxZ) && (x >= outerWallMinX && x <= outerWallMaxX);
          if (isOuterWallX || isOuterWallZ) {
            continue; // Don't delete outer wall blocks
          }
          
          try {
            this.world.chunkLattice.setBlock({ x, y: floorDepth, z }, 0); // 0 = air
          } catch (error) {
            // Silently fail
          }
        }
      }
    }

  }

  /**
   * Generates a single wall block at the specified position
   * Only generates if the position is air/empty
   * World-aware: Uses sand for Island 2, dirt for Island 1
   * 
   * @param x - X coordinate
   * @param y - Y coordinate (depth)
   * @param z - Z coordinate
   * @param blockId - Block ID to use (dirt for Island 1, sand for Island 2)
   */
  private generateWallBlock(x: number, y: number, z: number, blockId: number): void {
    const wallPosition = { x, y, z };
    
    try {
      // Check if block already exists at this position
      const existingBlockId = this.world.chunkLattice.getBlockId(wallPosition);
      
      // Only create wall block if it doesn't exist (air = 0 or undefined)
      if (!existingBlockId || existingBlockId === 0) {
        // Set block to the specified block ID (dirt for Island 1, sand for Island 2)
        this.world.chunkLattice.setBlock(wallPosition, blockId);
      }
    } catch (error) {
      // Silently fail for wall generation - not critical
      // console.warn(`[MiningSystem] Failed to generate wall block at ${x},${y},${z}:`, error);
    }
  }

  /**
   * Draws manual debug markers along the raycast direction
   */
  private drawRaycastDebugLine(
    origin: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number },
    length: number
  ): void {
    if (!this.DEBUG_RAYCAST_MARKERS_ENABLED) {
      return;
    }

    const segments = this.DEBUG_RAYCAST_MARKER_SEGMENTS;
    const clampedLength = Math.max(length, 0);
    const segmentLength = clampedLength / segments;

    for (let i = 0; i <= segments; i++) {
      const distance = i * segmentLength;
      const markerPosition = {
        x: origin.x + direction.x * distance,
        y: origin.y + direction.y * distance,
        z: origin.z + direction.z * distance,
      };

      const marker = new Entity({
        name: 'Mining Ray Debug Marker',
        blockTextureUri: 'blocks/redstone_block.png',
        blockHalfExtents: { x: 0.02, y: 0.02, z: 0.02 }, // Much smaller to reduce collision
        tintColor: { r: 255, g: 80, b: 80 },
        opacity: 0.6, // More transparent
        isEnvironmental: true,
        tag: 'debug-ray-marker',
        rigidBodyOptions: {
          type: RigidBodyType.KINEMATIC_POSITION,
          // Explicitly set empty colliders array to prevent auto-creation
          colliders: [],
        },
      });

      marker.spawn(this.world, markerPosition);

      setTimeout(() => {
        try {
          marker.despawn();
        } catch (error) {

        }
      }, this.DEBUG_RAYCAST_MARKER_LIFETIME_MS);
    }
  }

  /**
   * Determines if a chest should spawn at the given depth (probabilistic, chance-based)
   * 
   * Design: Pure chance-based with no guarantees
   * - Basic chests: ~2-5% chance per level (roughly 1 every 20-50 levels on average)
   * - Golden chests: ~0.3-0.5% chance per level (roughly 3-5 per 1000 levels on average)
   * - Each spawn is independent - no minimums or maximums
   * - Depth scaling: Slightly increases chance with depth (rewards deeper progression)
   * 
   * @param absoluteDepth - Current depth (1-1000)
   * @returns Object indicating if chest should spawn and what type
   */
  private shouldSpawnChest(absoluteDepth: number): { shouldSpawn: boolean; chestType: ChestType | null } {
    // First check for golden chest (rarer, so check first)
    // Base chance: ~0.3-0.5% per level, with slight depth scaling
    // At depth 1: 0.3%, at depth 1000: 0.5%
    const goldenBaseChance = 0.003; // 0.3% base
    const goldenDepthBonus = (absoluteDepth / 1000) * 0.002; // Up to +0.2% at depth 1000
    const goldenChance = goldenBaseChance + goldenDepthBonus;
    
    if (Math.random() < goldenChance) {
      return { shouldSpawn: true, chestType: ChestType.GOLDEN };
    }
    
    // Then check for basic chest
    // Base chance: ~2-5% per level, with slight depth scaling
    // At depth 1: 2%, at depth 1000: 5%
    const basicBaseChance = 0.02; // 2% base
    const basicDepthBonus = (absoluteDepth / 1000) * 0.03; // Up to +3% at depth 1000
    const basicChance = basicBaseChance + basicDepthBonus;
    
    if (Math.random() < basicChance) {
      return { shouldSpawn: true, chestType: ChestType.BASIC };
    }
    
    // No chest spawns
    return { shouldSpawn: false, chestType: null };
  }

  /**
   * Spawns a burst particle effect when the player breaks through a floor
   * Effect spreads ±4 blocks on X and Z axes from the mine center
   */
  private spawnFloorBreakEffect(player: Player, oreType: string, newFloorY: number): void {
    const center = this.getMineCenter(player);

    // Get ore color from appropriate database
    const oreData = ORE_DATABASE[oreType as OreType] ||
                    ISLAND2_ORE_DATABASE[oreType as ISLAND2_ORE_TYPE] ||
                    ISLAND3_ORE_DATABASE[oreType as ISLAND3_ORE_TYPE] ||
                    ISLAND4_ORE_DATABASE[oreType as ISLAND4_ORE_TYPE] ||
                    ISLAND5_ORE_DATABASE[oreType as ISLAND5_ORE_TYPE];
    const hexColor = oreData?.color || '#808080';
    const color = this.hexToRgb(hexColor);

    if (DEBUG_MINING) console.log('[MiningSystem] Spawning floor break effect at', center.x, newFloorY + 1.5, center.z, 'color:', hexColor);

    const emitter = new ParticleEmitter({
      position: { x: center.x, y: newFloorY + 1.5, z: center.z },
      textureUri: 'particles/smoke_04.png',
      colorStart: color,
      colorEnd: color,
      colorIntensityStart: 1.5,
      colorIntensityEnd: 0.8,
      sizeStart: 1.2,
      sizeEnd: 0.4,
      opacityStart: 1.0,
      opacityEnd: 0,
      positionVariance: { x: 3, y: 0.5, z: 3 },
      velocity: { x: 0, y: 2.0, z: 0 },
      velocityVariance: { x: 1.5, y: 1.0, z: 1.5 },
      lifetime: 0.6,
      lifetimeVariance: 0.15,
      rate: 40,
      maxParticles: 80,
    });

    emitter.spawn(this.world);
    setTimeout(() => emitter.despawn(), 800);
  }

  /**
   * Converts a hex color string to RGB object
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 128, g: 128, b: 128 };
  }

  /**
   * Transitions the floor entity to the next mine level
   * Uses a small leapfrog pool so visible blocks never slide.
   *
   * @param player - Player whose floor entity to transition
   * @param state - Player's mining state
   * @param nextMineLevel - The next mine level to transition to (player is falling to this level)
   * @param pickaxe - Player's pickaxe (for ore generation if needed)
   */
  private transitionFloorEntityToNextLevel(
    player: Player,
    state: MiningState,
    nextMineLevel: number,
    pickaxe: PickaxeData
  ): void {
    const worldId = this.getPlayerWorldId(player);
    const currentMineLevel = nextMineLevel - 1; // The level that was just mined
    const absoluteDepth = nextMineLevel + 1;

    if (USE_ENTITY_POOLING) {
      // Get what was at the just-mined level
      const currentLevelContent = state.levelSequence.get(currentMineLevel);

      if (currentLevelContent) {
        // Reposition the entity for the just-mined ore/chest type to its next occurrence
        const typeKey = currentLevelContent.type === 'chest'
          ? `chest_${currentLevelContent.value}`
          : currentLevelContent.value;

        const nextOccurrence = this.findNextOccurrence(state, typeKey, currentMineLevel);

        if (currentLevelContent.type === 'chest') {
          const chestType = currentLevelContent.value as ChestType;
          const entity = state.chestEntityPool.get(chestType);
          if (entity) {
            this.repositionOreEntity(entity, nextOccurrence);
            console.log('[MiningSystem] Repositioned chest entity', chestType, 'from level', currentMineLevel, 'to level', nextOccurrence);
          }
        } else {
          const oreType = currentLevelContent.value;
          const entity = state.oreEntityPool.get(oreType);
          if (entity) {
            this.repositionOreEntity(entity, nextOccurrence);
            console.log('[MiningSystem] Repositioned ore entity', oreType, 'from level', currentMineLevel, 'to level', nextOccurrence);
          }
        }
      }

      // Check what's at the next level and update state tracking
      const chestKey = `chest_level_${nextMineLevel}`;
      const miningAreaKey = `mining_area_level_${nextMineLevel}`;
      const unminableGoldKey = `unminable_gold_level_${nextMineLevel}`;

      const chest = state.chestMap.get(chestKey);
      const unminableGoldBlock = state.blockMap.get(unminableGoldKey);
      const oreBlock = state.blockMap.get(miningAreaKey);

      if (unminableGoldBlock) {
        // Win block
        state.currentLevelIsChest = false;
        state.currentChestType = undefined;
        state.currentOreType = OreType.GOLD;
      } else if (chest) {
        // Chest level
        state.currentLevelIsChest = true;
        state.currentChestType = chest.chestType;
        state.currentOreType = undefined;
      } else if (oreBlock) {
        // Normal ore level
        state.currentLevelIsChest = false;
        state.currentChestType = undefined;
        state.currentOreType = oreBlock.oreType;
      } else {
        // Level not generated yet - generate it and add to sequence
        const chestSpawnResult = this.shouldSpawnChest(absoluteDepth);

        if (chestSpawnResult.shouldSpawn && chestSpawnResult.chestType !== null) {
          const newChest = new ChestBlock(chestSpawnResult.chestType);
          state.chestMap.set(chestKey, newChest);
          state.currentLevelIsChest = true;
          state.currentChestType = chestSpawnResult.chestType;
          state.currentOreType = undefined;

          // Add to level sequence
          state.levelSequence.set(nextMineLevel, { type: 'chest', value: chestSpawnResult.chestType });

          // Create entity if this chest type doesn't have one yet
          if (!state.chestEntityPool.has(chestSpawnResult.chestType)) {
            this.createPooledEntity(state, 'chest', chestSpawnResult.chestType, nextMineLevel, worldId);
          }
        } else {
          const oreType = this.generateOreType(pickaxe, absoluteDepth, player);
          const oreHP = this.calculateOreHP(oreType, absoluteDepth, worldId);
          const newBlock = new MineBlock(oreType, oreHP);
          state.blockMap.set(miningAreaKey, newBlock);
          state.currentLevelIsChest = false;
          state.currentChestType = undefined;
          state.currentOreType = oreType;

          // Add to level sequence
          state.levelSequence.set(nextMineLevel, { type: 'ore', value: oreType });

          // Create entity if this ore type doesn't have one yet
          if (!state.oreEntityPool.has(oreType)) {
            this.createPooledEntity(state, 'ore', oreType, nextMineLevel, worldId);
          }
        }
      }

      console.log('[MiningSystem] Player transitioned to level', nextMineLevel,
        'ore:', state.currentOreType, 'chest:', state.currentChestType);
      return;
    }

    // Ensure future levels exist for pool leapfrogging
    this.ensureLevelsAheadOfPlayer(player, state, pickaxe);

    // Recycle the consumed pooled entity to the next deepest level
    this.advanceFloorEntityPool(player, state, currentMineLevel, pickaxe, worldId);

    // Check what's at the next level and update state tracking
    const chestKey = `chest_level_${nextMineLevel}`;
    const miningAreaKey = `mining_area_level_${nextMineLevel}`;
    const unminableGoldKey = `unminable_gold_level_${nextMineLevel}`;

    const chest = state.chestMap.get(chestKey);
    const unminableGoldBlock = state.blockMap.get(unminableGoldKey);
    const oreBlock = state.blockMap.get(miningAreaKey);

    if (unminableGoldBlock) {
      // Win block
      state.currentLevelIsChest = false;
      state.currentChestType = undefined;
      state.currentOreType = OreType.GOLD;
    } else if (chest) {
      // Chest level
      state.currentLevelIsChest = true;
      state.currentChestType = chest.chestType;
      state.currentOreType = undefined;
    } else if (oreBlock) {
      // Normal ore level
      state.currentLevelIsChest = false;
      state.currentChestType = undefined;
      state.currentOreType = oreBlock.oreType;
    } else {
      // Level not generated yet - generate it and add to sequence
      const chestSpawnResult = this.shouldSpawnChest(absoluteDepth);

      if (chestSpawnResult.shouldSpawn && chestSpawnResult.chestType !== null) {
        const newChest = new ChestBlock(chestSpawnResult.chestType);
        state.chestMap.set(chestKey, newChest);
        state.currentLevelIsChest = true;
        state.currentChestType = chestSpawnResult.chestType;
        state.currentOreType = undefined;

        // Add to level sequence
        state.levelSequence.set(nextMineLevel, { type: 'chest', value: chestSpawnResult.chestType });
      } else {
        const oreType = this.generateOreType(pickaxe, absoluteDepth, player);
        const oreHP = this.calculateOreHP(oreType, absoluteDepth, worldId);
        const newBlock = new MineBlock(oreType, oreHP);
        state.blockMap.set(miningAreaKey, newBlock);
        state.currentLevelIsChest = false;
        state.currentChestType = undefined;
        state.currentOreType = oreType;

        // Add to level sequence
        state.levelSequence.set(nextMineLevel, { type: 'ore', value: oreType });
      }
    }

    console.log('[MiningSystem] Player transitioned to level', nextMineLevel,
      'ore:', state.currentOreType, 'chest:', state.currentChestType);
  }

  private advanceFloorEntityPool(
    player: Player,
    state: MiningState,
    minedLevel: number,
    pickaxe: PickaxeData,
    worldId: string
  ): void {
    if (!state.floorEntityPool || state.floorEntityPool.length === 0) return;

    const poolEntry = state.floorEntityPool.find(entry => entry.mineLevel === minedLevel);
    if (!poolEntry) return;

    const newMineLevel = minedLevel + FLOOR_ENTITY_POOL_SIZE;
    let newContent = state.levelSequence.get(newMineLevel);

    if (!newContent) {
      const absoluteDepth = newMineLevel + 1;
      const chestSpawnResult = this.shouldSpawnChest(absoluteDepth);

      if (chestSpawnResult.shouldSpawn && chestSpawnResult.chestType !== null) {
        newContent = { type: 'chest', value: chestSpawnResult.chestType };
        state.levelSequence.set(newMineLevel, newContent);

        const chestKey = `chest_level_${newMineLevel}`;
        if (!state.chestMap.has(chestKey)) {
          state.chestMap.set(chestKey, new ChestBlock(chestSpawnResult.chestType));
        }
      } else {
        const oreType = this.generateOreType(pickaxe, absoluteDepth, player);
        const oreHP = this.calculateOreHP(oreType, absoluteDepth, worldId);
        newContent = { type: 'ore', value: oreType };
        state.levelSequence.set(newMineLevel, newContent);

        const miningAreaKey = `mining_area_level_${newMineLevel}`;
        if (!state.blockMap.has(miningAreaKey)) {
          state.blockMap.set(miningAreaKey, new MineBlock(oreType, oreHP));
        }
      }
    }

    try {
      if (poolEntry.entity?.isSpawned) {
        poolEntry.entity.despawn();
      }
    } catch (error) {
      // Entity might already be despawned
    }

    poolEntry.entity = this.createFloorEntity(state, newContent, newMineLevel, worldId);
    poolEntry.mineLevel = newMineLevel;
    poolEntry.content = newContent;
  }

  private createFloorEntity(
    state: MiningState,
    content: LevelContent,
    mineLevel: number,
    worldId: string
  ): Entity {
    const bounds = this.getMiningAreaBounds(worldId);
    const centerX = (bounds.minX + bounds.maxX) / 2 + state.offset.x;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2 + state.offset.z;
    const topY = this.mineLevelToTopY(mineLevel);
    const centerY = topY; // 1-block tall visual, spaced every 3 blocks

    const texture = content.type === 'chest'
      ? this.getChestTextureUri(content.value as ChestType)
      : this.getOreTextureUri(content.value);

    const entity = new Entity({
      name: content.type === 'chest' ? `Chest Floor ${content.value}` : `Ore Floor ${content.value}`,
      blockTextureUri: texture,
      blockHalfExtents: FLOOR_ENTITY_HALF_EXTENTS,
      rigidBodyOptions: {
        type: RigidBodyType.KINEMATIC_POSITION,
        colliders: [{
          shape: ColliderShape.BLOCK,
          halfExtents: FLOOR_ENTITY_HALF_EXTENTS,
          collisionGroups: {
            belongsTo: [CollisionGroup.BLOCK],
            collidesWith: [CollisionGroup.ALL],
          },
        }],
      },
    });

    entity.spawn(this.world, { x: centerX, y: centerY, z: centerZ });
    return entity;
  }
}



