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
  ModelRegistry,
} from 'hytopia';

import type { EventPayloads } from 'hytopia';

export class MiningPlayerEntity extends DefaultPlayerEntity {
  private onLeftClickStartCallback?: () => void;
  private onLeftClickStopCallback?: () => void;
  private canMineCallback?: () => boolean;
  private wasLeftClickPressed = false;
  private inputSuppressed = false;
  private pickaxeHoldApplied = false;

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

      // Override controller animations to use carry-upper for upper body
      // This ensures the pickaxe holding animation persists even when idle/walking/running
      // The controller automatically manages animations every tick, so we need to override its defaults
      this.playerController.idleLoopedAnimations = ['carry-upper', 'idle-lower'];
      this.playerController.walkLoopedAnimations = ['carry-upper', 'walk-lower'];
      this.playerController.runLoopedAnimations = ['carry-upper', 'run-lower'];
      console.log('[Animation] Overrode controller animations to use carry-upper for upper body');

      // Setup input handler for mining (like NewGame does)
      // This listens for left click input specifically for mining
      // Note: This doesn't interfere with WASD movement - DefaultPlayerEntity handles that automatically
      this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);
      this.applyPickaxeHoldAnimations();

    } catch (error) {
      console.error('[Animation] Error setting up mining controller:', error);
      // Retry once more after a longer delay
      setTimeout(() => {
        try {
          if (this.controller) {
            this.playerController.autoCancelMouseLeftClick = false;
            this.playerController.idleLoopedAnimations = ['carry-upper', 'idle-lower'];
            this.playerController.walkLoopedAnimations = ['carry-upper', 'walk-lower'];
            this.playerController.runLoopedAnimations = ['carry-upper', 'run-lower'];
            this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);
            this.applyPickaxeHoldAnimations();

          }
        } catch (retryError) {
          console.error('[Animation] Error in retry setup:', retryError);
        }
      }, 300);
    }
  }

  /**
   * Applies Hyground-style pickaxe holding animation
   * Uses carry-upper animation (upper-body only) so player can still walk/run
   */
  private applyPickaxeHoldAnimations(attempt = 0): void {
    if (this.pickaxeHoldApplied) {
      console.log('[Animation] Pickaxe hold already applied, skipping');
      return;
    }
    if (!this.isSpawned) {
      console.log(`[Animation] Entity not spawned yet, attempt ${attempt}/10`);
      if (attempt < 10) {
        setTimeout(() => this.applyPickaxeHoldAnimations(attempt + 1), 100);
      }
      return;
    }

    try {
      // Check available animations
      if (this.modelUri) {
        const availableAnims = ModelRegistry.instance.getAnimationNames(this.modelUri);
        console.log(`[Animation] Available animations for ${this.modelUri}:`, availableAnims);
        console.log(`[Animation] Looking for 'carry-upper' - found:`, availableAnims.includes('carry-upper'));
      }
      
      // Use carry-upper animation (Hyground style) - upper body only
      // This allows lower body to continue with walk/run animations
      console.log('[Animation] Starting carry-upper animation');
      this.startModelLoopedAnimations(['carry-upper']);
      this.pickaxeHoldApplied = true;
      console.log('[Animation] Successfully applied carry-upper animation');
    } catch (error) {
      console.error('[Animation] Error applying carry-upper animation:', error);
      // Animation might not be available yet, retry
      if (attempt < 10) {
        setTimeout(() => this.applyPickaxeHoldAnimations(attempt + 1), 150);
      }
    }
  }

  /**
   * Starts mining animation (swinging pickaxe)
   * Switches from holding animation to mining animation
   */
  startMiningAnimation(): void {
    if (!this.isSpawned) {
      console.log('[Animation] Cannot start mining animation - entity not spawned');
      return;
    }
    try {
      // Check available animations
      if (this.modelUri) {
        const availableAnims = ModelRegistry.instance.getAnimationNames(this.modelUri);
        console.log(`[Animation] Starting mining - available animations:`, availableAnims);
        console.log(`[Animation] Looking for 'mining-loop' - found:`, availableAnims.includes('mining-loop'));
      }
      
      console.log('[Animation] Overriding controller to use mining-loop for upper body');
      // Override controller animations to use mining-loop for upper body
      // This ensures the mining animation persists even when idle/walking/running
      this.playerController.idleLoopedAnimations = ['mining-loop', 'idle-lower'];
      this.playerController.walkLoopedAnimations = ['mining-loop', 'walk-lower'];
      this.playerController.runLoopedAnimations = ['mining-loop', 'run-lower'];
      console.log('[Animation] Successfully switched to mining-loop animation');
    } catch (error) {
      console.error('[Animation] Error starting mining animation:', error);
    }
  }

  /**
   * Stops mining animation and returns to holding pose
   * Switches from mining animation back to holding animation
   */
  stopMiningAnimation(): void {
    if (!this.isSpawned) {
      console.log('[Animation] Cannot stop mining animation - entity not spawned');
      return;
    }
    try {
      console.log('[Animation] Overriding controller to return to carry-upper for upper body');
      // Override controller animations to use carry-upper for upper body again
      // This ensures the holding animation persists even when idle/walking/running
      this.playerController.idleLoopedAnimations = ['carry-upper', 'idle-lower'];
      this.playerController.walkLoopedAnimations = ['carry-upper', 'walk-lower'];
      this.playerController.runLoopedAnimations = ['carry-upper', 'run-lower'];
      console.log('[Animation] Successfully returned to carry-upper animation');
    } catch (error) {
      console.error('[Animation] Error stopping mining animation:', error);
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
   * to prevent the mining animation from playing
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
   * 
   * IMPORTANT: This handler modifies input.ml BEFORE the SDK's
   * DefaultPlayerEntityController processes it for animations.
   * By setting input.ml = false, we prevent the animation from playing.
   */
  private _onTickWithPlayerInput = (payload: EventPayloads[BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT]): void => {
    const { input } = payload;

    if (this.inputSuppressed) {
      // Clear all inputs to prevent movement, jumping, and interactions while suppressed.
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
    // If not, suppress left-click input to prevent animation
    const canMine = this.canMineCallback ? this.canMineCallback() : true;
    
    if (!canMine) {
      // Clear left-click input to prevent animation from playing
      // This modification happens before the SDK controller processes the input
      if (input.ml) {
        input.ml = false;
      }
      // Also reset wasLeftClickPressed to prevent state issues
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

