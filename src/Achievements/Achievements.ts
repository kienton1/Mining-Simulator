import type { PlayerData } from '../Core/PlayerData';
import { toBigInt, bigIntToString } from '../Core/BigIntUtils';

export type AchievementCategoryId = 'pickaxe' | 'power' | 'coins' | 'eggs' | 'time';

export type AchievementBonuses = {
  damageMultiplier: number;
  trainingSpeedMultiplier: number;
  coinMultiplier: number;
  hatchSpeedMultiplier: number;
  miningSpeedMultiplier: number;
  petEquipCap: number;
  petInventoryCap: number;
  extraLuckPercent: number;
};

export type AchievementsUIItem = {
  rankIndex: number; // 0-based
  rankLabel: string;
  rewardText: string;
  requirementText: string;
  progressPct: number;
  progressText: string;
  claimed: boolean;
  canClaim: boolean;
};

export type AchievementsUICategory = {
  id: AchievementCategoryId;
  name: string;
  icon: string; // assets path under CDN
  claimableCount: number;
  items: AchievementsUIItem[];
};

const BASE_PET_EQUIP_CAP = 8;
const BASE_PET_INV_CAP = 50;

function roman(n: number): string {
  const map: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let x = Math.max(0, Math.floor(n));
  let out = '';
  for (const [v, s] of map) {
    while (x >= v) {
      out += s;
      x -= v;
    }
  }
  return out || 'I';
}

type BigSuffix = 'K' | 'M' | 'B' | 'T' | 'Qd' | 'Qn' | 'Sx' | 'Sp' | 'Oc' | 'No' | 'De' | 'UDe' | 'DDe' | 'TDe';

const BIG_SUFFIX_EXP: Record<BigSuffix, number> = {
  K: 3,
  M: 6,
  B: 9,
  T: 12,
  Qd: 15,
  Qn: 18,
  Sx: 21,
  Sp: 24,
  Oc: 27,
  No: 30,
  De: 33,
  UDe: 36,
  DDe: 39,
  TDe: 42,
};

function pow10(exp: number): bigint {
  let out = 1n;
  for (let i = 0; i < exp; i++) out *= 10n;
  return out;
}

function parseBigLabel(label: string): bigint {
  const trimmed = String(label || '').trim();
  const m = trimmed.match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]+)?$/);
  if (!m) return 0n;

  const numStr = m[1];
  const parts = numStr.split('.');
  const whole = parts[0] || '0';
  const frac = parts[1] || '';
  const decimals = frac.length;
  const digits = `${whole}${frac}`.replace(/^0+/, '') || '0';
  const num = BigInt(digits);

  const suffixRaw = (m[2] || '') as BigSuffix | '';
  if (!suffixRaw) {
    // No suffix: interpret decimals as plain integer by shifting back.
    if (decimals === 0) return num;
    const div = pow10(decimals);
    return num / div;
  }
  const exp = BIG_SUFFIX_EXP[suffixRaw as BigSuffix];
  if (typeof exp !== 'number') return num;

  // Shift by exp - decimals (e.g. 2.5K => 25 * 10^(3-1) = 2500)
  const shift = exp - decimals;
  if (shift >= 0) {
    return num * pow10(shift);
  }
  // If somehow decimals exceed suffix exponent, floor the result.
  return num / pow10(-shift);
}

type TrackDef = {
  id: AchievementCategoryId;
  name: string;
  icon: string;
  rewardText: string;
  requirementPrefix: string;
  thresholds: Array<{ label: string; value: bigint }>;
};

