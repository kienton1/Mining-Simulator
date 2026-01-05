/**
 * Training Controller
 * 
 * Handles player interaction with training rocks.
 * Detects proximity, manages training state, and coordinates between systems.
 * 
 * This is the main entry point for the training system.
 */

import { World, Player, SceneUI, Entity } from 'hytopia';
import { TrainingSystem } from './TrainingSystem';
import { TrainingRockManager } from './TrainingRockManager';
import type { TrainingRockLocation } from './TrainingRockManager';
import { TrainingRockTier } from './TrainingRockData';
import type { TrainingRockData } from './TrainingRockData';
import { detectTrainingRockPlacements } from './TrainingRockLocator';
import { GameManager } from '../../Core/GameManager';
import type { PlayerData } from '../../Core/PlayerData';
import { calculatePowerGainPerHit } from '../../Stats/StatCalculator';

const FALLBACK_TRAINING_ROCKS: Array<{
  position: { x: number; y: number; z: number };
  bounds: TrainingRockLocation['bounds'];
  tier: TrainingRockTier;
}> = [
  {
    tier: TrainingRockTier.DIRT, // cobblestone block → +1 Power
    position: { x: -11.5, y: 2.5, z: -10.5 }, // cobblestone at x:-12, y:2, z:-11
    bounds: { minX: -13, maxX: -11, minZ: -12, maxZ: -8 }, // Interact area: (-13,1,-12) to (-11,1,-8)
  },
  {
    tier: TrainingRockTier.COBBLESTONE, // deepslate-iron-ore → +3 Power
    position: { x: -7.5, y: 2.5, z: -10.5 }, // deepslate-iron-ore at x:-8, y:2, z:-11
    bounds: { minX: -9, maxX: -5, minZ: -12, maxZ: -6 }, // Dirt patch bounds (from map.json)
  },
  {
    tier: TrainingRockTier.IRON_DEEPSLATE, // deepslate-gold-ore → +15 Power
    position: { x: -3.5, y: 2.5, z: -10.5 }, // deepslate-gold-ore at x:-4, y:2, z:-11
    bounds: { minX: -5, maxX: -1, minZ: -12, maxZ: -6 }, // Dirt patch bounds (from map.json)
  },
  {
    tier: TrainingRockTier.GOLD_DEEPSLATE, // deepslate-diamond-ore → +45 Power
    position: { x: 3.5, y: 2.5, z: -10.5 }, // deepslate-diamond-ore at x:3, y:2, z:-11
    bounds: { minX: 2, maxX: 6, minZ: -12, maxZ: -6 }, // Dirt patch bounds (from map.json)
  },
  {
    tier: TrainingRockTier.DIAMOND_DEEPSLATE, // deepslate-emerald-ore → +80 Power
    position: { x: 7.5, y: 2.5, z: -10.5 }, // deepslate-emerald-ore at x:7, y:2, z:-11
    bounds: { minX: 6, maxX: 10, minZ: -12, maxZ: -6 }, // Dirt patch bounds (from map.json)
  },
  {
    tier: TrainingRockTier.EMERALD_DEEPSLATE, // deepslate-ruby-ore → +175 Power
    position: { x: 11.5, y: 2.5, z: -10.5 }, // deepslate-ruby-ore at x:11, y:2, z:-11
    bounds: { minX: 10, maxX: 14, minZ: -12, maxZ: -6 }, // Dirt patch bounds (from map.json)
  },
];

const INTERACT_INPUTS: string[] = ['e', 'ml'];

interface PlayerTrainingState {
  intervalId: NodeJS.Timeout;
  nearbyRockId?: string;
  promptVisible: boolean;
  promptCanTrain?: boolean;
  interactHeld: boolean;
  velocityCheckInterval?: NodeJS.Timeout;
  trainingRockLocation?: TrainingRockLocation;
  trainingStartPosition?: { x: number; y: number; z: number }; // Position after teleport (for movement detection baseline)
  originalPosition?: { x: number; y: number; z: number }; // Original position before teleport (for restoration)
}

