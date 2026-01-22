/**
 * Training Controller
 * 
 * Handles player interaction with training rocks.
 * Detects proximity, manages training state, and coordinates between systems.
 * 
 * This is the main entry point for the training system.
 */

import { World, Player, SceneUI, Entity } from 'hytopia';
import { toBigInt } from '../../Core/BigIntUtils';

/**
 * Formats a number with letter abbreviations (K, M, B, T, etc.) matching the UI formatNumber function
 * Limits to 1-2 decimal places and removes trailing zeros
 */
function formatNumber(value: number): string {
  if (value < 0) return '-' + formatNumber(-value);
  if (value === 0) return '0';
  
  // Helper to format with 1-2 decimal places and remove trailing zeros
  const formatWithSuffix = (num: number, suffix: string): string => {
    // Try 1 decimal place first
    const with1Dec = num.toFixed(1);
    if (with1Dec.endsWith('.0')) {
      // If it ends in .0, show as integer
      return Math.round(num).toString() + suffix;
    }
    // Try 2 decimal places if needed
    const with2Dec = num.toFixed(2);
    if (with2Dec.endsWith('.00')) {
      // If it ends in .00, show as integer
      return Math.round(num).toString() + suffix;
    }
    // Remove trailing zeros (e.g., 1.50 -> 1.5, 2.30 -> 2.3)
    return with2Dec.replace(/\.?0+$/, '') + suffix;
  };
  
  // Handle very large numbers
  if (value >= 1e36) {
    const num = value / 1e36;
    if (num >= 1000) return formatWithSuffix(num / 1000, 'UDe');
    return formatWithSuffix(num, 'UDe');
  }
  if (value >= 1e33) {
    const num = value / 1e33;
    if (num >= 1000) return formatWithSuffix(num / 1000, 'UDe');
    return formatWithSuffix(num, 'De');
  }
  if (value >= 1e30) {
    const num = value / 1e30;
    if (num >= 1000) return formatWithSuffix(num / 1000, 'De');
    return formatWithSuffix(num, 'No');
  }
  if (value >= 1e27) {
    const num = value / 1e27;
    if (num >= 1000) return formatWithSuffix(num / 1000, 'No');
    return formatWithSuffix(num, 'Oc');
  }
  if (value >= 1e24) {
    const num = value / 1e24;
    if (num >= 1000) return formatWithSuffix(num / 1000, 'Oc');
    return formatWithSuffix(num, 'Sp');
  }
  if (value >= 1e21) {
    const num = value / 1e21;
    if (num >= 1000) return formatWithSuffix(num / 1000, 'Sp');
    return formatWithSuffix(num, 'Sx');
  }
  if (value >= 1e18) {
    const num = value / 1e18;
    if (num >= 1000) return formatWithSuffix(num / 1000, 'Sx');
    return formatWithSuffix(num, 'Qn');
  }
  if (value >= 1e15) {
    const num = value / 1e15;
    if (num >= 1000) return formatWithSuffix(num / 1000, 'Qn');
    return formatWithSuffix(num, 'Q');
  }
  if (value >= 1e12) {
    const num = value / 1e12;
    if (num >= 1000) return formatWithSuffix(num / 1000, 'Q');
    return formatWithSuffix(num, 'T');
  }
  if (value >= 1e9) {
    const num = value / 1e9;
    if (num >= 1000) return formatWithSuffix(num / 1000, 'T');
    return formatWithSuffix(num, 'B');
  }
  if (value >= 1e6) {
    const num = value / 1e6;
    if (num >= 1000) return formatWithSuffix(num / 1000, 'B');
    return formatWithSuffix(num, 'M');
  }
  if (value >= 1e3) {
    const num = value / 1e3;
    if (num >= 1000) return formatWithSuffix(num / 1000, 'M');
    return formatWithSuffix(num, 'K');
  }
  // Less than 1000 - show as integer
  return Math.round(value).toString();
}
import path from 'node:path';
import { TrainingSystem } from './TrainingSystem';
import { TrainingRockManager } from './TrainingRockManager';
import type { TrainingRockLocation } from './TrainingRockManager';
import { TrainingRockTier } from './TrainingRockData';
import type { TrainingRockData } from './TrainingRockData';
import { detectTrainingRockPlacements } from './TrainingRockLocator';
import { GameManager } from '../../Core/GameManager';
import type { PlayerData } from '../../Core/PlayerData';
import { calculatePowerGainPerHit } from '../../Stats/StatCalculator';
import { 
  ISLAND2_TRAINING_ROCK_DATABASE,
  ISLAND2_BLOCK_TYPE_TO_TIER,
  getIsland2TrainingRockByTier,
  ISLAND2_TRAINING_ROCK_TIER,
  type Island2TrainingRockData,
  ISLAND3_TRAINING_ROCK_DATABASE,
  ISLAND3_BLOCK_TYPE_TO_TIER,
  getIsland3TrainingRockByTier,
  ISLAND3_TRAINING_ROCK_TIER,
  type Island3TrainingRockData,
} from '../../worldData/TrainingRocks';

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

