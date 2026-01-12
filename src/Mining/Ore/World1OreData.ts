/**
 * World 1 Ore Data
 * 
 * Defines ore types and their properties using the NEW LINEAR SCALING SYSTEM.
 * Each ore has a depth range and health scales linearly within that range.
 * 
 * Reference: Planning/ProgressionBalanceBlueprint.md section 2
 */

/**
 * Enumeration of all ore types in the game
 * 24 ores total with progressive depth unlocking
 * Reference: Planning/ProgressionBalanceBlueprint.md
 */
export enum OreType {
  // Common Ores (Available Early)
  STONE = 'stone',
  DEEPSLATE = 'deepslate',
  COAL = 'coal',
  IRON = 'iron',
  
  // Uncommon Ores (Early-Mid Game)
  TIN = 'tin',
  COBALT = 'cobalt',
  PYRITE = 'pyrite',
  GOLD = 'gold',
  
  // Rare Ores (Mid Game)
  OBSIDIAN = 'obsidian',
  RUBY = 'ruby',
  DIAMOND = 'diamond',
  AMBER = 'amber',
  
  // Very Rare Ores (Mid-Late Game)
  QUARTZ = 'quartz',
  TOPAZ = 'topaz',
  EMERALD = 'emerald',
  RELIC = 'relic',
  
  // Ultra Rare Ores (Late Game)
  AMETHYST = 'amethyst',
  SAPPHIRE = 'sapphire',
  LUMINITE = 'luminite',
  PRISMATIC = 'prismatic',
  
  // Legendary Ores (End Game)
  SUNSTONE = 'sunstone',
  MITHRIAL = 'mithrial',
  ASTRALITE = 'astralite',
  DRAGONSTONE = 'dragonstone',
}

/**
 * Ore data structure (NEW LINEAR SCALING SYSTEM)
 */
export interface OreData {
  /** Type of ore */
  type: OreType;
  
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
  
  /** Block identifier/type (placeholder) */
  block: string;
  
  /** Color in hex format (placeholder) */
  color: string;
}

/**
 * Shared interface for ore health calculation
 * Used by both World 1 and World 2 ore data
 */
export interface OreHealthData {
  /** First depth where this ore can spawn */
  firstDepth: number;
  /** Health at first depth */
  firstHealth: number;
  /** Last depth (always 1000) */
  lastDepth: number;
  /** Health at last depth (depth 1000) */
  lastHealth: number;
}

/**
 * Calculate ore health at a given depth using linear interpolation
 * Formula: HP = FirstHealth + ((CurrentDepth - FirstDepth) / (LastDepth - FirstDepth)) × (LastHealth - FirstHealth)
 * 
 * Shared function for both World 1 and World 2 ores
 * 
 * @param oreData - Ore data with health properties (OreData or Island2OreData)
 * @param currentDepth - Current depth in the mine
 * @returns Calculated health at the given depth
 */
export function calculateOreHealth(oreData: OreHealthData, currentDepth: number): number {
  // If before first depth, use first health
  if (currentDepth <= oreData.firstDepth) {
    return oreData.firstHealth;
  }
  
  // If at or past last depth, use last health
  if (currentDepth >= oreData.lastDepth) {
    return oreData.lastHealth;
  }
  
  // Linear interpolation
  const depthRange = oreData.lastDepth - oreData.firstDepth;
  const healthRange = oreData.lastHealth - oreData.firstHealth;
  const depthProgress = currentDepth - oreData.firstDepth;
  
  return Math.round(oreData.firstHealth + (depthProgress / depthRange) * healthRange);
}

/**
 * Database of all ore types with their properties
 * 24 ores with linear health scaling from firstDepth to lastDepth (1000)
 * Reference: Planning/ProgressionBalanceBlueprint.md section 2
 */