/**
 * Training Controller class
 * Coordinates training system, rock manager, and game manager
 */
export class TrainingController {
  private world: World;
  private trainingSystem: TrainingSystem;
  private rockManager: TrainingRockManager;
  private gameManager: GameManager;
  private trainingRockSpawns: Array<{
    position: { x: number; y: number; z: number };
    tier: TrainingRockTier;
    bounds?: TrainingRockLocation['bounds'];
  }>;
  private playerStates: Map<Player, PlayerTrainingState> = new Map();
  private rockSceneUIs: Map<string, SceneUI> = new Map(); // Map of rock ID -> SceneUI
  private readonly PROXIMITY_CHECK_INTERVAL = 200; // ms

  /**
   * Creates a new TrainingController instance
   * 
   * @param world - Hytopia world instance
   * @param gameManager - Game manager instance
   */
  constructor(world: World, gameManager: GameManager) {
    this.world = world;
    this.gameManager = gameManager;
    this.trainingSystem = new TrainingSystem();
    this.trainingSystem.setWorld(world); // Pass world to training system for pickaxe access
    this.rockManager = new TrainingRockManager(world);

    const dynamicSpawns = detectTrainingRockPlacements();
    this.trainingRockSpawns = dynamicSpawns.length ? dynamicSpawns : FALLBACK_TRAINING_ROCKS;

    if (dynamicSpawns.length === 0) {
    } else {
    }

    this.rockManager.registerTrainingRocksFromMap(this.trainingRockSpawns);
    
    // Create SceneUIs for all training rocks immediately (always visible)
    // Delay slightly to ensure client templates are registered
    setTimeout(() => {
      this.initializeAllRockSceneUIs();
    }, 1000);
  }

  /**
   * Initializes SceneUIs for all training rocks
   * These are always visible, not dependent on player proximity
   */
  private initializeAllRockSceneUIs(): void {
    const allRocks = this.rockManager.getAllTrainingRocks();
    for (const rock of allRocks) {
      const sceneUI = this.ensureRockSceneUI(rock.rockData.id, rock);
      
      // Format power requirement (use K for thousands)
      let powerReqText = rock.rockData.requiredPower.toLocaleString();
      if (rock.rockData.requiredPower >= 1000) {
        const kValue = (rock.rockData.requiredPower / 1000).toFixed(rock.rockData.requiredPower % 1000 === 0 ? 0 : 1);
        powerReqText = `${kValue}K`;
      }
      
      // Set initial state with base power gain (no player-specific calculation)
      const powerGainText = `+${rock.rockData.powerGainMultiplier} Power`;
      const requirementText = `${powerReqText} Required`;
      const rebirthText = `${rock.rockData.requiredRebirths} Rebirths`;
      
      sceneUI.setState({
        visible: true,
        requirementText,
        rebirthText,
        powerGainText,
        canTrain: true, // Always show as trainable (access check happens on interaction)
      });
    }
    
    // Set up periodic position updates to keep SceneUIs anchored to their rocks
    setInterval(() => {
      for (const rock of allRocks) {
        this.updateRockSceneUIPosition(rock.rockData.id, rock);
      }
    }, 1000); // Update position every second to ensure it stays anchored
  }
  
  private ensureRockSceneUI(rockId: string, rockLocation: TrainingRockLocation): SceneUI {
    let sceneUI = this.rockSceneUIs.get(rockId);
    if (sceneUI) {
      // Update position to ensure it stays anchored to the rock
      const { x, y, z } = rockLocation.position;
      const uiPos = {
        x,
        y: y + 3.5, // float above rock (lowered from 4.5, matching updateRockSceneUIPosition)
        z,
      };
      sceneUI.setPosition(uiPos);
      return sceneUI;
    }
  
    // Use the rock's actual world position with offset above the rock
    const { x, y, z } = rockLocation.position;
    const uiPos = {
      x,
      y: y + 2.5, // float above rock
      z,
    };

    sceneUI = new SceneUI({
      templateId: 'training:prompt',
      viewDistance: 64,
      position: uiPos,
      state: {
        visible: true,
        title: rockLocation.rockData.name,
        subtitle: 'Hold E to train',
        actionKey: 'E',
        canTrain: true,
      },
    });

    sceneUI.load(this.world);
    this.rockSceneUIs.set(rockId, sceneUI);
    
    // Store the rock position for periodic updates to keep it anchored
    this.updateRockSceneUIPosition(rockId, rockLocation);
    
    return sceneUI;
  }

