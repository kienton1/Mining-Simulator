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
} from 'hytopia';

import worldMap from './assets/map.json';
import { GameManager } from './src/Core/GameManager';
import { PickaxeManager } from './src/Pickaxe/PickaxeManager';
import { MiningPlayerEntity } from './src/Core/MiningPlayerEntity';
import { MerchantEntity } from './src/Shop/MerchantEntity';
import { MineResetUpgradeNPC } from './src/Shop/MineResetUpgradeNPC';

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
    console.log('[Server] Enabling simulation debug raycasting visuals');
    (world.simulation as any).enableDebugRaycasting(true);
  }

  /**
   * Initialize Pickaxe Manager
   * This manages pickaxe entities attached to players
   */
  const pickaxeManager = new PickaxeManager(world);

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
  // Carve shared mine shaft (10-block drop) for all players
  gameManager.buildSharedMineShaft();

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
   * Handle merchant proximity events
   * When player enters/leaves merchant proximity, show/hide selling UI
   */
  merchantEntity.onProximityChange = (player, inProximity, distance) => {
    if (inProximity) {
      // Player entered proximity - send inventory data to show UI
      const inventory = gameManager.getInventoryManager().getInventory(player);
      const playerData = gameManager.getPlayerData(player);
      
      // Get player's pickaxe for sell value multiplier (REBALANCED)
      const pickaxe = gameManager.getPlayerPickaxe(player);
      const sellMultiplier = pickaxe?.sellValueMultiplier ?? 1.0;
      const totalValue = gameManager.getInventoryManager().calculateTotalValue(player, sellMultiplier);
      
      player.ui.sendData({
        type: 'MERCHANT_PROXIMITY',
        inProximity: true,
        inventory,
        totalValue,
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
      const hasUpgrade = playerData?.mineResetUpgradePurchased ?? false;
      const cost = 2_000_000;
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
    
    // Initialize player data with defaults first (synchronous)
    // This ensures entity can spawn immediately for proper camera setup
    const defaultPlayerData = gameManager.initializePlayerSync(player);
    
    // Create custom player entity that handles input (like NewGame's GamePlayerEntity)
    // MUST spawn synchronously for camera to attach properly
    const playerEntity = new MiningPlayerEntity(player);
    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });

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
      
      console.log(`[Server] Set camera zoom to ${LOCKED_ZOOM} and locked for ${player.username}`);
    }, 300);

    // Attach pickaxe to player (spawns with default tier 0 - Rusty pickaxe)
    pickaxeManager.attachPickaxeToPlayer(player, defaultPlayerData.currentPickaxeTier);
    
    // Load saved data in background and update if different
    // This doesn't block entity spawning, so camera works correctly
    gameManager.initializePlayerAsync(player).then(loadedData => {
      // Only update if loaded data is different from defaults
      const currentData = gameManager.getPlayerData(player);
      if (currentData && loadedData) {
        // Update with loaded data
        gameManager.updatePlayerData(player, loadedData);
        
        // Update pickaxe if tier changed
        if (loadedData.currentPickaxeTier !== defaultPlayerData.currentPickaxeTier) {
          pickaxeManager.attachPickaxeToPlayer(player, loadedData.currentPickaxeTier);
        }
        
        // IMPORTANT: Update UI with loaded data after a brief delay
        // This ensures the UI is fully loaded before we send the update
        setTimeout(() => {
          gameManager.sendPowerStatsToUI(player);
          console.log(`[Server] ✅ Updated UI with loaded data for ${player.username} (Power: ${loadedData.power}, Gold: ${loadedData.gold})`);
        }, 100);
      } else if (currentData) {
        // Even if no saved data, ensure UI is updated with current data
        setTimeout(() => {
          gameManager.sendPowerStatsToUI(player);
        }, 100);
      }
    }).catch(error => {
      console.error(`[Server] Failed to load player data for ${player.username}:`, error);
      // Still update UI with defaults if load fails
      setTimeout(() => {
        gameManager.sendPowerStatsToUI(player);
      }, 100);
    });

    // Load our game UI for this player
    player.ui.load('ui/index.html');
    
    // Set up UI loaded handler - this will send initial stats
    // Note: If saved data loads after UI loads, it will update the UI automatically
    player.ui.on(PlayerUIEvent.LOADED, () => {
      // Send initial stats (might be defaults if data hasn't loaded yet)
      gameManager.onPlayerUILoaded(player);
    });
    
    // Set up per-player UI event handler (as per Hytopia SDK guide)
    // This listens for data sent from this specific player's UI
    player.ui.on(PlayerUIEvent.DATA, ({ playerUI, data }) => {
      console.log(`[Server] Received UI data from player ${player.username}:`, data);
      
      if (!data || typeof data !== 'object') {
        console.warn(`[Server] Invalid UI data from ${player.username}:`, data);
        return;
      }

      console.log(`[Server] Processing UI event type: ${data.type} for player: ${player.username}`);

      switch (data.type) {
        case 'TOGGLE_AUTO_MINE':
          console.log(`[Server] TOGGLE_AUTO_MINE event received for ${player.username}, calling toggleAutoMine`);
          gameManager.toggleAutoMine(player);
          break;
        case 'TOGGLE_AUTO_TRAIN':
          console.log(`[Server] TOGGLE_AUTO_TRAIN event received for ${player.username}, calling toggleAutoTrain`);
          gameManager.toggleAutoTrain(player);
          break;
        case 'TELEPORT_TO_SURFACE':
          console.log(`[Server] TELEPORT_TO_SURFACE event received for ${player.username}, calling teleportToSurface`);
          gameManager.teleportToSurface(player);
          break;
        case 'SELL_ORE':
          console.log(`[Server] SELL_ORE event received for ${player.username}, oreType: ${data.oreType}`);
          const goldEarned = gameManager.getSellingSystem().sellOre(player, data.oreType, 1);
          // Send updated inventory and gold
          const inventoryAfterSell = gameManager.getInventoryManager().getInventory(player);
          const playerDataAfterSell = gameManager.getPlayerData(player);
          
          // Get player's pickaxe for sell value multiplier (REBALANCED)
          const pickaxeAfterSell = gameManager.getPlayerPickaxe(player);
          const sellMultiplierAfterSell = pickaxeAfterSell?.sellValueMultiplier ?? 1.0;
          const totalValueAfterSell = gameManager.getInventoryManager().calculateTotalValue(player, sellMultiplierAfterSell);
          
          player.ui.sendData({
            type: 'INVENTORY_UPDATE',
            inventory: inventoryAfterSell,
            totalValue: totalValueAfterSell,
            gold: playerDataAfterSell?.gold || 0,
            goldEarned,
          });
          break;
        case 'SELL_ALL':
          console.log(`[Server] SELL_ALL event received for ${player.username}`);
          const totalGoldEarned = gameManager.getSellingSystem().sellAll(player);
          // Send updated inventory and gold
          const inventoryAfterSellAll = gameManager.getInventoryManager().getInventory(player);
          const playerDataAfterSellAll = gameManager.getPlayerData(player);
          
          // Get player's pickaxe for sell value multiplier (REBALANCED)
          const pickaxeAfterSellAll = gameManager.getPlayerPickaxe(player);
          const sellMultiplierAfterSellAll = pickaxeAfterSellAll?.sellValueMultiplier ?? 1.0;
          const totalValueAfterSellAll = gameManager.getInventoryManager().calculateTotalValue(player, sellMultiplierAfterSellAll);
          
          player.ui.sendData({
            type: 'INVENTORY_UPDATE',
            inventory: inventoryAfterSellAll,
            totalValue: totalValueAfterSellAll,
            gold: playerDataAfterSellAll?.gold || 0,
            goldEarned: totalGoldEarned,
          });
          break;
        case 'CLOSE_MERCHANT_UI':
          console.log(`[Server] CLOSE_MERCHANT_UI event received for ${player.username}`);
          player.ui.sendData({
            type: 'MERCHANT_PROXIMITY',
            inProximity: false,
          });
          break;
        case 'OPEN_PICKAXE_SHOP':
          console.log(`[Server] OPEN_PICKAXE_SHOP event received for ${player.username}`);
          const shopData = gameManager.getPickaxeShop().getShopData(player);
          player.ui.sendData({
            type: 'PICKAXE_SHOP_DATA',
            currentTier: shopData.currentTier,
            gold: shopData.playerGold,
            pickaxes: shopData.pickaxes,
          });
          break;
        case 'BUY_PICKAXE':
          console.log(`[Server] BUY_PICKAXE event received for ${player.username}, tier: ${data.tier}`);
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
        case 'OPEN_REBIRTH_UI':
          console.log(`[Server] OPEN_REBIRTH_UI event received for ${player.username}`);
          const rebirthData = gameManager.getRebirthUIData(player);
          player.ui.sendData({
            type: 'REBIRTH_UI_DATA',
            currentPower: rebirthData.currentPower,
            currentRebirths: rebirthData.currentRebirths,
            options: rebirthData.options,
            maxRebirths: rebirthData.maxRebirths,
            maxCost: rebirthData.maxCost,
          });
          break;
        case 'PERFORM_REBIRTH':
          console.log(`[Server] PERFORM_REBIRTH event received for ${player.username}, count: ${data.rebirthCount}`);
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
        case 'PURCHASE_MINE_RESET_UPGRADE':
          console.log(`[Server] PURCHASE_MINE_RESET_UPGRADE event received for ${player.username}`);
          const purchaseResult = gameManager.purchaseMineResetUpgrade(player);
          const updatedPlayerData = gameManager.getPlayerData(player);
          const hasUpgrade = updatedPlayerData?.mineResetUpgradePurchased ?? false;
          
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
          console.log(`[Server] CLOSE_MINE_RESET_UPGRADE_UI event received for ${player.username}`);
          player.ui.sendData({
            type: 'MINE_RESET_UPGRADE_PROXIMITY',
            inProximity: false,
          });
          break;
        default:
          console.log(`[Server] Unknown UI event type from ${player.username}:`, data.type);
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
    
    // Set up left click callbacks (like NewGame does with shoot)
    playerEntity.setOnLeftClickStart(() => {
      // Just started holding - start mining loop
      if (miningController && !miningController.isPlayerMining(player)) {
        miningController.startMiningLoop(player);
      }
    });
    
    playerEntity.setOnLeftClickStop(() => {
      // Just released - stop mining loop
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
    const totalOres = Object.values(playerData.inventory).reduce((sum, val) => sum + (val || 0), 0);

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


