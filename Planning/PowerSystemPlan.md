# Power System Plan
## Complete Power Mechanics for Mining Game

### Overview
This document consolidates **ALL power-related planning content** from the Mining Game project. Power is the primary stat for increasing mining damage and is gained through training rocks. This system has been rebalanced to make power the ONLY source of mining damage, with pickaxes providing speed, luck, and economic bonuses instead.

**This is the single source of truth for all power mechanics, formulas, and planning.**

---

## Table of Contents
1. [Power System Goals](#1-power-system-goals)
2. [Power Gain System](#2-power-gain-system)
3. [Power Impact on Mining](#3-power-impact-on-mining)
4. [Training Rock Balance](#4-training-rock-balance)
5. [Power Constants & Formulas](#5-power-constants--formulas)
6. [Power & Rebirth Integration](#6-power--rebirth-integration)
7. [Rebirth System UI & Implementation](#7-rebirth-system-ui--implementation)
8. [Power Persistence & Saving](#8-power-persistence--saving)
9. [Power UI References](#9-power-ui-references)
10. [Implementation Checklist](#10-implementation-checklist)

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

## 2. Power Gain System (UPDATED - Flat Power Bonuses)

### Power Gain System Overview
- **UPDATED SYSTEM**: All training rocks (Rocks 1-6) provide power bonuses per hit that scale based on rebirths
- **Rock 1** uses a piecewise function based on rebirth count (x = rebirths, y = power per hit)
- **Rock 2** uses a piecewise function based on rebirth count (x = rebirths, y = power per hit)
- **Rock 3** uses a piecewise function based on rebirth count (x = rebirths, y = power per hit)
- **Rock 4** uses a piecewise function based on rebirth count (x = rebirths, y = power per hit)
- **Rock 5** uses a piecewise function based on rebirth count (x = rebirths, y = power per hit)
- **Rock 6** uses a piecewise function based on rebirth count (x = rebirths, y = power per hit)
- Players can unlock higher-tier rocks by meeting either a power requirement OR rebirth requirement
- Pickaxes no longer affect power gain - only training rock selection and rebirth count matter

### Power Gain Formula (UPDATED)
```
For Rock 1:
PowerPerHit = Rock1PowerBonus(rebirths)
  - Uses piecewise function based on rebirth count (see Rock 1 Power Formula below)

For Rock 2:
PowerPerHit = Rock2PowerBonus(rebirths)
  - Uses piecewise function based on rebirth count (see Rock 2 Power Formula below)

For Rock 3:
PowerPerHit = Rock3PowerBonus(rebirths)
  - Uses piecewise function based on rebirth count (see Rock 3 Power Formula below)

For Rock 4:
PowerPerHit = Rock4PowerBonus(rebirths)
  - Uses piecewise function based on rebirth count (see Rock 4 Power Formula below)

For Rock 5:
PowerPerHit = Rock5PowerBonus(rebirths)
  - Uses piecewise function based on rebirth count (see Rock 5 Power Formula below)

For Rock 6:
PowerPerHit = Rock6PowerBonus(rebirths)
  - Uses piecewise function based on rebirth count (see Rock 6 Power Formula below)
```

**KEY CHANGE**: All rocks (Rocks 1-6) have power gain that scales with rebirth count using piecewise functions. Rebirths now directly affect all rocks' power gain per hit, while also serving as unlock requirements for higher-tier rocks.

### Training Rock Unlock Requirements
- Each rock requires EITHER:
  - A minimum power threshold (current power >= requirement), OR
  - A minimum rebirth count
- Players can unlock rocks using whichever requirement they meet first
- Once unlocked, a rock remains available for training

### Training Speed
- **Training uses same swing rate as mining**
- Base: 2.0 swings/second (1 hit per 0.5 seconds)
- Scales with pickaxe tier (same as mining)
- This means training speed improves as players get better pickaxes
- Power gain per hit is fixed based on selected rock, but faster swings = more power per second

### Power Per Second Calculation (UPDATED)
```
PowerPerSecond = RockPowerBonus × SwingRate
```

**Note**: Training speed still scales with pickaxe tier (mining speed). All rocks' (Rocks 1-6) power gain per hit scale with rebirth count.

---

## 3. Power Impact on Mining

### Mining Damage Formula (UPDATED - Power-Based Scaling)

The damage calculation uses a two-part formula that scales power into damage:

```
EarlyBoost = 1 + 2 / (1 + (Power / 398107.17)^0.3)

Damage = 1 + 0.072 * Power^0.553 * EarlyBoost
```

**Where**:
- `Power` is the player's current power stat (input)
- `EarlyBoost` is a scaling factor that provides enhanced damage scaling at lower power levels
- `Damage` is the resulting mining damage (output)

**REBALANCED**: Damage now comes from Power only using a power-based scaling formula. Pickaxes provide speed, luck, and sell value multipliers instead.

**Design Goal**: The formula uses a power function (Power^0.553) for smooth non-linear scaling, with the EarlyBoost multiplier providing enhanced scaling at lower power levels. This creates meaningful progression throughout the game without trivializing content.

### Formula Behavior

- **Early Game**: The EarlyBoost factor provides significant scaling at lower power levels (when Power < 398107.17)
- **Mid-Late Game**: As power increases, EarlyBoost approaches 1, and damage scales primarily through the Power^0.553 term
- **Non-Linear Scaling**: The 0.553 exponent creates a smooth diminishing returns curve where each additional point of power provides less absolute damage increase, but remains meaningful

---

**Note**: All pickaxes now deal the same base damage calculation. Damage scaling comes entirely from Power using the formula above. Pickaxes provide speed, luck, and sell value multipliers instead.

---

## 4. Training Rock Balance (UPDATED - 6 Rocks with Flat Power Bonuses)

### Training Rock System Overview
- **6 Training Rocks** total
- **Rock 1**: Power gain scales with rebirth count using a piecewise function
- **Rock 2**: Power gain scales with rebirth count using a piecewise function
- **Rock 3**: Power gain scales with rebirth count using a piecewise function
- **Rock 4**: Power gain scales with rebirth count using a piecewise function
- **Rock 6**: Power gain scales with rebirth count using a piecewise function
- Each rock requires EITHER a power threshold OR rebirth count to unlock
- Once unlocked, rocks remain available for training
- Higher-tier rocks provide significantly more power per hit

### Rock 1 Power Gain Formula (Piecewise Function Based on Rebirths)

Rock 1's power gain per hit scales with rebirth count (x = rebirths, y = power per hit):

```
For 1 <= x <= 36:
  y(x) = floor((x + 4) / 5)

For 36 < x <= 457:
  y(x) = floor((x + 7) / 6)

For x >= 2510:
  y(x) = floor(x / 10 + 0.5)
```

**Notes**:
- Function uses floor operations to ensure integer power values
- Power gain increases with rebirth count for Rock 1
- **Note**: Function is not defined for 457 < x < 2510 - this gap should be handled in implementation
- Higher rebirth count = more power per hit when training on Rock 1

### Rock 2 Power Gain Formula (Piecewise Function Based on Rebirths)

Rock 2's power gain per hit scales with rebirth count (x = rebirths, y = power per hit):

```
For 1 <= x < 57:
  y(x) = floor(x / 5)

For 57 <= x < 2510:
  y(x) = floor(0.15x + 2.5)

For x >= 2510:
  y(x) = floor(0.15x + 2)
```

**Notes**:
- Function uses floor operations to ensure integer power values
- Power gain increases with rebirth count for Rock 2
- Higher rebirth count = more power per hit when training on Rock 2

### Rock 3 Power Gain Formula (Piecewise Function Based on Rebirths)

Rock 3's power gain per hit scales with rebirth count (x = rebirths, y = power per hit):

```
For 1 <= x <= 47:
  y(x) = floor(0.8x + 7)

For 47 < x < 2510:
  y(x) = floor(0.75x + 8)

For x >= 2510:
  y(x) = floor(0.75x)
```

**Notes**:
- Function uses floor operations to ensure integer power values
- Power gain increases with rebirth count for Rock 3
- Higher rebirth count = more power per hit when training on Rock 3

### Rock 4 Power Gain Formula (Piecewise Function Based on Rebirths)

Rock 4's power gain per hit scales with rebirth count (x = rebirths, y = power per hit):

```
For x <= 457:
  y(x) = RH((9x + 91) / 4)

For 457 < x <= 2510:
  y(x) = RH(1051 + (4613 / 2053) * (x - 457))

For 2510 < x <= 3760:
  y(x) = RH(5664 + (1407 / 625) * (x - 2510))

For 3760 < x <= 6260:
  y(x) = RH(8478 + (2813 / 1250) * (x - 3760))

For 6260 < x <= 20260:
  y(x) = RH((9x / 4) + 19)

For 20260 < x <= 59040:
  y(x) = RH(45604 + (21824 / 9695) * (x - 20260))

For 59040 < x <= 209040:
  y(x) = RH((9x / 4) + 60)

For x > 209040:
  y(x) = RH((4297 / 1910) * x + (21912 / 191))
```

**Notes**:
- Function uses RH() rounding operations (likely "Round Half" or similar rounding function)
- Power gain increases with rebirth count for Rock 4
- Function has 8 distinct pieces covering different rebirth ranges
- Higher rebirth count = more power per hit when training on Rock 4

### Rock 5 Power Gain Formula (Piecewise Linear Function Based on Rebirths)

Rock 5's power gain per hit scales with rebirth count (x = rebirths, y = power per hit) using a piecewise linear function defined by 32 knot points:

**Function Definition**:
```
For x_i <= x <= x_{i+1} (between consecutive knot points):
  y(x) = y_i + ((y_{i+1} - y_i) / (x_{i+1} - x_i)) * (x - x_i)

For x >= 400040:
  y(x) = 4x - 160
```

**Knot Points (x, y) in order**:
1. (1, 44)
2. (6, 64)
3. (11, 84)
4. (16, 104)
5. (21, 124)
6. (26, 144)
7. (31, 164)
8. (36, 184)
9. (41, 204)
10. (47, 228)
11. (57, 268)
12. (77, 348)
13. (97, 428)
14. (117, 508)
15. (137, 588)
16. (157, 668)
17. (207, 869)
18. (257, 1068)
19. (307, 1268)
20. (357, 1468)
21. (457, 1868)
22. (2510, 10069)
23. (3760, 15072)
24. (6260, 25073)
25. (12760, 51703)
26. (20260, 81072)
27. (59040, 236200)
28. (79040, 316200)
29. (119040, 476200)
30. (129040, 516200)
31. (209040, 836200)
32. (400040, 1600000)

**Notes**:
- Function uses linear interpolation between consecutive knot points
- For x >= 400040, the function follows the linear equation y = 4x - 160
- Power gain increases with rebirth count for Rock 5
- Function passes through all 32 specified knot points exactly
- Higher rebirth count = more power per hit when training on Rock 5

### Rock 6 Power Gain Formula (Piecewise Linear Function Based on Rebirths)

Rock 6's power gain per hit scales with rebirth count (x = rebirths, y = power per hit) using a piecewise linear function defined by 32 knot points:

**Function Definition**:
```
For x_i <= x <= x_{i+1} (between consecutive knot points):
  y(x) = y_i + ((y_{i+1} - y_i) / (x_{i+1} - x_i)) * (x - x_i)

For x >= 400040:
  y(x) = 5.75x - 100230
```

**Knot Points (x, y) in order**:
1. (1, 620)
2. (6, 650)
3. (11, 680)
4. (16, 710)
5. (21, 740)
6. (26, 770)
7. (31, 800)
8. (36, 830)
9. (41, 860)
10. (47, 900)
11. (57, 970)
12. (77, 1120)
13. (97, 1270)
14. (117, 1420)
15. (137, 1570)
16. (157, 1720)
17. (207, 2000)
18. (257, 2150)
19. (307, 1849)
20. (357, 2141)
21. (457, 2724)
22. (2510, 14683)
23. (3760, 21980)
24. (6260, 36564)
25. (12760, 74480)
26. (20260, 118200)
27. (59040, 344400)
28. (79040, 461100)
29. (119040, 694400)
30. (129040, 752800)
31. (209040, 1200000)
32. (400040, 2300000)

**Notes**:
- Function uses linear interpolation between consecutive knot points
- For x >= 400040, the function follows the linear equation y = 5.75x - 100230
- Power gain increases with rebirth count for Rock 6
- Function passes through all 32 specified knot points exactly
- Higher rebirth count = more power per hit when training on Rock 6

### Training Rock Database

| Rock # | UI Display (Power Gain) | Unlock Requirement (Power) | Unlock Requirement (Rebirths) | Actual Power Gain | Best For |
|--------|------------------------|----------------------------|-------------------------------|-------------------|----------|
| Rock 1 (Dirt) | +1 Power | FREE (always available) | FREE (always available) | Piecewise function (scales with rebirths) | Early game, scales with rebirths |
| Rock 2 (Cobblestone) | +3 Power | 250 Power | 5 Rebirths | Piecewise function (scales with rebirths) | Early game progression, scales with rebirths |
| Rock 3 (Iron Deepslate) | +15 Power | 5,000 Power | 15 Rebirths | Piecewise function (scales with rebirths) | Early-mid game, scales with rebirths |
| Rock 4 (Gold Deepslate) | +45 Power | 75,000 Power | 50 Rebirths | Piecewise function (scales with rebirths) | Mid game, scales with rebirths |
| Rock 5 (Diamond Deepslate) | +80 Power | 500,000 Power | 250 Rebirths | Piecewise function (scales with rebirths) | Late game, scales with rebirths |
| Rock 6 (Emerald Deepslate) | +175 Power | 10,000,000 Power | 1,000 Rebirths | Piecewise function (scales with rebirths) | End game, scales with rebirths |

**Note**: The "UI Display" column shows the static power value displayed in the training area UI cards. The actual power gain per hit uses piecewise functions based on rebirth count as defined in the formulas above.

### Unlock Mechanism
- **Dual Requirements**: Each rock (except Rock 1) can be unlocked via either:
  - **Power Path**: Reaching the required power threshold through training/mining
  - **Rebirth Path**: Reaching the required rebirth count
- Players can unlock rocks using whichever path they achieve first
- Once a rock is unlocked, it remains permanently available
- No need to maintain the requirement - unlocking is permanent

### Training Rock Progression Strategy

**Early Game (Rock 1 - Dirt - Scaling Power Based on Rebirths)**:
- UI Display: "+1 Power" (shows "FREE")
- Always available, no requirements
- Starting point for all players
- Power gain per hit scales with rebirth count using piecewise function (see Rock 1 Power Formula above)
- Starts at 1 power per hit (1 rebirth)
- Increases with rebirth count
- Good for initial power accumulation and continues to scale with rebirth progression

**Early Game Progression (Rock 2 - Cobblestone - Scaling Power Based on Rebirths)**:
- UI Display: "+3 Power"
- Unlock at 250 Power OR 5 Rebirths
- Power gain per hit scales with rebirth count using piecewise function (see Rock 2 Power Formula above)
- Significant early game boost that continues to scale with rebirth progression

**Early-Mid Game (Rock 3 - Iron Deepslate - Scaling Power Based on Rebirths)**:
- UI Display: "+15 Power"
- Unlock at 5,000 Power OR 15 Rebirths
- Power gain per hit scales with rebirth count using piecewise function (see Rock 3 Power Formula above)
- Major progression milestone that continues to scale with rebirth progression

**Mid Game (Rock 4 - Gold Deepslate - Scaling Power Based on Rebirths)**:
- UI Display: "+45 Power"
- Unlock at 75,000 Power OR 50 Rebirths
- Power gain per hit scales with rebirth count using piecewise function (see Rock 4 Power Formula above)
- Substantial mid-game acceleration that continues to scale with rebirth progression

**Late Game (Rock 5 - Diamond Deepslate - Scaling Power Based on Rebirths)**:
- UI Display: "+80 Power"
- Unlock at 500,000 Power OR 250 Rebirths
- Power gain per hit scales with rebirth count using piecewise linear function defined by 32 knot points (see Rock 5 Power Formula above)
- Starts at 44 power per hit (1 rebirth) and increases with rebirth count
- Late game power farming that continues to scale with rebirth progression

**End Game (Rock 6 - Emerald Deepslate - Scaling Power Based on Rebirths)**:
- UI Display: "+175 Power"
- Unlock at 10,000,000 Power OR 1,000 Rebirths
- Power gain per hit scales with rebirth count using piecewise linear function defined by 32 knot points (see Rock 6 Power Formula above)
- Starts at 620 power per hit (1 rebirth) and increases with rebirth count
- Maximum power generation rate that continues to scale with rebirth progression

---


## 5. Power Constants & Formulas

### Recommended Constants

```typescript
// Damage Formula Constants
EARLY_BOOST_DIVISOR = 398107.17        // Early boost scaling constant
EARLY_BOOST_EXPONENT = 0.3              // Early boost power exponent
DAMAGE_COEFFICIENT = 0.072              // Damage coefficient
DAMAGE_POWER_EXPONENT = 0.553           // Power exponent for damage scaling
BASE_DAMAGE = 1                         // Base damage constant

REBIRTH_POWER_THRESHOLD = 1000         // Power needed to rebirth (keep at 1000)

// Training Rock Power Bonuses
ROCK_POWER_BONUSES = {
  1: "piecewise_function",  // Rock 1: Uses piecewise function based on rebirths (see Rock 1 Power Formula)
  2: "piecewise_function",  // Rock 2: Uses piecewise function based on rebirths (see Rock 2 Power Formula)
  3: "piecewise_function",  // Rock 3: Uses piecewise function based on rebirths (see Rock 3 Power Formula)
  4: "piecewise_function",  // Rock 4: Uses piecewise function based on rebirths (see Rock 4 Power Formula)
  5: "piecewise_function",  // Rock 5: Uses piecewise linear function based on rebirths (see Rock 5 Power Formula)
  6: "piecewise_function",  // Rock 6: Uses piecewise linear function based on rebirths (see Rock 6 Power Formula)
}

// Rock 1 Power Gain Function (x = rebirths, y = power per hit)
// For 1 <= x <= 36: y(x) = floor((x + 4) / 5)
// For 36 < x <= 457: y(x) = floor((x + 7) / 6)
// For x >= 2510: y(x) = floor(x / 10 + 0.5)
// Note: Function not defined for 457 < x < 2510 - implementation should handle this gap

// Rock 2 Power Gain Function (x = rebirths, y = power per hit)
// For 1 <= x < 57: y(x) = floor(x / 5)
// For 57 <= x < 2510: y(x) = floor(0.15x + 2.5)
// For x >= 2510: y(x) = floor(0.15x + 2)

// Rock 3 Power Gain Function (x = rebirths, y = power per hit)
// For 1 <= x <= 47: y(x) = floor(0.8x + 7)
// For 47 < x < 2510: y(x) = floor(0.75x + 8)
// For x >= 2510: y(x) = floor(0.75x)

// Rock 4 Power Gain Function (x = rebirths, y = power per hit, RH = rounding function)
// For x <= 457: y(x) = RH((9x + 91) / 4)
// For 457 < x <= 2510: y(x) = RH(1051 + (4613 / 2053) * (x - 457))
// For 2510 < x <= 3760: y(x) = RH(5664 + (1407 / 625) * (x - 2510))
// For 3760 < x <= 6260: y(x) = RH(8478 + (2813 / 1250) * (x - 3760))
// For 6260 < x <= 20260: y(x) = RH((9x / 4) + 19)
// For 20260 < x <= 59040: y(x) = RH(45604 + (21824 / 9695) * (x - 20260))
// For 59040 < x <= 209040: y(x) = RH((9x / 4) + 60)
// For x > 209040: y(x) = RH((4297 / 1910) * x + (21912 / 191))

// Rock 5 Power Gain Function (x = rebirths, y = power per hit, piecewise linear with 32 knot points)
// For x_i <= x <= x_{i+1}: y(x) = y_i + ((y_{i+1} - y_i) / (x_{i+1} - x_i)) * (x - x_i)
// For x >= 400040: y(x) = 4x - 160
// Knot points: (1,44), (6,64), (11,84), (16,104), (21,124), (26,144), (31,164), (36,184), (41,204), (47,228), 
//              (57,268), (77,348), (97,428), (117,508), (137,588), (157,668), (207,869), (257,1068), (307,1268), 
//              (357,1468), (457,1868), (2510,10069), (3760,15072), (6260,25073), (12760,51703), (20260,81072), 
//              (59040,236200), (79040,316200), (119040,476200), (129040,516200), (209040,836200), (400040,1600000)

// Rock 6 Power Gain Function (x = rebirths, y = power per hit, piecewise linear with 32 knot points)
// For x_i <= x <= x_{i+1}: y(x) = y_i + ((y_{i+1} - y_i) / (x_{i+1} - x_i)) * (x - x_i)
// For x >= 400040: y(x) = 5.75x - 100230
// Knot points: (1,620), (6,650), (11,680), (16,710), (21,740), (26,770), (31,800), (36,830), (41,860), (47,900),
//              (57,970), (77,1120), (97,1270), (117,1420), (137,1570), (157,1720), (207,2000), (257,2150), (307,1849),
//              (357,2141), (457,2724), (2510,14683), (3760,21980), (6260,36564), (12760,74480), (20260,118200),
//              (59040,344400), (79040,461100), (119040,694400), (129040,752800), (209040,1200000), (400040,2300000)

// Training Rock Unlock Requirements
ROCK_UNLOCK_REQUIREMENTS = {
  1: { power: 0, rebirths: 0 },           // Always available
  2: { power: 250, rebirths: 5 },
  3: { power: 5000, rebirths: 15 },
  4: { power: 75000, rebirths: 50 },
  5: { power: 500000, rebirths: 250 },
  6: { power: 10000000, rebirths: 1000 }
}
```

### Why These Values Work

1. **Damage Formula Constants** (UPDATED)
   - **EarlyBoost Formula**: Provides enhanced damage scaling at lower power levels
     - When Power is low, EarlyBoost provides significant multiplier (up to 3× at very low power)
     - As Power approaches 398107.17, EarlyBoost approaches 1 (no additional boost)
   - **Damage Formula**: Uses Power^0.553 for smooth non-linear scaling
     - The 0.553 exponent creates diminishing returns where each additional power provides meaningful but decreasing absolute damage gains
     - Combined with EarlyBoost, creates strong early game scaling that smooths out in late game
   - **Design Goal**: Training provides meaningful progression without trivializing content
     - Early game: Strong scaling from EarlyBoost helps new players feel progress quickly
     - Late game: Power^0.553 provides steady progression without breaking balance

2. **Training Rock Power Bonuses** (UPDATED)
   - **Rock 1**: Uses piecewise function based on rebirth count, scales from 1+ power per hit
   - **Rock 2**: Uses piecewise function based on rebirth count, scales with rebirths, early unlock (250 Power OR 5 Rebirths)
   - **Rock 3**: Uses piecewise function based on rebirth count, scales with rebirths, significant milestone (5K Power OR 15 Rebirths)
   - **Rock 4**: Uses piecewise function based on rebirth count, scales with rebirths, mid-game boost (75K Power OR 50 Rebirths)
   - **Rock 5**: Uses piecewise linear function based on rebirth count, scales with rebirths, late game (500K Power OR 250 Rebirths)
   - **Rock 6**: Uses piecewise linear function based on rebirth count, scales with rebirths, end game (10M Power OR 1K Rebirths)
   - Progression provides clear milestones and incentives
   - Rock 1's scaling with rebirths provides ongoing progression without needing to unlock new rocks

3. **Dual Unlock Paths** (NEW)
   - Players can unlock rocks via **Power Path** (training/mining) OR **Rebirth Path** (rebirth count)
   - Provides flexibility - players can choose their progression style
   - Rebirth path allows faster access to higher-tier rocks for players focused on rebirths
   - Power path rewards players who focus on training/mining progression

### Complete Formula Summary (UPDATED)

#### Power Gain Formula (UPDATED - All Rocks Scale with Rebirths)
```
For Rock 1:
PowerPerHit = Rock1PowerBonus(rebirths)
  - Uses piecewise function: see Rock 1 Power Formula above

For Rock 2:
PowerPerHit = Rock2PowerBonus(rebirths)
  - Uses piecewise function: see Rock 2 Power Formula above

For Rock 3:
PowerPerHit = Rock3PowerBonus(rebirths)
  - Uses piecewise function: see Rock 3 Power Formula above

For Rock 4:
PowerPerHit = Rock4PowerBonus(rebirths)
  - Uses piecewise function: see Rock 4 Power Formula above

For Rock 5:
PowerPerHit = Rock5PowerBonus(rebirths)
  - Uses piecewise linear function: see Rock 5 Power Formula above

For Rock 6:
PowerPerHit = Rock6PowerBonus(rebirths)
  - Uses piecewise linear function: see Rock 6 Power Formula above

PowerPerSecond = PowerPerHit × SwingRate
```

**REBALANCED**: All rocks' (Rocks 1-6) power gain scale with rebirth count using piecewise functions. Training swing rate scales with pickaxe tier (mining speed), but power per hit is determined by the selected rock and rebirth count.

#### Mining Damage Formula (UPDATED)
```
EarlyBoost = 1 + 2 / (1 + (Power / 398107.17)^0.3)

Damage = 1 + 0.072 * Power^0.553 * EarlyBoost
```

**Where**:
- `Power` is the player's current power stat (input)
- `EarlyBoost` is a scaling factor that provides enhanced damage scaling at lower power levels
- `Damage` is the resulting mining damage (output)

**REBALANCED**: Damage now comes from Power only using a power-based scaling formula, not pickaxes.

### Complete Mining Formula Integration

Power integrates into the complete mining system as follows:

```
BlockHP = FirstHealth + ((CurrentDepth - FirstDepth) / (LastDepth - FirstDepth)) × (LastHealth - FirstHealth)
  - Linear interpolation between first and last health based on depth

EarlyBoost = 1 + 2 / (1 + (Power / 398107.17)^0.3)
MiningDamage = 1 + 0.072 * Power^0.553 * EarlyBoost
  - Power is the player's current power stat (input)
  - EarlyBoost provides enhanced scaling at lower power levels
  - Damage is calculated from power using power-based formula (pickaxes don't affect damage)

SwingsNeeded = BlockHP / MiningDamage
SwingRate = BaseSwingRate × (1 + PickaxeSpeedBonus / 100)
  - BaseSwingRate = 2.0 swings/second (0.5s per swing)
  - PickaxeSpeedBonus is percentage increase (0% to 4,000,000%+)
  - Example: Speed = 5.0 means +5% = 2.0 × 1.05 = 2.1 swings/sec
  - Example: Speed = 30.0 means +30% = 2.0 × 1.30 = 2.6 swings/sec
  
TimePerBlock = SwingsNeeded / SwingRate
TimePerLevel = TimePerBlock × 1 (since each level = 1 block)
```

**Key Points**:
- Power is the ONLY source of mining damage using the power-based scaling formula
- Pickaxes affect swing rate (speed) but not damage
- Higher power = fewer swings needed = faster progression
- Damage scales non-linearly with power (Power^0.553) with enhanced early game scaling from EarlyBoost

---


## 6. Power & Rebirth Integration

### Rebirth Core Concept (UPDATED)

**Rebirth = Reset + Training Rock Unlock Path**

- Player spends Power to perform a rebirth
- Rebirths serve as an **alternative unlock requirement** for training rocks
- Power is reset to a base value (typically 1)
- Rebirths are permanent and cumulative
- **NOTE**: Rebirths no longer directly multiply power gain - they unlock higher-tier training rocks faster via the rebirth path
- Players can unlock rocks via either power accumulation OR rebirth count (whichever they achieve first)

### Rebirth Cost Formula (UPDATED - Piecewise Linear Function)

**NEW SYSTEM**: Rebirth cost uses a piecewise linear function with multiple segments. Each segment increases cost by 500 power per rebirth, with different base costs at segment boundaries.

**Cost Function** (where x = rebirth number, y = cost in power):

**Note**: The formula for x between 1 and 6 was not provided. Based on continuity requirements (cost at x=6 must be 3500), the inferred formula is:
- For x between 1 and 6: `y = 500(x - 1) + 1000`

**Provided Formulas**:
- For x between 6 and 11: `y = 500(x - 6) + 3500`
- For x between 11 and 16: `y = 500(x - 11) + 6000`
- For x between 16 and 21: `y = 500(x - 16) + 8500`
- For x between 21 and 26: `y = 500(x - 21) + 11000`
- For x between 26 and 31: `y = 500(x - 26) + 13500`
- For x between 31 and 36: `y = 500(x - 31) + 16000`
- For x between 36 and 41: `y = 500(x - 36) + 18500`
- For x between 41 and 47: `y = 500(x - 41) + 21000`
- For x between 47 and 57: `y = 500(x - 47) + 24000`
- For x between 57 and 77: `y = 500(x - 57) + 29000`
- For x between 77 and 97: `y = 500(x - 77) + 39000`
- For x between 97 and 117: `y = 500(x - 97) + 49000`
- For x between 117 and 137: `y = 500(x - 117) + 59000`
- For x between 137 and 157: `y = 500(x - 137) + 69000`
- For x between 157 and 207: `y = 500(x - 157) + 79000`
- For x between 207 and 257: `y = 500(x - 207) + 104000`
- For x between 257 and 307: `y = 500(x - 257) + 129000`
- For x between 307 and 357: `y = 500(x - 307) + 154000`
- For x between 357 and 457: `y = 500(x - 357) + 179000`
- For x between 457 and 2510: `y = 500(x - 457) + 229000`
- For x between 2510 and 3760: `y = 500(x - 2510) + 1250000`
- For x ≥ 3760: `y = 500(x - 3760) + 1880000`

**Implementation**:
```typescript
function calculateRebirthCost(rebirths: number): number {
  const x = rebirths;
  
  // Infer formula for x=1-6 (ensures continuity at x=6)
  if (x >= 1 && x < 6) {
    return 500 * (x - 1) + 1000;
  }
  // Provided formulas
  else if (x >= 6 && x < 11) {
    return 500 * (x - 6) + 3500;
  }
  else if (x >= 11 && x < 16) {
    return 500 * (x - 11) + 6000;
  }
  else if (x >= 16 && x < 21) {
    return 500 * (x - 16) + 8500;
  }
  else if (x >= 21 && x < 26) {
    return 500 * (x - 21) + 11000;
  }
  else if (x >= 26 && x < 31) {
    return 500 * (x - 26) + 13500;
  }
  else if (x >= 31 && x < 36) {
    return 500 * (x - 31) + 16000;
  }
  else if (x >= 36 && x < 41) {
    return 500 * (x - 36) + 18500;
  }
  else if (x >= 41 && x < 47) {
    return 500 * (x - 41) + 21000;
  }
  else if (x >= 47 && x < 57) {
    return 500 * (x - 47) + 24000;
  }
  else if (x >= 57 && x < 77) {
    return 500 * (x - 57) + 29000;
  }
  else if (x >= 77 && x < 97) {
    return 500 * (x - 77) + 39000;
  }
  else if (x >= 97 && x < 117) {
    return 500 * (x - 97) + 49000;
  }
  else if (x >= 117 && x < 137) {
    return 500 * (x - 117) + 59000;
  }
  else if (x >= 137 && x < 157) {
    return 500 * (x - 137) + 69000;
  }
  else if (x >= 157 && x < 207) {
    return 500 * (x - 157) + 79000;
  }
  else if (x >= 207 && x < 257) {
    return 500 * (x - 207) + 104000;
  }
  else if (x >= 257 && x < 307) {
    return 500 * (x - 257) + 129000;
  }
  else if (x >= 307 && x < 357) {
    return 500 * (x - 307) + 154000;
  }
  else if (x >= 357 && x < 457) {
    return 500 * (x - 357) + 179000;
  }
  else if (x >= 457 && x < 2510) {
    return 500 * (x - 457) + 229000;
  }
  else if (x >= 2510 && x < 3760) {
    return 500 * (x - 2510) + 1250000;
  }
  else if (x >= 3760) {
    return 500 * (x - 3760) + 1880000;
  }
  
  // Fallback for x < 1 (shouldn't happen, but handle gracefully)
  return 1000;
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

### Power Gain System (UPDATED - No Longer Uses Rebirth Multiplier)

**NOTE**: Rebirths no longer multiply power gain directly. Instead, they serve as unlock requirements for training rocks.

**Power gain is now determined by the selected training rock**:
- Rock 1: Piecewise function based on rebirth count (always available, see Rock 1 Power Formula)
- Rock 2: Piecewise function based on rebirth count (unlock at 250 Power OR 5 Rebirths, see Rock 2 Power Formula)
- Rock 3: Piecewise function based on rebirth count (unlock at 5K Power OR 15 Rebirths, see Rock 3 Power Formula)
- Rock 4: Piecewise function based on rebirth count (unlock at 75K Power OR 50 Rebirths, see Rock 4 Power Formula)
- Rock 5: Piecewise linear function based on rebirth count (unlock at 500K Power OR 250 Rebirths, see Rock 5 Power Formula)
- Rock 6: Piecewise linear function based on rebirth count (unlock at 10M Power OR 1K Rebirths, see Rock 6 Power Formula)

**Rebirth Benefits**:
- Rebirths provide an alternative unlock path for training rocks
- Higher rebirth counts allow faster access to higher-tier rocks
- Players focused on rebirths can unlock better training rocks earlier via rebirth path

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

## 7. Rebirth System UI & Implementation

### 10.1 UI Layout & Design

#### Rebirth Button (Left Side Middle)

**Position**: Left side, middle of screen (vertically centered, below Pickaxe Shop button)

**Appearance**:
- Blue background with starburst pattern
- Green circular arrow/refresh icon (🔄)
- Clickable button that opens rebirth modal
- Optional: Red notification badge with exclamation mark (if rebirth available)

**Behavior**:
- Clicking opens the Rebirth modal
- Button remains visible when modal is open
- Highlights on hover

#### Rebirth Modal Window

**Layout**:
- Large modal window, centered on screen
- Blue background with geometric pattern (stars, squares, triangles)
- White border, rounded corners
- Red 'X' close button in top-right

**Header Section**:
- **Title**: "Rebirth" (large, bold, white text with black outline)
- **Instruction**: "Click a button to rebirth!" (yellow text with black outline)
- **Separator**: Horizontal line dividing header from content

**Mechanic Explanation**:
- Display: `♻️ 1 = 💥 +10%`
  - ♻️ = Green refresh/recycle icon
  - 1 = White text (number of rebirths)
  - = = White text
  - 💥 = Red explosion icon (power)
  - +10% = Red text (power gain bonus)
- Meaning: "1 Rebirth = +10% Power gain"

**Rebirth Options Section**:
- List of rebirth options, each as a horizontal row
- Dark blue background, white border
- Each row shows:
  - Number of rebirths (green text)
  - Power cost (red text)
  - Action button (green "Rebirth" button or yellow "Max" button)

#### Rebirth Options

**Single Rebirth Options**:
- **1 Rebirth**: Shows "1 Rebirth" (green), power cost (red), "Rebirth" button (green)
- **5 Rebirths**: Shows "5 Rebirths" (green), power cost (red), "Rebirth" button (green)
- **20 Rebirths**: Shows "20 Rebirths" (green), power cost (red), "Rebirth" button (green)

**Max Rebirth Option**:
- Special row with rainbow-colored border (red, orange, yellow, green, blue, purple gradient)
- Shows maximum available rebirths (e.g., "315 Rebirths" in green)
- Shows total power cost (e.g., "472.5K Power" in red)
- Yellow "Max" button with black outline

**Button States**:
- **Available**: Green button, clickable, shows "Rebirth" or "Max"
- **Unavailable**: Grayed out, disabled, if player doesn't have enough power

### 10.2 Rebirth Calculation Logic

#### Calculate Available Rebirths

```typescript
function calculateMaxRebirths(currentPower: number, currentRebirths: number): number {
  let maxRebirths = 0;
  let totalCost = 0;
  
  while (true) {
    const nextCost = calculateRebirthCost(currentRebirths + maxRebirths);
    if (totalCost + nextCost > currentPower) {
      break; // Can't afford more
    }
    totalCost += nextCost;
    maxRebirths++;
    
    // Safety limit (prevent infinite loop)
    if (maxRebirths > 10000) break;
  }
  
  return maxRebirths;
}
```

### 10.3 Data Flow

#### Opening Rebirth Modal

```
User clicks Rebirth button
  → UI sends 'OPEN_REBIRTH_UI' event to server
  → Server responds with 'REBIRTH_UI_DATA':
     - currentPower
     - currentRebirths
     - availableRebirthOptions: [
         { count: 1, cost: calculateRebirthCost(currentRebirths) },
         { count: 5, cost: calculateRebirthCostMultiple(currentRebirths, 5) },
         { count: 20, cost: calculateRebirthCostMultiple(currentRebirths, 20) },
         { count: max, cost: totalMaxCost }
       ]
  → UI renders rebirth modal
```

#### Performing Rebirth

```
User clicks "Rebirth" or "Max" button
  → UI sends 'PERFORM_REBIRTH' event with:
     - rebirthCount: number (1, 5, 20, or max)
  → Server validates:
     - Check if player has enough power
     - Calculate total cost for requested rebirths using calculateRebirthCostMultiple()
     - Verify cost <= currentPower
  → If valid:
     - Deduct power: playerData.power -= totalCost
     - Reset power to base: playerData.power = 1 (or keep deducted amount?)
     - Increase rebirths: playerData.rebirths += rebirthCount
     - Update power gain multiplier (stored in calculations)
     - Send 'REBIRTH_COMPLETE' response
  → UI updates:
     - Close modal or refresh data
     - Update power display in HUD
     - Update rebirths display in HUD
     - Show confirmation message
```

### 10.4 UI Events

#### Client → Server
- `OPEN_REBIRTH_UI` - Request rebirth data
- `PERFORM_REBIRTH` - Execute rebirth (includes count)
- `CLOSE_REBIRTH_UI` - Close rebirth modal

#### Server → Client
- `REBIRTH_UI_DATA` - Rebirth data response
  ```typescript
  {
    type: 'REBIRTH_UI_DATA',
    currentPower: number,
    currentRebirths: number,
    options: Array<{
      count: number,
      cost: number,
      available: boolean
    }>,
    maxRebirths: number,
    maxCost: number
  }
  ```

- `REBIRTH_COMPLETE` - Rebirth execution confirmation
  ```typescript
  {
    type: 'REBIRTH_COMPLETE',
    success: boolean,
    rebirthsPerformed: number,
    newRebirths: number,
    powerSpent: number,
    newPower: number,
    newPowerGainMultiplier: number
  }
  ```

### 10.5 Visual Design Notes

#### Color Scheme
- **Modal Background**: Light blue (#B0E0E6) with geometric pattern
- **Text**: White with black outline for readability
- **Title**: Large, bold, white
- **Instruction**: Yellow (#FFD700)
- **Rebirth Count**: Green (#4CAF50)
- **Power Cost**: Red (#FF5252)
- **Buttons**: 
  - Rebirth button: Green gradient
  - Max button: Yellow with black outline
  - Close button: Red
- **Max Option Border**: Rainbow gradient (red → orange → yellow → green → blue → purple)

#### Icons
- **Refresh Icon**: Green circular arrow (🔄)
- **Power Icon**: Red explosion (💥)
- **Notification Badge**: Red square with white exclamation mark

#### Layout Spacing
- Modal padding: 30px
- Option rows: 12px gap between rows
- Button padding: 12px 24px
- Header margin: 20px bottom

### 10.6 Rebirth Options Configuration

```typescript
const REBIRTH_OPTIONS = [
  { count: 1, label: '1 Rebirth' },
  { count: 5, label: '5 Rebirths' },
  { count: 20, label: '20 Rebirths' },
  { count: 'max', label: 'Max' } // Special case
];
```

#### Cost Display Format
- Format numbers with K/M/B suffixes
- Example: 1,000 → "1K", 472,500 → "472.5K", 1,500,000 → "1.5M"
- Use `formatNumber()` function from UI

### 10.7 Implementation Tasks

#### UI Components
1. **Rebirth Button** (Left side middle)
   - Create button element
   - Style with blue background and refresh icon
   - Position: `left: 40px, top: calc(50% + 80px)` (below pickaxe button)
   - Add click handler to open modal
   - Optional: Add notification badge if rebirth available

2. **Rebirth Modal Window**
   - Create modal container
   - Add close button (red X)
   - Create header section (title, instruction, explanation)
   - Create rebirth options list
   - Style with blue background and pattern

3. **Rebirth Options List**
   - Render predefined options (1, 5, 20)
   - Calculate and display "Max" option
   - Show costs and availability
   - Add click handlers for each option

#### Server-Side Logic
1. **Rebirth Controller Class**
   - Create `RebirthController.ts`
   - Methods:
     - `calculateRebirthCost(rebirths: number): number`
     - `calculateMaxRebirths(power: number, rebirths: number): number`
     - `performRebirth(player: Player, count: number): RebirthResult`
   - Validate power requirements
   - Update player data

2. **Rebirth Data Handler**
   - Handle `OPEN_REBIRTH_UI` event
   - Calculate available rebirth options using new cost function
   - Send `REBIRTH_UI_DATA` response

3. **Rebirth Execution Handler**
   - Handle `PERFORM_REBIRTH` event
   - Validate power and cost using new cost function
   - Execute rebirth (deduct power, increase rebirths, reset power)
   - Update power gain multiplier
   - Send `REBIRTH_COMPLETE` response

---

## 8. Power Persistence & Saving

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

---

## 9. Power UI References

### Power Gain Popup

**Visual Design**:
- Appears every swing during training, showing the exact power gained
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

## 10. Implementation Checklist

### Core Power System
- [x] Training uses same swing rate as mining (already implemented)
- [x] Power gain formula works correctly
- [x] Power to damage formula implemented (EarlyBoost and Damage formulas)
- [ ] Remove pickaxe damage and power bonus (REBALANCED)
- [ ] Implement power-based damage formula (Damage = 1 + 0.072 * Power^0.553 * EarlyBoost)
- [ ] Update training system to remove pickaxe power bonus
- [ ] Update shop UI to show sell multipliers instead of damage/power bonus

### Rebirth System Integration
- [ ] Implement new piecewise linear rebirth cost formula
- [ ] Implement power reset after rebirth
- [ ] Implement power gain multiplier calculation
- [ ] Integrate rebirth multiplier into power gain calculations
- [ ] Create rebirth UI with power cost display
- [ ] Test rebirth power mechanics with new cost function
- [ ] Verify cost function continuity at segment boundaries

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
1. **Power is the ONLY source of mining damage** (damage calculated via power-based formula: Damage = 1 + 0.072 * Power^0.553 * EarlyBoost)
2. **Training is the primary way to gain power** (rocks × rebirths)
3. **Rebirths unlock higher-tier training rocks** (alternative unlock path for rocks)
4. **Training investment is meaningful but balanced** (power scales non-linearly with enhanced early game scaling)
5. **Power scales smoothly from early to late game** (20 power to 200,000+ power using Power^0.553 with EarlyBoost multiplier)
6. **Pickaxes affect training speed** (faster swings = faster power gain) but not damage directly
7. **Pickaxes provide speed, luck, and economic value** instead of damage

**Design Philosophy**: Power enhances mining significantly but doesn't completely replace the need for better pickaxes. The synergy between pickaxes (speed/luck/sell multiplier) and power (damage) creates a balanced progression system.

---

## Document Consolidation Note

**This document is the single source of truth for all power-related planning.**

All power-related content has been consolidated from:
- `ProgressionBalanceBlueprint.md` - Power targets by mining phase, power in progression formulas
- `TrainingPowerBalanceBlueprint.md` - Training and power balance (now redirects here)
- `rebirthSystem.md` - Power mechanics, rebirth integration, and UI implementation (fully merged into this document)
- `ProgressionSaveSystemPlan.md` - Power persistence (references this document)
- UI references - Power gain popup, power display

**This document now contains ALL power and rebirth planning. The separate `rebirthSystem.md` file is no longer needed as all content has been merged here.**

