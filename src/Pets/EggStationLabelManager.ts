/**
 * Egg Station Label Manager
 *
 * Mirrors the anchoring strategy used in `TrainingController`:
 * - create SceneUI instances once
 * - store references
 * - periodically re-apply positions to keep them anchored
 */

import { Entity, RigidBodyType, SceneUI, World } from 'hytopia';
import type { EggStationDefinition } from './EggStationManager';
import { EGG_DEFINITIONS } from './PetDatabase';
import { EggType } from './PetData';

export class EggStationLabelManager {
  private world: World;
  private stations: EggStationDefinition[];
  private sceneUIs: Map<string, SceneUI> = new Map();
  private anchors: Map<string, Entity> = new Map();
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

    for (const anchor of this.anchors.values()) {
      try {
        anchor.despawn();
      } catch {
        // ignore
      }
    }
    this.anchors.clear();
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

    // Create (or reuse) a tiny invisible anchor entity at the station position.
    // Using attachedToEntity is the most reliable way to avoid position falling back to origin.
    let anchor = this.anchors.get(station.id);
    if (!anchor) {
      anchor = new Entity({
        name: `egg-ui-anchor:${station.id}`,
        tag: 'egg-ui-anchor',
        isEnvironmental: true,
        opacity: 0,
        modelUri: 'models/environment/City/barrel-wood-2.gltf',
        modelScale: 0.01,
        rigidBodyOptions: {
          type: RigidBodyType.STATIC,
          enabledRotations: { x: false, y: false, z: false },
        },
      });
      anchor.spawn(this.world, station.position);
      this.anchors.set(station.id, anchor);
    } else if (!anchor.isSpawned) {
      anchor.spawn(this.world, station.position);
    } else {
      anchor.setPosition(station.position);
    }

    const ui = new SceneUI({
      templateId: 'egg:prompt',
      viewDistance: 96,
      attachedToEntity: anchor,
      offset: { x: 0, y: 2.8, z: 0 },
      state: {
        visible: true,
        title,
        subtitle: '', // hide subtitle; we only want name + cost like the reference image
        costText,
      },
    });

    ui.load(this.world);
    // Extra safety: explicitly re-apply attachment + offset after load.
    ui.setAttachedToEntity(anchor);
    ui.setOffset({ x: 0, y: 2.8, z: 0 });

    this.sceneUIs.set(station.id, ui);
    return ui;
  }

  private updateLabelPosition(station: EggStationDefinition): void {
    const ui = this.sceneUIs.get(station.id);
    if (!ui) return;
    const anchor = this.anchors.get(station.id);
    if (anchor?.isSpawned) {
      anchor.setPosition(station.position);
      ui.setAttachedToEntity(anchor);
      ui.setOffset({ x: 0, y: 2.8, z: 0 });
    }
  }
}