  /**
   * Updates SceneUI position to keep it anchored to the rock
   * Called periodically to ensure the UI stays in the correct position
   */
  private updateRockSceneUIPosition(rockId: string, rockLocation: TrainingRockLocation): void {
    const sceneUI = this.rockSceneUIs.get(rockId);
    if (!sceneUI) return;

    const { x, y, z } = rockLocation.position;
    const uiPos = {
      x,
      y: y + 3.5, // float above rock (lowered from 4.5)
      z,
    };
    sceneUI.setPosition(uiPos);
  }
  

  /**
   * Registers a player so we can track proximity + interact state
   */
  registerPlayer(player: Player): void {
    if (this.playerStates.has(player)) return;
    const intervalId = setInterval(() => this.updatePlayerProximity(player), this.PROXIMITY_CHECK_INTERVAL);
    this.playerStates.set(player, {
      intervalId,
      promptVisible: false,
      interactHeld: false,
    });
  }

  /**
   * Starts training for a player
   * 
   * @param player - Player who wants to train
   * @param rockLocation - Training rock location to train on (optional, will find nearby if not provided)
   * @returns True if training started successfully
   */
  startTraining(player: Player, rockLocation?: TrainingRockLocation): boolean {
    if (this.trainingSystem.isPlayerTraining(player)) {
      return true;
    }

    const playerData = this.gameManager.getPlayerData(player);
    if (!playerData) {
      return false;
    }

    // If no rock location provided, find nearby rock
    let targetRock: TrainingRockLocation | null = rockLocation || null;
    if (!targetRock) {
      targetRock = this.getNearbyTrainingRock(player);
      if (!targetRock) {
        return false;
      }
    }

    // Verify player is still near the rock (proximity check)
    const playerEntity = this.getPlayerEntity(player);
    if (!playerEntity) {
      return false;
    }

    const nearbyRock = this.rockManager.findNearbyTrainingRock(playerEntity.position);
    if (!nearbyRock || nearbyRock.rockData.id !== targetRock.rockData.id) {
      return false;
    }

    // Check if player can access this rock
    const access = this.getAccessState(playerData, targetRock.rockData);
    if (!access.canTrain) {
      this.showInteractPrompt(player, targetRock, access);
      return false;
    }

    // Get player's pickaxe
    const pickaxe = this.gameManager.getPlayerPickaxe(player);
    if (!pickaxe) {
      return false;
    }

    // Store original position before teleporting (for restoration on exit)
    const originalPosition = { ...playerEntity.position };
    
    // Move player next to the rock so swings visibly hit it
    // Teleport to same X as the ore block, but with fixed Y and Z positions
    const standPosition = {
      x: targetRock.position.x, // Same X as the ore block
      y: 1.75, // Fixed Y position
      z: -9.27, // Fixed Z position (forward of the ore blocks)
    };
    playerEntity.setPosition(standPosition);

    // Hide prompt while training (both regular and SceneUI)
    this.hideInteractPrompt(player);
    this.hideRockSceneUI(targetRock.rockData.id);

    // Store the training rock location and positions
    const state = this.playerStates.get(player);
    if (state) {
      state.trainingRockLocation = targetRock || undefined;
      // Store the teleported position as start position (so movement detection uses it as baseline)
      // This prevents the teleport from triggering movement detection
      state.trainingStartPosition = standPosition;
      // Store original position separately for restoration
      state.originalPosition = originalPosition;
    }

    // Start velocity monitoring to detect movement (including jumping)
    this.startVelocityMonitoring(player, targetRock);

    // Start training loop
    this.trainingSystem.startTraining(
      player,
      targetRock.rockData,
      pickaxe,
      playerData,
      playerEntity,
      (p, powerGain) => {
        // Pet system integration:
        // Training formula: finalGain = baseGain * sumMultipliers
        // (with "no pets equipped" treated as 1x)
        const multiplierSum = this.gameManager.getPetManager().getTrainingMultiplierSum(p);
        let finalGain = powerGain * multiplierSum;
        
        // Safety check: ensure final gain is a valid finite number
        // Prevent Infinity, NaN, or negative values that could cause overflow
        if (!Number.isFinite(finalGain) || finalGain < 0) {
          finalGain = 0;
        }
        
        // Cap final gain to prevent 32-bit signed int overflow (max safe value)
        const MAX_SAFE_POWER_GAIN = 2147483647; // 2^31 - 1
        if (finalGain > MAX_SAFE_POWER_GAIN) {
          finalGain = MAX_SAFE_POWER_GAIN;
        }
        
        const newTotal = this.gameManager.addPower(p, finalGain);
        this.sendPowerGainEvent(p, finalGain, newTotal, targetRock.position);
      }
    );

    player.ui.sendData({
      type: 'TRAINING_STATE',
      isTraining: true,
      rockName: targetRock.rockData.name,
    });
    return true;
  }

