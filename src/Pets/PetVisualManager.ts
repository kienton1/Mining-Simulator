/**
 * Pet Visual Manager
 *
 * Spawns and attaches equipped pet models to follow the player.
 */

import { World, Player, Entity, RigidBodyType, ModelRegistry } from 'hytopia';
import type { PetId } from './PetData';
import { getPetModelUri, getPetTextureUri } from './PetVisuals';

const PET_MODEL_SCALE = 0.35;
const PET_FOLLOW_HEIGHT = -.73;
const PET_FOLLOW_DISTANCE = 1.4;
const PET_ROW_SPACING = 0.75;
const PET_COL_SPACING = 0.55;

export class PetVisualManager {
  private world: World;
  private playerPetEntities: Map<Player, Entity[]> = new Map();

  constructor(world: World) {
    this.world = world;
  }

  syncEquippedPets(player: Player, petIds: PetId[]): void {
    this.clearPlayerPets(player);

    if (!Array.isArray(petIds) || petIds.length === 0) {
      return;
    }

    const playerEntities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
    if (playerEntities.length === 0) {
      return;
    }
    const playerEntity = playerEntities[0];

    const offsets = this.getFormationOffsets(petIds.length);
    const spawned: Entity[] = [];

    petIds.forEach((petId, idx) => {
      const modelUri = getPetModelUri(petId);
      if (!modelUri) {
        return;
      }

      const textureUri = getPetTextureUri(petId);
      const entityOptions: any = {
        name: `Pet ${petId}`,
        modelUri,
        modelScale: PET_MODEL_SCALE,
        tag: 'pet',
        rigidBodyOptions: {
          type: RigidBodyType.KINEMATIC_VELOCITY,
        },
      };

      try {
        const animationNames = ModelRegistry.instance.getAnimationNames(modelUri);
        if (Array.isArray(animationNames) && animationNames.length > 0) {
          entityOptions.modelLoopedAnimations = [animationNames[0]];
        }
      } catch (err) {
        // Ignore animation lookup errors and spawn without looping animations.
      }

      if (textureUri) {
        entityOptions.modelTextureUri = textureUri;
      }

      const entity = new Entity(entityOptions);
      const fallbackPosition = {
        x: playerEntity.position.x + 1,
        y: playerEntity.position.y + 1,
        z: playerEntity.position.z + 1,
      };
      entity.spawn(this.world, fallbackPosition);
      spawned.push(entity);

      const offset = offsets[idx] || { x: 0, y: PET_FOLLOW_HEIGHT, z: PET_FOLLOW_DISTANCE };

      setTimeout(() => {
        try {
          entity.setParent(
            playerEntity,
            undefined,
            offset,
            { x: 0, y: 0, z: 0, w: 1 }
          );
        } catch (err) {
          // If parenting fails, leave entity at its spawned location.
        }
      }, 50);
    });

    this.playerPetEntities.set(player, spawned);
  }

  cleanupPlayer(player: Player): void {
    this.clearPlayerPets(player);
  }

  private clearPlayerPets(player: Player): void {
    const existing = this.playerPetEntities.get(player);
    if (existing) {
      existing.forEach(entity => entity.despawn());
      this.playerPetEntities.delete(player);
    }
  }

  private getFormationOffsets(count: number): Array<{ x: number; y: number; z: number }> {
    const offsets: Array<{ x: number; y: number; z: number }> = [];
    if (count <= 0) return offsets;

    if (count === 1) {
      return [{ x: 0, y: PET_FOLLOW_HEIGHT, z: PET_FOLLOW_DISTANCE }];
    }

    const frontCount = Math.max(1, Math.floor(count / 2));
    const backCount = count - frontCount;

    const addRow = (rowCount: number, rowIndex: number) => {
      if (rowCount <= 0) return;
      const center = (rowCount - 1) / 2;
      for (let i = 0; i < rowCount; i++) {
        const offsetX = (i - center) * PET_COL_SPACING;
        offsets.push({
          x: offsetX,
          y: PET_FOLLOW_HEIGHT,
          z: PET_FOLLOW_DISTANCE + (rowIndex * PET_ROW_SPACING),
        });
      }
    };

    // Two rows max: front row (closer), back row (farther).
    addRow(frontCount, 0);
    addRow(backCount, 1);

    return offsets;
  }
}
