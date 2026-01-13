/**
 * Egg Station Controller
 *
 * Barrels in the map act as egg stations. This controller:
 * - Creates a SceneUI prompt above each barrel (template: `egg:prompt`)
 * - Tracks per-player proximity and tells the Overlay UI what station they're near
 */

import { Player, SceneUI, World } from 'hytopia';
import { EggType } from './PetData';
import type { GameManager } from '../Core/GameManager';
import { PET_EQUIP_CAPACITY, PET_INVENTORY_CAPACITY } from './PetDatabase';

export interface EggStationLocation {
  id: string;
  eggType: EggType;
  /** Barrel/world position (same coordinate space as player entity) */
  position: { x: number; y: number; z: number };
  /** Proximity radius in blocks */
  radius: number;
}

interface PlayerEggState {
  currentStationId?: string;
  inProximity: boolean;
  lastUpdateAt: number;
}

export class EggStationController {
  private world: World;
  private gameManager: GameManager;
  private stations: EggStationLocation[];
  private stationSceneUIs: Map<string, SceneUI> = new Map();
  private trackedPlayers: Set<Player> = new Set();
  private playerStates: Map<Player, PlayerEggState> = new Map();
  private intervalId?: NodeJS.Timeout;

  private readonly PROXIMITY_CHECK_MS = 200;
  private readonly ACTIVE_REFRESH_MS = 1000;

  constructor(world: World, gameManager: GameManager, stations: EggStationLocation[]) {
    this.world = world;
    this.gameManager = gameManager;
    this.stations = stations;

    this.createStationSceneUIs();
    this.startProximityChecking();
  }

  addPlayer(player: Player): void {
    this.trackedPlayers.add(player);
    if (!this.playerStates.has(player)) {
      this.playerStates.set(player, { inProximity: false, lastUpdateAt: 0 });
    }
  }

  removePlayer(player: Player): void {
    this.trackedPlayers.delete(player);
    this.playerStates.delete(player);
  }

  cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    for (const ui of this.stationSceneUIs.values()) {
      try {
        ui.unload();
      } catch {
        // ignore
      }
    }
    this.stationSceneUIs.clear();
    this.trackedPlayers.clear();
    this.playerStates.clear();
  }

  private createStationSceneUIs(): void {
    for (const station of this.stations) {
      const uiPos = {
        x: station.position.x,
        y: station.position.y + 2.5,
        z: station.position.z,
      };

      const eggCost = this.gameManager.getHatchingSystem().getEggCostGold(station.eggType);
      const label = this.getEggLabel(station.eggType);

      const sceneUI = new SceneUI({
        templateId: 'egg:prompt',
        viewDistance: 48,
        position: uiPos,
        state: {
          visible: true,
          title: label,
          costText: `${eggCost.toLocaleString()} gold`,
          subtitle: 'Open eggs here',
        },
      });

      sceneUI.load(this.world);
      this.stationSceneUIs.set(station.id, sceneUI);
    }

    // Keep SceneUI positions anchored (similar to training rocks)
    setInterval(() => {
      for (const station of this.stations) {
        const ui = this.stationSceneUIs.get(station.id);
        if (!ui) continue;
        ui.setPosition({
          x: station.position.x,
          y: station.position.y + 2.5,
          z: station.position.z,
        });
      }
    }, 1000);
  }

  private startProximityChecking(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.checkPlayers(), this.PROXIMITY_CHECK_MS);
  }

  private checkPlayers(): void {
    for (const player of this.trackedPlayers) {
      const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0];
      if (!playerEntity) continue;

      const pos = playerEntity.position;

      // Find closest station within radius
      let best: { station: EggStationLocation; dist: number } | null = null;
      for (const station of this.stations) {
        const dx = pos.x - station.position.x;
        const dz = pos.z - station.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= station.radius) {
          if (!best || dist < best.dist) best = { station, dist };
        }
      }

      const state = this.playerStates.get(player) ?? { inProximity: false, lastUpdateAt: 0 };
      const now = Date.now();

      if (!best) {
        if (state.inProximity) {
          state.inProximity = false;
          state.currentStationId = undefined;
          state.lastUpdateAt = now;
          this.playerStates.set(player, state);
          player.ui.sendData({ type: 'EGG_STATION_PROXIMITY', inProximity: false });
        }
        continue;
      }

      const station = best.station;
      const stationChanged = state.currentStationId !== station.id || !state.inProximity;
      const shouldRefresh = now - state.lastUpdateAt >= this.ACTIVE_REFRESH_MS;

      if (stationChanged || shouldRefresh) {
        state.inProximity = true;
        state.currentStationId = station.id;
        state.lastUpdateAt = now;
        this.playerStates.set(player, state);

        const playerData = this.gameManager.getPlayerData(player);
        const gold = playerData?.gold ?? 0;
        const invCount = Array.isArray(playerData?.petInventory) ? playerData!.petInventory!.length : 0;
        const eqCount = Array.isArray(playerData?.equippedPets) ? playerData!.equippedPets!.length : 0;

        const eggCost = this.gameManager.getHatchingSystem().getEggCostGold(station.eggType);

        player.ui.sendData({
          type: 'EGG_STATION_PROXIMITY',
          inProximity: true,
          stationId: station.id,
          eggType: station.eggType,
          eggName: this.getEggLabel(station.eggType),
          costGold: eggCost,
          gold,
          petInventoryCount: invCount,
          petInventoryCapacity: PET_INVENTORY_CAPACITY,
          equippedCount: eqCount,
          equippedCapacity: PET_EQUIP_CAPACITY,
        });
      }
    }
  }

  private getEggLabel(eggType: EggType): string {
    switch (eggType) {
      case EggType.STONE:
        return 'Stone Egg';
      case EggType.GEM:
        return 'Gem Egg';
      case EggType.CRYSTAL:
        return 'Crystal Egg';
      case EggType.ABYSSAL:
        return 'Abyssal Egg';
      case EggType.BOARDWALK:
        return 'Boardwalk Egg';
      case EggType.SHIPWRECK:
        return 'Shipwreck Egg';
    }
  }
}


