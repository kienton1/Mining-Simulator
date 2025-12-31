/**
 * Pet System - PetManager
 *
 * Owns pet inventory + equipped pets state (stored on PlayerData).
 * Duplicates are supported by storing PetIds in arrays (one entry per pet instance).
 */

import type { Player } from 'hytopia';
import type { PlayerData } from '../Core/PlayerData';
import { getPetDefinition, isPetId, PET_EQUIP_CAPACITY, PET_INVENTORY_CAPACITY } from './PetDatabase';
import type { PetId } from './PetData';

type GetPlayerData = (player: Player) => PlayerData | undefined;
type UpdatePlayerData = (player: Player, data: PlayerData) => void;

export class PetManager {
  private getPlayerDataCb?: GetPlayerData;
  private updatePlayerDataCb?: UpdatePlayerData;

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

  getInventory(player: Player): PetId[] {
    const data = this.getPlayerData(player);
    const inv = data?.petInventory;
    return Array.isArray(inv) ? (inv.filter(isPetId) as PetId[]) : [];
  }

  getEquipped(player: Player): PetId[] {
    const data = this.getPlayerData(player);
    const eq = data?.equippedPets;
    return Array.isArray(eq) ? (eq.filter(isPetId) as PetId[]) : [];
  }

  getInventoryCount(player: Player): number {
    return this.getInventory(player).length;
  }

  getEquippedCount(player: Player): number {
    return this.getEquipped(player).length;
  }

  getOwnedCount(player: Player): number {
    return this.getInventoryCount(player) + this.getEquippedCount(player);
  }

  hasInventorySpace(player: Player, amount: number): boolean {
    // Capacity is total owned pets (inventory + equipped). This matches the "X/50 owned" UI.
    return this.getOwnedCount(player) + amount <= PET_INVENTORY_CAPACITY;
  }

  canEquipMore(player: Player, amount: number): boolean {
    return this.getEquippedCount(player) + amount <= PET_EQUIP_CAPACITY;
  }

  /**
   * Adds a pet instance to inventory (duplicates allowed).
   * Also tracks discovery for "NEW" tagging.
   */
  addToInventory(player: Player, petId: PetId): { success: boolean; message?: string } {
    const data = this.getPlayerData(player);
    if (!data) return { success: false, message: 'Player data not found' };
    if (!isPetId(petId)) return { success: false, message: 'Invalid pet id' };

    data.petInventory = Array.isArray(data.petInventory) ? data.petInventory : [];
    data.equippedPets = Array.isArray(data.equippedPets) ? data.equippedPets : [];
    data.petDiscovered = Array.isArray(data.petDiscovered) ? data.petDiscovered : [];

    const ownedCount = (data.petInventory.length || 0) + (data.equippedPets.length || 0);
    if (ownedCount >= PET_INVENTORY_CAPACITY) {
      return { success: false, message: `Pet capacity full (${PET_INVENTORY_CAPACITY})` };
    }

    data.petInventory.push(petId);

    if (!data.petDiscovered.includes(petId)) {
      data.petDiscovered.push(petId);
    }

    this.updatePlayerData(player, data);
    return { success: true };
  }

  equipPet(player: Player, petId: PetId): { success: boolean; message?: string } {
    const data = this.getPlayerData(player);
    if (!data) return { success: false, message: 'Player data not found' };
    if (!isPetId(petId)) return { success: false, message: 'Invalid pet id' };

    data.petInventory = Array.isArray(data.petInventory) ? data.petInventory : [];
    data.equippedPets = Array.isArray(data.equippedPets) ? data.equippedPets : [];

    if (data.equippedPets.length >= PET_EQUIP_CAPACITY) {
      return { success: false, message: `Equip limit reached (${PET_EQUIP_CAPACITY})` };
    }

    const idx = data.petInventory.indexOf(petId);
    if (idx === -1) {
      return { success: false, message: 'You do not own this pet (in inventory)' };
    }

    // Move one instance inventory -> equipped
    data.petInventory.splice(idx, 1);
    data.equippedPets.push(petId);

    this.updatePlayerData(player, data);
    return { success: true };
  }

  /**
   * Equip a specific inventory slot (supports duplicates reliably).
   */
  equipFromInventoryIndex(player: Player, inventoryIndex: number): { success: boolean; message?: string; petId?: PetId } {
    const data = this.getPlayerData(player);
    if (!data) return { success: false, message: 'Player data not found' };

    data.petInventory = Array.isArray(data.petInventory) ? data.petInventory : [];
    data.equippedPets = Array.isArray(data.equippedPets) ? data.equippedPets : [];

    if (data.equippedPets.length >= PET_EQUIP_CAPACITY) {
      return { success: false, message: `Equip limit reached (${PET_EQUIP_CAPACITY})` };
    }

    if (inventoryIndex < 0 || inventoryIndex >= data.petInventory.length) {
      return { success: false, message: 'Invalid inventory slot' };
    }

    const petId = data.petInventory[inventoryIndex];
    if (!isPetId(petId)) return { success: false, message: 'Invalid pet id' };

    data.petInventory.splice(inventoryIndex, 1);
    data.equippedPets.push(petId);
    this.updatePlayerData(player, data);
    return { success: true, petId };
  }