/**
 * Fallback positions for Island 2 training rocks
 * Used when auto-detection from BeachMap.json fails
 * Exact positions from map.json with bounds calculated from nearby dirt patches
 */
const FALLBACK_ISLAND2_TRAINING_ROCKS: Array<{
  position: { x: number; y: number; z: number };
  bounds?: TrainingRockLocation['bounds'];
  tier: ISLAND2_TRAINING_ROCK_TIER;
}> = [
  {
    tier: ISLAND2_TRAINING_ROCK_TIER.DUNESTONE,
    position: { x: -298.52, y: 1.75, z: -8.35 },
    bounds: { minX: -300, maxX: -297, minZ: -11, maxZ: -6 }, // Bounds from nearby dirt patches in map.json
  },
  {
    tier: ISLAND2_TRAINING_ROCK_TIER.BARNACITE,
    position: { x: -294.44, y: 1.75, z: -8.37 },
    bounds: { minX: -296, maxX: -293, minZ: -11, maxZ: -6 }, // Bounds from nearby dirt patches in map.json
  },
  {
    tier: ISLAND2_TRAINING_ROCK_TIER.PRISMARINE,
    position: { x: -290.57, y: 1.75, z: -8.25 },
    bounds: { minX: -292, maxX: -289, minZ: -11, maxZ: -6 }, // Bounds from nearby dirt patches in map.json
  },
  {
    tier: ISLAND2_TRAINING_ROCK_TIER.BASALTITE,
    position: { x: -283.44, y: 1.75, z: -8.44 },
    bounds: { minX: -285, maxX: -282, minZ: -11, maxZ: -6 }, // Bounds from nearby dirt patches in map.json
  },
  {
    tier: ISLAND2_TRAINING_ROCK_TIER.WRECKITE,
    position: { x: -279.52, y: 1.75, z: -8.37 },
    bounds: { minX: -281, maxX: -278, minZ: -11, maxZ: -6 }, // Bounds from nearby dirt patches in map.json
  },
  {
    tier: ISLAND2_TRAINING_ROCK_TIER.TRADEWINDITE,
    position: { x: -275.47, y: 1.75, z: -8.29 },
    bounds: { minX: -277, maxX: -274, minZ: -11, maxZ: -6 }, // Bounds from nearby dirt patches in map.json
  },
];

/**
 * Fallback positions for Island 3 training rocks
 */
