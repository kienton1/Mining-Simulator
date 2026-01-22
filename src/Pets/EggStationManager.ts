/**
 * Egg Station Manager
 *
 * Uses fixed world positions (aligned with barrel props in `assets/map.json`)
 * and checks player proximity to open/close the egg station UI.
 *
 * We intentionally do NOT spawn barrel entities here to avoid duplicates.
 */

import { World, Player } from 'hytopia';
import type { GameManager } from '../Core/GameManager';
import { EggType } from './PetData';
import { EGG_DEFINITIONS, getEggLootTable, getPetDefinition, isPetId, PET_EQUIP_CAPACITY, PET_INVENTORY_CAPACITY } from './PetDatabase';

export interface EggStationDefinition {
  id: string;
  eggType: EggType;
  /** Which open-count should be the primary button (e.g. gem station highlights 3). */
  defaultOpenCount: 1 | 3;
  name: string;
  position: { x: number; y: number; z: number };
}

export class EggStationManager {
  private world: World;
  private gameManager: GameManager;
  private proximityRadius: number;
  private trackedPlayers: Set<Player> = new Set();
  private playerStationMap: Map<Player, string | null> = new Map();
  private interval?: NodeJS.Timeout;
  private stations: EggStationDefinition[];
  public onProximityChange?: (player: Player, inProximity: boolean, station: EggStationDefinition | null) => void;

  constructor(world: World, gameManager: GameManager, stations: EggStationDefinition[], proximityRadius = 3.5) {
    this.world = world;
    this.gameManager = gameManager;
    this.stations = stations;
    this.proximityRadius = proximityRadius;
  }

  start(): void {
    if (this.interval) return;
    this.interval = setInterval(() => this.checkAllPlayers(), 250);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  addPlayer(player: Player): void {
    this.trackedPlayers.add(player);
  }

  removePlayer(player: Player): void {
    this.trackedPlayers.delete(player);
    this.playerStationMap.delete(player);
  }

  private checkAllPlayers(): void {
    for (const player of this.trackedPlayers) {
      const playerEntities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
      if (!playerEntities.length) continue;

      const pos = playerEntities[0].position;
      let closest: { station: EggStationDefinition; distance: number } | null = null;

      for (const station of this.stations) {
        const dx = pos.x - station.position.x;
        const dy = pos.y - station.position.y;
        const dz = pos.z - station.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance <= this.proximityRadius) {
          if (!closest || distance < closest.distance) {
            closest = { station, distance };
          }
        }
      }

      const prevStationId = this.playerStationMap.get(player) ?? null;
      const nextStationId = closest?.station.id ?? null;

      if (prevStationId === nextStationId) continue;
      this.playerStationMap.set(player, nextStationId);

      if (!nextStationId) {
        if (this.onProximityChange) {
          this.onProximityChange(player, false, null);
        }
        player.ui.sendData({ type: 'EGG_STATION_PROXIMITY', inProximity: false });
        continue;
      }

      const station = closest!.station;
      if (this.onProximityChange) {
        this.onProximityChange(player, true, station);
      }
      const playerData = this.gameManager.getPlayerData(player);
      const gold = playerData?.gold ?? 0;
      const invCount = Array.isArray(playerData?.petInventory) ? playerData!.petInventory!.length : 0;
      const equippedCount = Array.isArray(playerData?.equippedPets) ? playerData!.equippedPets!.length : 0;
      const ownedCount = invCount + equippedCount;
      const autoDeletePets = Array.isArray(playerData?.autoDeletePets)
        ? playerData!.autoDeletePets!.filter(isPetId)
        : [];
      const eggPets = this.getEggShopPets(station.eggType);

      player.ui.sendData({
        type: 'EGG_STATION_PROXIMITY',
        inProximity: true,
        station: {
          id: station.id,
          name: station.name,
          eggType: station.eggType,
          defaultOpenCount: station.defaultOpenCount,
          costGold: EGG_DEFINITIONS[station.eggType]?.costGold ?? 0,
          eggPets,
        },
        player: {
          gold,
          petInventoryCount: ownedCount,
          petInventoryCap: PET_INVENTORY_CAPACITY,
          petEquippedCount: equippedCount,
          petEquippedCap: PET_EQUIP_CAPACITY,
          autoDeletePets,
        },
      });
    }
  }

  private getEggShopPets(eggType: EggType): Array<{
    petId: string;
    name: string;
    rarity: string;
    chance: number;
  }> {
    const table = getEggLootTable(eggType) || [];
    let totalWeight = 0;
    for (const entry of table) {
      if (entry.weight > 0) totalWeight += entry.weight;
    }
    if (totalWeight <= 0) totalWeight = 1;

    return table.map((entry) => {
      const def = getPetDefinition(entry.petId);
      return {
        petId: entry.petId,
        name: def?.name ?? entry.petId,
        rarity: def?.rarity ?? 'common',
        chance: (entry.weight / totalWeight) * 100,
      };
    });
  }
}


