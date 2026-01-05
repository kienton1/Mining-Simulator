/**
 * Ore Generator
 * 
 * Generates ore types based on depth, rarity, and luck-adjusted probabilities.
 * Uses weighted random selection with depth-based ore unlocking.
 * 
 * NEW SYSTEM: Ores unlock at their firstDepth and have linear health scaling.
 * 
 * Reference: Planning/ProgressionBalanceBlueprint.md section 2
 */

import { OreType, ORE_DATABASE, calculateOreHealth } from './OreData';

/**
 * Ore Generator class
 * Handles procedural ore generation with depth-based unlocking and luck scaling
 */
export class OreGenerator {
  /**
   * Generates an ore type based on current depth and luck-adjusted probabilities
   * 
   * @param currentDepth - Current depth in the mine (1-1000)
   * @param luck - Luck percentage (0.0 to 1.0, e.g., 0.20 = 20%)
   * @returns Generated ore type
   */
  generateOre(currentDepth: number, luck: number = 0): OreType {
    // Filter ores that can spawn at current depth
    const availableOres = Object.values(ORE_DATABASE).filter(
      ore => currentDepth >= ore.firstDepth
    );

    // If no ores available (shouldn't happen), return stone
    if (availableOres.length === 0) {
      return OreType.STONE;
    }

    // Calculate spawn weights based on rarity (lower rarity = higher weight)
    // Formula: weight = 1 / rarity, then apply luck that FAVORS rare ores
    const weights: Map<OreType, number> = new Map();
    let totalWeight = 0;

    for (const ore of availableOres) {
      // Base weight from rarity (1 in X odds)
      const baseWeight = 1 / ore.rarity;
      
      // Apply luck bonus that favors rare ores MORE
      // Rare ores (high rarity) benefit more from luck using logarithmic scaling
      // Formula: weight × (1 + luck × log10(rarity + 1))
      // Example with 40% luck:
      //   Stone (rarity=1): 1.0 × (1 + 0.4 × 0.3) = 1.12x
      //   Diamond (rarity=100): 0.01 × (1 + 0.4 × 2.0) = 0.018x (1.8x boost)
      //   Dragonstone (rarity=10000): 0.0001 × (1 + 0.4 × 4.0) = 0.00026x (2.6x boost)
      const luckBonus = luck * Math.log10(ore.rarity + 1);
      const adjustedWeight = baseWeight * (1 + luckBonus);
      
      weights.set(ore.type, adjustedWeight);
      totalWeight += adjustedWeight;
    }

    // Weighted random selection
    const random = Math.random() * totalWeight;
    let cumulative = 0;

    for (const [oreType, weight] of weights.entries()) {
      cumulative += weight;
      if (random <= cumulative) {
        return oreType;
      }
    }

    // Fallback to stone if something goes wrong
    return OreType.STONE;
  }

  /**
   * Get the health of an ore at a specific depth
   * Uses linear interpolation between firstHealth and lastHealth
   * 
   * @param oreType - Type of ore
   * @param currentDepth - Current depth in the mine
   * @returns Health value for the ore at this depth
   */
  getOreHealth(oreType: OreType, currentDepth: number): number {
    const oreData = ORE_DATABASE[oreType];
    return calculateOreHealth(oreData, currentDepth);
  }

  /**
   * Check if an ore can spawn at the given depth
   * 
   * @param oreType - Type of ore
   * @param currentDepth - Current depth in the mine
   * @returns True if the ore can spawn at this depth
   */
  canOreSpawn(oreType: OreType, currentDepth: number): boolean {
    const oreData = ORE_DATABASE[oreType];
    return currentDepth >= oreData.firstDepth;
  }

  /**
   * Get all ores available at a given depth
   * 
   * @param currentDepth - Current depth in the mine
   * @returns Array of ore types that can spawn at this depth
   */
  getAvailableOres(currentDepth: number): OreType[] {
    return Object.values(ORE_DATABASE)
      .filter(ore => currentDepth >= ore.firstDepth)
      .map(ore => ore.type);
  }
}

