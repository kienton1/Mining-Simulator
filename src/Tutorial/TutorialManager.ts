import { Player } from 'hytopia';
import type { PlayerData } from '../Core/PlayerData';
import { WorldRegistry } from '../WorldRegistry';
import {
  ISLAND2_SHARED_MINE_SHAFT,
  ISLAND3_SHARED_MINE_SHAFT,
  SHARED_MINE_SHAFT,
} from '../Core/GameConstants';
import { EGG_STATIONS } from '../Pets/EggStationsConfig';
import type { EggStationDefinition } from '../Pets/EggStationManager';
import type { TrainingController } from '../Surface/Training/TrainingController';
import type { HatchingSystem } from '../Pets/HatchingSystem';
import type { PickaxeShop } from '../Shop/PickaxeShop';
import { getPickaxeByTier } from '../Pickaxe/PickaxeDatabase';
import {
  DEFAULT_TUTORIAL_PROGRESS,
  TutorialPhase,
  type TutorialProgress,
  TUTORIAL_MINING_TARGET,
} from './TutorialTypes';

type TutorialGameContext = {
  getPlayerData(player: Player): PlayerData | undefined;
  updatePlayerData(player: Player, data: PlayerData): void;
  addGold(player: Player, amount: number): void;
  getTrainingController(): TrainingController | undefined;
  getHatchingSystem(): HatchingSystem;
  getPickaxeShop(): PickaxeShop;
};

type TutorialUIUpdate = {
  visible: boolean;
  phase: TutorialPhase | null;
  text: string;
  progressText?: string;
  pointerTarget?: string | null;
  arrowTarget?: { x: number; y: number; z: number } | null;
  completed?: boolean;
};

type MarkerTarget = {
  position: { x: number; y: number; z: number };
  title: string;
  subtitle?: string;
  kind?: string;
};

export class TutorialManager {
  private game: TutorialGameContext;
  private playerProgress: Map<Player, TutorialProgress> = new Map();
  private uiReady: Map<Player, boolean> = new Map();
  private pendingUI: Map<Player, TutorialUIUpdate> = new Map();
  private pendingGoldRewards: Map<Player, number> = new Map();

  constructor(game: TutorialGameContext) {
    this.game = game;
  }

  registerPlayer(player: Player): void {
    const data = this.game.getPlayerData(player);
    const progress = this.resolveProgressFromData(data);
    this.playerProgress.set(player, progress);
  }

  onPlayerDataLoaded(player: Player): void {
    const data = this.game.getPlayerData(player);
    const resolved = this.resolveProgressFromData(data);
    this.playerProgress.set(player, resolved);
    this.persistProgress(player);
    this.pushUpdate(player);
  }

  onPlayerUILoaded(player: Player): void {
    this.uiReady.set(player, true);
    const pending = this.pendingUI.get(player);
    if (pending) {
      this.pendingUI.delete(player);
      this.sendUI(player, pending);
    } else {
      this.pushUpdate(player, true);
    }
    const pendingGold = this.pendingGoldRewards.get(player);
    if (pendingGold) {
      this.pendingGoldRewards.delete(player);
      this.sendGoldRewardUI(player, pendingGold);
    }
  }

  cleanupPlayer(player: Player): void {
    this.uiReady.delete(player);
    this.pendingUI.delete(player);
    this.playerProgress.delete(player);
    this.pendingGoldRewards.delete(player);
  }

