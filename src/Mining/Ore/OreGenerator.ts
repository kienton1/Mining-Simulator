/**
 * Ore Generator
 * 
 * Generates ore types based on depth, rarity, and luck-adjusted probabilities.
 * Uses weighted random selection with depth-based ore unlocking.
 * 
 * NEW SYSTEM: Ores unlock at their firstDepth and have linear health scaling.
 * World-aware: Supports Island 1, Island 2, and Island 3 ore databases.
 * 
 * Reference: Planning/ProgressionBalanceBlueprint.md section 2
 */

import { OreType, ORE_DATABASE, calculateOreHealth } from './World1OreData';
import { ISLAND2_ORE_TYPE, ISLAND2_ORE_DATABASE } from './World2OreData';
import { ISLAND3_ORE_TYPE, ISLAND3_ORE_DATABASE } from './World3OreData';

/**
 * Ore Generator class
 * Handles procedural ore generation with depth-based unlocking and luck scaling
 * World-aware: Supports Island 1, Island 2, and Island 3 ore databases
 */
export class OreGenerator {
  /**
   * Generates an ore type based on current depth and luck-adjusted probabilities
   * World-aware: Uses Island 1, Island 2, or Island 3 ore database based on worldId
   * 
   * @param currentDepth - Current depth in the mine (1-1000)
   * @param luck - Luck percentage (0.0 to 1.0, e.g., 0.20 = 20%)
   * @param worldId - World ID ('island1', 'island2', or 'island3'), defaults to 'island1'
   * @returns Generated ore type as string (ore type name)
   */
  generateOre(currentDepth: number, luck: number = 0, worldId: string = 'island1'): string {
    if (worldId === 'island2') {
      return this.generateIsland2Ore(currentDepth, luck);
    }
    if (worldId === 'island3') {
      return this.generateIsland3Ore(currentDepth, luck);
    }
    return this.generateIsland1Ore(currentDepth, luck);
  }

