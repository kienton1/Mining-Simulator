/**
 * Island 2 Pet System - Static Database + Egg Loot Tables
 *
 * Defines all 17 ocean-themed pets for Island 2 (Beach World).
 * Uses higher costs and multipliers compared to Island 1.
 */

import { PetRarity, EggType as BaseEggType, type EggDefinition, type PetDefinition, type PetId } from '../../../Pets/PetData';

/**
 * Egg types for Island 2 (ocean-themed)
 */
export enum ISLAND2_EGG_TYPE {
  ABYSSAL = 'abyssal',
  BOARDWALK = 'boardwalk',
  SHIPWRECK = 'shipwreck',
}

/**
 * Egg definitions for Island 2 with higher costs
 */
export const ISLAND2_EGG_DEFINITIONS: Record<ISLAND2_EGG_TYPE, EggDefinition> = {
  [ISLAND2_EGG_TYPE.ABYSSAL]: { eggType: ISLAND2_EGG_TYPE.ABYSSAL as any, costGold: 100000 },      // 100K (vs Island 1 Stone: 10)
  [ISLAND2_EGG_TYPE.BOARDWALK]: { eggType: ISLAND2_EGG_TYPE.BOARDWALK as any, costGold: 250000000 }, // 250M (vs Island 1 Gem: 100)
  [ISLAND2_EGG_TYPE.SHIPWRECK]: { eggType: ISLAND2_EGG_TYPE.SHIPWRECK as any, costGold: 1000000000 }, // 1B (vs Island 1 Crystal: 2500)
};

/**
 * Stable pet IDs for Island 2 (persisted)
 */
export const ISLAND2_PET_IDS = {
  // Abyssal Egg (5 pets)
  BABY_SANDRAY: 'baby_sandray',
  BABY_TIDEPUP: 'baby_tidepup',
  BABY_REEFWING: 'baby_reefwing',
  BABY_KRAKLING: 'baby_krakling',
  BABY_GHOSTGULL: 'baby_ghostgull',

  // Boardwalk Egg (6 pets)
  LIFEGUARD: 'lifeguard',
  BABY_TRISHELL: 'baby_trishell',
  BABY_ROCKHERON: 'baby_rockheron',
  BABY_MADMARINER: 'baby_madmariner',
  BABY_TURTE: 'baby_turte',
  BABY_SEAL: 'baby_seal',

  // Shipwreck Egg (6 pets)
  BABY_CORALCLAD: 'baby_coralclad',
  BABY_GIGGLECRAB: 'baby_gigglecrab',
  BABY_SKIFFLET: 'baby_skifflet',
  BABY_EMBERFIN: 'baby_emberfin',
  BABY_NEONKELP: 'baby_neonkelp',
  BABY_PEARLMAW: 'baby_pearlmaw',
} as const satisfies Record<string, PetId>;

/**
 * Pet definitions array for Island 2
 */
