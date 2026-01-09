/**
 * Egg Station Label Manager
 *
 * Mirrors the anchoring strategy used in `TrainingController`:
 * - create SceneUI instances once
 * - store references
 * - periodically re-apply positions to keep them anchored
 */

import { SceneUI, World } from 'hytopia';
import type { EggStationDefinition } from './EggStationManager';
import { EGG_DEFINITIONS } from './PetDatabase';
import { EggType } from './PetData';

export class EggStationLabelManager {
  private world: World;
  private stations: EggStationDefinition[];
  private sceneUIs: Map<string, SceneUI> = new Map();
  private interval?: NodeJS.Timeout;

  constructor(world: World, stations: EggStationDefinition[]) {
    this.world = world;
    this.stations = stations;
  }

  start(): void {
    for (const station of this.stations) {
      this.ensureLabel(station);
    }

    if (!this.interval) {
      this.interval = setInterval(() => {
        for (const station of this.stations) {
          this.updateLabelPosition(station);
        }
      }, 1000);
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    for (const ui of this.sceneUIs.values()) {
      try {
        ui.unload();
      } catch {
        // ignore
      }
    }
    this.sceneUIs.clear();
  }

  private ensureLabel(station: EggStationDefinition): SceneUI {
    const existing = this.sceneUIs.get(station.id);
    if (existing) return existing;

    const title =
      station.eggType === EggType.STONE ? 'Stone Egg' :
      station.eggType === EggType.GEM ? 'Gem Egg' :
      'Crystal Egg';

    const costGold = EGG_DEFINITIONS[station.eggType]?.costGold ?? 0;
    const costText = costGold >= 1000
      ? `${(costGold / 1000).toFixed(costGold % 1000 === 0 ? 0 : 1)}K Gold`
      : `${costGold} Gold`;

    // Use direct positioning like the working training system
    // Position the UI above the egg station
    const uiPos = {
      x: station.position.x,
      y: station.position.y + 2.8, // Float above the egg station
      z: station.position.z,
    };

    const ui = new SceneUI({
      templateId: 'egg:prompt',
      viewDistance: 96,
      position: uiPos,
      state: {
        visible: true,
        title,
        subtitle: '', // hide subtitle; we only want name + cost like the reference image
        costText,
      },
    });

    ui.load(this.world);
    this.sceneUIs.set(station.id, ui);
    return ui;
  }

  private updateLabelPosition(station: EggStationDefinition): void {
    const ui = this.sceneUIs.get(station.id);
    if (!ui) return;

    // Update position directly like the working training system
    const uiPos = {
      x: station.position.x,
      y: station.position.y + 2.8, // Float above the egg station
      z: station.position.z,
    };
    ui.setPosition(uiPos);
  }
}


