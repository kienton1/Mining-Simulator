/**
 * Egg Station Manager
 *
 * Uses fixed world positions (aligned with barrel props in `assets/map.json`)
 * and checks player proximity to open/close the egg station UI.
 *
 * Stations are grouped by world - when a player approaches any station in a group,
 * a unified UI shows ALL stations in that group for easy access.
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

interface StationGroup {
  id: string;
  name: string;
  stations: EggStationDefinition[];
  centerX: number;
  centerZ: number;
}

export class EggStationManager {
  private world: World;
  private gameManager: GameManager;
  private proximityRadius: number;
  private trackedPlayers: Set<Player> = new Set();
  private playerGroupMap: Map<Player, { groupId: string | null; stationId: string | null }> = new Map();
  private interval?: NodeJS.Timeout;
  private stations: EggStationDefinition[];
  private stationGroups: StationGroup[];

  constructor(world: World, gameManager: GameManager, stations: EggStationDefinition[], proximityRadius = 3.5) {
    this.world = world;
    this.gameManager = gameManager;
    this.stations = stations;
    this.proximityRadius = proximityRadius;
    this.stationGroups = this.groupStationsByWorld(stations);
  }

  /**
   * Group stations by their X coordinate (world).
   * Stations within 50 blocks of each other on X axis are considered in the same group.
   */
  private groupStationsByWorld(stations: EggStationDefinition[]): StationGroup[] {
    const groups: StationGroup[] = [];
    const processed = new Set<string>();

    for (const station of stations) {
      if (processed.has(station.id)) continue;

      // Find all stations close to this one (same world)
      const groupStations = stations.filter(s => {
        if (processed.has(s.id)) return false;
        const dx = Math.abs(s.position.x - station.position.x);
        return dx < 50; // Stations within 50 blocks on X are in same group
      });

      if (groupStations.length === 0) continue;

      // Mark all as processed
      for (const s of groupStations) {
        processed.add(s.id);
      }

      // Calculate center of group
      const centerX = groupStations.reduce((sum, s) => sum + s.position.x, 0) / groupStations.length;
      const centerZ = groupStations.reduce((sum, s) => sum + s.position.z, 0) / groupStations.length;

      // Determine group name based on X position
      let groupName = 'Egg Station';
      if (centerX > -50) {
        groupName = 'Island 1 Eggs';
      } else if (centerX > -350) {
        groupName = 'Island 2 Eggs';
      } else {
        groupName = 'Island 3 Eggs';
      }

      groups.push({
        id: `group-${Math.round(centerX)}`,
        name: groupName,
        stations: groupStations,
        centerX,
        centerZ,
      });
    }

    return groups;
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
    this.playerGroupMap.delete(player);
  }

  private checkAllPlayers(): void {
    for (const player of this.trackedPlayers) {
      const playerEntities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
      if (!playerEntities.length) continue;

      const pos = playerEntities[0].position;
      let nearestMatch: { group: StationGroup; station: EggStationDefinition; distance: number } | null = null;

      // Check distance to any station in any group
      for (const group of this.stationGroups) {
        for (const station of group.stations) {
          const dx = pos.x - station.position.x;
          const dz = pos.z - station.position.z;
          const distance = Math.sqrt(dx * dx + dz * dz);

          if (distance <= this.proximityRadius) {
            if (!nearestMatch || distance < nearestMatch.distance) {
              nearestMatch = { group, station, distance };
            }
          }
        }
      }

      const prev = this.playerGroupMap.get(player) ?? { groupId: null, stationId: null };
      const nextGroupId = nearestMatch?.group.id ?? null;
      const nextStationId = nearestMatch?.station.id ?? null;

      if (prev.groupId === nextGroupId && prev.stationId === nextStationId) continue;
      this.playerGroupMap.set(player, { groupId: nextGroupId, stationId: nextStationId });

      if (!nextGroupId) {
        player.ui.sendData({ type: 'EGG_STATION_PROXIMITY', inProximity: false });
        continue;
      }

      const group = nearestMatch!.group;
      const playerData = this.gameManager.getPlayerData(player);
      const gold = playerData?.gold ?? 0;
      const invCount = Array.isArray(playerData?.petInventory) ? playerData!.petInventory!.length : 0;
      const equippedCount = Array.isArray(playerData?.equippedPets) ? playerData!.equippedPets!.length : 0;
      const ownedCount = invCount + equippedCount;
      const autoDeletePets = Array.isArray(playerData?.autoDeletePets)
        ? playerData!.autoDeletePets!.filter(isPetId)
        : [];

      // Build data for ALL stations in this group
      const stationsData = group.stations.map(station => ({
        id: station.id,
        name: station.name,
        eggType: station.eggType,
        defaultOpenCount: station.defaultOpenCount,
        costGold: EGG_DEFINITIONS[station.eggType]?.costGold ?? 0,
        eggPets: this.getEggShopPets(station.eggType),
      }));

      // Sort by cost (cheapest first)
      stationsData.sort((a, b) => a.costGold - b.costGold);
      const selectedStation = stationsData.find((station) => station.id === nextStationId) ?? stationsData[0];

      player.ui.sendData({
        type: 'EGG_STATION_PROXIMITY',
        inProximity: true,
        groupId: group.id,
        groupName: group.name,
        stations: stationsData,
        selectedStationId: selectedStation?.id ?? null,
        // First station is selected by default
        station: selectedStation,
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
    imageUri?: string;
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
        imageUri: `ui/pets/${entry.petId}.png`,
      };
    });
  }
}
