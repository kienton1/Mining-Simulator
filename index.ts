/**
 * HYTOPIA SDK Boilerplate
 * 
 * This is a simple boilerplate to get started on your project.
 * It implements the bare minimum to be able to run and connect
 * to your game server and run around as the basic player entity.
 * 
 * From here you can begin to implement your own game logic
 * or do whatever you want!
 * 
 * You can find documentation here: https://github.com/hytopiagg/sdk/blob/main/docs/server.md
 * 
 * For more in-depth examples, check out the examples folder in the SDK, or you
 * can find it directly on GitHub: https://github.com/hytopiagg/sdk/tree/main/examples/payload-game
 * 
 * You can officially report bugs or request features here: https://github.com/hytopiagg/sdk/issues
 * 
 * To get help, have found a bug, or want to chat with
 * other HYTOPIA devs, join our Discord server:
 * https://discord.gg/DXCXJbHSJX
 * 
 * Official SDK Github repo: https://github.com/hytopiagg/sdk
 * Official SDK NPM Package: https://www.npmjs.com/package/hytopia
 */

import {
  startServer,
  Audio,
  PlayerEvent,
  PlayerUIEvent,
  CollisionGroup,
} from 'hytopia';
import { ORE_DATABASE, OreType, type OreData } from './src/Mining/Ore/World1OreData';
import { ISLAND2_ORE_DATABASE, ISLAND2_ORE_TYPE, type Island2OreData } from './src/Mining/Ore/World2OreData';

import * as worldMap from './assets/map.json';
import { GameManager } from './src/Core/GameManager';
import { PickaxeManager } from './src/Pickaxe/PickaxeManager';
import { MiningPlayerEntity } from './src/Core/MiningPlayerEntity';
import { MerchantEntity } from './src/Shop/MerchantEntity';
import { MineResetUpgradeNPC } from './src/Shop/MineResetUpgradeNPC';
import { GemTraderEntity } from './src/Shop/GemTraderEntity';
import { UpgradeType } from './src/Shop/GemTraderUpgradeSystem';
import { EggType } from './src/Pets/PetData';
import { getPetDefinition, PET_EQUIP_CAPACITY, PET_INVENTORY_CAPACITY } from './src/Pets/PetDatabase';
import { EggStationManager } from './src/Pets/EggStationManager';
import { EggStationLabelManager } from './src/Pets/EggStationLabelManager';
import { WorldRegistry } from './src/WorldRegistry';
import { ISLAND1_CONFIG } from './src/worldData/Island1Config';
import { ISLAND2_CONFIG } from './src/worldData/Island2Config';

/**
 * startServer is always the entry point for our game.
 * It accepts a single function where we should do any
 * setup necessary for our game. The init function is
 * passed a World instance which is the default
 * world created by the game server on startup.
 * 
 * Documentation: https://github.com/hytopiagg/sdk/blob/main/docs/server.startserver.md
 */

