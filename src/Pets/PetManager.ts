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
import { getBasePetIdFromAnyPetId, getNextPetTier, getPetTierFromPetId, isGoldenPetId, makeGoldenPetId, makeUpgradedPetId, PET_MAX_TIER, stripGoldenFromPetId } from './PetUpgrades';
import { getBonuses } from '../Achievements/Achievements';

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

  private getInventoryCap(player: Player): number {
    const data = this.getPlayerData(player);
    if (!data) return PET_INVENTORY_CAPACITY;
    return getBonuses(data).petInventoryCap ?? PET_INVENTORY_CAPACITY;
  }

  private getEquipCap(player: Player): number {
    const data = this.getPlayerData(player);
    if (!data) return PET_EQUIP_CAPACITY;
    return getBonuses(data).petEquipCap ?? PET_EQUIP_CAPACITY;
  }

  hasInventorySpace(player: Player, amount: number): boolean {
    // Capacity is total owned pets (inventory + equipped). This matches the "X/50 owned" UI.
    return this.getOwnedCount(player) + amount <= this.getInventoryCap(player);
  }

  canEquipMore(player: Player, amount: number): boolean {
    return this.getEquippedCount(player) + amount <= this.getEquipCap(player);
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
    const cap = this.getInventoryCap(player);
    if (ownedCount >= cap) {
      return { success: false, message: `Pet capacity full (${cap})` };
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

    const equipCap = this.getEquipCap(player);
    if (data.equippedPets.length >= equipCap) {
      return { success: false, message: `Equip limit reached (${equipCap})` };
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

    const equipCap = this.getEquipCap(player);
    if (data.equippedPets.length >= equipCap) {
      return { success: false, message: `Equip limit reached (${equipCap})` };
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

    const equipCap = this.getEquipCap(player);
    data.equippedPets = allOwned.slice(0, equipCap);
    data.petInventory = allOwned.slice(equipCap);
    this.updatePlayerData(player, data);
    return { success: true };
  }

  /**
   * Craft/upgrade pets by merging 3 identical pet instances into 1 of the next tier.
   *
   * - Counts across BOTH inventory + equipped.
   * - Consumes inventory first, then equipped if needed.
   * - Adds the upgraded pet to inventory.
   *
   * Tier progression:
   *   Normal -> Large -> Huge -> Giga (MAX)
   */
  craftUpgrade(player: Player, petId: PetId): { success: boolean; message?: string; newPetId?: PetId } {
    const data = this.getPlayerData(player);
    if (!data) return { success: false, message: 'Player data not found' };
    if (!isPetId(petId)) return { success: false, message: 'Invalid pet id' };

    const wasGolden = isGoldenPetId(petId);
    const normalized = stripGoldenFromPetId(petId);
    const tier = getPetTierFromPetId(normalized);
    if (tier === null) return { success: false, message: 'Invalid pet id' };
    if (tier >= PET_MAX_TIER) {
      return { success: false, message: 'MAX' };
    }

    const nextTier = getNextPetTier(tier);
    if (nextTier === null) return { success: false, message: 'MAX' };

    data.petInventory = Array.isArray(data.petInventory) ? data.petInventory : [];
    data.equippedPets = Array.isArray(data.equippedPets) ? data.equippedPets : [];
    data.petDiscovered = Array.isArray(data.petDiscovered) ? data.petDiscovered : [];

    const ownedCount = data.petInventory.filter((id) => id === petId).length + data.equippedPets.filter((id) => id === petId).length;
    if (ownedCount < 3) {
      return { success: false, message: 'Not enough pets to craft (need 3)' };
    }

    let toRemove = 3;

    // Remove from inventory first (iterate backwards so indices don't shift)
    for (let i = data.petInventory.length - 1; i >= 0 && toRemove > 0; i--) {
      if (data.petInventory[i] !== petId) continue;
      data.petInventory.splice(i, 1);
      toRemove--;
    }

    // Remove remaining from equipped
    for (let i = data.equippedPets.length - 1; i >= 0 && toRemove > 0; i--) {
      if (data.equippedPets[i] !== petId) continue;
      data.equippedPets.splice(i, 1);
      toRemove--;
    }

    if (toRemove !== 0) {
      // Should never happen if ownedCount check passed, but keep state safe.
      return { success: false, message: 'Failed to craft (internal error)' };
    }

    const basePetId = getBasePetIdFromAnyPetId(normalized);
    const upgradedId = makeUpgradedPetId(basePetId, nextTier);
    const newPetId = wasGolden ? makeGoldenPetId(upgradedId) : upgradedId;
    data.petInventory.push(newPetId);

    if (!data.petDiscovered.includes(newPetId)) {
      data.petDiscovered.push(newPetId);
    }

    this.updatePlayerData(player, data);
    return { success: true, newPetId };
  }

  /**
   * Golden Machine: gamble selected identical pet instances to create a Golden variant.
   *
   * Rules:
   * - Only non-golden pets can be used.
   * - All selected instances must be the exact same PetId (tier included).
   * - Each selected pet contributes +12.5% chance, capped at 100% (max 8 pets).
   * - On failure, all selected pets are destroyed.
   * - On success, all selected pets are destroyed and a pending golden pet reward is created.
   *   The UI claims it after the wheel animation finishes.
   */
  craftGoldenVariant(
    player: Player,
    instanceIds: string[]
  ): {
    success: boolean;
    message?: string;
    rolled?: boolean;
    didWin?: boolean;
    chance?: number;
    inputPetId?: PetId;
    outputPetId?: PetId;
    token?: string;
  } {
    const data = this.getPlayerData(player);
    if (!data) return { success: false, message: 'Player data not found' };

    // Clear any stale pending reward (new craft attempt replaces it).
    if ((data as any).pendingGoldenMachineCraft) {
      (data as any).pendingGoldenMachineCraft = undefined;
    }

    const raw = Array.isArray(instanceIds) ? instanceIds : [];
    const unique = Array.from(new Set(raw.map((s) => String(s || '').trim()).filter(Boolean)));
    if (unique.length === 0) {
      return { success: false, message: 'Select at least 1 pet' };
    }
    if (unique.length > 8) {
      return { success: false, message: 'You can only use up to 8 pets (100% max)' };
    }

    data.petInventory = Array.isArray(data.petInventory) ? data.petInventory : [];
    data.equippedPets = Array.isArray(data.equippedPets) ? data.equippedPets : [];
    data.petDiscovered = Array.isArray(data.petDiscovered) ? data.petDiscovered : [];

    type Parsed = { src: 'inv' | 'eq'; idx: number; instanceId: string };
    const parsed: Parsed[] = [];

    for (const id of unique) {
      const [srcRaw, idxRaw] = id.split(':');
      const src = srcRaw === 'inv' ? 'inv' : srcRaw === 'eq' ? 'eq' : null;
      const idx = Number(idxRaw);
      if (!src || !Number.isFinite(idx)) {
        return { success: false, message: 'Invalid pet selection' };
      }
      if (src === 'eq') {
        return { success: false, message: 'Unequip pets before using the Golden Machine' };
      }
      const intIdx = Math.floor(idx);
      if (intIdx < 0) return { success: false, message: 'Invalid pet selection' };
      parsed.push({ src, idx: intIdx, instanceId: `${src}:${intIdx}` });
    }

    // Resolve selections to actual PetIds and validate they match.
    let inputPetId: PetId | null = null;
    for (const p of parsed) {
      const arr = p.src === 'inv' ? data.petInventory : data.equippedPets;
      if (p.idx < 0 || p.idx >= arr.length) {
        return { success: false, message: 'Selected pet no longer exists' };
      }
      const pid = arr[p.idx];
      if (!isPetId(pid)) {
        return { success: false, message: 'Invalid pet id' };
      }
      if (isGoldenPetId(pid)) {
        return { success: false, message: 'Golden pets cannot be used in the Golden Machine' };
      }
      if (!inputPetId) inputPetId = pid;
      if (pid !== inputPetId) {
        return { success: false, message: 'All selected pets must be the same' };
      }
    }

    if (!inputPetId) {
      return { success: false, message: 'Invalid pet selection' };
    }

    const chance = Math.min(100, unique.length * 12.5);
    const didWin = Math.random() < chance / 100;

    // Delete selected pets (descending indices per array so slots don't shift).
    const invIndices = parsed.filter((p) => p.src === 'inv').map((p) => p.idx);
    const eqIndices = parsed.filter((p) => p.src === 'eq').map((p) => p.idx);

    const deleteDescending = (arr: any[], indices: number[]) => {
      const sorted = Array.from(new Set(indices)).sort((a, b) => b - a);
      for (const idx of sorted) {
        if (idx < 0 || idx >= arr.length) continue;
        arr.splice(idx, 1);
      }
    };

    deleteDescending(data.petInventory, invIndices);
    deleteDescending(data.equippedPets, eqIndices);

    let outputPetId: PetId | undefined;
    let token: string | undefined;
    if (didWin) {
      outputPetId = makeGoldenPetId(inputPetId);
      token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      (data as any).pendingGoldenMachineCraft = {
        token,
        outputPetId,
        expiresAt: Date.now() + 60_000, // 60s to claim after roll
      };
    }

    this.updatePlayerData(player, data);
    return {
      success: true,
      rolled: true,
      didWin,
      chance,
      inputPetId,
      outputPetId,
      token,
    };
  }

  /**
   * Claim a pending Golden Machine reward after the UI finishes the wheel animation.
   */
  claimGoldenVariant(player: Player, token: string): { success: boolean; message?: string; petId?: PetId } {
    const data = this.getPlayerData(player);
    if (!data) return { success: false, message: 'Player data not found' };

    const pending = (data as any).pendingGoldenMachineCraft;
    if (!pending || typeof pending !== 'object') {
      return { success: false, message: 'No pending reward to claim' };
    }

    const now = Date.now();
    if (typeof pending.expiresAt !== 'number' || pending.expiresAt < now) {
      (data as any).pendingGoldenMachineCraft = undefined;
      this.updatePlayerData(player, data);
      return { success: false, message: 'Reward expired' };
    }

    if (String(pending.token) !== String(token)) {
      return { success: false, message: 'Invalid claim token' };
    }

    const petId = String(pending.outputPetId ?? '');
    if (!isPetId(petId)) {
      (data as any).pendingGoldenMachineCraft = undefined;
      this.updatePlayerData(player, data);
      return { success: false, message: 'Invalid reward pet id' };
    }

    data.petInventory = Array.isArray(data.petInventory) ? data.petInventory : [];
    data.petDiscovered = Array.isArray(data.petDiscovered) ? data.petDiscovered : [];

    data.petInventory.push(petId);
    if (!data.petDiscovered.includes(petId)) {
      data.petDiscovered.push(petId);
    }

    (data as any).pendingGoldenMachineCraft = undefined;
    this.updatePlayerData(player, data);
    return { success: true, petId };
  }
}


