/**
 * Daily Reward System
 *
 * Core logic for the daily reward chest system.
 * Handles eligibility checks, reward selection, and granting rewards.
 */

import { Player } from 'hytopia';
import type { PlayerData } from '../Core/PlayerData';
import { DailyRewardType, type DailyRewardResult, type DailyRewardOption } from './DailyRewardTypes';
import { PICKAXE_DATABASE, getPickaxeByTier } from '../Pickaxe/PickaxeDatabase';
import { MINER_DATABASE, getMinerByTier } from '../Miner/MinerDatabase';
import { getPetDefinition } from '../Pets/PetDatabase';

/** 24 hours in milliseconds */
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export class DailyRewardSystem {
  private getPlayerDataCallback?: (player: Player) => PlayerData | undefined;
  private updatePlayerDataCallback?: (player: Player, data: PlayerData) => void;

  /**
   * Sets the callback function to get player data
   */
  setGetPlayerDataCallback(callback: (player: Player) => PlayerData | undefined): void {
    this.getPlayerDataCallback = callback;
  }

  /**
   * Sets the callback function to update player data
   */
  setUpdatePlayerDataCallback(callback: (player: Player, data: PlayerData) => void): void {
    this.updatePlayerDataCallback = callback;
  }

  /**
   * Checks if the player can claim their daily reward
   * Returns true if 24 hours have passed since lastDailyRewardClaim
   */
  canClaim(player: Player): boolean {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) return false;

    const lastClaim = playerData.lastDailyRewardClaim ?? 0;
    const now = Date.now();
    return now - lastClaim >= DAILY_COOLDOWN_MS;
  }

  /**
   * Gets the remaining time in milliseconds until the next claim is available
   */
  getRemainingMs(player: Player): number {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) return 0;

    const lastClaim = playerData.lastDailyRewardClaim ?? 0;
    const now = Date.now();
    const remaining = DAILY_COOLDOWN_MS - (now - lastClaim);
    return Math.max(0, remaining);
  }

  /**
   * Updates the max currency tracking if current values exceed stored max
   */
  updateMaxCurrencyIfNeeded(player: Player, gold: number, gems: number): void {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) return;

    let updated = false;

    if (gold > (playerData.maxGoldEverHeld ?? 0)) {
      playerData.maxGoldEverHeld = gold;
      updated = true;
    }

    if (gems > (playerData.maxGemsEverHeld ?? 0)) {
      playerData.maxGemsEverHeld = gems;
      updated = true;
    }

    if (updated) {
      this.updatePlayerDataCallback?.(player, playerData);
    }
  }

  /**
   * Gets the next unowned pickaxe tier for the player
   * Returns null if player owns all pickaxes
   */
  private getNextUnownedPickaxeTier(playerData: PlayerData): number | null {
    const ownedPickaxes = playerData.ownedPickaxes ?? [0];
    const maxTier = PICKAXE_DATABASE.length - 1; // 53 (0-53 = 54 total)

    // Find the first tier not owned
    for (let tier = 0; tier <= maxTier; tier++) {
      if (!ownedPickaxes.includes(tier)) {
        return tier;
      }
    }
    return null; // All pickaxes owned
  }

  /**
   * Gets the next unowned miner tier for the player
   * Returns null if player owns all miners
   */
  private getNextUnownedMinerTier(playerData: PlayerData): number | null {
    const ownedMiners = playerData.ownedMiners ?? [];
    const maxTier = MINER_DATABASE.length - 1; // 23 (0-23 = 24 total)

    // Find the first tier not owned
    for (let tier = 0; tier <= maxTier; tier++) {
      if (!ownedMiners.includes(tier)) {
        return tier;
      }
    }
    return null; // All miners owned
  }

  /**
   * Gets the best pet (highest multiplier) owned by the player
   * Returns null if player has no pets
   */
  private getBestOwnedPet(playerData: PlayerData): { petId: string; name: string; multiplier: number } | null {
    const allPets = [
      ...(playerData.petInventory ?? []),
      ...(playerData.equippedPets ?? []),
    ];

    if (allPets.length === 0) return null;

    let best: { petId: string; name: string; multiplier: number } | null = null;

    for (const petId of allPets) {
      const def = getPetDefinition(petId);
      if (def) {
        if (!best || def.multiplier > best.multiplier) {
          best = { petId: def.id, name: def.name, multiplier: def.multiplier };
        }
      }
    }

    return best;
  }

  /**
   * Gets all possible rewards for the player (used for UI animation)
   */
  getPossibleRewards(player: Player): DailyRewardOption[] {
    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) return [];

    const options: DailyRewardOption[] = [];

    // Next pickaxe (if not maxed)
    const nextPickaxeTier = this.getNextUnownedPickaxeTier(playerData);
    if (nextPickaxeTier !== null) {
      const pickaxe = getPickaxeByTier(nextPickaxeTier);
      options.push({
        type: DailyRewardType.NEXT_PICKAXE,
        displayName: pickaxe?.name ?? `Pickaxe Tier ${nextPickaxeTier}`,
        iconUri: 'icons/HUDIcons/PickaxeIcon.png',
        description: 'Next Pickaxe',
        value: nextPickaxeTier,
      });
    }

    // Next miner (if not maxed)
    const nextMinerTier = this.getNextUnownedMinerTier(playerData);
    if (nextMinerTier !== null) {
      const miner = getMinerByTier(nextMinerTier);
      options.push({
        type: DailyRewardType.NEXT_MINER,
        displayName: miner?.name ?? `Miner Tier ${nextMinerTier}`,
        iconUri: 'icons/HUDIcons/MinerIcon.png',
        description: 'Next Miner',
        value: nextMinerTier,
      });
    }

    // Best pet duplicate (if has any pets)
    const bestPet = this.getBestOwnedPet(playerData);
    if (bestPet) {
      options.push({
        type: DailyRewardType.DUPLICATE_BEST_PET,
        displayName: bestPet.name,
        iconUri: 'icons/HUDIcons/PetIcon.png',
        description: `Best Pet (x${bestPet.multiplier})`,
        value: bestPet.petId,
      });
    }

    // Max gold (always available)
    const maxGold = playerData.maxGoldEverHeld ?? 0;
    options.push({
      type: DailyRewardType.MAX_GOLD,
      displayName: this.formatCurrency(maxGold),
      iconUri: 'icons/HUDIcons/CoinIcon.png',
      description: 'Max Gold Ever',
      value: maxGold,
    });

    // Max gems (always available)
    const maxGems = playerData.maxGemsEverHeld ?? 0;
    options.push({
      type: DailyRewardType.MAX_GEMS,
      displayName: this.formatCurrency(maxGems),
      iconUri: 'icons/HUDIcons/GemIcon.png',
      description: 'Max Gems Ever',
      value: maxGems,
    });

    return options;
  }

  /**
   * Claims the daily reward for the player
   * Selects a random reward from eligible options and grants it
   */
  claimReward(player: Player): { success: boolean; result?: DailyRewardResult; message?: string } {
    if (!this.canClaim(player)) {
      const remaining = this.getRemainingMs(player);
      return {
        success: false,
        message: `You can claim again in ${this.formatTime(remaining)}`,
      };
    }

    const playerData = this.getPlayerDataCallback?.(player);
    if (!playerData) {
      return { success: false, message: 'Player data not found' };
    }

    // Build list of eligible rewards
    const eligible: { type: DailyRewardType; value: number | string }[] = [];

    // Next pickaxe
    const nextPickaxeTier = this.getNextUnownedPickaxeTier(playerData);
    if (nextPickaxeTier !== null) {
      eligible.push({ type: DailyRewardType.NEXT_PICKAXE, value: nextPickaxeTier });
    }

    // Next miner
    const nextMinerTier = this.getNextUnownedMinerTier(playerData);
    if (nextMinerTier !== null) {
      eligible.push({ type: DailyRewardType.NEXT_MINER, value: nextMinerTier });
    }

    // Best pet duplicate
    const bestPet = this.getBestOwnedPet(playerData);
    if (bestPet) {
      eligible.push({ type: DailyRewardType.DUPLICATE_BEST_PET, value: bestPet.petId });
    }

    // Currency rewards (always available)
    eligible.push({ type: DailyRewardType.MAX_GOLD, value: playerData.maxGoldEverHeld ?? 0 });
    eligible.push({ type: DailyRewardType.MAX_GEMS, value: playerData.maxGemsEverHeld ?? 0 });

    // Select random reward
    const selected = eligible[Math.floor(Math.random() * eligible.length)];

    // Grant the reward
    const result = this.grantReward(player, playerData, selected.type, selected.value);

    // Update claim timestamp
    playerData.lastDailyRewardClaim = Date.now();
    this.updatePlayerDataCallback?.(player, playerData);

    return { success: true, result };
  }

  /**
   * Grants the selected reward to the player
   */
  private grantReward(
    player: Player,
    playerData: PlayerData,
    type: DailyRewardType,
    value: number | string
  ): DailyRewardResult {
    switch (type) {
      case DailyRewardType.NEXT_PICKAXE: {
        const tier = value as number;
        if (!playerData.ownedPickaxes) playerData.ownedPickaxes = [0];
        if (!playerData.ownedPickaxes.includes(tier)) {
          playerData.ownedPickaxes.push(tier);
          playerData.ownedPickaxes.sort((a, b) => a - b);
        }
        const pickaxe = getPickaxeByTier(tier);
        return {
          type,
          value: tier,
          displayName: pickaxe?.name ?? `Pickaxe Tier ${tier}`,
          iconUri: 'icons/HUDIcons/PickaxeIcon.png',
        };
      }

      case DailyRewardType.NEXT_MINER: {
        const tier = value as number;
        if (!playerData.ownedMiners) playerData.ownedMiners = [];
        if (!playerData.ownedMiners.includes(tier)) {
          playerData.ownedMiners.push(tier);
          playerData.ownedMiners.sort((a, b) => a - b);
        }
        const miner = getMinerByTier(tier);
        return {
          type,
          value: tier,
          displayName: miner?.name ?? `Miner Tier ${tier}`,
          iconUri: 'icons/HUDIcons/MinerIcon.png',
        };
      }

      case DailyRewardType.DUPLICATE_BEST_PET: {
        const petId = value as string;
        if (!playerData.petInventory) playerData.petInventory = [];
        playerData.petInventory.push(petId);
        const def = getPetDefinition(petId);
        return {
          type,
          value: petId,
          displayName: def?.name ?? petId,
          iconUri: 'icons/HUDIcons/PetIcon.png',
        };
      }

      case DailyRewardType.MAX_GOLD: {
        const amount = value as number;
        playerData.gold = (playerData.gold ?? 0) + amount;
        return {
          type,
          value: amount,
          displayName: this.formatCurrency(amount) + ' Gold',
          iconUri: 'icons/HUDIcons/CoinIcon.png',
        };
      }

      case DailyRewardType.MAX_GEMS: {
        const amount = value as number;
        playerData.gems = (playerData.gems ?? 0) + amount;
        return {
          type,
          value: amount,
          displayName: this.formatCurrency(amount) + ' Gems',
          iconUri: 'icons/HUDIcons/GemIcon.png',
        };
      }

      default:
        return {
          type,
          value,
          displayName: 'Unknown Reward',
          iconUri: 'icons/HUDIcons/CoinIcon.png',
        };
    }
  }

  /**
   * Formats a currency amount with appropriate suffix (K, M, B, T, etc.)
   */
  private formatCurrency(amount: number): string {
    if (amount >= 1e15) return (amount / 1e15).toFixed(1).replace(/\.0$/, '') + 'Q';
    if (amount >= 1e12) return (amount / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
    if (amount >= 1e9) return (amount / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (amount >= 1e6) return (amount / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (amount >= 1e3) return (amount / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return amount.toString();
  }

  /**
   * Formats milliseconds as HH:MM:SS
   */
  formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
}
