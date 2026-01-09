import { MiningState } from '../../Mining/MiningSystem';

export interface WorldContext {
  /** World ID */
  worldId: string;

  /** Current mine state for this world */
  mineState: MiningState | null;

  /** Mine reset upgrade purchased state */
  mineResetUpgradePurchased: boolean;

  /** Current mine timer state */
  mineTimer: {
    remainingSeconds: number;
    isUpgraded: boolean;
  };

  /** Current mine depth */
  currentMineDepth: number;
}
