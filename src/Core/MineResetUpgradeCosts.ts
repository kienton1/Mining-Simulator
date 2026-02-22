/**
 * Shared mine reset upgrade economy by world.
 * Keep this as the single source of truth so UI and purchase validation stay in sync.
 */

export function getMineResetUpgradeCost(worldId: string): number {
  switch (worldId) {
    case 'island1':
      return 2_000_000; // 2M
    case 'island2':
      return 750_000_000_000; // 750B
    case 'island3':
      return 2_000_000_000_000_000; // 2Qn
    case 'island4':
      return 100_000_000_000_000_000_000_000; // 100Sx
    case 'island5':
      return 25_000_000_000_000_000_000_000_000_000; // 25Oc
    default:
      return 2_000_000; // Safe fallback to island1 value
  }
}
