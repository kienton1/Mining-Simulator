import type { EggStationDefinition } from './EggStationManager';
import { EggType } from './PetData';

/**
 * Egg Stations
 * Positions align with barrel props in `assets/map.json`.
 * Used by both server systems and tutorial guidance.
 */
export const EGG_STATIONS: EggStationDefinition[] = [
  // World 1 (Island 1) Egg Stations
  {
    id: 'egg-station-stone',
    name: 'Stone Egg Station',
    eggType: EggType.STONE,
    defaultOpenCount: 1,
    worldId: 'island1',
    // Exact barrel prop coordinate from `assets/map.json` entities: "-13,2,9"
    position: { x: -13, y: 2, z: 9 },
  },
  {
    id: 'egg-station-gem',
    name: 'Gem Egg Station',
    eggType: EggType.GEM,
    defaultOpenCount: 3,
    worldId: 'island1',
    // Exact barrel prop coordinate from `assets/map.json` entities: "-13,2,5"
    position: { x: -13, y: 2, z: 5 },
  },
  {
    id: 'egg-station-crystal',
    name: 'Crystal Egg Station',
    eggType: EggType.CRYSTAL,
    defaultOpenCount: 1,
    worldId: 'island1',
    // Exact barrel prop coordinate from `assets/map.json` entities: "-13,2,1"
    position: { x: -13, y: 2, z: 1 },
  },

  // World 2 (Island 2 / Beach World) Egg Stations
  {
    id: 'egg-station-abyssal',
    name: 'Abyssal Egg Station',
    eggType: EggType.ABYSSAL,
    defaultOpenCount: 1,
    worldId: 'island2',
    // User-provided position for World 2 Abyssal Egg
    position: { x: -299.97, y: 1.75, z: 9.95 },
  },
  {
    id: 'egg-station-boardwalk',
    name: 'Boardwalk Egg Station',
    eggType: EggType.BOARDWALK,
    defaultOpenCount: 3,
    worldId: 'island2',
    // User-provided position for World 2 Boardwalk Egg
    position: { x: -300.03, y: 1.75, z: 6.12 },
  },
  {
    id: 'egg-station-shipwreck',
    name: 'Shipwreck Egg Station',
    eggType: EggType.SHIPWRECK,
    defaultOpenCount: 1,
    worldId: 'island2',
    // User-provided position for World 2 Shipwreck Egg
    position: { x: -299.97, y: 1.75, z: 1.95 },
  },

  // World 3 (Island 3 / Volcanic World) Egg Stations
  {
    id: 'egg-station-sand',
    name: 'Sand Egg Station',
    eggType: EggType.SAND,
    defaultOpenCount: 1,
    worldId: 'island3',
    position: { x: -600, y: 2, z: 12 },
  },
  {
    id: 'egg-station-snow',
    name: 'Snow Egg Station',
    eggType: EggType.SNOW,
    defaultOpenCount: 1,
    worldId: 'island3',
    position: { x: -600, y: 2, z: 8 },
  },
  {
    id: 'egg-station-lava',
    name: 'Lava Egg Station',
    eggType: EggType.LAVA,
    defaultOpenCount: 1,
    worldId: 'island3',
    position: { x: -600, y: 2, z: 4 },
  },
];
