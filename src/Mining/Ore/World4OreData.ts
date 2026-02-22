/**
 * World 4 Ore Data (Snow World)
 *
 * Defines all 20 snow-themed ores for World 4.
 * Each ore has a depth range and health scales linearly within that range.
 */

import { calculateOreHealth } from './World1OreData';

/**
 * Enumeration of all ore types in World 4 (snow theme)
 * 20 ores total with progressive depth unlocking
 */
export enum ISLAND4_ORE_TYPE {
  // Common Ores (Available Early)
  FROSTBRICK = 'frostbrick',
  SNOWSPICE = 'snowspice',
  TINSEL_LEAD = 'tinsel_lead',
  EVERGREEN_CRYSTAL = 'evergreen_crystal',
  ICICLE_STEEL = 'icicle_steel',
  CANDYCANE_VEIN = 'candycane_vein',

  // Uncommon Ores (Early-Mid Game)
  HEARTHFIRE_CRYSTAL = 'hearthfire_crystal',
  STARFLARE = 'starflare',
  NORTHSTAR_PLATINUM = 'northstar_platinum',
  TWINKLEITE = 'twinkleite',
  SNOWMOON_ORE = 'snowmoon_ore',
  COAL_OF_YULE = 'coal_of_yule',

  // Rare Ores (Mid Game)
  RUDOLPHS_EYE = 'rudolphs_eye',
  YULETIDE_EMBERSTONE = 'yuletide_emberstone',
  JINGLEVOLT_ORE = 'jinglevolt_ore',
  MOLTEN_COCOA_STONE = 'molten_cocoa_stone',

  // Very Rare Ores (Late Game)
  CANDLELIGHT_CRYSTAL = 'candlelight_crystal',
  AURORALIGHT_ORE = 'auroralight_ore',
  FIRESNOW_CORE = 'firesnow_core',
  SUGARPLUM_QUARTZ = 'sugarplum_quartz',
}

/**
 * Ore data structure for World 4
 */
