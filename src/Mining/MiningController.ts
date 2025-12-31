/**
 * Mining Controller
 * 
 * Handles player interaction with mining system.
 * Manages mining state, block generation, and coordinates between systems.
 * 
 * Reference: Planning/gameOverview.txt section 6
 */

import { World, Player, Entity } from 'hytopia';
import { MiningSystem } from './MiningSystem';
import { GameManager } from '../Core/GameManager';
import { OreType } from './Ore/OreData';
import { ORE_DATABASE } from './Ore/OreData';
import type { PickaxeData } from '../Pickaxe/PickaxeData';

/**
 * Mining Controller class
 * Coordinates mining system and game manager
 */
export class MiningController {
  private world: World;
  private miningSystem: MiningSystem;
  private gameManager: GameManager;
  private blockDetectionIntervals: Map<Player, NodeJS.Timeout> = new Map();

  constructor(world: World, gameManager: GameManager) {
    this.world = world;
    this.gameManager = gameManager;
    this.miningSystem = new MiningSystem(world);
    // Set callback to get player data
    this.miningSystem.setPlayerDataCallback((player) => {
      return this.gameManager.getPlayerData(player);
    });
    // Set callback for when first block is mined (to start timer)
    this.miningSystem.setFirstBlockMinedCallback((player) => {
      this.gameManager.startMineResetTimer(player);
    });
    // Set callback to get player's pickaxe
    this.miningSystem.setGetPickaxeCallback((player) => {
      return this.gameManager.getPlayerPickaxe(player);
    });
    // Set callback to get miner ore luck bonus
    this.miningSystem.setGetMinerOreLuckBonusCallback((player) => {
      const equippedMiner = this.gameManager.getMinerShop().getEquippedMiner(player);
      return equippedMiner?.oreLuckBonus ?? 0;
    });
    // Set callback to get combined damage multiplier (for chest HP initialization)
    this.miningSystem.setGetCombinedDamageMultiplierCallback((player: Player) => {
      // Get More Damage multiplier from upgrade system (e.g., 1.2 = +20%)
      const moreDamageMultiplier = this.gameManager.getGemTraderUpgradeSystem().getMoreDamageMultiplier(player);
      
      // Get miner damage bonus percentage (e.g., 10 = +10%)
      const equippedMiner = this.gameManager.getMinerShop().getEquippedMiner(player);
      const minerDamageBonus = equippedMiner?.damageBonus ?? 0;
      
      // Convert multipliers to percentages, add them together, then convert back
      const moreDamagePercent = (moreDamageMultiplier - 1.0) * 100; // e.g., 1.2 -> 20%
      const totalDamagePercent = moreDamagePercent + minerDamageBonus; // Add percentages
      return 1.0 + (totalDamagePercent / 100); // Convert back to multiplier
    });
    // Set callback for when a chest is broken (to award gems)
    this.miningSystem.setChestBrokenCallback((player, baseGems) => {
      // Apply More Gems upgrade multiplier
      const moreGemsMultiplier = this.gameManager.getGemTraderUpgradeSystem().getMoreGemsMultiplier(player);
      const finalGems = Math.round(baseGems * moreGemsMultiplier);
      this.gameManager.addGems(player, finalGems);
      console.log(`[MiningController] Chest broken: awarded ${finalGems} gems (base: ${baseGems}, multiplier: ${moreGemsMultiplier}x)`);
    });
  }

