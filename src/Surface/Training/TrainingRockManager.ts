/**
 * Training Rock Manager
 * 
 * Manages all training rocks in the world.
 * Handles detection of training rock locations and player proximity.
 * 
 * Reference: Planning/fileStructure.md - Surface/Training/TrainingRockManager
 */

import { World, Block } from 'hytopia';
import type { TrainingRockData, TrainingRockTier } from './TrainingRockData';
import { getTrainingRockByTier } from './TrainingRockData';
import { 
  ISLAND2_TRAINING_ROCK_TIER,
  getIsland2TrainingRockByTier,
  type Island2TrainingRockData,
} from '../../worldData/TrainingRocks';

/**
 * Training rock location in the world
 */
export interface TrainingRockLocation {
  /** Block position of the training rock */
  position: { x: number; y: number; z: number };
  
  /** Training rock data (Island 1 or Island 2) */
  rockData: TrainingRockData | Island2TrainingRockData;
  
  /** Block entity (if applicable) */
  block?: Block;

  /** Optional bounding box on the x/z plane for large pads */
  bounds?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  
  /** World ID this rock belongs to ('island1' or 'island2') */
  worldId?: string;
}

/**
 * Training Rock Manager class
 * Manages all training rocks in the surface world
 */
export class TrainingRockManager {
  private world: World;
  private trainingRocks: Map<string, TrainingRockLocation> = new Map();
  private readonly PROXIMITY_DISTANCE = 7.0; // Distance to detect player near rock (covers full coal pads)

  /**
   * Creates a new TrainingRockManager instance
   * 
   * @param world - Hytopia world instance
   */
  constructor(world: World) {
    this.world = world;
  }

  /**
   * Registers a training rock at a specific location
   * 
   * @param position - World position of the training rock
   * @param tier - Tier of training rock (Island 1 or Island 2)
   * @param block - Optional block entity (if the rock is a block)
   * @param bounds - Optional bounds for interaction area
   * @param worldId - Optional world ID ('island1' or 'island2'), defaults to 'island1'
   */
  registerTrainingRock(
    position: { x: number; y: number; z: number },
    tier: TrainingRockTier | ISLAND2_TRAINING_ROCK_TIER,
    block?: Block,
    bounds?: TrainingRockLocation['bounds'],
    worldId: string = 'island1'
  ): void {
    // Try Island 2 first if world is Island 2
    let rockData: TrainingRockData | Island2TrainingRockData | undefined;
    
    if (worldId === 'island2') {
      rockData = getIsland2TrainingRockByTier(tier as ISLAND2_TRAINING_ROCK_TIER);
    }
    
    // Fallback to Island 1 if Island 2 rock not found
    if (!rockData) {
      rockData = getTrainingRockByTier(tier as TrainingRockTier);
    }
    
    if (!rockData) {
      return;
    }

    const location: TrainingRockLocation = {
      position,
      rockData,
      block,
      bounds,
      worldId,
    };

    // Use unique ID that includes world ID to prevent conflicts
    const uniqueId = `${worldId}:${rockData.id}`;
    this.trainingRocks.set(uniqueId, location);
  }

  /**
   * Finds training rock near a player's position
   * 
   * @param playerPosition - Player's current position
   * @returns Training rock location or null if none nearby
   */
  findNearbyTrainingRock(playerPosition: { x: number; y: number; z: number }): TrainingRockLocation | null {
    // First check if player is within bounds (preferred method)
    for (const location of this.trainingRocks.values()) {
      if (location.bounds) {
        const withinX = playerPosition.x >= location.bounds.minX && playerPosition.x <= location.bounds.maxX;
        const withinZ = playerPosition.z >= location.bounds.minZ && playerPosition.z <= location.bounds.maxZ;
        if (withinX && withinZ) {
          return location;
        }
      }
    }

    // Fallback: only use distance check if no bounds are defined
    // (This should rarely happen since all training rocks should have bounds)
    let closestRock: TrainingRockLocation | null = null;
    let closestDistance = this.PROXIMITY_DISTANCE;

    for (const location of this.trainingRocks.values()) {
      // Skip rocks that have bounds (we already checked them above)
      if (location.bounds) {
        continue;
      }

      const dx = location.position.x - playerPosition.x;
      const dy = location.position.y - playerPosition.y;
      const dz = location.position.z - playerPosition.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestRock = location;
      }
    }

    return closestRock;
  }

  /**
   * Gets all training rocks in the world
   * 
   * @returns Array of all training rock locations
   */
  getAllTrainingRocks(): TrainingRockLocation[] {
    return Array.from(this.trainingRocks.values());
  }

  /**
   * Gets a training rock by ID
   * 
   * @param id - Training rock ID
   * @returns Training rock location or null if not found
   */
  getTrainingRockById(id: string): TrainingRockLocation | null {
    return this.trainingRocks.get(id) || null;
  }

  /**
   * Scans the world for cobbled-deepslate blocks and registers them as training rocks
   * This is a helper method to auto-detect training rocks from the map
   * 
   * @param scanArea - Optional area to scan (if not provided, scans entire world)
   */
  scanForTrainingRocks(scanArea?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  }): void {
    // TODO: Implement block scanning when Hytopia API provides block iteration
    // For now, training rocks should be manually registered
  }

  /**
   * Manually registers training rocks based on known positions
   * This should be called during world initialization
   * Ensures only one rock per tier is registered (prevents duplicates)
   * 
   * @param rockPositions - Array of { position, tier } objects
   */
  registerTrainingRocksFromMap(
    rockPositions: Array<{
      position: { x: number; y: number; z: number };
      tier: TrainingRockTier | ISLAND2_TRAINING_ROCK_TIER;
      bounds?: TrainingRockLocation['bounds'];
      worldId?: string;
    }>
  ): void {
    // Track which tiers we've already registered to prevent duplicates (per world)
    const registeredKeys = new Set<string>();
    
    for (const { position, tier, bounds, worldId = 'island1' } of rockPositions) {
      // Create unique key for this tier + world combination
      const key = `${worldId}:${tier}`;
      
      // Skip if we've already registered this tier for this world
      if (registeredKeys.has(key)) {
        continue;
      }
      
      registeredKeys.add(key);
      
      this.registerTrainingRock(position, tier, undefined, bounds, worldId);
      if (bounds) {
      }
    }
  }
}

