/**
 * Pet Visual Manager
 *
 * Spawns and manages equipped pet entities that follow the player dynamically.
 * Uses MiningPetEntity for realistic walking behavior instead of parenting.
 */

import { World, Player, WorldEvent } from 'hytopia';
import type { PetId } from './PetData';
import { MiningPetEntity } from './MiningPetEntity';

export class PetVisualManager {
  private world: World;
  private playerPetEntities: Map<Player, MiningPetEntity[]> = new Map();
  private tickHandler: ((payload: { tickDeltaMs: number }) => void) | null = null;

  constructor(world: World) {
    this.world = world;
  }

  /**
   * Sync the equipped pets for a player
   * Despawns old pets and spawns new ones based on the equipped pet list
   */
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
    const totalPets = petIds.length;

    const spawned: MiningPetEntity[] = [];

    petIds.forEach((petId, idx) => {
      try {
        const petEntity = new MiningPetEntity({
          petId,
          ownerId: player.id,
          slotIndex: idx,
          totalPets,
        });

        // Spawn pet near the player
        const spawnPosition = {
          x: playerEntity.position.x + 1 + idx * 0.5,
          y: playerEntity.position.y + 0.5,
          z: playerEntity.position.z + 2,
        };

        petEntity.spawn(this.world, spawnPosition);
        spawned.push(petEntity);
      } catch (err) {
        console.warn(`[PetVisualManager] Failed to spawn pet ${petId}:`, err);
      }
    });

    this.playerPetEntities.set(player, spawned);
  }

  /**
   * Clean up pets for a disconnecting player
   */
  cleanupPlayer(player: Player): void {
    this.clearPlayerPets(player);
  }

  /**
   * Clear all pets for a player
   */
  private clearPlayerPets(player: Player): void {
    const existing = this.playerPetEntities.get(player);
    if (existing) {
      existing.forEach(entity => {
        try {
          if (entity.isSpawned) {
            entity.despawn();
          }
        } catch (err) {
          // Ignore despawn errors
        }
      });
      this.playerPetEntities.delete(player);
    }
  }

  /**
   * Get all pet entities for a player
   */
  getPlayerPets(player: Player): MiningPetEntity[] {
    return this.playerPetEntities.get(player) || [];
  }

  /**
   * Update formation for all pets when a pet is added/removed
   */
  private updateFormation(player: Player): void {
    const pets = this.playerPetEntities.get(player);
    if (!pets) return;

    const totalPets = pets.length;
    pets.forEach((pet, idx) => {
      pet.updateFormation(idx, totalPets);
    });
  }

  /**
   * Cleanup all pets (for shutdown)
   */
  cleanup(): void {
    for (const player of this.playerPetEntities.keys()) {
      this.clearPlayerPets(player);
    }
  }
}
