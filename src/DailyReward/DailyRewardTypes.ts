/**
 * Daily Reward Types
 *
 * Type definitions for the Daily Reward Chest system.
 */

export enum DailyRewardType {
  NEXT_PICKAXE = 'next_pickaxe',
  NEXT_MINER = 'next_miner',
  DUPLICATE_BEST_PET = 'duplicate_best_pet',
  MAX_GOLD = 'max_gold',
  MAX_GEMS = 'max_gems',
}

export interface DailyRewardResult {
  type: DailyRewardType;
  value: number | string;
  displayName: string;
  iconUri: string;
}

export interface DailyRewardOption {
  type: DailyRewardType;
  displayName: string;
  iconUri: string;
  description: string;
  value: number | string;
}
