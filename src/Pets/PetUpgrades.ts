/**
 * Pet System - Upgrade Tiers
 *
 * Supports crafting upgrades:
 * Normal (tier 0) -> Large (tier 1) -> Huge (tier 2) -> Giga (tier 3 / MAX)
 *
 * Upgraded pets are persisted by encoding the tier as a suffix on the base PetId:
 *   <basePetId>__large | __huge | __giga
 *
 * Example:
 *   baby_lava_deer -> baby_lava_deer__large -> baby_lava_deer__huge -> baby_lava_deer__giga
 */

import type { PetDefinition, PetId } from './PetData';

export type PetTier = 0 | 1 | 2 | 3;

export const PET_MAX_TIER: PetTier = 3;

export const PET_TIER_SUFFIX: Record<PetTier, string> = {
  0: '',
  1: '__large',
  2: '__huge',
  3: '__giga',
};

export const PET_TIER_LABEL: Record<PetTier, 'Normal' | 'Large' | 'Huge' | 'Giga'> = {
  0: 'Normal',
  1: 'Large',
  2: 'Huge',
  3: 'Giga',
};

export const PET_TIER_MULTIPLIER_FACTOR: Record<PetTier, number> = {
  0: 1,
  1: 1.25,
  2: 1.5,
  3: 2,
};

export function getPetTierFromPetId(petId: PetId): PetTier | null {
  if (typeof petId !== 'string' || petId.length === 0) return null;
  if (petId.endsWith(PET_TIER_SUFFIX[3])) return 3;
  if (petId.endsWith(PET_TIER_SUFFIX[2])) return 2;
  if (petId.endsWith(PET_TIER_SUFFIX[1])) return 1;
  return 0;
}

export function getBasePetIdFromAnyPetId(petId: PetId): PetId {
  const tier = getPetTierFromPetId(petId);
  if (tier === null || tier === 0) return petId;
  const suffix = PET_TIER_SUFFIX[tier];
  return petId.slice(0, -suffix.length);
}

export function makeUpgradedPetId(basePetId: PetId, tier: PetTier): PetId {
  return `${basePetId}${PET_TIER_SUFFIX[tier]}`;
}

export function getNextPetTier(tier: PetTier): PetTier | null {
  if (tier >= PET_MAX_TIER) return null;
  return (tier + 1) as PetTier;
}

export function getStarsForTier(tier: PetTier): number {
  return tier; // tier 0 => 0 stars, tier 3 => 3 stars
}

export function getUpgradedPetName(baseName: string, tier: PetTier): string {
  if (tier === 0) return baseName;
  const prefix = PET_TIER_LABEL[tier];
  // Replace leading "Baby " with "<Tier> "
  if (/^baby\s+/i.test(baseName)) {
    return baseName.replace(/^baby\s+/i, `${prefix} `);
  }
  return `${prefix} ${baseName}`;
}

export function getUpgradedPetMultiplier(baseMultiplier: number, tier: PetTier): number {
  const factor = PET_TIER_MULTIPLIER_FACTOR[tier] ?? 1;
  // Keep a stable numeric representation without excessive floating noise.
  return Math.round(baseMultiplier * factor * 100) / 100;
}

export function deriveUpgradedPetDefinition(baseDef: PetDefinition, tier: PetTier): PetDefinition {
  return {
    ...baseDef,
    id: makeUpgradedPetId(baseDef.id, tier),
    name: getUpgradedPetName(baseDef.name, tier),
    multiplier: getUpgradedPetMultiplier(baseDef.multiplier, tier),
  };
}

