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

/**
 * Training rock location in the world
 */
export interface TrainingRockLocation {
  /** Block position of the training rock */
  position: { x: number; y: number; z: number };
  
  /** Training rock data */
  rockData: TrainingRockData;
  
  /** Block entity (if applicable) */
  block?: Block;

  /** Optional bounding box on the x/z plane for large pads */
  bounds?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
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
   * @param tier - Tier of training rock
   * @param block - Optional block entity (if the rock is a block)
   */
  registerTrainingRock(
    position: { x: number; y: number; z: number },
    tier: TrainingRockTier,
    block?: Block,
    bounds?: TrainingRockLocation['bounds']
  ): void {
    const rockData = getTrainingRockByTier(tier);
    if (!rockData) {
      console.warn(`Training rock tier ${tier} not found`);
      return;
    }

    const location: TrainingRockLocation = {
      position,
      rockData,
      block,
      bounds,
    };

    this.trainingRocks.set(rockData.id, location);
  }

  /**
   * Finds training rock near a player's position
   * 
   * @param playerPosition - Player's current position
   * @returns Training rock location or null if none nearby
   */
  findNearbyTrainingRock(playerPosition: { x: number; y: number; z: number }): TrainingRockLocation | null {
    let closestRock: TrainingRockLocation | null = null;
    let closestDistance = this.PROXIMITY_DISTANCE;

    for (const location of this.trainingRocks.values()) {
      if (location.bounds) {
        const withinX = playerPosition.x >= location.bounds.minX && playerPosition.x <= location.bounds.maxX;
        const withinZ = playerPosition.z >= location.bounds.minZ && playerPosition.z <= location.bounds.maxZ;
        if (withinX && withinZ) {
          return location;
        }
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
    console.log('[TrainingRockManager] Block scanning not yet implemented - register rocks manually');
  }

  /**
   * Manually registers training rocks based on known positions
   * This should be called during world initialization
   * 
   * @param rockPositions - Array of { position, tier } objects
   */
  registerTrainingRocksFromMap(
    rockPositions: Array<{
      position: { x: number; y: number; z: number };
      tier: TrainingRockTier;
      bounds?: TrainingRockLocation['bounds'];
    }>
  ): void {
    for (const { position, tier, bounds } of rockPositions) {
      this.registerTrainingRock(position, tier, undefined, bounds);
    }
  }
}

