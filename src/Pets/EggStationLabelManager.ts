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

  reload(): void {
    for (const ui of this.sceneUIs.values()) {
      try {
        ui.unload();
      } catch {
        // ignore
      }
    }
    this.sceneUIs.clear();
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
      station.eggType === EggType.CRYSTAL ? 'Crystal Egg' :
      station.eggType === EggType.ABYSSAL ? 'Abyssal Egg' :
      station.eggType === EggType.BOARDWALK ? 'Boardwalk Egg' :
      station.eggType === EggType.SHIPWRECK ? 'Shipwreck Egg' :
      station.eggType === EggType.SAND ? 'Sand Egg' :
      station.eggType === EggType.SNOW ? 'Snow Egg' :
      station.eggType === EggType.LAVA ? 'Lava Egg' :
      station.eggType === EggType.SWEETS ? 'Sweets Egg' :
      station.eggType === EggType.ORNAMENT ? 'Ornament Egg' :
      'Winter Egg';

    const costGold = EGG_DEFINITIONS[station.eggType]?.costGold ?? 0;
    const costText = `${this.formatNumber(costGold)} Gold`;

    // Use direct positioning like the working training system
    // Position the UI above the egg station
    const uiPos = {
      x: station.position.x,
      y: station.position.y + 1.8, // Float above the egg station
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

  private formatNumber(value: number): string {
    if (value < 0) return '-' + this.formatNumber(-value);
    if (value === 0) return '0';

    const formatWithSuffix = (num: number, suffix: string): string => {
      const with1Dec = num.toFixed(1);
      if (with1Dec.endsWith('.0')) return Math.round(num).toString() + suffix;
      const with2Dec = num.toFixed(2);
      if (with2Dec.endsWith('.00')) return Math.round(num).toString() + suffix;
      return with2Dec.replace(/\.?0+$/, '') + suffix;
    };

    if (value >= 1e42) {
      const num = value / 1e42;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'TDe');
      return formatWithSuffix(num, 'TDe');
    }
    if (value >= 1e39) {
      const num = value / 1e39;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'TDe');
      return formatWithSuffix(num, 'DDe');
    }
    if (value >= 1e36) {
      const num = value / 1e36;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'DDe');
      return formatWithSuffix(num, 'UDe');
    }
    if (value >= 1e33) {
      const num = value / 1e33;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'UDe');
      return formatWithSuffix(num, 'De');
    }
    if (value >= 1e30) {
      const num = value / 1e30;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'De');
      return formatWithSuffix(num, 'No');
    }
    if (value >= 1e27) {
      const num = value / 1e27;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'No');
      return formatWithSuffix(num, 'Oc');
    }
    if (value >= 1e24) {
      const num = value / 1e24;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'Oc');
      return formatWithSuffix(num, 'Sp');
    }
    if (value >= 1e21) {
      const num = value / 1e21;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'Sp');
      return formatWithSuffix(num, 'Sx');
    }
    if (value >= 1e18) {
      const num = value / 1e18;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'Sx');
      return formatWithSuffix(num, 'Qn');
    }
    if (value >= 1e15) {
      const num = value / 1e15;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'Qn');
      return formatWithSuffix(num, 'Qd');
    }
    if (value >= 1e12) {
      const num = value / 1e12;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'Qd');
      return formatWithSuffix(num, 'T');
    }
    if (value >= 1e9) {
      const num = value / 1e9;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'T');
      return formatWithSuffix(num, 'B');
    }
    if (value >= 1e6) {
      const num = value / 1e6;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'B');
      return formatWithSuffix(num, 'M');
    }
    if (value >= 1e3) {
      const num = value / 1e3;
      if (num >= 1000) return formatWithSuffix(num / 1000, 'M');
      return formatWithSuffix(num, 'K');
    }
    return Math.round(value).toString();
  }

  private updateLabelPosition(station: EggStationDefinition): void {
    const ui = this.sceneUIs.get(station.id);
    if (!ui) return;

    // Update position directly like the working training system
    const uiPos = {
      x: station.position.x,
      y: station.position.y + 1.8, // Float above the egg station
      z: station.position.z,
    };
    ui.setPosition(uiPos);
  }
}


