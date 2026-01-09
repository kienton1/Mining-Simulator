import { WorldConfig } from '../types/WorldConfig';

/**
 * Island 1 World Configuration
 *
 * Defines all settings for Island 1 (Original Map).
 * This is the default world that all players start with.
 */

export const ISLAND1_CONFIG: WorldConfig = {
  // Basic Info
  id: 'island1',
  name: 'Original World',
  displayOrder: 1,

  // Unlock Requirements (always unlocked)
  unlockRequirement: {
    type: 'wins',
    amount: 0, // Always unlocked
  },

  // Trophy Multiplier
  trophyMultiplier: 1, // Base multiplier

  // Map Settings
  mapFile: 'map.json',
  mapOffset: {
    x: 0,
    z: 0,
  },

  // Spawn Point (original map spawn position)
  spawnPoint: {
    x: 0,
    y: 10,
    z: 0,
  },

  // Mining Area (original bounds)
  miningArea: {
    minX: -4,
    maxX: 2,
    minZ: 16,
    maxZ: 22,
    y: 0,
  },

  // NPC Positions (original positions)
  npcs: {
    merchant: {
      x: -12.82,
      y: 1.79,
      z: 11.28,
    },
    mineResetUpgradeNpc: {
      x: 5.08,
      y: 1.79,
      z: 14.35,
    },
    gemTrader: {
      x: 14.83,
      y: 1.75,
      z: 9.29,
    },
  },

  // Egg Station Positions (original positions)
  eggStations: {
    abyssal: {
      x: -13,
      y: 2,
      z: 1,
    },
    boardwalk: {
      x: -13,
      y: 2,
      z: 5,
    },
    shipwreck: {
      x: -13,
      y: 2,
      z: 9,
    },
  },

  // Data File References (original data files)
  dataFiles: {
    ores: './src/Mining/Ore/OreData.ts',
    trainingRocks: './src/Surface/Training/TrainingRockData.ts',
    pets: './src/Pets/PetDatabase.ts',
  },
};

