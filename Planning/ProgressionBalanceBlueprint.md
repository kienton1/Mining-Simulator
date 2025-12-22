# Progression Balance Blueprint
## Mining Game - Complete Economy & Progression Design

### Overview
This document defines the complete progression system including 24 ores with depth-based linear health scaling, 54 pickaxes, swing rates, and economic balance to ensure ~10 hours of gameplay to reach level 1000.

---

## 1. Swing Rate System

### Base Swing Rate
- **Base Rate**: 2.0 swings/second (0.5 seconds per swing / 1 hit per 0.5 seconds)
- This is the slowest possible mining speed
- All pickaxes increase this base rate

### Swing Rate Formula
```
BaseRate = 1 / 0.5 = 2.0 swings/second
EffectiveSwingRate = BaseRate × PickaxeSpeedMultiplier
TimePerSwing = 1 / EffectiveSwingRate
```

### Example Calculations
- Tier 0 (Rusty): 2.0 swings/sec = 0.5 seconds/swing
- Tier 10 (Mid-game): ~8.0 swings/sec = 0.125 seconds/swing
- Tier 19 (End-game): ~28.4 swings/sec = 0.035 seconds/swing

---

## 2. Ore System (24 Ores)

### Design Principles
- **Depth-based spawning**: Each ore has a first depth where it begins spawning and scales to depth 1000
- **Dynamic health scaling**: Health scales linearly from first depth to depth 1000 based on the ore's difficulty curve
- **Rarity scaling**: More valuable ores are rarer
- **Value scaling**: Rarity and health correlate with sell value
- **Progressive unlocking**: Deeper depths introduce tougher, more valuable ores

### Ore Database

**NEW SYSTEM**: Each ore has a spawn depth range and health scales linearly within that range.

| Ore | Rarity (Odds) | Base Value | First Depth | First Health | Last Depth | Last Health |
|-----|---------------|------------|-------------|--------------|------------|-------------|
| Stone | 1 in 1 | 2 | 26 | 3 | 1000 | 10,000 |
| Deepslate | 1 in 1 | 5 | 26 | 12 | 1000 | 19,634 |
| Coal | 1 in 5 | 6 | 33 | 8 | 1000 | 22,000 |
| Iron | 1 in 10 | 10 | 38 | 24 | 1000 | 25,500 |
| Tin | 1 in 12 | 15 | 59 | 106 | 1000 | 27,994 |
| Cobalt | 1 in 14 | 50 | 58 | 178 | 1000 | 45,858 |
| Pyrite | 1 in 16 | 100 | 68 | 325 | 1000 | 56,953 |
| Gold | 1 in 22 | 250 | 97 | 902 | 1000 | 68,720 |
| Obsidian | 1 in 33 | 500 | 149 | 3,067 | 1000 | 93,314 |
| Ruby | 1 in 50 | 1,000 | 113 | 2,890 | 1000 | 139,970 |
| Diamond | 1 in 100 | 2,000 | 180 | 6,986 | 1000 | 180,000 |
| Amber | 1 in 100 | 3,500 | 245 | 9,735 | 1000 | 230,000 |
| Quartz | 1 in 100 | 5,000 | 215 | 12,250 | 1000 | 245,000 |
| Topaz | 1 in 200 | 10,000 | 273 | 24,758 | 1000 | 285,000 |
| Emerald | 1 in 222 | 20,000 | 540 | 92,389 | 1000 | 294,520 |
| Fossil | 1 in 250 | 50,000 | 550 | 159,190 | 1000 | 385,000 |
| Amethyst | 1 in 285 | 75,000 | 430 | 106,180 | 1000 | 559,890 |
| Sapphire | 1 in 333 | 150,000 | 847 | 585,970 | 1000 | 820,000 |
| Uranium | 1 in 400 | 250,000 | 893 | 987,200 | 1000 | 1,310,000 |
| Crystalite | 1 in 666 | 350,000 | 638 | 767,500 | 1000 | 1,550,000 |
| Solarite | 1 in 1000 | 450,000 | 870 | 1,690,000 | 1000 | 1,900,000 |
| Mythril | 1 in 2000 | 600,000 | 829 | 2,170,000 | 1000 | 2,400,000 |
| Stallite | 1 in 2857 | 800,000 | 770 | 2,710,000 | 1000 | 3,100,000 |
| Draconium | 1 in 10000 | 1,500,000 | 875 | 3,300,000 | 1000 | 4,000,000 |

