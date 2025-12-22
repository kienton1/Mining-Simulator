/**
 * Pickaxe Database
 * 
 * Contains all pickaxe definitions based on Pickaxe Simulator.
 * Reference: https://www.pickaxesimulator.com/pickaxes
 * 
 * Stats converted:
 * - Coin% → Sell Value Multiplier (+50% = 1.5x, +100% = 2.0x, etc.)
 * - Ore Luck% → Luck Bonus (5% = 0.05)
 * - Speed → Mining Speed (swings per second)
 * - Cost → Purchase cost in coins
 */

import { PickaxeData } from './PickaxeData';

/**
 * Helper to convert coin percentage to sell value multiplier
 * +50% coins = 1.5x multiplier, +100% = 2.0x, etc.
 */
function coinPercentToMultiplier(coinPercent: number): number {
  return 1.0 + (coinPercent / 100);
}

/**
 * Helper to convert luck percentage to decimal
 * 5% = 0.05, 10% = 0.10, etc.
 */
function luckPercentToDecimal(luckPercent: number): number {
  return luckPercent / 100;
}

/**
 * Helper to parse cost strings to numbers
 * "2.5K" = 2500, "1M" = 1,000,000, "5B" = 5,000,000,000, etc.
 */
function parseCost(costStr: string | number): number {
  if (typeof costStr === 'number') return costStr;
  if (costStr === 'Free' || costStr === '0') return 0;
  
  const upper = costStr.toUpperCase().trim();
  
  // Handle UDe (Undecillion) first since it contains "De"
  if (upper.includes('UDE')) {
    const num = parseFloat(upper.replace('UDE', '').replace(/,/g, ''));
    return num * 1e36; // 1 undecillion = 10^36
  }
  
  // Handle other suffixes (check longer suffixes first)
  if (upper.endsWith('DE') && !upper.endsWith('UDE')) {
    const num = parseFloat(upper.replace('DE', '').replace(/,/g, ''));
    return num * 1e33; // 1 decillion = 10^33
  } else if (upper.endsWith('NO')) {
    const num = parseFloat(upper.replace('NO', '').replace(/,/g, ''));
    return num * 1e30; // 1 nonillion = 10^30
  } else if (upper.endsWith('OC')) {
    const num = parseFloat(upper.replace('OC', '').replace(/,/g, ''));
    return num * 1e27; // 1 octillion = 10^27
  } else if (upper.endsWith('SP')) {
    const num = parseFloat(upper.replace('SP', '').replace(/,/g, ''));
    return num * 1e24; // 1 septillion = 10^24
  } else if (upper.endsWith('SX')) {
    const num = parseFloat(upper.replace('SX', '').replace(/,/g, ''));
    return num * 1e21; // 1 sextillion = 10^21
  } else if (upper.endsWith('QN')) {
    const num = parseFloat(upper.replace('QN', '').replace(/,/g, ''));
    return num * 1e18; // 1 quintillion = 10^18
  } else if (upper.endsWith('QD')) {
    const num = parseFloat(upper.replace('QD', '').replace(/,/g, ''));
    return num * 1e15; // 1 quadrillion = 10^15
  } else if (upper.endsWith('Q') && !upper.match(/Q[DN]/)) {
    const num = parseFloat(upper.replace('Q', '').replace(/,/g, ''));
    return num * 1e15; // Legacy Q = quadrillion
  } else if (upper.endsWith('T')) {
    const num = parseFloat(upper.replace('T', '').replace(/,/g, ''));
    return num * 1e12; // 1 trillion = 10^12
  } else if (upper.endsWith('B')) {
    const num = parseFloat(upper.replace('B', '').replace(/,/g, ''));
    return num * 1e9; // 1 billion = 10^9
  } else if (upper.endsWith('M')) {
    const num = parseFloat(upper.replace('M', '').replace(/,/g, ''));
    return num * 1e6; // 1 million = 10^6
  } else if (upper.endsWith('K')) {
    const num = parseFloat(upper.replace('K', '').replace(/,/g, ''));
    return num * 1e3; // 1 thousand = 10^3
  }
  
  return parseFloat(upper.replace(/,/g, '')) || 0;
}

/**
 * Database of all pickaxes in the game
 * Based on Pickaxe Simulator website
 */
