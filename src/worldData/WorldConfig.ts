export interface WorldConfig {
  /** Unique identifier for the world */
  id: string;

  /** Display name for the world */
  name: string;

  /** Display order in world selection UI */
  displayOrder: number;

  /** Unlock requirement */
  unlockRequirement: {
    type: 'trophies';
    amount: number;
  };

  /** Trophy multiplier for mine completions */
  trophyMultiplier: number;

  /** Map file path */
  mapFile: string;

  /** World offset coordinates */
  mapOffset: {
    x: number;
    z: number;
  };

  /** Spawn point coordinates */
  spawnPoint: {
    x: number;
    y: number;
    z: number;
  };

  /** Mining area bounds */
  miningArea: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    y: number;
  };

  /** NPC positions */
  npcs: {
    merchant: { x: number; y: number; z: number };
    mineResetUpgradeNpc: { x: number; y: number; z: number };
    gemTrader: { x: number; y: number; z: number };
  };

  /** Egg station positions */
  eggStations: {
    abyssal: { x: number; y: number; z: number };
    boardwalk: { x: number; y: number; z: number };
    shipwreck: { x: number; y: number; z: number };
  };

  /** Training rock positions (auto-detected from map, but can override) */
  trainingRocks?: Array<{
    x: number;
    y: number;
    z: number;
    tier: number;
  }>;

  /** References to world-specific data files */
  dataFiles: {
    ores: string;
    trainingRocks: string;
    pets: string;
  };
}
