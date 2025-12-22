/**
 * Game Manager
 * 
 * Main game state manager. Handles player data, initialization,
 * and coordinates between different game systems.
 * 
 * Reference: Planning/fileStructure.md - Core/GameManager
 */

import { World, Player, PlayerUIEvent, Entity } from 'hytopia';
import type { PlayerData } from './PlayerData';
import { createDefaultPlayerData } from './PlayerData';
import { getPickaxeByTier } from '../Pickaxe/PickaxeDatabase';
import { TrainingController } from '../Surface/Training/TrainingController';
import { MiningController } from '../Mining/MiningController';
import { OreType } from '../Mining/Ore/OreData';
import { MINING_AREA_BOUNDS, SHARED_MINE_SHAFT, MINE_DEPTH_START } from './GameConstants';
import { InventoryManager } from '../Inventory/InventoryManager';
import { SellingSystem } from '../Shop/SellingSystem';
import { PickaxeShop } from '../Shop/PickaxeShop';
import { PickaxeManager } from '../Pickaxe/PickaxeManager';
import { PlayerDataPersistence } from './PersistenceManager';

/**
 * Game Manager class
 * Manages the overall game state and player data
 */
/**
 * Auto mode state for a player
 */
interface PlayerAutoState {
  autoMineEnabled: boolean;
  autoTrainEnabled: boolean;
  autoMineInterval?: NodeJS.Timeout;
  autoTrainStopCheckInterval?: NodeJS.Timeout;
  lastAutoMinePosition?: { x: number; y: number; z: number };
  lastAutoTrainPosition?: { x: number; y: number; z: number };
}

export class GameManager {
  private world: World;
  private playerDataMap: Map<Player, PlayerData> = new Map();
  private playerAutoStates: Map<Player, PlayerAutoState> = new Map();
  private trainingController?: TrainingController;
  private miningController?: MiningController;
  private inventoryManager: InventoryManager;
  private sellingSystem: SellingSystem;
  private pickaxeShop: PickaxeShop;
  private pickaxeManager: PickaxeManager;
  private mineEntranceIntervals: Map<Player, NodeJS.Timeout> = new Map();
  private mineEntranceCooldowns: Map<Player, number> = new Map();
  private readonly MINE_ENTRANCE_COOLDOWN_MS = 1500;
  
  // Mine reset timer system (per-player)
  private mineResetTimers: Map<Player, NodeJS.Timeout> = new Map();
  private mineResetTimerIntervals: Map<Player, NodeJS.Timeout> = new Map();
  private mineResetStartTimes: Map<Player, number> = new Map();
  private readonly MINE_RESET_DURATION_MS = 120000; // 2 minutes
  private readonly MINE_RESET_DURATION_UPGRADED_MS = 300000; // 5 minutes (upgraded)
  
  // Debounced save timers per player
  private saveTimers: Map<Player, NodeJS.Timeout> = new Map();
  private readonly SAVE_DEBOUNCE_MS = 2000; // Save at most once per 2 seconds per player
  
  // Periodic save interval
  private periodicSaveInterval?: NodeJS.Timeout;
  private readonly PERIODIC_SAVE_MS = 30000; // Save all players every 30 seconds

  /**
   * Creates a new GameManager instance
   * 
   * @param world - Hytopia world instance
   * @param pickaxeManager - Pickaxe manager instance
   */
  constructor(world: World, pickaxeManager: PickaxeManager) {
    this.world = world;
    this.pickaxeManager = pickaxeManager;
    
    // Initialize inventory and shop systems
    this.inventoryManager = new InventoryManager();
    this.sellingSystem = new SellingSystem(this.inventoryManager);
    this.pickaxeShop = new PickaxeShop(pickaxeManager);
    
    // Set up callbacks for inventory and shop systems
    this.inventoryManager.setGetPlayerDataCallback((player) => this.getPlayerData(player));
    this.inventoryManager.setUpdatePlayerDataCallback((player, data) => this.updatePlayerData(player, data));
    
    this.sellingSystem.setGetPlayerDataCallback((player) => this.getPlayerData(player));
    this.sellingSystem.setUpdatePlayerDataCallback((player, data) => this.updatePlayerData(player, data));
    
    this.pickaxeShop.setGetPlayerDataCallback((player) => this.getPlayerData(player));
    this.pickaxeShop.setUpdatePlayerDataCallback((player, data) => this.updatePlayerData(player, data));
    
    // Initialize training system
    this.trainingController = new TrainingController(world, this);
    // Initialize mining system
    this.miningController = new MiningController(world, this);
    
    // Start periodic save mechanism
    this.startPeriodicSaves();
    
    // Note: UI event handlers are now set up per-player in index.ts
    // This follows the Hytopia SDK pattern of using player.ui.on() instead of world.on()
  }

  /**
   * Initializes player data synchronously with defaults
   * Used for immediate entity spawning (required for camera to work)
   * 
   * @param player - Player who joined
   * @returns Default player data
   */
  initializePlayerSync(player: Player): PlayerData {
    // Create default data immediately (synchronous)
    const playerData = createDefaultPlayerData();
    
    this.playerDataMap.set(player, playerData);
    
    // Initialize auto state
    this.playerAutoStates.set(player, {
      autoMineEnabled: false,
      autoTrainEnabled: false,
    });
    
    this.trainingController?.registerPlayer(player);
    return playerData;
  }

