/**
 * Training System
 * 
 * Handles the core training logic: auto-hitting training rocks to gain Power.
 * Manages training state per player and calculates power gain.
 * 
 * Reference: Planning/gameOverview.txt section 3.1, 3.3
 */

import { Player, Entity, World } from 'hytopia';
import { calculatePowerGainPerHit } from '../../Stats/StatCalculator';
import { getMiningSpeed } from '../../Stats/StatCalculator';
import type { TrainingRockData } from './TrainingRockData';
import type { PickaxeData } from '../../Pickaxe/PickaxeData';
import type { PlayerData } from '../../Core/PlayerData';

/**
 * Training state for a player
 */
interface TrainingState {
  /** Whether player is currently training */
  isTraining: boolean;
  
  /** The training rock being used */
  rock: TrainingRockData | null;
  
  /** Player's pickaxe at training start */
  pickaxe: PickaxeData | null;
  
  /** Player entity for animation playback */
  playerEntity: Entity | null;
  
  /** Last hit timestamp (for rate limiting) */
  lastHitTime: number;
  
  /** Training interval ID (for cleanup) */
  intervalId?: NodeJS.Timeout;
  
  /** Whether an animation is currently playing */
  animationPlaying: boolean;
}

/**
 * Training System class
 * Manages training state and power gain for all players
 */
export class TrainingSystem {
  private trainingStates: Map<Player, TrainingState> = new Map();
  private world: World | null = null;

  /**
   * Sets the world instance for accessing pickaxe entities
   */
  setWorld(world: World): void {
    this.world = world;
  }

  /**
   * Starts training for a player
   * 
   * @param player - Player who wants to train
   * @param rock - Training rock to train on
   * @param pickaxe - Player's current pickaxe
   * @param playerData - Player's current data (for rebirths)
   * @param playerEntity - Player entity for animation playback
   * @param onPowerGain - Callback when power is gained (to update player data)
   * @param worldId - Optional world ID ('island1' or 'island2'), defaults to 'island1'
   * @param hitRate - Optional hit rate (hits per second), defaults to 2.0 for Island 1
   */
  startTraining(
    player: Player,
    rock: TrainingRockData,
    pickaxe: PickaxeData,
    playerData: PlayerData,
    playerEntity: Entity,
    onPowerGain: (player: Player, amount: number) => void,
    worldId: string = 'island1',
    hitRate: number = 2.0
  ): void {
    // Start mining animation on player entity (Hyground style)
    if (playerEntity && typeof (playerEntity as any).startMiningAnimation === 'function') {
      (playerEntity as any).startMiningAnimation();
    }
    
    // Stop any existing training first
    this.stopTraining(player);

    // Check if player can access this rock (OR condition: power OR rebirths)
    // Convert power string (BigInt) to number for comparison with requiredPower
    const playerPower = Number(playerData.power);
    const meetsPower = playerPower >= rock.requiredPower;
    const meetsRebirth = playerData.rebirths >= rock.requiredRebirths;
    const canAccess = meetsPower || meetsRebirth;
    
    if (!canAccess) {
      return;
    }
    
    // Additional safety check: if player doesn't meet rebirth requirement,
    // ensure power gain won't be invalid (should return 0, but prevent Infinity/NaN)
    // Players can still train via power requirement, but power gain will be 0 if rebirths = 0

    const state: TrainingState = {
      isTraining: true,
      rock,
      pickaxe,
      playerEntity,
      lastHitTime: Date.now(),
      animationPlaying: false,
    };

    this.trainingStates.set(player, state);

    // Calculate hit rate (swings per second)
    // Island 1: 2.0 swings/second (1 hit per 0.5 seconds)
    // Island 2: 3.0 swings/second for rocks 1-5, 4.0 swings/second for rock 6
    // Training speed does NOT scale with pickaxe speed - it's based on world/rock
    // Reference: PowerSystemPlan.md - Training Speed is constant regardless of pickaxe
    const TRAINING_BASE_SWING_RATE = hitRate; // Use provided hit rate (world/rock-specific)
    const hitIntervalMs = 1000 / TRAINING_BASE_SWING_RATE; // ms per hit
    const ANIMATION_DURATION_MS = 200; // Animation duration (shortened for accurate timing)
    const delayAfterAnimation = Math.max(0, hitIntervalMs - ANIMATION_DURATION_MS); // Remaining time after animation

    // Start auto-hitting loop with animation
    // Use a recursive timeout pattern instead of setInterval to handle async properly
    const performHit = () => {
      const currentState = this.trainingStates.get(player);
      if (!currentState || !currentState.isTraining) {
        return; // Training was stopped
      }

      // Skip if animation is still playing
      if (currentState.animationPlaying) {
        // Schedule next attempt after a short delay
        state.intervalId = setTimeout(performHit, 50) as any;
        return;
      }

      // Play pickaxe swing animation
      currentState.animationPlaying = true;
      // Grant power immediately (don't wait for animation)
      // UPDATED: Power gain uses piecewise functions based on rock tier and rebirths
      // Pickaxes no longer affect power gain - only rock selection and rebirth count matter
      // Island 2 uses different formulas than Island 1
      // Reference: Planning/PowerSystemPlan.md section 4
      let powerGain = calculatePowerGainPerHit(
        rock.tier,
        playerData.rebirths,
        worldId
      );
      
      // Safety check: ensure power gain is a valid finite number
      // Prevent Infinity, NaN, or negative values that could cause overflow
      if (!Number.isFinite(powerGain) || powerGain < 0) {
        powerGain = 0;
      }
      
      // Cap power gain to prevent overflow (using MAX_VALUE - very large but may lose precision for huge integers)
      const MAX_SAFE_POWER_GAIN = Number.MAX_VALUE; // ~1.7976931348623157e+308 (largest JavaScript number)
      if (powerGain > MAX_SAFE_POWER_GAIN) {
        powerGain = MAX_SAFE_POWER_GAIN;
      }
      
      // Notify that power was gained
      onPowerGain(player, powerGain);

      // Update last hit time
      currentState.lastHitTime = Date.now();

      // Play animation in parallel (non-blocking)
      this.playPickaxeSwingAnimation(currentState.playerEntity).then(() => {
        const currentStateAfterAnim = this.trainingStates.get(player);
        if (currentStateAfterAnim) {
          currentStateAfterAnim.animationPlaying = false;
        }
      }).catch((error) => {
        const currentStateAfterError = this.trainingStates.get(player);
        if (currentStateAfterError) {
          currentStateAfterError.animationPlaying = false;
        }
      });

      // Schedule next hit after the calculated interval (constant 500ms = 2.0 swings/second)
      if (currentState.isTraining) {
        state.intervalId = setTimeout(performHit, hitIntervalMs) as any;
      }
    };

    // Perform first hit immediately
    performHit();
  }

