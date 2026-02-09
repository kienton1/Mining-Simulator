/**
 * World 5 Ore Data (Void Village)
 *
 * Defines all 20 void-themed ores for World 5.
 * Each ore has a depth range and health scales linearly within that range.
 */

import { calculateOreHealth } from './World1OreData';

/**
 * Enumeration of all ore types in World 5 (void theme)
 * 20 ores total with progressive depth unlocking
 */
export enum ISLAND5_ORE_TYPE {
  // Common Ores (Available Early)
  VOID_DUST = 'void_dust',
  BLACKSTONE_SHARD = 'blackstone_shard',
  NULL_PEBBLE = 'null_pebble',
  ECLIPSE_SAND = 'eclipse_sand',
  UMBRAL_CLAY = 'umbral_clay',
  GLOOM_QUARTZ = 'gloom_quartz',

  // Uncommon Ores (Early-Mid Game)
  RIFTSTONE = 'riftstone',
  ABYSSAL_BASALT = 'abyssal_basalt',
  SHADOWGLASS = 'shadowglass',
  MIDNIGHT_OBSIDIAN = 'midnight_obsidian',
  VEIL_CRYSTAL = 'veil_crystal',
  WRAITH_ORE = 'wraith_ore',

  // Rare Ores (Mid Game)
  SINGULARITY_FRAGMENT = 'singularity_fragment',
  EVENTIDE_PRISM = 'eventide_prism',
  GRAVITY_CORE = 'gravity_core',
  ANTIMATTER_NODULE = 'antimatter_nodule',

  // Very Rare Ores (Late Game)
  DARKSTAR_ALLOY = 'darkstar_alloy',
  VOIDHEART_GEM = 'voidheart_gem',
  REALITY_TEAR = 'reality_tear',
  OBLIVIONITE = 'oblivionite',
}

/**
 * Ore data structure for World 5
 */
