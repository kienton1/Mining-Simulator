/**
 * Miner Database
 * 
 * Contains all miner definitions based on MinerSystemPlan.md
 */

import type { MinerData } from './MinerData';

/**
 * Helper to parse cost strings to numbers
 * "2.5K" = 2500, "1M" = 1,000,000, "5B" = 5,000,000,000, etc.
 */
function parseCost(costStr: string | number): number {
  if (typeof costStr === 'number') return costStr;
  if (costStr === 'Free' || costStr === '0') return 0;
  
  const upper = costStr.toUpperCase().trim();
  
  // Handle largest suffixes first (check longer suffixes before shorter ones)
  // TDe (Tredecillion) - 1e42
  if (upper.includes('TDE')) {
    const num = parseFloat(upper.replace('TDE', '').replace(/,/g, ''));
    return num * 1e42;
  }
  
  // DDe (Duodecillion) - 1e39
  if (upper.includes('DDE')) {
    const num = parseFloat(upper.replace('DDE', '').replace(/,/g, ''));
    return num * 1e39;
  }
  
  // UDe (Undecillion) - 1e36
  if (upper.includes('UDE')) {
    const num = parseFloat(upper.replace('UDE', '').replace(/,/g, ''));
    return num * 1e36;
  }
  
  // Handle other suffixes (check longer suffixes first)
  if (upper.endsWith('DE')) {
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
 * Database of all miners in the game
 * Based on Planning/MinerSystemPlan.md
 */
export const MINER_DATABASE: MinerData[] = [
  // Common Miners (Tier 0-4)
  {
    tier: 0,
    name: 'Novice Miner',
    cost: parseCost(250),
    coinBonus: 15,
    oreLuckBonus: 5,
    damageBonus: 10,
    rarity: 'Common',
  },
  {
    tier: 1,
    name: 'Coal Miner',
    cost: parseCost('7.5K'),
    coinBonus: 25,
    oreLuckBonus: 10,
    damageBonus: 20,
    rarity: 'Common',
  },
  {
    tier: 2,
    name: 'Stone Prospector',
    cost: parseCost('500K'),
    coinBonus: 45,
    oreLuckBonus: 15,
    damageBonus: 40,
    rarity: 'Common',
  },
  {
    tier: 3,
    name: 'Iron Digger',
    cost: parseCost('15M'),
    coinBonus: 65,
    oreLuckBonus: 20,
    damageBonus: 70,
    rarity: 'Common',
  },
  {
    tier: 4,
    name: 'Deep Miner',
    cost: parseCost('250M'),
    coinBonus: 90,
    oreLuckBonus: 25,
    damageBonus: 100,
    rarity: 'Common',
  },
  
  // Rare Miners (Tier 5-8)
  {
    tier: 5,
    name: 'Gold Seeker',
    cost: parseCost('30B'),
    coinBonus: 130,
    oreLuckBonus: 30,
    damageBonus: 130,
    rarity: 'Rare',
  },
  {
    tier: 6,
    name: 'Gem Hunter',
    cost: parseCost('5T'),
    coinBonus: 160,
    oreLuckBonus: 40,
    damageBonus: 160,
    rarity: 'Rare',
  },
  {
    tier: 7,
    name: 'Crystal Prospector',
    cost: parseCost('200T'),
    coinBonus: 200,
    oreLuckBonus: 50,
    damageBonus: 200,
    rarity: 'Rare',
  },
  {
    tier: 8,
    name: 'Ore Expert',
    cost: parseCost('20Qd'),
    coinBonus: 300,
    oreLuckBonus: 60,
    damageBonus: 250,
    rarity: 'Rare',
  },
  
  // Epic Miners (Tier 9-12)
  {
    tier: 9,
    name: 'Elite Miner',
    cost: parseCost('2.5Qn'),
    coinBonus: 400,
    oreLuckBonus: 70,
    damageBonus: 300,
    rarity: 'Epic',
  },
  {
    tier: 10,
    name: 'Master Digger',
    cost: parseCost('150Qn'),
    coinBonus: 500,
    oreLuckBonus: 100,
    damageBonus: 400,
    rarity: 'Epic',
  },
  {
    tier: 11,
    name: 'Diamond Specialist',
    cost: parseCost('5Sx'),
    coinBonus: 600,
    oreLuckBonus: 120,
    damageBonus: 500,
    rarity: 'Epic',
  },
  {
    tier: 12,
    name: 'Tunnel Master',
    cost: parseCost('5Sp'),
    coinBonus: 800,
    oreLuckBonus: 140,
    damageBonus: 750,
    rarity: 'Epic',
  },
  
  // Legendary Miners (Tier 13-16)
  {
    tier: 13,
    name: 'Mining Legend',
    cost: parseCost('30Sp'),
    coinBonus: 1000,
    oreLuckBonus: 160,
    damageBonus: 1000,
    rarity: 'Legendary',
  },
  {
    tier: 14,
    name: 'Deep Dweller',
    cost: parseCost('1Oc'),
    coinBonus: 1250,
    oreLuckBonus: 180,
    damageBonus: 1250,
    rarity: 'Legendary',
  },
  {
    tier: 15,
    name: 'Underground King',
    cost: parseCost('125Oc'),
    coinBonus: 1500,
    oreLuckBonus: 200,
    damageBonus: 1500,
    rarity: 'Legendary',
  },
  {
    tier: 16,
    name: 'Ancient Prospector',
    cost: parseCost('5No'),
    coinBonus: 2000,
    oreLuckBonus: 220,
    damageBonus: 2000,
    rarity: 'Legendary',
  },
  
  // Mythic Miners (Tier 17-20)
  {
    tier: 17,
    name: 'Molten Core Walker',
    cost: parseCost('250No'),
    coinBonus: 2500,
    oreLuckBonus: 240,
    damageBonus: 2500,
    rarity: 'Mythic',
  },
  {
    tier: 18,
    name: 'Earth Shaker',
    cost: parseCost('100De'),
    coinBonus: 3000,
    oreLuckBonus: 260,
    damageBonus: 3000,
    rarity: 'Mythic',
  },
  {
    tier: 19,
    name: 'Crystal Guardian',
    cost: parseCost('5UDe'),
    coinBonus: 3500,
    oreLuckBonus: 280,
    damageBonus: 3500,
    rarity: 'Mythic',
  },
  {
    tier: 20,
    name: 'Mine Lord',
    cost: parseCost('250UDe'),
    coinBonus: 4000,
    oreLuckBonus: 300,
    damageBonus: 4000,
    rarity: 'Mythic',
  },
  
  // Exotic Miners (Tier 21-23)
  {
    tier: 21,
    name: 'Depth Strider',
    cost: parseCost('25DDe'),
    coinBonus: 4500,
    oreLuckBonus: 320,
    damageBonus: 4500,
    rarity: 'Exotic',
  },
  {
    tier: 22,
    name: 'Master of Depths',
    cost: parseCost('2.5TDe'),
    coinBonus: 5000,
    oreLuckBonus: 340,
    damageBonus: 5000,
    rarity: 'Exotic',
  },
  {
    tier: 23,
    name: 'Eternal Miner',
    cost: parseCost('375TDe'),
    coinBonus: 5500,
    oreLuckBonus: 360,
    damageBonus: 5500,
    rarity: 'Exotic',
  },
];

/**
 * Gets a miner by tier
 * 
 * @param tier - Miner tier (0-23)
 * @returns Miner data or undefined if not found
 */
export function getMinerByTier(tier: number): MinerData | undefined {
  return MINER_DATABASE.find(miner => miner.tier === tier);
}

/**
 * Gets all miners
 * 
 * @returns Array of all miners
 */
export function getAllMiners(): MinerData[] {
  return MINER_DATABASE;
}