  /**
   * Handles left click input for mining
   * 
   * @param player - Player who clicked
   */
  handleMiningClick(player: Player): void {
    // First check if player is in the mine - if not, do nothing
    const miningState = this.miningSystem.getMiningState(player);
    if (!miningState) {
      // Player is not in the mine, ignore mining click
      return;
    }

    // Player is in the mine, proceed with mining
    // Don't process mining click if a blocking modal is open
    if (this.gameManager.isBlockingModalOpen(player)) {
      return;
    }

    const playerData = this.gameManager.getPlayerData(player);
    if (!playerData) {
      return;
    }

    const pickaxe = this.gameManager.getPlayerPickaxe(player);
    if (!pickaxe) {
      return;
    }

    // Get More Damage multiplier from upgrade system (e.g., 1.2 = +20%)
    const moreDamageMultiplier = this.gameManager.getGemTraderUpgradeSystem().getMoreDamageMultiplier(player);
    
    // Get miner damage bonus percentage (e.g., 10 = +10%)
    const equippedMiner = this.gameManager.getMinerShop().getEquippedMiner(player);
    const minerDamageBonus = equippedMiner?.damageBonus ?? 0;
    
    // Convert multipliers to percentages, add them together, then convert back
    const moreDamagePercent = (moreDamageMultiplier - 1.0) * 100; // e.g., 1.2 -> 20%
    const totalDamagePercent = moreDamagePercent + minerDamageBonus; // Add percentages
    const damageMultiplier = 1.0 + (totalDamagePercent / 100); // Convert back to multiplier

    // Handle single click mining
    // Pass callback to check if blocking modal is open
    this.miningSystem.handleMiningClick(
      player,
      pickaxe,
      (p, oreType, amount) => {
        // Add ore to inventory
        this.gameManager.addOreToInventory(p, oreType, amount);
        
        // Note: Removed ore mined popup notification - info is shown in mining target display
      },
      (p, damage, currentOre, blockHP, maxHP, isChest, chestType, gemReward) => {
        // Send UI event for damage and current ore display
        const oreData = currentOre ? ORE_DATABASE[currentOre] : null;
        this.sendMiningUpdateEvent(p, damage, oreData?.name || null, blockHP, maxHP, isChest, chestType, gemReward);
        
        // If block was destroyed (HP reached 0), update indicator for new block after a short delay
        // This ensures the UI shows the new block at the new depth
        if (blockHP <= 0) {
          setTimeout(() => {
            const pickaxe = this.gameManager.getPlayerPickaxe(p);
            if (pickaxe) {
              this.updateBlockIndicator(p, pickaxe);
            }
          }, 100); // Small delay to allow player to fall and depth to update
        }
      },
      damageMultiplier,
      () => this.gameManager.isBlockingModalOpen(player) // Check modal state
    );
  }

  /**
   * Starts periodic block detection to show what block player is standing on
   * Runs continuously while player is in the mine
   * 
   * @param player - Player to start detection for
   */
  startBlockDetection(player: Player): void {
    // Stop any existing detection
    this.stopBlockDetection(player);

    const pickaxe = this.gameManager.getPlayerPickaxe(player);
    if (!pickaxe) {
      return;
    }

    // Check block immediately
    this.updateBlockIndicator(player, pickaxe);

    // Then check periodically (every 0.5 seconds)
    const interval = setInterval(() => {
      this.updateBlockIndicator(player, pickaxe);
    }, 500);

    this.blockDetectionIntervals.set(player, interval);
  }

  /**
   * Stops periodic block detection
   * 
   * @param player - Player to stop detection for
   */
  stopBlockDetection(player: Player): void {
    const interval = this.blockDetectionIntervals.get(player);
    if (interval) {
      clearInterval(interval);
      this.blockDetectionIntervals.delete(player);
    }
    
    // Clear the UI when stopping detection (e.g., when leaving mine)
    player.ui.sendData({
      type: 'MINING_UPDATE',
      damage: 0,
      currentOreName: null,
      blockHP: 0,
      maxHP: 0,
      isChest: false,
      sellValue: null,
      gemReward: null,
    });
  }

  /**
   * Updates the block indicator UI for a player
   * 
   * @param player - Player to update for
   * @param pickaxe - Player's pickaxe
   */
  private updateBlockIndicator(player: Player, pickaxe: PickaxeData): void {
    try {
      const blockInfo = this.miningSystem.detectCurrentBlock(player, pickaxe);
      
      if (!blockInfo) {
        // No valid block - hide indicator
        player.ui.sendData({
          type: 'MINING_UPDATE',
          damage: 0,
          currentOreName: null,
          blockHP: 0,
          maxHP: 0,
          isChest: false,
          sellValue: null,
          gemReward: null,
        });
        return;
      }

      // Send update with block info (0 damage since we're just detecting, not mining)
      if (blockInfo.isChest) {
        this.sendMiningUpdateEvent(
          player,
          0, // No damage, just detection
          null,
          blockInfo.blockHP,
          blockInfo.maxHP,
          true,
          blockInfo.chestType,
          blockInfo.gemReward
        );
      } else {
        const oreData = blockInfo.oreType ? ORE_DATABASE[blockInfo.oreType] : null;
        this.sendMiningUpdateEvent(
          player,
          0, // No damage, just detection
          oreData?.name || null,
          blockInfo.blockHP,
          blockInfo.maxHP,
          false,
          null,
          null
        );
      }
    } catch (error) {
      // Silently handle errors (player might not be in mine, entity not ready, etc.)
      console.warn(`[MiningController] Error updating block indicator for ${player.username}:`, error);
    }
  }