  unequipPet(player: Player, petId: PetId): { success: boolean; message?: string } {
    const data = this.getPlayerData(player);
    if (!data) return { success: false, message: 'Player data not found' };
    if (!isPetId(petId)) return { success: false, message: 'Invalid pet id' };

    data.petInventory = Array.isArray(data.petInventory) ? data.petInventory : [];
    data.equippedPets = Array.isArray(data.equippedPets) ? data.equippedPets : [];

    const idx = data.equippedPets.indexOf(petId);
    if (idx === -1) {
      return { success: false, message: 'That pet is not equipped' };
    }

    // Move one instance equipped -> inventory
    data.equippedPets.splice(idx, 1);
    data.petInventory.push(petId);

    this.updatePlayerData(player, data);
    return { success: true };
  }

  /**
   * Unequip a specific equipped slot (supports duplicates reliably).
   */
  unequipFromEquippedIndex(player: Player, equippedIndex: number): { success: boolean; message?: string; petId?: PetId } {
    const data = this.getPlayerData(player);
    if (!data) return { success: false, message: 'Player data not found' };

    data.petInventory = Array.isArray(data.petInventory) ? data.petInventory : [];
    data.equippedPets = Array.isArray(data.equippedPets) ? data.equippedPets : [];

    if (equippedIndex < 0 || equippedIndex >= data.equippedPets.length) {
      return { success: false, message: 'Invalid equipped slot' };
    }

    const petId = data.equippedPets[equippedIndex];
    if (!isPetId(petId)) return { success: false, message: 'Invalid pet id' };

    data.equippedPets.splice(equippedIndex, 1);
    data.petInventory.push(petId);
    this.updatePlayerData(player, data);
    return { success: true, petId };
  }

  /**
   * Delete pet instances from the player's inventory by inventory indices.
   * - Only deletes from inventory (never touches equipped).
   * - Sorts indices descending so deletes don't shift remaining indices.
   * - Designed to support duplicates (each slot is an instance).
   */
  deleteFromInventoryIndices(player: Player, inventoryIndices: number[]): { success: boolean; message?: string; deletedCount?: number } {
    const data = this.getPlayerData(player);
    if (!data) return { success: false, message: 'Player data not found' };

    data.petInventory = Array.isArray(data.petInventory) ? data.petInventory : [];
    data.equippedPets = Array.isArray(data.equippedPets) ? data.equippedPets : [];

    if (!Array.isArray(inventoryIndices) || inventoryIndices.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Validate + dedupe + sort descending
    const unique = Array.from(
      new Set(
        inventoryIndices
          .map((n) => Number(n))
          .filter((n) => Number.isFinite(n) && n >= 0)
          .map((n) => Math.floor(n))
      )
    ).sort((a, b) => b - a);

    let deleted = 0;
    for (const idx of unique) {
      if (idx < 0 || idx >= data.petInventory.length) continue;
      data.petInventory.splice(idx, 1);
      deleted++;
    }

    this.updatePlayerData(player, data);
    return { success: true, deletedCount: deleted };
  }

  /**
   * Sum of multipliers across equipped pets.
   * Note: if you have 0 equipped pets, this returns 0.
   */
  getEquippedMultiplierSum(player: Player): number {
    const equipped = this.getEquipped(player);
    let sum = 0;
    for (const petId of equipped) {
      const def = getPetDefinition(petId);
      if (!def) continue;
      sum += def.multiplier;
    }
    return sum;
  }

  /**
   * Effective training multiplier for formula:
   *   finalGain = baseGain * sumMultipliers
   *
   * We treat "no pets equipped" as 1x so players can still gain power.
   */
  getTrainingMultiplierSum(player: Player): number {
    const sum = this.getEquippedMultiplierSum(player);
    return Math.max(1, sum);
  }

  /**
   * Unequip all pets (moves equipped -> inventory).
   * Total owned count does not change, so capacity is always respected.
   */
  unequipAll(player: Player): { success: boolean; message?: string } {
    const data = this.getPlayerData(player);
    if (!data) return { success: false, message: 'Player data not found' };

    data.petInventory = Array.isArray(data.petInventory) ? data.petInventory : [];
    data.equippedPets = Array.isArray(data.equippedPets) ? data.equippedPets : [];

    if (data.equippedPets.length === 0) {
      return { success: true };
    }

    data.petInventory.push(...data.equippedPets);
    data.equippedPets = [];
    this.updatePlayerData(player, data);
    return { success: true };
  }

  /**
   * Equip best pets by multiplier (highest first), up to PET_EQUIP_CAPACITY.
   * Preserves duplicates by treating each entry as a unique instance.
   */
  equipBest(player: Player): { success: boolean; message?: string } {
    const data = this.getPlayerData(player);
    if (!data) return { success: false, message: 'Player data not found' };

    data.petInventory = Array.isArray(data.petInventory) ? data.petInventory : [];
    data.equippedPets = Array.isArray(data.equippedPets) ? data.equippedPets : [];

    const allOwned = [...data.petInventory, ...data.equippedPets].filter(isPetId) as PetId[];
    if (allOwned.length === 0) {
      data.petInventory = [];
      data.equippedPets = [];
      this.updatePlayerData(player, data);
      return { success: true };
    }

    allOwned.sort((a, b) => {
      const ma = getPetDefinition(a)?.multiplier ?? 0;
      const mb = getPetDefinition(b)?.multiplier ?? 0;
      return mb - ma;
    });

    data.equippedPets = allOwned.slice(0, PET_EQUIP_CAPACITY);
    data.petInventory = allOwned.slice(PET_EQUIP_CAPACITY);
    this.updatePlayerData(player, data);
    return { success: true };
  }
}