export interface Island5OreData {
  /** Type of ore */
  type: ISLAND5_ORE_TYPE;

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
 * Calculate ore health for World 5 ores
 * Uses the shared calculateOreHealth function from World1OreData
 */
export function calculateIsland5OreHealth(oreData: Island5OreData, currentDepth: number): number {
  return calculateOreHealth(oreData, currentDepth);
}

/**
 * Database of all World 5 ore types with their properties
 * 20 void-themed ores with linear health scaling from firstDepth to lastDepth (1000)
 */
export const ISLAND5_ORE_DATABASE: Record<ISLAND5_ORE_TYPE, Island5OreData> = {
  // Common Ores (Available from start)
  [ISLAND5_ORE_TYPE.VOID_DUST]: {
    type: ISLAND5_ORE_TYPE.VOID_DUST,
    rarity: 1, // 1 in 1
    value: 5_000_000_000_000_000, // 5Qd
    firstDepth: 0,
    firstHealth: 10_000_000_000_000_000, // 10Qd
    lastDepth: 1000,
    lastHealth: 20_000_000_000_000_000_000, // 20Qn
    name: 'Void Dust',
    block: 'Void_Dust',
    color: '#2B2B2B',
  },
  [ISLAND5_ORE_TYPE.BLACKSTONE_SHARD]: {
    type: ISLAND5_ORE_TYPE.BLACKSTONE_SHARD,
    rarity: 5, // 1 in 5
    value: 15_000_000_000_000_000, // 15Qd
    firstDepth: 5,
    firstHealth: 50_000_000_000_000_000, // 50Qd
    lastDepth: 1000,
    lastHealth: 50_000_000_000_000_000_000, // 50Qn
    name: 'Blackstone Shard',
    block: 'Blackstone_Shard',
    color: '#1E1E28',
  },
  [ISLAND5_ORE_TYPE.NULL_PEBBLE]: {
    type: ISLAND5_ORE_TYPE.NULL_PEBBLE,
    rarity: 10, // 1 in 10
    value: 25_000_000_000_000_000, // 25Qd
    firstDepth: 5,
    firstHealth: 75_000_000_000_000_000, // 75Qd
    lastDepth: 1000,
    lastHealth: 100_000_000_000_000_000_000, // 100Qn
    name: 'Null Pebble',
    block: 'Null_Pebble',
    color: '#3CB371',
  },
  [ISLAND5_ORE_TYPE.ECLIPSE_SAND]: {
    type: ISLAND5_ORE_TYPE.ECLIPSE_SAND,
    rarity: 12, // 1 in 12
    value: 37_500_000_000_000_000, // 37.5Qd
    firstDepth: 5,
    firstHealth: 100_000_000_000_000_000, // 100Qd
    lastDepth: 1000,
    lastHealth: 100_000_000_000_000_000_000, // 100Qn
    name: 'Eclipse Sand',
    block: 'Eclipse_Sand',
    color: '#2AD7D9',
  },
  [ISLAND5_ORE_TYPE.UMBRAL_CLAY]: {
    type: ISLAND5_ORE_TYPE.UMBRAL_CLAY,
    rarity: 14, // 1 in 14
    value: 125_000_000_000_000_000, // 125Qd
    firstDepth: 5,
    firstHealth: 1_000_000_000_000_000_000, // 1Qn
    lastDepth: 1000,
    lastHealth: 175_000_000_000_000_000_000, // 175Qn
    name: 'Umbral Clay',
    block: 'Umbral_Clay',
    color: '#FF4FD8',
  },
  [ISLAND5_ORE_TYPE.GLOOM_QUARTZ]: {
    type: ISLAND5_ORE_TYPE.GLOOM_QUARTZ,
    rarity: 16, // 1 in 16
    value: 250_000_000_000_000_000, // 250Qd
    firstDepth: 50,
    firstHealth: 1_000_000_000_000_000_000, // 1Qn
    lastDepth: 1000,
    lastHealth: 200_000_000_000_000_000_000, // 200Qn
    name: 'Gloom Quartz',
    block: 'Gloom_Quartz',
    color: '#7B3FBF',
  },

  // Uncommon Ores (Early-Mid Game)
  [ISLAND5_ORE_TYPE.RIFTSTONE]: {
    type: ISLAND5_ORE_TYPE.RIFTSTONE,
    rarity: 22, // 1 in 22
    value: 625_000_000_000_000_000, // 625Qd
    firstDepth: 75,
    firstHealth: 2_000_000_000_000_000_000, // 2Qn
    lastDepth: 1000,
    lastHealth: 225_000_000_000_000_000_000, // 225Qn
    name: 'Riftstone',
    block: 'Riftstone',
    color: '#3A3A3A',
  },
  [ISLAND5_ORE_TYPE.ABYSSAL_BASALT]: {
    type: ISLAND5_ORE_TYPE.ABYSSAL_BASALT,
    rarity: 33, // 1 in 33
    value: 1_250_000_000_000_000_000, // 1.25Qn
    firstDepth: 100,
    firstHealth: 5_000_000_000_000_000_000, // 5Qn
    lastDepth: 1000,
    lastHealth: 320_000_000_000_000_000_000, // 320Qn
    name: 'Abyssal Basalt',
    block: 'Abyssal_Basalt',
    color: '#FF9F1C',
  },
  [ISLAND5_ORE_TYPE.SHADOWGLASS]: {
    type: ISLAND5_ORE_TYPE.SHADOWGLASS,
    rarity: 50, // 1 in 50
    value: 2_500_000_000_000_000_000, // 2.5Qn
    firstDepth: 100,
    firstHealth: 9_000_000_000_000_000_000, // 9Qn
    lastDepth: 1000,
    lastHealth: 500_000_000_000_000_000_000, // 500Qn
    name: 'Shadowglass',
    block: 'Shadowglass',
    color: '#6B7280',
  },
  [ISLAND5_ORE_TYPE.MIDNIGHT_OBSIDIAN]: {
    type: ISLAND5_ORE_TYPE.MIDNIGHT_OBSIDIAN,
    rarity: 100, // 1 in 100
    value: 5_000_000_000_000_000_000, // 5Qn
    firstDepth: 100,
    firstHealth: 20_000_000_000_000_000_000, // 20Qn
    lastDepth: 1000,
    lastHealth: 650_000_000_000_000_000_000, // 650Qn
    name: 'Midnight Obsidian',
    block: 'Midnight_Obsidian',
    color: '#2E8B57',
  },
  [ISLAND5_ORE_TYPE.VEIL_CRYSTAL]: {
    type: ISLAND5_ORE_TYPE.VEIL_CRYSTAL,
    rarity: 100, // 1 in 100
    value: 8_750_000_000_000_000_000, // 8.75Qn
    firstDepth: 100,
    firstHealth: 30_000_000_000_000_000_000, // 30Qn
    lastDepth: 1000,
    lastHealth: 500_000_000_000_000_000_000, // 500Qn
    name: 'Veil Crystal',
    block: 'Veil_Crystal',
    color: '#C4A7FF',
  },
  [ISLAND5_ORE_TYPE.WRAITH_ORE]: {
    type: ISLAND5_ORE_TYPE.WRAITH_ORE,
    rarity: 100, // 1 in 100
    value: 12_500_000_000_000_000_000, // 12.5Qn
    firstDepth: 100,
    firstHealth: 35_000_000_000_000_000_000, // 35Qn
    lastDepth: 1000,
    lastHealth: 600_000_000_000_000_000_000, // 600Qn
    name: 'Wraith Ore',
    block: 'Wraith_Ore',
    color: '#4B5563',
  },

  // Rare Ores (Mid Game)
  [ISLAND5_ORE_TYPE.SINGULARITY_FRAGMENT]: {
    type: ISLAND5_ORE_TYPE.SINGULARITY_FRAGMENT,
    rarity: 200, // 1 in 200
    value: 25_000_000_000_000_000_000, // 25Qn
    firstDepth: 100,
    firstHealth: 75_000_000_000_000_000_000, // 75Qn
    lastDepth: 1000,
    lastHealth: 1_500_000_000_000_000_000_000, // 1.5Sx
    name: 'Singularity Fragment',
    block: 'Singularity_Fragment',
    color: '#6B4F3B',
  },
  [ISLAND5_ORE_TYPE.EVENTIDE_PRISM]: {
    type: ISLAND5_ORE_TYPE.EVENTIDE_PRISM,
    rarity: 222, // 1 in 222
    value: 50_000_000_000_000_000_000, // 50Qn
    firstDepth: 100,
    firstHealth: 120_000_000_000_000_000_000, // 120Qn
    lastDepth: 1000,
    lastHealth: 3_000_000_000_000_000_000_000, // 3Sx
    name: 'Eventide Prism',
    block: 'Eventide_Prism',
    color: '#6D28D9',
  },
  [ISLAND5_ORE_TYPE.GRAVITY_CORE]: {
    type: ISLAND5_ORE_TYPE.GRAVITY_CORE,
    rarity: 250, // 1 in 250
    value: 125_000_000_000_000_000_000, // 125Qn
    firstDepth: 250,
    firstHealth: 450_000_000_000_000_000_000, // 450Qn
    lastDepth: 1000,
    lastHealth: 7_000_000_000_000_000_000_000, // 7Sx
    name: 'Gravity Core',
    block: 'Gravity_Core',
    color: '#2D7DD2',
  },
  [ISLAND5_ORE_TYPE.ANTIMATTER_NODULE]: {
    type: ISLAND5_ORE_TYPE.ANTIMATTER_NODULE,
    rarity: 285, // 1 in 285
    value: 187_500_000_000_000_000_000, // 187.5Qn
    firstDepth: 250,
    firstHealth: 600_000_000_000_000_000_000, // 600Qn
    lastDepth: 1000,
    lastHealth: 10_000_000_000_000_000_000_000, // 10Sx
    name: 'Antimatter Nodule',
    block: 'Antimatter_Nodule',
    color: '#4C6FFF',
  },

  // Very Rare Ores (Late Game)
  [ISLAND5_ORE_TYPE.DARKSTAR_ALLOY]: {
    type: ISLAND5_ORE_TYPE.DARKSTAR_ALLOY,
    rarity: 333, // 1 in 333
    value: 375_000_000_000_000_000_000, // 375Qn
    firstDepth: 250,
    firstHealth: 900_000_000_000_000_000_000, // 900Qn
    lastDepth: 1000,
    lastHealth: 12_000_000_000_000_000_000_000, // 12Sx
    name: 'Darkstar Alloy',
    block: 'Darkstar_Alloy',
    color: '#111827',
  },
  [ISLAND5_ORE_TYPE.VOIDHEART_GEM]: {
    type: ISLAND5_ORE_TYPE.VOIDHEART_GEM,
    rarity: 400, // 1 in 400
    value: 625_000_000_000_000_000_000, // 625Qn
    firstDepth: 250,
    firstHealth: 1_000_000_000_000_000_000_000, // 1Sx
    lastDepth: 1000,
    lastHealth: 14_000_000_000_000_000_000_000, // 14Sx
    name: 'Voidheart Gem',
    block: 'Voidheart_Gem',
    color: '#7C7C7C',
  },
  [ISLAND5_ORE_TYPE.REALITY_TEAR]: {
    type: ISLAND5_ORE_TYPE.REALITY_TEAR,
    rarity: 400, // 1 in 400
    value: 875_000_000_000_000_000_000, // 875Qn
    firstDepth: 250,
    firstHealth: 1_000_000_000_000_000_000_000, // 1Sx
    lastDepth: 1000,
    lastHealth: 18_000_000_000_000_000_000_000, // 18Sx
    name: 'Reality Tear',
    block: 'Reality_Tear',
    color: '#00E5FF',
  },
  [ISLAND5_ORE_TYPE.OBLIVIONITE]: {
    type: ISLAND5_ORE_TYPE.OBLIVIONITE,
    rarity: 1000, // 1 in 1000
    value: 1_130_000_000_000_000_000_000, // 1.13Sx
    firstDepth: 250,
    firstHealth: 2_000_000_000_000_000_000_000, // 2Sx
    lastDepth: 1000,
    lastHealth: 20_000_000_000_000_000_000_000, // 20Sx
    name: 'Oblivionite',
    block: 'Oblivionite',
    color: '#C1121F',
  },
};

export function getIsland5OreData(oreType: ISLAND5_ORE_TYPE): Island5OreData {
  return ISLAND5_ORE_DATABASE[oreType];
}