  /**
   * Starts continuous mining loop (for holding left click)
   * 
   * @param player - Player who is mining
   */
  startMiningLoop(player: Player): void {
    // First check if player is in the mine - if not, do nothing
    const initialMiningState = this.miningSystem.getMiningState(player);
    if (!initialMiningState) {
      // Player is not in the mine, cannot start mining loop
      return;
    }

    // Player is in the mine, proceed with mining
    // Don't start mining if a blocking modal is open
    if (this.gameManager.isBlockingModalOpen(player)) {
      return;
    }

    // Get More Damage multiplier from upgrade system (e.g., 1.2 = +20%)
    const moreDamageMultiplier = this.gameManager.getGemTraderUpgradeSystem().getMoreDamageMultiplier(player);
    
    // Get miner damage bonus percentage (e.g., 10 = +10%)
    const equippedMiner = this.gameManager.getMinerShop().getEquippedMiner(player);
    const minerDamageBonus = equippedMiner?.damageBonus ?? 0;
    
    // Convert multipliers to percentages, add them together, then convert back
    const moreDamagePercent = (moreDamageMultiplier - 1.0) * 100; // e.g., 1.2 -> 20%
    const totalDamagePercent = moreDamagePercent + minerDamageBonus; // Add percentages
    const damageMultiplier = 1.0 + (totalDamagePercent / 100); // Convert back to multiplier
    const playerData = this.gameManager.getPlayerData(player);
    if (!playerData) {
      return;
    }

    const pickaxe = this.gameManager.getPlayerPickaxe(player);
    if (!pickaxe) {
      return;
    }

    // Start continuous mining loop
    this.miningSystem.startMiningLoop(
      player,
      pickaxe,
      playerData,
      (p, oreType, amount) => {
        // Add ore to inventory
        this.gameManager.addOreToInventory(p, oreType, amount);
        
        // Note: Removed ore mined popup notification - info is shown in mining target display
      },
      (p, damage, currentOre, blockHP, maxHP, isChest, chestType, gemReward) => {
        // Send UI event for damage and current ore display
        const oreData = currentOre ? ORE_DATABASE[currentOre] : null;
        this.sendMiningUpdateEvent(p, damage, oreData?.name || null, blockHP, maxHP, isChest, chestType, gemReward);
        
        // Send progress update when depth changes
        const currentMiningState = this.miningSystem.getMiningState(p);
        if (currentMiningState) {
          // Pass the actual depth (negative value) - sendProgressUpdate will calculate blocks mined
          this.gameManager.sendProgressUpdate(p, currentMiningState.currentDepth);
        }
        
        // If block was destroyed (HP reached 0), update indicator for new block after a short delay
        // This ensures the UI shows the new block at the new depth
        if (blockHP <= 0) {
          setTimeout(() => {
            const pickaxe = this.gameManager.getPlayerPickaxe(p);
            if (pickaxe) {
              this.updateBlockIndicator(p, pickaxe);
            }
          }, 200); // Small delay to allow player to fall and depth to update
        }
      },
      damageMultiplier,
      () => this.gameManager.isBlockingModalOpen(player) // Check modal state
    );

    // Send initial progress update and mining state
    if (initialMiningState) {
      // Pass the actual depth (negative value) - sendProgressUpdate will calculate blocks mined
      this.gameManager.sendProgressUpdate(player, initialMiningState.currentDepth);
    }
    
    player.ui.sendData({
      type: 'MINING_STATE',
      isMining: true,
    });
    
    player.ui.sendData({
      type: 'MINING_STATE_UPDATE',
      isInMine: true,
    });

    // Start block detection to show what block player is standing on
    this.startBlockDetection(player);
  }

