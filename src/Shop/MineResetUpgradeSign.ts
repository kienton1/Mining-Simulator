/**
 * Mine Reset Upgrade Sign
 * 
 * Creates a floating 3D UI sign that always faces the player and allows them to purchase the mine reset upgrade.
 * When purchased, the mine reset timer increases from 2 minutes to 5 minutes.
 * 
 * Position: x: 5.08, y: 1.79, z: 14.35
 */

import { World, Player, SceneUI } from 'hytopia';

/**
 * Mine Reset Upgrade Sign Entity Manager
 * Handles floating SceneUI sign creation
 */
export class MineResetUpgradeSign {
  private world: World;
  private signPosition: { x: number; y: number; z: number };
  private sceneUI?: SceneUI;
  private updateInterval?: NodeJS.Timeout;
  private connectedPlayers: Set<Player> = new Set();
  public onButtonClick?: (player: Player) => void;

  /**
   * Creates a new MineResetUpgradeSign instance
   * 
   * @param world - Hytopia world instance
   * @param position - Position to spawn sign at
   */
  constructor(
    world: World,
    position: { x: number; y: number; z: number }
  ) {
    this.world = world;
    this.signPosition = position;
  }

  /**
   * Spawns the floating SceneUI sign in the world
   */
  spawn(): void {
    if (this.sceneUI) {
      console.warn('[MineResetUpgradeSign] Sign already spawned');
      return;
    }

    // Use the exact same approach as training rocks SceneUI
    const uiPos = {
      x: this.signPosition.x,
      y: this.signPosition.y,
      z: this.signPosition.z,
    };

    this.sceneUI = new SceneUI({
      templateId: 'mine-reset-upgrade:sign',
      viewDistance: 64,
      position: uiPos,
      state: {
        hasUpgrade: false,
        cost: 2_000_000,
        gold: 0,
      },
    });

    // Load the SceneUI
    this.sceneUI.load(this.world);
    
    // Set position to ensure it's anchored correctly (same as training rocks)
    this.sceneUI.setPosition(uiPos);
    
    // Calculate rotation to face origin (0, 0, 0) instead of player
    // Direction vector from sign to origin
    const dx = 0 - this.signPosition.x;
    const dz = 0 - this.signPosition.z;
    const angleY = Math.atan2(dx, dz);
    
    // Convert to quaternion for Y-axis rotation
    const halfAngle = angleY / 2;
    const rotation = {
      x: 0,
      y: Math.sin(halfAngle),
      z: 0,
      w: Math.cos(halfAngle),
    };
    
    // Set rotation to face origin (disable billboarding)
    if (typeof (this.sceneUI as any).setRotation === 'function') {
      (this.sceneUI as any).setRotation(rotation);
    }

    console.log(`[MineResetUpgradeSign] Floating sign spawned at ${this.signPosition.x}, ${this.signPosition.y}, ${this.signPosition.z}`);

    // Set up periodic updates to keep UI state current and position anchored
    this.startUpdateInterval();
  }

