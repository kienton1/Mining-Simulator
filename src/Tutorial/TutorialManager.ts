import { Player, SceneUI, World } from 'hytopia';
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
};

type TutorialUIUpdate = {
  visible: boolean;
  phase: TutorialPhase | null;
  title: string;
  body: string;
  progressCurrent?: number;
  progressTotal?: number;
  cta?: string;
  rewardText?: string;
  highlightAction?: string;
  completed?: boolean;
  showSkip?: boolean;
};

type MarkerTarget = {
  position: { x: number; y: number; z: number };
  title: string;
  subtitle?: string;
  kind?: string;
};

export class TutorialManager {
  private world: World;
  private game: TutorialGameContext;
  private playerProgress: Map<Player, TutorialProgress> = new Map();
  private uiReady: Map<Player, boolean> = new Map();
  private pendingUI: Map<Player, TutorialUIUpdate> = new Map();
  private playerMarkers: Map<Player, SceneUI> = new Map();

  constructor(world: World, game: TutorialGameContext) {
    this.world = world;
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
    this.updateMarker(player);
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
    this.updateMarker(player);
  }

  cleanupPlayer(player: Player): void {
    this.uiReady.delete(player);
    this.pendingUI.delete(player);
    this.playerProgress.delete(player);
    const marker = this.playerMarkers.get(player);
    if (marker) {
      marker.unload();
      this.playerMarkers.delete(player);
    }
  }

