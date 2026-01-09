import { Player } from '../Core/Player';
import { WorldConfig } from './types/WorldConfig';
import { WorldContext } from './types/WorldContext';
import { WorldRegistry } from './WorldRegistry';
import { MiningState } from '../Mining/MiningSystem';

export class WorldManager {
  private static instance: WorldManager;
  private worldContexts = new Map<string, Map<string, WorldContext>>();
  private currentWorlds = new Map<Player, string>();

  public static getInstance(): WorldManager {
    if (!WorldManager.instance) {
      WorldManager.instance = new WorldManager();
    }
    return WorldManager.instance;
  }

  /**
   * Initialize world context for a player and world
   */
  public initializeWorldContext(player: Player, worldId: string): WorldContext {
    const worldConfig = WorldRegistry.getWorldConfig(worldId);
    if (!worldConfig) {
      throw new Error(`World ${worldId} not found in registry`);
    }

    if (!this.worldContexts.has(player.id)) {
      this.worldContexts.set(player.id, new Map());
    }

    const playerWorlds = this.worldContexts.get(player.id)!;

    if (!playerWorlds.has(worldId)) {
      const context: WorldContext = {
        worldId,
        mineState: null,
        mineResetUpgradePurchased: false,
        mineTimer: {
          remainingSeconds: worldConfig.id === 'island2' ? 120 : 120, // Default 2 minutes
          isUpgraded: false
        },
        currentMineDepth: 0
      };
      playerWorlds.set(worldId, context);
    }

    return playerWorlds.get(worldId)!;
  }

  /**
   * Get world context for a player and world
   */
  public getWorldContext(player: Player, worldId: string): WorldContext | undefined {
    return this.worldContexts.get(player.id)?.get(worldId);
  }

  /**
   * Save mine state for a world
   */
  public saveWorldMineState(player: Player, worldId: string, mineState: MiningState | null): void {
    const context = this.getWorldContext(player, worldId);
    if (context) {
      context.mineState = mineState;
    }
  }

  /**
   * Get mine state for a world
   */
  public getWorldMineState(player: Player, worldId: string): MiningState | null {
    return this.getWorldContext(player, worldId)?.mineState || null;
  }

  /**
   * Set current world for a player
   */
  public setCurrentWorld(player: Player, worldId: string): void {
    const worldConfig = WorldRegistry.getWorldConfig(worldId);
    if (!worldConfig) {
      throw new Error(`Cannot switch to unknown world: ${worldId}`);
    }

    this.currentWorlds.set(player, worldId);

    // Initialize context if it doesn't exist
    this.initializeWorldContext(player, worldId);
  }

  /**
   * Get current world for a player
   */
  public getCurrentWorld(player: Player): string {
    return this.currentWorlds.get(player) || 'island1'; // Default to island1
  }

  /**
   * Switch player to a different world
   */
  public switchWorld(player: Player, targetWorldId: string): WorldContext {
    const currentWorldId = this.getCurrentWorld(player);

    // Save current world state
    const currentContext = this.getWorldContext(player, currentWorldId);
    if (currentContext) {
      // Save any current mine state here if needed
    }

    // Switch to target world
    this.setCurrentWorld(player, targetWorldId);

    // Return the target world context
    return this.getWorldContext(player, targetWorldId)!;
  }

  /**
   * Get mine reset upgrade cost for a world
   */
  public getMineResetUpgradeCost(worldId: string): number {
    switch (worldId) {
      case 'island1':
        return 2000000; // 2M
      case 'island2':
        return 750000000000; // 750B
      default:
        return 2000000;
    }
  }

  /**
   * Check if mine reset upgrade is purchased for a world
   */
  public isMineResetUpgradePurchased(player: Player, worldId: string): boolean {
    return this.getWorldContext(player, worldId)?.mineResetUpgradePurchased || false;
  }

  /**
   * Purchase mine reset upgrade for a world
   */
  public purchaseMineResetUpgrade(player: Player, worldId: string): void {
    const context = this.getWorldContext(player, worldId);
    if (context) {
      context.mineResetUpgradePurchased = true;
      context.mineTimer.isUpgraded = true;
      // Update timer based on upgrade
      context.mineTimer.remainingSeconds = context.mineTimer.isUpgraded ? 300 : 120;
    }
  }

  /**
   * Get mine timer state for a world
   */
  public getMineTimerState(player: Player, worldId: string): { remainingSeconds: number; isUpgraded: boolean } {
    const context = this.getWorldContext(player, worldId);
    return context?.mineTimer || { remainingSeconds: 120, isUpgraded: false };
  }

  /**
   * Update mine timer for a world
   */
  public updateMineTimer(player: Player, worldId: string, remainingSeconds: number): void {
    const context = this.getWorldContext(player, worldId);
    if (context) {
      context.mineTimer.remainingSeconds = remainingSeconds;
    }
  }

  /**
   * Reset mine timer for a world
   */
  public resetMineTimer(player: Player, worldId: string): void {
    const context = this.getWorldContext(player, worldId);
    if (context) {
      context.mineTimer.remainingSeconds = context.mineTimer.isUpgraded ? 300 : 120;
    }
  }

  /**
   * Get trophy multiplier for a world
   */
  public getTrophyMultiplier(worldId: string): number {
    const worldConfig = WorldRegistry.getWorldConfig(worldId);
    return worldConfig?.trophyMultiplier || 1;
  }

  /**
   * Check if player can unlock a world
   */
  public canUnlockWorld(player: Player, worldId: string): boolean {
    const worldConfig = WorldRegistry.getWorldConfig(worldId);
    if (!worldConfig) return false;

    // For now, only check wins requirement
    if (worldConfig.unlockRequirement.type === 'wins') {
      return player.wins >= worldConfig.unlockRequirement.amount;
    }

    return false;
  }
}
