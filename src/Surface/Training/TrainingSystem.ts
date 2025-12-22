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
   */
  startTraining(
    player: Player,
    rock: TrainingRockData,
    pickaxe: PickaxeData,
    playerData: PlayerData,
    playerEntity: Entity,
    onPowerGain: (player: Player, amount: number) => void
  ): void {
    // Stop any existing training first
    this.stopTraining(player);

    // Check if player can access this rock (OR condition: power OR rebirths)
    const meetsPower = playerData.power >= rock.requiredPower;
    const meetsRebirth = playerData.rebirths >= rock.requiredRebirths;
    const canAccess = meetsPower || meetsRebirth;
    
    if (!canAccess) {
      console.warn(
        `Player cannot access ${rock.name} (requires ${rock.requiredPower} power OR ${rock.requiredRebirths} rebirths)`
      );
      return;
    }

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
    // Training uses the same swing rate as mining (uses pickaxe's miningSpeed property)
    // Base swing rate is 2.0 swings/second (1 hit per 0.5 seconds)
    // Reference: Planning/TrainingPowerBalanceBlueprint.md
    const hitRate = getMiningSpeed(pickaxe);
    const hitIntervalMs = 1000 / hitRate; // Total time per hit in milliseconds
    const ANIMATION_DURATION_MS = 200; // Animation duration (shortened for accurate timing)
    const delayAfterAnimation = Math.max(0, hitIntervalMs - ANIMATION_DURATION_MS); // Remaining time after animation

    // Start auto-hitting loop with animation
    // Use a recursive timeout pattern instead of setInterval to handle async properly
    const performHit = () => {
      const currentState = this.trainingStates.get(player);
      if (!currentState || !currentState.isTraining) {
        console.log('[TrainingSystem] Training stopped, exiting loop');
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
      console.log('[TrainingSystem] Playing swing animation and granting power');
      
      // Grant power immediately (don't wait for animation)
      // REBALANCED: Pickaxes no longer affect power gain
      // Formula: PowerPerHit = BasePowerGain × RockMultiplier × RebirthMultiplier
      // Reference: Planning/TrainingPowerBalanceBlueprint.md section 2
      const powerGain = calculatePowerGainPerHit(
        rock.powerGainMultiplier,
        playerData.rebirths
      );

      console.log(`[TrainingSystem] Granting ${powerGain} power`);

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
        console.warn('[TrainingSystem] Animation error:', error);
        const currentStateAfterError = this.trainingStates.get(player);
        if (currentStateAfterError) {
          currentStateAfterError.animationPlaying = false;
        }
      });

      // Schedule next hit after the calculated interval
      if (currentState.isTraining) {
        state.intervalId = setTimeout(performHit, hitIntervalMs) as any;
      }
    };

    // Perform first hit immediately
    console.log('[TrainingSystem] Starting training loop');
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
      console.warn('[TrainingSystem] Pickaxe animation failed:', error);
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

    state.isTraining = false;
    state.animationPlaying = false;
    
    // Clear interval/timeout if it exists
    if (state.intervalId) {
      clearTimeout(state.intervalId);
      state.intervalId = undefined;
    }

    this.trainingStates.delete(player);
    console.log(`[TrainingSystem] Player stopped training`);
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

