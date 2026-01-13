/**
 * Pet System - Static Database + Egg Loot Tables
 * 
 * Contains pets from both World 1 (Island 1) and World 2 (Island 2 / Beach World)
 */

import { EggType, PetRarity, type EggDefinition, type PetDefinition, type PetId } from './PetData';

export const PET_INVENTORY_CAPACITY = 50;
export const PET_EQUIP_CAPACITY = 8;

export const EGG_DEFINITIONS: Record<EggType, EggDefinition> = {
  // World 1 (Island 1) Eggs
  [EggType.STONE]: { eggType: EggType.STONE, costGold: 10 },
  [EggType.GEM]: { eggType: EggType.GEM, costGold: 100 },
  [EggType.CRYSTAL]: { eggType: EggType.CRYSTAL, costGold: 2500 },
  
  // World 2 (Island 2 / Beach World) Eggs
  [EggType.ABYSSAL]: { eggType: EggType.ABYSSAL, costGold: 100000 },
  [EggType.BOARDWALK]: { eggType: EggType.BOARDWALK, costGold: 250000000 },
  [EggType.SHIPWRECK]: { eggType: EggType.SHIPWRECK, costGold: 1000000000 },
};

// Stable pet IDs (persisted)
export const PET_IDS = {
  // World 1 (Island 1) - Stone Egg
  STONE_SPRITE: 'stone_sprite',
  COAL_COMPANION: 'coal_companion',
  PEBBLE_PAL: 'pebble_pal',
  ROCK_RASCAL: 'rock_rascal',

  // World 1 (Island 1) - Gem Egg
  QUARTZ_QUILL: 'quartz_quill',
  EMERALD_EYE: 'emerald_eye',
  RUBY_RUNNER: 'ruby_runner',
  SAPPHIRE_SPARK: 'sapphire_spark',
  DIAMOND_DAZZLE: 'diamond_dazzle',

  // World 1 (Island 1) - Crystal Egg
  AMETHYST_AURA: 'amethyst_aura',
  TOPAZ_TRACER: 'topaz_tracer',
  OPAL_ORB: 'opal_orb',
  PEARL_PALADIN: 'pearl_paladin',
  PRISM_PROTECTOR: 'prism_protector',
  LEGENDARY_LUSTER: 'legendary_luster',

  // World 2 (Island 2 / Beach World) - Abyssal Egg
  BABY_SANDRAY: 'baby_sandray',
  BABY_TIDEPUP: 'baby_tidepup',
  BABY_REEFWING: 'baby_reefwing',
  BABY_KRAKLING: 'baby_krakling',
  BABY_GHOSTGULL: 'baby_ghostgull',

  // World 2 (Island 2 / Beach World) - Boardwalk Egg
  LIFEGUARD: 'lifeguard',
  BABY_TRISHELL: 'baby_trishell',
  BABY_ROCKHERON: 'baby_rockheron',
  BABY_MADMARINER: 'baby_madmariner',
  BABY_TURTE: 'baby_turte',
  BABY_SEAL: 'baby_seal',

  // World 2 (Island 2 / Beach World) - Shipwreck Egg
  BABY_CORALCLAD: 'baby_coralclad',
  BABY_GIGGLECRAB: 'baby_gigglecrab',
  BABY_SKIFFLET: 'baby_skifflet',
  BABY_EMBERFIN: 'baby_emberfin',
  BABY_NEONKELP: 'baby_neonkelp',
  BABY_PEARLMAW: 'baby_pearlmaw',
} as const satisfies Record<string, PetId>;

