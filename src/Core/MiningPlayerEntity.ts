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
  private canMineCallback?: () => boolean;
  private wasLeftClickPressed = false;
  private inputSuppressed = false;

  /**
   * Player entities always assign a PlayerController to the entity,
   * so we can safely create a convenience getter (like NewGame does).
   */
  public get playerController(): DefaultPlayerEntityController {
    if (!this.controller) {
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
        setTimeout(() => this.setupMiningController(), 100);
        return;
      }

      // Prevent mouse left click from being cancelled, required for mining mechanics
      this.playerController.autoCancelMouseLeftClick = false;

      // Use standard idle animations
      this.applyStandardAnimations();

      // Setup input handler for mining
      this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);

    } catch (error) {
      console.error('[MiningPlayerEntity] Error setting up controller:', error);
      setTimeout(() => {
        try {
          if (this.controller) {
            this.playerController.autoCancelMouseLeftClick = false;
            this.applyStandardAnimations();
            this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);
          }
        } catch (retryError) {
          console.error('[MiningPlayerEntity] Error in retry setup:', retryError);
        }
      }, 300);
    }
  }

  /**
   * Applies standard animations (idle, walk, run)
   * Uses split upper/lower body animations as per the player model
   */
  private applyStandardAnimations(): void {
    if (!this.controller) return;
    this.playerController.idleLoopedAnimations = ['idle-upper', 'idle-lower'];
    this.playerController.walkLoopedAnimations = ['walk-upper', 'walk-lower'];
    this.playerController.runLoopedAnimations = ['run-upper', 'run-lower'];
  }

  /**
   * Starts mining animation (swinging pickaxe)
   * @param animationSpeed - Playback rate multiplier (1.0 = normal, 2.0 = 2x speed, etc.)
   */
  startMiningAnimation(animationSpeed: number = 1.0): void {
    if (!this.isSpawned || !this.controller) return;
    try {
      // Use mining-loop for upper body while allowing normal leg movement
      this.playerController.idleLoopedAnimations = ['mining-loop', 'idle-lower'];
      this.playerController.walkLoopedAnimations = ['mining-loop', 'walk-lower'];
      this.playerController.runLoopedAnimations = ['mining-loop', 'run-lower'];

      // Clear interact oneshot animations to prevent the SDK from restarting
      // "simple-interact" every tick while ml is held (autoCancelMouseLeftClick = false).
      // Without this, the oneshot restarts from frame 0 each tick, causing jitter.
      this.playerController.interactOneshotAnimations = [];

      // Scale animation playback speed based on pickaxe mining speed
      this.setModelAnimationsPlaybackRate(animationSpeed);
    } catch (error) {
      console.error('[MiningPlayerEntity] Error starting mining animation:', error);
    }
  }

  /**
   * Stops mining animation and returns to standard idle
   */
  stopMiningAnimation(): void {
    if (!this.isSpawned || !this.controller) return;
    try {
      // Return to standard animations
      this.applyStandardAnimations();

      // Restore default interact oneshot animations
      this.playerController.interactOneshotAnimations = ['simple-interact'];

      // Reset animation playback speed to normal
      this.setModelAnimationsPlaybackRate(1.0);
    } catch (error) {
      console.error('[MiningPlayerEntity] Error stopping mining animation:', error);
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
   * Sets callback to check if player can mine (is in the mine)
   * When this returns false, left-click input will be suppressed
   */
  setCanMineCallback(callback: () => boolean): void {
    this.canMineCallback = callback;
  }

  /**
   * Enables/disables all player input handling.
   * Used for loading screens or other forced pauses.
   */
  setInputSuppressed(suppressed: boolean): void {
    this.inputSuppressed = suppressed;
    if (suppressed && this.wasLeftClickPressed) {
      this.wasLeftClickPressed = false;
      if (this.onLeftClickStopCallback) {
        this.onLeftClickStopCallback();
      }
    }
  }

  /**
   * Handle player input each tick.
   * Detects Mouse1 (left click) for mining.
   */
  private _onTickWithPlayerInput = (payload: EventPayloads[BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT]): void => {
    const { input } = payload;

    if (this.inputSuppressed) {
      for (const key of Object.keys(input)) {
        (input as any)[key] = false;
      }
      if (this.wasLeftClickPressed) {
        this.wasLeftClickPressed = false;
        if (this.onLeftClickStopCallback) {
          this.onLeftClickStopCallback();
        }
      }
      return;
    }

    // Check if player can mine (is in the mine)
    const canMine = this.canMineCallback ? this.canMineCallback() : true;

    if (!canMine) {
      if (input.ml) {
        input.ml = false;
      }
      if (this.wasLeftClickPressed) {
        this.wasLeftClickPressed = false;
        if (this.onLeftClickStopCallback) {
          this.onLeftClickStopCallback();
        }
      }
      return;
    }

    // Mouse1 (left click) input - mine blocks
    if (input.ml) {
      if (!this.wasLeftClickPressed) {
        this.wasLeftClickPressed = true;
        if (this.onLeftClickStartCallback) {
          this.onLeftClickStartCallback();
        }
      }
    } else {
      if (this.wasLeftClickPressed) {
        this.wasLeftClickPressed = false;
        if (this.onLeftClickStopCallback) {
          this.onLeftClickStopCallback();
        }
      }
    }
  }
}