startServer(world => {
  /**
   * Enable debug rendering of the physics simulation.
   * This will overlay lines in-game representing colliders,
   * rigid bodies, and raycasts. This is useful for debugging
   * physics-related issues in a development environment.
   * Enabling this can cause performance issues, which will
   * be noticed as dropped frame rates and higher RTT times.
   * It is intended for development environments only and
   * debugging physics.
   */
  
  world.simulation.enableDebugRendering(true);
  if ((world.simulation as any).enableDebugRaycasting) {

    (world.simulation as any).enableDebugRaycasting(true);
  }

  /**
   * Initialize Pickaxe Manager
   * This manages pickaxe entities attached to players
   */
  const pickaxeManager = new PickaxeManager(world);

  /**
   * Initialize World Registry
   * Register all worlds (island1 is default, island2 is beach world)
   */
  WorldRegistry.registerWorld(ISLAND1_CONFIG);
  WorldRegistry.registerWorld(ISLAND2_CONFIG);

  /**
   * Initialize Game Manager
   * This manages all player data and game state
   */
  const gameManager = new GameManager(world, pickaxeManager);

  /**
   * Load our map.
   * Map structure:
   * - Cobbled-deepslate clusters = Training rocks (practice area)
   * - Gold block area = Mine entrance (mining area)
   * See Planning/mapStructure.md for details
   */
  world.loadMap(worldMap);
  // Carve shared mine shaft (10-block drop) for all players - Island 1 (Original)
  gameManager.buildSharedMineShaft();
  // Carve shared mine shaft for Island 2 (Beach World) with beach ores
  gameManager.buildSharedMineShaftForIsland2();

  /**
   * Spawn Merchant Entity
   * Merchant is located at the specified position and allows players to sell ores
   */
  const merchantEntity = new MerchantEntity(
    world,
    { x: -12.82, y: 1.79, z: 11.28 },
    'models/npcs/villager.gltf' // Can be changed to any model
  );
  merchantEntity.spawn();

  /**
   * Spawn Mine Reset Upgrade NPC
   * NPC is located at the specified position and allows players to purchase the 5-minute upgrade
   */
  const mineResetUpgradeNPC = new MineResetUpgradeNPC(
    world,
    { x: 5.08, y: 1.79, z: 14.35 },
    'models/npcs/villager.gltf'
  );
  mineResetUpgradeNPC.spawn();

  /**
   * Spawn Gem Trader Entity
   * NPC is located at the specified position and allows players to purchase gem upgrades
   */
  const gemTraderEntity = new GemTraderEntity(
    world,
    { x: 14.83, y: 1.75, z: 9.29 },
    'models/npcs/villager.gltf'
  );
  gemTraderEntity.spawn();

  /**
   * Egg Stations (barrels in `assets/map.json`)
   * Using the user-provided "closest to" coordinates (matches the 3 barrel props).
   */
  const eggStations = [
    {
      id: 'egg-station-stone',
      name: 'Stone Egg Station',
      eggType: EggType.STONE,
      defaultOpenCount: 1 as const,
      // Exact barrel prop coordinate from `assets/map.json` entities: "-13,2,9"
      position: { x: -13, y: 2, z: 9 },
    },
    {
      id: 'egg-station-gem',
      name: 'Gem Egg Station',
      eggType: EggType.GEM,
      defaultOpenCount: 3 as const,
      // Exact barrel prop coordinate from `assets/map.json` entities: "-13,2,5"
      position: { x: -13, y: 2, z: 5 },
    },
    {
      id: 'egg-station-crystal',
      name: 'Crystal Egg Station',
      eggType: EggType.CRYSTAL,
      defaultOpenCount: 1 as const,
      // Exact barrel prop coordinate from `assets/map.json` entities: "-13,2,1"
      position: { x: -13, y: 2, z: 1 },
    },
  ];

  // Egg UI should only pop when you're right up on the barrel (~1 block).
  const eggStationManager = new EggStationManager(world, gameManager, eggStations, 1.1);
  eggStationManager.start();

  // Floating name + cost labels (SceneUI), anchored like training rocks.
  // Delay slightly so the client has time to register the `egg:prompt` template.
  const eggStationLabelManager = new EggStationLabelManager(world, eggStations);
  setTimeout(() => eggStationLabelManager.start(), 1000);

  function sendPetState(player: any) {
    const playerData = gameManager.getPlayerData(player);
    if (!playerData) return;

    const inv = Array.isArray(playerData.petInventory) ? playerData.petInventory : [];
    const eq = Array.isArray(playerData.equippedPets) ? playerData.equippedPets : [];
    const ownedCount = inv.length + eq.length;

    // Expanded list: one entry per pet instance with a stable instanceId.
    // This is required to support duplicates reliably in the UI.
    const pets = [
      ...eq.map((petId: string, idx: number) => ({ instanceId: `eq:${idx}`, petId, equipped: true, slotIndex: idx })),
      ...inv.map((petId: string, idx: number) => ({ instanceId: `inv:${idx}`, petId, equipped: false, slotIndex: idx })),
    ].map((p) => {
      const def = getPetDefinition(p.petId);
      return {
        instanceId: p.instanceId,
        petId: p.petId,
        equipped: p.equipped,
        slotIndex: p.slotIndex,
        name: def?.name ?? p.petId,
        rarity: def?.rarity ?? 'common',
        eggType: def?.eggType ?? 'stone',
        multiplier: def?.multiplier ?? 0,
      };
    });

    const multiplierSum = gameManager.getPetManager().getEquippedMultiplierSum(player);
    const trainingMultiplier = gameManager.getPetManager().getTrainingMultiplierSum(player);

    player.ui.sendData({
      type: 'PET_STATE',
      pets,
      ownedCount,
      ownedCap: PET_INVENTORY_CAPACITY,
      equippedCount: eq.length,
      equippedCap: PET_EQUIP_CAPACITY,
      multiplierSum,
      trainingMultiplier,
    });
  }

  /**
   * Handle merchant proximity events
   * When player enters/leaves merchant proximity, show/hide selling UI
   */
  merchantEntity.onProximityChange = (player, inProximity, distance) => {
    if (inProximity) {
      // Player entered proximity - send inventory data to show UI
      const inventory = gameManager.getInventoryManager().getInventory(player);
      const playerData = gameManager.getPlayerData(player);
      
      // Use SellingSystem to get total value with all multipliers (pickaxe + More Coins)
      const totalValue = gameManager.getSellingSystem().getSellValue(player);
      
      // Calculate sell values per ore with all multipliers for UI display
      // Use the selling system's method to get the combined multiplier (includes miner bonus)
      const sellMultiplier = gameManager.getSellingSystem().getCombinedCoinMultiplier(player);
      
      const oreSellValues: Record<string, number> = {};
      for (const [oreType, amount] of Object.entries(inventory)) {
        if (amount && amount > 0) {
          // Try Island 1 database first
          let oreData: OreData | Island2OreData | undefined = ORE_DATABASE[oreType as OreType];
          // Try Island 2 database if not found
          if (!oreData && oreType in ISLAND2_ORE_DATABASE) {
            oreData = ISLAND2_ORE_DATABASE[oreType as ISLAND2_ORE_TYPE];
          }
          if (oreData) {
            // Calculate sell value per unit with multipliers
            let sellValue = oreData.value * sellMultiplier;
            // Round to nearest integer (no decimals)
            sellValue = Math.round(sellValue);
            oreSellValues[oreType] = sellValue;
          }
        }
      }
      
      player.ui.sendData({
        type: 'MERCHANT_PROXIMITY',
        inProximity: true,
        inventory,
        totalValue,
        oreSellValues, // Send sell values per ore with multipliers
        gold: playerData?.gold || 0,
      });
    } else {
      // Player left proximity - hide UI
      player.ui.sendData({
        type: 'MERCHANT_PROXIMITY',
        inProximity: false,
      });
    }
  };

  /**
   * Handle mine reset upgrade NPC proximity events
   * When player enters/leaves NPC proximity, show/hide upgrade UI
   */
  mineResetUpgradeNPC.onProximityChange = (player, inProximity, distance) => {
    if (inProximity) {
      // Player entered proximity - send upgrade data to show UI
      const playerData = gameManager.getPlayerData(player);
      const currentWorld = playerData?.currentWorld || 'island1';
      const hasUpgrade = playerData?.mineResetUpgradePurchased?.[currentWorld] ?? false;
      // Cost varies by world: island1 = 2M, island2 = 750B
      const cost = currentWorld === 'island2' ? 750_000_000_000 : 2_000_000;
      const gold = playerData?.gold || 0;
      
      player.ui.sendData({
        type: 'MINE_RESET_UPGRADE_PROXIMITY',
        inProximity: true,
        hasUpgrade,
        cost,
        gold,
      });
    } else {
      // Player left proximity - hide UI
      player.ui.sendData({
        type: 'MINE_RESET_UPGRADE_PROXIMITY',
        inProximity: false,
      });
    }
  };

  /**
   * Handle gem trader proximity events
   * When player enters/leaves gem trader proximity, show/hide upgrades UI
   */
  gemTraderEntity.onProximityChange = (player, inProximity, distance) => {
    if (inProximity) {
      // Player entered proximity - send upgrade data to show UI
      const playerData = gameManager.getPlayerData(player);
      const upgradeSystem = gameManager.getGemTraderUpgradeSystem();
      
      // Get upgrade info for all upgrade types
      const moreGemsInfo = upgradeSystem.getUpgradeInfo(player, UpgradeType.MORE_GEMS);
      const moreRebirthsInfo = upgradeSystem.getUpgradeInfo(player, UpgradeType.MORE_REBIRTHS);
      const moreCoinsInfo = upgradeSystem.getUpgradeInfo(player, UpgradeType.MORE_COINS);
      const moreDamageInfo = upgradeSystem.getUpgradeInfo(player, UpgradeType.MORE_DAMAGE);

      player.ui.sendData({
        type: 'GEM_TRADER_PROXIMITY',
        inProximity: true,
        gems: playerData?.gems || 0,
        upgrades: {
          moreGems: {
            level: moreGemsInfo.currentLevel,
            cost: moreGemsInfo.nextLevelCost,
            canAfford: moreGemsInfo.canAfford,
          },
          moreRebirths: {
            level: moreRebirthsInfo.currentLevel,
            cost: moreRebirthsInfo.nextLevelCost,
            canAfford: moreRebirthsInfo.canAfford,
          },
          moreCoins: {
            level: moreCoinsInfo.currentLevel,
            cost: moreCoinsInfo.nextLevelCost,
            canAfford: moreCoinsInfo.canAfford,
          },
          moreDamage: {
            level: moreDamageInfo.currentLevel,
            cost: moreDamageInfo.nextLevelCost,
            canAfford: moreDamageInfo.canAfford,
          },
        },
      });
    } else {
      // Player left proximity - hide UI
      player.ui.sendData({
        type: 'GEM_TRADER_PROXIMITY',
        inProximity: false,
      });
    }
  };

  /**
   * Handle player joining the game. The PlayerEvent.JOINED_WORLD
   * event is emitted to the world when a new player connects to
   * the game. From here, we create a basic player
   * entity instance which automatically handles mapping
   * their inputs to control their in-game entity and
   * internally uses our player entity controller.
   * 
   * The HYTOPIA SDK is heavily driven by events, you
   * can find documentation on how the event system works,
   * here: https://dev.hytopia.com/sdk-guides/events
   */
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    // Add player to merchant tracking
    merchantEntity.addPlayer(player);
    // Add player to mine reset upgrade NPC tracking
    mineResetUpgradeNPC.addPlayer(player);
    // Add player to gem trader tracking
    gemTraderEntity.addPlayer(player);
    // Add player to egg station tracking
    eggStationManager.addPlayer(player);
    
    // Initialize player data with defaults first (synchronous)
    // This ensures entity can spawn immediately for proper camera setup
    const defaultPlayerData = gameManager.initializePlayerSync(player);
    
    // Create custom player entity that handles input (like NewGame's GamePlayerEntity)
    // MUST spawn synchronously for camera to attach properly
    const playerEntity = new MiningPlayerEntity(player);
    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });

    // Disable player-to-player collisions
    // Players belong to PLAYER group but don't collide with other players
    // They still collide with blocks, entities, and everything else
    playerEntity.setCollisionGroupsForSolidColliders({
      belongsTo: [CollisionGroup.PLAYER],
      collidesWith: [CollisionGroup.ALL & ~CollisionGroup.PLAYER],
    });
    
    // Also update sensor colliders (if any) to prevent sensor collisions between players
    playerEntity.setCollisionGroupsForSensorColliders({
      belongsTo: [CollisionGroup.PLAYER],
      collidesWith: [CollisionGroup.ALL & ~CollisionGroup.PLAYER],
    });

    // Set and lock camera zoom (zoom out a bit and prevent player from changing it)
    // Wait a moment for camera to initialize
    setTimeout(() => {
      const LOCKED_ZOOM = .6; // Zoom out a bit (1.0 = first person, higher = more zoomed out)
      player.camera.setZoom(LOCKED_ZOOM);
      
      // Store the locked zoom value on the player object
      (player as any).__lockedZoom = LOCKED_ZOOM;
      
      // Continuously enforce the zoom level (lock it) - check very frequently
      const zoomLockInterval = setInterval(() => {
        const currentZoom = player.camera.zoom;
        const lockedZoom = (player as any).__lockedZoom;
        
        // Always set it, even if it matches (ensures it stays locked)
        if (Math.abs(currentZoom - lockedZoom) > 0.01) {
          player.camera.setZoom(lockedZoom);
        } else {
          // Even if it matches, set it again to prevent any changes
          player.camera.setZoom(lockedZoom);
        }
      }, 16); // Check every 16ms (~60fps) for maximum responsiveness
      
      // Store interval ID for cleanup
      (player as any).__zoomLockInterval = zoomLockInterval;

    }, 300);

    // Attach pickaxe to player (spawns with default tier 0 - Rusty pickaxe)
    pickaxeManager.attachPickaxeToPlayer(player, defaultPlayerData.currentPickaxeTier);
    
    // Initialize player's mine (creates mining state and generates mine)
    // This ensures the mine is ready for auto-mine and manual mining
    gameManager.initializePlayerMine(player);
    
    // Load saved data in background and update if different
    // This doesn't block entity spawning, so camera works correctly
    gameManager.initializePlayerAsync(player).then(loadedData => {
      // Only update if loaded data is different from defaults
      const currentData = gameManager.getPlayerData(player);
      if (currentData && loadedData) {
        // Store the saved pickaxe and miner tiers before updating
        // Use the loaded data values directly (they've already been validated by PersistenceManager)
        const savedPickaxeTier = loadedData.currentPickaxeTier ?? defaultPlayerData.currentPickaxeTier;
        const savedMinerTier = loadedData.currentMinerTier ?? defaultPlayerData.currentMinerTier;
        
        // IMPORTANT: Reset currentWorld to 'island1' since players always spawn in the default world (island1)
        // The saved currentWorld might be from a previous session, but the player is actually in island1
        loadedData.currentWorld = 'island1';
        
        // Update with loaded data (this updates the in-memory playerDataMap)
        gameManager.updatePlayerData(player, loadedData);
        
        // Always restore pickaxe from saved data (ensures persistence works correctly)
        // Use a small delay to ensure entity is fully spawned before attaching pickaxe
        setTimeout(() => {
          pickaxeManager.attachPickaxeToPlayer(player, savedPickaxeTier);
        }, 50);
        
        // Re-initialize mine with saved pickaxe (in case mine generation depends on pickaxe)
        // Only re-initialize if pickaxe tier actually changed from default
        if (savedPickaxeTier !== defaultPlayerData.currentPickaxeTier) {
          // Small delay to ensure pickaxe is attached first
          setTimeout(() => {
            gameManager.initializePlayerMine(player);
          }, 100);
        }
        
        // Miner tier is restored automatically through the loaded PlayerData
        // The equipped miner tier is now persisted in currentMinerTier
        // No visual representation needed, but bonuses will apply correctly
        // Verify miner tier was restored correctly
        const finalData = gameManager.getPlayerData(player);
        if (finalData && finalData.currentMinerTier !== savedMinerTier) {
          // If miner tier wasn't restored, fix it
          finalData.currentMinerTier = savedMinerTier;
          gameManager.updatePlayerData(player, finalData);
        }
        
        // IMPORTANT: Update UI with loaded data after a brief delay
        // This ensures the UI is fully loaded before we send the update
        setTimeout(() => {
          gameManager.sendPowerStatsToUI(player);

        }, 150);
      } else if (currentData) {
        // Even if no saved data, ensure UI is updated with current data
        setTimeout(() => {
          gameManager.sendPowerStatsToUI(player);
        }, 100);
      }
    }).catch(error => {
      console.error(`Failed to load player data for ${player.id}:`, error);
      // Still update UI with defaults if load fails
      setTimeout(() => {
        gameManager.sendPowerStatsToUI(player);
      }, 100);
    });

    // Load our game UI for this player
    player.ui.load('ui/index.html');
    
    // Set up UI loaded handler - this will send initial stats
    // Note: If saved data loads after UI loads, it will update the UI automatically
    player.ui.on(PlayerUIEvent.LOAD, () => {
      // Send initial stats (might be defaults if data hasn't loaded yet)
      gameManager.onPlayerUILoaded(player);
    });
    
    // Set up per-player UI event handler (as per Hytopia SDK guide)
    // This listens for data sent from this specific player's UI
    player.ui.on(PlayerUIEvent.DATA, ({ playerUI, data }) => {

      if (!data || typeof data !== 'object') {

        return;
      }

      switch (data.type) {
        case 'TOGGLE_AUTO_MINE':

          gameManager.toggleAutoMine(player);
          break;
        case 'TOGGLE_AUTO_TRAIN':

          gameManager.toggleAutoTrain(player);
          break;
        case 'TELEPORT_TO_SURFACE':

          gameManager.teleportToSurface(player);
          break;
        case 'SELL_ORE':
          const goldEarned = gameManager.getSellingSystem().sellOre(player, data.oreType, 1);
          // Send updated inventory and gold
          const inventoryAfterSell = gameManager.getInventoryManager().getInventory(player);
          const playerDataAfterSell = gameManager.getPlayerData(player);
          
          // Calculate totalValue with all multipliers using SellingSystem
          const totalValueAfterSell = gameManager.getSellingSystem().getSellValue(player);
          
          // Calculate sell values per ore with all multipliers for UI display
          // Use the selling system's method to get the combined multiplier (includes miner bonus)
          const sellMultiplierAfterSell = gameManager.getSellingSystem().getCombinedCoinMultiplier(player);
          
          const oreSellValuesAfterSell: Record<string, number> = {};
          for (const [oreType, amount] of Object.entries(inventoryAfterSell)) {
            if (amount && amount > 0) {
              // Try Island 1 database first
              let oreData: OreData | Island2OreData | undefined = ORE_DATABASE[oreType as OreType];
              // Try Island 2 database if not found
              if (!oreData && oreType in ISLAND2_ORE_DATABASE) {
                oreData = ISLAND2_ORE_DATABASE[oreType as ISLAND2_ORE_TYPE];
              }
              if (oreData) {
                let sellValue = oreData.value * sellMultiplierAfterSell;
                // Round to nearest integer (no decimals)
                sellValue = Math.round(sellValue);
                oreSellValuesAfterSell[oreType] = sellValue;
              }
            }
          }
          
          player.ui.sendData({
            type: 'INVENTORY_UPDATE',
            inventory: inventoryAfterSell,
            totalValue: totalValueAfterSell,
            oreSellValues: oreSellValuesAfterSell,
            gold: playerDataAfterSell?.gold || 0,
            goldEarned,
          });
          break;
        case 'SELL_ALL':
          const totalGoldEarned = gameManager.getSellingSystem().sellAll(player);
          // Send updated inventory and gold
          const inventoryAfterSellAll = gameManager.getInventoryManager().getInventory(player);
          const playerDataAfterSellAll = gameManager.getPlayerData(player);
          
          // Calculate totalValue with all multipliers using SellingSystem
          const totalValueAfterSellAll = gameManager.getSellingSystem().getSellValue(player);
          
          // Calculate sell values per ore with all multipliers for UI display
          // Use the selling system's method to get the combined multiplier (includes miner bonus)
          const sellMultiplierAfterSellAll = gameManager.getSellingSystem().getCombinedCoinMultiplier(player);
          
          const oreSellValuesAfterSellAll: Record<string, number> = {};
          for (const [oreType, amount] of Object.entries(inventoryAfterSellAll)) {
            if (amount && amount > 0) {
              // Try Island 1 database first
              let oreData: OreData | Island2OreData | undefined = ORE_DATABASE[oreType as OreType];
              // Try Island 2 database if not found
              if (!oreData && oreType in ISLAND2_ORE_DATABASE) {
                oreData = ISLAND2_ORE_DATABASE[oreType as ISLAND2_ORE_TYPE];
              }
              if (oreData) {
                let sellValue = oreData.value * sellMultiplierAfterSellAll;
                // Round to nearest integer (no decimals)
                sellValue = Math.round(sellValue);
                oreSellValuesAfterSellAll[oreType] = sellValue;
              }
            }
          }
          
          player.ui.sendData({
            type: 'INVENTORY_UPDATE',
            inventory: inventoryAfterSellAll,
            totalValue: totalValueAfterSellAll,
            oreSellValues: oreSellValuesAfterSellAll,
            gold: playerDataAfterSellAll?.gold || 0,
            goldEarned: totalGoldEarned,
          });
          break;
        case 'CLOSE_MERCHANT_UI':

          player.ui.sendData({
            type: 'MERCHANT_PROXIMITY',
            inProximity: false,
          });
          break;
        case 'OPEN_MINER_SHOP':
          gameManager.setModalState(player, 'miner', true);
          const minerShopData = gameManager.getMinerShop().getShopData(player);
          player.ui.sendData({
            type: 'MINER_SHOP_DATA',
            miners: minerShopData.miners,
            currentTier: minerShopData.currentTier,
            gold: minerShopData.gold,
          });
          break;
        case 'BUY_MINER':
          const buyMinerResult = gameManager.getMinerShop().buyMiner(player, data.tier);
          const playerDataAfterMinerPurchase = gameManager.getPlayerData(player);
          if (buyMinerResult.success) {
            player.ui.sendData({
              type: 'MINER_PURCHASED',
              success: true,
              newTier: buyMinerResult.newTier,
              goldSpent: buyMinerResult.goldSpent,
              remainingGold: playerDataAfterMinerPurchase?.gold || 0,
            });
            gameManager.sendPowerStatsToUI(player);
          } else {
            player.ui.sendData({
              type: 'MINER_PURCHASED',
              success: false,
              message: buyMinerResult.message,
            });
          }
          break;
        case 'EQUIP_MINER':
          const equipMinerResult = gameManager.getMinerShop().equipMiner(player, data.tier);
          if (equipMinerResult.success) {
            player.ui.sendData({
              type: 'MINER_EQUIPPED',
              success: true,
              tier: data.tier,
              message: equipMinerResult.message,
            });
            const updatedMinerShopData = gameManager.getMinerShop().getShopData(player);
            player.ui.sendData({
              type: 'MINER_SHOP_DATA',
              miners: updatedMinerShopData.miners,
              currentTier: updatedMinerShopData.currentTier,
              gold: updatedMinerShopData.gold,
            });
          } else {
            player.ui.sendData({
              type: 'MINER_EQUIPPED',
              success: false,
              message: equipMinerResult.message,
            });
          }
          break;
        case 'OPEN_PICKAXE_SHOP':
          gameManager.setModalState(player, 'pickaxe', true);
          const shopData = gameManager.getPickaxeShop().getShopData(player);
          player.ui.sendData({
            type: 'PICKAXE_SHOP_DATA',
            currentTier: shopData.currentTier,
            gold: shopData.playerGold,
            pickaxes: shopData.pickaxes,
          });
          break;
        case 'MODAL_OPENED':

          if (data.modalType === 'miner' || data.modalType === 'pickaxe' || data.modalType === 'rebirth' || data.modalType === 'pets' || data.modalType === 'egg' || data.modalType === 'maps') {
            gameManager.setModalState(player, data.modalType, true);
            // Stop any active manual mining when modal opens
            const miningController = gameManager.getMiningController();
            if (miningController && miningController.isPlayerMining(player)) {
              const autoState = gameManager.getPlayerAutoState(player);
              // Only stop if auto-mine is NOT enabled (manual mining)
              if (!autoState?.autoMineEnabled) {

                miningController.stopMiningLoop(player);
              }
            }
          }
          break;
        case 'MODAL_CLOSED':

          if (data.modalType === 'miner' || data.modalType === 'pickaxe' || data.modalType === 'rebirth' || data.modalType === 'pets' || data.modalType === 'egg') {
            gameManager.setModalState(player, data.modalType, false);
          }
          break;
        case 'REQUEST_PET_STATE':
          sendPetState(player);
          break;
        case 'PET_EQUIP': {
          const petId = String(data.petId ?? '');
          const res = gameManager.getPetManager().equipPet(player, petId);
          player.ui.sendData({ type: 'PET_ACTION_RESULT', action: 'equip', success: res.success, message: res.message });
          sendPetState(player);
          break;
        }
        case 'PET_UNEQUIP': {
          const petId = String(data.petId ?? '');
          const res = gameManager.getPetManager().unequipPet(player, petId);
          player.ui.sendData({ type: 'PET_ACTION_RESULT', action: 'unequip', success: res.success, message: res.message });
          sendPetState(player);
          break;
        }
        case 'PET_EQUIP_INSTANCE': {
          const idx = Number(data.slotIndex ?? data.index ?? -1);
          const res = gameManager.getPetManager().equipFromInventoryIndex(player, idx);
          player.ui.sendData({ type: 'PET_ACTION_RESULT', action: 'equipInstance', success: res.success, message: res.message });
          sendPetState(player);
          break;
        }
        case 'PET_UNEQUIP_INSTANCE': {
          const idx = Number(data.slotIndex ?? data.index ?? -1);
          const res = gameManager.getPetManager().unequipFromEquippedIndex(player, idx);
          player.ui.sendData({ type: 'PET_ACTION_RESULT', action: 'unequipInstance', success: res.success, message: res.message });
          sendPetState(player);
          break;
        }
        case 'PET_EQUIP_BEST': {
          const res = gameManager.getPetManager().equipBest(player);
          player.ui.sendData({ type: 'PET_ACTION_RESULT', action: 'equipBest', success: res.success, message: res.message });
          sendPetState(player);
          break;
        }
        case 'PET_UNEQUIP_ALL': {
          const res = gameManager.getPetManager().unequipAll(player);
          player.ui.sendData({ type: 'PET_ACTION_RESULT', action: 'unequipAll', success: res.success, message: res.message });
          sendPetState(player);
          break;
        }
        case 'PET_DELETE_INV': {
          const indices = Array.isArray(data.indices) ? data.indices : [];
          const res = gameManager.getPetManager().deleteFromInventoryIndices(player, indices);
          player.ui.sendData({
            type: 'PET_ACTION_RESULT',
            action: 'delete',
            success: res.success,
            message: res.message,
            deletedCount: res.deletedCount ?? 0,
          });
          sendPetState(player);
          break;
        }
        case 'EGG_HATCH': {
          const eggTypeStr = String(data.eggType ?? 'stone').toLowerCase();
          const eggType =
            eggTypeStr === 'gem' ? EggType.GEM :
            eggTypeStr === 'crystal' ? EggType.CRYSTAL :
            EggType.STONE;
          const count = Math.max(1, Math.min(50, Number(data.count ?? 1) || 1));

          const hatchRes = gameManager.getHatchingSystem().hatch(player, eggType, count);
          if (!hatchRes.success) {
            player.ui.sendData({ type: 'EGG_HATCH_RESULT', success: false, message: hatchRes.message, eggType, count });
            sendPetState(player);
            break;
          }

          const results = (hatchRes.results ?? []).map((id) => {
            const def = getPetDefinition(id);
            return {
              id,
              name: def?.name ?? id,
              rarity: def?.rarity ?? 'common',
              eggType: def?.eggType ?? 'stone',
              multiplier: def?.multiplier ?? 0,
            };
          });

          player.ui.sendData({
            type: 'EGG_HATCH_RESULT',
            success: true,
            eggType,
            count,
            goldSpent: hatchRes.goldSpent ?? 0,
            results,
          });
          sendPetState(player);
          break;
        }
        case 'BUY_PICKAXE':

          const result = gameManager.getPickaxeShop().buyPickaxe(player, data.tier);
          const playerDataAfterPurchase = gameManager.getPlayerData(player);
          if (result.success) {
            player.ui.sendData({
              type: 'PICKAXE_PURCHASED',
              success: true,
              newTier: result.newTier,
              goldSpent: result.goldSpent,
              remainingGold: playerDataAfterPurchase?.gold || 0,
            });
            // Also send updated power stats to update gold display
            gameManager.sendPowerStatsToUI(player);
          } else {
            player.ui.sendData({
              type: 'PICKAXE_PURCHASED',
              success: false,
              message: result.message,
            });
          }
          break;
        case 'EQUIP_PICKAXE':

          const equipResult = gameManager.getPickaxeShop().equipPickaxe(player, data.tier);
          if (equipResult.success) {
            player.ui.sendData({
              type: 'PICKAXE_EQUIPPED',
              success: true,
              newTier: data.tier,
              message: equipResult.message,
            });
            // Refresh shop data to show updated equipped status
            const updatedShopData = gameManager.getPickaxeShop().getShopData(player);
            player.ui.sendData({
              type: 'PICKAXE_SHOP_DATA',
              currentTier: updatedShopData.currentTier,
              gold: updatedShopData.playerGold,
              pickaxes: updatedShopData.pickaxes,
            });
          } else {
            player.ui.sendData({
              type: 'PICKAXE_EQUIPPED',
              success: false,
              message: equipResult.message,
            });
          }
          break;
        case 'OPEN_REBIRTH_UI':

          // Modal state should already be set by MODAL_OPENED event, but set it here too as backup
          gameManager.setModalState(player, 'rebirth', true);
          const rebirthData = gameManager.getRebirthUIData(player);
          player.ui.sendData({
            type: 'REBIRTH_UI_DATA',
            currentPower: rebirthData.currentPower,
            currentRebirths: rebirthData.currentRebirths,
            options: rebirthData.options,
            maxRebirths: rebirthData.maxRebirths,
            maxCost: rebirthData.maxCost,
            canRebirth: rebirthData.options.some(opt => opt.available),
          });
          break;
        case 'PERFORM_REBIRTH':

          const rebirthResult = gameManager.performRebirth(player, data.rebirthCount);
          if (rebirthResult.success) {
            player.ui.sendData({
              type: 'REBIRTH_COMPLETE',
              success: true,
              rebirthsPerformed: rebirthResult.rebirthsPerformed,
              newRebirths: rebirthResult.newRebirths,
              powerSpent: rebirthResult.powerSpent,
              newPower: rebirthResult.newPower,
            });
            // Update power stats display
            gameManager.sendPowerStatsToUI(player);
          } else {
            player.ui.sendData({
              type: 'REBIRTH_COMPLETE',
              success: false,
              message: rebirthResult.message,
            });
          }
          break;
        case 'PURCHASE_UPGRADE':

          // Map UI upgrade type string to enum
          let upgradeType: UpgradeType;
          switch (data.upgradeType) {
            case 'moreGems':
              upgradeType = UpgradeType.MORE_GEMS;
              break;
            case 'moreRebirths':
              upgradeType = UpgradeType.MORE_REBIRTHS;
              break;
            case 'moreCoins':
              upgradeType = UpgradeType.MORE_COINS;
              break;
            case 'moreDamage':
              upgradeType = UpgradeType.MORE_DAMAGE;
              break;
            default:

              return;
          }
          
          const upgradeSystem = gameManager.getGemTraderUpgradeSystem();
          const upgradePurchaseResult = upgradeSystem.purchaseUpgrade(player, upgradeType);
          const upgradePlayerDataAfterPurchase = gameManager.getPlayerData(player);
          
          if (upgradePurchaseResult.success) {
            // Send success response and update UI
            player.ui.sendData({
              type: 'UPGRADE_PURCHASED',
              success: true,
              upgradeType: data.upgradeType,
              newLevel: upgradePurchaseResult.newLevel,
              cost: upgradePurchaseResult.cost,
              remainingGems: upgradePurchaseResult.remainingGems,
            });
            // Send updated stats
            gameManager.sendPowerStatsToUI(player);
            // Re-send proximity data to refresh UI with updated upgrade info
            const updatedPlayerData = gameManager.getPlayerData(player);
            const updatedMoreGemsInfo = upgradeSystem.getUpgradeInfo(player, UpgradeType.MORE_GEMS);
            const updatedMoreRebirthsInfo = upgradeSystem.getUpgradeInfo(player, UpgradeType.MORE_REBIRTHS);
            const updatedMoreCoinsInfo = upgradeSystem.getUpgradeInfo(player, UpgradeType.MORE_COINS);
            const updatedMoreDamageInfo = upgradeSystem.getUpgradeInfo(player, UpgradeType.MORE_DAMAGE);
            
            player.ui.sendData({
              type: 'GEM_TRADER_PROXIMITY',
              inProximity: true,
              gems: updatedPlayerData?.gems || 0,
              upgrades: {
                moreGems: {
                  level: updatedMoreGemsInfo.currentLevel,
                  cost: updatedMoreGemsInfo.nextLevelCost,
                  canAfford: updatedMoreGemsInfo.canAfford,
                },
                moreRebirths: {
                  level: updatedMoreRebirthsInfo.currentLevel,
                  cost: updatedMoreRebirthsInfo.nextLevelCost,
                  canAfford: updatedMoreRebirthsInfo.canAfford,
                },
                moreCoins: {
                  level: updatedMoreCoinsInfo.currentLevel,
                  cost: updatedMoreCoinsInfo.nextLevelCost,
                  canAfford: updatedMoreCoinsInfo.canAfford,
                },
                moreDamage: {
                  level: updatedMoreDamageInfo.currentLevel,
                  cost: updatedMoreDamageInfo.nextLevelCost,
                  canAfford: updatedMoreDamageInfo.canAfford,
                },
              },
            });
          } else {
            player.ui.sendData({
              type: 'UPGRADE_PURCHASED',
              success: false,
              error: upgradePurchaseResult.error,
              upgradeType: data.upgradeType,
            });
          }
          break;
        case 'PURCHASE_MINE_RESET_UPGRADE':

          const purchaseResult = gameManager.purchaseMineResetUpgrade(player);
          const updatedPlayerData = gameManager.getPlayerData(player);
          const currentWorld = updatedPlayerData?.currentWorld || 'island1';
          const hasUpgrade = updatedPlayerData?.mineResetUpgradePurchased?.[currentWorld] ?? false;
          
          if (purchaseResult.success) {
            // Update UI with purchase result
            player.ui.sendData({
              type: 'MINE_RESET_UPGRADE_PURCHASED',
              success: true,
              hasUpgrade: true, // Always true after successful purchase
              cost: 2_000_000,
              remainingGold: purchaseResult.remainingGold || 0,
            });
          } else {
            // Send failure message - use actual player data state
            player.ui.sendData({
              type: 'MINE_RESET_UPGRADE_PURCHASED',
              success: false,
              message: purchaseResult.message,
              hasUpgrade: hasUpgrade, // Use actual state (might already be purchased)
              cost: 2_000_000,
              remainingGold: updatedPlayerData?.gold || 0,
            });
          }
          break;
        case 'CLOSE_MINE_RESET_UPGRADE_UI':

          player.ui.sendData({
            type: 'MINE_RESET_UPGRADE_PROXIMITY',
            inProximity: false,
          });
          break;
        case 'OPEN_WORLDS_PANEL':
          gameManager.setModalState(player, 'maps', true);
          const worldSelectionData = gameManager.getWorldSelectionData(player);
          player.ui.sendData({
            type: 'WORLDS_PANEL_DATA',
            worlds: worldSelectionData.worlds,
          });
          break;
        case 'UNLOCK_WORLD':
          const unlockResult = gameManager.unlockWorld(player, data.worldId);
          player.ui.sendData({
            type: 'WORLD_UNLOCKED',
            success: unlockResult.success,
            message: unlockResult.message,
            worldId: data.worldId,
          });
          // Refresh worlds panel data after unlock attempt
          const worldSelectionDataAfterUnlock = gameManager.getWorldSelectionData(player);
          player.ui.sendData({
            type: 'WORLDS_PANEL_DATA',
            worlds: worldSelectionDataAfterUnlock.worlds,
          });
          break;
        case 'TELEPORT_TO_WORLD':
          const teleportResult = gameManager.teleportToWorld(player, data.worldId);
          player.ui.sendData({
            type: 'WORLD_TELEPORTED',
            success: teleportResult.success,
            message: teleportResult.message,
            worldId: data.worldId,
          });
          // Refresh worlds panel data after teleport attempt
          const worldSelectionDataAfterTeleport = gameManager.getWorldSelectionData(player);
          player.ui.sendData({
            type: 'WORLDS_PANEL_DATA',
            worlds: worldSelectionDataAfterTeleport.worlds,
          });
          break;
        default:

      }
    });
    
    // Send initial UI stats after a brief delay to allow saved data to load first
    // If saved data loads, it will update the UI with correct values
    // If not, this will send the default values
    setTimeout(() => {
      gameManager.onPlayerUILoaded(player);
    }, 150);

    // Set up mining input handling
    const miningController = gameManager.getMiningController();
    
    // Set up callback to check if player can mine (prevents animation outside mine)
    // This is called every tick and suppresses left-click input when player is not in the mine
    playerEntity.setCanMineCallback(() => {
      return gameManager.isPlayerInMine(player);
    });
    
    // Set up left click callbacks (like NewGame does with shoot)
    playerEntity.setOnLeftClickStart(() => {
      // Don't allow mining if player is not in the mine
      // This prevents mining animations and raycasting on the surface
      if (!gameManager.isPlayerInMine(player)) {
        return;
      }
      
      // Don't allow manual mining if:
      // 1. Auto-mine is enabled (it handles mining automatically)
      // 2. A blocking modal (pickaxe or rebirth) is open
      const autoState = gameManager.getPlayerAutoState(player);
      if (autoState?.autoMineEnabled) {
        // Auto-mine is on - don't allow manual clicks to mine
        return;
      }
      
      // Check if any blocking modal is open
      if (gameManager.isBlockingModalOpen(player)) {
        // Modal is open - don't allow manual mining
        // Auto-mine can still work, but manual clicks are blocked
        return;
      }
      
      // Player is in the mine, auto-mine is off, and no blocking modals - allow manual mining
      if (miningController && !miningController.isPlayerMining(player)) {
        miningController.startMiningLoop(player);
      }
    });
    
    playerEntity.setOnLeftClickStop(() => {
      // Don't process click release if player is not in the mine
      if (!gameManager.isPlayerInMine(player)) {
        return;
      }
      
      // Only stop manual mining if auto-mine is disabled and no blocking modals
      const autoState = gameManager.getPlayerAutoState(player);
      if (autoState?.autoMineEnabled) {
        // Auto-mine is on - don't stop mining on click release
        return;
      }
      
      // Check if any blocking modal is open
      if (gameManager.isBlockingModalOpen(player)) {
        // Modal is open - don't process click release
        return;
      }
      
      // Auto-mine is off and no blocking modals - allow stopping manual mining
      if (miningController && miningController.isPlayerMining(player)) {
        miningController.stopMiningLoop(player);
      }
    });

    // Begin monitoring shared shaft so the player can be handed off to their personal mine
    gameManager.startMineEntranceWatch(player);

    // Send welcome message with player stats
    const pickaxe = gameManager.getPlayerPickaxe(player);
    const pickaxeName = pickaxe ? pickaxe.name : 'None';
    const playerData = gameManager.getPlayerData(player) || defaultPlayerData;
    world.chatManager.sendPlayerMessage(player, 'Welcome to the Mining Game!', '00FF00');
    world.chatManager.sendPlayerMessage(player, `Power: ${playerData.power} | Gold: ${playerData.gold} | Rebirths: ${playerData.rebirths}`, 'FFFFFF');
    world.chatManager.sendPlayerMessage(player, `Pickaxe: ${pickaxeName} (Tier ${playerData.currentPickaxeTier})`, 'FFFF00');
    world.chatManager.sendPlayerMessage(player, 'Cobbled-deepslate clusters = Training rocks | Stone blocks = Mining area', 'FFFF00');
    world.chatManager.sendPlayerMessage(player, 'Use WASD to move around & space to jump.', 'FFFFFF');
    world.chatManager.sendPlayerMessage(player, 'Hold shift to sprint.', 'FFFFFF');
    world.chatManager.sendPlayerMessage(player, 'Left click to mine blocks!', 'FFFF00');
  });

  world.chatManager.registerCommand('/whereami', player => {
    const entities = world.entityManager.getPlayerEntitiesByPlayer(player);
    if (!entities.length) return;
  
    const { x, y, z } = entities[0].position;
    world.chatManager.sendPlayerMessage(
      player,
      `Position → x: ${x.toFixed(2)}, y: ${y.toFixed(2)}, z: ${z.toFixed(2)}`,
      '00FFFF'
    );
  });

  world.chatManager.registerCommand('/trainingdebug', player => {
    const controller = gameManager.getTrainingController();
    if (!controller) return;
  
    const entities = world.entityManager.getPlayerEntitiesByPlayer(player);
    if (!entities.length) return;
  
    const rock = controller.getNearbyTrainingRock(player);
    if (rock) {
      world.chatManager.sendPlayerMessage(
        player,
        `Near rock: ${rock.rockData.name} (tier ${rock.rockData.tier})`,
        '00FFFF'
      );
    } else {
      world.chatManager.sendPlayerMessage(player, 'No training rock detected nearby.', 'FF5555');
    }
  });

  /**
   * Pet system debug/testing commands
   *
   * Examples:
   * - /hatch stone 1
   * - /hatch gem 3
   * - /petinv
   * - /petequip all
   * - /petequip stone_sprite
   * - /petunequip all
   */
  world.chatManager.registerCommand('/hatch', (player, args) => {
    const eggArg = (args[0] ?? 'stone').toLowerCase();
    const count = Math.max(1, Math.min(50, Number(args[1] ?? 1) || 1));

    const eggType =
      eggArg === 'gem' ? EggType.GEM :
      eggArg === 'crystal' ? EggType.CRYSTAL :
      EggType.STONE;

    const hatch = gameManager.getHatchingSystem().hatch(player, eggType, count);
    if (!hatch.success) {
      world.chatManager.sendPlayerMessage(player, `Hatch failed: ${hatch.message ?? 'unknown error'}`, 'FF5555');
      return;
    }

    const results = hatch.results ?? [];
    const names = results
      .map((id) => getPetDefinition(id)?.name ?? id)
      .join(', ');

    world.chatManager.sendPlayerMessage(
      player,
      `Hatched ${results.length} ${eggType} egg(s) for ${hatch.goldSpent?.toLocaleString() ?? 0} gold: ${names}`,
      '00FF00'
    );
  });

  world.chatManager.registerCommand('/petinv', (player) => {
    const data = gameManager.getPlayerData(player);
    if (!data) {
      world.chatManager.sendPlayerMessage(player, 'No player data found.', 'FF5555');
      return;
    }

    const inv = Array.isArray(data.petInventory) ? data.petInventory : [];
    const eq = Array.isArray(data.equippedPets) ? data.equippedPets : [];
    const mult = gameManager.getPetManager().getTrainingMultiplierSum(player);

    world.chatManager.sendPlayerMessage(player, '=== Pets ===', '00FFFF');
    world.chatManager.sendPlayerMessage(player, `Inventory: ${inv.length}/${PET_INVENTORY_CAPACITY}`, 'FFFFFF');
    world.chatManager.sendPlayerMessage(player, `Equipped: ${eq.length}/${PET_EQUIP_CAPACITY}`, 'FFFFFF');
    world.chatManager.sendPlayerMessage(player, `Training multiplier sum: x${mult}`, 'FFFF00');
  });

  world.chatManager.registerCommand('/petequip', (player, args) => {
    const petManager = gameManager.getPetManager();
    const data = gameManager.getPlayerData(player);
    if (!data) return;

    const target = (args[0] ?? 'all').toLowerCase();

    if (target === 'all') {
      let equipped = 0;
      while (true) {
        const inv = Array.isArray(data.petInventory) ? data.petInventory : [];
        if (inv.length === 0) break;
        const petId = inv[0];
        const res = petManager.equipPet(player, petId);
        if (!res.success) break;
        equipped++;
        // refresh reference
        const next = gameManager.getPlayerData(player);
        if (next) Object.assign(data, next);
      }
      world.chatManager.sendPlayerMessage(player, `Equipped ${equipped} pet(s).`, '00FF00');
      return;
    }

    const res = petManager.equipPet(player, target);
    if (!res.success) {
      world.chatManager.sendPlayerMessage(player, `Equip failed: ${res.message ?? 'unknown error'}`, 'FF5555');
      return;
    }
    world.chatManager.sendPlayerMessage(player, `Equipped ${target}.`, '00FF00');
  });

  world.chatManager.registerCommand('/petunequip', (player, args) => {
    const petManager = gameManager.getPetManager();
    const data = gameManager.getPlayerData(player);
    if (!data) return;

    const target = (args[0] ?? 'all').toLowerCase();

    if (target === 'all') {
      let unequipped = 0;
      while (true) {
        const eq = Array.isArray(data.equippedPets) ? data.equippedPets : [];
        if (eq.length === 0) break;
        const petId = eq[0];
        const res = petManager.unequipPet(player, petId);
        if (!res.success) break;
        unequipped++;
        const next = gameManager.getPlayerData(player);
        if (next) Object.assign(data, next);
      }
      world.chatManager.sendPlayerMessage(player, `Unequipped ${unequipped} pet(s).`, '00FF00');
      return;
    }

    const res = petManager.unequipPet(player, target);
    if (!res.success) {
      world.chatManager.sendPlayerMessage(player, `Unequip failed: ${res.message ?? 'unknown error'}`, 'FF5555');
      return;
    }
    world.chatManager.sendPlayerMessage(player, `Unequipped ${target}.`, '00FF00');
  });

  world.chatManager.registerCommand('/mine', player => {
    const miningController = gameManager.getMiningController();
    if (!miningController) {
      world.chatManager.sendPlayerMessage(player, 'Mining system not available.', 'FF5555');
      return;
    }

    if (miningController.isPlayerMining(player)) {
      miningController.stopMiningLoop(player);
      world.chatManager.sendPlayerMessage(player, 'Mining stopped.', 'FFFF00');
    } else {
      miningController.startMiningLoop(player);
      world.chatManager.sendPlayerMessage(player, 'Mining started!', '00FF00');
    }
  });

  // Persistence testing commands
  world.chatManager.registerCommand('/checkdata', player => {
    const playerData = gameManager.getPlayerData(player);
    if (!playerData) {
      world.chatManager.sendPlayerMessage(player, 'No player data found.', 'FF5555');
      return;
    }

    const inventoryCount = Object.keys(playerData.inventory).length;
    const totalOres = Object.values(playerData.inventory).reduce((sum, val) => (sum || 0) + (val || 0), 0);

    world.chatManager.sendPlayerMessage(player, '=== Your Saved Data ===', '00FFFF');
    world.chatManager.sendPlayerMessage(player, `Power: ${playerData.power.toLocaleString()} | Gold: ${playerData.gold.toLocaleString()}`, 'FFFFFF');
    world.chatManager.sendPlayerMessage(player, `Rebirths: ${playerData.rebirths} | Wins: ${playerData.wins}`, 'FFFFFF');
    world.chatManager.sendPlayerMessage(player, `Pickaxe Tier: ${playerData.currentPickaxeTier}`, 'FFFFFF');
    world.chatManager.sendPlayerMessage(player, `Inventory: ${inventoryCount} ore types, ${totalOres} total ores`, 'FFFFFF');
    world.chatManager.sendPlayerMessage(player, `Player ID: ${player.id} (check ./dev/persistence/player-${player.id}.json)`, 'FFFF00');
  });

  world.chatManager.registerCommand('/savetest', async player => {
    const playerData = gameManager.getPlayerData(player);
    if (!playerData) {
      world.chatManager.sendPlayerMessage(player, 'No player data found.', 'FF5555');
      return;
    }

    world.chatManager.sendPlayerMessage(player, '💾 Force saving your data...', 'FFFF00');
    const success = await gameManager.savePlayerData(player);
    
    if (success) {
      world.chatManager.sendPlayerMessage(player, '✅ Data saved successfully!', '00FF00');
      world.chatManager.sendPlayerMessage(player, `📂 Look for: dev/persistence/player-${player.id}.json`, 'FFFF00');
      world.chatManager.sendPlayerMessage(player, '📍 Location: In your project root folder', 'FFFF00');
      world.chatManager.sendPlayerMessage(player, '🔄 Disconnect and reconnect to test loading!', 'FFFF00');
    } else {
      world.chatManager.sendPlayerMessage(player, '❌ Failed to save data. Check console for errors.', 'FF5555');
    }
  });

  world.chatManager.registerCommand('/finddata', player => {
    const playerData = gameManager.getPlayerData(player);
    if (!playerData) {
      world.chatManager.sendPlayerMessage(player, 'No player data found.', 'FF5555');
      return;
    }

    world.chatManager.sendPlayerMessage(player, '=== Finding Your Save File ===', '00FFFF');
    world.chatManager.sendPlayerMessage(player, `Your Player ID: ${player.id}`, 'FFFFFF');
    world.chatManager.sendPlayerMessage(player, `Expected filename: player-${player.id}.json`, 'FFFFFF');
    world.chatManager.sendPlayerMessage(player, '📍 Location: dev/persistence/ folder in project root', 'FFFF00');
    world.chatManager.sendPlayerMessage(player, '💡 Tip: The folder is created automatically on first save', 'FFFF00');
    world.chatManager.sendPlayerMessage(player, '💡 If folder doesn\'t exist, use /savetest first', 'FFFF00');
  });

  /**
   * Handle player leaving the game. The PlayerEvent.LEFT_WORLD
   * event is emitted to the world when a player leaves the game.
   * Because HYTOPIA is not opinionated on join and
   * leave game logic, we are responsible for cleaning
   * up the player and any entities associated with them
   * after they leave. We can easily do this by 
   * getting all the known PlayerEntity instances for
   * the player who left by using our world's EntityManager
   * instance.
   * 
   * The HYTOPIA SDK is heavily driven by events, you
   * can find documentation on how the event system works,
   * here: https://dev.hytopia.com/sdk-guides/events
   */
  world.on(PlayerEvent.LEFT_WORLD, async ({ player }) => {
    // Remove player from merchant tracking
    merchantEntity.removePlayer(player);
    // Remove player from mine reset upgrade NPC tracking
    mineResetUpgradeNPC.removePlayer(player);
    // Remove player from egg station tracking
    eggStationManager.removePlayer(player);
    
    // Clean up mining input interval
    const miningInputInterval = (player as any).__miningInputInterval;
    if (miningInputInterval) {
      clearInterval(miningInputInterval);
    }
    
    // Clean up zoom lock interval
    const zoomLockInterval = (player as any).__zoomLockInterval;
    if (zoomLockInterval) {
      clearInterval(zoomLockInterval);
    }
    
    // Clean up pickaxe entity
    pickaxeManager.cleanupPlayer(player);
    
    // Clean up player entities
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
    
    // Clean up player data (saves to persistence before cleanup)
    await gameManager.cleanupPlayer(player);
  });

  /**
   * A silly little easter egg command. When a player types
   * "/rocket" in the game, they'll get launched into the air!
   */
  world.chatManager.registerCommand('/rocket', player => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => {
      entity.applyImpulse({ x: 0, y: 20, z: 0 });
    });
  });

  /**
   * Play some peaceful ambient music to
   * set the mood!
   */
  
  new Audio({
    uri: 'audio/music/hytopia-main-theme.mp3',
    loop: true,
    volume: 0.1,
  }).play(world);
});


