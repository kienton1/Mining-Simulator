/**
 * Shop Label Manager
 *
 * Creates SceneUI labels for shop NPCs (ore, timer, upgrades).
 * Keeps them anchored like egg stations and training rocks.
 */

import { SceneUI, World } from 'hytopia';

export type ShopLabelKind = 'ore' | 'timer' | 'upgrades';

export type ShopLabelDefinition = {
  id: string;
  position: { x: number; y: number; z: number };
  title: string;
  subtitle: string;
  kind: ShopLabelKind;
};

export class ShopLabelManager {
  private world: World;
  private labels: ShopLabelDefinition[];
  private sceneUIs: Map<string, SceneUI> = new Map();
  private interval?: NodeJS.Timeout;

  constructor(world: World, labels: ShopLabelDefinition[]) {
    this.world = world;
    this.labels = labels;
  }

  start(): void {
    for (const label of this.labels) {
      this.ensureLabel(label);
    }

    if (!this.interval) {
      this.interval = setInterval(() => {
        for (const label of this.labels) {
          this.updateLabelPosition(label);
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

  private ensureLabel(label: ShopLabelDefinition): SceneUI {
    const existing = this.sceneUIs.get(label.id);
    if (existing) return existing;

    const uiPos = {
      x: label.position.x,
      y: label.position.y + 2.8,
      z: label.position.z,
    };

    const ui = new SceneUI({
      templateId: 'shop:prompt',
      viewDistance: 96,
      position: uiPos,
      state: {
        visible: true,
        title: label.title,
        subtitle: label.subtitle,
        kind: label.kind,
      },
    });

    ui.load(this.world);
    this.sceneUIs.set(label.id, ui);
    return ui;
  }

  private updateLabelPosition(label: ShopLabelDefinition): void {
    const ui = this.sceneUIs.get(label.id);
    if (!ui) return;

    const uiPos = {
      x: label.position.x,
      y: label.position.y + 2.8,
      z: label.position.z,
    };
    ui.setPosition(uiPos);
  }
}
