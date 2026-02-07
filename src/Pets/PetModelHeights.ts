/**
 * Pet Model Heights
 *
 * Maps model folder names to their natural height at scale 1.0.
 * This allows us to calculate proper scaling to achieve uniform pet heights.
 *
 * Heights are estimated based on typical animal proportions.
 * Can be refined later with actual glTF bounding box calculations.
 */

import { TARGET_PET_HEIGHT, PET_DEFAULT_SCALE } from './PetConstants';

/**
 * Natural height of each pet model at scale 1.0 (in game units)
 * These are estimates based on typical animal proportions
 */
export const PET_MODEL_HEIGHTS: Record<string, number> = {
  // Land Animals - heights calibrated for uniform 0.6 target
  'Dog': 1.0,
  'Wolf': 1.2,
  'Fox': 0.9,
  'Bear': 1.6,
  'Deer': 1.4,
  'Horse': 1.8,
  'Cow': 1.8,
  'Pig': 0.8,
  'Rabbit': 0.6,
  'Beaver': 0.7,
  'Racoon': 0.7,
  'Capybara': 0.8,
  'Ocelot': 0.9,

  // Birds & Insects
  'Chicken': 0.7,
  'Penguin': 0.9,
  'Bee': 0.5,
  'Bat': 0.6,
  'Flamingo': 1.6,

  // Aquatic
  'Turtle': 0.6,
  'Crab': 0.5,
  'Squid': 1.0,
  'Lizard': 0.5,
  'Frog': 0.5,

  // Fish - calibrated so they appear similar size to land pets
  'Tuna': 0.8,
  'Pike': 0.7,
  'Sturgeon': 0.8,
  'BlueTang': 0.5,
  'Clownfish': 0.4,
  'Lionfish': 0.6,
  'Pufferfish': 0.9,
  'Parrotfish': 0.6,
  'Perch': 0.5,
  'Swordfish': 0.8,
  'Snapper': 0.6,
  'Catfish': 0.6,
  'AnglerFish': 0.7,
  'FlyingFish': 0.5,

  // Monsters
  'Spider': 0.7,
  'Zombie': 2.2,
  'Skeleton': 1.6,
};

/**
 * Get the natural height of a pet model
 *
 * @param modelFolder - The folder name of the pet model (e.g., 'Dog', 'Bear')
 * @returns Natural height at scale 1.0, or undefined if unknown
 */
export function getModelNaturalHeight(modelFolder: string): number | undefined {
  return PET_MODEL_HEIGHTS[modelFolder];
}

/**
 * Calculate the scale needed to achieve the target pet height
 *
 * @param modelFolder - The folder name of the pet model
 * @returns Scale factor to apply, or default scale if height unknown
 */
export function getModelScaleForHeight(modelFolder: string): number {
  const naturalHeight = PET_MODEL_HEIGHTS[modelFolder];

  if (!naturalHeight) {
    // Unknown model, use default scale
    return PET_DEFAULT_SCALE;
  }

  // Calculate scale to achieve target height
  // scale = targetHeight / naturalHeight
  return TARGET_PET_HEIGHT / naturalHeight;
}

/**
 * Get the expected height of a pet after scaling
 *
 * @param modelFolder - The folder name of the pet model
 * @param scale - The scale being applied
 * @returns Expected height after scaling
 */
export function getScaledPetHeight(modelFolder: string, scale: number): number {
  const naturalHeight = PET_MODEL_HEIGHTS[modelFolder];

  if (!naturalHeight) {
    // Estimate based on scale - assume natural height of 1.0
    return scale;
  }

  return naturalHeight * scale;
}
