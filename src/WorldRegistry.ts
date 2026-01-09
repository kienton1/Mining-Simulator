import { WorldConfig } from './types/WorldConfig';

export class WorldRegistry {
  private static worlds = new Map<string, WorldConfig>();

  /**
   * Register a world configuration
   */
  public static registerWorld(config: WorldConfig): void {
    this.worlds.set(config.id, config);
  }

  /**
   * Get a world configuration by ID
   */
  public static getWorldConfig(worldId: string): WorldConfig | undefined {
    return this.worlds.get(worldId);
  }

  /**
   * Get all registered worlds
   */
  public static getAllWorlds(): WorldConfig[] {
    return Array.from(this.worlds.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Check if a world is registered
   */
  public static hasWorld(worldId: string): boolean {
    return this.worlds.has(worldId);
  }

  /**
   * Get worlds that are unlocked based on player wins
   */
  public static getUnlockedWorlds(playerWins: number): WorldConfig[] {
    return this.getAllWorlds().filter(world => {
      if (world.unlockRequirement.type === 'wins') {
        return playerWins >= world.unlockRequirement.amount;
      }
      return false;
    });
  }

  /**
   * Clear all registered worlds (for testing)
   */
  public static clearRegistry(): void {
    this.worlds.clear();
  }
}