const ISLAND2_PET_DEFINITIONS_ARRAY: PetDefinition[] = [
  // Abyssal Egg
  { id: ISLAND2_PET_IDS.BABY_SANDRAY, name: 'Baby Sandray', eggType: ISLAND2_EGG_TYPE.ABYSSAL as any, rarity: PetRarity.COMMON, multiplier: 5500 },
  { id: ISLAND2_PET_IDS.BABY_TIDEPUP, name: 'Baby Tidepup', eggType: ISLAND2_EGG_TYPE.ABYSSAL as any, rarity: PetRarity.COMMON, multiplier: 8000 },
  { id: ISLAND2_PET_IDS.BABY_REEFWING, name: 'Baby Reefwing', eggType: ISLAND2_EGG_TYPE.ABYSSAL as any, rarity: PetRarity.RARE, multiplier: 30000 },
  { id: ISLAND2_PET_IDS.BABY_KRAKLING, name: 'Baby Krakling', eggType: ISLAND2_EGG_TYPE.ABYSSAL as any, rarity: PetRarity.EPIC, multiplier: 65000 },
  { id: ISLAND2_PET_IDS.BABY_GHOSTGULL, name: 'Baby Ghostgull', eggType: ISLAND2_EGG_TYPE.ABYSSAL as any, rarity: PetRarity.LEGENDARY, multiplier: 150000 },

  // Boardwalk Egg
  { id: ISLAND2_PET_IDS.LIFEGUARD, name: 'Lifeguard', eggType: ISLAND2_EGG_TYPE.BOARDWALK as any, rarity: PetRarity.COMMON, multiplier: 250 },
  { id: ISLAND2_PET_IDS.BABY_TRISHELL, name: 'Baby TriShell', eggType: ISLAND2_EGG_TYPE.BOARDWALK as any, rarity: PetRarity.COMMON, multiplier: 450 },
  { id: ISLAND2_PET_IDS.BABY_ROCKHERON, name: 'Baby Rockheron', eggType: ISLAND2_EGG_TYPE.BOARDWALK as any, rarity: PetRarity.RARE, multiplier: 1000 },
  { id: ISLAND2_PET_IDS.BABY_MADMARINER, name: 'Baby MadMariner', eggType: ISLAND2_EGG_TYPE.BOARDWALK as any, rarity: PetRarity.EPIC, multiplier: 3000 },
  { id: ISLAND2_PET_IDS.BABY_TURTE, name: 'Baby Turte', eggType: ISLAND2_EGG_TYPE.BOARDWALK as any, rarity: PetRarity.EPIC, multiplier: 10000 },
  { id: ISLAND2_PET_IDS.BABY_SEAL, name: 'Baby Seal', eggType: ISLAND2_EGG_TYPE.BOARDWALK as any, rarity: PetRarity.LEGENDARY, multiplier: 17500 },

  // Shipwreck Egg
  { id: ISLAND2_PET_IDS.BABY_CORALCLAD, name: 'Baby Coralclad', eggType: ISLAND2_EGG_TYPE.SHIPWRECK as any, rarity: PetRarity.COMMON, multiplier: 10000 },
  { id: ISLAND2_PET_IDS.BABY_GIGGLECRAB, name: 'Baby Gigglecrab', eggType: ISLAND2_EGG_TYPE.SHIPWRECK as any, rarity: PetRarity.COMMON, multiplier: 17500 },
  { id: ISLAND2_PET_IDS.BABY_SKIFFLET, name: 'Baby Skifflet', eggType: ISLAND2_EGG_TYPE.SHIPWRECK as any, rarity: PetRarity.RARE, multiplier: 50000 },
  { id: ISLAND2_PET_IDS.BABY_EMBERFIN, name: 'Baby Emberfin', eggType: ISLAND2_EGG_TYPE.SHIPWRECK as any, rarity: PetRarity.EPIC, multiplier: 150000 },
  { id: ISLAND2_PET_IDS.BABY_NEONKELP, name: 'Baby Neonkelp', eggType: ISLAND2_EGG_TYPE.SHIPWRECK as any, rarity: PetRarity.EPIC, multiplier: 280000 },
  { id: ISLAND2_PET_IDS.BABY_PEARLMAW, name: 'Baby Pearlmaw', eggType: ISLAND2_EGG_TYPE.SHIPWRECK as any, rarity: PetRarity.LEGENDARY, multiplier: 650000 },
];

/**
 * Pet definitions record for Island 2
 */
export const ISLAND2_PET_DEFINITIONS: Record<PetId, PetDefinition> = Object.fromEntries(
  ISLAND2_PET_DEFINITIONS_ARRAY.map((p) => [p.id, p])
) as Record<PetId, PetDefinition>;

/**
 * Get Island 2 pet definition by ID
 */
export function getIsland2PetDefinition(petId: PetId): PetDefinition | undefined {
  return ISLAND2_PET_DEFINITIONS[petId];
}

