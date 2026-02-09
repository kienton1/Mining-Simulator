import type { WorldConfig } from './WorldConfig';

/**
 * Island 5 World Configuration
 *
 * Defines all settings for Island 5 (Void Village).
 */
export const ISLAND5_CONFIG: WorldConfig = {
  // Basic Info
  id: 'island5',
  name: 'Void Village',
  displayOrder: 5,

  // Unlock Requirements
  unlockRequirement: {
    type: 'trophies',
    amount: 50000, // Unlock with 50,000 trophies
  },

  // Trophy Multiplier
  trophyMultiplier: 100000, // x100,000 trophies per mine completion

  // Map Settings
  mapFile: 'map.json',
  mapOffset: {
    x: 0,
    z: 0,
  },

  // Spawn Point
  spawnPoint: {
    x: -1088,
    y: 1,
    z: 17,
  },

  // Mining Area
  miningArea: {
    minX: -1092,
    maxX: -1086,
    minZ: 33,
    maxZ: 39,
    y: 0,
  },

  // NPC Positions (relative to mine center)
  npcs: {
    merchant: {
      x: -1096.56,
      y: 1.75,
      z: 31.15,
    },
    mineResetUpgradeNpc: {
      x: -1082.92,
      y: 2.45,
      z: 31.35,
    },
    gemTrader: {
      x: -1073.17,
      y: 2.25,
      z: 26.29,
    },
  },

  // Egg Station Positions (placeholder positions, matching relative offsets)
  eggStations: {
    abyssal: {
      x: -1101,
      y: 2,
      z: 26,
    },
    boardwalk: {
      x: -1101,
      y: 2,
      z: 22,
    },
    shipwreck: {
      x: -1101,
      y: 2,
      z: 18,
    },
  },

  // Data File References
  dataFiles: {
    ores: './src/Mining/Ore/World5OreData.ts',
    trainingRocks: './src/worldData/TrainingRocks.ts',
    pets: './src/Pets/PetDatabase.ts',
  },
};