  /**
   * Stops training for a player
   * 
   * @param player - Player to stop training for
   */
  stopTraining(player: Player): void {
    if (!this.trainingSystem.isPlayerTraining(player)) return;
    
    const rockName = this.trainingSystem.getPlayerTrainingRock(player)?.name || 'unknown rock';
    
    // Stop velocity monitoring
    this.stopVelocityMonitoring(player);
    
    this.trainingSystem.stopTraining(player);
    
    // Restore player position: teleport down by 1 block to counteract the +1 block teleport on start
    const playerEntity = this.getPlayerEntity(player);
    const state = this.playerStates.get(player);
    if (playerEntity && state) {
      // Get original position before teleport (stored separately)
      if (state.originalPosition) {
        // Teleport down by 1 block from original position to counteract the +1 teleport on start
        const restorePosition = {
          x: state.originalPosition.x,
          y: Math.max(0, state.originalPosition.y - 1), // One block down (but not below ground)
          z: state.originalPosition.z,
        };
        playerEntity.setPosition(restorePosition);
      } else if (state.trainingStartPosition) {
        // Fallback: use trainingStartPosition and teleport down by 1
        const restorePosition = {
          x: state.trainingStartPosition.x,
          y: Math.max(0, state.trainingStartPosition.y - 1), // One block down
          z: state.trainingStartPosition.z,
        };
        playerEntity.setPosition(restorePosition);
      }
    }
    
    player.ui.sendData({
      type: 'TRAINING_STATE',
      isTraining: false,
    });
    // Show prompt again if still in area
    if (state?.trainingRockLocation) {
      const currentNearbyRock = this.getNearbyTrainingRock(player);
      if (currentNearbyRock && currentNearbyRock.rockData.id === state.trainingRockLocation.rockData.id) {
        const playerData = this.gameManager.getPlayerData(player);
        if (playerData) {
          const access = this.getAccessState(playerData, currentNearbyRock.rockData);
          this.showInteractPrompt(player, currentNearbyRock, access);
          this.updateRockSceneUI(currentNearbyRock, access);
        }
      }
      // Clear training state
      state.trainingRockLocation = undefined;
      state.trainingStartPosition = undefined;
      state.originalPosition = undefined;
    }
  }

  /**
   * Checks if a player is currently training
   * 
   * @param player - Player to check
   * @returns True if player is training
   */
  isPlayerTraining(player: Player): boolean {
    return this.trainingSystem.isPlayerTraining(player);
  }