const FALLBACK_ISLAND3_TRAINING_ROCKS: Array<{
  position: { x: number; y: number; z: number };
  bounds?: TrainingRockLocation['bounds'];
  tier: ISLAND3_TRAINING_ROCK_TIER;
}> = [
  {
    tier: ISLAND3_TRAINING_ROCK_TIER.SULFURON,
    position: { x: -598.5, y: 2.5, z: -7.5 },
    bounds: { minX: -601, maxX: -597, minZ: -10, maxZ: -6 },
  },
  {
    tier: ISLAND3_TRAINING_ROCK_TIER.FUMARO,
    position: { x: -594.5, y: 2.5, z: -7.5 },
    bounds: { minX: -597, maxX: -593, minZ: -10, maxZ: -6 },
  },
  {
    tier: ISLAND3_TRAINING_ROCK_TIER.CHARBITE,
    position: { x: -590.5, y: 2.5, z: -7.5 },
    bounds: { minX: -593, maxX: -589, minZ: -10, maxZ: -6 },
  },
  {
    tier: ISLAND3_TRAINING_ROCK_TIER.MINTASH,
    position: { x: -583.5, y: 2.5, z: -7.5 },
    bounds: { minX: -586, maxX: -582, minZ: -10, maxZ: -6 },
  },
  {
    tier: ISLAND3_TRAINING_ROCK_TIER.MAGMAORB,
    position: { x: -579.5, y: 2.5, z: -7.5 },
    bounds: { minX: -582, maxX: -578, minZ: -10, maxZ: -6 },
  },
  {
    tier: ISLAND3_TRAINING_ROCK_TIER.INFERNON,
    position: { x: -575.5, y: 2.5, z: -7.5 },
    bounds: { minX: -578, maxX: -574, minZ: -10, maxZ: -6 },
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
    tier: TrainingRockTier | ISLAND2_TRAINING_ROCK_TIER | ISLAND3_TRAINING_ROCK_TIER;
    bounds?: TrainingRockLocation['bounds'];
    worldId?: string;
  }>;
  private playerStates: Map<Player, PlayerTrainingState> = new Map();
  private rockSceneUIs: Map<string, SceneUI> = new Map(); // Map of rock ID -> SceneUI
  private rockSceneUIInterval?: NodeJS.Timeout;
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

    // Detect Island 1 training rocks from map.json
    const island1Spawns = detectTrainingRockPlacements(undefined, 'island1');
    const island1Placements = island1Spawns.length ? island1Spawns : FALLBACK_TRAINING_ROCKS.map(rock => ({
      ...rock,
      worldId: 'island1' as const,
    }));

    // Use exact positions for Island 2 training rocks from map.json
    // These are the precise coordinates of the ore blocks in map.json
    // Auto-detection may be used in the future, but for now we use exact positions
    const island2Placements = FALLBACK_ISLAND2_TRAINING_ROCKS.map(rock => ({
      ...rock,
      worldId: 'island2' as const,
    }));

    // Detect Island 3 training rocks from map.json
    const island3Spawns = detectTrainingRockPlacements(undefined, 'island3');
    const island3Placements = island3Spawns.length ? island3Spawns : FALLBACK_ISLAND3_TRAINING_ROCKS.map(rock => ({
      ...rock,
      worldId: 'island3' as const,
    }));

    // Combine all placements
    this.trainingRockSpawns = [...island1Placements, ...island2Placements, ...island3Placements];

    // Register all training rocks (both Island 1 and Island 2)
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
      // Use unique ID that includes world ID to prevent conflicts between worlds
      const uniqueId = rock.worldId ? `${rock.worldId}:${rock.rockData.id}` : rock.rockData.id;
      const sceneUI = this.ensureRockSceneUI(uniqueId, rock);
      
      // Format power requirement with proper letter abbreviations (K, M, B, T, etc.)
      // Handle both Island 1 and Island 2 rock data
      const requiredPower = 'requiredPower' in rock.rockData ? rock.rockData.requiredPower : 0;
      const powerReqText = formatNumber(requiredPower);
      
      // Set initial state with base power gain (no player-specific calculation)
      // Handle both Island 1 (powerGainMultiplier) and Island 2 (uiPowerBonus) rocks
      const powerBonus = 'uiPowerBonus' in rock.rockData 
        ? rock.rockData.uiPowerBonus 
        : ('powerGainMultiplier' in rock.rockData ? rock.rockData.powerGainMultiplier : 1);
      const powerGainText = `+${formatNumber(powerBonus)} Power`;
      const requirementText = `${powerReqText} Required`;
      const requiredRebirths = 'requiredRebirths' in rock.rockData ? rock.rockData.requiredRebirths : 0;
      const rebirthText = `${formatNumber(requiredRebirths)} Rebirths`;
      
      sceneUI.setState({
        visible: true,
        requirementText,
        rebirthText,
        powerGainText,
        canTrain: true, // Always show as trainable (access check happens on interaction)
      });
    }
    
    // Set up periodic position updates to keep SceneUIs anchored to their rocks
    if (!this.rockSceneUIInterval) {
      this.rockSceneUIInterval = setInterval(() => {
        const rocks = this.rockManager.getAllTrainingRocks();
        for (const rock of rocks) {
          // Use unique ID that includes world ID
          const uniqueId = rock.worldId ? `${rock.worldId}:${rock.rockData.id}` : rock.rockData.id;
          this.updateRockSceneUIPosition(uniqueId, rock);
        }
      }, 1000); // Update position every second to ensure it stays anchored
    }
  }

  reloadSceneUIs(): void {
    for (const ui of this.rockSceneUIs.values()) {
      try {
        ui.unload();
      } catch {
        // ignore
      }
    }
    this.rockSceneUIs.clear();
    this.initializeAllRockSceneUIs();
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

    // Check if player is near the target rock (filter by world)
    const nearbyRock = this.getNearbyTrainingRock(player);
    if (!nearbyRock || nearbyRock.position.x !== targetRock.position.x || 
        nearbyRock.position.z !== targetRock.position.z) {
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
    
    // Get world ID to determine teleport position offset
    const worldId = playerData.currentWorld || 'island1';
    
    // Move player next to the rock so swings visibly hit it
    // Use original Y to avoid ground/air collisions on teleport
    const standPosition = worldId === 'island2' 
      ? {
          x: Math.round((targetRock.position.x + 0.02) * 10) / 10, // Rock X + 0.02, rounded to 1 decimal
          y: originalPosition.y,
          z: targetRock.position.z + 0.1, // Rock Z + 0.1 (moved forward to prevent clipping)
        }
      : worldId === 'island3'
        ? (() => {
            if (targetRock.bounds) {
              const centerX = (targetRock.bounds.minX + targetRock.bounds.maxX) / 2;
              const centerZ = (targetRock.bounds.minZ + targetRock.bounds.maxZ) / 2;
              return {
                x: Math.round(centerX * 10) / 10,
                y: originalPosition.y,
                z: Math.round(centerZ * 10) / 10,
              };
            }
            return {
              x: Math.round((targetRock.position.x + 0.02) * 10) / 10,
              y: originalPosition.y,
              z: targetRock.position.z + 0.1,
            };
          })()
      : {
          x: targetRock.position.x, // Same X as the ore block
          y: originalPosition.y,
          z: -9.27, // Fixed Z position (forward of the ore blocks, Island 1)
        };
    playerEntity.setPosition(standPosition);

    // Hide prompt while training (both regular and SceneUI)
    this.hideInteractPrompt(player);
    // Use unique ID that includes world ID
    const uniqueId = targetRock.worldId ? `${targetRock.worldId}:${targetRock.rockData.id}` : targetRock.rockData.id;
    this.hideRockSceneUI(uniqueId);

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

    // Determine hit rate based on world ID (already declared above)
    let hitRate = 2.0; // Default: Island 1 hit rate (2.0 hits/second)
    
    // Island 2 has different hit rates: 3/sec for rocks 1-5, 4/sec for rock 6
    if (worldId === 'island2') {
      // Island 2 has different hit rates: 3/sec for rocks 1-5, 4/sec for rock 6
      // Check the rock data to determine hit rate
      const rockData = targetRock.rockData as any; // Cast to access hitRate if it's Island 2 data
      
      // Island 2 training rock data has a hitRate property
      if (rockData.hitRate !== undefined) {
        hitRate = rockData.hitRate;
      } else {
        // Fallback: check rock ID to determine if it's Island 2 rock 6
        const rockId = targetRock.rockData.id;
        if (rockId === 'tradewindite-rock') {
          hitRate = 4.0; // Rock 6: 4 hits/second
        } else {
          hitRate = 3.0; // Rocks 1-5: 3 hits/second
        }
      }
    } else if (worldId === 'island3') {
      const rockData = targetRock.rockData as any;
      if (rockData.hitRate !== undefined) {
        hitRate = rockData.hitRate;
      }
    }

    // Create a unified rock data structure for TrainingSystem
    // TrainingSystem expects TrainingRockData, but we might have Island2/Island3 data
    let rockDataForSystem: TrainingRockData;
    if ((worldId === 'island2' || worldId === 'island3') && 'uiPowerBonus' in targetRock.rockData) {
      const rock = targetRock.rockData as Island2TrainingRockData | Island3TrainingRockData;
      rockDataForSystem = {
        id: rock.id,
        tier: rock.tier as any,
        name: rock.name,
        requiredRebirths: rock.requiredRebirths,
        requiredPower: rock.requiredPower,
        powerGainMultiplier: rock.uiPowerBonus,
      };
    } else {
      rockDataForSystem = targetRock.rockData as TrainingRockData;
    }
    
    // Start training loop
    this.trainingSystem.startTraining(
      player,
      rockDataForSystem,
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
        
        // Cap final gain to prevent overflow (using MAX_VALUE - very large but may lose precision for huge integers)
        const MAX_SAFE_POWER_GAIN = Number.MAX_VALUE; // ~1.7976931348623157e+308 (largest JavaScript number)
        if (finalGain > MAX_SAFE_POWER_GAIN) {
          finalGain = MAX_SAFE_POWER_GAIN;
        }
        
        const newTotal = this.gameManager.addPower(p, finalGain);
        this.sendPowerGainEvent(p, finalGain, newTotal, targetRock.position);
        this.gameManager.getTutorialManager().handleTrainingHit(p);
      },
      worldId,
      hitRate
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
    
    // Restore player position to original spot
    const playerEntity = this.getPlayerEntity(player);
    const state = this.playerStates.get(player);
    if (playerEntity && state) {
      // Get original position before teleport (stored separately)
      if (state.originalPosition) {
        const restorePosition = {
          x: state.originalPosition.x,
          y: state.originalPosition.y,
          z: state.originalPosition.z,
        };
        playerEntity.setPosition(restorePosition);
      } else if (state.trainingStartPosition) {
        const restorePosition = {
          x: state.trainingStartPosition.x,
          y: state.trainingStartPosition.y,
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
    
    const playerData = this.gameManager.getPlayerData(player);
    const currentWorld = playerData?.currentWorld || 'island1';
    
    // Find nearby rock and filter by current world
    const nearbyRock = this.rockManager.findNearbyTrainingRock(playerEntity.position);
    if (nearbyRock && nearbyRock.worldId === currentWorld) {
      return nearbyRock;
    }
    
    // If the found rock is for a different world, search for rocks in current world
    const allRocks = this.rockManager.getAllTrainingRocks();
    for (const rock of allRocks) {
      if (rock.worldId !== currentWorld) continue;
      
      // Check if player is within bounds
      if (rock.bounds) {
        const withinX = playerEntity.position.x >= rock.bounds.minX && playerEntity.position.x <= rock.bounds.maxX;
        const withinZ = playerEntity.position.z >= rock.bounds.minZ && playerEntity.position.z <= rock.bounds.maxZ;
        if (withinX && withinZ) {
          return rock;
        }
      }
    }
    
    return null;
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
    
    // Get current world to filter rocks
    const currentWorld = playerData.currentWorld || 'island1';
    
    // Filter rocks by world and accessibility
    const accessibleRocks = allRocks.filter(rock => {
      // Only consider rocks from current world
      if (rock.worldId !== currentWorld) return false;
      
      const access = this.getAccessState(playerData, rock.rockData);
      return access.canTrain;
    });

    if (accessibleRocks.length === 0) return null;

    // Sort by tier (highest first)
    // Island 1 tier order: EMERALD_DEEPSLATE > DIAMOND_DEEPSLATE > GOLD_DEEPSLATE > IRON_DEEPSLATE > COBBLESTONE > DIRT
    // Island 2 tier order: TRADEWINDITE > WRECKITE > BASALTITE > PRISMARINE > BARNACITE > DUNESTONE
    const tierOrderIsland1: Record<TrainingRockTier, number> = {
      [TrainingRockTier.EMERALD_DEEPSLATE]: 5,
      [TrainingRockTier.DIAMOND_DEEPSLATE]: 4,
      [TrainingRockTier.GOLD_DEEPSLATE]: 3,
      [TrainingRockTier.IRON_DEEPSLATE]: 2,
      [TrainingRockTier.COBBLESTONE]: 1,
      [TrainingRockTier.DIRT]: 0,
    };
    
    const tierOrderIsland2: Record<ISLAND2_TRAINING_ROCK_TIER, number> = {
      [ISLAND2_TRAINING_ROCK_TIER.TRADEWINDITE]: 5,
      [ISLAND2_TRAINING_ROCK_TIER.WRECKITE]: 4,
      [ISLAND2_TRAINING_ROCK_TIER.BASALTITE]: 3,
      [ISLAND2_TRAINING_ROCK_TIER.PRISMARINE]: 2,
      [ISLAND2_TRAINING_ROCK_TIER.BARNACITE]: 1,
      [ISLAND2_TRAINING_ROCK_TIER.DUNESTONE]: 0,
    };
    
    const tierOrderIsland3: Record<ISLAND3_TRAINING_ROCK_TIER, number> = {
      [ISLAND3_TRAINING_ROCK_TIER.INFERNON]: 5,
      [ISLAND3_TRAINING_ROCK_TIER.MAGMAORB]: 4,
      [ISLAND3_TRAINING_ROCK_TIER.MINTASH]: 3,
      [ISLAND3_TRAINING_ROCK_TIER.CHARBITE]: 2,
      [ISLAND3_TRAINING_ROCK_TIER.FUMARO]: 1,
      [ISLAND3_TRAINING_ROCK_TIER.SULFURON]: 0,
    };

    accessibleRocks.sort((a, b) => {
      // Use appropriate tier order based on world
      let tierA = -1;
      let tierB = -1;
      
      if (currentWorld === 'island1') {
        tierA = tierOrderIsland1[a.rockData.tier as TrainingRockTier] ?? -1;
        tierB = tierOrderIsland1[b.rockData.tier as TrainingRockTier] ?? -1;
      } else if (currentWorld === 'island2') {
        tierA = tierOrderIsland2[a.rockData.tier as ISLAND2_TRAINING_ROCK_TIER] ?? -1;
        tierB = tierOrderIsland2[b.rockData.tier as ISLAND2_TRAINING_ROCK_TIER] ?? -1;
      } else if (currentWorld === 'island3') {
        tierA = tierOrderIsland3[a.rockData.tier as ISLAND3_TRAINING_ROCK_TIER] ?? -1;
        tierB = tierOrderIsland3[b.rockData.tier as ISLAND3_TRAINING_ROCK_TIER] ?? -1;
      }
      
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

    const rockLocation = this.getNearbyTrainingRock(player);
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
      // Handle both Island 1 and Island 2 rock data
      const requiredPower = 'requiredPower' in rockLocation.rockData ? rockLocation.rockData.requiredPower : 0;
      const requiredRebirths = 'requiredRebirths' in rockLocation.rockData ? rockLocation.rockData.requiredRebirths : 0;
      
      player.ui.sendData({
        type: 'TRAINING_PROMPT',
        visible: true,
        rockName: rockLocation.rockData.name,
        requirements: {
          power: requiredPower,
          rebirths: requiredRebirths,
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

  private sendPowerGainEvent(player: Player, amount: number, totalPower: string, rockPosition?: { x: number; y: number; z: number }): void {
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

  private getAccessState(playerData: PlayerData | undefined, rock: TrainingRockData | Island2TrainingRockData | Island3TrainingRockData) {
    // Handle Island 1 (TrainingRockData), Island 2 (Island2TrainingRockData), and Island 3 (Island3TrainingRockData) rocks
    const requiredPower = 'requiredPower' in rock ? rock.requiredPower : 0;
    const requiredRebirths = 'requiredRebirths' in rock ? rock.requiredRebirths : 0;
    
    // Convert power string (BigInt) to number for comparison with requiredPower
    const playerPower = playerData?.power ? Number(playerData.power) : 0;
    const meetsPower = playerPower >= requiredPower;
    const meetsRebirth = (playerData?.rebirths ?? 0) >= requiredRebirths;
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