const TRACKS: TrackDef[] = [
  {
    id: 'pickaxe',
    name: 'Blocks Mined',
    icon: 'icons/HUDIcons/PickaxeIcon.png',
    rewardText: '+2% More Damage',
    requirementPrefix: 'Mine',
    thresholds: [
      '100',
      '500',
      '2.5K', // (UI label only; parsed below)
      '10K',
      '25K',
      '100K',
      '250K',
      '500K',
      '750K',
      '1M',
      '2.5M',
      '5M',
      '7.5M',
      '10M',
    ].map((label) => ({ label, value: parseBigLabel(label) })),
  },
  {
    id: 'power',
    name: 'Power Trained',
    icon: 'icons/HUDIcons/PowerIcon.png',
    rewardText: '+2% Faster Training',
    requirementPrefix: 'Train',
    thresholds: [
      '1K',
      '1M',
      '1B',
      '1T',
      '1Qd',
      '1Qn',
      '1Sx',
      '1Sp',
      '1Oc',
      '1No',
      '1De',
      '1UDe',
      '1DDe',
      '1TDe',
    ].map((label) => ({ label, value: parseBigLabel(label) })),
  },
  {
    id: 'coins',
    name: 'Coins Earned',
    icon: 'icons/HUDIcons/CoinIcon.png',
    rewardText: '+5% Coins',
    requirementPrefix: 'Earn',
    thresholds: [
      '1K',
      '100K',
      '10M',
      '250M',
      '5B',
      '100B',
      '1T',
      '250T',
      '5Qd',
      '1Qn',
      '1Sx',
      '1Sp',
      '1Oc',
      '1No',
      '1De',
      '1UDe',
      '1DDe',
      '1TDe',
    ].map((label) => ({ label, value: parseBigLabel(label) })),
  },
  {
    id: 'eggs',
    name: 'Eggs Hatched',
    icon: 'icons/HUDIcons/EggIcon.png',
    rewardText: '+1% Hatch Speed',
    requirementPrefix: 'Hatch',
    thresholds: [
      '100',
      '250',
      '750',
      '2.5K',
      '10K',
      '25K',
      '75K',
      '200K',
      '350K',
      '500K',
      '800K',
      '1.2M',
      '1.5M',
      '2M',
      '2.5M',
      '5M',
      '7.5M',
      '10M',
    ].map((label) => ({ label, value: parseBigLabel(label) })),
  },
  {
    id: 'time',
    name: 'Time Played',
    // Per request: use Miner icon in the category grid
    icon: 'icons/HUDIcons/MinerIcon.png',
    rewardText: '',
    requirementPrefix: 'Play For',
    thresholds: [
      { label: '1h', value: 1n * 60n * 60n * 1000n },
      { label: '2h', value: 2n * 60n * 60n * 1000n },
      { label: '4h', value: 4n * 60n * 60n * 1000n },
      { label: '6h', value: 6n * 60n * 60n * 1000n },
      { label: '12h', value: 12n * 60n * 60n * 1000n },
      { label: '24h', value: 24n * 60n * 60n * 1000n },
      { label: '3d', value: 3n * 24n * 60n * 60n * 1000n },
      { label: '5d', value: 5n * 24n * 60n * 60n * 1000n },
      { label: '10d', value: 10n * 24n * 60n * 60n * 1000n },
      { label: '30d', value: 30n * 24n * 60n * 60n * 1000n },
    ],
  },
];

function ensureAchievementData(data: PlayerData): void {
  if (!data.achievementProgress) {
    data.achievementProgress = {
      blocksMined: 0,
      powerTrained: '0',
      coinsEarned: '0',
      eggsHatched: 0,
      timePlayedMs: 0,
    };
  }
  if (!data.achievementClaims) {
    data.achievementClaims = {
      blocksMined: 0,
      powerTrained: 0,
      coinsEarned: 0,
      eggsHatched: 0,
      timePlayed: 0,
    };
  }
  // Normalize missing fields
  data.achievementProgress.blocksMined = Math.max(0, Number(data.achievementProgress.blocksMined ?? 0) || 0);
  data.achievementProgress.eggsHatched = Math.max(0, Number(data.achievementProgress.eggsHatched ?? 0) || 0);
  data.achievementProgress.timePlayedMs = Math.max(0, Number(data.achievementProgress.timePlayedMs ?? 0) || 0);
  data.achievementProgress.powerTrained = typeof data.achievementProgress.powerTrained === 'string' ? data.achievementProgress.powerTrained : '0';
  data.achievementProgress.coinsEarned = typeof data.achievementProgress.coinsEarned === 'string' ? data.achievementProgress.coinsEarned : '0';

  data.achievementClaims.blocksMined = Math.max(0, Number(data.achievementClaims.blocksMined ?? 0) || 0);
  data.achievementClaims.powerTrained = Math.max(0, Number(data.achievementClaims.powerTrained ?? 0) || 0);
  data.achievementClaims.coinsEarned = Math.max(0, Number(data.achievementClaims.coinsEarned ?? 0) || 0);
  data.achievementClaims.eggsHatched = Math.max(0, Number(data.achievementClaims.eggsHatched ?? 0) || 0);
  data.achievementClaims.timePlayed = Math.max(0, Number(data.achievementClaims.timePlayed ?? 0) || 0);
}

export function addBlocksMined(data: PlayerData, amount: number): void {
  ensureAchievementData(data);
  data.achievementProgress!.blocksMined = Math.max(0, (data.achievementProgress!.blocksMined ?? 0) + Math.max(0, Math.floor(amount || 0)));
}