export const PICKAXE_DATABASE: PickaxeData[] = [
  // Common Pickaxes (Tier 0-7)
  {
    tier: 0,
    name: 'Wooden',
    miningSpeed: 0, // +0 Speed
    luckBonus: luckPercentToDecimal(0), // +0% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(0), // +0% Coins = 1.0x
    cost: 0, // Free
  },
  {
    tier: 1,
    name: 'Stone',
    miningSpeed: 5, // +5 Speed
    luckBonus: luckPercentToDecimal(1), // +1% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(10), // +10% Coins = 1.1x
    cost: 50,
  },
  {
    tier: 2,
    name: 'Iron',
    miningSpeed: 8, // +8 Speed
    luckBonus: luckPercentToDecimal(1), // +1% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(20), // +20% Coins = 1.2x
    cost: 500,
  },
  {
    tier: 3,
    name: 'Golden',
    miningSpeed: 15, // +15 Speed
    luckBonus: luckPercentToDecimal(1), // +1% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(30), // +30% Coins = 1.3x
    cost: parseCost('2.5K'), // 2.5K
  },
  {
    tier: 4,
    name: 'Diamond',
    miningSpeed: 20, // +20 Speed
    luckBonus: luckPercentToDecimal(5), // +5% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(50), // +50% Coins = 1.5x
    cost: parseCost('10K'), // 10K
  },
  {
    tier: 5,
    name: 'Blossom', // Petal Pickaxe renamed
    miningSpeed: 25, // +25 Speed
    luckBonus: luckPercentToDecimal(5), // +5% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(70), // +70% Coins = 1.7x
    cost: parseCost('40K'), // 40K
  },
  {
    tier: 6,
    name: 'Solarite', // Sunstone Pickaxe renamed
    miningSpeed: 30, // +30 Speed
    luckBonus: luckPercentToDecimal(5), // +5% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(90), // +90% Coins = 1.9x
    cost: parseCost('250K'), // 250K
  },
  {
    tier: 7,
    name: 'Venomstrike', // Toxic Fang renamed
    miningSpeed: 45, // +45 Speed
    luckBonus: luckPercentToDecimal(5), // +5% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(110), // +110% Coins = 2.1x
    cost: parseCost('1M'), // 1M
  },
  
  // Rare Pickaxes (Tier 8-15)
  {
    tier: 8,
    name: 'Aurora Spire', // Solar Spire renamed
    miningSpeed: 60, // +60 Speed
    luckBonus: luckPercentToDecimal(10), // +10% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(130), // +130% Coins = 2.3x
    cost: parseCost('10M'), // 10M
  },
  {
    tier: 9,
    name: 'Frostcore', // Glacier Core renamed
    miningSpeed: 70, // +70 Speed
    luckBonus: luckPercentToDecimal(10), // +10% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(150), // +150% Coins = 2.5x
    cost: parseCost('30M'), // 30M
  },
  {
    tier: 10,
    name: 'Violet Wing', // Amethyst Wing renamed
    miningSpeed: 85, // +85 Speed
    luckBonus: luckPercentToDecimal(10), // +10% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(200), // +200% Coins = 3.0x
    cost: parseCost('150M'), // 150M
  },
  {
    tier: 11,
    name: 'Crystal Breaker', // Gemstone Smasher renamed
    miningSpeed: 100, // +100 Speed
    luckBonus: luckPercentToDecimal(10), // +10% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(250), // +250% Coins = 3.5x
    cost: parseCost('750M'), // 750M
  },
  {
    tier: 12,
    name: 'Quill', // Pencil Pickaxe renamed
    miningSpeed: 120, // +120 Speed
    luckBonus: luckPercentToDecimal(10), // +10% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(300), // +300% Coins = 4.0x
    cost: parseCost('5B'), // 5B
  },
  {
    tier: 13,
    name: 'Demolisher', // Sledgehammer renamed
    miningSpeed: 150, // +150 Speed
    luckBonus: luckPercentToDecimal(10), // +10% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(350), // +350% Coins = 4.5x
    cost: parseCost('25B'), // 25B
  },
  {
    tier: 14,
    name: 'Timber Crusher', // Wood Smasher renamed
    miningSpeed: 170, // +170 Speed
    luckBonus: luckPercentToDecimal(10), // +10% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(400), // +400% Coins = 5.0x
    cost: parseCost('100B'), // 100B
  },
  {
    tier: 15,
    name: 'Jester\'s Mallet', // Clown Hammer renamed
    miningSpeed: 200, // +200 Speed
    luckBonus: luckPercentToDecimal(10), // +10% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(450), // +450% Coins = 5.5x
    cost: parseCost('750B'), // 750B
  },
  
  // Epic Pickaxes (Tier 16-23)
  {
    tier: 16,
    name: 'Glacial Shard', // Ice Cube Pickaxe renamed
    miningSpeed: 300, // +300 Speed
    luckBonus: luckPercentToDecimal(15), // +15% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(500), // +500% Coins = 6.0x
    cost: parseCost('5T'), // 5T
  },
  {
    tier: 17,
    name: 'Shatterblade', // Fragment Pickaxe renamed
    miningSpeed: 400, // +400 Speed
    luckBonus: luckPercentToDecimal(15), // +15% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(600), // +600% Coins = 7.0x
    cost: parseCost('20T'), // 20T
  },
  {
    tier: 18,
    name: 'Voidrend', // Voidpiercer renamed
    miningSpeed: 500, // +500 Speed
    luckBonus: luckPercentToDecimal(15), // +15% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(700), // +700% Coins = 8.0x
    cost: parseCost('75T'), // 75T
  },
  {
    tier: 19,
    name: 'Toxinspike', // Venomspike renamed
    miningSpeed: 600, // +600 Speed
    luckBonus: luckPercentToDecimal(15), // +15% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(800), // +800% Coins = 9.0x
    cost: parseCost('150T'), // 150T
  },
  {
    tier: 20,
    name: 'Bonegrinder', // Skullcrusher renamed
    miningSpeed: 700, // +700 Speed
    luckBonus: luckPercentToDecimal(15), // +15% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(900), // +900% Coins = 10.0x
    cost: parseCost('600T'), // 600T
  },
  {
    tier: 21,
    name: 'Frostbite Shard', // Frostfang Shard renamed
    miningSpeed: 850, // +850 Speed
    luckBonus: luckPercentToDecimal(15), // +15% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(1000), // +1000% Coins = 11.0x
    cost: parseCost('10Qd'), // 10Qd
  },
  {
    tier: 22,
    name: 'Pixel Blade', // Pixel Pickaxe renamed
    miningSpeed: 1000, // +1000 Speed
    luckBonus: luckPercentToDecimal(15), // +15% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(1200), // +1200% Coins = 13.0x
    cost: parseCost('75Qd'), // 75Qd
  },
  {
    tier: 23,
    name: 'Inferno Scythe', // Hell Fire Scythe renamed
    miningSpeed: 1250, // +1250 Speed
    luckBonus: luckPercentToDecimal(15), // +15% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(1500), // +1500% Coins = 16.0x
    cost: parseCost('500Qd'), // 500Qd
  },
  
  // Legendary Pickaxes (Tier 24-31)
  {
    tier: 24,
    name: 'Prybar', // Crowbar renamed
    miningSpeed: 1500, // +1500 Speed
    luckBonus: luckPercentToDecimal(20), // +20% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(2000), // +2000% Coins = 21.0x
    cost: parseCost('2.5Qn'), // 2.5Qn
  },
  {
    tier: 25,
    name: 'Crimson Blade', // Crimson Saber renamed
    miningSpeed: 2000, // +2000 Speed
    luckBonus: luckPercentToDecimal(20), // +20% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(2500), // +2500% Coins = 26.0x
    cost: parseCost('10Qn'), // 10Qn
  },
  {
    tier: 26,
    name: 'Frozen Edge', // Ice Pickaxe renamed
    miningSpeed: 3000, // +3000 Speed
    luckBonus: luckPercentToDecimal(20), // +20% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(3000), // +3000% Coins = 31.0x
    cost: parseCost('25Qn'), // 25Qn
  },
  {
    tier: 27,
    name: 'Skullgrinder Prime', // Skullcrusher Prime renamed
    miningSpeed: 4500, // +4500 Speed
    luckBonus: luckPercentToDecimal(20), // +20% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(3500), // +3500% Coins = 36.0x
    cost: parseCost('75Qn'), // 75Qn
  },
  {
    tier: 28,
    name: 'Gemstone Destroyer', // Gemstone Crusher renamed
    miningSpeed: 7000, // +7000 Speed
    luckBonus: luckPercentToDecimal(20), // +20% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(4500), // +4500% Coins = 46.0x
    cost: parseCost('500Qn'), // 500Qn
  },
  {
    tier: 29,
    name: 'Thornspike', // Sproutspike renamed
    miningSpeed: 10000, // +10000 Speed
    luckBonus: luckPercentToDecimal(20), // +20% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(6000), // +6000% Coins = 61.0x
    cost: parseCost('7.5Sx'), // 7.5Sx
  },
  {
    tier: 30,
    name: 'Frost Cube', // Frost cube renamed
    miningSpeed: 12500, // +12500 Speed
    luckBonus: luckPercentToDecimal(25), // +25% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(7500), // +7500% Coins = 76.0x
    cost: parseCost('500Sx'), // 500Sx
  },
  {
    tier: 31,
    name: 'Twin Flame Scythe', // Twin Fire Scythe renamed
    miningSpeed: 17500, // +17500 Speed
    luckBonus: luckPercentToDecimal(25), // +25% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(9000), // +9000% Coins = 91.0x
    cost: parseCost('1.55Sp'), // 1.55Sp
  },
  
  // Mythic Pickaxes (Tier 32-39)
  {
    tier: 32,
    name: 'Voidrend Prime', // Super Void Piercer renamed
    miningSpeed: 22500, // +22500 Speed
    luckBonus: luckPercentToDecimal(30), // +30% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(12000), // +12000% Coins = 121.0x
    cost: parseCost('5Sp'), // 5Sp
  },
  {
    tier: 33,
    name: 'Toxic Reaper', // Keep original name
    miningSpeed: 30000, // +30000 Speed
    luckBonus: luckPercentToDecimal(30), // +30% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(15000), // +15000% Coins = 151.0x
    cost: parseCost('20Sp'), // 20Sp
  },
  {
    tier: 34,
    name: 'Toxic Pixel', // Keep original name
    miningSpeed: 40000, // +40000 Speed
    luckBonus: luckPercentToDecimal(30), // +30% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(20000), // +20000% Coins = 201.0x
    cost: parseCost('50Sp'), // 50Sp
  },
  {
    tier: 35,
    name: 'Emberhorn Cleaver', // Keep original name
    miningSpeed: 55000, // +55000 Speed
    luckBonus: luckPercentToDecimal(30), // +30% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(25000), // +25000% Coins = 251.0x
    cost: parseCost('375Sp'), // 375Sp
  },
  {
    tier: 36,
    name: 'Crystal Cleaver', // Keep original name
    miningSpeed: 70000, // +70000 Speed
    luckBonus: luckPercentToDecimal(30), // +30% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(35000), // +35000% Coins = 351.0x
    cost: parseCost('2.5Oc'), // 2.5Oc
  },
  {
    tier: 37,
    name: 'Radiant Reaper', // Keep original name
    miningSpeed: 70000, // +70000 Speed (same as Crystal Cleaver)
    luckBonus: luckPercentToDecimal(30), // +30% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(45000), // +45000% Coins = 451.0x
    cost: parseCost('15Oc'), // 15Oc
  },
  {
    tier: 38,
    name: 'Mailbox Pickaxe', // Keep original name
    miningSpeed: 100000, // +100000 Speed
    luckBonus: luckPercentToDecimal(35), // +35% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(67500), // +67500% Coins = 676.0x
    cost: parseCost('17.5Oc'), // 17.5Oc
  },
  {
    tier: 39,
    name: 'Crescent Hammer', // Keep original name
    miningSpeed: 120000, // +120000 Speed
    luckBonus: luckPercentToDecimal(35), // +35% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(85000), // +85000% Coins = 851.0x
    cost: parseCost('75Oc'), // 75Oc
  },
  
  // Exotic Pickaxes (Tier 40-47)
  {
    tier: 40,
    name: 'Stormfury Pickaxe', // Keep original name
    miningSpeed: 140000, // +140000 Speed
    luckBonus: luckPercentToDecimal(35), // +35% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(100000), // +100000% Coins = 1001.0x
    cost: parseCost('350Oc'), // 350Oc
  },
  {
    tier: 41,
    name: 'Skybreaker Pickaxe', // Keep original name
    miningSpeed: 160000, // +160000 Speed
    luckBonus: luckPercentToDecimal(35), // +35% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(120000), // +120000% Coins = 1201.0x
    cost: parseCost('1.5No'), // 1.5No
  },
  {
    tier: 42,
    name: 'Neon Purple Pickaxe', // Keep original name
    miningSpeed: 225000, // +225000 Speed
    luckBonus: luckPercentToDecimal(35), // +35% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(150000), // +150000% Coins = 1501.0x
    cost: parseCost('4No'), // 4No
  },
  {
    tier: 43,
    name: 'Lumina Pickaxe', // Keep original name
    miningSpeed: 275000, // +275000 Speed
    luckBonus: luckPercentToDecimal(35), // +35% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(185000), // +185000% Coins = 1851.0x
    cost: parseCost('15No'), // 15No
  },
  {
    tier: 44,
    name: 'Abyssal Twin Edge', // Keep original name
    miningSpeed: 325000, // +325000 Speed
    luckBonus: luckPercentToDecimal(35), // +35% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(225000), // +225000% Coins = 2251.0x
    cost: parseCost('50No'), // 50No
  },
  {
    tier: 45,
    name: 'Inferno Cleaver', // Keep original name
    miningSpeed: 400000, // +400000 Speed
    luckBonus: luckPercentToDecimal(35), // +35% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(275000), // +275000% Coins = 2751.0x
    cost: parseCost('200No'), // 200No
  },
  {
    tier: 46,
    name: 'Neon Crystal', // Keep original name
    miningSpeed: 500000, // +500000 Speed
    luckBonus: luckPercentToDecimal(40), // +40% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(350000), // +350000% Coins = 3501.0x
    cost: parseCost('25De'), // 25De
  },
  {
    tier: 47,
    name: 'Star Scepter', // Star Septer renamed (fixed spelling)
    miningSpeed: 625000, // +625000 Speed
    luckBonus: luckPercentToDecimal(40), // +40% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(400000), // +400000% Coins = 4001.0x
    cost: parseCost('100De'), // 100De
  },
  
  // Secret Pickaxes (Tier 48-53)
  {
    tier: 48,
    name: 'Ancient Scythe', // Old Scythe renamed
    miningSpeed: 785000, // +785000 Speed
    luckBonus: luckPercentToDecimal(40), // +40% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(450000), // +450000% Coins = 4501.0x
    cost: parseCost('500De'), // 500De
  },
  {
    tier: 49,
    name: 'Plunger', // Keep original name
    miningSpeed: 1000000, // +1000000 Speed
    luckBonus: luckPercentToDecimal(40), // +40% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(500000), // +500000% Coins = 5001.0x
    cost: parseCost('3.5UDe'), // 3.5UDe
  },
  {
    tier: 50,
    name: 'Fire Axe', // Keep original name
    miningSpeed: 1500000, // +1500000 Speed
    luckBonus: luckPercentToDecimal(40), // +40% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(600000), // +600000% Coins = 6001.0x
    cost: parseCost('10UDe'), // 10UDe
  },
  {
    tier: 51,
    name: 'Double Axe', // Keep original name
    miningSpeed: 2000000, // +2000000 Speed
    luckBonus: luckPercentToDecimal(40), // +40% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(700000), // +700000% Coins = 7001.0x
    cost: parseCost('35UDe'), // 35UDe
  },
  {
    tier: 52,
    name: 'Skyforge', // Keep original name
    miningSpeed: 3000000, // +3000000 Speed
    luckBonus: luckPercentToDecimal(40), // +40% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(800000), // +800000% Coins = 8001.0x
    cost: parseCost('100UDe'), // 100UDe
  },
  {
    tier: 53,
    name: 'Thunderstrike', // Keep original name
    miningSpeed: 4000000, // +4000000 Speed
    luckBonus: luckPercentToDecimal(40), // +40% Ore Luck
    sellValueMultiplier: coinPercentToMultiplier(1000000), // +1000000% Coins = 10001.0x
    cost: parseCost('300UDe'), // 300UDe
  },
];

/**
 * Gets a pickaxe by tier
 * 
 * @param tier - Pickaxe tier number
 * @returns Pickaxe data or undefined if tier doesn't exist
 */
export function getPickaxeByTier(tier: number): PickaxeData | undefined {
  return PICKAXE_DATABASE.find(pickaxe => pickaxe.tier === tier);
}

/**
 * Gets the next pickaxe tier (for shop display)
 * 
 * @param currentTier - Current pickaxe tier
 * @returns Next pickaxe data or undefined if at max tier
 */
export function getNextPickaxe(currentTier: number): PickaxeData | undefined {
  return getPickaxeByTier(currentTier + 1);
}

/**
 * Checks if player can afford a pickaxe
 * 
 * @param tier - Pickaxe tier to check
 * @param playerGold - Player's current gold
 * @returns True if player can afford the pickaxe
 */
export function canAffordPickaxe(tier: number, playerGold: number): boolean {
  const pickaxe = getPickaxeByTier(tier);
  if (!pickaxe) return false;
  return playerGold >= pickaxe.cost;
}