### Ore Health Scaling Formula (NEW)
```
HP = FirstHealth + ((CurrentDepth - FirstDepth) / (LastDepth - FirstDepth)) × (LastHealth - FirstHealth)

Example for Coal (FirstDepth=8, FirstHealth=8, LastDepth=1000, LastHealth=2,480):
- At Depth 8: HP = 8
- At Depth 500: HP = 8 + ((500 - 8) / (1000 - 8)) × (2,480 - 8) = 8 + (492/992) × 2,472 = ~1,231 HP
- At Depth 1000: HP = 2,480
```

This linear interpolation ensures smooth, predictable health scaling as players descend deeper into the mine.

### Ore Rarity Balance
- Ores only spawn at or after their First Depth
- At any given depth, only ores with FirstDepth ≤ CurrentDepth can spawn
- Rarity (odds) determines spawn weight among available ores
- Luck scales all spawn chances proportionally
- Formula: `AdjustedChance = BaseChance × (1 + Luck)`, then normalize to 100%
- Example at Depth 100: Stone, Deepslate, Coal, Iron, Tin, Cobalt, Pyrite, Gold, Ruby can spawn (others locked)

---

## 3. Pickaxe System (54 Pickaxes)

### Design Principles
- **Based on**: Pickaxe Simulator (https://www.pickaxesimulator.com/pickaxes)
- **Stats converted**:
  - Coin% → Sell Value Multiplier (+50% = 1.5x, +100% = 2.0x, etc.)
  - Ore Luck% → Luck Bonus (5% = 0.05 decimal)
  - Speed → Mining Speed (swings per second)
- **REBALANCED**: Pickaxes provide speed, luck, and sell value multipliers (see PowerSystemPlan.md for damage details)

### Pickaxe Database

**REBALANCED**: Pickaxes now only affect Speed, Luck, and Sell Value Multiplier

#### Common Pickaxes (Tier 0-7)
| Tier | Name | Speed (swings/sec) | Luck | Sell Multiplier | Cost |
|------|------|-------------------|------|-----------------|------|
| 0 | Wooden | 0.0 | 0% | 1.0× | Free |
| 1 | Stone | 5.0 | 1% | 1.1× | 50 |
| 2 | Iron | 8.0 | 1% | 1.2× | 500 |
| 3 | Golden | 15.0 | 1% | 1.3× | 2.5K |
| 4 | Diamond | 20.0 | 5% | 1.5× | 10K |
| 5 | Blossom | 25.0 | 5% | 1.7× | 40K |
| 6 | Solarite | 30.0 | 5% | 1.9× | 250K |
| 7 | Venomstrike | 45.0 | 5% | 2.1× | 1M |

#### Rare Pickaxes (Tier 8-15)
| Tier | Name | Speed (swings/sec) | Luck | Sell Multiplier | Cost |
|------|------|-------------------|------|-----------------|------|
| 8 | Aurora Spire | 60.0 | 10% | 2.3× | 10M |
| 9 | Frostcore | 70.0 | 10% | 2.5× | 30M |
| 10 | Violet Wing | 85.0 | 10% | 3.0× | 150M |
| 11 | Crystal Breaker | 100.0 | 10% | 3.5× | 750M |
| 12 | Quill | 120.0 | 10% | 4.0× | 5B |
| 13 | Demolisher | 150.0 | 10% | 4.5× | 25B |
| 14 | Timber Crusher | 170.0 | 10% | 5.0× | 100B |
| 15 | Jester's Mallet | 200.0 | 10% | 5.5× | 750B |

#### Epic Pickaxes (Tier 16-23)
| Tier | Name | Speed (swings/sec) | Luck | Sell Multiplier | Cost |
|------|------|-------------------|------|-----------------|------|
| 16 | Glacial Shard | 300.0 | 15% | 6.0× | 5T |
| 17 | Shatterblade | 400.0 | 15% | 7.0× | 20T |
| 18 | Voidrend | 500.0 | 15% | 8.0× | 75T |
| 19 | Toxinspike | 600.0 | 15% | 9.0× | 150T |
| 20 | Bonegrinder | 700.0 | 15% | 10.0× | 600T |
| 21 | Frostbite Shard | 850.0 | 15% | 11.0× | 10Qd |
| 22 | Pixel Blade | 1,000.0 | 15% | 13.0× | 75Qd |
| 23 | Inferno Scythe | 1,250.0 | 15% | 16.0× | 500Qd |

#### Legendary Pickaxes (Tier 24-31)
| Tier | Name | Speed (swings/sec) | Luck | Sell Multiplier | Cost |
|------|------|-------------------|------|-----------------|------|
| 24 | Prybar | 1,500.0 | 20% | 21.0× | 2.5Qn |
| 25 | Crimson Blade | 2,000.0 | 20% | 26.0× | 10Qn |
| 26 | Frozen Edge | 3,000.0 | 20% | 31.0× | 25Qn |
| 27 | Skullgrinder Prime | 4,500.0 | 20% | 36.0× | 75Qn |
| 28 | Gemstone Destroyer | 7,000.0 | 20% | 46.0× | 500Qn |
| 29 | Thornspike | 10,000.0 | 20% | 61.0× | 7.5Sx |
| 30 | Frost Cube | 12,500.0 | 25% | 76.0× | 500Sx |
| 31 | Twin Flame Scythe | 17,500.0 | 25% | 91.0× | 1.55Sp |

#### Mythic Pickaxes (Tier 32-39)
| Tier | Name | Speed (swings/sec) | Luck | Sell Multiplier | Cost |
|------|------|-------------------|------|-----------------|------|
| 32 | Voidrend Prime | 22,500.0 | 30% | 121.0× | 5Sp |
| 33 | Toxic Reaper | 30,000.0 | 30% | 151.0× | 20Sp |
| 34 | Toxic Pixel | 40,000.0 | 30% | 201.0× | 50Sp |
| 35 | Emberhorn Cleaver | 55,000.0 | 30% | 251.0× | 375Sp |
| 36 | Crystal Cleaver | 70,000.0 | 30% | 351.0× | 2.5Oc |
| 37 | Radiant Reaper | 70,000.0 | 30% | 451.0× | 15Oc |
| 38 | Mailbox Pickaxe | 100,000.0 | 35% | 676.0× | 17.5Oc |
| 39 | Crescent Hammer | 120,000.0 | 35% | 851.0× | 75Oc |

#### Exotic Pickaxes (Tier 40-47)
| Tier | Name | Speed (swings/sec) | Luck | Sell Multiplier | Cost |
|------|------|-------------------|------|-----------------|------|
| 40 | Stormfury Pickaxe | 140,000.0 | 35% | 1,001.0× | 350Oc |
| 41 | Skybreaker Pickaxe | 160,000.0 | 35% | 1,201.0× | 1.5No |
| 42 | Neon Purple Pickaxe | 225,000.0 | 35% | 1,501.0× | 4No |
| 43 | Lumina Pickaxe | 275,000.0 | 35% | 1,851.0× | 15No |
| 44 | Abyssal Twin Edge | 325,000.0 | 35% | 2,251.0× | 50No |
| 45 | Inferno Cleaver | 400,000.0 | 35% | 2,751.0× | 200No |
| 46 | Neon Crystal | 500,000.0 | 40% | 3,501.0× | 25De |
| 47 | Star Scepter | 625,000.0 | 40% | 4,001.0× | 100De |

#### Secret Pickaxes (Tier 48-53)
| Tier | Name | Speed (swings/sec) | Luck | Sell Multiplier | Cost |
|------|------|-------------------|------|-----------------|------|
| 48 | Ancient Scythe | 785,000.0 | 40% | 4,501.0× | 500De |
| 49 | Plunger | 1,000,000.0 | 40% | 5,001.0× | 3.5UDe |
| 50 | Fire Axe | 1,500,000.0 | 40% | 6,001.0× | 10UDe |
| 51 | Double Axe | 2,000,000.0 | 40% | 7,001.0× | 35UDe |
| 52 | Skyforge | 3,000,000.0 | 40% | 8,001.0× | 100UDe |
| 53 | Thunderstrike | 4,000,000.0 | 40% | 10,001.0× | 300UDe |

### Stat Conversion Notes

**Coin% to Sell Multiplier**: 
- Formula: `Multiplier = 1.0 + (Coin% / 100)`
- Example: +50% Coins = 1.5× multiplier, +100% = 2.0×, +1000% = 11.0×

**Ore Luck% to Luck Bonus**:
- Formula: `LuckBonus = OreLuck% / 100`
- Example: 5% Ore Luck = 0.05, 10% = 0.10, 40% = 0.40

**Speed**:
- Direct conversion from website "+X Speed" values
- Represents swings per second (mining speed)
- Wooden pickaxe uses 1.0 as base (website shows +0)

**Cost**:
- Direct conversion from website costs
- Supports: K (thousand), M (million), B (billion), T (trillion), Qd (quadrillion), Qn (quintillion), Sx (sextillion), Sp (septillion), Oc (octillion), No (nonillion), De (decillion), UDe (undecillion)

**Note**: Better pickaxes now give significantly more money per ore sold, making them economically valuable even without damage bonuses. The progression goes from 1.0× to over 10,000× sell multiplier!

---

## 4. Progression Math (10 Hours to Level 1000)

### Time Calculation
- **Target**: 10 hours = 36,000 seconds total
- **Target depth**: 1,000 levels
- **Average time per level**: 36 seconds (but varies significantly)

### Progression Phases (UPDATED FOR NEW ORE SYSTEM)

#### Phase 1: Depths 1-100 (Early Game)
- **Available ores**: Stone, Deepslate, Coal, Iron, Tin, Cobalt, Pyrite, Gold, Ruby
- **Average HP**: ~50-3,000 (linear scaling per ore)
- **Pickaxe**: Tier 0-4 (2.0-22.0 swings/sec)
- **Time per level**: ~10-25 seconds
- **Total time**: ~20-30 minutes

#### Phase 2: Depths 100-400 (Mid Game)
- **Available ores**: All ores up to Amethyst unlock
- **Average HP**: ~5,000-150,000 (mix of scaling ores)
- **Pickaxe**: Tier 5-10 (25.0-85.0 swings/sec)
- **Time per level**: ~8-18 seconds
- **Total time**: ~1.5-2 hours

#### Phase 3: Depths 400-700 (Late Mid Game)
- **Available ores**: All ores up to Stallite unlock
- **Average HP**: ~200,000-2,000,000 (rare ores scaling up)
- **Pickaxe**: Tier 11-20 (100.0-700.0 swings/sec)
- **Time per level**: ~6-15 seconds
- **Total time**: ~2-3 hours

#### Phase 4: Depths 700-900 (Late Game)
- **Available ores**: All ores including Draconium (depth 850+)
- **Average HP**: ~2,000,000-6,000,000 (ultra-rare ores)
- **Pickaxe**: Tier 21-35 (850.0-55,000.0 swings/sec)
- **Time per level**: ~4-12 seconds
- **Total time**: ~1.5-2 hours

#### Phase 5: Depths 900-1000 (End Game)
- **Available ores**: All 24 ores at near-maximum health
- **Average HP**: ~6,000,000-9,000,000 (end-game scaling)
- **Pickaxe**: Tier 36-53 (70,000.0-4,000,000.0 swings/sec)
- **Time per level**: ~3-10 seconds
- **Total time**: ~30-60 minutes

**Note**: For power and damage calculations, see PowerSystemPlan.md

**Total Estimated Time**: ~6-9 hours (requires testing and tuning)

### Mining Damage Formula
See `PowerSystemPlan.md` for complete damage and power scaling formulas.

### Time Per Block Formula
```
SwingsNeeded = BlockHP / MiningDamage
TimePerBlock = SwingsNeeded / SwingRate
TimePerLevel = TimePerBlock × 1 (since each level = 1 block)
```

---

## 5. Economic Balance

### Sell Value Scaling
- Ores sell for their base value × PickaxeSellMultiplier
- Higher HP ores = higher value = more rare
- Better pickaxes = more money per ore (1.0× to 10.0× multiplier)
- Economic progression: Player should be able to afford next pickaxe tier after collecting reasonable amount of ores from their current tier
- Pickaxes provide economic value through sell multipliers (see PowerSystemPlan.md for damage mechanics)

### Income Projections (UPDATED FOR NEW ORE SYSTEM)

#### Early Game (Tier 0-4 Pickaxes, Depths 1-100)
- Average ore value: 2-50 gold (Stone, Coal, Iron, Cobalt, etc.)
- Sell multiplier: 1.0×-1.5×
- Blocks per minute: ~2-3
- Gold per hour: ~240-4,500
- Can afford Tier 4 (10K) after: ~30-60 minutes

#### Mid Game (Tier 5-10 Pickaxes, Depths 100-400)
- Average ore value: 50-10,000 gold (Gold, Ruby, Diamond, Topaz)
- Sell multiplier: 1.7×-3.0×
- Blocks per minute: ~4-6
- Gold per hour: ~12,000-1,080,000
- Can afford Tier 10 (150M) after: ~2-4 hours

#### Late Game (Tier 11-25 Pickaxes, Depths 400-700)
- Average ore value: 10,000-350,000 gold (Emerald, Amethyst, Crystalite)
- Sell multiplier: 3.5×-26.0×
- Blocks per minute: ~6-10
- Gold per hour: ~2,100,000-546,000,000
- Can afford Tier 25 (10Qn) after: ~5-8 hours

#### End Game (Tier 26+ Pickaxes, Depths 700-1000)
- Average ore value: 350,000-1,500,000 gold (Solarite, Mythril, Stallite, Draconium)
- Sell multiplier: 31.0×-10,001.0×
- Blocks per minute: ~10-20+
- Gold per hour: ~1B-1.8Qd+
- Can afford highest tiers after: ~10-15 hours (total playtime)

### Damage & Progression System
- For complete power and damage mechanics, see `PowerSystemPlan.md`
- Higher damage = faster progression = more gold per hour
- Pickaxes provide speed, luck, and economic bonuses (sell multipliers)

---

## 6. Depth-Based Scaling

### HP Scaling by Depth (NEW LINEAR SYSTEM)
- Each ore has unique FirstDepth and LastDepth (1000)
- Health scales linearly from FirstHealth to LastHealth
- Formula: `HP = FirstHealth + ((CurrentDepth - FirstDepth) / (LastDepth - FirstDepth)) × (LastHealth - FirstHealth)`
- This creates smooth, predictable progression curves
- Deeper ores start with higher base health and scale more dramatically

### Ore Unlock System
- Ores become available at their FirstDepth
- Early depths (1-50): Only basic ores (Stone, Deepslate, Coal)
- Mid depths (100-500): Mix of common and rare ores
- Deep depths (500-1000): All ores including ultra-rare endgame materials

### Value Modifier by Depth (Optional)
- Consider adding +1% value per 10 levels
- This rewards deeper mining
- Example: Ore worth 100 at depth 0, worth 110 at depth 100

---

## 7. Luck System Balance

### Base Chances (24 Ores Total)
- Ores have individual rarity odds (1 in X)
- Only ores at or past their FirstDepth can spawn
- Common ores: 1 in 1 to 1 in 22
- Uncommon ores: 1 in 33 to 1 in 100
- Rare ores: 1 in 100 to 1 in 666
- Ultra Rare ores: 1 in 1000 to 1 in 10,000

### Luck Impact (UPDATED - Favors Rare Ores)
- **NEW FORMULA**: Luck uses logarithmic scaling to favor rare ores MORE than common ores
- Formula: `weight × (1 + luck × log10(rarity + 1))`
- **Effect**: Rare ores benefit significantly more from luck than common ores
- Then normalized to 100%

**Examples with 40% luck (0.4):**
- Stone (1 in 1): Gets 1.12× boost (small benefit)
- Diamond (1 in 100): Gets 1.8× boost (good benefit)
- Draconium (1 in 10000): Gets 2.6× boost (huge benefit!)

This means high luck makes rare ores MUCH more common while barely affecting common ore rates!

### Expected Ore Distribution at Different Depths

**Early Game (Depth 1-50, with 0% luck):**
- Stone: ~50% (1 in 1)
- Deepslate: ~50% (1 in 1)
- Coal (depth 8+): ~20% (1 in 5)
- Iron (depth 13+): ~10% (1 in 10)

**Mid Game (Depth 100-500, with 0% luck):**
- Mix of common through rare ores
- Stone/Deepslate still common but less dominant
- Gold, Ruby, Diamond become available
- Rarer ores worth significantly more

**End Game (Depth 800-1000, with 40% luck):**
- All 24 ores available
- Ultra-rare ores (Mythril, Stallite, Draconium) obtainable
- Luck bonus makes rare ores more common
- High health values require strong power/pickaxes

---

## 8. Implementation Checklist

### Ore System (NEW)
- [ ] Implement 24 ores with rarity, value, first/last depth, first/last health
- [ ] Implement linear health scaling formula based on current depth
- [ ] Implement ore unlock system (only spawn if CurrentDepth ≥ FirstDepth)
- [ ] Test health progression feels smooth and balanced
- [ ] Update ore generation to use new depth-based system

### Pickaxe System
- [x] Implement 54 pickaxes with cost, speed, luck, sell value multiplier
- [x] Implement pickaxe sell value multiplier system
- [x] Update selling system to apply sell multipliers
- [x] Update shop UI to show sell multipliers
- [ ] See PowerSystemPlan.md for power-related implementation tasks

### Balancing & Testing
- [ ] Balance ore generation with luck system and depth unlocks
- [ ] Test progression pacing (10 hours to level 1000)
- [ ] Test economic balance (pickaxe affordability with sell multipliers)
- [ ] Polish UI for all 24 ores
- [ ] Create shop UI for all 54 pickaxes
- [ ] Test rare ore excitement (should feel special to find)
- [ ] See PowerSystemPlan.md for power-related testing tasks

---

## 9. Formula Summary

### Mining Formulas (UPDATED)
```
// For complete damage formulas, see PowerSystemPlan.md

BlockHP = FirstHealth + ((CurrentDepth - FirstDepth) / (LastDepth - FirstDepth)) × (LastHealth - FirstHealth)
  - Linear interpolation between first and last health based on depth

SwingsNeeded = BlockHP / MiningDamage
SwingRate = BaseSwingRate + PickaxeSpeedBonus
  - BaseSwingRate = 2.0 swings/second (0.5s per swing)
  - PickaxeSpeedBonus varies by pickaxe tier (0 to 4,000,000+)
  
TimePerBlock = SwingsNeeded / SwingRate
```

### Ore Spawn Formulas (NEW - WITH RARE ORE LUCK BONUS)
```
CanSpawn = CurrentDepth ≥ OreFirstDepth
SpawnWeight = 1 / OreRarityOdds (if CanSpawn, else 0)
LuckBonus = PlayerLuck × log10(OreRarity + 1)  // Rare ores get bigger bonus
AdjustedWeight = SpawnWeight × (1 + LuckBonus)
SpawnChance = AdjustedWeight / SumOfAllAdjustedWeights
```

### Economic Formulas
```
OreSellValue = BaseValue × PickaxeSellMultiplier
PickaxeSellMultiplier = Progressive scaling (1.0× to 10,001.0×)
PickaxeLuck = Tier-based (0% to 40%)
```

**REBALANCED**: 
- Health scales linearly per ore based on depth
- Ores unlock progressively as you descend
- Selling applies pickaxe sell value multiplier
- Pickaxes provide speed, luck, and economic value
- For damage and power mechanics, see PowerSystemPlan.md

---

## 10. Testing & Balancing Notes

### Key Metrics to Monitor
1. **Time to reach level 1000**: Target ~10 hours
2. **Pickaxe affordability**: Each tier should feel achievable
3. **Ore rarity feeling**: Rare ores should feel special
4. **Progression smoothness**: No major plateaus or spikes
5. **End-game challenge**: Levels 900-1000 should be engaging

### Adjustment Levers
- Block HP (increase/decrease for pacing)
- Pickaxe costs (adjust for economic balance)
- Ore rarity (adjust for excitement)
- Swing rates (adjust for feel)
- Power scaling (see PowerSystemPlan.md)

---

*This blueprint should serve as the definitive reference for all progression balancing. Adjust values based on playtesting feedback while maintaining the core progression philosophy.*