  /**
   * Gets the current training rock location a player is training on
   * 
   * @param player - Player to check
   * @returns Training rock location or null if not training
   */
  getCurrentTrainingRock(player: Player): TrainingRockLocation | null {
    const state = this.playerStates.get(player);
    return state?.trainingRockLocation || null;
  }

  /**
   * Gets the training rock manager (for registering rocks)
   * 
   * @returns Training rock manager instance
   */
  getRockManager(): TrainingRockManager {
    return this.rockManager;
  }

  /**
   * Gets nearby training rock for a player
   * 
   * @param player - Player to check
   * @returns Training rock location or null if none nearby
   */
  getNearbyTrainingRock(player: Player): TrainingRockLocation | null {
    const playerEntity = this.getPlayerEntity(player);
    if (!playerEntity) return null;
    return this.rockManager.findNearbyTrainingRock(playerEntity.position);
  }

  /**
   * Finds the best (highest tier) accessible training rock for a player
   * Used for auto-train functionality
   * 
   * @param player - Player to find best rock for
   * @returns Best accessible training rock location or null if none accessible
   */
  findBestAccessibleTrainingRock(player: Player): TrainingRockLocation | null {
    const playerData = this.gameManager.getPlayerData(player);
    if (!playerData) return null;

    // Get all training rocks
    const allRocks = this.rockManager.getAllTrainingRocks();
    
    // Filter to accessible rocks and sort by tier (highest first)
    // Tier order: EMERALD_DEEPSLATE > DIAMOND_DEEPSLATE > GOLD_DEEPSLATE > IRON_DEEPSLATE > COBBLESTONE > DIRT
    const tierOrder = {
      [TrainingRockTier.EMERALD_DEEPSLATE]: 5,
      [TrainingRockTier.DIAMOND_DEEPSLATE]: 4,
      [TrainingRockTier.GOLD_DEEPSLATE]: 3,
      [TrainingRockTier.IRON_DEEPSLATE]: 2,
      [TrainingRockTier.COBBLESTONE]: 1,
      [TrainingRockTier.DIRT]: 0,
    };

    const accessibleRocks = allRocks.filter(rock => {
      const access = this.getAccessState(playerData, rock.rockData);
      return access.canTrain;
    });

    if (accessibleRocks.length === 0) return null;

    // Sort by tier (highest first)
    accessibleRocks.sort((a, b) => {
      const tierA = tierOrder[a.rockData.tier] ?? -1;
      const tierB = tierOrder[b.rockData.tier] ?? -1;
      return tierB - tierA; // Descending order
    });

    return accessibleRocks[0]; // Return highest tier accessible rock
  }

  /**
   * Cleans up when player leaves
   * 
   * @param player - Player who left
   */
  cleanupPlayer(player: Player): void {
    this.stopTraining(player);
    const state = this.playerStates.get(player);
    if (state) {
      clearInterval(state.intervalId);
      if (state.promptVisible) {
        this.hideInteractPrompt(player);
      }
    }
    this.trainingSystem.cleanupPlayer(player);
    this.playerStates.delete(player);
    // SceneUIs are always visible, no need to update
  }

  /**
   * Cleans up the controller
   */
  cleanup(): void {
    for (const player of this.playerStates.keys()) {
      this.cleanupPlayer(player);
    }
  }

