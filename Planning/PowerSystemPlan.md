# Power System Plan
## Complete Power Mechanics for Mining Game

### Overview
This document consolidates all power-related planning content from the Mining Game project. Power is the primary stat for increasing mining damage and is gained through training rocks. This system has been rebalanced to make power the ONLY source of mining damage, with pickaxes providing speed, luck, and economic bonuses instead.

---

## Table of Contents
1. [Power System Goals](#1-power-system-goals)
2. [Power Gain System](#2-power-gain-system)
3. [Power Impact on Mining](#3-power-impact-on-mining)
4. [Power Scaling Analysis](#4-power-scaling-analysis)
5. [Training Rock Balance](#5-training-rock-balance)
6. [Training vs Mining Time Investment](#6-training-vs-mining-time-investment)
7. [Power Constants & Formulas](#7-power-constants--formulas)
8. [Power Scaling Examples](#8-power-scaling-examples)
9. [Power & Rebirth Integration](#9-power--rebirth-integration)
10. [Power Persistence & Saving](#10-power-persistence--saving)
11. [Power UI References](#11-power-ui-references)
12. [Implementation Checklist](#12-implementation-checklist)

---

## 1. Power System Goals

### Design Principles
- **Meaningful Impact**: Power should provide noticeable damage increases throughout the game
- **Scalable**: Works from early game (Power 20) to late game (Power 200,000+)
- **Training Reward**: Training should feel rewarding relative to mining time investment
- **Smooth Progression**: Power gains should scale naturally with pickaxe tiers and rebirths
- **Balanced Impact**: Power should help but not completely dominate mining progression

### Key Rebalance
**REBALANCED**: Pickaxes NO LONGER affect damage or power gain
- Damage comes from Power only (base damage = 1)
- Power gain comes from training rocks and rebirths only
- Pickaxes provide speed, luck, and sell value multipliers instead

---

## 2. Power Gain System

### Base Power Gain
- **Base Power Gain**: 1 power per hit (unchanged)
- This is the foundation that all multipliers build on

### Power Gain Formula
```
PowerPerHit = BasePowerGain × RockMultiplier × RebirthMultiplier

BasePowerGain = 1
RockMultiplier = Training rock tier multiplier (1 to 25)
RebirthMultiplier = 1 + (Rebirths × 0.10)
```

**REBALANCED**: Pickaxes no longer affect power gain. Power gain comes from training rocks and rebirths only.

### Training Speed
- **Training uses same swing rate as mining**
- Base: 2.0 swings/second (1 hit per 0.5 seconds)
- Scales with pickaxe tier (same as mining)
- This means training speed improves as players get better pickaxes

### Power Per Second Calculation
```
PowerPerSecond = PowerPerHit × SwingRate

Example with Tier 0 (Wooden) on Stone Rock (1× multiplier), 0 rebirths:
- PowerPerHit = 1 × 1 × 1.0 = 1
- SwingRate = 2.0 swings/sec
- PowerPerSecond = 1 × 2.0 = 2.0 power/sec

Example with Tier 10 pickaxe on Diamond Rock (10× multiplier), 5 rebirths:
- PowerPerHit = 1 × 10 × 1.5 = 15
- SwingRate = 8.0 swings/sec
- PowerPerSecond = 15 × 8.0 = 120 power/sec
```

**Note**: Training speed still scales with pickaxe tier (mining speed), but power gain per hit no longer benefits from pickaxe power bonuses.

---

## 3. Power Impact on Mining

### Mining Damage Formula
```
MiningDamage = BaseDamage × (1 + Power / PowerScalingConstant)

BaseDamage = 1 (constant - pickaxes no longer affect damage)
PowerScalingConstant = 5
```

**REBALANCED**: Damage now comes from Power only. Pickaxes provide speed, luck, and sell value multipliers instead.

**Design Goal**: Balanced progression where training helps significantly but doesn't trivialize all content immediately.

### Balance Verification Examples
- **20 power** (10 sec training) = 1 × (1 + 20/5) = **5 damage** (takes ~20 hits for stone)
- **75 power** (30 sec training) = 1 × (1 + 75/5) = **16 damage** (takes ~9-10 hits for coal)
- **495 power** (~4 min training) = 1 × (1 + 495/5) = **100 damage** (one-hits stone)
- **Coal (150 HP)**: Requires ~750 power (~6.25 min) to one-hit

### Why PowerScalingConstant = 5?
- **Primary Goal**: Allow meaningful progression without trivializing content
- Every 5 power = +100% damage (2× total)
- Every 25 power = +500% damage (6× total)
- Every 100 power = +2,000% damage (21× total)
- **10 seconds training (20 power)**: 5× damage - Helps but doesn't one-hit everything
- **30 seconds training (75 power)**: 16× damage - Noticeable improvement, still requires effort
- **4 minutes training (495 power)**: One-hits stone
- **6.25 minutes training (750 power)**: One-hits coal
- Provides meaningful progression curve where training investment is rewarded but doesn't break balance

---

## 4. Power Scaling Analysis

### Early Game (Power 0-1,000)
- **With 20 Power** (10 sec training): +400% damage (5× total) - Helps but stone still takes effort
- **With 75 Power** (30 sec): +1,500% damage (16× total) - Noticeable improvement, coal becomes easier
- **With 100 Power**: +2,000% damage (21× total)
- **With 500 Power**: +10,000% damage (101× total) - Can one-hit stone
- **With 1,000 Power**: +20,000% damage (201× total)

### Mid Game (Power 1,000-10,000)
- **With 5,000 Power**: +100,000% damage (1,001× total)
- **With 10,000 Power**: +200,000% damage (2,001× total)

### Late Game (Power 10,000-100,000+)
- **With 50,000 Power**: +1,000,000% damage (10,001× total)
- **With 100,000 Power**: +2,000,000% damage (20,001× total)

### Impact Examples - All Pickaxes Deal Same Base Damage (1)
- Power 0: 1 damage
- Power 20 (10 sec): 5 damage (+400%) - Stone takes ~20 hits
- Power 75 (30 sec): 16 damage (+1,500%) - Coal takes ~9-10 hits
- Power 495 (~4 min): 100 damage (+9,900%) - **One-hits stone**
- Power 750 (~6.25 min): 151 damage (+15,000%) - **One-hits coal**
- Power 1,000: 201 damage (+20,000%)
- Power 10,000: 2,001 damage (+200,000%)
- Power 100,000: 20,001 damage (+2,000,000%)

**Note**: All pickaxes now deal the same base damage (1). Damage scaling comes entirely from Power. Pickaxes provide speed, luck, and sell value multipliers instead.

---

## 5. Training Rock Balance

### Training Rock Tiers

| Rock | Required Rebirths | Power Multiplier | Required Power | Best For |
|------|-------------------|------------------|----------------|----------|
| Stone | 0 | 1× | 0 | Early game, Power 0-1,000 |
| Iron | 5 | 2× | 1,000 | Early-mid game, Power 1,000-10,000 |
| Gold | 15 | 4× | 5,000 | Mid game, Power 5,000-50,000 |
| Diamond | 50 | 10× | 20,000 | Late game, Power 20,000-200,000 |
| Crystal | 150 | 25× | 50,000 | End game, Power 50,000+ |

### Training Rock Recommendations
- **Stone Rock**: Start here, good for Power 0-500
- **Iron Rock**: Accessible after first rebirth, good for Power 500-5,000
- **Gold Rock**: Mid-game progression, good for Power 5,000-25,000
- **Diamond Rock**: Late-game training, good for Power 25,000-100,000
- **Crystal Rock**: End-game training, good for Power 100,000+

---

## 6. Training vs Mining Time Investment

### Training Efficiency Analysis

#### Early Game Training (Stone Rock, Tier 0 Pickaxe)
- **Power Gain**: 2.0 power/second
- **Time to gain 20 Power**: 10 seconds - +400% damage (5× total), stone takes ~20 hits
- **Time to gain 75 Power**: 37.5 seconds - +1,500% damage (16× total), coal takes ~9-10 hits
- **Time to gain 495 Power**: ~4 minutes - **One-hits stone (100 HP)**
- **Time to gain 750 Power**: ~6.25 minutes - **One-hits coal (150 HP)**
- **Time to gain 1,000 Power**: 8.3 minutes - +20,000% damage (201× total)

#### Mid Game Training (Diamond Rock, Tier 10 Pickaxe, 5 rebirths)
- **Power Gain**: ~420 power/second
- **Time to gain 1,000 Power**: 2.4 seconds
- **Time to gain 10,000 Power**: 24 seconds
- **Time to gain 100,000 Power**: 4 minutes
- **Impact**: Massive damage boost

### Power Targets by Mining Phase

#### Phase 1: Depths 1-100 (Early Game)
- **Available ores**: Stone, Deepslate, Coal, Iron, Tin, Cobalt, Pyrite, Gold, Ruby
- **Average HP**: ~50-3,000 (linear scaling per ore)
- **Pickaxe**: Tier 0-4 (2.0-22.0 swings/sec)
- **Power needed**: ~20-100 (damage = 5-21 per swing)
- **Target Power**: 20-500 (10 seconds - ~4 minutes)
- **Training Time**: ~10 seconds for noticeable boost, ~4 minutes to one-hit stone
- **Benefit**: 5× to 101× mining damage boost
- **Goal**: Training helps significantly but requires investment to one-hit materials

#### Phase 2: Depths 100-400 (Mid Game)
- **Available ores**: All ores up to Amethyst unlock
- **Average HP**: ~5,000-150,000 (mix of scaling ores)
- **Pickaxe**: Tier 5-10 (25.0-85.0 swings/sec)
- **Power needed**: ~100-1,000 (damage = 21-201 per swing)
- **Target Power**: 1,000-5,000
- **Training Time**: ~5-30 minutes (early) or ~2-12 seconds (late)
- **Benefit**: 5,001× to 25,001× mining damage boost

#### Phase 3: Depths 400-700 (Late Mid Game)
- **Available ores**: All ores up to Stallite unlock
- **Average HP**: ~200,000-2,000,000 (rare ores scaling up)
- **Pickaxe**: Tier 11-20 (100.0-700.0 swings/sec)
- **Power needed**: ~1,000-10,000 (damage = 201-2,001 per swing)
- **Target Power**: 5,000-25,000
- **Training Time**: ~2-10 minutes (with good setup)
- **Benefit**: 25,001× to 125,001× mining damage boost

#### Phase 4: Depths 700-900 (Late Game)
- **Available ores**: All ores including Draconium (depth 850+)
- **Average HP**: ~2,000,000-6,000,000 (ultra-rare ores)
- **Pickaxe**: Tier 21-35 (850.0-55,000.0 swings/sec)
- **Power needed**: ~10,000-50,000 (damage = 2,001-10,001 per swing)
- **Target Power**: 25,000-100,000
- **Training Time**: ~1-4 minutes (with best setup)
- **Benefit**: 125,001× to 500,001× mining damage boost

#### Phase 5: Depths 900-1000 (End Game)
- **Available ores**: All 24 ores at near-maximum health
- **Average HP**: ~6,000,000-9,000,000 (end-game scaling)
- **Pickaxe**: Tier 36-53 (70,000.0-4,000,000.0 swings/sec)
- **Power needed**: ~50,000-200,000 (damage = 10,001-40,001 per swing)

**Note**: Hardest materials (e.g., Cosmic at depth 1000) require significant power investment

---

## 7. Power Constants & Formulas

### Recommended Constants

```typescript
BASE_POWER_GAIN = 1                    // Base power per hit (keep at 1)
POWER_SCALING_CONSTANT = 5             // Power scaling divisor (balanced for meaningful progression)
REBIRTH_MULTIPLIER_PER_REBIRTH = 0.10 // +10% per rebirth (keep at 0.10)
REBIRTH_POWER_THRESHOLD = 1000         // Power needed to rebirth (keep at 1000)
```

### Why These Values Work

1. **BASE_POWER_GAIN = 1**
   - Simple, clean number
   - Easy to understand (1× multiplier = 1 power per hit)
   - Works well with multipliers

2. **POWER_SCALING_CONSTANT = 5** (BALANCED)
   - **Design Goal**: Training provides meaningful progression without trivializing content
   - Every 5 power = +100% damage (2× total)
   - Every 25 power = +500% damage (6× total)
   - Every 100 power = +2,000% damage (21× total)
   - Provides meaningful progression curve where training investment is rewarded but doesn't break balance

3. **REBIRTH_MULTIPLIER = 0.10**
   - 10 rebirths = 2× power gain (100% bonus)
   - 50 rebirths = 6× power gain (500% bonus)
   - Provides long-term progression incentive

### Complete Formula Summary

#### Power Gain Formula
```
PowerPerHit = 1 × RockMultiplier × (1 + Rebirths × 0.10)
PowerPerSecond = PowerPerHit × SwingRate
```

**REBALANCED**: Pickaxes no longer provide power bonus multipliers. Power gain comes from training rocks and rebirths only.

#### Mining Damage Formula
```
MiningDamage = BaseDamage × (1 + Power / 5)

BaseDamage = 1 (constant - pickaxes don't affect damage)
PowerScalingConstant = 5 (every 5 power = +100% damage)
```

**REBALANCED**: Damage now comes from Power only, not pickaxes.

---

## 8. Power Scaling Examples

### Example Progression Scenarios

#### Scenario 1: New Player
- **Starting Power**: 0 (or 50 for debugging)
- **Pickaxe**: Tier 0 (Wooden, base damage = 1)
- **Training**: Stone Rock, Tier 0 pickaxe
- **Power Gain**: 2.0 power/sec
- **After 5 minutes training**: +600 power = 650 total
- **Mining Damage**: 1 × (1 + 650/5) = 131 damage (+13,000%)
- **Impact**: Significant early game boost

#### Scenario 2: Mid-Game Player
- **Current Power**: 1,000
- **Pickaxe**: Tier 5 (base damage = 1)
- **Training**: Iron Rock, Tier 5 pickaxe, 3 rebirths
- **Power Gain**: ~67.2 power/sec
- **After 5 minutes training**: +20,160 power = 21,160 total
- **Mining Damage**: 1 × (1 + 21,160/5) = 4,233 damage (+423,200%)
- **Impact**: Massive mid-game boost

#### Scenario 3: Late-Game Player
- **Current Power**: 50,000
- **Pickaxe**: Tier 15 (base damage = 1)
- **Training**: Crystal Rock, Tier 15 pickaxe, 25 rebirths
- **Power Gain**: ~1,440 power/sec
- **After 5 minutes training**: +432,000 power = 482,000 total
- **Mining Damage**: 1 × (1 + 482,000/5) = 96,401 damage (+9,640,000%)
- **Impact**: Extreme end-game boost

### Training Efficiency by Setup

#### Tier 0 Pickaxe (Wooden) on Stone Rock
- **Power/sec**: 2.0
- **Time to 1,000 Power**: 8.3 minutes
- **Verdict**: ✅ Good for early game

#### Tier 5 Pickaxe on Iron Rock, 5 rebirths
- **Power/sec**: ~35.2
- **Time to 1,000 Power**: 28 seconds
- **Verdict**: ✅ Good for mid-game

#### Tier 10 Pickaxe on Diamond Rock, 15 rebirths
- **Power/sec**: ~336
- **Time to 10,000 Power**: 30 seconds
- **Verdict**: ✅ Good for late-game

#### Tier 19+ Pickaxe on Crystal Rock, 50 rebirths
- **Power/sec**: ~2,100
- **Time to 100,000 Power**: 48 seconds
- **Verdict**: ✅ Excellent for end-game

### Balance Conclusion
✅ **Training rates are well-balanced** - they scale appropriately with pickaxe tiers and provide meaningful power gains relative to mining progression.

---

## 9. Power & Rebirth Integration

### Rebirth Core Concept

**Rebirth = Reset + Permanent Power Bonus**

- Player spends Power to perform a rebirth
- Each rebirth grants +10% power gain per hit (multiplicative)
- Power is reset to a base value (typically 1)
- Rebirths are permanent and cumulative
- Formula: `PowerGainMultiplier = 1 + (Rebirths × 0.10)`

### Rebirth Cost Formula

**Base Cost**: 1,500 Power per rebirth

**Scaling**: Cost increases with number of rebirths
- Formula: `Cost = BaseCost × (1 + Rebirths × 0.1)`
- Example:
  - 1st rebirth: 1,500 × 1.0 = 1,500 Power
  - 2nd rebirth: 1,500 × 1.1 = 1,650 Power
  - 10th rebirth: 1,500 × 2.0 = 3,000 Power

**Recommended Formula**:
```typescript
function calculateRebirthCost(rebirths: number): number {
  const BASE_COST = 1500;
  return BASE_COST * Math.pow(1.1, rebirths); // 10% increase per rebirth
}

// For multiple rebirths at once:
function calculateRebirthCostMultiple(rebirths: number, count: number): number {
  let totalCost = 0;
  for (let i = 0; i < count; i++) {
    totalCost += calculateRebirthCost(rebirths + i);
  }
  return totalCost;
}
```

### Power Reset After Rebirth

After rebirth:
- Power resets to base value (typically 1)
- All other stats remain (gold, inventory, pickaxe tier, etc.)
- Rebirth count increases by 1
- Power gain multiplier increases permanently

**Question**: Should power reset to 1, or keep remaining power after cost?

**Option A: Reset to Base**
- Power = 1 after rebirth
- Clean reset, forces player to rebuild

**Option B: Keep Remaining**
- Power = currentPower - cost
- Allows partial power retention
- More forgiving

**Recommendation**: Option A (reset to 1) for true rebirth feel, but make it configurable.

### Power Gain Multiplier

```typescript
function calculatePowerGainMultiplier(rebirths: number): number {
  // Each rebirth adds 10% power gain
  return 1 + (rebirths * 0.10);
}
```

**Examples**:
- 0 rebirths = 1.0× power gain
- 5 rebirths = 1.5× power gain (+50%)
- 10 rebirths = 2.0× power gain (+100%)
- 50 rebirths = 6.0× power gain (+500%)

### Rebirth Implementation Details

```typescript
function performRebirth(player: Player, count: number): RebirthResult {
  const playerData = getPlayerData(player);
  const totalCost = calculateRebirthCostMultiple(playerData.rebirths, count);
  
  if (playerData.power < totalCost) {
    return { success: false, message: 'Insufficient power' };
  }
  
  // Deduct cost
  playerData.power -= totalCost;
  
  // Reset power to base (or keep remaining)
  playerData.power = 1; // Or: playerData.power (keep remaining)
  
  // Increase rebirths
  playerData.rebirths += count;
  
  // Update player data
  updatePlayerData(player, playerData);
  
  return {
    success: true,
    rebirthsPerformed: count,
    newRebirths: playerData.rebirths,
    powerSpent: totalCost,
    newPower: playerData.power
  };
}
```

---

## 10. Power Persistence & Saving

### Power in PlayerData Interface

All fields from `PlayerData` interface need to be saved:

- **power** (number): Current power level for mining damage
- **rebirths** (number): Number of times player has rebirthed (affects power gain)
- **gold** (number): Current currency amount
- **wins** (number): Number of times player reached bottom of mines
- **currentPickaxeTier** (number): Currently equipped pickaxe tier
- **inventory** (InventoryData): Complete ore inventory

### When to Save Power Data

#### Immediate Saves (Critical Changes)
Save immediately when these events occur:
1. **Power changes**: After training rock hits (power gain)
2. **Gold changes**: After selling ores, purchasing pickaxes
3. **Inventory changes**: After mining ores, selling ores
4. **Pickaxe purchases**: When player buys a new pickaxe
5. **Rebirth actions**: When player performs a rebirth
6. **Win events**: When player reaches bottom of mine (depth 1000)

#### Periodic Saves (Backup)
- Save every 30-60 seconds as a backup
- Prevents data loss if server crashes
- Use a debounced save mechanism to avoid excessive writes

#### On Disconnect
- Save player data when `PlayerEvent.LEFT_WORLD` is triggered
- Ensure data is saved before player is removed from memory
- Handle async save completion before cleanup

### Save Implementation Points

1. **GameManager.updatePlayerData()**: Add save call after updating data
2. **InventoryManager**: Save after inventory modifications
3. **SellingSystem**: Save after gold/inventory changes
4. **PickaxeShop**: Save after pickaxe purchases
5. **TrainingController**: Save after power gains
   - Consider batching power gains (save every N gains, not every hit)
6. **MiningController**: Save after wins (reaching depth 1000)
7. **Rebirth System**: Save after rebirth actions

### Load Strategy

#### On Player Join
- Load data in `GameManager.initializePlayer()` method
- Replace the TODO comment with actual persistence loading
- Load should happen before any game systems initialize the player

#### Load Process Flow

1. **Player joins** → `PlayerEvent.JOINED_WORLD` fires
2. **GameManager.initializePlayer()** is called
3. **Attempt to load** saved data from persistence:
   - Call `world.persistence.getPlayerData(player)`
   - Handle async/await properly
4. **Merge with defaults**:
   - If no saved data exists → use `createDefaultPlayerData()`
   - If saved data exists → merge with defaults to handle missing fields
   - Validate data structure (ensure all required fields exist)
5. **Store in memory** → `playerDataMap.set(player, playerData)`
6. **Initialize game systems** → training, mining, inventory, etc.

### Power Data Example Flow

#### Player Gains Power
```
Training hit → TrainingController.onPowerGain()
  → Update playerData.power
  → GameManager.updatePlayerData()
    → Store in playerDataMap
    → world.persistence.setPlayerData(player, data) [async, debounced]
```

---

## 11. Power UI References

### Power Gain Popup

**Visual Design**:
- Appears every swing during training, showing the exact power gained (e.g., `81`)
- Red text with outlined explosion icon to emphasize impact
- Each popup value instantly adds to the total Power stat displayed in the HUD
- Use this when designing floating combat text or training feedback loops

**Location**: `Planning/UIReferences/PowerGainPopup.md`

### Rebirth UI - Power Display

**Power Cost Display**:
- **Power Cost**: Red color (#FF5252)
- **Power Icon**: Red explosion (💥)
- Format: "1.5K Power", "472.5K Power", etc.
- Use K/M suffixes for large numbers

**Power Mechanic Explanation**:
- Display: `♻️ 1 = 💥 +10%`
  - ♻️ = Green refresh/recycle icon
  - 1 = White text (number of rebirths)
  - = = White text
  - 💥 = Red explosion icon (power)
  - +10% = Red text (power gain bonus)
- Meaning: "1 Rebirth = +10% Power gain"

---

## 12. Implementation Checklist

### Core Power System
- [x] Current constants are balanced (BASE_POWER_GAIN = 1, POWER_SCALING_CONSTANT = 5)
- [x] Training uses same swing rate as mining (already implemented)
- [x] Power gain formula works correctly
- [x] Power scaling formula works correctly
- [x] Remove pickaxe damage and power bonus (REBALANCED)
- [x] Implement base damage = 1 (Power-only damage)
- [x] Update training system to remove pickaxe power bonus
- [x] Update shop UI to show sell multipliers instead of damage/power bonus

### Rebirth System Integration
- [ ] Implement rebirth cost formula
- [ ] Implement power reset after rebirth
- [ ] Implement power gain multiplier calculation
- [ ] Integrate rebirth multiplier into power gain calculations
- [ ] Create rebirth UI with power cost display
- [ ] Test rebirth power mechanics

### Training System
- [ ] Monitor player feedback on power gain rates
- [ ] Monitor player feedback on power impact
- [ ] Consider adding intermediate training rocks if needed
- [ ] Consider adjusting training rock requirements based on playtesting

### Power Persistence
- [ ] Implement power save on training hits (with debouncing)
- [ ] Implement power save on rebirth
- [ ] Implement power load on player join
- [ ] Test power persistence across sessions
- [ ] Validate power data on load

### Testing & Balancing
- [ ] Test power scaling integration
- [ ] Test power gain rates at different tiers
- [ ] Test power impact on mining at different depths
- [ ] Test rebirth power mechanics
- [ ] Test power persistence
- [ ] Adjust power scaling if needed based on feedback

### UI Implementation
- [ ] Implement power gain popup visual
- [ ] Implement power display in HUD
- [ ] Implement rebirth UI with power costs
- [ ] Show power gain multiplier from rebirths

---

## Summary

This power system creates a balanced progression where:
1. **Power is the ONLY source of mining damage** (base damage = 1 for all pickaxes)
2. **Training is the primary way to gain power** (rocks × rebirths)
3. **Rebirths provide exponential power gain scaling** (+10% per rebirth)
4. **Training investment is meaningful but balanced** (10 sec = 5× damage, 4 min = one-hit stone)
5. **Power scales smoothly from early to late game** (20 power to 200,000+ power)
6. **Pickaxes affect training speed** (faster swings = faster power gain) but not damage directly
7. **Pickaxes provide speed, luck, and economic value** instead of damage

**Design Philosophy**: Power enhances mining significantly but doesn't completely replace the need for better pickaxes. The synergy between pickaxes (speed/luck/sell multiplier) and power (damage) creates a balanced progression system.

---

*This document consolidates all power-related planning from: ProgressionBalanceBlueprint.md, TrainingPowerBalanceBlueprint.md, rebirthSystem.md, ProgressionSaveSystemPlan.md, and UI references.*

