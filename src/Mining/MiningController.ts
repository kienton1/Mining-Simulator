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

/**
 * Mining Controller class
 * Coordinates mining system and game manager
 */
export class MiningController {
  private world: World;
  private miningSystem: MiningSystem;
  private gameManager: GameManager;

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
  }

  /**
   * Handles left click input for mining
   * 
   * @param player - Player who clicked
   */
  handleMiningClick(player: Player): void {
    const playerData = this.gameManager.getPlayerData(player);
    if (!playerData) {
      console.warn('[MiningController] Player data not found');
      return;
    }

    const pickaxe = this.gameManager.getPlayerPickaxe(player);
    if (!pickaxe) {
      console.warn('[MiningController] Player has no pickaxe');
      return;
    }

    // Handle single click mining
    this.miningSystem.handleMiningClick(
      player,
      pickaxe,
      (p, oreType, amount) => {
        // Add ore to inventory
        this.gameManager.addOreToInventory(p, oreType, amount);
        
        // Send UI event for mined ore popup
        const oreData = ORE_DATABASE[oreType];
        this.sendOreMinedEvent(p, oreData.name);
      },
      (p, damage, currentOre, blockHP, maxHP) => {
        // Send UI event for damage and current ore display
        const oreData = currentOre ? ORE_DATABASE[currentOre] : null;
        this.sendMiningUpdateEvent(p, damage, oreData?.name || null, blockHP, maxHP);
      }
    );
  }

  /**
   * Starts continuous mining loop (for holding left click)
   * 
   * @param player - Player who is mining
   */
  startMiningLoop(player: Player): void {
    const playerData = this.gameManager.getPlayerData(player);
    if (!playerData) {
      console.warn('[MiningController] Player data not found');
      return;
    }

    const pickaxe = this.gameManager.getPlayerPickaxe(player);
    if (!pickaxe) {
      console.warn('[MiningController] Player has no pickaxe');
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
        
        // Send UI event for mined ore popup
        const oreData = ORE_DATABASE[oreType];
        this.sendOreMinedEvent(p, oreData.name);
      },
      (p, damage, currentOre, blockHP, maxHP) => {
        // Send UI event for damage and current ore display
        const oreData = currentOre ? ORE_DATABASE[currentOre] : null;
        this.sendMiningUpdateEvent(p, damage, oreData?.name || null, blockHP, maxHP);
        
        // Send progress update when depth changes
        const miningState = this.miningSystem.getMiningState(p);
        if (miningState) {
          // Pass the actual depth (negative value) - sendProgressUpdate will calculate blocks mined
          this.gameManager.sendProgressUpdate(p, miningState.currentDepth);
        }
      }
    );

    // Send initial progress update and mining state
    const miningState = this.miningSystem.getMiningState(player);
    if (miningState) {
      // Pass the actual depth (negative value) - sendProgressUpdate will calculate blocks mined
      this.gameManager.sendProgressUpdate(player, miningState.currentDepth);
    }
    
    player.ui.sendData({
      type: 'MINING_STATE',
      isMining: true,
    });
    
    player.ui.sendData({
      type: 'MINING_STATE_UPDATE',
      isInMine: true,
    });
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
    
    player.ui.sendData({
      type: 'MINING_STATE_UPDATE',
      isInMine: false,
    });
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
   * Cleans up when player leaves
   * 
   * @param player - Player who left
   */
  cleanupPlayer(player: Player): void {
    this.stopMiningLoop(player);
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
   */
  private sendMiningUpdateEvent(
    player: Player,
    damage: number,
    currentOreName: string | null,
    blockHP: number,
    maxHP: number
  ): void {
    player.ui.sendData({
      type: 'MINING_UPDATE',
      damage,
      currentOreName,
      blockHP,
      maxHP,
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
