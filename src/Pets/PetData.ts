/**
 * Pet System - Data Types
 *
 * Pets are collectible items that provide a training power multiplier when equipped.
 * Persistence stores pets by their string PetId.
 */

export enum PetRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum EggType {
  // World 1 (Island 1) Eggs
  STONE = 'stone',
  GEM = 'gem',
  CRYSTAL = 'crystal',
  
  // World 2 (Island 2 / Beach World) Eggs
  ABYSSAL = 'abyssal',
  BOARDWALK = 'boardwalk',
  SHIPWRECK = 'shipwreck',

  // World 3 (Island 3 / Volcanic World) Eggs
  SAND = 'sand',
  SNOW = 'snow',
  LAVA = 'lava',
}

/**
 * Stable identifier for a pet. This string is persisted in player saves.
 */
export type PetId = string;

export interface PetDefinition {
  id: PetId;
  name: string;
  eggType: EggType;
  rarity: PetRarity;
  /** Positive whole number multiplier contribution (stacked by summing across equipped pets). */
  multiplier: number;
}

export interface EggDefinition {
  eggType: EggType;
  /** Cost in gold per hatch */
  costGold: number;
}


