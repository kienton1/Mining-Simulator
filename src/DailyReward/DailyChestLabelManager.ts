/**
 * Daily Chest Label Manager
 *
 * Creates SceneUI labels above daily chests showing "Daily Reward" title
 * and countdown timer or "Ready!" status.
 */

import { SceneUI, World, Player } from 'hytopia';
import type { DailyRewardSystem } from './DailyRewardSystem';

interface ChestLabelDefinition {
  id: string;
  position: { x: number; y: number; z: number };
}

export class DailyChestLabelManager {
  private world: World;
  private chests: ChestLabelDefinition[];
  private dailyRewardSystem: DailyRewardSystem;
  private sceneUIs: Map<string, SceneUI> = new Map();
  private interval?: NodeJS.Timeout;
  private getConnectedPlayersCallback?: () => Player[];

  constructor(
    world: World,
    chests: ChestLabelDefinition[],
    dailyRewardSystem: DailyRewardSystem
  ) {
    this.world = world;
    this.chests = chests;
    this.dailyRewardSystem = dailyRewardSystem;
  }

  /**
   * Sets callback to get connected players (for timer calculations)
   */
  setGetConnectedPlayersCallback(callback: () => Player[]): void {
    this.getConnectedPlayersCallback = callback;
  }

  /**
   * Starts the label manager - creates SceneUIs and starts update interval
   */
  start(): void {
    // Create labels for each chest
    for (const chest of this.chests) {
      this.ensureLabel(chest);
    }

    // Start update interval (every second for countdown)
    if (!this.interval) {
      this.interval = setInterval(() => {
        this.updateLabels();
      }, 1000);
    }
  }

  /**
   * Stops the label manager and cleans up
   */
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

  /**
   * Creates or retrieves a label for a chest
   */
  private ensureLabel(chest: ChestLabelDefinition): SceneUI {
    const existing = this.sceneUIs.get(chest.id);
    if (existing) return existing;

    const uiPos = {
      x: chest.position.x,
      y: chest.position.y + 2.5, // Float above the chest
      z: chest.position.z,
    };

    const ui = new SceneUI({
      templateId: 'daily-chest:prompt',
      viewDistance: 64,
      position: uiPos,
      state: {
        visible: true,
        title: 'Daily Reward',
        timerText: 'Ready!',
        isReady: true,
      },
    });

    ui.load(this.world);
    this.sceneUIs.set(chest.id, ui);
    return ui;
  }

  /**
   * Updates all labels with current timer status
   */
  private updateLabels(): void {
    // Get the first connected player to check timer (global cooldown)
    const players = this.getConnectedPlayersCallback?.() ?? [];
    if (players.length === 0) return;

    // Use first player's state for the timer display (it's a global cooldown per player)
    // Each player sees their own timer state, but we update the SceneUI based on first player
    // In practice, the SceneUI template will handle per-player visibility

    for (const chest of this.chests) {
      const ui = this.sceneUIs.get(chest.id);
      if (!ui) continue;

      // Build player states for the SceneUI
      const playerStates: Record<string, { visible: boolean; timerText: string; isReady: boolean }> = {};

      for (const player of players) {
        const canClaim = this.dailyRewardSystem.canClaim(player);
        const remainingMs = this.dailyRewardSystem.getRemainingMs(player);
        const timerText = canClaim ? 'Ready!' : this.formatTime(remainingMs);

        playerStates[player.id] = {
          visible: true,
          timerText,
          isReady: canClaim,
        };
      }

      ui.setState({
        visible: true,
        title: 'Daily Reward',
        playerStates,
      });

      // Update position to keep anchored
      ui.setPosition({
        x: chest.position.x,
        y: chest.position.y + 2.5,
        z: chest.position.z,
      });
    }
  }

  /**
   * Formats milliseconds as HH:MM:SS
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
}