export function addEggsHatched(data: PlayerData, amount: number): void {
  ensureAchievementData(data);
  data.achievementProgress!.eggsHatched = Math.max(0, (data.achievementProgress!.eggsHatched ?? 0) + Math.max(0, Math.floor(amount || 0)));
}

export function addTimePlayedMs(data: PlayerData, deltaMs: number): void {
  ensureAchievementData(data);
  data.achievementProgress!.timePlayedMs = Math.max(0, (data.achievementProgress!.timePlayedMs ?? 0) + Math.max(0, Math.floor(deltaMs || 0)));
}

export function addPowerTrained(data: PlayerData, amount: number | string | bigint): void {
  ensureAchievementData(data);
  const cur = toBigInt(data.achievementProgress!.powerTrained || '0');
  const next = cur + toBigInt(amount);
  data.achievementProgress!.powerTrained = bigIntToString(next);
}

export function addCoinsEarned(data: PlayerData, amount: number | string | bigint): void {
  ensureAchievementData(data);
  const cur = toBigInt(data.achievementProgress!.coinsEarned || '0');
  const next = cur + toBigInt(amount);
  data.achievementProgress!.coinsEarned = bigIntToString(next);
}

export function getBonuses(data: PlayerData): AchievementBonuses {
  ensureAchievementData(data);

  const blocksClaimed = data.achievementClaims!.blocksMined ?? 0;
  const powerClaimed = data.achievementClaims!.powerTrained ?? 0;
  const coinsClaimed = data.achievementClaims!.coinsEarned ?? 0;
  const eggsClaimed = data.achievementClaims!.eggsHatched ?? 0;
  const timeClaimed = data.achievementClaims!.timePlayed ?? 0;

  // Blocks mined: +2% damage per claimed rank
  const damagePercent = blocksClaimed * 2;
  // Power trained: +2% training speed per claimed rank
  const trainingPercent = powerClaimed * 2;
  // Coins earned: +5% coins per claimed rank
  const coinsPercentFromCoins = coinsClaimed * 5;
  // Eggs hatched: +1% hatch speed per claimed rank
  const hatchPercentFromEggs = eggsClaimed * 1;

  // Time played rewards (based on the user's list, 1-based ranks):
  // 1: +10% coins
  // 2: +10% hatch speed
  // 3: +1 pet equipped
  // 4: +0.5 luck
  // 5: +10% coins
  // 6: +50 inventory space (pets)
  // 7: +10% mining speed
  // 8: +0.5 luck
  // 9: +10% coins
  // 10: +1 pet equipped
  const timeCoinsCount = (timeClaimed >= 1 ? 1 : 0) + (timeClaimed >= 5 ? 1 : 0) + (timeClaimed >= 9 ? 1 : 0);
  const timeCoinsPercent = timeCoinsCount * 10;
  const timeHatchPercent = timeClaimed >= 2 ? 10 : 0;
  const timeMiningSpeedPercent = timeClaimed >= 7 ? 10 : 0;
  const extraPetEquip = (timeClaimed >= 3 ? 1 : 0) + (timeClaimed >= 10 ? 1 : 0);
  const extraLuckPercent = (timeClaimed >= 4 ? 0.5 : 0) + (timeClaimed >= 8 ? 0.5 : 0);
  const extraPetInventory = timeClaimed >= 6 ? 50 : 0;

  const coinPercent = coinsPercentFromCoins + timeCoinsPercent;
  const hatchPercent = hatchPercentFromEggs + timeHatchPercent;

  return {
    damageMultiplier: 1 + damagePercent / 100,
    trainingSpeedMultiplier: 1 + trainingPercent / 100,
    coinMultiplier: 1 + coinPercent / 100,
    hatchSpeedMultiplier: 1 + hatchPercent / 100,
    miningSpeedMultiplier: 1 + timeMiningSpeedPercent / 100,
    petEquipCap: BASE_PET_EQUIP_CAP + extraPetEquip,
    petInventoryCap: BASE_PET_INV_CAP + extraPetInventory,
    extraLuckPercent,
  };
}

function getProgressValue(data: PlayerData, categoryId: AchievementCategoryId): bigint {
  ensureAchievementData(data);
  switch (categoryId) {
    case 'pickaxe':
      return BigInt(data.achievementProgress!.blocksMined ?? 0);
    case 'power':
      return toBigInt(data.achievementProgress!.powerTrained ?? '0');
    case 'coins':
      return toBigInt(data.achievementProgress!.coinsEarned ?? '0');
    case 'eggs':
      return BigInt(data.achievementProgress!.eggsHatched ?? 0);
    case 'time':
      return BigInt(data.achievementProgress!.timePlayedMs ?? 0);
  }
}