  /**
   * Loads player data from persistence asynchronously
   * Called after entity spawn to avoid blocking camera setup
   * 
   * @param player - Player to load data for
   * @returns Promise that resolves to loaded player data (or null if no saved data)
   */
  async initializePlayerAsync(player: Player): Promise<PlayerData | null> {
    // Try to load saved data using Hytopia's PersistenceManager.instance
    const savedData = await PlayerDataPersistence.loadPlayerData(player);
    
    if (savedData) {
      // Update existing player data with loaded data
      this.playerDataMap.set(player, savedData);
      return savedData;
    }
    
    // No saved data, keep defaults
    return null;
  }

  /**
   * Initializes player data when they join
   * Loads from persistence if available, otherwise creates default data
   * 
   * @deprecated Use initializePlayerSync() + initializePlayerAsync() instead
   * @param player - Player who joined
   * @returns Promise that resolves to player's data (new or existing)
   */
  async initializePlayer(player: Player): Promise<PlayerData> {
    // Try to load saved data using Hytopia's PersistenceManager.instance
    const savedData = await PlayerDataPersistence.loadPlayerData(player);
    
    // Use saved data if available, otherwise use defaults
    const playerData = savedData || createDefaultPlayerData();
    
    this.playerDataMap.set(player, playerData);
    
    // Initialize auto state
    this.playerAutoStates.set(player, {
      autoMineEnabled: false,
      autoTrainEnabled: false,
    });
    
    this.trainingController?.registerPlayer(player);
    return playerData;
  }

  /**
   * Gets player data
   * 
   * @param player - Player to get data for
   * @returns Player's data or undefined if not found
   */
  getPlayerData(player: Player): PlayerData | undefined {
    return this.playerDataMap.get(player);
  }

  /**
   * Updates player data and schedules a debounced save
   * 
   * @param player - Player to update
   * @param data - New player data
   */
  updatePlayerData(player: Player, data: PlayerData): void {
    this.playerDataMap.set(player, data);
    this.scheduleSave(player);
  }
  
  /**
   * Schedules a debounced save for a player
   * Prevents excessive saves by batching rapid changes
   * 
   * @param player - Player to save data for
   */
  private scheduleSave(player: Player): void {
    // Clear existing timer if any
    const existingTimer = this.saveTimers.get(player);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Schedule new save
    const timer = setTimeout(async () => {
      const playerData = this.playerDataMap.get(player);
      if (playerData) {
        await PlayerDataPersistence.savePlayerData(player, playerData);
      }
      this.saveTimers.delete(player);
    }, this.SAVE_DEBOUNCE_MS);
    
    this.saveTimers.set(player, timer);
  }
  
  /**
   * Immediately saves player data (used for critical saves like disconnect)
   * 
   * @param player - Player to save data for
   * @returns Promise that resolves when save completes
   */
  async savePlayerData(player: Player): Promise<boolean> {
    // Clear any pending debounced save
    const existingTimer = this.saveTimers.get(player);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.saveTimers.delete(player);
    }
    
    const playerData = this.playerDataMap.get(player);
    if (!playerData) {
      console.warn(`[GameManager] Cannot save - no data for player ${player.username}`);
      return false;
    }
    