  /**
   * Generates an Island 1 ore type
   */
  private generateIsland1Ore(currentDepth: number, luck: number): string {
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
    const weights: Map<string, number> = new Map();
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
   * Generates an Island 2 ore type
   */
  private generateIsland2Ore(currentDepth: number, luck: number): string {
    // Filter ores that can spawn at current depth
    const availableOres = Object.values(ISLAND2_ORE_DATABASE).filter(
      ore => currentDepth >= ore.firstDepth
    );

    // If no ores available (shouldn't happen), return dunestone (Island 2 equivalent of stone)
    if (availableOres.length === 0) {
      return ISLAND2_ORE_TYPE.DUNESTONE;
    }

    // Calculate spawn weights based on rarity (lower rarity = higher weight)
    // Formula: weight = 1 / rarity, then apply luck that FAVORS rare ores
    const weights: Map<string, number> = new Map();
    let totalWeight = 0;

    for (const ore of availableOres) {
      // Base weight from rarity (1 in X odds)
      const baseWeight = 1 / ore.rarity;
      
      // Apply luck bonus that favors rare ores MORE
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

    // Fallback to dunestone if something goes wrong
    return ISLAND2_ORE_TYPE.DUNESTONE;
  }

  /**
   * Generates an Island 3 ore type
   */
  private generateIsland3Ore(currentDepth: number, luck: number): string {
    // Filter ores that can spawn at current depth
    const availableOres = Object.values(ISLAND3_ORE_DATABASE).filter(
      ore => currentDepth >= ore.firstDepth
    );

    // If no ores available (shouldn't happen), return ashrock
    if (availableOres.length === 0) {
      return ISLAND3_ORE_TYPE.ASHROCK;
    }

    // Calculate spawn weights based on rarity (lower rarity = higher weight)
    const weights: Map<string, number> = new Map();
    let totalWeight = 0;

    for (const ore of availableOres) {
      const baseWeight = 1 / ore.rarity;
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

    // Fallback to ashrock if something goes wrong
    return ISLAND3_ORE_TYPE.ASHROCK;
  }

  /**
   * Get the health of an ore at a specific depth
   * Uses linear interpolation between firstHealth and lastHealth
   * World-aware: Uses Island 1, Island 2, or Island 3 ore database based on worldId
   * 
   * @param oreType - Type of ore as string (ore type name)
   * @param currentDepth - Current depth in the mine
   * @param worldId - World ID ('island1', 'island2', or 'island3'), defaults to 'island1'
   * @returns Health value for the ore at this depth
   */
  getOreHealth(oreType: string, currentDepth: number, worldId: string = 'island1'): number {
    // Use the shared calculateOreHealth function for both worlds (World 1's backend)
    if (worldId === 'island2') {
      // Check if it's an Island 2 ore type
      if (oreType in ISLAND2_ORE_DATABASE) {
        const oreData = ISLAND2_ORE_DATABASE[oreType as ISLAND2_ORE_TYPE];
        return calculateOreHealth(oreData, currentDepth);
      }
      // Fallback to dunestone if invalid
      const defaultOre = ISLAND2_ORE_DATABASE[ISLAND2_ORE_TYPE.DUNESTONE];
      return calculateOreHealth(defaultOre, currentDepth);
    } else if (worldId === 'island3') {
      if (oreType in ISLAND3_ORE_DATABASE) {
        const oreData = ISLAND3_ORE_DATABASE[oreType as ISLAND3_ORE_TYPE];
        return calculateOreHealth(oreData, currentDepth);
      }
      const defaultOre = ISLAND3_ORE_DATABASE[ISLAND3_ORE_TYPE.ASHROCK];
      return calculateOreHealth(defaultOre, currentDepth);
    } else {
      // Check if it's an Island 1 ore type
      if (oreType in ORE_DATABASE) {
        const oreData = ORE_DATABASE[oreType as OreType];
        return calculateOreHealth(oreData, currentDepth);
      }
      // Fallback to stone if invalid
      const defaultOre = ORE_DATABASE[OreType.STONE];
      return calculateOreHealth(defaultOre, currentDepth);
    }
  }

  /**
   * Check if an ore can spawn at the given depth
   * 
   * @param oreType - Type of ore as string
   * @param currentDepth - Current depth in the mine
   * @param worldId - World ID ('island1', 'island2', or 'island3'), defaults to 'island1'
   * @returns True if the ore can spawn at this depth
   */
  canOreSpawn(oreType: string, currentDepth: number, worldId: string = 'island1'): boolean {
    if (worldId === 'island2') {
      if (oreType in ISLAND2_ORE_DATABASE) {
        const oreData = ISLAND2_ORE_DATABASE[oreType as ISLAND2_ORE_TYPE];
        return currentDepth >= oreData.firstDepth;
      }
      return false;
    } else if (worldId === 'island3') {
      if (oreType in ISLAND3_ORE_DATABASE) {
        const oreData = ISLAND3_ORE_DATABASE[oreType as ISLAND3_ORE_TYPE];
        return currentDepth >= oreData.firstDepth;
      }
      return false;
    } else {
      if (oreType in ORE_DATABASE) {
        const oreData = ORE_DATABASE[oreType as OreType];
        return currentDepth >= oreData.firstDepth;
      }
      return false;
    }
  }

  /**
   * Get all ores available at a given depth
   * 
   * @param currentDepth - Current depth in the mine
   * @param worldId - World ID ('island1', 'island2', or 'island3'), defaults to 'island1'
   * @returns Array of ore types (as strings) that can spawn at this depth
   */
  getAvailableOres(currentDepth: number, worldId: string = 'island1'): string[] {
    if (worldId === 'island2') {
      return Object.values(ISLAND2_ORE_DATABASE)
        .filter(ore => currentDepth >= ore.firstDepth)
        .map(ore => ore.type);
    } else if (worldId === 'island3') {
      return Object.values(ISLAND3_ORE_DATABASE)
        .filter(ore => currentDepth >= ore.firstDepth)
        .map(ore => ore.type);
    } else {
      return Object.values(ORE_DATABASE)
        .filter(ore => currentDepth >= ore.firstDepth)
        .map(ore => ore.type);
    }
  }
}

