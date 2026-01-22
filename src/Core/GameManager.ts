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
import { toBigInt, bigIntToString } from './BigIntUtils';
import { getPickaxeByTier } from '../Pickaxe/PickaxeDatabase';
import { TrainingController } from '../Surface/Training/TrainingController';
import { MiningController } from '../Mining/MiningController';
import { OreType } from '../Mining/Ore/World1OreData';
import { MINING_AREA_BOUNDS, SHARED_MINE_SHAFT, MINE_DEPTH_START, ISLAND2_MINING_AREA_BOUNDS, ISLAND2_SHARED_MINE_SHAFT, ISLAND3_MINING_AREA_BOUNDS, ISLAND3_SHARED_MINE_SHAFT } from './GameConstants';
import { InventoryManager } from '../Inventory/InventoryManager';
import { SellingSystem } from '../Shop/SellingSystem';
import { PickaxeShop } from '../Shop/PickaxeShop';
import { MinerShop } from '../Shop/MinerShop';
import { GemTraderUpgradeSystem } from '../Shop/GemTraderUpgradeSystem';
import { PickaxeManager } from '../Pickaxe/PickaxeManager';
import { PlayerDataPersistence } from './PersistenceManager';
import { PetManager } from '../Pets/PetManager';
import { HatchingSystem } from '../Pets/HatchingSystem';
import { WorldRegistry } from '../WorldRegistry';

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

/**
 * UI modal state for a player
 */
interface PlayerModalState {
  minerModalOpen: boolean;
  pickaxeModalOpen: boolean;
  rebirthModalOpen: boolean;
  petsModalOpen: boolean;
  eggModalOpen: boolean;
  mapsModalOpen: boolean;
  lastModalOpenTime: number; // Timestamp when modal was last opened (to prevent race conditions)
}

export class GameManager {
  private world: World;
  private playerDataMap: Map<Player, PlayerData> = new Map();
  private playerAutoStates: Map<Player, PlayerAutoState> = new Map();
  private playerModalStates: Map<Player, PlayerModalState> = new Map();
  private playerInMineStates: Map<Player, boolean> = new Map(); // Tracks if player is physically in their mine
  private playerLoadingStates: Map<Player, boolean> = new Map();
  private trainingController?: TrainingController;
  private miningController?: MiningController;
  private inventoryManager: InventoryManager;
  private sellingSystem: SellingSystem;
  private pickaxeShop: PickaxeShop;
  private minerShop: MinerShop;
  private gemTraderUpgradeSystem: GemTraderUpgradeSystem;
  private pickaxeManager: PickaxeManager;
  private petManager: PetManager;
  private hatchingSystem: HatchingSystem;
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
    this.minerShop = new MinerShop();
    this.gemTraderUpgradeSystem = new GemTraderUpgradeSystem();

    // Pet system
    this.petManager = new PetManager();
    this.hatchingSystem = new HatchingSystem(this.petManager);
    
    // Set up callbacks for inventory and shop systems
    this.inventoryManager.setGetPlayerDataCallback((player) => this.getPlayerData(player));
    this.inventoryManager.setUpdatePlayerDataCallback((player, data) => this.updatePlayerData(player, data));
    
    this.sellingSystem.setGetPlayerDataCallback((player) => this.getPlayerData(player));
    this.sellingSystem.setUpdatePlayerDataCallback((player, data) => this.updatePlayerData(player, data));
    this.sellingSystem.setGetMoreCoinsMultiplierCallback((player) => this.gemTraderUpgradeSystem.getMoreCoinsMultiplier(player));
    this.sellingSystem.setGetMinerCoinBonusCallback((player) => {
      const equippedMiner = this.minerShop.getEquippedMiner(player);
      return equippedMiner?.coinBonus ?? 0;
    });
    
    this.pickaxeShop.setGetPlayerDataCallback((player) => this.getPlayerData(player));
    this.pickaxeShop.setUpdatePlayerDataCallback((player, data) => this.updatePlayerData(player, data));
    
    this.minerShop.setGetPlayerDataCallback((player) => this.getPlayerData(player));
    this.minerShop.setUpdatePlayerDataCallback((player, data) => this.updatePlayerData(player, data));
    
    this.gemTraderUpgradeSystem.setGetPlayerDataCallback((player) => this.getPlayerData(player));
    this.gemTraderUpgradeSystem.setUpdatePlayerDataCallback((player, data) => this.updatePlayerData(player, data));