const PET_DEFINITIONS_ARRAY: PetDefinition[] = [
  // World 1 (Island 1) - Stone Egg
  { id: PET_IDS.STONE_SPRITE, name: 'Stone Sprite', eggType: EggType.STONE, rarity: PetRarity.COMMON, multiplier: 2 },
  { id: PET_IDS.COAL_COMPANION, name: 'Coal Companion', eggType: EggType.STONE, rarity: PetRarity.COMMON, multiplier: 2 },
  { id: PET_IDS.PEBBLE_PAL, name: 'Pebble Pal', eggType: EggType.STONE, rarity: PetRarity.COMMON, multiplier: 2 },
  { id: PET_IDS.ROCK_RASCAL, name: 'Rock Rascal', eggType: EggType.STONE, rarity: PetRarity.RARE, multiplier: 4 },

  // World 1 (Island 1) - Gem Egg
  { id: PET_IDS.QUARTZ_QUILL, name: 'Quartz Quill', eggType: EggType.GEM, rarity: PetRarity.COMMON, multiplier: 5 },
  { id: PET_IDS.EMERALD_EYE, name: 'Emerald Eye', eggType: EggType.GEM, rarity: PetRarity.RARE, multiplier: 8 },
  { id: PET_IDS.RUBY_RUNNER, name: 'Ruby Runner', eggType: EggType.GEM, rarity: PetRarity.EPIC, multiplier: 12 },
  { id: PET_IDS.SAPPHIRE_SPARK, name: 'Sapphire Spark', eggType: EggType.GEM, rarity: PetRarity.EPIC, multiplier: 20 },
  { id: PET_IDS.DIAMOND_DAZZLE, name: 'Diamond Dazzle', eggType: EggType.GEM, rarity: PetRarity.LEGENDARY, multiplier: 40 },

  // World 1 (Island 1) - Crystal Egg
  { id: PET_IDS.AMETHYST_AURA, name: 'Amethyst Aura', eggType: EggType.CRYSTAL, rarity: PetRarity.COMMON, multiplier: 15 },
  { id: PET_IDS.TOPAZ_TRACER, name: 'Topaz Tracer', eggType: EggType.CRYSTAL, rarity: PetRarity.RARE, multiplier: 25 },
  { id: PET_IDS.OPAL_ORB, name: 'Opal Orb', eggType: EggType.CRYSTAL, rarity: PetRarity.EPIC, multiplier: 35 },
  { id: PET_IDS.PEARL_PALADIN, name: 'Pearl Paladin', eggType: EggType.CRYSTAL, rarity: PetRarity.EPIC, multiplier: 50 },
  { id: PET_IDS.PRISM_PROTECTOR, name: 'Prism Protector', eggType: EggType.CRYSTAL, rarity: PetRarity.LEGENDARY, multiplier: 100 },
  { id: PET_IDS.LEGENDARY_LUSTER, name: 'Legendary Luster', eggType: EggType.CRYSTAL, rarity: PetRarity.LEGENDARY, multiplier: 250 },

  // World 2 (Island 2 / Beach World) - Abyssal Egg
  { id: PET_IDS.BABY_SANDRAY, name: 'Baby Sandray', eggType: EggType.ABYSSAL, rarity: PetRarity.COMMON, multiplier: 55 },
  { id: PET_IDS.BABY_TIDEPUP, name: 'Baby Tidepup', eggType: EggType.ABYSSAL, rarity: PetRarity.COMMON, multiplier: 80 },
  { id: PET_IDS.BABY_REEFWING, name: 'Baby Reefwing', eggType: EggType.ABYSSAL, rarity: PetRarity.RARE, multiplier: 300 },
  { id: PET_IDS.BABY_KRAKLING, name: 'Baby Krakling', eggType: EggType.ABYSSAL, rarity: PetRarity.EPIC, multiplier: 650 },
  { id: PET_IDS.BABY_GHOSTGULL, name: 'Baby Ghostgull', eggType: EggType.ABYSSAL, rarity: PetRarity.LEGENDARY, multiplier: 1500 },

  // World 2 (Island 2 / Beach World) - Boardwalk Egg
  { id: PET_IDS.LIFEGUARD, name: 'Lifeguard', eggType: EggType.BOARDWALK, rarity: PetRarity.COMMON, multiplier: 250 },
  { id: PET_IDS.BABY_TRISHELL, name: 'Baby TriShell', eggType: EggType.BOARDWALK, rarity: PetRarity.COMMON, multiplier: 450 },
  { id: PET_IDS.BABY_ROCKHERON, name: 'Baby Rockheron', eggType: EggType.BOARDWALK, rarity: PetRarity.RARE, multiplier: 1000 },
  { id: PET_IDS.BABY_MADMARINER, name: 'Baby MadMariner', eggType: EggType.BOARDWALK, rarity: PetRarity.EPIC, multiplier: 3000 },
  { id: PET_IDS.BABY_TURTE, name: 'Baby Turte', eggType: EggType.BOARDWALK, rarity: PetRarity.EPIC, multiplier: 10000 },
  { id: PET_IDS.BABY_SEAL, name: 'Baby Seal', eggType: EggType.BOARDWALK, rarity: PetRarity.LEGENDARY, multiplier: 17500 },

  // World 2 (Island 2 / Beach World) - Shipwreck Egg
  { id: PET_IDS.BABY_CORALCLAD, name: 'Baby Coralclad', eggType: EggType.SHIPWRECK, rarity: PetRarity.COMMON, multiplier: 100 },
  { id: PET_IDS.BABY_GIGGLECRAB, name: 'Baby Gigglecrab', eggType: EggType.SHIPWRECK, rarity: PetRarity.COMMON, multiplier: 175 },
  { id: PET_IDS.BABY_SKIFFLET, name: 'Baby Skifflet', eggType: EggType.SHIPWRECK, rarity: PetRarity.RARE, multiplier: 500 },
  { id: PET_IDS.BABY_EMBERFIN, name: 'Baby Emberfin', eggType: EggType.SHIPWRECK, rarity: PetRarity.EPIC, multiplier: 1500 },
  { id: PET_IDS.BABY_NEONKELP, name: 'Baby Neonkelp', eggType: EggType.SHIPWRECK, rarity: PetRarity.EPIC, multiplier: 2800 },
  { id: PET_IDS.BABY_PEARLMAW, name: 'Baby Pearlmaw', eggType: EggType.SHIPWRECK, rarity: PetRarity.LEGENDARY, multiplier: 6500 },
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
  // World 1 (Island 1) Eggs
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
  
  // World 2 (Island 2 / Beach World) Eggs
  [EggType.ABYSSAL]: [
    { petId: PET_IDS.BABY_SANDRAY, weight: 63.27 }, // 63.270%
    { petId: PET_IDS.BABY_TIDEPUP, weight: 30.0 }, // 30.000%
    { petId: PET_IDS.BABY_REEFWING, weight: 6.0 }, // 6.000%
    { petId: PET_IDS.BABY_KRAKLING, weight: 0.7 }, // 0.700%
    { petId: PET_IDS.BABY_GHOSTGULL, weight: 0.04 }, // 0.040%
  ],
  [EggType.BOARDWALK]: [
    { petId: PET_IDS.LIFEGUARD, weight: 70.449 }, // 70.449%
    { petId: PET_IDS.BABY_TRISHELL, weight: 25.0 }, // 25.000%
    { petId: PET_IDS.BABY_ROCKHERON, weight: 4.0 }, // 4.000%
    { petId: PET_IDS.BABY_MADMARINER, weight: 0.5 }, // 0.500%
    { petId: PET_IDS.BABY_TURTE, weight: 0.05 }, // 0.050%
    { petId: PET_IDS.BABY_SEAL, weight: 0.001 }, // 0.001%
  ],
  [EggType.SHIPWRECK]: [
    { petId: PET_IDS.BABY_CORALCLAD, weight: 64.269 }, // 64.269%
    { petId: PET_IDS.BABY_GIGGLECRAB, weight: 30.0 }, // 30.000%
    { petId: PET_IDS.BABY_SKIFFLET, weight: 5.0 }, // 5.000%
    { petId: PET_IDS.BABY_EMBERFIN, weight: 0.7 }, // 0.700%
    { petId: PET_IDS.BABY_NEONKELP, weight: 0.03 }, // 0.030%
    { petId: PET_IDS.BABY_PEARLMAW, weight: 0.001 }, // 0.001%
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


