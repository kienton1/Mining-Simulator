/**
 * World 2 Ore Data
 *
 * Defines all 24 ocean-themed ores for World 2 (Beach World).
 * Each ore has a depth range and health scales linearly within that range.
 *
 * Reference: Planning/BeachMapPlans/NewWorldIslandPlan.md section 2
 */

import { calculateOreHealth } from './World1OreData';

/**
 * Enumeration of all ore types in World 2 (ocean theme)
 * 24 ores total with progressive depth unlocking
 */
export enum ISLAND2_ORE_TYPE {
  // Common Ores (Available Early)
  DUNESTONE = 'dunestone',
  DRIFTITE = 'driftite',
  ANCHORITE = 'anchorite',
  BARNACITE = 'barnacite',
  SEAGLASSIUM = 'seaglassium',
  SHELLCHROMITE = 'shellchromite',

  // Uncommon Ores (Early-Mid Game)
  TURTLITE = 'turtlite',
  PRISMARINE = 'prismarine',
  OPALSTONE = 'opalstone',
  AZURITE = 'azurite',
  MANGROVITE = 'mangrovite',
  BASALTITE = 'basaltite',

  // Rare Ores (Mid Game)
  REEFIUM = 'reefium',
  KELPITE = 'kelpite',
  SUNSTONITE = 'sunstonite',
  RIPTIDITE = 'riptidite',

  // Very Rare Ores (Mid-Late Game)
  TRENCHITE = 'trenchite',
  STORMIUM = 'stormium',
  LAVASTONE = 'lavastone',
  WRECKITE = 'wreckite',

  // Ultra Rare Ores (Late Game)
  BIOLUMITE = 'biolumite',
  OCEANIUM = 'oceanium',
  PALMITITE = 'palmitite',
  TRADEWINDITE = 'tradewindite',
}

/**
 * Ore data structure for World 2
 */
export interface Island2OreData {
  /** Type of ore */
  type: ISLAND2_ORE_TYPE;

  /** Rarity as "1 in X" odds (e.g., 5 means "1 in 5") */
  rarity: number;

  /** Gold value when sold */
  value: number;

  /** First depth where this ore can spawn */
  firstDepth: number;

  /** Health at first depth */
  firstHealth: number;

  /** Last depth (always 1000) */
  lastDepth: number;

  /** Health at last depth (depth 1000) */
  lastHealth: number;

  /** Display name */
  name: string;

  /** Block identifier/type */
  block: string;

  /** Color in hex format */
  color: string;
}

/**
 * Calculate ore health for World 2 ores
 * Uses the shared calculateOreHealth function from World1OreData
 * This maintains backward compatibility while using the shared implementation
 */
export function calculateIsland2OreHealth(oreData: Island2OreData, currentDepth: number): number {
  // Use the shared calculateOreHealth function (World 1's backend)
  return calculateOreHealth(oreData, currentDepth);
}

/**
 * Database of all World 2 ore types with their properties
 * 24 ocean-themed ores with linear health scaling from firstDepth to lastDepth (1000)
 * Reference: Planning/BeachMapPlans/NewWorldIslandPlan.md section 2
 */