  /**
   * Plays pickaxe swing animation on player entity
   * 
   * @param playerEntity - Player entity to animate
   * @returns Promise that resolves when animation completes
   */
  private async playPickaxeSwingAnimation(playerEntity: Entity | null): Promise<void> {
    if (!playerEntity) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return;
    }

    // Simple placeholder animation: rotate pickaxe entity back and forth
    try {
      // Find pickaxe entity attached to player
      let pickaxeEntity: Entity | null = null;
      if (this.world) {
        const allEntities = this.world.entityManager.getAllEntities();
        for (const entity of allEntities) {
          if (entity.tag === 'pickaxe') {
            // Check if this pickaxe is parented to our player entity
            const entityAny = entity as any;
            if (entityAny.parent === playerEntity || entityAny.getParent?.() === playerEntity) {
              pickaxeEntity = entity;
              break;
            }
          }
        }
      }

      if (pickaxeEntity) {
        // Animate pickaxe rotation (swing motion) - shortened for accurate timing
        const startRotation = pickaxeEntity.rotation || { x: 0, y: 0.707, z: 0, w: 0.707 };
        const swingDuration = 200; // milliseconds (shortened to fit in hit interval)
        const steps = 5; // Fewer steps for faster animation
        const stepDelay = swingDuration / steps;
        
        // Quick swing forward (rotate around X axis)
        for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const angle = progress * Math.PI * 0.25; // 25 degree swing (smaller for speed)
          const newRotation = {
            x: Math.sin(angle / 2) * 0.5,
            y: startRotation.y,
            z: startRotation.z,
            w: Math.cos(angle / 2)
          };
          try {
            pickaxeEntity.setRotation(newRotation);
          } catch (e) {
            // Rotation might not be settable, that's okay
          }
          await new Promise(resolve => setTimeout(resolve, stepDelay));
        }
        
        // Quick swing back
        for (let i = steps; i >= 0; i--) {
          const progress = i / steps;
          const angle = progress * Math.PI * 0.25;
          const newRotation = {
            x: Math.sin(angle / 2) * 0.5,
            y: startRotation.y,
            z: startRotation.z,
            w: Math.cos(angle / 2)
          };
          try {
            pickaxeEntity.setRotation(newRotation);
          } catch (e) {
            // Rotation might not be settable, that's okay
          }
          await new Promise(resolve => setTimeout(resolve, stepDelay));
        }
        
        // Reset to original rotation
        try {
          pickaxeEntity.setRotation(startRotation);
        } catch (e) {
          // Ignore
        }
      } else {
        // No pickaxe found, just wait (shorter delay)
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }

  /**
   * Stops training for a player
   * 
   * @param player - Player to stop training for
   */
  stopTraining(player: Player): void {
    const state = this.trainingStates.get(player);
    if (!state) return;
    
    // Stop mining animation and return to holding pose (Hyground style)
    if (state.playerEntity && typeof (state.playerEntity as any).stopMiningAnimation === 'function') {
      (state.playerEntity as any).stopMiningAnimation();
    }

    state.isTraining = false;
    state.animationPlaying = false;
    
    // Clear interval/timeout if it exists
    if (state.intervalId) {
      clearTimeout(state.intervalId);
      state.intervalId = undefined;
    }

    this.trainingStates.delete(player);
  }

  /**
   * Checks if a player is currently training
   * 
   * @param player - Player to check
   * @returns True if player is training
   */
  isPlayerTraining(player: Player): boolean {
    const state = this.trainingStates.get(player);
    return state?.isTraining ?? false;
  }

  /**
   * Gets the training rock a player is currently using
   * 
   * @param player - Player to check
   * @returns Training rock data or null if not training
   */
  getPlayerTrainingRock(player: Player): TrainingRockData | null {
    const state = this.trainingStates.get(player);
    return state?.rock ?? null;
  }

  /**
   * Cleans up training state when player leaves
   * 
   * @param player - Player who left
   */
  cleanupPlayer(player: Player): void {
    this.stopTraining(player);
  }
}

