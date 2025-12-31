/**
 * Pet System - Static Database + Egg Loot Tables
 */

import { EggType, PetRarity, type EggDefinition, type PetDefinition, type PetId } from './PetData';

export const PET_INVENTORY_CAPACITY = 50;
export const PET_EQUIP_CAPACITY = 8;

export const EGG_DEFINITIONS: Record<EggType, EggDefinition> = {
  [EggType.STONE]: { eggType: EggType.STONE, costGold: 10 },
  [EggType.GEM]: { eggType: EggType.GEM, costGold: 100 },
  [EggType.CRYSTAL]: { eggType: EggType.CRYSTAL, costGold: 2500 },
};

// Stable pet IDs (persisted)
export const PET_IDS = {
  // Stone Egg
  STONE_SPRITE: 'stone_sprite',
  COAL_COMPANION: 'coal_companion',
  PEBBLE_PAL: 'pebble_pal',
  ROCK_RASCAL: 'rock_rascal',

  // Gem Egg
  QUARTZ_QUILL: 'quartz_quill',
  EMERALD_EYE: 'emerald_eye',
  RUBY_RUNNER: 'ruby_runner',
  SAPPHIRE_SPARK: 'sapphire_spark',
  DIAMOND_DAZZLE: 'diamond_dazzle',

  // Crystal Egg
  AMETHYST_AURA: 'amethyst_aura',
  TOPAZ_TRACER: 'topaz_tracer',
  OPAL_ORB: 'opal_orb',
  PEARL_PALADIN: 'pearl_paladin',
  PRISM_PROTECTOR: 'prism_protector',
  LEGENDARY_LUSTER: 'legendary_luster',
} as const satisfies Record<string, PetId>;

const PET_DEFINITIONS_ARRAY: PetDefinition[] = [
  // Stone Egg
  { id: PET_IDS.STONE_SPRITE, name: 'Stone Sprite', eggType: EggType.STONE, rarity: PetRarity.COMMON, multiplier: 2 },
  { id: PET_IDS.COAL_COMPANION, name: 'Coal Companion', eggType: EggType.STONE, rarity: PetRarity.COMMON, multiplier: 2 },
  { id: PET_IDS.PEBBLE_PAL, name: 'Pebble Pal', eggType: EggType.STONE, rarity: PetRarity.COMMON, multiplier: 2 },
  { id: PET_IDS.ROCK_RASCAL, name: 'Rock Rascal', eggType: EggType.STONE, rarity: PetRarity.RARE, multiplier: 4 },

  // Gem Egg
  { id: PET_IDS.QUARTZ_QUILL, name: 'Quartz Quill', eggType: EggType.GEM, rarity: PetRarity.COMMON, multiplier: 5 },
  { id: PET_IDS.EMERALD_EYE, name: 'Emerald Eye', eggType: EggType.GEM, rarity: PetRarity.RARE, multiplier: 8 },
  { id: PET_IDS.RUBY_RUNNER, name: 'Ruby Runner', eggType: EggType.GEM, rarity: PetRarity.EPIC, multiplier: 12 },
  { id: PET_IDS.SAPPHIRE_SPARK, name: 'Sapphire Spark', eggType: EggType.GEM, rarity: PetRarity.EPIC, multiplier: 20 },
  { id: PET_IDS.DIAMOND_DAZZLE, name: 'Diamond Dazzle', eggType: EggType.GEM, rarity: PetRarity.LEGENDARY, multiplier: 40 },

  // Crystal Egg
  { id: PET_IDS.AMETHYST_AURA, name: 'Amethyst Aura', eggType: EggType.CRYSTAL, rarity: PetRarity.COMMON, multiplier: 15 },
  { id: PET_IDS.TOPAZ_TRACER, name: 'Topaz Tracer', eggType: EggType.CRYSTAL, rarity: PetRarity.RARE, multiplier: 25 },
  { id: PET_IDS.OPAL_ORB, name: 'Opal Orb', eggType: EggType.CRYSTAL, rarity: PetRarity.EPIC, multiplier: 35 },
  { id: PET_IDS.PEARL_PALADIN, name: 'Pearl Paladin', eggType: EggType.CRYSTAL, rarity: PetRarity.EPIC, multiplier: 50 },
  { id: PET_IDS.PRISM_PROTECTOR, name: 'Prism Protector', eggType: EggType.CRYSTAL, rarity: PetRarity.LEGENDARY, multiplier: 100 },
  { id: PET_IDS.LEGENDARY_LUSTER, name: 'Legendary Luster', eggType: EggType.CRYSTAL, rarity: PetRarity.LEGENDARY, multiplier: 250 },
];

export const PET_DEFINITIONS: Record<PetId, PetDefinition> = Object.fromEntries(
  PET_DEFINITIONS_ARRAY.map((p) => [p.id, p])
) as Record<PetId, PetDefinition>;

export function getPetDefinition(petId: PetId): PetDefinition | undefined {
  return PET_DEFINITIONS[petId];
}

export function isPetId(value: unknown): value is PetId {
  return typeof value === 'string' && value in PET_DEFINITIONS;
}

export type EggLootEntry = { petId: PetId; weight: number };

/**
 * Loot weights are derived directly from your design doc probabilities.
 * They do NOT need to sum to 1; they are treated as relative weights.
 */
export const EGG_LOOT_TABLES: Record<EggType, EggLootEntry[]> = {
  [EggType.STONE]: [
    { petId: PET_IDS.STONE_SPRITE, weight: 0.3 },
    { petId: PET_IDS.COAL_COMPANION, weight: 0.4 },
    { petId: PET_IDS.PEBBLE_PAL, weight: 0.2 },
    { petId: PET_IDS.ROCK_RASCAL, weight: 0.1 },
  ],
  [EggType.GEM]: [
    { petId: PET_IDS.QUARTZ_QUILL, weight: 0.45 },
    { petId: PET_IDS.EMERALD_EYE, weight: 0.3 },
    { petId: PET_IDS.RUBY_RUNNER, weight: 0.15 },
    { petId: PET_IDS.SAPPHIRE_SPARK, weight: 0.08 },
    { petId: PET_IDS.DIAMOND_DAZZLE, weight: 0.02 },
  ],
  [EggType.CRYSTAL]: [
    { petId: PET_IDS.AMETHYST_AURA, weight: 0.435 },
    { petId: PET_IDS.TOPAZ_TRACER, weight: 0.3 },
    { petId: PET_IDS.OPAL_ORB, weight: 0.15 },
    { petId: PET_IDS.PEARL_PALADIN, weight: 0.08 },
    { petId: PET_IDS.PRISM_PROTECTOR, weight: 0.03 },
    { petId: PET_IDS.LEGENDARY_LUSTER, weight: 0.005 },
  ],
};

export function getEggLootTable(eggType: EggType): EggLootEntry[] {
  return EGG_LOOT_TABLES[eggType];
}

export function rollPetId(eggType: EggType, rng: () => number = Math.random): PetId {
  const table = getEggLootTable(eggType);
  if (!table || table.length === 0) {
    // Fallback: should never happen, but avoid crashing the game loop.
    return PET_IDS.STONE_SPRITE;
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


