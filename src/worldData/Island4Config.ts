import type { WorldConfig } from './WorldConfig';

/**
 * Island 4 World Configuration
 *
 * Defines all settings for Island 4 (Snow World).
 */
export const ISLAND4_CONFIG: WorldConfig = {
  // Basic Info
  id: 'island4',
  name: 'Snow World',
  displayOrder: 4,

  // Unlock Requirements
  unlockRequirement: {
    type: 'trophies',
    amount: 1000, // Unlock with 1000 trophies
  },

  // Trophy Multiplier
  trophyMultiplier: 10000, // x10,000 trophies per mine completion

  // Map Settings
  mapFile: 'map.json',
  mapOffset: {
    x: 0,
    z: 0,
  },

  // Spawn Point
  spawnPoint: {
    x: -921,
    y: 1,
    z: 8,
  },

  // Mining Area
  miningArea: {
    minX: -925,
    maxX: -919,
    minZ: 24,
    maxZ: 30,
    y: 0,
  },

  // NPC Positions (relative to mine center)
  npcs: {
    merchant: {
      x: -929.56,
      y: 1.75,
      z: 22.15,
    },
    mineResetUpgradeNpc: {
      x: -915.92,
      y: 2.45,
      z: 22.35,
    },
    gemTrader: {
      x: -906.17,
      y: 2.25,
      z: 17.29,
    },
  },

  // Egg Station Positions (relative to mine center, same offsets as other worlds)
  eggStations: {
    sweets: {
      x: -934,
      y: 2,
      z: 17,
    },
    ornament: {
      x: -934,
      y: 2,
      z: 13,
    },
    winter: {
      x: -934,
      y: 2,
      z: 9,
    },
  },

  // Data File References
  dataFiles: {
    ores: './src/Mining/Ore/World4OreData.ts',
    trainingRocks: './src/worldData/TrainingRocks.ts',
    pets: './src/Pets/PetDatabase.ts',
  },
};