  /**
   * Stops continuous mining loop
   * 
   * @param player - Player to stop mining for
   */
  stopMiningLoop(player: Player): void {
    this.miningSystem.stopMiningLoop(player);
    
    player.ui.sendData({
      type: 'MINING_STATE',
      isMining: false,
    });
    
    // NOTE: Do NOT set isInMine: false here - the player is still in the mine,
    // they just stopped actively mining. The GameManager controls the in-mine state.
    
    // NOTE: Do NOT stop block detection here - the ore info should stay visible
    // as long as the player is in the mine, even when not actively mining.
    // Block detection is stopped by GameManager.teleportToSurface() when leaving the mine.
  }

  /**
   * Checks if a player is currently mining
   * 
   * @param player - Player to check
   * @returns True if player is mining
   */
  isPlayerMining(player: Player): boolean {
    return this.miningSystem.isPlayerMining(player);
  }

  /**
   * Gets the mining system
   * 
   * @returns Mining system instance
   */
  getMiningSystem(): MiningSystem {
    return this.miningSystem;
  }

  /**
   * Gets mining state for a player
   * 
   * @param player - Player to get state for
   * @returns Mining state or null if not mining
   */
  getMiningState(player: Player) {
    return this.miningSystem.getMiningState(player);
  }

  /**
   * Gets the current mine level (0-based) for a player
   * 
   * @param player - Player to get mine level for
   * @returns Current mine level (0, 1, 2, ...) or 0 if not in mine
   */
  getCurrentMineLevel(player: Player): number {
    return this.miningSystem.getCurrentMineLevel(player);
  }

  /**
   * Cleans up when player leaves
   * 
   * @param player - Player who left
   */
  cleanupPlayer(player: Player): void {
    this.stopMiningLoop(player);
    this.stopBlockDetection(player);
    this.miningSystem.cleanupPlayer(player);
  }

  /**
   * Cleans up the controller
   */
  cleanup(): void {
    // Cleanup handled by individual player cleanup
  }

  /**
   * Sends ore mined event to UI
   */
  private sendOreMinedEvent(player: Player, oreName: string): void {
    player.ui.sendData({
      type: 'ORE_MINED',
      oreName,
    });
  }

  /**
   * Sends mining update event to UI (damage and current ore)
   * Now includes sell value for ores and gem rewards for chests
   */
  private sendMiningUpdateEvent(
    player: Player,
    damage: number,
    currentOreName: string | null,
    blockHP: number,
    maxHP: number,
    isChest: boolean = false,
    chestType: string | null = null,
    gemReward: number | null = null
  ): void {
    // Calculate sell value for ores (if not a chest)
    let sellValue: number | null = null;
    let finalGemReward: number | null = null;
    
    if (isChest && gemReward !== null) {
      // Apply More Gems upgrade multiplier to chest gem reward for display
      const moreGemsMultiplier = this.gameManager.getGemTraderUpgradeSystem().getMoreGemsMultiplier(player);
      finalGemReward = Math.round(gemReward * moreGemsMultiplier);
    }
    
    // Get ore color for display (only for ores, not chests)
    let oreColor: string | null = null;
    if (!isChest && currentOreName) {
      // Find ore type from name
      const oreEntry = Object.entries(ORE_DATABASE).find(([_, data]) => data.name === currentOreName);
      if (oreEntry) {
        const oreType = oreEntry[0] as OreType;
        const oreData = ORE_DATABASE[oreType];
        // Use the selling system's combined multiplier (includes pickaxe, More Coins upgrade, and miner bonus)
        const sellMultiplier = this.gameManager.getSellingSystem().getCombinedCoinMultiplier(player);
        let calculatedValue = oreData.value * sellMultiplier;
        // Round to nearest 5 with no decimals (matching selling system)
        calculatedValue = Math.round(calculatedValue / 5) * 5;
        sellValue = calculatedValue;
        // Get ore color for text display
        oreColor = oreData.color;
      }
    }

    player.ui.sendData({
      type: 'MINING_UPDATE',
      damage,
      currentOreName: isChest ? chestType : currentOreName,
      blockHP,
      maxHP,
      isChest,
      sellValue, // For ores: how much gold this ore will sell for (with pickaxe and More Coins multipliers)
      gemReward: finalGemReward, // For chests: how many gems this chest will give (with More Gems multiplier)
      oreColor, // For ores: color to display the ore name in
    });
  }

  /**
   * Gets player entity
   */
  private getPlayerEntity(player: Player): Entity | undefined {
    const entities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
    if (!entities.length) return undefined;
    return entities[0];
  }
}
