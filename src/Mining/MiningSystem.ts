/**
 * Mining System
 * 
 * Handles the core mining mechanics: raycast-based block mining with left click.
 * Tracks block HP per position and handles ore collection.
 * 
 * Reference: Planning/gameOverview.txt section 6.1, 6.2
 */

import { World, Player, Entity, RigidBodyType } from 'hytopia';
import { calculateMiningDamage } from '../Stats/StatCalculator';
import type { PickaxeData } from '../Pickaxe/PickaxeData';
import type { PlayerData } from '../Core/PlayerData';
import { OreType, ORE_DATABASE } from './Ore/OreData';
import { OreGenerator } from './Ore/OreGenerator';
import { MineBlock } from './MineBlock';
import { MINING_AREA_BOUNDS, MINING_AREA_POSITIONS, MINE_DEPTH_START, MINE_INSTANCE_SPACING } from '../Core/GameConstants';

/**
 * Mining block position key (x,y,z)
 */
type BlockPositionKey = string;

/**
 * Mining state for a player
 */
interface MiningState {
  /** Map of block positions to their MineBlock instances */
  blockMap: Map<BlockPositionKey, MineBlock>;
  
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

  /** World-space offset applied to this player's personal mine */
  offset: { x: number; z: number };

  /** Whether the overhead dirt ceiling was built */
  ceilingBuilt: boolean;

  /** Depth of the bottommost floor (10 blocks below currentDepth) */
  bottomFloorDepth: number | null;
}

/**
 * Mining System class
 * Manages mining state and block HP tracking for all players
 */
export class MiningSystem {
  private miningStates: Map<Player, MiningState> = new Map();
  private mineOffsets: Map<Player, { x: number; z: number }> = new Map();
  private nextInstanceIndex = 0;
  private world: World;
  private getPlayerDataCallback?: (player: Player) => PlayerData | undefined;
  private firstBlockMined: Map<Player, boolean> = new Map();
  private onFirstBlockMinedCallback?: (player: Player) => void;
  private getPickaxeCallback?: (player: Player) => PickaxeData | undefined;
  private oreGenerator: OreGenerator;
  
  /** Mining block type ID (stone = 8) */
  private readonly MINING_BLOCK_TYPE_ID = 8;
  
  /** Dirt block type ID for walls (dirt = 9) */
  private readonly DIRT_BLOCK_TYPE_ID = 9;
  
  /** Maximum mining distance */
  private readonly MAX_MINING_DISTANCE = 250;

  /** Whether to spawn manual debug markers for raycasts */
  private readonly DEBUG_RAYCAST_MARKERS_ENABLED = false; // Disabled - causes collision issues
  private readonly DEBUG_RAYCAST_MARKER_SEGMENTS = 12;
  private readonly DEBUG_RAYCAST_MARKER_LIFETIME_MS = 200;

