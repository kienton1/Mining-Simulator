/**
 * Daily Chest Controller
 *
 * Tracks player proximity to daily chests and triggers the reward modal
 * when a player is near and their reward is ready to claim.
 */

import { World, Player } from 'hytopia';
import type { DailyRewardSystem } from './DailyRewardSystem';
import type { DailyChestEntity } from './DailyChestEntity';

interface ChestProximityState {
  nearChestIndex: number | null;
  modalTriggered: boolean;
}

export class DailyChestController {
  private world: World;
  private chests: DailyChestEntity[];
  private dailyRewardSystem: DailyRewardSystem;
  private playerStates: Map<Player, ChestProximityState> = new Map();
  private trackedPlayers: Set<Player> = new Set();
  private interval?: NodeJS.Timeout;

  private readonly PROXIMITY_RADIUS = 3.0; // blocks
  private readonly EXIT_RADIUS = 4.0; // blocks - must move further away to "exit" (hysteresis)
  private readonly CHECK_INTERVAL_MS = 500; // check every 500ms

  constructor(
    world: World,
    chests: DailyChestEntity[],
    dailyRewardSystem: DailyRewardSystem
  ) {
    this.world = world;
    this.chests = chests;
    this.dailyRewardSystem = dailyRewardSystem;
  }

  /**
   * Starts the proximity checking loop
   */
  start(): void {
    if (!this.interval) {
      this.interval = setInterval(() => this.checkProximity(), this.CHECK_INTERVAL_MS);
    }
  }

  /**
   * Stops the proximity checking loop
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  /**
   * Adds a player to proximity tracking
   * Idempotent - won't reset state if player is already tracked (prevents reset during reconnect)
   */
  addPlayer(player: Player): void {
    // Don't reset state if already tracked (prevents reset during reconnect)
    if (this.trackedPlayers.has(player)) return;

    this.trackedPlayers.add(player);
    this.playerStates.set(player, {
      nearChestIndex: null,
      modalTriggered: false,
    });
  }

  /**
   * Removes a player from proximity tracking
   */
  removePlayer(player: Player): void {
    this.trackedPlayers.delete(player);
    this.playerStates.delete(player);
  }

  /**
   * Resets the modal triggered state for a player (call when modal closes)
   */
  resetModalTriggered(player: Player): void {
    const state = this.playerStates.get(player);
    if (state) {
      state.modalTriggered = false;
    }
  }

  /**
   * Checks proximity of all tracked players to chests
   */
  private checkProximity(): void {
    for (const player of this.trackedPlayers) {
      this.checkPlayerProximity(player);
    }
  }

  /**
   * Checks if a player is near any chest and handles modal triggering
   */
  private checkPlayerProximity(player: Player): void {
    const state = this.playerStates.get(player);
    if (!state) return;

    // Get player position
    const playerEntities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
    if (playerEntities.length === 0) return;

    const playerPos = playerEntities[0].position;

    // Use different radii for entering vs exiting (hysteresis to prevent flickering)
    const wasNearChest = state.nearChestIndex !== null;
    const checkRadius = wasNearChest ? this.EXIT_RADIUS : this.PROXIMITY_RADIUS;

    // Find nearest chest within radius
    let nearestChestIndex: number | null = null;
    let nearestDistance = checkRadius;

    for (let i = 0; i < this.chests.length; i++) {
      const chestPos = this.chests[i].getPosition();
      const dx = playerPos.x - chestPos.x;
      const dz = playerPos.z - chestPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestChestIndex = i;
      }
    }

    // Update state
    const isNearChest = nearestChestIndex !== null;
    const chestChanged = state.nearChestIndex !== nearestChestIndex;

    // Close modal and reset state when player moves away
    if (wasNearChest && !isNearChest) {
      state.nearChestIndex = null;
      state.modalTriggered = false;
      this.closeModal(player);
      return; // Don't trigger in the same check
    }

    state.nearChestIndex = nearestChestIndex;

    // Also reset when player moves to a different chest
    if (chestChanged && nearestChestIndex !== null) {
      state.modalTriggered = false;
    }

    // Trigger modal if:
    // 1. Player is near a chest
    // 2. Modal hasn't been triggered yet
    // 3. Reward is ready to claim
    if (isNearChest && !state.modalTriggered) {
      const canClaim = this.dailyRewardSystem.canClaim(player);

      if (canClaim) {
        state.modalTriggered = true;
        this.triggerModal(player);
      }
    }
  }

  /**
   * Triggers the daily reward modal for a player
   */
  private triggerModal(player: Player): void {
    // Get possible rewards for animation
    const possibleRewards = this.dailyRewardSystem.getPossibleRewards(player);
    const remainingMs = this.dailyRewardSystem.getRemainingMs(player);
    const canClaim = this.dailyRewardSystem.canClaim(player);

    // Send state to UI
    player.ui.sendData({
      type: 'DAILY_REWARD_STATE',
      canClaim,
      remainingMs,
      possibleRewards,
    });

    // Open the modal
    player.ui.sendData({
      type: 'DAILY_REWARD_OPEN',
    });

    console.log(`[DailyChestController] Triggered daily reward modal for player ${player.username}`);
  }

  /**
   * Closes the daily reward modal for a player (when they walk away)
   */
  private closeModal(player: Player): void {
    player.ui.sendData({
      type: 'DAILY_REWARD_CLOSE',
    });

    console.log(`[DailyChestController] Closed daily reward modal for player ${player.username} (walked away)`);
  }
}