export const ISLAND2_ORE_DATABASE: Record<ISLAND2_ORE_TYPE, Island2OreData> = {
  // Common Ores (Available from start)
  [ISLAND2_ORE_TYPE.DUNESTONE]: {
    type: ISLAND2_ORE_TYPE.DUNESTONE,
    rarity: 1,  // 1 in 1
    value: 1000,
    firstDepth: 1,
    firstHealth: 15000,
    lastDepth: 1000,
    lastHealth: 30000000,
    name: 'Dunestone',
    block: 'Dunestone',
    color: '#8B7D6B',  // Dune/sand beige
  },
  [ISLAND2_ORE_TYPE.DRIFTITE]: {
    type: ISLAND2_ORE_TYPE.DRIFTITE,
    rarity: 5,  // 1 in 5
    value: 15000,
    firstDepth: 5,
    firstHealth: 175000,
    lastDepth: 1000,
    lastHealth: 70000000,
    name: 'Driftite',
    block: 'Driftite',
    color: '#A8A8A8',  // Driftwood gray
  },
  [ISLAND2_ORE_TYPE.ANCHORITE]: {
    type: ISLAND2_ORE_TYPE.ANCHORITE,
    rarity: 10,  // 1 in 10
    value: 30000,
    firstDepth: 5,
    firstHealth: 200000,
    lastDepth: 1000,
    lastHealth: 90000000,
    name: 'Anchorite',
    block: 'Anchorite',
    color: '#4A4A4A',  // Anchor metal dark gray
  },
  [ISLAND2_ORE_TYPE.BARNACITE]: {
    type: ISLAND2_ORE_TYPE.BARNACITE,
    rarity: 12,  // 1 in 12
    value: 35000,
    firstDepth: 5,
    firstHealth: 45000,
    lastDepth: 1000,
    lastHealth: 100000000,
    name: 'Barnacite',
    block: 'Barnacite',
    color: '#6B4423',  // Barnacle brown
  },
  [ISLAND2_ORE_TYPE.SEAGLASSIUM]: {
    type: ISLAND2_ORE_TYPE.SEAGLASSIUM,
    rarity: 14,  // 1 in 14
    value: 100000,
    firstDepth: 5,
    firstHealth: 130000,
    lastDepth: 1000,
    lastHealth: 125000000,
    name: 'Seaglassium',
    block: 'Seaglassium',
    color: '#87CEEB',  // Sky blue - sea glass
  },
  [ISLAND2_ORE_TYPE.SHELLCHROMITE]: {
    type: ISLAND2_ORE_TYPE.SHELLCHROMITE,
    rarity: 16,  // 1 in 16
    value: 250000,
    firstDepth: 5,
    firstHealth: 1070000,
    lastDepth: 1000,
    lastHealth: 200000000,
    name: 'Shellchromite',
    block: 'Shellchromite',
    color: '#F5DEB3',  // Shell cream/pearl
  },

  // Uncommon Ores (Early-Mid Game)
  [ISLAND2_ORE_TYPE.TURTLITE]: {
    type: ISLAND2_ORE_TYPE.TURTLITE,
    rarity: 22,  // 1 in 22
    value: 650000,
    firstDepth: 5,
    firstHealth: 1000000,
    lastDepth: 1000,
    lastHealth: 290000000,
    name: 'Turtlite',
    block: 'Turtlite',
    color: '#228B22',  // Turtle green
  },
  [ISLAND2_ORE_TYPE.PRISMARINE]: {
    type: ISLAND2_ORE_TYPE.PRISMARINE,
    rarity: 33,  // 1 in 33
    value: 2500000,
    firstDepth: 20,
    firstHealth: 6000000,
    lastDepth: 1000,
    lastHealth: 400000000,
    name: 'Prismarine',
    block: 'Prismarine',
    color: '#00CED1',  // Prismarine cyan
  },
  [ISLAND2_ORE_TYPE.OPALSTONE]: {
    type: ISLAND2_ORE_TYPE.OPALSTONE,
    rarity: 50,  // 1 in 50
    value: 4000000,
    firstDepth: 20,
    firstHealth: 10000000,
    lastDepth: 1000,
    lastHealth: 603000000,
    name: 'Opalstone',
    block: 'Opalstone',
    color: '#E6E6FA',  // Opal lavender
  },
  [ISLAND2_ORE_TYPE.AZURITE]: {
    type: ISLAND2_ORE_TYPE.AZURITE,
    rarity: 100,  // 1 in 100
    value: 7500000,
    firstDepth: 20,
    firstHealth: 12000000,
    lastDepth: 1000,
    lastHealth: 800000000,
    name: 'Azurite',
    block: 'Azurite',
    color: '#007FFF',  // Azure blue
  },
  [ISLAND2_ORE_TYPE.MANGROVITE]: {
    type: ISLAND2_ORE_TYPE.MANGROVITE,
    rarity: 100,  // 1 in 100
    value: 19000000,
    firstDepth: 20,
    firstHealth: 15000000,
    lastDepth: 1000,
    lastHealth: 1000000000,
    name: 'Mangrovite',
    block: 'Mangrovite',
    color: '#8B4513',  // Mangrove brown
  },
  [ISLAND2_ORE_TYPE.BASALTITE]: {
    type: ISLAND2_ORE_TYPE.BASALTITE,
    rarity: 100,  // 1 in 100
    value: 15000000,
    firstDepth: 20,
    firstHealth: 35000000,
    lastDepth: 1000,
    lastHealth: 1200000000,
    name: 'Basaltite',
    block: 'Basaltite',
    color: '#2F2F2F',  // Basalt dark gray
  },

  // Rare Ores (Mid Game)
  [ISLAND2_ORE_TYPE.REEFIUM]: {
    type: ISLAND2_ORE_TYPE.REEFIUM,
    rarity: 20,  // 1 in 20
    value: 25000000,
    firstDepth: 100,
    firstHealth: 110000000,
    lastDepth: 1000,
    lastHealth: 1300000000,
    name: 'Reefium',
    block: 'Reefium',
    color: '#FF6347',  // Coral reef red-orange
  },
  [ISLAND2_ORE_TYPE.KELPITE]: {
    type: ISLAND2_ORE_TYPE.KELPITE,
    rarity: 200,  // 1 in 200
    value: 27500000,
    firstDepth: 150,
    firstHealth: 61000000,
    lastDepth: 1000,
    lastHealth: 1400000000,
    name: 'Kelpite',
    block: 'Kelpite',
    color: '#2E8B57',  // Kelp green
  },
  [ISLAND2_ORE_TYPE.SUNSTONITE]: {
    type: ISLAND2_ORE_TYPE.SUNSTONITE,
    rarity: 33,  // 1 in 33
    value: 40000000,
    firstDepth: 200,
    firstHealth: 100000000,
    lastDepth: 1000,
    lastHealth: 1500000000,
    name: 'Sunstonite',
    block: 'Sunstonite',
    color: '#FFD700',  // Sunstone gold
  },
  [ISLAND2_ORE_TYPE.RIPTIDITE]: {
    type: ISLAND2_ORE_TYPE.RIPTIDITE,
    rarity: 222,  // 1 in 222
    value: 75000000,
    firstDepth: 150,
    firstHealth: 100000000,
    lastDepth: 1000,
    lastHealth: 2000000000,
    name: 'Riptidite',
    block: 'Riptidite',
    color: '#4682B4',  // Riptide steel blue
  },

  // Very Rare Ores (Mid-Late Game)
  [ISLAND2_ORE_TYPE.TRENCHITE]: {
    type: ISLAND2_ORE_TYPE.TRENCHITE,
    rarity: 285,  // 1 in 285
    value: 100000000,
    firstDepth: 200,
    firstHealth: 300000000,
    lastDepth: 1000,
    lastHealth: 2500000000,
    name: 'Trenchite',
    block: 'Trenchite',
    color: '#191970',  // Trench midnight blue
  },
  [ISLAND2_ORE_TYPE.STORMIUM]: {
    type: ISLAND2_ORE_TYPE.STORMIUM,
    rarity: 33,  // 1 in 33
    value: 150000000,
    firstDepth: 200,
    firstHealth: 350000000,
    lastDepth: 1000,
    lastHealth: 2000000000,
    name: 'Stormium',
    block: 'Stormium',
    color: '#708090',  // Storm gray
  },
  [ISLAND2_ORE_TYPE.LAVASTONE]: {
    type: ISLAND2_ORE_TYPE.LAVASTONE,
    rarity: 333,  // 1 in 333
    value: 200000000,
    firstDepth: 200,
    firstHealth: 325000000,
    lastDepth: 1000,
    lastHealth: 2800000000,
    name: 'Lavastone',
    block: 'Lavastone',
    color: '#FF4500',  // Lava orange-red
  },
  [ISLAND2_ORE_TYPE.WRECKITE]: {
    type: ISLAND2_ORE_TYPE.WRECKITE,
    rarity: 100,  // 1 in 100
    value: 250000000,
    firstDepth: 200,
    firstHealth: 1000000000,
    lastDepth: 1000,
    lastHealth: 3500000000,
    name: 'Wreckite',
    block: 'Wreckite',
    color: '#8B4513',  // Shipwreck brown
  },

  // Ultra Rare Ores (Late Game)
  [ISLAND2_ORE_TYPE.BIOLUMITE]: {
    type: ISLAND2_ORE_TYPE.BIOLUMITE,
    rarity: 370,  // 1 in 370
    value: 300000000,
    firstDepth: 200,
    firstHealth: 362000000,
    lastDepth: 1000,
    lastHealth: 3400000000,
    name: 'Biolumite',
    block: 'Biolumite',
    color: '#00FF00',  // Bioluminescent green
  },
  [ISLAND2_ORE_TYPE.OCEANIUM]: {
    type: ISLAND2_ORE_TYPE.OCEANIUM,
    rarity: 200,  // 1 in 200
    value: 400000000,
    firstDepth: 200,
    firstHealth: 700000000,
    lastDepth: 1000,
    lastHealth: 3500000000,
    name: 'Oceanium',
    block: 'Oceanium',
    color: '#0000CD',  // Deep ocean blue
  },
  [ISLAND2_ORE_TYPE.PALMITITE]: {
    type: ISLAND2_ORE_TYPE.PALMITITE,
    rarity: 400,  // 1 in 400
    value: 400000000,
    firstDepth: 200,
    firstHealth: 450000000,
    lastDepth: 1000,
    lastHealth: 3700000000,
    name: 'Palmitite',
    block: 'Palmitite',
    color: '#FFE4B5',  // Palm cream
  },
  [ISLAND2_ORE_TYPE.TRADEWINDITE]: {
    type: ISLAND2_ORE_TYPE.TRADEWINDITE,
    rarity: 1000,  // 1 in 1000
    value: 1750000000,
    firstDepth: 200,
    firstHealth: 2200000000,
    lastDepth: 1000,
    lastHealth: 7000000000,
    name: 'Tradewindite',
    block: 'Tradewindite',
    color: '#87CEFA',  // Trade wind light blue
  },
};

/**
 * Array of all World 2 ore types for iteration
 */
export const ISLAND2_ORE_TYPES = Object.values(ISLAND2_ORE_TYPE);

/**
 * Get ore data by type
 */
export function getIsland2OreData(oreType: ISLAND2_ORE_TYPE): Island2OreData {
  return ISLAND2_ORE_DATABASE[oreType];
}

/**
 * Get ore value by type
 */
export function getIsland2OreValue(oreType: ISLAND2_ORE_TYPE): number {
  return ISLAND2_ORE_DATABASE[oreType].value;
}

/**
 * Get ore rarity by type
 */
export function getIsland2OreRarity(oreType: ISLAND2_ORE_TYPE): number {
  return ISLAND2_ORE_DATABASE[oreType].rarity;
}

