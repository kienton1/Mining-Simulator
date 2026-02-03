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
  private _inputTickCount = 0;
  private _movementLoggedOnce = false;

  /**
   * Player entities always assign a PlayerController to the entity,
   * so we can safely create a convenience getter (like NewGame does).
   */
  public get playerController(): DefaultPlayerEntityController {
    return this.controller as DefaultPlayerEntityController;
  }

  constructor(player: Player) {
    super({
      player,
      name: 'Player',
    });

    console.log(`[MiningPlayerEntity] Constructor called for player: ${player.username}`);
    console.log(`[MiningPlayerEntity] this.controller exists: ${!!this.controller}`);
    console.log(`[MiningPlayerEntity] this.controller type: ${this.controller?.constructor?.name}`);

    // Set up controller immediately - controller is always available in constructor
    this.setupMiningController();
  }

  /**
   * Sets up the mining controller input handling.
   * The controller is always available in the constructor for DefaultPlayerEntity.
   */
  private setupMiningController(): void {
    const pName = this.player?.username || 'unknown';
    console.log(`[MPE] setupMiningController: ${pName}, ctrl=${!!this.controller}, on=${typeof this.playerController?.on}`);

    this.playerController.autoCancelMouseLeftClick = false;
    this.applyStandardAnimations();

    // Movement callbacks with one-time logging
    const self = this;
    this.playerController.canWalk = () => {
      if (!self._movementLoggedOnce) console.log(`[MPE] canWalk called for ${pName}, suppressed=${self.inputSuppressed}`);
      return !self.inputSuppressed;
    };
    this.playerController.canRun = () => !this.inputSuppressed;
    this.playerController.canJump = () => !this.inputSuppressed;
    this.playerController.canSwim = () => {
      if (!self._movementLoggedOnce) { self._movementLoggedOnce = true; }
      return !this.inputSuppressed;
    };

    // Register input handler
    this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);
    console.log(`[MPE] Event listener registered for ${pName}`);
  }

  /**
   * Applies standard animations (idle, walk, run)
   * Uses split upper/lower body animations as per the player model
   */
  private applyStandardAnimations(): void {
    if (!this.controller) return;
    this.playerController.idleLoopedAnimations = ['idle-upper', 'idle-lower'];
    this.playerController.walkLoopedAnimations = ['run-upper', 'run-lower'];
    this.playerController.runLoopedAnimations = ['run-upper', 'run-lower'];
    this.playerController.walkVelocity = 8;
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
      this.playerController.walkLoopedAnimations = ['mining-loop', 'run-lower'];
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
    console.log(`[MPE] setInputSuppressed: ${this.player?.username}, suppressed=${suppressed}`);
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
    this._inputTickCount++;
    // Log first 3 ticks and then every 300 ticks (~5 sec at 60fps)
    if (this._inputTickCount <= 3 || this._inputTickCount % 300 === 0) {
      console.log(`[MPE] _onTickWithPlayerInput: ${this.player?.username}, tick=${this._inputTickCount}, suppressed=${this.inputSuppressed}, w=${input.w}, a=${input.a}, s=${input.s}, d=${input.d}`);
    }

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