  skipTutorial(player: Player): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed) return;
    progress.phase = TutorialPhase.COMPLETE;
    progress.completed = true;
    progress.skipped = true;
    this.setProgress(player, progress);
    this.sendUI(player, { visible: false, phase: TutorialPhase.COMPLETE, title: '', body: '' });
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
      this.advanceTo(player, TutorialPhase.PET_SHOP);
    }
  }

  onEggModalOpened(player: Player): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase === TutorialPhase.PET_SHOP) {
      this.advanceTo(player, TutorialPhase.HATCH_PET);
    }
  }

  onEggHatched(player: Player): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase === TutorialPhase.HATCH_PET) {
      this.advanceTo(player, TutorialPhase.EQUIP_PET);
    }
  }

  onPetEquipped(player: Player): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed) return;
    if (progress.phase === TutorialPhase.EQUIP_PET) {
      this.advanceTo(player, TutorialPhase.COMPLETE);
    }
  }

  onWorldChanged(player: Player): void {
    this.updateMarker(player);
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
      return {
        phase: Object.values(TutorialPhase).includes(saved.phase)
          ? saved.phase
          : DEFAULT_TUTORIAL_PROGRESS.phase,
        miningCount: typeof saved.miningCount === 'number' ? Math.max(0, saved.miningCount) : 0,
        completed: Boolean(saved.completed),
        skipped: Boolean(saved.skipped),
        rewardGranted: Boolean(saved.rewardGranted),
        rewardAmount: typeof saved.rewardAmount === 'number' ? saved.rewardAmount : 0,
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

    if (nextPhase === TutorialPhase.PET_SHOP) {
      this.maybeGrantPetReward(player, progress);
    }

    if (nextPhase === TutorialPhase.COMPLETE) {
      progress.completed = true;
    }

    this.setProgress(player, progress);

    if (nextPhase === TutorialPhase.COMPLETE) {
      setTimeout(() => {
        this.sendUI(player, { visible: false, phase: TutorialPhase.COMPLETE, title: '', body: '' });
      }, 4000);
    }
  }

  private setProgress(player: Player, progress: TutorialProgress): void {
    this.playerProgress.set(player, { ...progress });
    this.persistProgress(player);
    this.pushUpdate(player);
    this.updateMarker(player);
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
        title: '',
        body: '',
        completed: true,
        showSkip: false,
      };
    }

    if (progress.completed || progress.phase === TutorialPhase.COMPLETE) {
      return {
        visible: true,
        phase: TutorialPhase.COMPLETE,
        title: 'Tutorial Complete!',
        body: 'You are all set. Good luck in the mines!',
        completed: true,
        showSkip: false,
      };
    }

    const phaseIndex = this.getPhaseIndex(progress.phase);
    const totalPhases = 7;
    const base = {
      visible: true,
      phase: progress.phase,
      title: `Tutorial ${phaseIndex}/${totalPhases}`,
      body: '',
      showSkip: true,
    } as TutorialUIUpdate;

    switch (progress.phase) {
      case TutorialPhase.GET_TO_MINES:
        base.body = 'Head to the mine entrance and drop in.';
        base.cta = 'Follow the marker';
        break;
      case TutorialPhase.MINE_ORES:
        base.body = 'Mine 5 ores to fill your bag.';
        base.progressCurrent = progress.miningCount;
        base.progressTotal = TUTORIAL_MINING_TARGET;
        base.cta = 'Tap/click to mine';
        break;
      case TutorialPhase.SELL_ORES:
        base.body = 'Find the Ore Seller and sell at least 1 ore.';
        base.cta = 'Sell an ore';
        base.highlightAction = 'surface';
        break;
      case TutorialPhase.TRAINING:
        base.body = 'Train at a rock to gain Power.';
        base.cta = 'Hold E / tap to train';
        break;
      case TutorialPhase.PET_SHOP: {
        base.body = 'Go to the Egg Station to open pets.';
        base.cta = 'Open the Egg Station';
        if ((progress.rewardAmount ?? 0) > 0) {
          base.rewardText = `Tutorial Reward: +${progress.rewardAmount} Gold`;
        }
        break;
      }
      case TutorialPhase.HATCH_PET:
        base.body = 'Hatch your first pet by opening 1 egg.';
        base.cta = 'Open 1 egg';
        break;
      case TutorialPhase.EQUIP_PET:
        base.body = 'Open the Pets menu and equip your new pet.';
        base.cta = 'Tap Pets';
        base.highlightAction = 'pets';
        break;
      default:
        base.body = 'Keep going!';
        break;
    }

    return base;
  }

  private getPhaseIndex(phase: TutorialPhase): number {
    const order: TutorialPhase[] = [
      TutorialPhase.GET_TO_MINES,
      TutorialPhase.MINE_ORES,
      TutorialPhase.SELL_ORES,
      TutorialPhase.TRAINING,
      TutorialPhase.PET_SHOP,
      TutorialPhase.HATCH_PET,
      TutorialPhase.EQUIP_PET,
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

  private updateMarker(player: Player): void {
    const progress = this.getProgress(player);
    if (!progress || progress.completed || progress.phase === TutorialPhase.COMPLETE) {
      this.hideMarker(player);
      return;
    }

    const target = this.getMarkerTarget(player, progress.phase);
    if (!target) {
      this.hideMarker(player);
      return;
    }

    this.showMarker(player, target);
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
      case TutorialPhase.PET_SHOP:
      case TutorialPhase.HATCH_PET: {
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

  private showMarker(player: Player, target: MarkerTarget): void {
    const playerId = player.id;
    let marker = this.playerMarkers.get(player);
    if (!marker) {
      marker = new SceneUI({
        templateId: 'tutorial:marker',
        viewDistance: 96,
        position: target.position,
        state: {
          title: target.title,
          subtitle: target.subtitle,
          kind: target.kind,
          playerStates: {
            [playerId]: { visible: true },
          },
        },
      });
      marker.load(this.world);
      this.playerMarkers.set(player, marker);
      return;
    }

    marker.setPosition(target.position);
    marker.setState({
      title: target.title,
      subtitle: target.subtitle,
      kind: target.kind,
      playerStates: {
        [playerId]: { visible: true },
      },
    });
  }

  private hideMarker(player: Player): void {
    const marker = this.playerMarkers.get(player);
    if (!marker) return;
    marker.setState({
      playerStates: {
        [player.id]: { visible: false },
      },
    });
  }
}