  constructor(world: World) {
    this.world = world;
    this.oreGenerator = new OreGenerator();
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
   * Sets callback to get player's pickaxe
   * 
   * @param callback - Function to get player's pickaxe
   */
  setGetPickaxeCallback(callback: (player: Player) => PickaxeData | undefined): void {
    this.getPickaxeCallback = callback;
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
    onOreMined: (player: Player, oreType: OreType, amount: number) => void,
    onDamageDealt: (player: Player, damage: number, currentOre: OreType | null, blockHP: number, maxHP: number) => void
  ): void {
    const playerEntity = this.getPlayerEntity(player);
    if (!playerEntity) {
      console.warn('*** [MiningSystem] Player entity not found - ABORTING ***');
      return;
    }
    
    // Check if player.camera exists
    if (!player.camera) {
      console.error('*** [MiningSystem] ERROR: player.camera does not exist! ***');
      return;
    }

    // Get or create mining state (ensures initial level)
    const state = this.getOrCreateState(player, pickaxe);

    // RATE LIMITING: Enforce swing rate based on pickaxe mining speed
    // Calculate minimum time between hits (in milliseconds)
    const hitRate = pickaxe.miningSpeed; // swings per second
    const minTimeBetweenHits = 1000 / hitRate; // milliseconds between hits
    
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
      console.warn('[MiningSystem] Player data not found');
      return;
    }

    // Perform raycast from player's feet straight down
    // This allows the player to look around while mining the block they're standing on
    const playerFeetPosition = {
      x: playerEntity.position.x,
      y: playerEntity.position.y, // Player's feet position
      z: playerEntity.position.z,
    };

    // Raycast straight down to check what block the player is standing on
    const direction = { x: 0, y: -1, z: 0 }; // Straight down

    // Draw manual debug markers so the player can see the ray in-game
    this.drawRaycastDebugLine(playerFeetPosition, direction, 5); // Only need to check a few blocks down

    // Perform raycast straight down from player's feet
    // Exclude player's own rigid body to prevent self-hits
    const hitResult = this.world.simulation.raycast(
      playerFeetPosition,
      direction,
      5, // Only need to check a few blocks below feet
      {
        filterExcludeRigidBody: (playerEntity as any).rawRigidBody,
      }
    );
    
    if (!hitResult) {
      // No hit, clear target
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
    const resolvedBlockCoordinate = {
      x: Math.floor(rawCoordinate.x),
      y: Math.floor(rawCoordinate.y),
      z: Math.floor(rawCoordinate.z),
    };

    // Get player's current depth (floor of Y position)
    // Depth is negative as you go down, so we convert to positive for ore generation
    const playerDepth = Math.floor(playerEntity.position.y);
    const hitDepth = resolvedBlockCoordinate.y;
    const absoluteDepth = Math.abs(hitDepth); // Convert to positive depth for ore generation
    
    // Check if block is within the mining area bounds (X and Z)
    // Only blocks in the mining area can take damage
    const offsetBounds = this.getOffsetBounds(state.offset);
    const isInMiningArea = 
      resolvedBlockCoordinate.x >= offsetBounds.minX &&
      resolvedBlockCoordinate.x <= offsetBounds.maxX &&
      resolvedBlockCoordinate.z >= offsetBounds.minZ &&
      resolvedBlockCoordinate.z <= offsetBounds.maxZ;
    
    if (!isInMiningArea) {
      // Block is not in mining area, cannot mine it
      state.currentTargetBlock = null;
      return;
    }
    
    // Check if player is mining the level they're standing on
    // Player should only be able to mine the block at their current depth
    const isMiningCurrentLevel = hitDepth === state.currentDepth;
    
    if (!isMiningCurrentLevel) {
      // Can't mine blocks that aren't at current depth
      state.currentTargetBlock = null;
      return;
    }

    // The entire mining area at this depth shares one health pool
    // Use a single key for the entire mining area level
    const miningAreaKey = `mining_area_level_${hitDepth}`;
    
    // Get shared block for entire mining area at this depth
    // All levels are pre-generated, so this should always exist
    let block = state.blockMap.get(miningAreaKey);
    if (!block) {
      // Fallback: regenerate this level if somehow missing (shouldn't happen)
      console.warn(`[MiningSystem] Block data missing for depth ${hitDepth}, regenerating...`);
      const oreType = this.generateOreType(pickaxe, absoluteDepth);
      const oreHP = this.calculateOreHP(oreType, absoluteDepth);
      block = new MineBlock(oreType, oreHP);
      state.blockMap.set(miningAreaKey, block);
    }

    state.currentTargetBlock = miningAreaKey;

    // Calculate damage (REBALANCED: damage comes from Power only, not pickaxe)
    const damage = calculateMiningDamage(playerData.power);
    
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
      
      // Add to inventory
      onOreMined(player, minedOre, minedAmount);
      
      // Remove shared block from map
      state.blockMap.delete(miningAreaKey);
      state.currentTargetBlock = null;
      
      // Remove all blocks in the mining area at this depth from the world
      // All blocks break at the same time
      let removedCount = 0;
      for (const basePosition of MINING_AREA_POSITIONS) {
        const blockPosition = {
          x: basePosition.x + state.offset.x,
          y: hitDepth,
          z: basePosition.z + state.offset.z,
        };
        try {
          this.world.chunkLattice.setBlock(blockPosition, 0);
          removedCount++;
        } catch (error) {
          console.warn(`[MiningSystem] Failed to remove block at ${blockPosition.x},${blockPosition.y},${blockPosition.z}:`, error);
        }
      }
      
      console.log(`[MiningSystem] Mined entire mining area at depth ${hitDepth} (${removedCount} blocks) - ${minedOre}`);
      
      // Player falls down to next level
      const nextDepth = hitDepth - 1;
      state.currentDepth = nextDepth;
      
      // Teleport player down one level
      const center = this.getMineCenter(player);
      const newPosition = {
        x: center.x,
        y: nextDepth + 1, // Position player on top of next level
        z: center.z,
      };
      
      // Use setPosition on the rigid body to move the player
      const rigidBody = (playerEntity as any).rawRigidBody;
      if (rigidBody && rigidBody.setPosition) {
        rigidBody.setPosition(newPosition);
      } else {
        // Fallback: try to set position directly on entity if rigidBody method doesn't work
        // The player will fall naturally due to physics, but we can at least set the position
        console.warn('[MiningSystem] Could not set position via rigidBody, player will fall naturally');
      }
      
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
    onOreMined: (player: Player, oreType: OreType, amount: number) => void,
    onDamageDealt: (player: Player, damage: number, currentOre: OreType | null, blockHP: number, maxHP: number) => void
  ): void {
    // Stop any existing loop
    this.stopMiningLoop(player);

    // Ensure state exists and initial level is generated
    this.getOrCreateState(player, pickaxe);

    // Get mining speed (hits per second)
    const hitRate = pickaxe.miningSpeed;
    const hitInterval = 1000 / hitRate; // Convert to milliseconds

    // Perform mining hits at regular intervals
    const performHit = () => {
      const currentState = this.miningStates.get(player);
      if (!currentState) {
        console.warn('[MiningSystem] No mining state found, stopping loop');
        return;
      }

      // Perform mining click
      this.handleMiningClick(player, pickaxe, onOreMined, onDamageDealt);
    };

    // Perform first hit immediately
    performHit();

    // Set up interval for continuous hits
    const currentState = this.miningStates.get(player);
    if (currentState) {
      currentState.miningIntervalId = setInterval(performHit, hitInterval);
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
   * Returns the world-space center of the player's mine (with offset applied)
   */
  getMineCenter(player: Player): { x: number; z: number } {
    const offset = this.getOrCreateOffset(player);
    const centerX = (MINING_AREA_BOUNDS.minX + MINING_AREA_BOUNDS.maxX) / 2 + offset.x;
    const centerZ = (MINING_AREA_BOUNDS.minZ + MINING_AREA_BOUNDS.maxZ) / 2 + offset.z;
    return { x: centerX, z: centerZ };
  }

  /**
   * Returns the world-space bounds for the player's mine (with offset applied)
   */
  getMineBounds(player: Player) {
    return this.getOffsetBounds(this.getOrCreateOffset(player));
  }

  /**
   * Prepares the player's mine (ensures all 1000 levels are generated) and returns entry position
   * NEW SYSTEM: All levels are pre-generated, no need for individual level checks
   */
  preparePlayerMine(
    player: Player,
    pickaxe: PickaxeData
  ): { x: number; y: number; z: number } {
    const state = this.getOrCreateState(player, pickaxe);
    const center = this.getMineCenter(player);
    
    // Reset first block mined flag when entering mine (so timer can start on first block)
    this.firstBlockMined.delete(player);
    
    return { x: center.x, y: state.currentDepth + 1, z: center.z };
  }

  /**
   * Resets the player's mine to level 0 (beginning level)
   * NEW SYSTEM: Clears all mining blocks and regenerates all 1000 levels
   * Walls stay permanent and don't need to be regenerated
   * 
   * @param player - Player whose mine to reset
   */
  resetMineToLevel0(player: Player): void {
    const state = this.miningStates.get(player);
    if (!state) return;

    console.log(`[MiningSystem] Resetting mine to level 0 for ${player.username}...`);
    const startTime = Date.now();

    // Clear all mining blocks (walls stay permanent)
    // Clear from level 0 down to -999 (1000 levels)
    for (let depth = 0; depth >= -999; depth--) {
      for (const basePosition of MINING_AREA_POSITIONS) {
        const blockPosition = {
          x: basePosition.x + state.offset.x,
          y: depth,
          z: basePosition.z + state.offset.z,
        };
        try {
          this.world.chunkLattice.setBlock(blockPosition, 0); // Set to air
        } catch (error) {
          // Silently fail
        }
      }
    }

    // Reset state
    state.blockMap.clear();
    state.generatedDepths.clear();
    state.currentDepth = MINE_DEPTH_START;
    state.currentTargetBlock = null;
    // DON'T reset ceilingBuilt or bottomFloorDepth - walls stay permanent

    // Reset first block mined flag (so timer can start again on next entry)
    this.firstBlockMined.delete(player);

    // Regenerate all 1000 levels with new ores (walls stay permanent)
    const pickaxe = this.getPlayerPickaxe(player);
    if (pickaxe) {
      this.generateAllMiningLevels(player, state, pickaxe, false); // false = don't regenerate walls
    }

    const elapsed = Date.now() - startTime;
    console.log(`[MiningSystem] Mine reset complete for ${player.username} in ${elapsed}ms`);
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
   * 
   * @param player - Player who left
   */
  cleanupPlayer(player: Player): void {
    this.stopMiningLoop(player);
    this.miningStates.delete(player);
    this.mineOffsets.delete(player);
    this.firstBlockMined.delete(player);
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
   * Ensures a mining state exists for the player (and initializes with an offset)
   * NEW SYSTEM: Generates all 1000 levels at once instead of progressive generation
   */
  private getOrCreateState(player: Player, pickaxe: PickaxeData): MiningState {
    let state = this.miningStates.get(player);
    if (state) {
      // If legacy state had no offset, reset it to a personal offset and regenerate
      if (state.offset.x === 0 && state.offset.z === 0) {
        const newOffset = this.getOrCreateOffset(player);
        state.blockMap.clear();
        state.generatedDepths.clear();
        state.currentDepth = MINE_DEPTH_START;
        state.offset = newOffset;
        state.ceilingBuilt = false;
        state.bottomFloorDepth = null;
        // Regenerate all levels with new offset
        this.generateAllMiningLevels(player, state, pickaxe);
      }
      return state;
    }

    const offset = this.getOrCreateOffset(player);
    state = {
      blockMap: new Map(),
      currentTargetBlock: null,
      lastHitTime: 0,
      currentDepth: MINE_DEPTH_START,
      generatedDepths: new Set(),
      offset,
      ceilingBuilt: false,
      bottomFloorDepth: null,
    };
    this.miningStates.set(player, state);

    // Generate ALL 1000 levels at once
    this.generateAllMiningLevels(player, state, pickaxe);
    
    return state;
  }

  /**
   * Returns (and caches) a unique offset for the player's mine instance
   */
  private getOrCreateOffset(player: Player): { x: number; z: number } {
    const existing = this.mineOffsets.get(player);
    if (existing) {
      return existing;
    }

    // Simple grid allocation using spacing to avoid overlap
    // Start from index 1 so nobody uses the origin/shared area
    const index = ++this.nextInstanceIndex;
    const spacing = MINE_INSTANCE_SPACING;
    const gridWidth = 16; // gives plenty of room before wrapping
    const row = Math.floor(index / gridWidth);
    const col = index % gridWidth;
    const offset = { x: col * spacing, z: row * spacing };

    this.mineOffsets.set(player, offset);
    return offset;
  }

  /**
   * Translate base mining bounds by an offset
   */
  private getOffsetBounds(offset: { x: number; z: number }) {
    return {
      minX: MINING_AREA_BOUNDS.minX + offset.x,
      maxX: MINING_AREA_BOUNDS.maxX + offset.x,
      minZ: MINING_AREA_BOUNDS.minZ + offset.z,
      maxZ: MINING_AREA_BOUNDS.maxZ + offset.z,
      y: MINING_AREA_BOUNDS.y,
    };
  }

  /**
   * Generates an ore type based on depth and luck using the NEW LINEAR SCALING SYSTEM
   * 
   * Uses OreGenerator which:
   * - Filters ores by firstDepth (ores only spawn at their unlock depth or deeper)
   * - Applies rarity-based weights (1 in X odds)
   * - Applies luck multiplier
   * - Normalizes and selects randomly
   * 
   * @param pickaxe - Player's pickaxe (contains luck bonus)
   * @param depth - Current mining depth (positive value, increases as you go deeper)
   * @returns Randomly selected ore type based on depth and luck
   */
  private generateOreType(pickaxe: PickaxeData, depth: number): OreType {
    const luck = pickaxe.luckBonus; // Luck is already 0.0-1.0 format
    
    // Convert depth to positive value (depth increases as you go deeper)
    const absoluteDepth = Math.abs(depth);
    
    // Use OreGenerator with depth and luck
    return this.oreGenerator.generateOre(absoluteDepth, luck);
  }

  /**
   * Calculates the HP for an ore at a given depth using NEW LINEAR SCALING SYSTEM
   * 
   * Uses linear interpolation from firstHealth to lastHealth based on depth
   * Formula: HP = FirstHealth + ((CurrentDepth - FirstDepth) / (LastDepth - FirstDepth)) × (LastHealth - FirstHealth)
   * 
   * @param oreType - Type of ore
   * @param depth - Current mining depth (should be positive)
   * @returns Calculated HP with linear depth scaling
   */
  private calculateOreHP(oreType: OreType, depth: number): number {
    // Ensure depth is positive
    const absoluteDepth = Math.abs(depth);
    
    // Use OreGenerator's getOreHealth method which uses linear interpolation
    return this.oreGenerator.getOreHealth(oreType, absoluteDepth);
  }

  /**
   * Generates all 1000 mining levels at once when player enters their mine
   * NEW SYSTEM: Pre-generates everything instead of on-the-fly generation
   * 
   * @param player - Player who owns this mining state
   * @param state - Player's mining state
   * @param pickaxe - Player's pickaxe (for ore generation)
   * @param generateWalls - Whether to generate walls (false on reset since walls are permanent)
   */
  private generateAllMiningLevels(
    player: Player,
    state: MiningState,
    pickaxe: PickaxeData,
    generateWalls: boolean = true
  ): void {
    console.log(`[MiningSystem] Generating all 1000 mining levels for ${player.username}...`);
    const startTime = Date.now();

    // Build overhead ceiling once (only if generating walls)
    if (generateWalls && !state.ceilingBuilt) {
      this.buildMineCeiling(state);
      state.ceilingBuilt = true;
    }

    // Generate all 1000 levels (depth 0 to -999)
    for (let i = 0; i < 1000; i++) {
      const depth = MINE_DEPTH_START - i; // 0, -1, -2, ..., -999
      const absoluteDepth = i + 1; // 1, 2, 3, ..., 1000 (for ore generation)
      
      // Mark depth as generated
      state.generatedDepths.add(depth);
      
      // Generate ore type for this level
      const oreType = this.generateOreType(pickaxe, absoluteDepth);
      const miningAreaKey = `mining_area_level_${depth}`;
      
      // Calculate HP based on ore type and depth
      const oreHP = this.calculateOreHP(oreType, absoluteDepth);
      const block = new MineBlock(oreType, oreHP);
      state.blockMap.set(miningAreaKey, block);
      
      // Generate all blocks in the mining area at this depth
      for (const basePosition of MINING_AREA_POSITIONS) {
        const blockPosition = {
          x: basePosition.x + state.offset.x,
          y: depth,
          z: basePosition.z + state.offset.z,
        };
        
        try {
          this.world.chunkLattice.setBlock(blockPosition, this.MINING_BLOCK_TYPE_ID);
        } catch (error) {
          // Silently fail - chunk might not be loaded yet
        }
      }
      
      // Generate walls for this level (only on first generation)
      if (generateWalls) {
        this.generateMineShaftWalls(depth, state.offset);
      }
      
      // Log progress every 100 levels
      if ((i + 1) % 100 === 0) {
        console.log(`[MiningSystem] Generated ${i + 1}/1000 levels for ${player.username}`);
      }
    }

    // Generate bottom floor at the very bottom (only on first generation)
    if (generateWalls) {
      const bottomDepth = MINE_DEPTH_START - 1000;
      this.generateBottomFloor(bottomDepth, state.offset);
      state.bottomFloorDepth = bottomDepth;
    }

    const elapsed = Date.now() - startTime;
    console.log(`[MiningSystem] Finished generating all 1000 levels for ${player.username} in ${elapsed}ms`);
  }

  /**
   * Generates dirt walls around the mining area to create a mine shaft
   * Creates two solid boxes: inner box at layer 1, outer box at layer 10, with empty space (2-9) between them
   * 
   * @param depth - Y coordinate (depth) to generate walls at
   */
  private generateMineShaftWalls(depth: number, offset: { x: number; z: number }): void {
    const wallThickness = 10;
    
    // Generate inner box (layer 1) - solid walls around the mining area
    const innerMinX = MINING_AREA_BOUNDS.minX - 1 + offset.x;
    const innerMaxX = MINING_AREA_BOUNDS.maxX + 1 + offset.x;
    const innerMinZ = MINING_AREA_BOUNDS.minZ - 1 + offset.z;
    const innerMaxZ = MINING_AREA_BOUNDS.maxZ + 1 + offset.z;
    
    // Inner box: all four sides (left, right, front, back) as solid walls
    for (let x = innerMinX; x <= innerMaxX; x++) {
      // Front wall of inner box
      this.generateWallBlock(x, depth, innerMinZ);
      // Back wall of inner box
      this.generateWallBlock(x, depth, innerMaxZ);
    }
    for (let z = innerMinZ; z <= innerMaxZ; z++) {
      // Left wall of inner box
      this.generateWallBlock(innerMinX, depth, z);
      // Right wall of inner box
      this.generateWallBlock(innerMaxX, depth, z);
    }
    
    // Generate outer box (layer 10) - solid walls 10 blocks out
    const outerMinX = MINING_AREA_BOUNDS.minX - wallThickness + offset.x;
    const outerMaxX = MINING_AREA_BOUNDS.maxX + wallThickness + offset.x;
    const outerMinZ = MINING_AREA_BOUNDS.minZ - wallThickness + offset.z;
    const outerMaxZ = MINING_AREA_BOUNDS.maxZ + wallThickness + offset.z;
    
    // Outer box: all four sides (left, right, front, back) as solid walls
    for (let x = outerMinX; x <= outerMaxX; x++) {
      // Front wall of outer box
      this.generateWallBlock(x, depth, outerMinZ);
      // Back wall of outer box
      this.generateWallBlock(x, depth, outerMaxZ);
    }
    for (let z = outerMinZ; z <= outerMaxZ; z++) {
      // Left wall of outer box
      this.generateWallBlock(outerMinX, depth, z);
      // Right wall of outer box
      this.generateWallBlock(outerMaxX, depth, z);
    }
  }

  /**
   * Builds a 10-layer hollow dirt shell above the mine to hide the offset area, leaving headroom
   * Only layers 1 and 10 are dirt, layers 2-9 are air (matching wall pattern)
   * Also generates vertical walls connecting ceiling to floor with the same pattern
   */
  private buildMineCeiling(state: MiningState): void {
    const offset = state.offset;
    const ceilingLayers = 10;
    const startY = MINE_DEPTH_START + 1; // lowered by one to sit closer to the floor
    const floorY = MINE_DEPTH_START; // Floor level
    const wallThickness = 10;
    const ceilingTopY = startY + ceilingLayers - 1;
    
    // Calculate ceiling bounds (matching wall thickness)
    const minX = MINING_AREA_BOUNDS.minX + offset.x - wallThickness;
    const maxX = MINING_AREA_BOUNDS.maxX + offset.x + wallThickness;
    const minZ = MINING_AREA_BOUNDS.minZ + offset.z - wallThickness;
    const maxZ = MINING_AREA_BOUNDS.maxZ + offset.z + wallThickness;

    // Generate ceiling as two solid boxes: inner box (layer 1) and outer box (layer 10)
    // Inner box bounds (layer 1)
    const innerCeilingMinX = MINING_AREA_BOUNDS.minX + offset.x - 1;
    const innerCeilingMaxX = MINING_AREA_BOUNDS.maxX + offset.x + 1;
    const innerCeilingMinZ = MINING_AREA_BOUNDS.minZ + offset.z - 1;
    const innerCeilingMaxZ = MINING_AREA_BOUNDS.maxZ + offset.z + 1;
    
    // Outer box bounds (layer 10)
    const outerCeilingMinX = MINING_AREA_BOUNDS.minX + offset.x - wallThickness;
    const outerCeilingMaxX = MINING_AREA_BOUNDS.maxX + offset.x + wallThickness;
    const outerCeilingMinZ = MINING_AREA_BOUNDS.minZ + offset.z - wallThickness;
    const outerCeilingMaxZ = MINING_AREA_BOUNDS.maxZ + offset.z + wallThickness;
    
    // Generate inner box ceiling (layer 1) - solid perimeter
    const innerCeilingY = startY; // Layer 1 (index 0)
    for (let x = innerCeilingMinX; x <= innerCeilingMaxX; x++) {
      for (let z = innerCeilingMinZ; z <= innerCeilingMaxZ; z++) {
        const isPerimeter = x === innerCeilingMinX || x === innerCeilingMaxX || z === innerCeilingMinZ || z === innerCeilingMaxZ;
        if (!isPerimeter) continue; // Only perimeter for inner box
        try {
          this.world.chunkLattice.setBlock({ x, y: innerCeilingY, z }, this.DIRT_BLOCK_TYPE_ID);
        } catch (error) {
          console.warn(`[MiningSystem] Failed to place inner ceiling block at ${x},${innerCeilingY},${z}:`, error);
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
          this.world.chunkLattice.setBlock({ x, y: outerCeilingY, z }, this.DIRT_BLOCK_TYPE_ID);
        } catch (error) {
          console.warn(`[MiningSystem] Failed to place outer ceiling block at ${x},${outerCeilingY},${z}:`, error);
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
          this.world.chunkLattice.setBlock({ x: innerWallMinX, y, z }, this.DIRT_BLOCK_TYPE_ID);
        } catch (error) {}
      }
      // Right wall
      for (let z = innerWallMinZ; z <= innerWallMaxZ; z++) {
        try {
          this.world.chunkLattice.setBlock({ x: innerWallMaxX, y, z }, this.DIRT_BLOCK_TYPE_ID);
        } catch (error) {}
      }
      // Front wall
      for (let x = innerWallMinX; x <= innerWallMaxX; x++) {
        try {
          this.world.chunkLattice.setBlock({ x, y, z: innerWallMinZ }, this.DIRT_BLOCK_TYPE_ID);
        } catch (error) {}
      }
      // Back wall
      for (let x = innerWallMinX; x <= innerWallMaxX; x++) {
        try {
          this.world.chunkLattice.setBlock({ x, y, z: innerWallMaxZ }, this.DIRT_BLOCK_TYPE_ID);
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
          this.world.chunkLattice.setBlock({ x: outerWallMinX, y, z }, this.DIRT_BLOCK_TYPE_ID);
        } catch (error) {}
      }
      // Right wall
      for (let z = outerWallMinZ; z <= outerWallMaxZ; z++) {
        try {
          this.world.chunkLattice.setBlock({ x: outerWallMaxX, y, z }, this.DIRT_BLOCK_TYPE_ID);
        } catch (error) {}
      }
      // Front wall
      for (let x = outerWallMinX; x <= outerWallMaxX; x++) {
        try {
          this.world.chunkLattice.setBlock({ x, y, z: outerWallMinZ }, this.DIRT_BLOCK_TYPE_ID);
        } catch (error) {}
      }
      // Back wall
      for (let x = outerWallMinX; x <= outerWallMaxX; x++) {
        try {
          this.world.chunkLattice.setBlock({ x, y, z: outerWallMaxZ }, this.DIRT_BLOCK_TYPE_ID);
        } catch (error) {}
      }
    }
  }

  /**
   * Generates the bottom floor at the bottommost level
   * Fills wall depths 2-9 with dirt to create a solid floor between inner and outer walls
   * Excludes the mining area itself so players can still mine
   * 
   * @param floorDepth - Y coordinate (depth) of the floor
   * @param offset - Player's mine offset
   */
  private generateBottomFloor(floorDepth: number, offset: { x: number; z: number }): void {
    const wallThickness = 10;
    
    // Mining area bounds (with offset) - this area should NOT be filled
    const miningMinX = MINING_AREA_BOUNDS.minX + offset.x;
    const miningMaxX = MINING_AREA_BOUNDS.maxX + offset.x;
    const miningMinZ = MINING_AREA_BOUNDS.minZ + offset.z;
    const miningMaxZ = MINING_AREA_BOUNDS.maxZ + offset.z;
    
    // Fill layers 2-9 with dirt (wall depths 2-9)
    for (let wallOffset = 2; wallOffset <= 9; wallOffset++) {
      // Calculate bounds for this wall depth
      const floorMinX = MINING_AREA_BOUNDS.minX - wallOffset + offset.x;
      const floorMaxX = MINING_AREA_BOUNDS.maxX + wallOffset + offset.x;
      const floorMinZ = MINING_AREA_BOUNDS.minZ - wallOffset + offset.z;
      const floorMaxZ = MINING_AREA_BOUNDS.maxZ + wallOffset + offset.z;
      
      // Fill the area at this wall depth with dirt, but exclude the mining area
      for (let x = floorMinX; x <= floorMaxX; x++) {
        for (let z = floorMinZ; z <= floorMaxZ; z++) {
          // Skip if this position is within the mining area
          if (x >= miningMinX && x <= miningMaxX && z >= miningMinZ && z <= miningMaxZ) {
            continue; // Don't fill the mining area - players need to mine here
          }
          
          try {
            this.world.chunkLattice.setBlock({ x, y: floorDepth, z }, this.DIRT_BLOCK_TYPE_ID);
          } catch (error) {
            // Silently fail
          }
        }
      }
    }
    
    console.log(`[MiningSystem] Generated bottom floor at depth ${floorDepth}`);
  }

  /**
   * Deletes the bottom floor at a specific depth
   * Removes dirt blocks from wall depths 2-9 (excluding mining area and wall positions)
   * 
   * @param floorDepth - Y coordinate (depth) of the floor to delete
   * @param offset - Player's mine offset
   */
  private deleteBottomFloor(floorDepth: number, offset: { x: number; z: number }): void {
    const wallThickness = 10;
    
    // Mining area bounds (with offset) - this area should NOT be deleted (it's not part of the floor)
    const miningMinX = MINING_AREA_BOUNDS.minX + offset.x;
    const miningMaxX = MINING_AREA_BOUNDS.maxX + offset.x;
    const miningMinZ = MINING_AREA_BOUNDS.minZ + offset.z;
    const miningMaxZ = MINING_AREA_BOUNDS.maxZ + offset.z;
    
    // Inner wall bounds (layer 1) - these should NOT be deleted (they're walls, not floor)
    const innerWallMinX = MINING_AREA_BOUNDS.minX - 1 + offset.x;
    const innerWallMaxX = MINING_AREA_BOUNDS.maxX + 1 + offset.x;
    const innerWallMinZ = MINING_AREA_BOUNDS.minZ - 1 + offset.z;
    const innerWallMaxZ = MINING_AREA_BOUNDS.maxZ + 1 + offset.z;
    
    // Outer wall bounds (layer 10) - these should NOT be deleted (they're walls, not floor)
    const outerWallMinX = MINING_AREA_BOUNDS.minX - wallThickness + offset.x;
    const outerWallMaxX = MINING_AREA_BOUNDS.maxX + wallThickness + offset.x;
    const outerWallMinZ = MINING_AREA_BOUNDS.minZ - wallThickness + offset.z;
    const outerWallMaxZ = MINING_AREA_BOUNDS.maxZ + wallThickness + offset.z;
    
    // Delete layers 2-9 (wall depths 2-9)
    for (let wallOffset = 2; wallOffset <= 9; wallOffset++) {
      // Calculate bounds for this wall depth
      const floorMinX = MINING_AREA_BOUNDS.minX - wallOffset + offset.x;
      const floorMaxX = MINING_AREA_BOUNDS.maxX + wallOffset + offset.x;
      const floorMinZ = MINING_AREA_BOUNDS.minZ - wallOffset + offset.z;
      const floorMaxZ = MINING_AREA_BOUNDS.maxZ + wallOffset + offset.z;
      
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
    
    console.log(`[MiningSystem] Deleted bottom floor at depth ${floorDepth}`);
  }

  /**
   * Generates a single wall block (dirt) at the specified position
   * Only generates if the position is air/empty
   * 
   * @param x - X coordinate
   * @param y - Y coordinate (depth)
   * @param z - Z coordinate
   */
  private generateWallBlock(x: number, y: number, z: number): void {
    const wallPosition = { x, y, z };
    
    try {
      // Check if block already exists at this position
      const existingBlockId = this.world.chunkLattice.getBlockId(wallPosition);
      
      // Only create wall block if it doesn't exist (air = 0 or undefined)
      if (!existingBlockId || existingBlockId === 0) {
        // Set block to dirt (ID 9) for walls
        this.world.chunkLattice.setBlock(wallPosition, this.DIRT_BLOCK_TYPE_ID);
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
          console.warn('[MiningSystem] Failed to despawn debug ray marker:', error);
        }
      }, this.DEBUG_RAYCAST_MARKER_LIFETIME_MS);
    }
  }
}
