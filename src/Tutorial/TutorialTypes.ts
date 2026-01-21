export type TutorialPhase =
  | 'enter_mine'
  | 'mine_ores'
  | 'sell_ores'
  | 'training'
  | 'pet_acquire'
  | 'pet_hatch'
  | 'pet_equip'
  | 'complete';

export interface TutorialProgress {
  phase: TutorialPhase;
  minedOres: number;
  soldOres: number;
  trainedOnce: boolean;
  petPurchased: boolean;
  petHatched: boolean;
  petEquipped: boolean;
  completed: boolean;
  rewardGranted?: boolean;
}

export function createDefaultTutorialProgress(): TutorialProgress {
  return {
    phase: 'enter_mine',
    minedOres: 0,
    soldOres: 0,
    trainedOnce: false,
    petPurchased: false,
    petHatched: false,
    petEquipped: false,
    completed: false,
    rewardGranted: false,
  };
}

export function createCompletedTutorialProgress(): TutorialProgress {
  return {
    phase: 'complete',
    minedOres: 0,
    soldOres: 0,
    trainedOnce: true,
    petPurchased: true,
    petHatched: true,
    petEquipped: true,
    completed: true,
    rewardGranted: true,
  };
}