function getClaimedCount(data: PlayerData, categoryId: AchievementCategoryId): number {
  ensureAchievementData(data);
  switch (categoryId) {
    case 'pickaxe':
      return data.achievementClaims!.blocksMined ?? 0;
    case 'power':
      return data.achievementClaims!.powerTrained ?? 0;
    case 'coins':
      return data.achievementClaims!.coinsEarned ?? 0;
    case 'eggs':
      return data.achievementClaims!.eggsHatched ?? 0;
    case 'time':
      return data.achievementClaims!.timePlayed ?? 0;
  }
}

function setClaimedCount(data: PlayerData, categoryId: AchievementCategoryId, nextClaimed: number): void {
  ensureAchievementData(data);
  const v = Math.max(0, Math.floor(nextClaimed || 0));
  switch (categoryId) {
    case 'pickaxe':
      data.achievementClaims!.blocksMined = v;
      return;
    case 'power':
      data.achievementClaims!.powerTrained = v;
      return;
    case 'coins':
      data.achievementClaims!.coinsEarned = v;
      return;
    case 'eggs':
      data.achievementClaims!.eggsHatched = v;
      return;
    case 'time':
      data.achievementClaims!.timePlayed = v;
      return;
  }
}

function timeRewardText(rankIndex: number): string {
  const r = rankIndex + 1;
  if (r === 1) return '+10% Coins';
  if (r === 2) return '+10% Hatch Speed';
  if (r === 3) return '+1 Pet Equipped';
  if (r === 4) return '+0.5 Luck';
  if (r === 5) return '+10% Coins';
  if (r === 6) return '+50 Inventory Space';
  if (r === 7) return '+10% Mining Speed';
  if (r === 8) return '+0.5 Luck';
  if (r === 9) return '+10% Coins';
  if (r === 10) return '+1 Pet Equipped';
  return '';
}

export function buildAchievementsUIState(data: PlayerData): { bonuses: AchievementBonuses; categories: AchievementsUICategory[] } {
  ensureAchievementData(data);
  const bonuses = getBonuses(data);

  const categories: AchievementsUICategory[] = TRACKS.map((track) => {
    const progress = getProgressValue(data, track.id);
    const claimedCount = getClaimedCount(data, track.id);
    let claimableCount = 0;

    const items: AchievementsUIItem[] = track.thresholds.map((t, idx) => {
      const target = t.value;
      const isClaimed = idx < claimedCount;
      const unlocked = progress >= target;
      const canClaim = unlocked && idx === claimedCount; // enforce sequential claiming
      if (canClaim) claimableCount++;

      const pct = target > 0n ? Number((progress * 100n) / target) : 0;
      const pctClamped = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));

      const requirementText =
        track.id === 'time'
          ? `${track.requirementPrefix} ${t.label.replace('h', 'h').replace('d', 'd')}`
          : `${track.requirementPrefix} ${t.label} ${track.id === 'coins' ? 'Coins' : track.id === 'power' ? 'Power' : track.id === 'eggs' ? 'Eggs' : 'Blocks'}`;

      const rewardText = track.id === 'time' ? timeRewardText(idx) : track.rewardText;

      const progressText = canClaim
        ? 'Ready!'
        : isClaimed
          ? 'Claimed'
          : `${pctClamped}%`;

      return {
        rankIndex: idx,
        rankLabel: `Rank ${roman(idx + 1)}`,
        rewardText,
        requirementText,
        progressPct: pctClamped,
        progressText,
        claimed: isClaimed,
        canClaim,
      };
    });

    return {
      id: track.id,
      name: track.name,
      icon: track.icon,
      claimableCount,
      items,
    };
  });

  return { bonuses, categories };
}

export function claimAchievement(data: PlayerData, categoryId: AchievementCategoryId, rankIndex: number): { success: boolean; message?: string } {
  ensureAchievementData(data);
  const track = TRACKS.find((t) => t.id === categoryId);
  if (!track) return { success: false, message: 'Invalid category' };

  const idx = Math.max(0, Math.floor(Number(rankIndex ?? 0)));
  if (idx < 0 || idx >= track.thresholds.length) return { success: false, message: 'Invalid rank' };

  const claimedCount = getClaimedCount(data, categoryId);
  if (idx < claimedCount) return { success: false, message: 'Already claimed' };
  if (idx !== claimedCount) return { success: false, message: 'Claim previous ranks first' };

  const progress = getProgressValue(data, categoryId);
  const target = track.thresholds[idx].value;
  if (progress < target) return { success: false, message: 'Not unlocked yet' };

  setClaimedCount(data, categoryId, claimedCount + 1);
  return { success: true };
}

