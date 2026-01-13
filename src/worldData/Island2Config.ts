import type { WorldConfig } from './WorldConfig';

/**
 * Island 2 World Configuration
 *
 * Defines all settings for Island 2 (Beach World).
 * Reference: Planning/BeachMapPlans/Island2_ImplementationSummary.md
 */

export const ISLAND2_CONFIG: WorldConfig = {
  // Basic Info
  id: 'island2',
  name: 'Beach World',
  displayOrder: 2,

  // Unlock Requirements
  unlockRequirement: {
    type: 'wins',
    amount: 1, // Unlock with 1 win
  },

  // Trophy Multiplier
  trophyMultiplier: 100, // x100 trophies per mine completion

  // Map Settings
  mapFile: 'BeachMap.json',
  mapOffset: {
    x: 750,
    z: 750,
  },

  // Spawn Point (beach map spawn position)
  spawnPoint: {
    x: -287,
    y: 1,
    z: 2,
  },

  // Mining Area (same relative bounds, offset by map offset)
  miningArea: {
    minX: 746, // -4 + 750
    maxX: 752, // 2 + 750
    minZ: 766, // 16 + 750
    maxZ: 772, // 22 + 750
    y: 0,
  },

  // NPC Positions (same relative positions, offset by map offset)
  npcs: {
    merchant: {
      x: 737.18, // -12.82 + 750
      y: 1.79,
      z: 761.28, // 11.28 + 750
    },
    mineResetUpgradeNpc: {
      x: 755.08, // 5.08 + 750
      y: 1.79,
      z: 764.35, // 14.35 + 750
    },
    gemTrader: {
      x: 764.83, // 14.83 + 750
      y: 1.75,
      z: 759.29, // 9.29 + 750
    },
  },

  // Egg Station Positions (user-provided positions for World 2)
  eggStations: {
    abyssal: {
      x: -299.97,
      y: 1.75,
      z: 9.95,
    },
    boardwalk: {
      x: -300.03,
      y: 1.75,
      z: 6.12,
    },
    shipwreck: {
      x: -299.97,
      y: 1.75,
      z: 1.95,
    },
  },

  // Data File References
  dataFiles: {
    ores: './src/worlds/data/island2/Ores.ts',
    trainingRocks: './src/worlds/data/island2/TrainingRocks.ts',
    pets: './src/worlds/data/island2/Pets.ts',
  },
};
