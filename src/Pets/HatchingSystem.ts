/**
 * Pet System - HatchingSystem
 *
 * Handles spending gold + rolling pets from egg loot tables.
 */

import type { Player } from 'hytopia';
import type { PlayerData } from '../Core/PlayerData';
import { EGG_DEFINITIONS, rollPetId, PET_INVENTORY_CAPACITY } from './PetDatabase';
import { EggType, type PetId } from './PetData';
import { PetManager } from './PetManager';

type GetPlayerData = (player: Player) => PlayerData | undefined;
type UpdatePlayerData = (player: Player, data: PlayerData) => void;

export class HatchingSystem {
  private petManager: PetManager;
  private getPlayerDataCb?: GetPlayerData;
  private updatePlayerDataCb?: UpdatePlayerData;

  constructor(petManager: PetManager) {
    this.petManager = petManager;
  }

  setGetPlayerDataCallback(cb: GetPlayerData): void {
    this.getPlayerDataCb = cb;
  }

  setUpdatePlayerDataCallback(cb: UpdatePlayerData): void {
    this.updatePlayerDataCb = cb;
  }

  private getPlayerData(player: Player): PlayerData | undefined {
    return this.getPlayerDataCb?.(player);
  }

  private updatePlayerData(player: Player, data: PlayerData): void {
    this.updatePlayerDataCb?.(player, data);
  }

  getEggCostGold(eggType: EggType): number {
    return EGG_DEFINITIONS[eggType]?.costGold ?? 0;
  }

  canHatch(player: Player, eggType: EggType, count: number): { canHatch: boolean; message?: string } {
    const data = this.getPlayerData(player);
    if (!data) return { canHatch: false, message: 'Player data not found' };
    if (count <= 0) return { canHatch: false, message: 'Count must be > 0' };

    const cost = this.getEggCostGold(eggType) * count;
    if ((data.gold ?? 0) < cost) {
      return { canHatch: false, message: `Insufficient gold. Need ${cost.toLocaleString()}` };
    }

    const invCount = Array.isArray(data.petInventory) ? data.petInventory.length : 0;
    const eqCount = Array.isArray(data.equippedPets) ? data.equippedPets.length : 0;
    const ownedCount = invCount + eqCount;
    if (ownedCount + count > PET_INVENTORY_CAPACITY) {
      return { canHatch: false, message: `Pet capacity full (${ownedCount}/${PET_INVENTORY_CAPACITY})` };
    }

    return { canHatch: true };
  }

  hatch(player: Player, eggType: EggType, count: number): { success: boolean; message?: string; results?: PetId[]; goldSpent?: number } {
    const data = this.getPlayerData(player);
    if (!data) return { success: false, message: 'Player data not found' };

    const precheck = this.canHatch(player, eggType, count);
    if (!precheck.canHatch) return { success: false, message: precheck.message };

    const totalCost = this.getEggCostGold(eggType) * count;

    // Deduct gold up-front (authoritative server-side)
    data.gold = (data.gold ?? 0) - totalCost;
    this.updatePlayerData(player, data);

    // Roll results and add to inventory
    const results: PetId[] = [];
    for (let i = 0; i < count; i++) {
      const petId = rollPetId(eggType);
      const addRes = this.petManager.addToInventory(player, petId);
      if (!addRes.success) {
        // Should not happen due to precheck, but fail gracefully.
        return { success: false, message: addRes.message ?? 'Failed to add pet' };
      }
      results.push(petId);
    }

    // Update client gold display (optional, but consistent with other systems)
    player.ui.sendData({ type: 'GOLD_STATS', gold: data.gold });

    return { success: true, results, goldSpent: totalCost };
  }
}