  /**
   * Periodically checks player proximity to trigger prompts + auto-train
   */
  private updatePlayerProximity(player: Player): void {
    const state = this.playerStates.get(player);
    if (!state) return;

    const playerEntity = this.getPlayerEntity(player);
    if (!playerEntity) {
      if (state.promptVisible) this.hideInteractPrompt(player);
      if (this.trainingSystem.isPlayerTraining(player)) this.stopTraining(player);
      state.nearbyRockId = undefined;
      return;
    }

    const rockLocation = this.rockManager.findNearbyTrainingRock(playerEntity.position);
    if (rockLocation) {
      const playerData = this.gameManager.getPlayerData(player);
      const access = this.getAccessState(playerData, rockLocation.rockData);
      this.updatePromptForPlayer(player, state, rockLocation, access);
      this.handleInteractInput(player, state, rockLocation, access);
    } else {
      if (state.promptVisible) {
        this.hideInteractPrompt(player);
      }
      state.nearbyRockId = undefined;
      state.promptCanTrain = undefined;
      if (this.trainingSystem.isPlayerTraining(player)) {
        this.stopTraining(player);
      }
    }
  }

  private updatePromptForPlayer(
    player: Player,
    state: PlayerTrainingState,
    rockLocation: TrainingRockLocation,
    access: { canTrain: boolean; meetsPower: boolean; meetsRebirth: boolean }
  ): void {
    // Don't show prompt if player is already training
    if (this.trainingSystem.isPlayerTraining(player)) {
      return;
    }

    this.showInteractPrompt(player, rockLocation, access);

    this.updateRockSceneUI(rockLocation, access);
    state.promptVisible = true;
    state.nearbyRockId = rockLocation.rockData.id;
    state.promptCanTrain = access.canTrain;
  }

  private handleInteractInput(
    player: Player,
    state: PlayerTrainingState,
    rockLocation: TrainingRockLocation,
    access: { canTrain: boolean }
  ): void {
    if (!access.canTrain) {
      state.interactHeld = false;
      return;
    }

    const input = player.input;
    const isPressed = INTERACT_INPUTS.some(key => Boolean(input?.[key]));

    if (isPressed && !state.interactHeld) {
      this.startTraining(player, rockLocation);
    }

    state.interactHeld = isPressed;
  }

  private showInteractPrompt(
    player: Player,
    rockLocation: TrainingRockLocation,
    access: { canTrain: boolean; meetsPower: boolean; meetsRebirth: boolean }
  ): void {
    // Show the bottom UI prompt with "Hold E to interact"
    player.ui.sendData({
      type: 'TRAINING_PROMPT',
      visible: true,
      rockName: rockLocation.rockData.name,
      requirements: {
        power: rockLocation.rockData.requiredPower,
        rebirths: rockLocation.rockData.requiredRebirths,
      },
      canTrain: access.canTrain,
      actionKey: 'E',
    });
  }

  private hideInteractPrompt(player: Player): void {
    // Hide bottom UI prompt (we're not using it anymore)
    player.ui.sendData({
      type: 'TRAINING_PROMPT',
      visible: false,
    });
    const state = this.playerStates.get(player);
    if (state) {
      state.promptVisible = false;
      state.promptCanTrain = undefined;
    }
  }

  private updateRockSceneUI(
    rockLocation: TrainingRockLocation,
    access: { canTrain: boolean; meetsPower: boolean; meetsRebirth: boolean }
  ): void {
    // SceneUIs are always visible now, so we don't need to update them based on proximity
    // The UI shows base requirements and power gain, which don't change
    return;
  }

  private hideRockSceneUI(rockId: string): void {
    // SceneUIs are always visible, so we don't hide them
    return;
  }
  
  private updateAllRockSceneUIs(): void {
    // SceneUIs are always visible now, no need to update based on player proximity
    // They show static information (requirements and base power gain)
    return;
  }

  private sendPowerGainEvent(player: Player, amount: number, totalPower: number, rockPosition?: { x: number; y: number; z: number }): void {
    player.ui.sendData({
      type: 'POWER_GAIN',
      amount,
      totalPower,
      rockPosition, // Send rock position so UI can anchor popup near it
    });
  }

  private getPlayerEntity(player: Player) {
    const entities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
    if (!entities.length) return undefined;
    return entities[0];
  }

