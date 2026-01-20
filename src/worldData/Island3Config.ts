import type { WorldConfig } from './WorldConfig';

/**
 * Island 3 World Configuration
 *
 * Defines all settings for Island 3 (Volcanic World).
 */
export const ISLAND3_CONFIG: WorldConfig = {
  // Basic Info
  id: 'island3',
  name: 'Volcanic World',
  displayOrder: 3,

  // Unlock Requirements
  unlockRequirement: {
    type: 'wins',
    amount: 100, // Unlock with 100 wins
  },

  // Trophy Multiplier
  trophyMultiplier: 1000, // x1000 trophies per mine completion in volcanic world

  // Map Settings
  mapFile: 'map.json',
  mapOffset: {
    x: 0,
    z: 0,
  },

  // Spawn Point
  spawnPoint: {
    x: -587,
    y: 1,
    z: 1,
  },

  // Mining Area
  miningArea: {
    minX: -591,
    maxX: -585,
    minZ: 19,
    maxZ: 25,
    y: 0,
  },

  // NPC Positions (placeholder near spawn)
  npcs: {
    merchant: {
      x: -595.56,
      y: 1.79,
      z: 17.15,
    },
    mineResetUpgradeNpc: {
      x: -581.92,
      y: 1.79,
      z: 17.35,
    },
    gemTrader: {
      x: -572.17,
      y: 1.75,
      z: 12.29,
    },
  },

  // Egg Station Positions (placeholder near spawn)
  eggStations: {
    abyssal: {
      x: -585,
      y: 1,
      z: -1,
    },
    boardwalk: {
      x: -587,
      y: 1,
      z: -1,
    },
    shipwreck: {
      x: -589,
      y: 1,
      z: -1,
    },
  },

  // Data File References
  dataFiles: {
    ores: './src/Mining/Ore/World3OreData.ts',
    trainingRocks: './src/Surface/Training/TrainingRockData.ts',
    pets: './src/Pets/PetDatabase.ts',
  },
};