  skipTutorial(player: Player): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed) return;
    progress.phase = TutorialPhase.COMPLETE;
    progress.completed = true;
    progress.skipped = true;
    this.setProgress(player, progress);
    this.sendUI(player, { visible: false, phase: TutorialPhase.COMPLETE, text: '' });
  }

  resetTutorial(player: Player): void {
    const progress = { ...DEFAULT_TUTORIAL_PROGRESS };
    this.setProgress(player, progress);
  }

  onEnterMine(player: Player): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase === TutorialPhase.GET_TO_MINES) {
      this.advanceTo(player, TutorialPhase.MINE_ORES);
    }
  }

  onOreMined(player: Player, amount: number): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase !== TutorialPhase.MINE_ORES) return;

    const nextCount = Math.max(0, Math.floor(progress.miningCount + amount));
    progress.miningCount = Math.min(nextCount, TUTORIAL_MINING_TARGET);
    this.setProgress(player, progress);

    if (progress.miningCount >= TUTORIAL_MINING_TARGET) {
      this.advanceTo(player, TutorialPhase.SELL_ORES);
    }
  }

  onOresSold(player: Player, goldEarned: number): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase === TutorialPhase.SELL_ORES && goldEarned > 0) {
      this.advanceTo(player, TutorialPhase.TRAINING);
    }
  }

  onTrainingPowerGain(player: Player): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase === TutorialPhase.TRAINING) {
      this.advanceTo(player, TutorialPhase.BUY_PET);
    }
  }

  onEggHatched(player: Player): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase === TutorialPhase.BUY_PET) {
      this.advanceTo(player, TutorialPhase.EQUIP_PET);
    }
  }

  onPetEquipped(player: Player): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase === TutorialPhase.EQUIP_PET) {
      this.advanceTo(player, TutorialPhase.BUY_PICKAXE);
    }
  }

  onPickaxePurchased(player: Player): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase === TutorialPhase.BUY_PICKAXE) {
      this.advanceTo(player, TutorialPhase.COMPLETE);
    }
  }

  onWorldChanged(player: Player): void {
    this.pushUpdate(player, true);
  }

  private getProgress(player: Player): TutorialProgress | undefined {
    return this.playerProgress.get(player);
  }

  private resolveProgressFromData(data: PlayerData | undefined): TutorialProgress {
    if (!data) {
      return { ...DEFAULT_TUTORIAL_PROGRESS };
    }

    if (data.tutorial && typeof data.tutorial === 'object') {
      const saved = data.tutorial as TutorialProgress;

      // Migrate old pet_shop / hatch_pet phases to buy_pet
      let phase = saved.phase as string;
      if (phase === 'pet_shop' || phase === 'hatch_pet') {
        phase = TutorialPhase.BUY_PET;
      }

      return {
        phase: Object.values(TutorialPhase).includes(phase as TutorialPhase)
          ? (phase as TutorialPhase)
          : DEFAULT_TUTORIAL_PROGRESS.phase,
        miningCount: typeof saved.miningCount === 'number' ? Math.max(0, saved.miningCount) : 0,
        completed: Boolean(saved.completed),
        skipped: Boolean(saved.skipped),
        rewardGranted: Boolean(saved.rewardGranted),
        rewardAmount: typeof saved.rewardAmount === 'number' ? saved.rewardAmount : 0,
        pickaxeRewardGranted: Boolean(saved.pickaxeRewardGranted),
        pickaxeRewardAmount: typeof saved.pickaxeRewardAmount === 'number' ? saved.pickaxeRewardAmount : 0,
        completionShown:
          typeof (saved as TutorialProgress).completionShown === 'boolean'
            ? Boolean((saved as TutorialProgress).completionShown)
            : Boolean(saved.completed),
      };
    }

    if (this.isNewPlayer(data)) {
      return { ...DEFAULT_TUTORIAL_PROGRESS };
    }

    return {
      ...DEFAULT_TUTORIAL_PROGRESS,
      phase: TutorialPhase.COMPLETE,
      completed: true,
      skipped: true,
      completionShown: true,
    };
  }

  private isNewPlayer(data: PlayerData): boolean {
    const powerNum = Number(data.power || '0');
    const hasInventory = Object.values(data.inventory || {}).some((value) => (value ?? 0) > 0);
    const hasPets = (data.petInventory?.length ?? 0) > 0 || (data.equippedPets?.length ?? 0) > 0;
    const hasProgress =
      data.rebirths > 0 ||
      data.wins > 0 ||
      data.gold > 0 ||
      powerNum > 1 ||
      hasInventory ||
      hasPets;
    return !hasProgress;
  }

  private advanceTo(player: Player, nextPhase: TutorialPhase): void {
    const progress = this.getProgress(player);
    if (!progress) return;

    progress.phase = nextPhase;

    if (nextPhase === TutorialPhase.BUY_PET) {
      this.maybeGrantPetReward(player, progress);
    }
    if (nextPhase === TutorialPhase.BUY_PICKAXE) {
      this.maybeGrantPickaxeReward(player, progress);
    }

    if (nextPhase === TutorialPhase.COMPLETE) {
      progress.completed = true;
    }

    this.setProgress(player, progress);

    if (nextPhase === TutorialPhase.COMPLETE) {
      if (!progress.completionShown) {
        setTimeout(() => {
          const latest = this.getProgress(player);
          if (!latest) return;
          latest.completionShown = true;
          this.setProgress(player, latest);
        }, 4000);
      }
    }
  }

  private setProgress(player: Player, progress: TutorialProgress): void {
    this.playerProgress.set(player, { ...progress });
    this.persistProgress(player);
    this.pushUpdate(player);
  }

  private persistProgress(player: Player): void {
    const data = this.game.getPlayerData(player);
    if (!data) return;
    data.tutorial = { ...this.playerProgress.get(player)! };
    this.game.updatePlayerData(player, data);
  }

  private pushUpdate(player: Player, force = false): void {
    const progress = this.getProgress(player);
    if (!progress) return;
    const ui = this.buildUIUpdate(progress);
    ui.arrowTarget = this.getArrowTarget(player, progress.phase);
    if (!this.uiReady.get(player)) {
      this.pendingUI.set(player, ui);
      return;
    }
    if (force) {
      this.sendUI(player, ui);
      return;
    }
    this.sendUI(player, ui);
  }

  private sendUI(player: Player, ui: TutorialUIUpdate): void {
    if (!this.uiReady.get(player)) {
      this.pendingUI.set(player, ui);
      return;
    }

    const payload = {
      type: 'TUTORIAL_UPDATE',
      ...ui,
    };
    player.ui.sendData(payload);
  }

  private buildUIUpdate(progress: TutorialProgress): TutorialUIUpdate {
    if (progress.skipped) {
      return {
        visible: false,
        phase: TutorialPhase.COMPLETE,
        text: '',
        completed: true,
      };
    }

    if (progress.completed || progress.phase === TutorialPhase.COMPLETE) {
      return {
        visible: false,
        phase: TutorialPhase.COMPLETE,
        text: '',
        completed: true,
      };
    }

    switch (progress.phase) {
      case TutorialPhase.GET_TO_MINES:
        return {
          visible: true,
          phase: progress.phase,
          text: 'Go to the mine!',
          pointerTarget: null,
        };
      case TutorialPhase.MINE_ORES:
        return {
          visible: true,
          phase: progress.phase,
          text: `Mine 5 ore! (${progress.miningCount}/${TUTORIAL_MINING_TARGET})`,
          progressText: `${progress.miningCount}/${TUTORIAL_MINING_TARGET}`,
          pointerTarget: null,
        };
      case TutorialPhase.SELL_ORES:
        return {
          visible: true,
          phase: progress.phase,
          text: 'Sell your ore!',
          pointerTarget: 'to-surface-button',
        };
      case TutorialPhase.TRAINING:
        return {
          visible: true,
          phase: progress.phase,
          text: 'Improve your power!',
          pointerTarget: null,
        };
      case TutorialPhase.BUY_PET:
        return {
          visible: true,
          phase: progress.phase,
          text: 'Buy a pet!',
          pointerTarget: null,
        };
      case TutorialPhase.EQUIP_PET:
        return {
          visible: true,
          phase: progress.phase,
          text: 'Equip your pet!',
          pointerTarget: 'pets-button',
        };
      case TutorialPhase.BUY_PICKAXE:
        return {
          visible: true,
          phase: progress.phase,
          text: 'Upgrade your pickaxe!',
          pointerTarget: 'pickaxe-button',
        };
      default:
        return {
          visible: true,
          phase: progress.phase,
          text: 'Keep going!',
          pointerTarget: null,
        };
    }
  }

  private getArrowTarget(player: Player, phase: TutorialPhase): { x: number; y: number; z: number } | null {
    if (!this.shouldShowArrow(phase)) return null;
    const target = this.getMarkerTarget(player, phase);
    return target ? { x: target.position.x, y: 1, z: target.position.z } : null;
  }

  private shouldShowArrow(phase: TutorialPhase): boolean {
    switch (phase) {
      case TutorialPhase.GET_TO_MINES:
      case TutorialPhase.SELL_ORES:
      case TutorialPhase.TRAINING:
      case TutorialPhase.BUY_PET:
        return true;
      default:
        return false;
    }
  }

  private getPhaseIndex(phase: TutorialPhase): number {
    const order: TutorialPhase[] = [
      TutorialPhase.GET_TO_MINES,
      TutorialPhase.MINE_ORES,
      TutorialPhase.SELL_ORES,
      TutorialPhase.TRAINING,
      TutorialPhase.BUY_PET,
      TutorialPhase.EQUIP_PET,
      TutorialPhase.BUY_PICKAXE,
    ];
    const idx = order.indexOf(phase);
    return idx >= 0 ? idx + 1 : 1;
  }

  private maybeGrantPetReward(player: Player, progress: TutorialProgress): void {
    if (progress.rewardGranted) return;

    const playerData = this.game.getPlayerData(player);
    if (!playerData) return;

    const station = this.getCheapestEggStation(playerData.currentWorld || 'island1');
    const cost = station ? this.game.getHatchingSystem().getEggCostGold(station.eggType) : 10;
    const needed = Math.max(0, cost - (playerData.gold || 0));

    if (needed > 0) {
      this.game.addGold(player, needed);
    }

    progress.rewardGranted = true;
    progress.rewardAmount = needed;
  }

  private maybeGrantPickaxeReward(player: Player, progress: TutorialProgress): void {
    if (progress.pickaxeRewardGranted) return;

    const playerData = this.game.getPlayerData(player);
    if (!playerData) return;

    const shop = this.game.getPickaxeShop();
    const nextTier = shop.getNextAvailableTier(player);
    if (nextTier === null) {
      progress.pickaxeRewardGranted = true;
      progress.pickaxeRewardAmount = 0;
      return;
    }

    const pickaxe = getPickaxeByTier(nextTier);
    const cost = pickaxe?.cost ?? 0;
    const currentGold = playerData.gold || 0;
    const needed = Math.max(0, cost - currentGold);
    const reward = Math.max(50, needed);

    if (reward > 0) {
      this.game.addGold(player, reward);
      this.sendGoldRewardUI(player, reward);
    }

    progress.pickaxeRewardGranted = true;
    progress.pickaxeRewardAmount = reward;
  }

  private sendGoldRewardUI(player: Player, amount: number): void {
    if (!amount || amount <= 0) return;
    if (!this.uiReady.get(player)) {
      this.pendingGoldRewards.set(player, amount);
      return;
    }
    player.ui.sendData({ type: 'TUTORIAL_GOLD_REWARD', amount });
  }

  private getMarkerTarget(player: Player, phase: TutorialPhase): MarkerTarget | null {
    const playerData = this.game.getPlayerData(player);
    const worldId = playerData?.currentWorld || 'island1';

    switch (phase) {
      case TutorialPhase.GET_TO_MINES: {
        const pos = this.getMineEntrancePosition(worldId);
        return {
          position: pos,
          title: 'Mine Entrance',
          subtitle: 'Drop in to start mining',
          kind: 'mine',
        };
      }
      case TutorialPhase.SELL_ORES: {
        const worldConfig = WorldRegistry.getWorldConfig(worldId);
        const npc = worldConfig?.npcs?.merchant;
        if (!npc) return null;
        return {
          position: { x: npc.x, y: npc.y + 2, z: npc.z },
          title: 'Ore Seller',
          subtitle: 'Sell your ores here',
          kind: 'shop',
        };
      }
      case TutorialPhase.TRAINING: {
        const training = this.game.getTrainingController();
        const rock = training?.findBestAccessibleTrainingRock(player);
        if (!rock) return null;
        return {
          position: { x: rock.position.x, y: rock.position.y + 2, z: rock.position.z },
          title: rock.rockData.name || 'Training Rock',
          subtitle: 'Train to gain power',
          kind: 'training',
        };
      }
      case TutorialPhase.BUY_PET: {
        const station = this.getCheapestEggStation(worldId);
        if (!station) return null;
        return {
          position: { x: station.position.x, y: station.position.y + 2.4, z: station.position.z },
          title: station.name || 'Egg Station',
          subtitle: 'Open eggs here',
          kind: 'egg',
        };
      }
      default:
        return null;
    }
  }

  private getMineEntrancePosition(worldId: string): { x: number; y: number; z: number } {
    const shaft = worldId === 'island2'
      ? ISLAND2_SHARED_MINE_SHAFT
      : worldId === 'island3'
        ? ISLAND3_SHARED_MINE_SHAFT
        : SHARED_MINE_SHAFT;
    const bounds = shaft.bounds;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    return { x: centerX, y: shaft.topY + 2, z: centerZ };
  }

  private getCheapestEggStation(worldId: string): EggStationDefinition | null {
    const stations = EGG_STATIONS.filter((station) => station.worldId === worldId);
    if (stations.length === 0) return null;
    const hatching = this.game.getHatchingSystem();
    let cheapest = stations[0];
    let cheapestCost = hatching.getEggCostGold(cheapest.eggType);
    for (const station of stations) {
      const cost = hatching.getEggCostGold(station.eggType);
      if (cost < cheapestCost) {
        cheapest = station;
        cheapestCost = cost;
      }
    }
    return cheapest;
  }
}