export interface Island4OreData {
  /** Type of ore */
  type: ISLAND4_ORE_TYPE;

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
 * Calculate ore health for World 4 ores
 * Uses the shared calculateOreHealth function from World1OreData
 */
export function calculateIsland4OreHealth(oreData: Island4OreData, currentDepth: number): number {
  return calculateOreHealth(oreData, currentDepth);
}

/**
 * Database of all World 4 ore types with their properties
 * 20 snow-themed ores with linear health scaling from firstDepth to lastDepth (1000)
 */
export const ISLAND4_ORE_DATABASE: Record<ISLAND4_ORE_TYPE, Island4OreData> = {
  // Common Ores (Available from start)
  [ISLAND4_ORE_TYPE.FROSTBRICK]: {
    type: ISLAND4_ORE_TYPE.FROSTBRICK,
    rarity: 1, // 1 in 1
    value: 1_000_000_000_000, // 1T
    firstDepth: 0,
    firstHealth: 350_000_000_000, // 350B
    lastDepth: 1000,
    lastHealth: 700_000_000_000_000, // 700T
    name: 'Frostbrick',
    block: 'Frostbrick',
    color: '#CFE9FF',
  },
  [ISLAND4_ORE_TYPE.SNOWSPICE]: {
    type: ISLAND4_ORE_TYPE.SNOWSPICE,
    rarity: 5, // 1 in 5
    value: 3_000_000_000_000, // 3T
    firstDepth: 5,
    firstHealth: 750_000_000_000, // 750B
    lastDepth: 1000,
    lastHealth: 1_500_000_000_000_000, // 1.5Qd
    name: 'Snowspice',
    block: 'Snowspice',
    color: '#F5F7FA',
  },
  [ISLAND4_ORE_TYPE.TINSEL_LEAD]: {
    type: ISLAND4_ORE_TYPE.TINSEL_LEAD,
    rarity: 10, // 1 in 10
    value: 5_000_000_000_000, // 5T
    firstDepth: 5,
    firstHealth: 2_500_000_000_000, // 2.5T
    lastDepth: 1000,
    lastHealth: 2_500_000_000_000_000, // 2.5Qd
    name: 'Tinsel Lead',
    block: 'Tinsel_Lead',
    color: '#9CA3AF',
  },
  [ISLAND4_ORE_TYPE.EVERGREEN_CRYSTAL]: {
    type: ISLAND4_ORE_TYPE.EVERGREEN_CRYSTAL,
    rarity: 12, // 1 in 12
    value: 7_500_000_000_000, // 7.5T
    firstDepth: 5,
    firstHealth: 6_000_000_000_000, // 6T
    lastDepth: 1000,
    lastHealth: 3_000_000_000_000_000, // 3Qd
    name: 'Evergreen Crystal',
    block: 'Evergreen_Crystal',
    color: '#2E8B57',
  },
  [ISLAND4_ORE_TYPE.ICICLE_STEEL]: {
    type: ISLAND4_ORE_TYPE.ICICLE_STEEL,
    rarity: 14, // 1 in 14
    value: 25_000_000_000_000, // 25T
    firstDepth: 5,
    firstHealth: 25_000_000_000_000, // 25T
    lastDepth: 1000,
    lastHealth: 5_000_000_000_000_000, // 5Qd
    name: 'Icicle Steel',
    block: 'Icicle_Steel',
    color: '#A7C7E7',
  },
  [ISLAND4_ORE_TYPE.CANDYCANE_VEIN]: {
    type: ISLAND4_ORE_TYPE.CANDYCANE_VEIN,
    rarity: 16, // 1 in 16
    value: 50_000_000_000_000, // 50T
    firstDepth: 50,
    firstHealth: 125_000_000_000_000, // 125T
    lastDepth: 1000,
    lastHealth: 7_000_000_000_000_000, // 7Qd
    name: 'Candycane Vein',
    block: 'Candycane_Vein',
    color: '#E53935',
  },

  // Uncommon Ores (Early-Mid Game)
  [ISLAND4_ORE_TYPE.HEARTHFIRE_CRYSTAL]: {
    type: ISLAND4_ORE_TYPE.HEARTHFIRE_CRYSTAL,
    rarity: 22, // 1 in 22
    value: 125_000_000_000_000, // 125T
    firstDepth: 75,
    firstHealth: 300_000_000_000_000, // 300T
    lastDepth: 1000,
    lastHealth: 9_000_000_000_000_000, // 9Qd
    name: 'Hearthfire Crystal',
    block: 'Hearthfire_Crystal',
    color: '#FF8C42',
  },
  [ISLAND4_ORE_TYPE.STARFLARE]: {
    type: ISLAND4_ORE_TYPE.STARFLARE,
    rarity: 33, // 1 in 33
    value: 250_000_000_000_000, // 250T
    firstDepth: 100,
    firstHealth: 500_000_000_000_000, // 500T
    lastDepth: 1000,
    lastHealth: 13_000_000_000_000_000, // 13Qd
    name: 'Starflare',
    block: 'Starflare',
    color: '#FFD54F',
  },
  [ISLAND4_ORE_TYPE.NORTHSTAR_PLATINUM]: {
    type: ISLAND4_ORE_TYPE.NORTHSTAR_PLATINUM,
    rarity: 50, // 1 in 50
    value: 500_000_000_000_000, // 500T
    firstDepth: 100,
    firstHealth: 1_000_000_000_000_000, // 1Qd
    lastDepth: 1000,
    lastHealth: 20_000_000_000_000_000, // 20Qd
    name: 'Northstar Platinum',
    block: 'Northstar_Platinum',
    color: '#E5E4E2',
  },
  [ISLAND4_ORE_TYPE.TWINKLEITE]: {
    type: ISLAND4_ORE_TYPE.TWINKLEITE,
    rarity: 100, // 1 in 100
    value: 1_000_000_000_000_000, // 1Qd
    firstDepth: 100,
    firstHealth: 1_000_000_000_000_000, // 1Qd
    lastDepth: 1000,
    lastHealth: 25_000_000_000_000_000, // 25Qd
    name: 'Twinkleite',
    block: 'Twinkleite',
    color: '#40E0D0',
  },
  [ISLAND4_ORE_TYPE.SNOWMOON_ORE]: {
    type: ISLAND4_ORE_TYPE.SNOWMOON_ORE,
    rarity: 100, // 1 in 100
    value: 1_750_000_000_000_000, // 1.75Qd
    firstDepth: 100,
    firstHealth: 1_000_000_000_000_000, // 1Qd
    lastDepth: 1000,
    lastHealth: 26_000_000_000_000_000, // 26Qd
    name: 'Snowmoon Ore',
    block: 'Snowmoon_Ore',
    color: '#B3E5FC',
  },
  [ISLAND4_ORE_TYPE.COAL_OF_YULE]: {
    type: ISLAND4_ORE_TYPE.COAL_OF_YULE,
    rarity: 100, // 1 in 100
    value: 2_500_000_000_000_000, // 2.5Qd
    firstDepth: 100,
    firstHealth: 2_000_000_000_000_000, // 2Qd
    lastDepth: 1000,
    lastHealth: 28_000_000_000_000_000, // 28Qd
    name: 'Coal of Yule',
    block: 'Coal_of_Yule',
    color: '#2B2B2B',
  },

  // Rare Ores (Mid Game)
  [ISLAND4_ORE_TYPE.RUDOLPHS_EYE]: {
    type: ISLAND4_ORE_TYPE.RUDOLPHS_EYE,
    rarity: 200, // 1 in 200
    value: 5_000_000_000_000_000, // 5Qd
    firstDepth: 100,
    firstHealth: 3_000_000_000_000_000, // 3Qd
    lastDepth: 1000,
    lastHealth: 30_000_000_000_000_000, // 30Qd
    name: "Rudolph's Eye",
    block: 'Rudolphs_Eye',
    color: '#D32F2F',
  },
  [ISLAND4_ORE_TYPE.YULETIDE_EMBERSTONE]: {
    type: ISLAND4_ORE_TYPE.YULETIDE_EMBERSTONE,
    rarity: 222, // 1 in 222
    value: 10_000_000_000_000_000, // 10Qd
    firstDepth: 100,
    firstHealth: 4_000_000_000_000_000, // 4Qd
    lastDepth: 1000,
    lastHealth: 35_000_000_000_000_000, // 35Qd
    name: 'Yuletide Emberstone',
    block: 'Yuletide_Emberstone',
    color: '#FF6F3C',
  },
  [ISLAND4_ORE_TYPE.JINGLEVOLT_ORE]: {
    type: ISLAND4_ORE_TYPE.JINGLEVOLT_ORE,
    rarity: 250, // 1 in 250
    value: 25_000_000_000_000_000, // 25Qd
    firstDepth: 250,
    firstHealth: 25_000_000_000_000_000, // 25Qd
    lastDepth: 1000,
    lastHealth: 400_000_000_000_000_000, // 400Qd
    name: 'Jinglevolt Ore',
    block: 'Jinglevolt_Ore',
    color: '#00B0FF',
  },
  [ISLAND4_ORE_TYPE.MOLTEN_COCOA_STONE]: {
    type: ISLAND4_ORE_TYPE.MOLTEN_COCOA_STONE,
    rarity: 285, // 1 in 285
    value: 37_500_000_000_000_000, // 37.5Qd
    firstDepth: 250,
    firstHealth: 25_000_000_000_000_000, // 25Qd
    lastDepth: 1000,
    lastHealth: 250_000_000_000_000_000, // 250Qd
    name: 'Molten Cocoa Stone',
    block: 'Molten_Cocoa_Stone',
    color: '#8B5E3C',
  },

  // Very Rare Ores (Late Game)
  [ISLAND4_ORE_TYPE.CANDLELIGHT_CRYSTAL]: {
    type: ISLAND4_ORE_TYPE.CANDLELIGHT_CRYSTAL,
    rarity: 333, // 1 in 333
    value: 75_000_000_000_000_000, // 75Qd
    firstDepth: 250,
    firstHealth: 25_000_000_000_000_000, // 25Qd
    lastDepth: 1000,
    lastHealth: 300_000_000_000_000_000, // 300Qd
    name: 'Candlelight Crystal',
    block: 'Candlelight_Crystal',
    color: '#FFE082',
  },
  [ISLAND4_ORE_TYPE.AURORALIGHT_ORE]: {
    type: ISLAND4_ORE_TYPE.AURORALIGHT_ORE,
    rarity: 400, // 1 in 400
    value: 125_000_000_000_000_000, // 125Qd
    firstDepth: 250,
    firstHealth: 75_000_000_000_000_000, // 75Qd
    lastDepth: 1000,
    lastHealth: 500_000_000_000_000_000, // 500Qd
    name: 'Auroralight Ore',
    block: 'Auroralight_Ore',
    color: '#7CFC98',
  },
  [ISLAND4_ORE_TYPE.FIRESNOW_CORE]: {
    type: ISLAND4_ORE_TYPE.FIRESNOW_CORE,
    rarity: 666, // 1 in 666
    value: 175_000_000_000_000_000, // 175Qd
    firstDepth: 250,
    firstHealth: 100_000_000_000_000_000, // 100Qd
    lastDepth: 1000,
    lastHealth: 600_000_000_000_000_000, // 600Qd
    name: 'Firesnow Core',
    block: 'Firesnow_Core',
    color: '#FF7043',
  },
  [ISLAND4_ORE_TYPE.SUGARPLUM_QUARTZ]: {
    type: ISLAND4_ORE_TYPE.SUGARPLUM_QUARTZ,
    rarity: 1000, // 1 in 1000
    value: 235_000_000_000_000_000, // 235Qd
    firstDepth: 250,
    firstHealth: 200_000_000_000_000_000, // 200Qd
    lastDepth: 1000,
    lastHealth: 750_000_000_000_000_000, // 750Qd
    name: 'Sugarplum Quartz',
    block: 'Sugarplum_Quartz',
    color: '#C77DFF',
  },
};

export function getIsland4OreData(oreType: ISLAND4_ORE_TYPE): Island4OreData {
  return ISLAND4_ORE_DATABASE[oreType];
}
