/**
 * World 3 Ore Data (Volcanic World)
 *
 * Defines all 24 volcanic ores for World 3.
 * Each ore has a depth range and health scales linearly within that range.
 *
 * Reference: Planning/Volcanic_Ores_and_Pets.md section "Ore Table"
 */

import { calculateOreHealth } from './World1OreData';

/**
 * Enumeration of all ore types in World 3 (volcanic theme)
 * 24 ores total with progressive depth unlocking
 */
export enum ISLAND3_ORE_TYPE {
  // Common Ores (Available Early)
  ASHROCK = 'ashrock',
  CINDREL = 'cindrel',
  PYRESTONE = 'pyrestone',
  SULFURON = 'sulfuron',

  // Uncommon Ores (Early-Mid Game)
  EMBERITE = 'emberite',
  SCORIX = 'scorix',
  HEATSTONE = 'heatstone',
  FUMARO = 'fumaro',

  // Rare Ores (Mid Game)
  CALDERA = 'caldera',
  VITRIN = 'vitrin',
  BRIMMET = 'brimmet',
  CHARBITE = 'charbite',

  // Very Rare Ores (Mid-Late Game)
  NIGHTASH = 'nightash',
  SPIREC = 'spirec',
  VENTARA = 'ventara',
  MINTASH = 'mintash',

  // Ultra Rare Ores (Late Game)
  LAPILLO = 'lapillo',
  TUFFEN = 'tuffen',
  SEARIN = 'searin',
  MAGMAORB = 'magmaorb',

  // Legendary Ores (End Game)
  CINDEROP = 'cinderop',
  COREFLARE = 'coreflare',
  DARKGLOW = 'darkglow',
  INFERNON = 'infernon',
}

/**
 * Ore data structure for World 3
 */
