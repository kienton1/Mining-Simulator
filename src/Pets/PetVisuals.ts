/**
 * Pet visual asset helpers.
 * Maps pet IDs to their model + texture locations under assets/models/Pets.
 */

import type { PetId } from './PetData';
import { PET_IDS } from './PetDatabase';

export type PetModelInfo = {
  modelFolder: string;
  gltfFile: string;
  textureFile: string;
  /** Optional direct model path under assets (bypasses models/Pets). */
  modelPath?: string;
  /** Optional direct texture path under assets (bypasses models/Pets/.../Textures). */
  texturePath?: string;
};

const PET_MODEL_MAP: Record<PetId, PetModelInfo> = {
  [PET_IDS.AMETHYST_AURA]: { modelFolder: 'Chicken', gltfFile: 'chicken.gltf', textureFile: 'AMETHYST_AURA.png' },
  [PET_IDS.BABY_BREEZY_FOX]: { modelFolder: 'Fox', gltfFile: 'fox.gltf', textureFile: 'BABY_BREEZY_FOX.png' },
  [PET_IDS.BABY_CORALCLAD]: { modelFolder: 'Sturgeon', gltfFile: 'sturgeon.gltf', textureFile: 'BABY_CORALCLAD.png' },
  [PET_IDS.BABY_DESERTFISH]: { modelFolder: 'BlueTang', gltfFile: 'blue-tang.gltf', textureFile: 'BABY_DESERTFISH.png' },
  [PET_IDS.BABY_DESERT_KING]: { modelFolder: 'Chicken', gltfFile: 'chicken.gltf', textureFile: 'BABY_DESERT_KING.png' },
  [PET_IDS.BABY_EMBERFIN]: { modelFolder: 'Tuna', gltfFile: 'tuna.gltf', textureFile: 'BABY_EMBERFIN.png' },
  [PET_IDS.BABY_FIERY_ZOMBIE]: { modelFolder: 'Zombie', gltfFile: 'zombie-ice.gltf', textureFile: 'BABY_FIERY_ZOMBIE.png' },
  [PET_IDS.BABY_FLAME_HORSE]: { modelFolder: 'Horse', gltfFile: 'horse.gltf', textureFile: 'BABY_FLAME_HORSE.png' },
  [PET_IDS.BABY_FROST_SPIDER]: { modelFolder: 'Spider', gltfFile: 'spider.gltf', textureFile: 'BABY_FROST_SPIDER.png' },
  [PET_IDS.BABY_GHOSTGULL]: { modelFolder: 'Clownfish', gltfFile: 'clownfish.gltf', textureFile: 'BABY_GHOSTGULL.png' },
  [PET_IDS.BABY_GIGGLECRAB]: { modelFolder: 'Crab', gltfFile: 'crab.gltf', textureFile: 'BABY_GIGGLECRAB.png' },
  [PET_IDS.BABY_KRAKLING]: { modelFolder: 'Squid', gltfFile: 'squid.gltf', textureFile: 'BABY_KRAKLING.png' },
  [PET_IDS.BABY_LAVA_DEER]: { modelFolder: 'Deer', gltfFile: 'deer.gltf', textureFile: 'BABY_LAVA_DEER.png' },
  [PET_IDS.BABY_MADMARINER]: { modelFolder: 'Pike', gltfFile: 'pike.gltf', textureFile: 'BABY_MADMARINER.png' },
  [PET_IDS.BABY_MEERKAT]: { modelFolder: 'Beaver', gltfFile: 'beaver.gltf', textureFile: 'BABY_MEERKAT.png' },
  [PET_IDS.BABY_NEONKELP]: { modelFolder: 'Pufferfish', gltfFile: 'pufferfish.gltf', textureFile: 'BABY_NEONKELP.png' },
  [PET_IDS.BABY_PEARLMAW]: { modelFolder: 'Lionfish', gltfFile: 'lionfish.gltf', textureFile: 'BABY_PEARLMAW.png' },
  [PET_IDS.BABY_PENGUIN]: { modelFolder: 'Penguin', gltfFile: 'penguin.gltf', textureFile: 'BABY_PENGUIN.png' },
  [PET_IDS.BABY_PHOENIX]: { modelFolder: 'Bee', gltfFile: 'bee-adult.gltf', textureFile: 'BABY_PHOENIX.png' },
  [PET_IDS.BABY_POLARBEAR]: { modelFolder: 'Bear', gltfFile: 'bear.gltf', textureFile: 'BABY_POLARBEAR.png' },
  [PET_IDS.BABY_REEFWING]: { modelFolder: 'FlyingFish', gltfFile: 'flying-fish.gltf', textureFile: 'BABY_REEFWING.png' },
  [PET_IDS.BABY_ROCKHERON]: { modelFolder: 'AnglerFish', gltfFile: 'anglerfish.gltf', textureFile: 'BABY_ROCKHERON.png' },
  [PET_IDS.BABY_SANDDOG]: { modelFolder: 'Dog', gltfFile: 'Dog.gltf', textureFile: 'BABY_SANDDOG.png' },
  [PET_IDS.BABY_SANDRAY]: { modelFolder: 'Perch', gltfFile: 'perch.gltf', textureFile: 'BABY_SANDRAY.png' },
  [PET_IDS.BABY_SCORCHING_MAGMA]: { modelFolder: 'Wolf', gltfFile: 'wolf.gltf', textureFile: 'BABY_SCORCHING_MAGMA.png' },
  [PET_IDS.BABY_SCORPIAN]: { modelFolder: 'Crab', gltfFile: 'crab.gltf', textureFile: 'BABY_SCORPIAN.png' },
  [PET_IDS.BABY_SKIFFLET]: { modelFolder: 'Swordfish', gltfFile: 'swordfish.gltf', textureFile: 'BABY_SKIFFLET.png' },
  [PET_IDS.BABY_SLICED_MAGMA]: { modelFolder: 'Capybara', gltfFile: 'capybara.gltf', textureFile: 'BABY_SLICED_MAGMA.png' },
  [PET_IDS.BABY_SNAPPER]: { modelFolder: 'Snapper', gltfFile: 'snapper.gltf', textureFile: 'BABY_SNAPPER.png' },
  [PET_IDS.BABY_SNOWDOGGY]: { modelFolder: 'Dog', gltfFile: 'Dog.gltf', textureFile: 'BABY_SNOWDOGGY.png' },
  [PET_IDS.BABY_SNOWHARE]: { modelFolder: 'Rabbit', gltfFile: 'rabbit.gltf', textureFile: 'BABY_SNOWHARE.png' },
  [PET_IDS.BABY_SPHINX_CAT]: { modelFolder: 'Fox', gltfFile: 'fox.gltf', textureFile: 'BABY_SPHINX_CAT.png' },
  [PET_IDS.BABY_TIDEPUP]: { modelFolder: 'Parrotfish', gltfFile: 'parrotfish.gltf', textureFile: 'BABY_TIDEPUP.png' },
  [PET_IDS.BABY_TRISHELL]: { modelFolder: 'Turtle', gltfFile: 'turtle.gltf', textureFile: 'BABY_TRISHELL.png' },
  [PET_IDS.BABY_TURTE]: { modelFolder: 'Turtle', gltfFile: 'turtle.gltf', textureFile: 'BABY_TURTE.png' },
  [PET_IDS.COAL_COMPANION]: { modelFolder: 'Racoon', gltfFile: 'raccoon.gltf', textureFile: 'COAL_COMPANION.png' },
  [PET_IDS.DIAMOND_DAZZLE]: { modelFolder: 'Beaver', gltfFile: 'beaver.gltf', textureFile: 'DIAMOND_DAZZLE.png' },
  [PET_IDS.EMERALD_EYE]: { modelFolder: 'Bee', gltfFile: 'bee-adult.gltf', textureFile: 'EMERALD_EYE.png' },
  [PET_IDS.LEGENDARY_LUSTER]: { modelFolder: 'Spider', gltfFile: 'spider.gltf', textureFile: 'LEGENDARY_LUSTER.png' },
  [PET_IDS.LIFEGUARD]: { modelFolder: 'BlueTang', gltfFile: 'blue-tang.gltf', textureFile: 'LIFEGUARD.png' },
  [PET_IDS.OPAL_ORB]: { modelFolder: 'Crab', gltfFile: 'crab.gltf', textureFile: 'OPAL_ORB.png' },
  [PET_IDS.PEARL_PALADIN]: { modelFolder: 'Pig', gltfFile: 'pig.gltf', textureFile: 'PEARL_PALADIN.png' },
  [PET_IDS.PEBBLE_PAL]: { modelFolder: 'Deer', gltfFile: 'deer.gltf', textureFile: 'PEBBLE_PAL.png' },
  [PET_IDS.PRISM_PROTECTOR]: { modelFolder: 'Wolf', gltfFile: 'wolf.gltf', textureFile: 'PRISM_PROTECTOR.png' },
  [PET_IDS.QUARTZ_QUILL]: { modelFolder: 'Pufferfish', gltfFile: 'pufferfish.gltf', textureFile: 'QUARTZ_QUILL.png' },
  [PET_IDS.ROCK_RASCAL]: { modelFolder: 'Fox', gltfFile: 'fox.gltf', textureFile: 'ROCK_RASCAL.png' },
  [PET_IDS.RUBY_RUNNER]: { modelFolder: 'Rabbit', gltfFile: 'rabbit.gltf', textureFile: 'RUBY_RUNNER.png' },
  [PET_IDS.SAPPHIRE_SPARK]: { modelFolder: 'Catfish', gltfFile: 'catfish.gltf', textureFile: 'SAPPHIRE_SPARK.png' },
  [PET_IDS.STONE_SPRITE]: { modelFolder: 'Dog', gltfFile: 'Dog.gltf', textureFile: 'STONE_SPRITE.png' },
  [PET_IDS.TOPAZ_TRACER]: { modelFolder: 'Cow', gltfFile: 'cow.gltf', textureFile: 'TOPAZ_TRACER.png' },
  [PET_IDS.BLUE_BAT]: {
    modelFolder: 'Bat',
    gltfFile: 'bat.gltf',
    textureFile: 'Blue Bat.png',
    modelPath: 'models/15 Minute Reward Pets/Bat/bat.gltf',
    texturePath: 'models/15 Minute Reward Pets/Bat/Blue Bat.png',
  },
  [PET_IDS.GOLDEN_FLAMINGO]: {
    modelFolder: 'Flamingo',
    gltfFile: 'flamingo.gltf',
    textureFile: 'Golden Flamingo.png',
    modelPath: 'models/15 Minute Reward Pets/Flamingo/flamingo.gltf',
    texturePath: 'models/15 Minute Reward Pets/Flamingo/Golden Flamingo.png',
  },
  [PET_IDS.ANGRY_FROG]: {
    modelFolder: 'Frog',
    gltfFile: 'frog.gltf',
    textureFile: 'Angry Frog.png',
    modelPath: 'models/15 Minute Reward Pets/Frog/frog.gltf',
    texturePath: 'models/15 Minute Reward Pets/Frog/Angry Frog.png',
  },
  [PET_IDS.AQUATIC_LIZARD]: {
    modelFolder: 'Lizard',
    gltfFile: 'lizard.gltf',
    textureFile: 'Aquatic Lizard.png',
    modelPath: 'models/15 Minute Reward Pets/Lizard/lizard.gltf',
    texturePath: 'models/15 Minute Reward Pets/Lizard/Aquatic Lizard.png',
  },
  [PET_IDS.FROSTED_OCELOT]: {
    modelFolder: 'Ocelot',
    gltfFile: 'ocelot.gltf',
    textureFile: 'Frosted Ocelot.png',
    modelPath: 'models/15 Minute Reward Pets/Ocelot/ocelot.gltf',
    texturePath: 'models/15 Minute Reward Pets/Ocelot/Frosted Ocelot.png',
  },
  [PET_IDS.LARRY_THE_SKELETON]: {
    modelFolder: 'Skeleton',
    gltfFile: 'skeleton.gltf',
    textureFile: 'Larry the Skeleton.png',
    modelPath: 'models/15 Minute Reward Pets/Skeleton/skeleton.gltf',
    texturePath: 'models/15 Minute Reward Pets/Skeleton/Larry the Skeleton.png',
  },
};

export function getPetModelInfo(petId: PetId): PetModelInfo | null {
  const info = PET_MODEL_MAP[petId];
  if (!info) {
    return null;
  }
  return info;
}

export function getPetModelUri(petId: PetId): string | null {
  const info = getPetModelInfo(petId);
  if (!info) return null;
  if (info.modelPath) return info.modelPath;
  return `models/Pets/${info.modelFolder}/${info.gltfFile}`;
}

export function getPetTextureUri(petId: PetId): string | null {
  const info = getPetModelInfo(petId);
  if (!info) return null;
  if (info.texturePath) return info.texturePath;
  return `models/Pets/${info.modelFolder}/Textures/${info.textureFile}`;
}

export function getPetImageUri(petId: PetId): string | null {
  return `ui/pets/${petId}.png`;
}