/**
 * Check if a string is a valid Island 2 pet ID
 */
export function isIsland2PetId(value: unknown): value is PetId {
  return typeof value === 'string' && value in ISLAND2_PET_DEFINITIONS;
}

/**
 * Egg loot entry type for Island 2
 */
export type Island2EggLootEntry = { petId: PetId; weight: number };

/**
 * Loot tables for Island 2 eggs
 * Weights derived from drop rates in planning document
 */
export const ISLAND2_EGG_LOOT_TABLES: Record<ISLAND2_EGG_TYPE, Island2EggLootEntry[]> = {
  [ISLAND2_EGG_TYPE.ABYSSAL]: [
    { petId: ISLAND2_PET_IDS.BABY_SANDRAY, weight: 63.27 },    // 63.270%
    { petId: ISLAND2_PET_IDS.BABY_TIDEPUP, weight: 30.00 },    // 30.000%
    { petId: ISLAND2_PET_IDS.BABY_REEFWING, weight: 6.00 },    // 6.000%
    { petId: ISLAND2_PET_IDS.BABY_KRAKLING, weight: 0.70 },    // 0.700%
    { petId: ISLAND2_PET_IDS.BABY_GHOSTGULL, weight: 0.04 },   // 0.040%
  ],
  [ISLAND2_EGG_TYPE.BOARDWALK]: [
    { petId: ISLAND2_PET_IDS.LIFEGUARD, weight: 70.449 },      // 70.449%
    { petId: ISLAND2_PET_IDS.BABY_TRISHELL, weight: 25.00 },   // 25.000%
    { petId: ISLAND2_PET_IDS.BABY_ROCKHERON, weight: 4.00 },   // 4.000%
    { petId: ISLAND2_PET_IDS.BABY_MADMARINER, weight: 0.50 },  // 0.500%
    { petId: ISLAND2_PET_IDS.BABY_TURTE, weight: 0.05 },       // 0.050%
    { petId: ISLAND2_PET_IDS.BABY_SEAL, weight: 0.001 },       // 0.001%
  ],
  [ISLAND2_EGG_TYPE.SHIPWRECK]: [
    { petId: ISLAND2_PET_IDS.BABY_CORALCLAD, weight: 64.269 },  // 64.269%
    { petId: ISLAND2_PET_IDS.BABY_GIGGLECRAB, weight: 30.00 },  // 30.000%
    { petId: ISLAND2_PET_IDS.BABY_SKIFFLET, weight: 5.00 },     // 5.000%
    { petId: ISLAND2_PET_IDS.BABY_EMBERFIN, weight: 0.70 },     // 0.700%
    { petId: ISLAND2_PET_IDS.BABY_NEONKELP, weight: 0.03 },     // 0.030%
    { petId: ISLAND2_PET_IDS.BABY_PEARLMAW, weight: 0.001 },    // 0.001%
  ],
};

/**
 * Get Island 2 egg loot table
 */
export function getIsland2EggLootTable(eggType: ISLAND2_EGG_TYPE): Island2EggLootEntry[] {
  return ISLAND2_EGG_LOOT_TABLES[eggType];
}

/**
 * Roll a random pet ID from an Island 2 egg
 */
export function rollIsland2PetId(eggType: ISLAND2_EGG_TYPE, rng: () => number = Math.random): PetId {
  const table = getIsland2EggLootTable(eggType);
  if (!table || table.length === 0) {
    // Fallback: should never happen, but avoid crashing
    return ISLAND2_PET_IDS.BABY_SANDRAY;
  }

  let totalWeight = 0;
  for (const entry of table) {
    if (entry.weight > 0) totalWeight += entry.weight;
  }

  if (totalWeight <= 0) {
    return table[0].petId;
  }

  let roll = rng() * totalWeight;
  for (const entry of table) {
    if (entry.weight <= 0) continue;
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.petId;
    }
  }

  return table[table.length - 1].petId;
}
