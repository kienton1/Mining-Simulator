import type { Player } from 'hytopia';
import { EggType } from '../Pets/PetData';
import { EGG_DEFINITIONS } from '../Pets/PetDatabase';
import { ISLAND2_SHARED_MINE_SHAFT, ISLAND3_SHARED_MINE_SHAFT, SHARED_MINE_SHAFT } from '../Core/GameConstants';
import type { GameManager } from '../Core/GameManager';
import type { PlayerData } from '../Core/PlayerData';
import { createCompletedTutorialProgress, createDefaultTutorialProgress, type TutorialProgress, type TutorialPhase } from './TutorialTypes';

type Vector3 = { x: number; y: number; z: number };

export type TutorialLocations = {
  merchants?: Record<string, Vector3>;
  eggStations?: Record<string, Vector3>;
};

type TutorialUiPayload = {
  visible: boolean;
  phase?: TutorialPhase;
  title?: string;
  description?: string;
  progressText?: string;
  progressCurrent?: number;
  progressTotal?: number;
  targetWorldPos?: Vector3 | null;
};

export class TutorialManager {
  private gameManager: GameManager;
  private locations: TutorialLocations = {};

  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;
  }

  setLocations(locations: TutorialLocations): void {
    this.locations = locations;
  }

  initializePlayer(player: Player): void {
    const data = this.gameManager.getPlayerData(player);
    if (!data || data.tutorial) return;

    const isNewPlayer = this.isLikelyNewPlayer(data);
    data.tutorial = isNewPlayer ? createDefaultTutorialProgress() : createCompletedTutorialProgress();
    this.gameManager.updatePlayerData(player, data);
  }

  ensureProgress(player: Player): TutorialProgress | null {
    const data = this.gameManager.getPlayerData(player);
    if (!data) return null;
    if (!data.tutorial) {
      this.initializePlayer(player);
    }
    return data.tutorial;
  }

  sendState(player: Player): void {
    const data = this.gameManager.getPlayerData(player);
    const progress = data?.tutorial;
    if (!data || !progress) {
      return;
    }

    if (progress.completed || progress.phase === 'complete') {
      player.ui.sendData({ type: 'TUTORIAL_STATE', visible: false } as TutorialUiPayload);
      return;
    }

    const payload = this.getUiPayload(player, data, progress);
    player.ui.sendData({ type: 'TUTORIAL_STATE', ...payload });
  }

  handleEnteredMine(player: Player): void {
    const progress = this.ensureProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase === 'enter_mine') {
      progress.phase = 'mine_ores';
      this.commitProgress(player, progress);
    }
  }

  handleOreMined(player: Player, amount: number): void {
    const progress = this.ensureProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase !== 'mine_ores') return;

    progress.minedOres += Math.max(0, amount);
    if (progress.minedOres >= 5) {
      progress.phase = 'sell_ores';
    }
    this.commitProgress(player, progress);
  }

  handleOreSold(player: Player, goldEarned: number): void {
    const progress = this.ensureProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase !== 'sell_ores') return;
    if (goldEarned <= 0) return;

    progress.soldOres = Math.max(progress.soldOres, 1);
    progress.phase = 'training';
    this.commitProgress(player, progress);
  }

  handleTrainingHit(player: Player): void {
    const progress = this.ensureProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase !== 'training') return;

    progress.trainedOnce = true;
    progress.phase = 'pet_acquire';
    this.commitProgress(player, progress);
    this.grantPetGold(player);
  }

  handleEggStationEntered(player: Player): void {
    const progress = this.ensureProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase !== 'pet_acquire') return;

    progress.phase = 'pet_hatch';
    this.commitProgress(player, progress);
  }

  handleEggHatch(player: Player): void {
    const progress = this.ensureProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase !== 'pet_acquire' && progress.phase !== 'pet_hatch') return;

    progress.petPurchased = true;
    progress.petHatched = true;
    progress.phase = 'pet_equip';
    this.commitProgress(player, progress);
  }

  handlePetEquipped(player: Player): void {
    const progress = this.ensureProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase !== 'pet_equip') return;

    progress.petEquipped = true;
    progress.phase = 'complete';
    progress.completed = true;
    this.commitProgress(player, progress);
  }

  private commitProgress(player: Player, progress: TutorialProgress): void {
    const data = this.gameManager.getPlayerData(player);
    if (!data) return;
    data.tutorial = progress;
    this.gameManager.updatePlayerData(player, data);
    this.sendState(player);
  }

  private getUiPayload(player: Player, data: PlayerData, progress: TutorialProgress): TutorialUiPayload {
    const payload: TutorialUiPayload = {
      visible: true,
      phase: progress.phase,
      title: '',
      description: '',
      progressText: '',
      progressCurrent: undefined,
      progressTotal: undefined,
      targetWorldPos: null,
    };

    const worldId = data.currentWorld || 'island1';

    switch (progress.phase) {
      case 'enter_mine': {
        payload.title = 'Enter the Mines';
        payload.description = 'Jump into the mine entrance.';
        payload.targetWorldPos = this.getMineEntranceTarget(worldId);
        break;
      }
      case 'mine_ores': {
        payload.title = 'Mine 5 Ores';
        payload.description = 'Break nearby blocks to collect ores.';
        payload.progressCurrent = Math.min(progress.minedOres, 5);
        payload.progressTotal = 5;
        payload.progressText = `${payload.progressCurrent}/5`;
        break;
      }
      case 'sell_ores': {
        payload.title = 'Sell Your Ores';
        payload.description = 'Visit the merchant and sell at least 1 ore.';
        payload.targetWorldPos = this.locations.merchants?.[worldId] ?? null;
        break;
      }
      case 'training': {
        payload.title = 'Train at a Rock';
        payload.description = 'Complete one training hit to gain power.';
        payload.progressCurrent = progress.trainedOnce ? 1 : 0;
        payload.progressTotal = 1;
        payload.progressText = `${payload.progressCurrent}/1`;
        payload.targetWorldPos = this.getTrainingTarget(player);
        break;
      }
      case 'pet_acquire': {
        payload.title = 'Buy Your First Pet';
        payload.description = 'Hatch a Stone Egg at the egg station.';
        payload.targetWorldPos = this.locations.eggStations?.[worldId] ?? null;
        break;
      }
      case 'pet_hatch': {
        payload.title = 'Hatch Your Pet';
        payload.description = 'Open the egg and get your first pet.';
        payload.targetWorldPos = this.locations.eggStations?.[worldId] ?? null;
        break;
      }
      case 'pet_equip': {
        payload.title = 'Equip Your Pet';
        payload.description = 'Open Pets and equip your new pet.';
        break;
      }
      default: {
        payload.visible = false;
        break;
      }
    }

    return payload;
  }

  private getMineEntranceTarget(worldId: string): Vector3 | null {
    const shaft =
      worldId === 'island2' ? ISLAND2_SHARED_MINE_SHAFT :
      worldId === 'island3' ? ISLAND3_SHARED_MINE_SHAFT :
      SHARED_MINE_SHAFT;
    if (!shaft) return null;
    const centerX = (shaft.bounds.minX + shaft.bounds.maxX) / 2;
    const centerZ = (shaft.bounds.minZ + shaft.bounds.maxZ) / 2;
    return { x: centerX, y: shaft.topY + 0.5, z: centerZ };
  }

  private getTrainingTarget(player: Player): Vector3 | null {
    const trainingController = this.gameManager.getTrainingController();
    const rock = trainingController?.findBestAccessibleTrainingRock(player);
    if (!rock) return null;
    return { x: rock.position.x, y: rock.position.y, z: rock.position.z };
  }

  private grantPetGold(player: Player): void {
    const data = this.gameManager.getPlayerData(player);
    if (!data || !data.tutorial || data.tutorial.rewardGranted) return;

    const cost = EGG_DEFINITIONS[EggType.STONE].costGold;
    const missing = Math.max(0, cost - (data.gold ?? 0));
    if (missing > 0) {
      data.gold += missing;
      player.ui.sendData({ type: 'GOLD_STATS', gold: data.gold });
    }
    data.tutorial.rewardGranted = true;
    this.gameManager.updatePlayerData(player, data);
    this.sendState(player);
  }

  private isLikelyNewPlayer(data: PlayerData): boolean {
    const hasGold = (data.gold ?? 0) > 0;
    const hasGems = (data.gems ?? 0) > 0;
    const hasWins = (data.wins ?? 0) > 0;
    const hasRebirths = (data.rebirths ?? 0) > 0;
    const hasPower = data.power !== '1' && data.power !== '0';
    const hasInventory = Object.values(data.inventory ?? {}).some((amount) => (amount ?? 0) > 0);
    const hasPets = (data.petInventory?.length ?? 0) > 0 || (data.equippedPets?.length ?? 0) > 0;
    const hasPickaxeUpgrades = (data.ownedPickaxes?.length ?? 1) > 1 || (data.currentPickaxeTier ?? 0) > 0;
    const hasMiners = (data.ownedMiners?.length ?? 0) > 0 || (data.currentMinerTier ?? -1) >= 0;
    const hasWorldUnlocks = (data.unlockedWorlds?.length ?? 1) > 1;

    return !(
      hasGold ||
      hasGems ||
      hasWins ||
      hasRebirths ||
      hasPower ||
      hasInventory ||
      hasPets ||
      hasPickaxeUpgrades ||
      hasMiners ||
      hasWorldUnlocks
    );
  }
}
