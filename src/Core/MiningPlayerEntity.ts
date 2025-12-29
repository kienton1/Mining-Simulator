/**
 * MiningPlayerEntity
 * 
 * Custom player entity for mining game that handles left-click input detection.
 * Based on NewGame's GamePlayerEntity pattern.
 */

import {
  DefaultPlayerEntity,
  DefaultPlayerEntityController,
  BaseEntityControllerEvent,
  Player,
} from 'hytopia';

import type { EventPayloads } from 'hytopia';

export class MiningPlayerEntity extends DefaultPlayerEntity {
  private onLeftClickStartCallback?: () => void;
  private onLeftClickStopCallback?: () => void;
  private wasLeftClickPressed = false;

  /**
   * Player entities always assign a PlayerController to the entity,
   * so we can safely create a convenience getter (like NewGame does).
   */
  public get playerController(): DefaultPlayerEntityController {
    if (!this.controller) {
      // Return a dummy object to prevent errors, but this shouldn't happen

      return {} as DefaultPlayerEntityController;
    }
    return this.controller as DefaultPlayerEntityController;
  }

  constructor(player: Player) {
    super({
      player,
      name: 'Player',
    });
    
    // Set up controller setup after a brief delay to ensure it's initialized
    // DefaultPlayerEntity handles WASD movement automatically - we just add mining input handling
    // Use requestAnimationFrame equivalent (setTimeout) to ensure controller is ready
    setTimeout(() => {
      this.setupMiningController();
    }, 100);
  }

  /**
   * Sets up the mining controller input handling
   * Called after entity is spawned to ensure controller is ready
   */
  private setupMiningController(): void {
    try {
      if (!this.controller) {
        // Controller not ready yet, retry
        setTimeout(() => this.setupMiningController(), 100);
        return;
      }

      // Prevent mouse left click from being cancelled, required for mining mechanics
      this.playerController.autoCancelMouseLeftClick = false;

      // Setup input handler for mining (like NewGame does)
      // This listens for left click input specifically for mining
      // Note: This doesn't interfere with WASD movement - DefaultPlayerEntity handles that automatically
      this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);

    } catch (error) {

      // Retry once more after a longer delay
      setTimeout(() => {
        try {
          if (this.controller) {
            this.playerController.autoCancelMouseLeftClick = false;
            this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);

          }
        } catch (retryError) {

        }
      }, 300);
    }
  }

  /**
   * Sets callback for left click start
   */
  setOnLeftClickStart(callback: () => void): void {
    this.onLeftClickStartCallback = callback;
  }

  /**
   * Sets callback for left click stop
   */
  setOnLeftClickStop(callback: () => void): void {
    this.onLeftClickStopCallback = callback;
  }

  /**
   * Handle player input each tick.
   * Detects Mouse1 (left click) for mining.
   * Exactly like NewGame's GamePlayerEntity._onTickWithPlayerInput
   */
  private _onTickWithPlayerInput = (payload: EventPayloads[BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT]): void => {
    const { input } = payload;

    // Mouse1 (left click) input - mine blocks
    if (input.ml) {
      if (!this.wasLeftClickPressed) {
        // Just started clicking
        this.wasLeftClickPressed = true;
        if (this.onLeftClickStartCallback) {
          this.onLeftClickStartCallback();
        }
      }
    } else {
      if (this.wasLeftClickPressed) {
        // Just released
        this.wasLeftClickPressed = false;
        if (this.onLeftClickStopCallback) {
          this.onLeftClickStopCallback();
        }
      }
    }
  }
}