export interface Island3OreData {
  /** Type of ore */
  type: ISLAND3_ORE_TYPE;

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
 * Calculate ore health for World 3 ores
 * Uses the shared calculateOreHealth function from World1OreData
 */
export function calculateIsland3OreHealth(oreData: Island3OreData, currentDepth: number): number {
  return calculateOreHealth(oreData, currentDepth);
}

/**
 * Database of all World 3 ore types with their properties
 * 24 volcanic ores with linear health scaling from firstDepth to lastDepth (1000)
 * Reference: Planning/Volcanic_Ores_and_Pets.md
 */
export const ISLAND3_ORE_DATABASE: Record<ISLAND3_ORE_TYPE, Island3OreData> = {
  // Common Ores (Available from start)
  [ISLAND3_ORE_TYPE.ASHROCK]: {
    type: ISLAND3_ORE_TYPE.ASHROCK,
    rarity: 1, // 1 in 1
    value: 3_500_000,
    firstDepth: 1,
    firstHealth: 50_000_000,
    lastDepth: 1000,
    lastHealth: 100_000_000_000,
    name: 'Ashrock',
    block: 'Ashrock',
    color: '#4A4A4A',
  },
  [ISLAND3_ORE_TYPE.CINDREL]: {
    type: ISLAND3_ORE_TYPE.CINDREL,
    rarity: 5, // 1 in 5
    value: 150_000_000,
    firstDepth: 10,
    firstHealth: 200_000_000,
    lastDepth: 1000,
    lastHealth: 200_000_000_000,
    name: 'Cindrel',
    block: 'Cindrel',
    color: '#6B3B2A',
  },
  [ISLAND3_ORE_TYPE.PYRESTONE]: {
    type: ISLAND3_ORE_TYPE.PYRESTONE,
    rarity: 10, // 1 in 10
    value: 200_000_000,
    firstDepth: 10,
    firstHealth: 250_000_000,
    lastDepth: 1000,
    lastHealth: 250_000_000_000,
    name: 'Pyrestone',
    block: 'Pyrestone',
    color: '#C1440E',
  },
  [ISLAND3_ORE_TYPE.SULFURON]: {
    type: ISLAND3_ORE_TYPE.SULFURON,
    rarity: 12, // 1 in 12
    value: 250_000_000,
    firstDepth: 10,
    firstHealth: 300_000_000,
    lastDepth: 1000,
    lastHealth: 300_000_000_000,
    name: 'Sulfuron',
    block: 'Sulfuron',
    color: '#E5C100',
  },

  // Uncommon Ores (Early-Mid Game)
  [ISLAND3_ORE_TYPE.EMBERITE]: {
    type: ISLAND3_ORE_TYPE.EMBERITE,
    rarity: 14, // 1 in 14
    value: 400_000_000,
    firstDepth: 10,
    firstHealth: 750_000_000,
    lastDepth: 1000,
    lastHealth: 400_000_000_000,
    name: 'Emberite',
    block: 'Emberite',
    color: '#FF6B2D',
  },
  [ISLAND3_ORE_TYPE.SCORIX]: {
    type: ISLAND3_ORE_TYPE.SCORIX,
    rarity: 14, // 1 in 14
    value: 600_000_000,
    firstDepth: 10,
    firstHealth: 1_000_000_000,
    lastDepth: 1000,
    lastHealth: 500_000_000_000,
    name: 'Scorix',
    block: 'Scorix',
    color: '#8B2E2E',
  },
  [ISLAND3_ORE_TYPE.HEATSTONE]: {
    type: ISLAND3_ORE_TYPE.HEATSTONE,
    rarity: 16, // 1 in 16
    value: 900_000_000,
    firstDepth: 40,
    firstHealth: 3_000_000_000,
    lastDepth: 1000,
    lastHealth: 600_000_000_000,
    name: 'Heatstone',
    block: 'Heatstone',
    color: '#FF4500',
  },
  [ISLAND3_ORE_TYPE.FUMARO]: {
    type: ISLAND3_ORE_TYPE.FUMARO,
    rarity: 22, // 1 in 22
    value: 2_000_000_000,
    firstDepth: 40,
    firstHealth: 4_000_000_000,
    lastDepth: 1000,
    lastHealth: 750_000_000_000,
    name: 'Fumaro',
    block: 'Fumaro',
    color: '#FF8C00',
  },

  // Rare Ores (Mid Game)
  [ISLAND3_ORE_TYPE.CALDERA]: {
    type: ISLAND3_ORE_TYPE.CALDERA,
    rarity: 33, // 1 in 33
    value: 3_500_000_000,
    firstDepth: 50,
    firstHealth: 10_000_000_000,
    lastDepth: 1000,
    lastHealth: 1_000_000_000_000,
    name: 'Caldera',
    block: 'Caldera',
    color: '#5A2E2E',
  },
  [ISLAND3_ORE_TYPE.VITRIN]: {
    type: ISLAND3_ORE_TYPE.VITRIN,
    rarity: 50, // 1 in 50
    value: 7_500_000_000,
    firstDepth: 70,
    firstHealth: 20_000_000_000,
    lastDepth: 1000,
    lastHealth: 1_250_000_000_000,
    name: 'Vitrin',
    block: 'Vitrin',
    color: '#B0E0E6',
  },
  [ISLAND3_ORE_TYPE.BRIMMET]: {
    type: ISLAND3_ORE_TYPE.BRIMMET,
    rarity: 100, // 1 in 100
    value: 30_000_000_000,
    firstDepth: 100,
    firstHealth: 80_000_000_000,
    lastDepth: 1000,
    lastHealth: 1_400_000_000_000,
    name: 'Brimmet',
    block: 'Brimmet',
    color: '#3B2F2F',
  },
  [ISLAND3_ORE_TYPE.CHARBITE]: {
    type: ISLAND3_ORE_TYPE.CHARBITE,
    rarity: 100, // 1 in 100
    value: 60_000_000_000,
    firstDepth: 100,
    firstHealth: 100_000_000_000,
    lastDepth: 1000,
    lastHealth: 1_400_000_000_000,
    name: 'Charbite',
    block: 'Charbite',
    color: '#2B2B2B',
  },

  // Very Rare Ores (Mid-Late Game)
  [ISLAND3_ORE_TYPE.NIGHTASH]: {
    type: ISLAND3_ORE_TYPE.NIGHTASH,
    rarity: 100, // 1 in 100
    value: 80_000_000_000,
    firstDepth: 150,
    firstHealth: 100_000_000_000,
    lastDepth: 1000,
    lastHealth: 1_500_000_000_000,
    name: 'Nightash',
    block: 'Nightash',
    color: '#1C1C2B',
  },
  [ISLAND3_ORE_TYPE.SPIREC]: {
    type: ISLAND3_ORE_TYPE.SPIREC,
    rarity: 20, // 1 in 20
    value: 100_000_000_000,
    firstDepth: 250,
    firstHealth: 100_000_000_000,
    lastDepth: 1000,
    lastHealth: 1_750_000_000_000,
    name: 'Spirec',
    block: 'Spirec',
    color: '#B22222',
  },
  [ISLAND3_ORE_TYPE.VENTARA]: {
    type: ISLAND3_ORE_TYPE.VENTARA,
    rarity: 200, // 1 in 200
    value: 150_000_000_000,
    firstDepth: 200,
    firstHealth: 200_000_000_000,
    lastDepth: 1000,
    lastHealth: 2_000_000_000_000,
    name: 'Ventara',
    block: 'Ventara',
    color: '#D6A25E',
  },
  [ISLAND3_ORE_TYPE.MINTASH]: {
    type: ISLAND3_ORE_TYPE.MINTASH,
    rarity: 222, // 1 in 222
    value: 250_000_000_000,
    firstDepth: 200,
    firstHealth: 250_000_000_000,
    lastDepth: 1000,
    lastHealth: 2_000_000_000_000,
    name: 'Mintash',
    block: 'Mintash',
    color: '#A8E6CF',
  },

  // Ultra Rare Ores (Late Game)
  [ISLAND3_ORE_TYPE.LAPILLO]: {
    type: ISLAND3_ORE_TYPE.LAPILLO,
    rarity: 40, // 1 in 40
    value: 350_000_000_000,
    firstDepth: 250,
    firstHealth: 150_000_000_000,
    lastDepth: 1000,
    lastHealth: 1_900_000_000_000,
    name: 'Lapillo',
    block: 'Lapillo',
    color: '#C75D3B',
  },
  [ISLAND3_ORE_TYPE.TUFFEN]: {
    type: ISLAND3_ORE_TYPE.TUFFEN,
    rarity: 66, // 1 in 66
    value: 600_000_000_000,
    firstDepth: 250,
    firstHealth: 200_000_000_000,
    lastDepth: 1000,
    lastHealth: 2_000_000_000_000,
    name: 'Tuffen',
    block: 'Tuffen',
    color: '#7B6D63',
  },
  [ISLAND3_ORE_TYPE.SEARIN]: {
    type: ISLAND3_ORE_TYPE.SEARIN,
    rarity: 250, // 1 in 250
    value: 900_000_000_000,
    firstDepth: 250,
    firstHealth: 300_000_000_000,
    lastDepth: 1000,
    lastHealth: 2_400_000_000_000,
    name: 'Searin',
    block: 'Searin',
    color: '#FFB347',
  },
  [ISLAND3_ORE_TYPE.MAGMAORB]: {
    type: ISLAND3_ORE_TYPE.MAGMAORB,
    rarity: 285, // 1 in 285
    value: 2_000_000_000_000,
    firstDepth: 250,
    firstHealth: 400_000_000_000,
    lastDepth: 1000,
    lastHealth: 2_700_000_000_000,
    name: 'Magmaorb',
    block: 'Magmaorb',
    color: '#FF3D00',
  },

  // Legendary Ores (End Game)
  [ISLAND3_ORE_TYPE.CINDEROP]: {
    type: ISLAND3_ORE_TYPE.CINDEROP,
    rarity: 33, // 1 in 33
    value: 7_500_000_000_000,
    firstDepth: 250,
    firstHealth: 450_000_000_000,
    lastDepth: 1000,
    lastHealth: 3_000_000_000_000,
    name: 'Cinderop',
    block: 'Cinderop',
    color: '#B84A1B',
  },
  [ISLAND3_ORE_TYPE.COREFLARE]: {
    type: ISLAND3_ORE_TYPE.COREFLARE,
    rarity: 33, // 1 in 33
    value: 10_000_000_000_000,
    firstDepth: 250,
    firstHealth: 500_000_000_000,
    lastDepth: 1000,
    lastHealth: 3_500_000_000_000,
    name: 'Coreflare',
    block: 'Coreflare',
    color: '#FF1E00',
  },
  [ISLAND3_ORE_TYPE.DARKGLOW]: {
    type: ISLAND3_ORE_TYPE.DARKGLOW,
    rarity: 100, // 1 in 100
    value: 25_000_000_000_000,
    firstDepth: 250,
    firstHealth: 500_000_000_000,
    lastDepth: 1000,
    lastHealth: 4_000_000_000_000,
    name: 'Darkglow',
    block: 'Darkglow',
    color: '#2A1A3B',
  },
  [ISLAND3_ORE_TYPE.INFERNON]: {
    type: ISLAND3_ORE_TYPE.INFERNON,
    rarity: 10000, // 1 in 10000
    value: 50_000_000_000_000,
    firstDepth: 250,
    firstHealth: 1_000_000_000_000,
    lastDepth: 1000,
    lastHealth: 6_000_000_000_000,
    name: 'Infernon',
    block: 'Infernon',
    color: '#FF0000',
  },
};

/**
 * Array of all World 3 ore types for iteration
 */
export const ISLAND3_ORE_TYPES = Object.values(ISLAND3_ORE_TYPE);

/**
 * Get ore data by type
 */
export function getIsland3OreData(oreType: ISLAND3_ORE_TYPE): Island3OreData {
  return ISLAND3_ORE_DATABASE[oreType];
}

/**
 * Get ore value by type
 */
export function getIsland3OreValue(oreType: ISLAND3_ORE_TYPE): number {
  return ISLAND3_ORE_DATABASE[oreType].value;
}

/**
 * Get ore rarity by type
 */
export function getIsland3OreRarity(oreType: ISLAND3_ORE_TYPE): number {
  return ISLAND3_ORE_DATABASE[oreType].rarity;
}