    return await PlayerDataPersistence.savePlayerData(player, playerData);
  }
  
  /**
   * Starts periodic save mechanism
   * Saves all active players every PERIODIC_SAVE_MS
   */
  private startPeriodicSaves(): void {
    this.periodicSaveInterval = setInterval(async () => {
      const playersToSave = Array.from(this.playerDataMap.keys());
      console.log(`[GameManager] Periodic save: saving ${playersToSave.length} players`);
      
      for (const player of playersToSave) {
        const playerData = this.playerDataMap.get(player);
        if (playerData) {
          // Use savePlayerData directly (bypasses debounce for periodic saves)
          await PlayerDataPersistence.savePlayerData(player, playerData);
        }
      }
    }, this.PERIODIC_SAVE_MS);
  }

  /**
   * Adds power to player
   * 
   * @param player - Player to add power to
   * @param amount - Amount of power to add
   */
  addPower(player: Player, amount: number): number {
    const data = this.getPlayerData(player);
    if (!data) {
      console.warn('[GameManager] Cannot add power - no player data');
      return 0;
    }

    const oldPower = data.power;
    data.power += amount;
    this.updatePlayerData(player, data);
    console.log(`[GameManager] Added ${amount} power. Old: ${oldPower}, New: ${data.power}`);
    this.sendPowerStatsToUI(player);
    return data.power;
  }

  /**
   * Adds gold to player
   * 
   * @param player - Player to add gold to
   * @param amount - Amount of gold to add
   */
  addGold(player: Player, amount: number): void {
    const data = this.getPlayerData(player);
    if (data) {
      data.gold += amount;
      this.updatePlayerData(player, data);
      // Send gold update to UI
      player.ui.sendData({
        type: 'GOLD_STATS',
        gold: data.gold,
      });
    }
  }

  /**
   * Gets player's current pickaxe
   * 
   * @param player - Player to get pickaxe for
   * @returns Pickaxe data or undefined if not found
   */
  getPlayerPickaxe(player: Player) {
    const data = this.getPlayerData(player);
    if (!data) return undefined;
    return getPickaxeByTier(data.currentPickaxeTier);
  }

  /**
   * Gets the training controller
   * 
   * @returns Training controller instance
   */
  getTrainingController(): TrainingController | undefined {
    return this.trainingController;
  }

  /**
   * Gets the mining controller
   * 
   * @returns Mining controller instance
   */
  getMiningController(): MiningController | undefined {
    return this.miningController;
  }

  /**
   * Adds ore to player's inventory
   * Uses InventoryManager for consistency
   * 
   * @param player - Player to add ore to
   * @param oreType - Type of ore to add
   * @param amount - Amount of ore to add
   */
  addOreToInventory(player: Player, oreType: OreType, amount: number): void {
    this.inventoryManager.addOre(player, oreType, amount);
  }

  /**
   * Gets the inventory manager instance
   * 
   * @returns Inventory manager
   */
  getInventoryManager(): InventoryManager {
    return this.inventoryManager;
  }

  /**
   * Gets the selling system instance
   * 
   * @returns Selling system
   */
  getSellingSystem(): SellingSystem {
    return this.sellingSystem;
  }

  /**
   * Gets the pickaxe shop instance
   * 
   * @returns Pickaxe shop
   */
  getPickaxeShop(): PickaxeShop {
    return this.pickaxeShop;
  }

  /**
   * Calculates the cost for a single rebirth
   * Formula: BASE_COST × (1.1 ^ currentRebirths)
   * 
   * @param currentRebirths - Current number of rebirths
   * @returns Cost in power
   */
  calculateRebirthCost(currentRebirths: number): number {
    const BASE_COST = 1500;
    return BASE_COST * Math.pow(1.1, currentRebirths);
  }

  /**
   * Calculates the total cost for multiple rebirths
   * 
   * @param currentRebirths - Current number of rebirths
   * @param count - Number of rebirths to perform
   * @returns Total cost in power
   */
  calculateRebirthCostMultiple(currentRebirths: number, count: number): number {
    let totalCost = 0;
    for (let i = 0; i < count; i++) {
      totalCost += this.calculateRebirthCost(currentRebirths + i);
    }
    return totalCost;
  }

  /**
   * Calculates the maximum number of rebirths a player can afford
   * 
   * @param player - Player to check
   * @returns Maximum affordable rebirths
   */
  calculateMaxRebirths(player: Player): number {
    const playerData = this.getPlayerData(player);
    if (!playerData) return 0;

    let maxRebirths = 0;
    let totalCost = 0;
    const currentRebirths = playerData.rebirths;
    const currentPower = playerData.power;

    while (true) {
      const nextCost = this.calculateRebirthCost(currentRebirths + maxRebirths);
      if (totalCost + nextCost > currentPower) {
        break; // Can't afford more
      }
      totalCost += nextCost;
      maxRebirths++;
      
      // Safety limit
      if (maxRebirths > 1000) break;
    }

    return maxRebirths;
  }

  /**
   * Gets rebirth UI data for a player
   * 
   * @param player - Player requesting rebirth data
   * @returns Rebirth UI data
   */
  getRebirthUIData(player: Player): {
    currentPower: number;
    currentRebirths: number;
    options: Array<{
      count: number;
      cost: number;
      available: boolean;
    }>;
    maxRebirths: number;
    maxCost: number;
  } {
    const playerData = this.getPlayerData(player);
    if (!playerData) {
      return {
        currentPower: 0,
        currentRebirths: 0,
        options: [],
        maxRebirths: 0,
        maxCost: 0,
      };
    }

    const currentPower = playerData.power;
    const currentRebirths = playerData.rebirths;
    const maxRebirths = this.calculateMaxRebirths(player);
    const maxCost = this.calculateRebirthCostMultiple(currentRebirths, maxRebirths);

    // Predefined options: 1, 5, 20, and max
    const predefinedCounts = [1, 5, 20];
    const options = predefinedCounts.map(count => {
      const cost = this.calculateRebirthCostMultiple(currentRebirths, count);
      return {
        count,
        cost,
        available: currentPower >= cost,
      };
    });

    // Add max option
    if (maxRebirths > 0) {
      options.push({
        count: maxRebirths,
        cost: maxCost,
        available: true,
      });
    }

    return {
      currentPower,
      currentRebirths,
      options,
      maxRebirths,
      maxCost,
    };
  }

  /**
   * Performs a rebirth for a player
   * 
   * @param player - Player performing rebirth
   * @param count - Number of rebirths to perform
   * @returns Result of rebirth attempt
   */
  performRebirth(player: Player, count: number): {
    success: boolean;
    message?: string;
    rebirthsPerformed?: number;
    newRebirths?: number;
    powerSpent?: number;
    newPower?: number;
  } {
    const playerData = this.getPlayerData(player);
    if (!playerData) {
      return {
        success: false,
        message: 'Player data not found',
      };
    }

    const currentRebirths = playerData.rebirths;
    const totalCost = this.calculateRebirthCostMultiple(currentRebirths, count);

    if (playerData.power < totalCost) {
      return {
        success: false,
        message: `Insufficient power. Need ${totalCost.toLocaleString()}, have ${playerData.power.toLocaleString()}`,
      };
    }

    // Deduct cost
    playerData.power -= totalCost;

    // Reset power to base (1) after rebirth
    playerData.power = 1;

    // Increase rebirths
    playerData.rebirths += count;

    // Update player data
    this.updatePlayerData(player, playerData);

    return {
      success: true,
      rebirthsPerformed: count,
      newRebirths: playerData.rebirths,
      powerSpent: totalCost,
      newPower: playerData.power,
    };
  }

  /**
   * Called after the player's UI has loaded so we can send initial HUD data
   * 
   * @param player - Player whose UI finished loading
   */
  onPlayerUILoaded(player: Player): void {
    this.sendPowerStatsToUI(player);
  }

  /**
   * Sends current power stats to the player's HUD
   * 
   * @param player - Player to update
   */
  sendPowerStatsToUI(player: Player): void {
    const data = this.getPlayerData(player);
    if (!data) return;

    player.ui.sendData({
      type: 'POWER_STATS',
      power: data.power,
      gold: data.gold,
      wins: data.wins || 0,
      rebirths: data.rebirths,
    });
  }

  /**
   * Toggles auto mine mode for a player
   * When enabled, player automatically moves to center of mining area and mines
   * 
   * @param player - Player to toggle auto mine for
   */
  toggleAutoMine(player: Player): void {
    const autoState = this.playerAutoStates.get(player) || {
      autoMineEnabled: false,
      autoTrainEnabled: false,
    };

    autoState.autoMineEnabled = !autoState.autoMineEnabled;
    this.playerAutoStates.set(player, autoState);

    console.log(`[GameManager] Toggling auto mine: ${autoState.autoMineEnabled ? 'ON' : 'OFF'}`);

    if (autoState.autoMineEnabled) {
      // Disable auto train when enabling auto mine
      if (autoState.autoTrainEnabled) {
        this.stopAutoTrain(player);
        autoState.autoTrainEnabled = false;
        player.ui.sendData({ type: 'AUTO_TRAIN_STATE', enabled: false });
      }
      this.startAutoMine(player);
    } else {
      this.stopAutoMine(player);
    }

    // Send UI update
    player.ui.sendData({
      type: 'AUTO_MINE_STATE',
      enabled: autoState.autoMineEnabled,
    });
  }

  /**
   * Starts auto mine mode - moves player to center and starts mining loop
   * 
   * @param player - Player to start auto mine for
   */
  private startAutoMine(player: Player): void {
    console.log('[GameManager] Starting auto mine...');
    
    const playerEntity = this.getPlayerEntity(player);
    if (!playerEntity) {
      console.warn('[GameManager] Cannot start auto mine - player entity not found');
      return;
    }

    console.log('[GameManager] Player entity found, calculating mining area center...');

    const miningSystem = this.miningController?.getMiningSystem();
    const mineCenter = miningSystem?.getMineCenter(player);
    const centerX = mineCenter?.x ?? (MINING_AREA_BOUNDS.minX + MINING_AREA_BOUNDS.maxX) / 2;
    const centerZ = mineCenter?.z ?? (MINING_AREA_BOUNDS.minZ + MINING_AREA_BOUNDS.maxZ) / 2;
    
    // Get current depth from mining system
    const miningState = this.miningController?.getMiningState(player);
    const currentDepth = miningState?.currentDepth ?? MINING_AREA_BOUNDS.y;

    console.log(`[GameManager] Mining area center: (${centerX}, ${currentDepth + 1}, ${centerZ}), currentDepth: ${currentDepth}`);

    // Teleport player to center of mining area at current depth
    const targetPosition = {
      x: centerX,
      y: currentDepth + 1, // Position on top of current level
      z: centerZ,
    };

    console.log(`[GameManager] Teleporting player to: (${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z})`);
    this.teleportPlayer(player, targetPosition);

    // Wait a moment for teleport, then start mining
    setTimeout(() => {
      const autoState = this.playerAutoStates.get(player);
      if (!autoState?.autoMineEnabled) {
        console.log('[GameManager] Auto mine was disabled during teleport delay');
        return;
      }
      
      console.log('[GameManager] Starting mining loop after teleport...');
      
      // Start mining loop
      if (!this.miningController) {
        console.warn('[GameManager] Cannot start mining - mining controller not available');
        return;
      }
      
      if (this.miningController.isPlayerMining(player)) {
        console.log('[GameManager] Player is already mining, skipping start');
        return;
      }
      
      console.log('[GameManager] Calling startMiningLoop...');
      this.miningController.startMiningLoop(player);
      console.log('[GameManager] Mining loop started successfully');
    }, 500);

    // Check periodically if player needs to be recentered after falling down a level
    // Only recenter vertically (Y position), allow horizontal movement
    const autoState = this.playerAutoStates.get(player);
    if (autoState) {
      // Store initial Y position to detect when player falls
      const playerEnt = this.getPlayerEntity(player);
      if (playerEnt) {
        autoState.lastAutoMinePosition = {
          x: playerEnt.position.x,
          y: playerEnt.position.y,
          z: playerEnt.position.z,
        };
      }

      autoState.autoMineInterval = setInterval(() => {
        if (!autoState.autoMineEnabled) return;

        const currentMiningState = this.miningController?.getMiningState(player);
        if (!currentMiningState) return;

        const playerEnt = this.getPlayerEntity(player);
        if (!playerEnt) return;

        const currentPos = playerEnt.position;
        const depth = currentMiningState.currentDepth;
        const expectedY = depth + 1;

        const bounds = miningSystem?.getMineBounds(player) ?? MINING_AREA_BOUNDS;
        const isOutsideMiningArea = 
          currentPos.x < bounds.minX || 
          currentPos.x > bounds.maxX ||
          currentPos.z < bounds.minZ || 
          currentPos.z > bounds.maxZ;
        
        if (isOutsideMiningArea) {
          // Player left the mining area, teleport them back to center
          console.log(`[GameManager] Player left mining area (pos: ${currentPos.x}, ${currentPos.y}, ${currentPos.z}), teleporting back to center`);
          this.teleportPlayer(player, {
            x: centerX,
            y: expectedY,
            z: centerZ,
          });
          return; // Don't check Y difference if we just teleported
        }
        
        // Only recenter if player has fallen significantly (more than 1 block down)
        // This allows them to move horizontally with WASD, but recenters them after mining breaks blocks
        const yDifference = Math.abs(currentPos.y - expectedY);
        
        if (yDifference > 1.5) {
          // Player fell down a level, recenter them vertically but keep their X/Z position
          // This allows horizontal movement while still keeping them at the right depth
          console.log(`[GameManager] Player fell down (Y diff: ${yDifference}), recentering vertically`);
          this.teleportPlayer(player, {
            x: currentPos.x, // Keep current X position (allow horizontal movement)
            y: expectedY,     // Recenter Y to correct depth
            z: currentPos.z, // Keep current Z position (allow horizontal movement)
          });
        }
      }, 2000); // Check every 2 seconds
    }
  }

  /**
   * Stops auto mine mode
   * 
   * @param player - Player to stop auto mine for
   */
  private stopAutoMine(player: Player): void {
    console.log('[GameManager] Stopping auto mine...');
    const autoState = this.playerAutoStates.get(player);
    if (autoState?.autoMineInterval) {
      clearInterval(autoState.autoMineInterval);
      autoState.autoMineInterval = undefined;
      console.log('[GameManager] Cleared auto mine interval');
    }
    
    // Stop mining loop if active
    if (this.miningController?.isPlayerMining(player)) {
      console.log('[GameManager] Stopping mining loop...');
      this.miningController.stopMiningLoop(player);
    }
  }

  /**
   * Toggles auto train mode for a player
   * When enabled, player teleports to highest tier training rock and trains automatically
   * 
   * @param player - Player to toggle auto train for
   */
  toggleAutoTrain(player: Player): void {
    const autoState = this.playerAutoStates.get(player) || {
      autoMineEnabled: false,
      autoTrainEnabled: false,
    };

    autoState.autoTrainEnabled = !autoState.autoTrainEnabled;
    this.playerAutoStates.set(player, autoState);

    console.log(`[GameManager] Toggling auto train: ${autoState.autoTrainEnabled ? 'ON' : 'OFF'}`);

    if (autoState.autoTrainEnabled) {
      // Disable auto mine when enabling auto train
      if (autoState.autoMineEnabled) {
        this.stopAutoMine(player);
        autoState.autoMineEnabled = false;
        player.ui.sendData({ type: 'AUTO_MINE_STATE', enabled: false });
      }
      this.startAutoTrain(player);
    } else {
      this.stopAutoTrain(player);
    }

    // Send UI update
    player.ui.sendData({
      type: 'AUTO_TRAIN_STATE',
      enabled: autoState.autoTrainEnabled,
    });
  }

  /**
   * Starts auto train mode - teleports to best training rock and starts training
   * 
   * @param player - Player to start auto train for
   */
  private startAutoTrain(player: Player): void {
    console.log('[GameManager] Starting auto train...');
    
    const playerData = this.getPlayerData(player);
    if (!playerData) {
      console.warn('[GameManager] Cannot start auto train - no player data');
      return;
    }

    // Find the highest tier training rock the player can access
    const bestRockLocation = this.trainingController?.findBestAccessibleTrainingRock(player);
    if (!bestRockLocation) {
      console.log('[GameManager] No accessible training rock found');
      return;
    }

    console.log(`[GameManager] Found best training rock: ${bestRockLocation.rockData.name} at (${bestRockLocation.position.x}, ${bestRockLocation.position.y}, ${bestRockLocation.position.z})`);

    // Calculate teleport position (same as TrainingController uses)
    const standPosition = {
      x: bestRockLocation.position.x,
      y: bestRockLocation.position.y + 1.6, // Position on top with offset
      z: bestRockLocation.position.z + 1, // Move back slightly
    };

    // Teleport player to the training rock
    console.log(`[GameManager] Teleporting player to training rock: (${standPosition.x}, ${standPosition.y}, ${standPosition.z})`);
    this.teleportPlayer(player, standPosition);

    // Wait a moment, then start training automatically
    setTimeout(() => {
      const autoState = this.playerAutoStates.get(player);
      if (!autoState?.autoTrainEnabled) {
        console.log('[GameManager] Auto train was disabled during teleport delay');
        return;
      }

      console.log('[GameManager] Starting training automatically...');
      
      // Start training automatically (pass the full location)
      // This will start training without needing to hold E
      const trainingStarted = this.trainingController?.startTraining(player, bestRockLocation);
      
      if (!trainingStarted) {
        console.warn('[GameManager] Failed to start training');
        return;
      }

      // Store position to detect if player leaves training area
      const playerEntity = this.getPlayerEntity(player);
      if (playerEntity && autoState) {
        autoState.lastAutoTrainPosition = {
          x: standPosition.x,
          y: standPosition.y,
          z: standPosition.z,
        };

        // Check periodically if player moved away from training rock
        // Stop auto train if they move (unlike auto mine which teleports back)
        autoState.autoTrainStopCheckInterval = setInterval(() => {
          if (!autoState.autoTrainEnabled) return;

          const playerEnt = this.getPlayerEntity(player);
          if (!playerEnt || !autoState.lastAutoTrainPosition) return;

          const currentPos = playerEnt.position;
          const distance = Math.sqrt(
            Math.pow(currentPos.x - autoState.lastAutoTrainPosition.x, 2) +
            Math.pow(currentPos.y - autoState.lastAutoTrainPosition.y, 2) +
            Math.pow(currentPos.z - autoState.lastAutoTrainPosition.z, 2)
          );

          // If player moved more than 1.5 blocks away, stop auto train
          if (distance > 1.5) {
            console.log(`[GameManager] Player moved away from training rock (distance: ${distance.toFixed(2)}), stopping auto train`);
            this.toggleAutoTrain(player);
          }
        }, 500); // Check every 0.5 seconds
      }
    }, 500);
  }

  /**
   * Stops auto train mode
   * 
   * @param player - Player to stop auto train for
   */
  private stopAutoTrain(player: Player): void {
    console.log('[GameManager] Stopping auto train...');
    const autoState = this.playerAutoStates.get(player);
    if (autoState?.autoTrainStopCheckInterval) {
      clearInterval(autoState.autoTrainStopCheckInterval);
      autoState.autoTrainStopCheckInterval = undefined;
      console.log('[GameManager] Cleared auto train interval');
    }
    
    // Stop training if active
    if (this.trainingController?.isPlayerTraining(player)) {
      console.log('[GameManager] Stopping training...');
      this.trainingController.stopTraining(player);
    }
  }

  /**
   * Teleports player to surface (spawn position)
   * 
   * @param player - Player to teleport
   */
  teleportToSurface(player: Player): void {
    // Stop auto modes
    const autoState = this.playerAutoStates.get(player);
    if (autoState) {
      if (autoState.autoMineEnabled) {
        this.stopAutoMine(player);
        autoState.autoMineEnabled = false;
        player.ui.sendData({ type: 'AUTO_MINE_STATE', enabled: false });
      }
      if (autoState.autoTrainEnabled) {
        this.stopAutoTrain(player);
        autoState.autoTrainEnabled = false;
        player.ui.sendData({ type: 'AUTO_TRAIN_STATE', enabled: false });
      }
    }

    // Stop mining if active
    this.miningController?.stopMiningLoop(player);

    // NOTE: Do NOT stop the mine reset timer when manually teleporting
    // The timer should continue running and be visible even on surface
    // It will only stop when it expires or when the mine is reset

    // Teleport to surface spawn position
    this.teleportPlayer(player, { x: 0, y: 10, z: 0 });

    // Update UI
    player.ui.sendData({
      type: 'MINING_STATE_UPDATE',
      isInMine: false,
    });

    // Ensure timer UI is still visible if timer is running
    // This ensures the timer stays visible when returning to surface
    if (this.mineResetTimers.has(player)) {
      this.updateMineResetTimerUI(player);
    }
  }

  /**
   * Teleports player into their personal mine when they reach the shared shaft bottom
   */
  enterPersonalMine(player: Player): void {
    const miningSystem = this.miningController?.getMiningSystem();
    if (!miningSystem) return;

    const pickaxe = this.getPlayerPickaxe(player);
    if (!pickaxe) {
      console.warn('[GameManager] Cannot enter mine - no pickaxe');
      return;
    }

    const entryPosition = miningSystem.preparePlayerMine(player, pickaxe);
    this.teleportPlayer(player, entryPosition);

    player.ui.sendData({
      type: 'MINING_STATE_UPDATE',
      isInMine: true,
    });

    // Ensure timer UI is visible if timer is running
    // This ensures the timer stays visible when re-entering the mine
    if (this.mineResetTimers.has(player)) {
      this.updateMineResetTimerUI(player);
    }
  }

  /**
   * Starts the mine reset timer for a player (called when first block is mined)
   * 
   * @param player - Player who mined their first block
   */
  startMineResetTimer(player: Player): void {
    // Don't start if timer already running
    if (this.mineResetTimers.has(player)) {
      return;
    }

    // Check if player has the upgrade
    const playerData = this.getPlayerData(player);
    const hasUpgrade = playerData?.mineResetUpgradePurchased ?? false;
    const duration = hasUpgrade ? this.MINE_RESET_DURATION_UPGRADED_MS : this.MINE_RESET_DURATION_MS;

    const startTime = Date.now();
    this.mineResetStartTimes.set(player, startTime);

    console.log(`[GameManager] Starting mine reset timer for ${player.username} (${hasUpgrade ? '5 minutes' : '2 minutes'})`);

    // Update UI immediately
    this.updateMineResetTimerUI(player);

    // Update timer display every second
    const updateInterval = setInterval(() => {
      this.updateMineResetTimerUI(player);
    }, 1000);
    this.mineResetTimerIntervals.set(player, updateInterval);

    // Set expiration timer
    const expirationTimer = setTimeout(() => {
      this.onMineResetTimerExpired(player);
    }, duration);
    this.mineResetTimers.set(player, expirationTimer);
  }

  /**
   * Updates the mine reset timer UI for a player
   * 
   * @param player - Player to update UI for
   */
  private updateMineResetTimerUI(player: Player): void {
    const startTime = this.mineResetStartTimes.get(player);
    if (!startTime) return;

    // Get the correct duration based on upgrade
    const playerData = this.getPlayerData(player);
    const hasUpgrade = playerData?.mineResetUpgradePurchased ?? false;
    const duration = hasUpgrade ? this.MINE_RESET_DURATION_UPGRADED_MS : this.MINE_RESET_DURATION_MS;

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    const seconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    const timeString = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    player.ui.sendData({
      type: 'MINE_RESET_TIMER',
      timeRemaining: timeString,
      secondsRemaining: seconds,
    });
  }

  /**
   * Purchases the mine reset upgrade for a player
   * 
   * @param player - Player purchasing the upgrade
   * @returns Result of purchase attempt
   */
  purchaseMineResetUpgrade(player: Player): {
    success: boolean;
    message?: string;
    remainingGold?: number;
  } {
    const playerData = this.getPlayerData(player);
    if (!playerData) {
      return {
        success: false,
        message: 'Player data not found',
      };
    }

    // Check if already purchased
    if (playerData.mineResetUpgradePurchased) {
      return {
        success: false,
        message: 'Upgrade already purchased',
      };
    }

    // Check if player has enough gold
    const UPGRADE_COST = 2_000_000;
    if (playerData.gold < UPGRADE_COST) {
      return {
        success: false,
        message: `Insufficient gold. Need ${UPGRADE_COST.toLocaleString()}, have ${playerData.gold.toLocaleString()}`,
      };
    }

    // Deduct gold and mark upgrade as purchased
    playerData.gold -= UPGRADE_COST;
    playerData.mineResetUpgradePurchased = true;
    this.updatePlayerData(player, playerData);

    // Update gold UI
    player.ui.sendData({
      type: 'GOLD_STATS',
      gold: playerData.gold,
    });

    console.log(`[GameManager] Player ${player.username} purchased mine reset upgrade`);

    return {
      success: true,
      remainingGold: playerData.gold,
    };
  }

  /**
   * Called when the mine reset timer expires
   * Teleports player to lobby and resets their mine
   * 
   * @param player - Player whose timer expired
   */
  private onMineResetTimerExpired(player: Player): void {
    console.log(`[GameManager] Mine reset timer expired for ${player.username}`);

    // Stop timer updates
    this.stopMineResetTimer(player);

    // Stop auto modes and mining
    const autoState = this.playerAutoStates.get(player);
    if (autoState) {
      if (autoState.autoMineEnabled) {
        this.stopAutoMine(player);
        autoState.autoMineEnabled = false;
        player.ui.sendData({ type: 'AUTO_MINE_STATE', enabled: false });
      }
      if (autoState.autoTrainEnabled) {
        this.stopAutoTrain(player);
        autoState.autoTrainEnabled = false;
        player.ui.sendData({ type: 'AUTO_TRAIN_STATE', enabled: false });
      }
    }

    // Stop mining if active
    this.miningController?.stopMiningLoop(player);

    // Teleport to surface (but don't call teleportToSurface to avoid stopping timer again)
    this.teleportPlayer(player, { x: 0, y: 10, z: 0 });

    // Reset mine to level 0
    const miningSystem = this.miningController?.getMiningSystem();
    if (miningSystem) {
      miningSystem.resetMineToLevel0(player);
    }

    // Hide timer UI
    player.ui.sendData({
      type: 'MINE_RESET_TIMER',
      timeRemaining: null,
      secondsRemaining: 0,
    });

    // Update mining state UI
    player.ui.sendData({
      type: 'MINING_STATE_UPDATE',
      isInMine: false,
    });
  }

  /**
   * Stops the mine reset timer for a player
   * 
   * @param player - Player to stop timer for
   */
  stopMineResetTimer(player: Player): void {
    const timer = this.mineResetTimers.get(player);
    if (timer) {
      clearTimeout(timer);
      this.mineResetTimers.delete(player);
    }

    const interval = this.mineResetTimerIntervals.get(player);
    if (interval) {
      clearInterval(interval);
      this.mineResetTimerIntervals.delete(player);
    }

    this.mineResetStartTimes.delete(player);
  }

  /**
   * Teleports a player to a specific position
   * 
   * @param player - Player to teleport
   * @param position - Target position
   */
  private teleportPlayer(player: Player, position: { x: number; y: number; z: number }): void {
    const playerEntity = this.getPlayerEntity(player);
    if (!playerEntity) return;

    // Use setPosition method if available (like TrainingController does)
    if (typeof (playerEntity as any).setPosition === 'function') {
      (playerEntity as any).setPosition(position);
      return;
    }

    // Fallback: try rigidBody.setPosition
    const rigidBody = (playerEntity as any).rawRigidBody;
    if (rigidBody && typeof rigidBody.setPosition === 'function') {
      rigidBody.setPosition(position);
    } else {
      console.warn('[GameManager] Could not teleport player - no setPosition method available');
    }
  }

  /**
   * Gets player entity from world
   * 
   * @param player - Player to get entity for
   * @returns Player entity or undefined
   */
  private getPlayerEntity(player: Player) {
    const entities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
    return entities.length > 0 ? entities[0] : undefined;
  }

  /**
   * Sends progress update to UI
   * 
   * @param player - Player to update
   * @param currentDepth - Current mining depth (Y coordinate, negative when below start)
   */
  sendProgressUpdate(player: Player, currentDepth: number): void {
    // Calculate blocks mined: distance from starting depth (0) to current depth
    // If currentDepth is -20, that means 20 blocks have been mined from the start
    // MINE_DEPTH_START is 0, so if currentDepth is -20, blocksMined = 0 - (-20) = 20
    // Ensure we always get a positive value (player should be at or below starting depth)
    const blocksMined = Math.max(0, MINE_DEPTH_START - currentDepth);
    
    console.log(`[GameManager] Progress update: currentDepth=${currentDepth}, blocksMined=${blocksMined}, MINE_DEPTH_START=${MINE_DEPTH_START}`);
    
    player.ui.sendData({
      type: 'PROGRESS_UPDATE',
      currentDepth: blocksMined, // Blocks mined from start (should be positive)
      goalDepth: 1000,
    });
  }

  /**
   * Cleans up player data when they leave
   * Saves data before cleanup
   * 
   * @param player - Player who left
   */
  async cleanupPlayer(player: Player): Promise<void> {
    // Stop auto modes
    this.stopAutoMine(player);
    this.stopAutoTrain(player);

    // Stop mine reset timer
    this.stopMineResetTimer(player);

    // Save player data before cleanup
    await this.savePlayerData(player);
    
    // Clear save timer if any
    const saveTimer = this.saveTimers.get(player);
    if (saveTimer) {
      clearTimeout(saveTimer);
      this.saveTimers.delete(player);
    }

    this.trainingController?.cleanupPlayer(player);
    this.miningController?.cleanupPlayer(player);
    this.playerDataMap.delete(player);
    this.playerAutoStates.delete(player);
    const entranceInterval = this.mineEntranceIntervals.get(player);
    if (entranceInterval) {
      clearInterval(entranceInterval);
      this.mineEntranceIntervals.delete(player);
    }
    this.mineEntranceCooldowns.delete(player);
  }

  /**
   * Cleans up the game manager
   */
  cleanup(): void {
    // Stop periodic saves
    if (this.periodicSaveInterval) {
      clearInterval(this.periodicSaveInterval);
      this.periodicSaveInterval = undefined;
    }
    
    // Clear all save timers
    for (const timer of this.saveTimers.values()) {
      clearTimeout(timer);
    }
    this.saveTimers.clear();
    
    this.trainingController?.cleanup();
    this.miningController?.cleanup();
  }

  /**
   * Creates the shared entrance shaft (10 blocks deep) so all players can jump in
   */
  buildSharedMineShaft(): void {
    // Carve a 10-block-deep hole covering the mining area and add dirt walls + void block
    const bounds = MINING_AREA_BOUNDS;
    const topY = SHARED_MINE_SHAFT.topY;
    const bottomY = SHARED_MINE_SHAFT.bottomY + 1; // carve down to bottomY inclusive
    const wallMinX = bounds.minX - 1;
    const wallMaxX = bounds.maxX + 1;
    const wallMinZ = bounds.minZ - 1;
    const wallMaxZ = bounds.maxZ + 1;
    const dirtId = 9; // Low_Poly_Dirt
    const voidId = 2; // coal-block (black)

    // Carve interior to air
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      for (let z = bounds.minZ; z <= bounds.maxZ; z++) {
        for (let y = topY; y >= bottomY; y--) {
          try {
            this.world.chunkLattice.setBlock({ x, y, z }, 0);
          } catch (err) {
            console.warn(`[GameManager] Failed to carve shaft block at ${x},${y},${z}`, err);
          }
        }
      }
    }

    // Build dirt walls around the hole for all carved depths
    for (let y = topY; y >= bottomY; y--) {
      for (let x = wallMinX; x <= wallMaxX; x++) {
        for (let z = wallMinZ; z <= wallMaxZ; z++) {
          const isWall = x === wallMinX || x === wallMaxX || z === wallMinZ || z === wallMaxZ;
          if (!isWall) continue;
          try {
            this.world.chunkLattice.setBlock({ x, y, z }, dirtId);
          } catch (err) {
            console.warn(`[GameManager] Failed to place wall block at ${x},${y},${z}`, err);
          }
        }
      }
    }

    // Place void floor across the whole mining area one level below carve depth
    const voidY = bottomY - 1;
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      for (let z = bounds.minZ; z <= bounds.maxZ; z++) {
        try {
          this.world.chunkLattice.setBlock({ x, y: voidY, z }, voidId);
        } catch (err) {
          console.warn(`[GameManager] Failed to place void block at ${x},${voidY},${z}`, err);
        }
      }
    }

    console.log('[GameManager] Shared mine shaft carved with dirt walls and full void floor.');
  }

  /**
   * Starts per-player watcher that teleports them to their personal mine when they reach the shaft bottom
   */
  startMineEntranceWatch(player: Player): void {
    // Clear existing
    const existing = this.mineEntranceIntervals.get(player);
    if (existing) {
      clearInterval(existing);
    }

    const interval = setInterval(() => {
      const playerEnt = this.getPlayerEntity(player);
      if (!playerEnt) return;
      const pos = playerEnt.position;
      const shaft = SHARED_MINE_SHAFT;
      const now = Date.now();

      const inBounds =
        pos.x >= shaft.bounds.minX && pos.x <= shaft.bounds.maxX &&
        pos.z >= shaft.bounds.minZ && pos.z <= shaft.bounds.maxZ;

      if (!inBounds) return;

      if (pos.y <= shaft.teleportThresholdY) {
        const last = this.mineEntranceCooldowns.get(player) ?? 0;
        if (now - last < this.MINE_ENTRANCE_COOLDOWN_MS) {
          return;
        }
        this.mineEntranceCooldowns.set(player, now);
        this.enterPersonalMine(player);
      }
    }, 250);

    this.mineEntranceIntervals.set(player, interval);
  }
}