  private getAccessState(playerData: PlayerData | undefined, rock: TrainingRockData) {
    const meetsPower = (playerData?.power ?? 0) >= rock.requiredPower;
    const meetsRebirth = (playerData?.rebirths ?? 0) >= rock.requiredRebirths;
    return {
      canTrain: meetsPower || meetsRebirth,
      meetsPower,
      meetsRebirth,
    };
  }

  /**
   * Starts monitoring player velocity to detect movement during training
   * 
   * @param player - Player to monitor
   * @param rockLocation - Training rock location being used
   */
  private startVelocityMonitoring(player: Player, rockLocation: TrainingRockLocation): void {
    const state = this.playerStates.get(player);
    if (!state) return;

    // Stop any existing monitoring
    this.stopVelocityMonitoring(player);

    // Check velocity every 100ms
    state.velocityCheckInterval = setInterval(() => {
      if (!this.trainingSystem.isPlayerTraining(player)) {
        this.stopVelocityMonitoring(player);
        return;
      }

      const playerEntity = this.getPlayerEntity(player);
      if (!playerEntity) {
        this.stopTraining(player);
        return;
      }

      // Get current position and compare to training start position
      const currentPos = playerEntity.position;
      const startPos = state.trainingStartPosition;
      
      if (!startPos) {
        // No start position stored, use rock position as fallback
        const rockPos = rockLocation.position;
        const dx = currentPos.x - rockPos.x;
        const dz = currentPos.z - rockPos.z;
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
        
        // Check for movement input
        const input = player.input;
        const isMoving = Boolean(
          input?.['w'] || input?.['a'] || input?.['s'] || input?.['d'] ||
          input?.['W'] || input?.['A'] || input?.['S'] || input?.['D'] ||
          input?.[' '] // Space bar for jumping
        );
        
        if (isMoving || horizontalDistance > 0.3) {
          this.stopTraining(player);
        }
        return;
      }
      
      // Calculate distance from start position (including Y for jumping detection)
      const dx = currentPos.x - startPos.x;
      const dy = currentPos.y - startPos.y;
      const dz = currentPos.z - startPos.z;
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
      const verticalDistance = Math.abs(dy);
      
      // Check for movement input (WASD or space/jump)
      const input = player.input;
      const isMoving = Boolean(
        input?.['w'] || input?.['a'] || input?.['s'] || input?.['d'] ||
        input?.['W'] || input?.['A'] || input?.['S'] || input?.['D'] ||
        input?.[' '] // Space bar for jumping
      );

      // Try to get velocity from entity if available
      let horizontalVelocity = 0;
      let verticalVelocity = 0;
      try {
        const velocity = (playerEntity as any).velocity;
        if (velocity) {
          const vx = velocity.x || 0;
          const vy = velocity.y || 0;
          const vz = velocity.z || 0;
          horizontalVelocity = Math.sqrt(vx * vx + vz * vz);
          verticalVelocity = Math.abs(vy);
        }
      } catch (e) {
        // Velocity not available, use position-based check
      }

      // Stop training if ANY movement detected:
      // - Horizontal movement input (WASD)
      // - Jump input (space)
      // - Horizontal velocity > 0.1
      // - Vertical velocity > 0.1 (jumping)
      // - Horizontal distance > 0.3 (walked)
      // - Vertical distance > 0.3 (jumped)
      const hasMovementInput = isMoving;
      const hasHorizontalMovement = horizontalVelocity > 0.1 || horizontalDistance > 0.3;
      const hasVerticalMovement = verticalVelocity > 0.1 || verticalDistance > 0.3;
      
      if (hasMovementInput || hasHorizontalMovement || hasVerticalMovement) {
        this.stopTraining(player);
      }
    }, 100);
  }

  /**
   * Stops velocity monitoring for a player
   * 
   * @param player - Player to stop monitoring
   */
  private stopVelocityMonitoring(player: Player): void {
    const state = this.playerStates.get(player);
    if (state?.velocityCheckInterval) {
      clearInterval(state.velocityCheckInterval);
      state.velocityCheckInterval = undefined;
    }
  }
}