  /**
   * Starts periodic updates to refresh UI state, keep position anchored, and update scale
   * Similar to how games like "steal a brainrot" implement distance-based scaling
   */
  private startUpdateInterval(): void {
    // Update frequently to keep scale responsive to player distance
    this.updateInterval = setInterval(() => {
      if (!this.sceneUI) return;
      
      // Keep position anchored (same approach as training rocks)
      const uiPos = {
        x: this.signPosition.x,
        y: this.signPosition.y,
        z: this.signPosition.z,
      };
      this.sceneUI.setPosition(uiPos);
      
      // Update scale based on nearest player distance
      // Small when far, bigger when close (inverse distance scaling)
      // Similar to how games like "steal a brainrot" implement it
      const nearestPlayerDistance = this.getNearestPlayerDistance();
      if (nearestPlayerDistance !== null) {
        // Scale calculation: smaller when far, bigger when close
        // Distance range: 0-12 blocks for smooth scaling
        const minDistance = 0;
        const maxDistance = 12;
        const minScale = 0.5; // Scale when far away (12+ blocks)
        const maxScale = 1.5; // Scale when close (0 blocks)
        
        // Clamp distance to range
        const clampedDistance = Math.max(minDistance, Math.min(maxDistance, nearestPlayerDistance));
        
        // Calculate normalized distance (0 = close, 1 = far)
        const normalizedDistance = clampedDistance / maxDistance;
        
        // Invert: closer = bigger scale
        // Formula: scale = maxScale - (normalizedDistance * (maxScale - minScale))
        const scale = maxScale - (normalizedDistance * (maxScale - minScale));
        
        // Update state with scale so the UI template can apply it via CSS transform
        // We need to preserve existing state and add scale
        this.sceneUI.setState({
          hasUpgrade: (this.sceneUI as any).lastState?.hasUpgrade ?? false,
          cost: (this.sceneUI as any).lastState?.cost ?? 2_000_000,
          gold: (this.sceneUI as any).lastState?.gold ?? 0,
          scale: scale,
        });
        
        // Store last state for next update
        (this.sceneUI as any).lastState = {
          hasUpgrade: (this.sceneUI as any).lastState?.hasUpgrade ?? false,
          cost: (this.sceneUI as any).lastState?.cost ?? 2_000_000,
          gold: (this.sceneUI as any).lastState?.gold ?? 0,
          scale: scale,
        };
        
        // Also try direct scale methods if available (SceneUI API)
        if (typeof (this.sceneUI as any).setScale === 'function') {
          (this.sceneUI as any).setScale(scale);
        }
      }
    }, 50); // Update very frequently for smooth scaling (every 50ms)
  }

  /**
   * Adds a player to tracking
   */
  addPlayer(player: Player): void {
    this.connectedPlayers.add(player);
  }

  /**
   * Removes a player from tracking
   */
  removePlayer(player: Player): void {
    this.connectedPlayers.delete(player);
  }

  /**
   * Gets the distance to the nearest player
   * 
   * @returns Distance to nearest player, or null if no players
   */
  private getNearestPlayerDistance(): number | null {
    if (this.connectedPlayers.size === 0) {
      return null;
    }

    let nearestDistance: number | null = null;
    
    for (const player of this.connectedPlayers) {
      // Get player entity position
      const playerEntities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
      if (playerEntities.length === 0) continue;
      
      const playerEntity = playerEntities[0];
      const playerPos = playerEntity.position;
      
      const dx = playerPos.x - this.signPosition.x;
      const dy = playerPos.y - this.signPosition.y;
      const dz = playerPos.z - this.signPosition.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (nearestDistance === null || distance < nearestDistance) {
        nearestDistance = distance;
      }
    }
    
    return nearestDistance;
  }

  /**
   * Stops update interval
   */
  private stopUpdateInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  /**
   * Updates the sign UI state
   * Note: SceneUI state is shared across all players, so we update it with the most recent player's data
   * In a real implementation, you might want per-player state, but for simplicity we'll use shared state
   * 
   * @param player - Player whose data to use for update (optional, for logging)
   * @param hasUpgrade - Whether player has purchased upgrade
   * @param gold - Player's current gold
   */
  updatePlayerState(player: Player, hasUpgrade: boolean, gold: number): void {
    if (!this.sceneUI) return;

    // Update SceneUI state
    // Note: Since SceneUI state is shared, this will update for all viewers
    // The button click handler will send the purchase request from the clicking player
    const currentScale = (this.sceneUI as any).lastState?.scale ?? 1.0;
    const newState = {
      hasUpgrade,
      cost: 2_000_000,
      gold,
      scale: currentScale, // Preserve current scale
    };
    this.sceneUI.setState(newState);
    (this.sceneUI as any).lastState = newState;
  }

  /**
   * Despawns the sign entity
   */
  despawn(): void {
    if (this.sceneUI) {
      this.sceneUI.unload();
      this.sceneUI = undefined;
    }
    this.stopUpdateInterval();
  }

  /**
   * Gets the sign position
   */
  getPosition(): { x: number; y: number; z: number } {
    return { ...this.signPosition };
  }
}

