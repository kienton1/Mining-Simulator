export enum TutorialPhase {
  GET_TO_MINES = 'get_to_mines',
  MINE_ORES = 'mine_ores',
  SELL_ORES = 'sell_ores',
  TRAINING = 'training',
  PET_SHOP = 'pet_shop',
  HATCH_PET = 'hatch_pet',
  EQUIP_PET = 'equip_pet',
  COMPLETE = 'complete',
}

export interface TutorialProgress {
  phase: TutorialPhase;
  miningCount: number;
  completed: boolean;
  skipped?: boolean;
  rewardGranted?: boolean;
  rewardAmount?: number;
}

export const DEFAULT_TUTORIAL_PROGRESS: TutorialProgress = {
  phase: TutorialPhase.GET_TO_MINES,
  miningCount: 0,
  completed: false,
  skipped: false,
  rewardGranted: false,
  rewardAmount: 0,
};

export const TUTORIAL_MINING_TARGET = 5;