export const ORE_DATABASE: Record<OreType, OreData> = {
  // Common Ores (Available from start)
  [OreType.STONE]: {
    type: OreType.STONE,
    rarity: 1,  // 1 in 1
    value: 2,
    firstDepth: 26,
    firstHealth: 3,
    lastDepth: 1000,
    lastHealth: 10000,
    name: 'Stone',
    block: 'stone-ore',
    color: '#808080',  // Gray - placeholder
  },
  [OreType.DEEPSLATE]: {
    type: OreType.DEEPSLATE,
    rarity: 1,  // 1 in 1
    value: 5,
    firstDepth: 26,
    firstHealth: 12,
    lastDepth: 1000,
    lastHealth: 19634,
    name: 'Deepslate',
    block: 'deepslate-ore',
    color: '#2F2F2F',  // Dark gray - placeholder
  },
  [OreType.COAL]: {
    type: OreType.COAL,
    rarity: 5,  // 1 in 5
    value: 6,
    firstDepth: 33,
    firstHealth: 8,
    lastDepth: 1000,
    lastHealth: 22000,
    name: 'Coal',
    block: 'coal-ore',
    color: '#1A1A1A',  // Black - placeholder
  },
  [OreType.IRON]: {
    type: OreType.IRON,
    rarity: 10,  // 1 in 10
    value: 10,
    firstDepth: 38,
    firstHealth: 24,
    lastDepth: 1000,
    lastHealth: 25500,
    name: 'Iron',
    block: 'iron-ore',
    color: '#C0C0C0',  // Silver - placeholder
  },
  
  // Uncommon Ores (Early-Mid Game)
  [OreType.TIN]: {
    type: OreType.TIN,
    rarity: 12,  // 1 in 12
    value: 15,
    firstDepth: 59,
    firstHealth: 106,
    lastDepth: 1000,
    lastHealth: 27994,
    name: 'Tin',
    block: 'tin-ore',
    color: '#D3D3D3',  // Light gray - placeholder
  },
  [OreType.COBALT]: {
    type: OreType.COBALT,
    rarity: 14,  // 1 in 14
    value: 50,
    firstDepth: 58,
    firstHealth: 178,
    lastDepth: 1000,
    lastHealth: 45858,
    name: 'Cobalt',
    block: 'cobalt-ore',
    color: '#0047AB',  // Blue - placeholder
  },
  [OreType.PYRITE]: {
    type: OreType.PYRITE,
    rarity: 16,  // 1 in 16
    value: 100,
    firstDepth: 68,
    firstHealth: 325,
    lastDepth: 1000,
    lastHealth: 56953,
    name: 'Pyrite',
    block: 'pyrite-ore',
    color: '#FFD700',  // Gold - placeholder
  },
  [OreType.GOLD]: {
    type: OreType.GOLD,
    rarity: 22,  // 1 in 22
    value: 250,
    firstDepth: 97,
    firstHealth: 902,
    lastDepth: 1000,
    lastHealth: 68720,
    name: 'Gold',
    block: 'gold-ore',
    color: '#FFD700',  // Gold - placeholder
  },
  
  // Rare Ores (Mid Game)
  [OreType.OBSIDIAN]: {
    type: OreType.OBSIDIAN,
    rarity: 33,  // 1 in 33
    value: 500,
    firstDepth: 149,
    firstHealth: 3067,
    lastDepth: 1000,
    lastHealth: 93314,
    name: 'Obsidian',
    block: 'obsidian-ore',
    color: '#000000',  // Black - placeholder
  },
  [OreType.RUBY]: {
    type: OreType.RUBY,
    rarity: 50,  // 1 in 50
    value: 1000,
    firstDepth: 113,
    firstHealth: 2890,
    lastDepth: 1000,
    lastHealth: 139970,
    name: 'Ruby',
    block: 'ruby-ore',
    color: '#E0115F',  // Red - placeholder
  },
  [OreType.DIAMOND]: {
    type: OreType.DIAMOND,
    rarity: 100,  // 1 in 100
    value: 2000,
    firstDepth: 180,
    firstHealth: 6986,
    lastDepth: 1000,
    lastHealth: 180000,
    name: 'Diamond',
    block: 'diamond-ore',
    color: '#B9F2FF',  // Light blue/cyan - placeholder
  },
  [OreType.AMBER]: {
    type: OreType.AMBER,
    rarity: 100,  // 1 in 100
    value: 3500,
    firstDepth: 245,
    firstHealth: 9735,
    lastDepth: 1000,
    lastHealth: 230000,
    name: 'Amber',
    block: 'amber-ore',
    color: '#FFBF00',  // Amber/orange - placeholder
  },
  
  // Very Rare Ores (Mid-Late Game)
  [OreType.QUARTZ]: {
    type: OreType.QUARTZ,
    rarity: 100,  // 1 in 100
    value: 5000,
    firstDepth: 215,
    firstHealth: 12250,
    lastDepth: 1000,
    lastHealth: 245000,
    name: 'Quartz',
    block: 'quartz-ore',
    color: '#F5F5DC',  // Beige/white - placeholder
  },
  [OreType.TOPAZ]: {
    type: OreType.TOPAZ,
    rarity: 200,  // 1 in 200
    value: 10000,
    firstDepth: 273,
    firstHealth: 24758,
    lastDepth: 1000,
    lastHealth: 285000,
    name: 'Topaz',
    block: 'topaz-ore',
    color: '#FFC87C',  // Yellow/orange - placeholder
  },
  [OreType.EMERALD]: {
    type: OreType.EMERALD,
    rarity: 222,  // 1 in 222
    value: 20000,
    firstDepth: 540,
    firstHealth: 92389,
    lastDepth: 1000,
    lastHealth: 294520,
    name: 'Emerald',
    block: 'emerald-ore',
    color: '#50C878',  // Green - placeholder
  },
  [OreType.RELIC]: {
    type: OreType.RELIC,
    rarity: 250,  // 1 in 250
    value: 50000,
    firstDepth: 550,
    firstHealth: 159190,
    lastDepth: 1000,
    lastHealth: 385000,
    name: 'Relic',
    block: 'relic-ore',
    color: '#8B7355',  // Brown - placeholder
  },
  
  // Ultra Rare Ores (Late Game)
  [OreType.AMETHYST]: {
    type: OreType.AMETHYST,
    rarity: 285,  // 1 in 285
    value: 75000,
    firstDepth: 430,
    firstHealth: 106180,
    lastDepth: 1000,
    lastHealth: 559890,
    name: 'Amethyst',
    block: 'amethyst-ore',
    color: '#9966CC',  // Purple - placeholder
  },
  [OreType.SAPPHIRE]: {
    type: OreType.SAPPHIRE,
    rarity: 333,  // 1 in 333
    value: 150000,
    firstDepth: 847,
    firstHealth: 585970,
    lastDepth: 1000,
    lastHealth: 820000,
    name: 'Sapphire',
    block: 'sapphire-ore',
    color: '#0F52BA',  // Blue - placeholder
  },
  [OreType.LUMINITE]: {
    type: OreType.LUMINITE,
    rarity: 400,  // 1 in 400
    value: 250000,
    firstDepth: 893,
    firstHealth: 987200,
    lastDepth: 1000,
    lastHealth: 1310000,
    name: 'Luminite',
    block: 'luminite-ore',
    color: '#00FF00',  // Green (glowing) - placeholder
  },
  [OreType.PRISMATIC]: {
    type: OreType.PRISMATIC,
    rarity: 666,  // 1 in 666
    value: 350000,
    firstDepth: 638,
    firstHealth: 767500,
    lastDepth: 1000,
    lastHealth: 1550000,
    name: 'Prismatic',
    block: 'prismatic-ore',
    color: '#E0E0E0',  // Light gray/white - placeholder
  },
  
  // Legendary Ores (End Game)
  [OreType.SUNSTONE]: {
    type: OreType.SUNSTONE,
    rarity: 1000,  // 1 in 1000
    value: 450000,
    firstDepth: 870,
    firstHealth: 1690000,
    lastDepth: 1000,
    lastHealth: 1900000,
    name: 'Sunstone',
    block: 'sunstone-ore',
    color: '#FFA500',  // Orange/yellow (sun-like) - placeholder
  },
  [OreType.MITHRIAL]: {
    type: OreType.MITHRIAL,
    rarity: 2000,  // 1 in 2000
    value: 600000,
    firstDepth: 829,
    firstHealth: 2170000,
    lastDepth: 1000,
    lastHealth: 2400000,
    name: 'Mithrial',
    block: 'mithrial-ore',
    color: '#C0C0C0',  // Silver - placeholder
  },
  [OreType.ASTRALITE]: {
    type: OreType.ASTRALITE,
    rarity: 2857,  // 1 in 2857
    value: 800000,
    firstDepth: 770,
    firstHealth: 2710000,
    lastDepth: 1000,
    lastHealth: 3100000,
    name: 'Astralite',
    block: 'astralite-ore',
    color: '#708090',  // Slate gray - placeholder
  },
  [OreType.DRAGONSTONE]: {
    type: OreType.DRAGONSTONE,
    rarity: 10000,  // 1 in 10000
    value: 1500000,
    firstDepth: 875,
    firstHealth: 3300000,
    lastDepth: 1000,
    lastHealth: 4000000,
    name: 'Dragonstone',
    block: 'dragonstone-ore',
    color: '#8B0000',  // Dark red (dragon-like) - placeholder
  },
};