    // Pet callbacks
    this.petManager.setGetPlayerDataCallback((player) => this.getPlayerData(player));
    this.petManager.setUpdatePlayerDataCallback((player, data) => this.updatePlayerData(player, data));
    this.hatchingSystem.setGetPlayerDataCallback((player) => this.getPlayerData(player));
    this.hatchingSystem.setUpdatePlayerDataCallback((player, data) => this.updatePlayerData(player, data));
    
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
   * Initializes the player's mine state (creates mining state and generates mine)
   * Should be called when player joins the server
   * 
   * @param player - Player whose mine to initialize
   */
  initializePlayerMine(player: Player): void {
    console.log('[GameManager] initializePlayerMine called for player:', player.username);
    const pickaxe = this.getPlayerPickaxe(player);
    if (!pickaxe) {
      // Can't initialize mine without a pickaxe, skip for now
      // This should rarely happen as pickaxe is attached during join
      console.log('[GameManager] initializePlayerMine: No pickaxe for player:', player.username);
      return;
    }

    const miningSystem = this.miningController?.getMiningSystem();
    if (!miningSystem) {
      console.log('[GameManager] initializePlayerMine: No mining system');
      return;
    }

    // Get or create the mining state (this will generate the mine)
    // We access the private method through a workaround - call preparePlayerMine
    // which internally calls getOrCreateState, but we don't need the return value
    miningSystem.preparePlayerMine(player, pickaxe);
    console.log('[GameManager] initializePlayerMine: Mine prepared for player:', player.username);
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
    
    // Initialize modal state
    this.playerModalStates.set(player, {
      minerModalOpen: false,
      pickaxeModalOpen: false,
      rebirthModalOpen: false,
      petsModalOpen: false,
      eggModalOpen: false,
      mapsModalOpen: false,
      lastModalOpenTime: 0,
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
   * @param amount - Amount of power to add (number, string, or BigInt)
   * @returns New total power as string (for BigInt support)
   */
  addPower(player: Player, amount: number | string | bigint): string {
    const data = this.getPlayerData(player);
    if (!data) {
      return '0';
    }

    const currentPower = toBigInt(data.power);
    const powerToAdd = toBigInt(amount);
    const newPower = currentPower + powerToAdd;
    
    data.power = bigIntToString(newPower);
    this.updatePlayerData(player, data);

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
   * Adds gems to player
   * 
   * @param player - Player to add gems to
   * @param amount - Amount of gems to add
   */
  addGems(player: Player, amount: number): void {
    const data = this.getPlayerData(player);
    if (data) {
      data.gems += amount;
      this.updatePlayerData(player, data);
      // Send gems update to UI
      player.ui.sendData({
        type: 'GEMS_STATS',
        gems: data.gems,
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
   * World-aware: Supports both Island 1 (OreType) and Island 2 (ISLAND2_ORE_TYPE) ores
   * 
   * @param player - Player to add ore to
   * @param oreType - Type of ore to add (as string)
   * @param amount - Amount of ore to add
   */
  addOreToInventory(player: Player, oreType: string, amount: number): void {
    this.inventoryManager.addOre(player, oreType as any, amount);
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
   * Gets the miner shop instance
   * 
   * @returns Miner shop
   */
  getMinerShop(): MinerShop {
    return this.minerShop;
  }

  /**
   * Gets the gem trader upgrade system instance
   * 
   * @returns Gem trader upgrade system
   */
  getGemTraderUpgradeSystem(): GemTraderUpgradeSystem {
    return this.gemTraderUpgradeSystem;
  }

  /**
   * Gets the pet manager instance
   */
  getPetManager(): PetManager {
    return this.petManager;
  }

  /**
   * Gets the pet hatching system instance
   */
  getHatchingSystem(): HatchingSystem {
    return this.hatchingSystem;
  }

  /**
   * Calculates the cost for a single rebirth
   * Formula: BASE_COST × (1.1 ^ currentRebirths)
   * 
   * @param currentRebirths - Current number of rebirths
   * @returns Cost in power
   */
  /**
   * Calculates rebirth cost using piecewise linear function
   * Reference: Planning/PowerSystemPlan.md section 6 - Rebirth Cost Formula
   * 
   * @param currentRebirths - Current number of rebirths (x)
   * @returns Cost in power for next rebirth (y)
   */
  calculateRebirthCost(currentRebirths: number): number {
    const x = currentRebirths;
    
    // Piecewise linear function with multiple segments
    // Each segment increases cost by 500 power per rebirth, with different base costs
    if (x >= 1 && x < 6) {
      return 500 * (x - 1) + 1000; // Ensures continuity at x=6 (cost = 3500)
    } else if (x >= 6 && x < 11) {
      return 500 * (x - 6) + 3500;
    } else if (x >= 11 && x < 16) {
      return 500 * (x - 11) + 6000;
    } else if (x >= 16 && x < 21) {
      return 500 * (x - 16) + 8500;
    } else if (x >= 21 && x < 26) {
      return 500 * (x - 21) + 11000;
    } else if (x >= 26 && x < 31) {
      return 500 * (x - 26) + 13500;
    } else if (x >= 31 && x < 36) {
      return 500 * (x - 31) + 16000;
    } else if (x >= 36 && x < 41) {
      return 500 * (x - 36) + 18500;
    } else if (x >= 41 && x < 47) {
      return 500 * (x - 41) + 21000;
    } else if (x >= 47 && x < 57) {
      return 500 * (x - 47) + 24000;
    } else if (x >= 57 && x < 77) {
      return 500 * (x - 57) + 29000;
    } else if (x >= 77 && x < 97) {
      return 500 * (x - 77) + 39000;
    } else if (x >= 97 && x < 117) {
      return 500 * (x - 97) + 49000;
    } else if (x >= 117 && x < 137) {
      return 500 * (x - 117) + 59000;
    } else if (x >= 137 && x < 157) {
      return 500 * (x - 137) + 69000;
    } else if (x >= 157 && x < 207) {
      return 500 * (x - 157) + 79000;
    } else if (x >= 207 && x < 257) {
      return 500 * (x - 207) + 104000;
    } else if (x >= 257 && x < 307) {
      return 500 * (x - 257) + 129000;
    } else if (x >= 307 && x < 357) {
      return 500 * (x - 307) + 154000;
    } else if (x >= 357 && x < 457) {
      return 500 * (x - 357) + 179000;
    } else if (x >= 457 && x < 2510) {
      return 500 * (x - 457) + 229000;
    } else if (x >= 2510 && x < 3760) {
      return 500 * (x - 2510) + 1250000;
    } else if (x >= 3760) {
      return 500 * (x - 3760) + 1880000;
    } else {
      // x < 1 (first rebirth)
      return 1000;
    }
  }

  /**
   * Calculates the total cost for multiple rebirths
   * When buying multiple rebirths at once, the cost is the NEXT rebirth cost × quantity
   * This keeps the bundle price constant even though individual rebirth costs increase
   * 
   * @param currentRebirths - Current number of rebirths
   * @param count - Number of rebirths to perform
   * @returns Total cost in power (NEXT rebirth cost × count)
   */
  calculateRebirthCostMultiple(currentRebirths: number, count: number): number {
    // Get the cost of the NEXT rebirth (currentRebirths + 0)
    const nextRebirthCost = this.calculateRebirthCost(currentRebirths);
    // Multiply by the quantity to get the total bundle cost
    return nextRebirthCost * count;
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
    // Convert power string (BigInt) to number for comparison
    const currentPower = Number(playerData.power);

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

    // Convert power string (BigInt) to number for comparison and UI display
    const currentPower = Number(playerData.power);
    const currentRebirths = playerData.rebirths;

    // Get available rebirth packages based on More Rebirths upgrade level
    const availablePackages = this.gemTraderUpgradeSystem.getAvailableRebirthPackages(player);
    
    const options = availablePackages.map(count => {
      const cost = this.calculateRebirthCostMultiple(currentRebirths, count);
      return {
        count,
        cost,
        available: currentPower >= cost,
      };
    });

    return {
      currentPower,
      currentRebirths,
      options,
      maxRebirths: 0, // No longer used, kept for backwards compatibility
      maxCost: 0, // No longer used, kept for backwards compatibility
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

    // Convert power string (BigInt) to number for comparison
    const playerPower = Number(playerData.power);
    if (playerPower < totalCost) {
      return {
        success: false,
        message: `Insufficient power. Need ${totalCost.toLocaleString()}, have ${playerPower.toLocaleString()}`,
      };
    }

    // Deduct cost using BigInt arithmetic
    const currentPowerBigInt = toBigInt(playerData.power);
    const costBigInt = BigInt(totalCost);
    const newPowerBigInt = currentPowerBigInt - costBigInt;
    
    // Reset power to base (1) after rebirth (as string for BigInt)
    playerData.power = '1';

    // Increase rebirths
    playerData.rebirths += count;

    // Update player data
    this.updatePlayerData(player, playerData);

    return {
      success: true,
      rebirthsPerformed: count,
      newRebirths: playerData.rebirths,
      powerSpent: totalCost,
      newPower: 1, // Return as number for UI compatibility
    };
  }

  /**
   * Called after the player's UI has loaded so we can send initial HUD data
   *
   * @param player - Player whose UI finished loading
   */
  onPlayerUILoaded(player: Player): void {
    // Send INIT message with player ID for Scene UI player-specific filtering
    player.ui.sendData({
      type: 'INIT',
      payload: {
        playerId: player.id,
      },
    });
    this.sendPowerStatsToUI(player);
  }

  /**
   * Toggles loading state for a player.
   * Disables input and interactions while loading.
   */
  setPlayerLoading(player: Player, isLoading: boolean): void {
    this.playerLoadingStates.set(player, isLoading);
    player.ui.sendData({
      type: 'LOADING_SCREEN',
      visible: isLoading,
    });

    player.setInteractEnabled(!isLoading);
    if (isLoading) {
      player.resetInputs();
    }

    const playerEntity = this.getPlayerEntity(player);
    if (playerEntity && typeof (playerEntity as any).setInputSuppressed === 'function') {
      (playerEntity as any).setInputSuppressed(isLoading);
    }
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
      gems: data.gems || 0,
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

    if (autoState.autoMineEnabled) {
      // Clear any stale modal states that might block mining
      // This handles cases where modals were open but UI didn't send MODAL_CLOSED
      this.clearBlockingModalStates(player);

      // Disable auto train when enabling auto mine
      // Always stop auto train first to clear any intervals/state before starting auto mine
      // This prevents race conditions where the interval might still fire after teleporting
      if (autoState.autoTrainEnabled) {
        autoState.autoTrainEnabled = false;
        player.ui.sendData({ type: 'AUTO_TRAIN_STATE', enabled: false });
      }
      // Stop auto train to clear intervals and stop training (even if flag was already false)
      // This ensures no lingering intervals can interfere with auto mine
      this.stopAutoTrain(player);
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
    console.log('[GameManager] startAutoMine called for player:', player.username);

    const playerEntity = this.getPlayerEntity(player);
    if (!playerEntity) {
      console.log('[GameManager] startAutoMine: No player entity');
      return;
    }

    const miningSystem = this.miningController?.getMiningSystem();
    const mineCenter = miningSystem?.getMineCenter(player);
    const centerX = mineCenter?.x ?? (MINING_AREA_BOUNDS.minX + MINING_AREA_BOUNDS.maxX) / 2;
    const centerZ = mineCenter?.z ?? (MINING_AREA_BOUNDS.minZ + MINING_AREA_BOUNDS.maxZ) / 2;

    // Get current depth from mining system
    const miningState = this.miningController?.getMiningState(player);
    console.log('[GameManager] startAutoMine: miningState exists?', !!miningState, 'currentDepth:', miningState?.currentDepth);
    const currentDepth = miningState?.currentDepth ?? MINING_AREA_BOUNDS.y;

    // Teleport player to center of mining area at current depth
    const targetPosition = {
      x: centerX,
      y: currentDepth + 1, // Position on top of current level
      z: centerZ,
    };

    this.teleportPlayer(player, targetPosition);

    // Mark player as in the mine (enables mining and raycasting)
    this.setPlayerInMine(player, true);

    // Update UI to show player is in mine
    player.ui.sendData({
      type: 'MINING_STATE_UPDATE',
      isInMine: true,
    });

    // Start block detection immediately to show ore info
    // Wait a moment for teleport to complete
    setTimeout(() => {
      if (this.miningController) {
        this.miningController.startBlockDetection(player);
      }
    }, 300);

    // Wait a moment for teleport, then start mining
    setTimeout(() => {
      console.log('[GameManager] startAutoMine: 500ms timeout fired for player:', player.username);
      const autoState = this.playerAutoStates.get(player);
      if (!autoState?.autoMineEnabled) {
        console.log('[GameManager] startAutoMine: autoMineEnabled is false, aborting');
        return;
      }

      // Start mining loop
      if (!this.miningController) {
        console.log('[GameManager] startAutoMine: No mining controller');
        return;
      }

      if (this.miningController.isPlayerMining(player)) {
        console.log('[GameManager] startAutoMine: Player already mining');
        return;
      }

      // Check mining state before calling startMiningLoop
      const stateCheck = this.miningController.getMiningState(player);
      console.log('[GameManager] startAutoMine: About to call startMiningLoop. Mining state exists?', !!stateCheck);

      this.miningController.startMiningLoop(player);
      console.log('[GameManager] startAutoMine: startMiningLoop called');
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
   * Gets the auto state for a player
   * 
   * @param player - Player to get auto state for
   * @returns Auto state or undefined if not found
   */
  getPlayerAutoState(player: Player): PlayerAutoState | undefined {
    return this.playerAutoStates.get(player);
  }

  /**
   * Gets the modal state for a player
   * 
   * @param player - Player to get modal state for
   * @returns Modal state or undefined if not found
   */
  getPlayerModalState(player: Player): PlayerModalState | undefined {
    return this.playerModalStates.get(player);
  }

  /**
   * Sets modal open state for a player
   * 
   * @param player - Player to update
   * @param modalType - Type of modal ('pickaxe' or 'rebirth')
   * @param isOpen - Whether the modal is open
   */
  setModalState(player: Player, modalType: 'miner' | 'pickaxe' | 'rebirth' | 'pets' | 'egg' | 'maps', isOpen: boolean): void {
    const modalState = this.playerModalStates.get(player) || {
      minerModalOpen: false,
      pickaxeModalOpen: false,
      rebirthModalOpen: false,
      petsModalOpen: false,
      eggModalOpen: false,
      mapsModalOpen: false,
      lastModalOpenTime: 0,
    };

    if (modalType === 'miner') {
      modalState.minerModalOpen = isOpen;
    } else if (modalType === 'pickaxe') {
      modalState.pickaxeModalOpen = isOpen;
    } else if (modalType === 'rebirth') {
      modalState.rebirthModalOpen = isOpen;
    } else if (modalType === 'pets') {
      modalState.petsModalOpen = isOpen;
    } else if (modalType === 'egg') {
      modalState.eggModalOpen = isOpen;
    } else if (modalType === 'maps') {
      modalState.mapsModalOpen = isOpen;
    }

    // Update timestamp when opening a modal (to prevent race conditions with clicks)
    if (isOpen) {
      modalState.lastModalOpenTime = Date.now();
    }

    this.playerModalStates.set(player, modalState);
  }

  /**
   * Clears all blocking modal states for a player
   * Called when auto-mine is enabled or mine timer expires to ensure clean state
   *
   * @param player - Player to clear modal states for
   */
  clearBlockingModalStates(player: Player): void {
    const modalState = this.playerModalStates.get(player);
    if (modalState) {
      modalState.minerModalOpen = false;
      modalState.pickaxeModalOpen = false;
      modalState.rebirthModalOpen = false;
      modalState.petsModalOpen = false;
      modalState.eggModalOpen = false;
      // Don't touch mapsModalOpen as it's not a blocking modal for mining
      console.log('[GameManager] Cleared all blocking modal states for player:', player.username);
    }
  }

  /**
   * Checks if any blocking modal is open for a player
   * Blocking modals prevent manual mining
   * Also checks if a modal was opened very recently (within 200ms) to prevent race conditions
   * 
   * @param player - Player to check
   * @returns True if pickaxe or rebirth modal is open, or if one was opened very recently
   */
  isBlockingModalOpen(player: Player): boolean {
    const modalState = this.playerModalStates.get(player);
    if (!modalState) return false;

    // Check if modal is currently open
    if (
      modalState.minerModalOpen ||
      modalState.pickaxeModalOpen ||
      modalState.rebirthModalOpen ||
      modalState.petsModalOpen ||
      modalState.eggModalOpen
    ) {
      console.log('[GameManager] isBlockingModalOpen: TRUE - modals:', {
        miner: modalState.minerModalOpen,
        pickaxe: modalState.pickaxeModalOpen,
        rebirth: modalState.rebirthModalOpen,
        pets: modalState.petsModalOpen,
        egg: modalState.eggModalOpen,
      });
      return true;
    }

    // Check if modal was opened very recently (within 200ms) to prevent race conditions
    // This handles the case where the click happens before the server receives MODAL_OPENED
    const timeSinceModalOpen = Date.now() - modalState.lastModalOpenTime;
    if (timeSinceModalOpen < 200) {
      console.log('[GameManager] isBlockingModalOpen: TRUE - modal opened recently (', timeSinceModalOpen, 'ms ago)');
      return true;
    }

    return false;
  }

  /**
   * Checks if a player is physically in their mine
   * Mining and raycasting should only work when player is in the mine
   * 
   * @param player - Player to check
   * @returns True if player is in their mine, false if on surface or elsewhere
   */
  isPlayerInMine(player: Player): boolean {
    return this.playerInMineStates.get(player) ?? false;
  }

  /**
   * Sets whether a player is in their mine
   * 
   * @param player - Player to update
   * @param inMine - Whether player is in the mine
   */
  private setPlayerInMine(player: Player, inMine: boolean): void {
    this.playerInMineStates.set(player, inMine);
  }

  /**
   * Stops auto mine mode
   * 
   * @param player - Player to stop auto mine for
   */
  private stopAutoMine(player: Player): void {

    const autoState = this.playerAutoStates.get(player);
    if (autoState?.autoMineInterval) {
      clearInterval(autoState.autoMineInterval);
      autoState.autoMineInterval = undefined;

    }

    // Stop mining loop if active
    if (this.miningController?.isPlayerMining(player)) {

      this.miningController.stopMiningLoop(player);
    }

    // Stop block detection to clear the mining UI
    this.miningController?.stopBlockDetection(player);
  }

  /**
   * Handles player win condition (reaching depth 1000)
   * Increments wins, teleports to surface, resets mines, and resets timer
   *
   * @param player - Player who reached the win condition
   */
  handlePlayerWin(player: Player): void {
    console.log('[GameManager] handlePlayerWin for player:', player.username);

    // Clear any stale modal states
    this.clearBlockingModalStates(player);

    const playerData = this.getPlayerData(player);
    if (!playerData) {
      return;
    }

    // Increment wins based on current world (island1=1, island2=100, island3=1000)
    let winMultiplier = 1;
    if (playerData.currentWorld === 'island2') {
      winMultiplier = 100;
    } else if (playerData.currentWorld === 'island3') {
      winMultiplier = 1000;
    }
    playerData.wins += winMultiplier;
    this.updatePlayerData(player, playerData);

    // Update UI with new wins count
    this.sendPowerStatsToUI(player);

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

    // Stop block detection
    this.miningController?.stopBlockDetection(player);

    // Teleport to the surface of the world the player was mining in
    const worldId = playerData.currentWorld || 'island1';
    const worldConfig = WorldRegistry.getWorldConfig(worldId);
    const spawnPoint = worldConfig?.spawnPoint || { x: 0, y: 10, z: 0 };
    this.teleportPlayer(player, spawnPoint);

    // Mark player as not in the mine
    this.setPlayerInMine(player, false);

    // Reset mine to level 0
    const miningSystem = this.miningController?.getMiningSystem();
    if (miningSystem) {
      miningSystem.resetMineToLevel0(player);
    }

    // Stop the mine reset timer (don't restart it - player is on surface)
    this.stopMineResetTimer(player);

    // Update UI
    player.ui.sendData({
      type: 'MINING_STATE_UPDATE',
      isInMine: false,
    });

    // Clear any existing timer UI since we're on surface
    player.ui.sendData({
      type: 'MINE_RESET_TIMER',
      timeRemaining: null,
      secondsRemaining: 0,
    });

    // Send win notification
    player.ui.sendData({
      type: 'PLAYER_WIN',
      wins: playerData.wins,
    });
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
   * Uses the same teleport position and function as manually holding E
   * 
   * @param player - Player to start auto train for
   */
  private startAutoTrain(player: Player): void {

    const playerData = this.getPlayerData(player);
    if (!playerData) {

      return;
    }

    // Find the highest tier training rock the player can access
    const bestRockLocation = this.trainingController?.findBestAccessibleTrainingRock(player);
    if (!bestRockLocation) {

      return;
    }

    // First, teleport player to a position within the training rock bounds
    // This is required because startTraining checks proximity before teleporting
    // Calculate a position within the bounds (center of the bounds area)
    const bounds = bestRockLocation.bounds;
    let teleportX = bestRockLocation.position.x;
    let teleportZ = -9.27; // Default Z (forward of the ore blocks)
    
    // If bounds exist, use a position within them
    if (bounds) {
      teleportX = (bounds.minX + bounds.maxX) / 2; // Center of bounds in X
      teleportZ = (bounds.minZ + bounds.maxZ) / 2; // Center of bounds in Z
    }
    
    const initialTeleportPosition = {
      x: teleportX,
      y: 1.75, // Ground level
      z: teleportZ,
    };
    
    // Teleport player to be within bounds first

    this.teleportPlayer(player, initialTeleportPosition);

    // Mark player as not in the mine (they're on the surface training)
    this.setPlayerInMine(player, false);

    // Update UI to clear the mining display
    player.ui.sendData({
      type: 'MINING_STATE_UPDATE',
      isInMine: false,
    });

    // Wait a moment for teleport to complete, then start training
    setTimeout(() => {
      const autoState = this.playerAutoStates.get(player);
      if (!autoState?.autoTrainEnabled) {

        return;
      }

      // Now use the same function as holding E - this will teleport to exact position and start training
      // startTraining will teleport to: x: rock.position.x, y: 1.75, z: -9.27
      const trainingStarted = this.trainingController?.startTraining(player, bestRockLocation);
      
      if (!trainingStarted) {

        return;
      }

      // Store position to detect if player leaves training area
      // Use the same teleport position that startTraining uses
      const standPosition = {
        x: bestRockLocation.position.x, // Same X as the ore block
        y: 1.75, // Fixed Y position
        z: -9.27, // Fixed Z position (forward of the ore blocks)
      };

      const playerEntity = this.getPlayerEntity(player);
      if (playerEntity && autoState) {
        autoState.lastAutoTrainPosition = standPosition;

        // Check periodically if player moved away from training rock
        // Also check if player can access a higher-tier training rock
        autoState.autoTrainStopCheckInterval = setInterval(() => {
          if (!autoState.autoTrainEnabled) return;

          // If training was stopped (e.g., by velocity monitoring detecting movement), turn off auto-train
          if (!this.trainingController?.isPlayerTraining(player)) {
            // Only turn off auto train if it's actually enabled (don't toggle - just disable)
            // This prevents the interval from accidentally enabling auto train when it's disabled
            autoState.autoTrainEnabled = false;
            this.stopAutoTrain(player);
            player.ui.sendData({ type: 'AUTO_TRAIN_STATE', enabled: false });
            return;
          }

          const playerEnt = this.getPlayerEntity(player);
          if (!playerEnt || !autoState.lastAutoTrainPosition) return;

          // FIRST: Check for movement - if player moves, turn off auto-train immediately
          // Check for movement input (WASD keys only - don't check space bar to avoid input conflicts)
          const input = player.input;
          const hasMovementInput = Boolean(
            input?.['w'] || input?.['a'] || input?.['s'] || input?.['d'] ||
            input?.['W'] || input?.['A'] || input?.['S'] || input?.['D']
            // Removed space bar check to prevent input interference
          );

          // Check velocity if available
          let hasVelocityMovement = false;
          try {
            const velocity = (playerEnt as any).velocity;
            if (velocity) {
              const vx = velocity.x || 0;
              const vy = velocity.y || 0;
              const vz = velocity.z || 0;
              const horizontalVelocity = Math.sqrt(vx * vx + vz * vz);
              const verticalVelocity = Math.abs(vy);
              hasVelocityMovement = horizontalVelocity > 0.1 || verticalVelocity > 0.1;
            }
          } catch (e) {
            // Velocity not available, use position-based check
          }

          // Check position distance
          const currentPos = playerEnt.position;
          const dx = currentPos.x - autoState.lastAutoTrainPosition.x;
          const dy = currentPos.y - autoState.lastAutoTrainPosition.y;
          const dz = currentPos.z - autoState.lastAutoTrainPosition.z;
          const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
          const verticalDistance = Math.abs(dy);
          const hasPositionMovement = horizontalDistance > 0.3 || verticalDistance > 0.3;

          // If ANY movement detected (input, velocity, or position), turn off auto-train immediately
          if (hasMovementInput || hasVelocityMovement || hasPositionMovement) {

            this.toggleAutoTrain(player);
            return; // Stop checking - auto-train is being turned off
          }

          // SECOND: Check if player can access a better training rock (higher tier)
          const bestRockLocation = this.trainingController?.findBestAccessibleTrainingRock(player);
          if (bestRockLocation) {
            // Get the current training rock the player is on
            const currentTrainingRock = this.trainingController?.getCurrentTrainingRock(player);
            
            // If we're not on the best rock (or not training), switch to it
            // This allows players to automatically upgrade to higher-tier rocks as they gain power/rebirths
            if (!currentTrainingRock || currentTrainingRock.rockData.id !== bestRockLocation.rockData.id) {

              // Stop current training if any
              if (this.trainingController?.isPlayerTraining(player)) {
                this.trainingController.stopTraining(player);
              }
              
              // Teleport to the new training rock and start training
              const bounds = bestRockLocation.bounds;
              let teleportX = bestRockLocation.position.x;
              let teleportZ = -9.27;
              
              if (bounds) {
                teleportX = (bounds.minX + bounds.maxX) / 2;
                teleportZ = (bounds.minZ + bounds.maxZ) / 2;
              }
              
              const initialTeleportPosition = {
                x: teleportX,
                y: 1.75,
                z: teleportZ,
              };
              
              this.teleportPlayer(player, initialTeleportPosition);
              
              // Wait a moment, then start training on the new rock
              setTimeout(() => {
                if (!autoState?.autoTrainEnabled) return;
                
                const trainingStarted = this.trainingController?.startTraining(player, bestRockLocation);
                if (trainingStarted) {
                  const newStandPosition = {
                    x: bestRockLocation.position.x,
                    y: 1.75,
                    z: -9.27,
                  };
                  autoState.lastAutoTrainPosition = newStandPosition;

                }
              }, 200);
              
              return; // Skip rest of checks this cycle since we're switching rocks
            }
          }
        }, 2000); // Check every 2 seconds (less frequent since we're also checking for upgrades)
      }
    }, 200); // Small delay to allow initial teleport to complete
  }

  /**
   * Stops auto train mode
   * 
   * @param player - Player to stop auto train for
   */
  private stopAutoTrain(player: Player): void {

    const autoState = this.playerAutoStates.get(player);
    if (autoState?.autoTrainStopCheckInterval) {
      clearInterval(autoState.autoTrainStopCheckInterval);
      autoState.autoTrainStopCheckInterval = undefined;

    }
    
    // Stop training if active
    if (this.trainingController?.isPlayerTraining(player)) {

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
    
    // Stop block detection when leaving mine (this also clears the UI)
    this.miningController?.stopBlockDetection(player);

    // NOTE: Do NOT stop the mine reset timer when manually teleporting
    // The timer should continue running and be visible even on surface
    // It will only stop when it expires or when the mine is reset

    // Get player's current world and teleport to that world's surface spawn position
    const playerData = this.playerDataMap.get(player);
    const currentWorldId = playerData?.currentWorld || 'island1';
    const worldConfig = WorldRegistry.getWorldConfig(currentWorldId);
    
    // Use the world's spawn point, or fallback to island1 spawn if config not found
    const spawnPoint = worldConfig?.spawnPoint || { x: 0, y: 10, z: 0 };
    this.teleportPlayer(player, spawnPoint);

    // Mark player as not in the mine (disables mining and raycasting)
    this.setPlayerInMine(player, false);

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

      return;
    }

    const entryPosition = miningSystem.preparePlayerMine(player, pickaxe);
    this.teleportPlayer(player, entryPosition);

    // Mark player as in the mine (enables mining and raycasting)
    this.setPlayerInMine(player, true);

    player.ui.sendData({
      type: 'MINING_STATE_UPDATE',
      isInMine: true,
    });

    // Ensure timer UI is visible if timer is running
    // This ensures the timer stays visible when re-entering the mine
    if (this.mineResetTimers.has(player)) {
      this.updateMineResetTimerUI(player);
    }

    // Update depth counter when entering mine
    this.updateMiningDepthCounter(player);

    // Start block detection to show what block player is standing on
    // Wait a moment for teleport to complete
    setTimeout(() => {
      if (this.miningController) {
        this.miningController.startBlockDetection(player);
      }
    }, 300);
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

    // Check if player has the upgrade for the current world
    const playerData = this.getPlayerData(player);
    const currentWorld = playerData?.currentWorld || 'island1';
    const hasUpgrade = playerData?.mineResetUpgradePurchased?.[currentWorld] ?? false;
    const duration = hasUpgrade ? this.MINE_RESET_DURATION_UPGRADED_MS : this.MINE_RESET_DURATION_MS;

    const startTime = Date.now();
    this.mineResetStartTimes.set(player, startTime);

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

    // Get the correct duration based on upgrade for current world
    const playerData = this.getPlayerData(player);
    const currentWorld = playerData?.currentWorld || 'island1';
    const hasUpgrade = playerData?.mineResetUpgradePurchased?.[currentWorld] ?? false;
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

    // Get current world
    const currentWorld = playerData.currentWorld || 'island1';
    
    // Initialize the upgrade map if it doesn't exist
    if (!playerData.mineResetUpgradePurchased) {
      playerData.mineResetUpgradePurchased = {};
    }

    // Check if already purchased for this world
    if (playerData.mineResetUpgradePurchased[currentWorld]) {
      return {
        success: false,
        message: 'Upgrade already purchased for this world',
      };
    }

    // Get upgrade cost based on world (use WorldManager if available, otherwise default)
    // For now, use hardcoded values - island1: 2M, island2: 750B
    const UPGRADE_COST = currentWorld === 'island2' ? 750_000_000_000 : 2_000_000;
    
    if (playerData.gold < UPGRADE_COST) {
      return {
        success: false,
        message: `Insufficient gold. Need ${UPGRADE_COST.toLocaleString()}, have ${playerData.gold.toLocaleString()}`,
      };
    }

    // Deduct gold and mark upgrade as purchased for this world
    playerData.gold -= UPGRADE_COST;
    playerData.mineResetUpgradePurchased[currentWorld] = true;
    this.updatePlayerData(player, playerData);

    // Update gold UI
    player.ui.sendData({
      type: 'GOLD_STATS',
      gold: playerData.gold,
    });

    return {
      success: true,
      remainingGold: playerData.gold,
    };
  }

  /**
   * Called when the mine reset timer expires
   * Resets the mine and teleports player to surface if they're in the mine
   * 
   * @param player - Player whose timer expired
   */
  private onMineResetTimerExpired(player: Player): void {
    console.log('[GameManager] onMineResetTimerExpired for player:', player.username);

    // Clear any stale modal states (UI might not send MODAL_CLOSED when state changes)
    this.clearBlockingModalStates(player);

    // Stop timer updates
    this.stopMineResetTimer(player);

    // Check if player is in the mine
    const isInMine = this.isPlayerInMine(player);

    // Check if player is currently training - if so, don't interrupt their training
    const isTraining = this.trainingController?.isPlayerTraining(player) ?? false;

    // Stop auto modes and mining (but not if player is training)
    const autoState = this.playerAutoStates.get(player);
    console.log('[GameManager] onMineResetTimerExpired - isTraining:', isTraining, 'autoTrainEnabled:', autoState?.autoTrainEnabled, 'isInMine:', isInMine);
    if (autoState) {
      if (autoState.autoMineEnabled) {
        this.stopAutoMine(player);
        autoState.autoMineEnabled = false;
        player.ui.sendData({ type: 'AUTO_MINE_STATE', enabled: false });
      }
      // Don't stop auto-train if player is currently training
      if (autoState.autoTrainEnabled && !isTraining) {
        this.stopAutoTrain(player);
        autoState.autoTrainEnabled = false;
        player.ui.sendData({ type: 'AUTO_TRAIN_STATE', enabled: false });
      }
    }

    // Stop mining if active (but not if player is training - they use the same animation)
    if (!isTraining) {
      this.miningController?.stopMiningLoop(player);
      // Stop block detection so mining UI clears when timer boots player out
      this.miningController?.stopBlockDetection(player);
    }

    // Only teleport if player is in the mine (they need to be moved out)
    // If they're not in the mine, we don't need to teleport them
    // Also skip teleport if player is training - they're on the surface at a training rock
    if (isInMine && !isTraining) {
      // Get player's current world to teleport to the correct surface
      const playerData = this.getPlayerData(player);
      const currentWorldId = playerData?.currentWorld || 'island1';
      const worldConfig = WorldRegistry.getWorldConfig(currentWorldId);
      const spawnPoint = worldConfig?.spawnPoint || { x: 0, y: 10, z: 0 };

      // Teleport to surface of the current world
      this.teleportPlayer(player, spawnPoint);

      // Mark player as not in the mine (disables mining and raycasting)
      this.setPlayerInMine(player, false);
    } else if (isInMine && isTraining) {
      // Player is training on surface but isInMine flag was stale - just clear the flag
      this.setPlayerInMine(player, false);
    }

    // Reset mine to level 0 (regardless of whether player is in mine or not)
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

    // Update mining state UI (only if player was in mine)
    if (isInMine) {
      player.ui.sendData({
        type: 'MINING_STATE_UPDATE',
        isInMine: false,
      });
    }
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
    // Get the current mine level (0-based) - this represents blocks mined
    // Each mine level is 3 Y levels tall, so mine level 0 = Y: 0, -1, -2
    // mine level 1 = Y: -3, -4, -5, etc.
    // This ensures the progress bar shows blocks mined, not Y levels descended
    const mineLevel = this.miningController?.getCurrentMineLevel(player) ?? 0;

    player.ui.sendData({
      type: 'PROGRESS_UPDATE',
      currentDepth: mineLevel, // Mine level (blocks mined) - should be 0-1000
      goalDepth: 1000,
    });

    // Also send depth counter update (mine level, 0-1000)
    this.updateMiningDepthCounter(player);
  }

  /**
   * Updates the mining depth counter UI for a player
   * Shows the current mine level (0-1000)
   * 
   * @param player - Player to update depth counter for
   */
  private updateMiningDepthCounter(player: Player): void {
    if (!this.miningController) return;

    const mineLevel = this.miningController.getCurrentMineLevel(player);
    // Clamp to 0-1000 range for display
    const displayDepth = Math.min(1000, Math.max(0, mineLevel));

    player.ui.sendData({
      type: 'MINING_DEPTH_COUNTER',
      depth: displayDepth,
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
    this.playerInMineStates.delete(player);
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

        }
      }
    }

  }

  /**
   * Builds the shared mine shaft for Island 2 (Beach World)
   * Same structure as the original island but using beach world coordinates and beach ores
   */
  buildSharedMineShaftForIsland2(): void {
    // Carve a 10-block-deep hole covering the mining area and add sand walls + void block
    const bounds = ISLAND2_MINING_AREA_BOUNDS;
    const topY = ISLAND2_SHARED_MINE_SHAFT.topY;
    const bottomY = ISLAND2_SHARED_MINE_SHAFT.bottomY + 1; // carve down to bottomY inclusive
    const wallMinX = bounds.minX - 1;
    const wallMaxX = bounds.maxX + 1;
    const wallMinZ = bounds.minZ - 1;
    const wallMaxZ = bounds.maxZ + 1;
    const sandId = 43; // Sand block for beach world
    const voidId = 2; // coal-block (black)

    // Carve interior to air
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      for (let z = bounds.minZ; z <= bounds.maxZ; z++) {
        for (let y = topY; y >= bottomY; y--) {
          try {
            this.world.chunkLattice.setBlock({ x, y, z }, 0);
          } catch (err) {

          }
        }
      }
    }

    // Build sand walls around the hole for all carved depths
    for (let y = topY; y >= bottomY; y--) {
      for (let x = wallMinX; x <= wallMaxX; x++) {
        for (let z = wallMinZ; z <= wallMaxZ; z++) {
          const isWall = x === wallMinX || x === wallMaxX || z === wallMinZ || z === wallMaxZ;
          if (!isWall) continue;
          try {
            this.world.chunkLattice.setBlock({ x, y, z }, sandId);
          } catch (err) {

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

        }
      }
    }

  }

  /**
   * Builds the shared mine shaft for Island 3 (Volcanic World)
   */
  buildSharedMineShaftForIsland3(): void {
    const bounds = ISLAND3_MINING_AREA_BOUNDS;
    const topY = ISLAND3_SHARED_MINE_SHAFT.topY;
    const bottomY = ISLAND3_SHARED_MINE_SHAFT.bottomY + 1; // carve down to bottomY inclusive
    const wallMinX = bounds.minX - 1;
    const wallMaxX = bounds.maxX + 1;
    const wallMinZ = bounds.minZ - 1;
    const wallMaxZ = bounds.maxZ + 1;
    const deepslateCobbleId = 2; // cobbled-deepslate
    const voidId = 2; // coal-block (black)

    // Carve interior to air
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      for (let z = bounds.minZ; z <= bounds.maxZ; z++) {
        for (let y = topY; y >= bottomY; y--) {
          try {
            this.world.chunkLattice.setBlock({ x, y, z }, 0);
          } catch (err) {

          }
        }
      }
    }

    // Build deepslate cobble walls around the hole for all carved depths
    for (let y = topY; y >= bottomY; y--) {
      for (let x = wallMinX; x <= wallMaxX; x++) {
        for (let z = wallMinZ; z <= wallMaxZ; z++) {
          const isWall = x === wallMinX || x === wallMaxX || z === wallMinZ || z === wallMaxZ;
          if (!isWall) continue;
          try {
            this.world.chunkLattice.setBlock({ x, y, z }, deepslateCobbleId);
          } catch (err) {

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

        }
      }
    }
  }

  /**
   * Starts per-player watcher that teleports them to their personal mine when they reach the shaft bottom
   * Checks Island 1, Island 2, and Island 3 mineshafts
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
      const now = Date.now();

      // Get player's current world to determine which mineshaft to check
      const playerData = this.getPlayerData(player);
      const currentWorld = playerData?.currentWorld || 'island1';
      
      // Check Island 1 mineshaft
      const shaft1 = SHARED_MINE_SHAFT;
      const inBounds1 =
        pos.x >= shaft1.bounds.minX && pos.x <= shaft1.bounds.maxX &&
        pos.z >= shaft1.bounds.minZ && pos.z <= shaft1.bounds.maxZ;
      
      if (inBounds1 && pos.y <= shaft1.teleportThresholdY) {
        const last = this.mineEntranceCooldowns.get(player) ?? 0;
        if (now - last < this.MINE_ENTRANCE_COOLDOWN_MS) {
          return;
        }
        this.mineEntranceCooldowns.set(player, now);
        this.enterPersonalMine(player);
        return;
      }

      // Check Island 2 mineshaft
      const shaft2 = ISLAND2_SHARED_MINE_SHAFT;
      const inBounds2 =
        pos.x >= shaft2.bounds.minX && pos.x <= shaft2.bounds.maxX &&
        pos.z >= shaft2.bounds.minZ && pos.z <= shaft2.bounds.maxZ;
      
      if (inBounds2 && pos.y <= shaft2.teleportThresholdY) {
        const last = this.mineEntranceCooldowns.get(player) ?? 0;
        if (now - last < this.MINE_ENTRANCE_COOLDOWN_MS) {
          return;
        }
        this.mineEntranceCooldowns.set(player, now);
        this.enterPersonalMine(player);
        return;
      }

      // Check Island 3 mineshaft
      const shaft3 = ISLAND3_SHARED_MINE_SHAFT;
      const inBounds3 =
        pos.x >= shaft3.bounds.minX && pos.x <= shaft3.bounds.maxX &&
        pos.z >= shaft3.bounds.minZ && pos.z <= shaft3.bounds.maxZ;

      if (inBounds3 && pos.y <= shaft3.teleportThresholdY) {
        const last = this.mineEntranceCooldowns.get(player) ?? 0;
        if (now - last < this.MINE_ENTRANCE_COOLDOWN_MS) {
          return;
        }
        this.mineEntranceCooldowns.set(player, now);
        this.enterPersonalMine(player);
        return;
      }
    }, 250);

    this.mineEntranceIntervals.set(player, interval);
  }

  /**
   * Unlocks a world for a player
   * 
   * @param player - Player to unlock world for
   * @param worldId - World ID to unlock
   * @returns True if unlocked successfully, false otherwise
   */
  unlockWorld(player: Player, worldId: string): { success: boolean; message?: string } {
    const playerData = this.getPlayerData(player);
    if (!playerData) {
      return { success: false, message: 'Player data not found' };
    }

    // Check if world exists
    const worldConfig = WorldRegistry.getWorldConfig(worldId);
    if (!worldConfig) {
      return { success: false, message: 'World not found' };
    }

    // Check if already unlocked
    const unlockedWorlds = playerData.unlockedWorlds || ['island1'];
    if (unlockedWorlds.includes(worldId)) {
      return { success: false, message: 'World already unlocked' };
    }

    // Check unlock requirement
    if (worldConfig.unlockRequirement.type === 'wins') {
      if (playerData.wins < worldConfig.unlockRequirement.amount) {
        return { 
          success: false, 
          message: `Need ${worldConfig.unlockRequirement.amount} wins to unlock this world` 
        };
      }
    }

    // Unlock the world
    if (!unlockedWorlds.includes(worldId)) {
      unlockedWorlds.push(worldId);
      playerData.unlockedWorlds = unlockedWorlds;
      this.updatePlayerData(player, playerData);
    }

    return { success: true };
  }

  /**
   * Teleports a player to a world
   * 
   * @param player - Player to teleport
   * @param worldId - World ID to teleport to
   * @returns True if teleported successfully, false otherwise
   */
  teleportToWorld(player: Player, worldId: string): { success: boolean; message?: string } {
    const playerData = this.getPlayerData(player);
    if (!playerData) {
      return { success: false, message: 'Player data not found' };
    }

    // Check if world exists
    const worldConfig = WorldRegistry.getWorldConfig(worldId);
    if (!worldConfig) {
      return { success: false, message: 'World not found' };
    }

    // Check if world is unlocked
    const unlockedWorlds = playerData.unlockedWorlds || ['island1'];
    if (!unlockedWorlds.includes(worldId)) {
      return { success: false, message: 'World not unlocked' };
    }

    // Stop auto modes before teleporting
    this.stopAutoMine(player);
    this.stopAutoTrain(player);

    // Show loading screen and suppress input during world switch
    this.setPlayerLoading(player, true);

    // Stop mining and block detection when leaving current mines
    this.miningController?.stopMiningLoop(player);
    this.miningController?.stopBlockDetection(player);

    // Mark player as not in the mine while on the surface
    this.setPlayerInMine(player, false);

    // Update UI to reflect leaving the mine
    player.ui.sendData({
      type: 'MINING_STATE_UPDATE',
      isInMine: false,
    });

    // Stop mine reset timer (will restart when player mines first block in new world)
    this.stopMineResetTimer(player);

    // Hide timer and depth HUD when changing worlds (timer hasn't started yet)
    player.ui.sendData({
      type: 'MINE_RESET_TIMER',
      timeRemaining: null, // This will hide the timer UI
    });
    
    // Reset depth counter display (will show again when player enters mines)
    player.ui.sendData({
      type: 'MINING_DEPTH_COUNTER',
      depth: 0,
    });

    // Update current world first so mine generation uses the correct world
    playerData.currentWorld = worldId;
    this.updatePlayerData(player, playerData);

    // Generate mine for the new world before teleporting
    this.initializePlayerMine(player);

    // Teleport player to spawn point
    const spawnPoint = worldConfig.spawnPoint;
    this.teleportPlayer(player, spawnPoint);

    // Allow time for mine generation/rendering before removing the loading screen
    setTimeout(() => {
      this.setPlayerLoading(player, false);
    }, 1500);

    return { success: true };
  }

  /**
   * Gets world selection data for UI
   * 
   * @param player - Player to get world data for
   * @returns World selection data
   */
  getWorldSelectionData(player: Player): {
    worlds: Array<{
      id: string;
      name: string;
      displayOrder: number;
      isUnlocked: boolean;
      isCurrent: boolean;
      unlockRequirement?: { type: string; amount: number };
      trophyMultiplier: number;
    }>;
  } {
    const playerData = this.getPlayerData(player);
    const unlockedWorlds = playerData?.unlockedWorlds || ['island1'];
    const currentWorld = playerData?.currentWorld || 'island1';

    const allWorlds = WorldRegistry.getAllWorlds();
    const worlds = allWorlds.map(world => ({
      id: world.id,
      name: world.name,
      displayOrder: world.displayOrder,
      isUnlocked: unlockedWorlds.includes(world.id),
      isCurrent: currentWorld === world.id,
      unlockRequirement: world.unlockRequirement,
      trophyMultiplier: world.trophyMultiplier,
    }));

    return { worlds };
  }
}
