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

  // Mining Area
  miningArea: {
    minX: -291,
    maxX: -285,
    minZ: 17,
    maxZ: 23,
    y: 0,
  },

  // NPC Positions (same relative positions, offset by map offset)
  npcs: {
    merchant: {
      x: -295.56,
      y: 1.79,
      z: 15.15,
    },
    mineResetUpgradeNpc: {
      x: -281.92,
      y: 1.79,
      z: 15.35,
    },
    gemTrader: {
      x: -272.17,
      y: 1.75,
      z: 10.29,
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
