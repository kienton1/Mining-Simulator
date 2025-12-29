# Gems System Planning Document

## Overview

This document outlines the planning for implementing a secondary currency system called "Gems" in the Mining Simulator game. Gems will function similarly to gold but will be earned through different methods and may have different uses.

## Status

**Current Implementation Status**: Backend and UI infrastructure complete
- ✅ Gems field added to PlayerData
- ✅ Gems persistence (save/load) implemented
- ✅ addGems() method in GameManager
- ✅ Gems UI element added to client
- ✅ Gems state tracking in UI
- ✅ Chest system design documented (see section 1.1)
- ✅ Gem Trader upgrade system design documented (see section 2.1)
- ⏳ Chest system implementation (to be implemented)
- ⏳ Gem Trader upgrade system implementation (to be implemented)

## Core Questions to Answer

### 1. How Should Players Earn Gems?

**Options to consider:**
- [x] **Chest System** (Primary method - see section 1.1)
- [ ] Mining rare ores (e.g., Diamond, Mythril, Cosmic)
- [ ] Completing achievements/milestones
- [ ] Reaching certain depths in the mine
- [ ] Daily login rewards
- [ ] Special events or challenges
- [ ] Rebirth rewards
- [ ] Training rock milestones
- [ ] Boss/mini-boss defeats
- [ ] Other: _______________

**Recommendation**: ✅ **Chest System** (see section 1.1)

### 1.1 Chest System - Primary Gems Earning Method

**Design Philosophy:**
The chest system is built to reinforce risk-reward, player excitement, and long-term progression rather than feeling like a predictable handout. It creates tension through probabilistic events that heighten anticipation.

#### Chest Spawning Mechanics

**Basic Chests:**
- **Spawn Rate**: Purely chance-based probabilistic events
- **Distribution**: Governed by random chance - NO guarantees
- **Expected Average**: Statistically, players may encounter roughly one chest every 20–50 levels on average, but this is NOT guaranteed
- **Variability**: 
  - **Lucky players** can encounter multiple chests in quick succession (more than the average)
  - **Unlucky players** may experience droughts with fewer chests than expected
  - This unpredictability heightens anticipation and creates excitement
  - **No minimum or maximum** - players can get 0 chests or many chests based purely on luck
- **Depth Scaling**: Chest rarity subtly increases with depth, rewarding deeper progression without hard gates
- **Critical**: Each chest spawn is an independent random chance - previous chests do not affect future spawn chances

**Golden Chests:**
- **Spawn Rate**: Rare, high-impact moments based purely on chance
- **Expected Average**: Approximately 3–5 per 1000 levels on average (statistical expectation, NOT a guarantee)
- **Mechanism**: Low percent chance per block - each block has an independent chance to spawn a golden chest
- **Variability**:
  - **Lucky players** can find more than 5 golden chests in 1000 levels
  - **Unlucky players** may find fewer than 3 golden chests in 1000 levels
  - **No minimum or maximum** - players can get 0 golden chests or many golden chests based purely on luck
- **Design Goal**: Preserves prestige and prevents predictability through pure randomness
- **Critical**: Each golden chest spawn is an independent random chance - previous golden chests do not affect future spawn chances

#### Chest Durability & Combat

**Normalized Durability (Combat Readability):**
- **Basic Chests**: 3 hits (meaning we take player damage oer hit and then increase health by 3x)
- **Golden Chests**: 6 hits (meaning we take player damage oer hit and then increase health by 6x)
- **Power Independence**: Durability is consistent regardless of player power
- **Design Goal**: Ensures chests feel like deliberate interactions rather than instant breakables

#### Chest Mining & Depth Progression

**Important Mechanic:**
- **Chests Count as Depth Levels**: When a chest spawns and is successfully mined/broken, it counts as progressing down one depth level
- **Flow**: 
  1. Chest spawns at current depth
  2. Player mines the chest (3 hits for basic, 6 hits for golden)
  3. Chest breaks and awards gems
  4. Player progresses down one depth level
- **Design Rationale**: Chests are integrated into the core mining progression loop, not separate side objectives
- **Implementation Note**: After chest breakage, player depth should increment by 1, just as if they had mined a regular block

#### Reward Structure

**Gems Rewards:**
- **Basic Chests**: 2 gems
- **Golden Chests**: 10 gems
- **Reward Ratio**: 5× payoff (10 gems vs 2 gems)
- **Design Goals**:
  - Creates clear payoff that reinforces rarity
  - Encourages deeper mining
  - Injects short-term excitement into the core mining loop
  - Does not destabilize the economy

#### Implementation Considerations

**Depth Cap**: 1000 levels (chest system operates within this range)

**Key Design Principles:**
1. **Pure chance-based, zero guarantees** - Every chest spawn is an independent random event with no minimums or maximums
2. **True randomness** - Lucky players can get many chests, unlucky players can get few or none - this is intentional and creates excitement
3. **Depth-based rarity scaling** - Rewards progression without hard gates (chance may increase with depth, but still random)
4. **Normalized durability** - Consistent interaction feel regardless of player power
5. **Clear reward differentiation** - 5× multiplier reinforces golden chest prestige
6. **Economy balance** - Rewards are exciting but don't destabilize progression (averages balance out over time)
7. **Integrated progression** - Chests count as depth levels, maintaining mining flow

### 2. How Should Players Spend Gems?

**Options to consider:**
- [x] **Gem Trader Upgrade System** (Primary method - see section 2.1)
- [ ] Premium pickaxes (gems-only or gems + gold)
- [ ] Special upgrades (mine reset, auto-mine, etc.)
- [ ] Cosmetic items
- [ ] Power boosts
- [ ] Inventory expansions
- [ ] Time skips/boosts
- [ ] Other: _______________

**Recommendation**: ✅ **Gem Trader Upgrade System** (see section 2.1)

### 2.1 Gem Trader - Primary Gems Spending Method

**Overview:**
A Gem Trader NPC on the surface that opens an "Upgrades" UI when players get close to it. Players can spend gems to purchase permanent upgrades that enhance various aspects of gameplay.

#### UI Structure

**Upgrades Panel:**
- Dark blue rectangular panel with rounded corners
- Header with:
  - Green "?" help button (top-left)
  - "Upgrades" title (centered, white text with black outline)
  - Red "X" close button (top-right)
- Four upgrade options displayed vertically, each with:
  - Large icon with small upward arrow overlay
  - Title (white text)
  - Effect preview (current value -> next value)
  - Level progress (current/max levels)
  - Cost in gems (green gem icon + amount)
  - Upgrade button ("+" button, red or green based on affordability)

#### Upgrade Types

##### 1. More Gems
- **Purpose**: Increases gem multiplier for chest rewards
- **Display Logic**: 
  - UI shows: "0x -> 1x" for first upgrade, "1x -> 2x" for second, etc.
  - **Backend multiplier is always 1 ahead of display**
  - When UI shows "0x", backend is actually at "1x"
  - When UI shows "1x", backend is actually at "2x"
  - This ensures first upgrade actually provides a benefit
- **Effect**: Each upgrade increases gem multiplier by 1x
- **Level System**: Has maximum levels (exact number TBD)
- **Math Equation**: To be defined later (see section 2.2)
- **Visual**: Green hexagonal gem icon with upward arrow

##### 2. More Rebirths
- **Purpose**: Allows performing multiple rebirths at once instead of one at a time
- **Mechanic**: 
  - Currently, any rebirth resets power to 0
  - This upgrade allows "saving up" power and then rebirthing multiple times in bulk
  - Players can accumulate power and then upgrade rebirths by 10s, 20s, etc.
  - Exact implementation details TBD (see section 2.2)
- **Effect**: Increases the number of rebirths that can be performed simultaneously
- **Level System**: Has maximum levels (exact number TBD)
- **Math Equation**: To be defined later (see section 2.2)
- **Visual**: Green circular refresh/recycle symbol with upward arrow

##### 3. More Coins
- **Purpose**: Multiplier that increases gold/coin gain from selling ores
- **Effect**: Increases coin gain by 10% per upgrade
  - Each level adds 0.1 (10%) to the multiplier
  - Level 0 = 1.0x (100%) - base multiplier
  - Level 1 = 1.1x (110%) - 10% increase
  - Level 2 = 1.2x (120%) - 20% increase
  - Level n = (1.0 + n * 0.1)x = (100 + n * 10)%
  - Formula: `multiplier = 1.0 + (level * 0.1)`
  - Example: 110% -> 120% (shown in UI)
  - Affects monetary gain when selling ores at the merchant
- **Level System**: 160 maximum levels (0-159)
  - Each upgrade increments by 0.1 (10%)
  - Maximum multiplier at level 159: 1.0 + (159 * 0.1) = 16.9x (1690%)
- **Math Equation**: Cost formula defined (see section 2.2)
- **Visual**: Golden coin with star in center, upward arrow

##### 4. More Damage
- **Purpose**: Increases mining damage output
- **Effect**: Increases damage by 10% per upgrade
  - Each level adds 0.1 (10%) to the damage multiplier
  - Level 0 = 1.0x (100%) - base damage
  - Level 1 = 1.1x (110%) - 10% increase
  - Level 2 = 1.2x (120%) - 20% increase
  - Level n = (1.0 + n * 0.1)x = (100 + n * 10)%
  - Formula: `damageMultiplier = 1.0 + (moreDamageLevel * 0.1)`
  - Example: 110% -> 120% (shown in UI)
  - Applied to base mining damage calculation
- **Level System**: 50 maximum levels (0-49)
  - Each upgrade increments by 0.1 (10%)
  - Maximum multiplier at level 49: 1.0 + (49 * 0.1) = 5.9x (590%)
- **Math Equation**: Cost formula defined (see section 2.2)
- **Visual**: Brown pickaxe with grey head, upward arrow

#### Upgrade Purchase Flow

1. Player approaches Gem Trader NPC on surface
2. UI automatically opens (similar to merchant/shop interactions)
3. Player views available upgrades with current levels and costs
4. Player clicks "+" button on desired upgrade
5. System checks if player has enough gems
6. If sufficient:
   - Deduct gems cost
   - Increment upgrade level
   - Apply upgrade effect immediately
   - Update UI to show new level and next cost
7. If insufficient:
   - Button may be disabled/greyed out
   - Show cost vs available gems

#### Cost Structure

- All upgrades cost gems (displayed with green gem icon)
- Costs increase with each level based on mathematical formulas
- Costs displayed in UI (e.g., "1.9K", "810", "106", "275")
- Cost calculation formulas defined in section 2.2

#### Persistence Requirements

**Critical**: All upgrade levels must be persistent across game sessions
- Upgrade levels stored in `PlayerData`
- When player reaches level 10 in "More Gems" upgrade and logs back on, they remain at level 10
- Same persistence applies to all four upgrade types
- Upgrade levels saved automatically when upgraded
- Upgrade levels loaded when player data is loaded

### 2.2 Upgrade Math Equations

#### More Gems Upgrade - Cost Formula

**Cost Calculation:**
```
y = 42.53732814 * e^(0.1985808056 * x) - 50.88152767
```

Where:
- **y** = Cost in gems for the next upgrade
- **x** = Current multiplier level (the upgrade level)
- **e** = Euler's number (~2.71828)

**Formula Details:**
- Exponential growth curve for upgrade costs
- As multiplier level increases, cost grows exponentially
- Formula ensures balanced progression - early upgrades affordable, later upgrades expensive
- Cost is calculated for the **next** upgrade (cost to go from level x to level x+1)

**Example:**
- At level 0 (x=0): Calculate cost to reach level 1
- At level 10 (x=10): Calculate cost to reach level 11
- At level 18 (x=18): Calculate cost to reach level 19

**Implementation Notes:**
- Round result to nearest integer for gem cost
- Ensure cost is never negative (use max(0, calculated_cost))
- Display cost in UI using formatNumber() for large values (e.g., "1.9K")

#### More Rebirths Upgrade - Cost Formula

**Cost Calculation:**
```
y = 177.8192150860 * e^(0.1936304553 * x) - 205.8098819448
```

Where:
- **y** = Cost in gems for the next upgrade
- **x** = Current upgrade level
- **e** = Euler's number (~2.71828)

**Formula Details:**
- Exponential growth curve for upgrade costs
- As upgrade level increases, cost grows exponentially
- Formula ensures balanced progression - early upgrades affordable, later upgrades expensive
- Cost is calculated for the **next** upgrade (cost to go from level x to level x+1)

**Example:**
- At level 0 (x=0): Calculate cost to reach level 1
- At level 8 (x=8): Calculate cost to reach level 9
- At level 35 (x=35): Calculate cost to reach level 36 (max level)

**Implementation Notes:**
- Round result to nearest integer for gem cost
- Ensure cost is never negative (use max(0, calculated_cost))
- Display cost in UI using formatNumber() for large values (e.g., "810")

**More Rebirths Value:**
- Each upgrade level increases the number of rebirths that can be performed simultaneously
- Level 0 = 1 rebirth at a time (default)
- Level 1 = 2 rebirths at a time
- Level 2 = 3 rebirths at a time
- Level n = (n + 1) rebirths at a time
- Allows players to "save up" power and then perform multiple rebirths in bulk

#### More Damage Upgrade (To Be Defined)

- **More Damage Percentage Multiplier Formula**: TBD
- **More Damage Cost Scaling Formula**: TBD
- **More Damage Level Cap**: TBD

### 3. Gems Economy Balance

**Questions:**
- What should be the typical gems earning rate compared to gold?
- Should gems be rarer than gold or more common?
- What should gems-to-gold conversion rate be (if any)?
- Should there be a gems shop separate from the gold shop?

**Recommendation**: TBD

### 4. UI/UX Considerations

**Current Implementation:**
- Gems display in HUD (similar to gold)
- Green color scheme (#4caf50)
- Uses 💎 emoji icon

**Gem Trader UI:**
- "Upgrades" panel with four upgrade types
- Cost displayed in gems (green gem icon)
- Level progress indicators (current/max)
- Effect previews (current -> next value)
- Upgrade buttons with affordability states

**Mining Target Display:**
- **Location**: Bottom center of screen, above the level progression bar
- **Components**:
  - **Ore/Chest Name**: Displayed at the top in large, bold text with outline
  - **Health Bar**: Shows current HP / max HP with visual progress bar
  - **Reward Display**: 
    - For **Ores**: Shows sell value in gold (🪙 icon, yellow color) - calculated with pickaxe multiplier and More Coins upgrade
    - For **Chests**: Shows gem reward (💎 icon, green color) - calculated with More Gems upgrade multiplier
- **Behavior**: 
  - Updates in real-time as player mines (HP decreases, health bar fills down)
  - Only visible when actively mining a block/chest
  - Automatically hides when no target is being mined
- **Design**: 
  - Health bar uses green gradient fill
  - Name uses white text with black outline for readability
  - Reward display uses appropriate colors (gold for coins, green for gems)
  - Positioned above progress bar to avoid overlap

**Future Considerations:**
- Should gems appear in transaction notifications?
- Should there be a gems earning popup (like power gain popup)?
- Should upgrade effects have visual feedback when applied?

**Recommendation**: ✅ Gem Trader UI implemented as primary spending method
✅ Mining Target Display implemented with sell value and gem rewards

## Implementation Checklist

### Phase 1: Earning Methods - Chest System
- [ ] Implement chest spawning system
  - [ ] Basic chest probabilistic spawn logic (pure chance-based, ~20-50 level average expectation, but no guarantees)
  - [ ] Golden chest rare spawn logic (pure chance-based, ~3-5 per 1000 levels average expectation, but no guarantees - lucky players can get more, unlucky players can get fewer)
  - [ ] Depth-based rarity scaling (chance may increase with depth, but still random)
  - [ ] Ensure each spawn is independent random chance (no tracking minimums/maximums)
- [ ] Implement chest entities/blocks
  - [ ] Basic chest model/visual
  - [ ] Golden chest model/visual
  - [ ] Chest placement in mine generation
- [ ] Implement chest durability system
  - [ ] Basic chest: 3 hits (~290 HP)
  - [ ] Golden chest: 6 hits (~580 HP)
  - [ ] Normalized damage (power-independent)
- [ ] Implement chest breaking/reward logic
  - [ ] Detect chest breakage
  - [ ] Award gems (2 for basic, 10 for golden)
  - [ ] Trigger gems earning notifications/feedback
  - [ ] **Increment player depth by 1 after chest breakage** (chests count as depth progression)
- [ ] Test chest spawn rates and balance
- [ ] Test gems earning rates and economy impact

### Phase 2: Spending Methods - Gem Trader Upgrade System
- [ ] Implement Gem Trader NPC entity
  - [ ] Create NPC on surface world
  - [ ] Proximity detection for UI trigger
  - [ ] NPC visual/appearance
- [ ] Implement Upgrades UI
  - [ ] Create "Upgrades" panel layout
  - [ ] Header with title, help button, close button
  - [ ] Four upgrade option displays
  - [ ] Upgrade button states (enabled/disabled based on gems)
  - [ ] Cost display formatting
  - [ ] Level progress display
- [ ] Implement upgrade data structure
  - [ ] Add upgrade levels to PlayerData interface (persistent storage)
    - [ ] moreGemsLevel (number)
    - [ ] moreRebirthsLevel (number)
    - [ ] moreCoinsLevel (number)
    - [ ] moreDamageLevel (number)
  - [ ] Initialize upgrade levels to 0 in createDefaultPlayerData()
  - [ ] Add upgrade levels to persistence validation and merging
  - [ ] Define upgrade effect calculations
  - [x] Implement More Gems cost formula: `y = 42.53732814 * e^(0.1985808056 * x) - 50.88152767`
  - [x] Implement More Rebirths cost formula: `y = 177.8192150860 * e^(0.1936304553 * x) - 205.8098819448`
  - [x] Implement More Coins cost formula: `y(x) = 47.83460235 * x^(1.395013237) * e^(0.375345887 * x)`
  - [x] Implement More Coins multiplier: `sellMultiplier = 1.0 + (moreCoinsLevel * 0.1)` in SellingSystem
  - [x] Implement More Damage cost formula: `y = 82.727459 * e^(1.515705435 * x) - 95.266667`
  - [x] Implement More Damage multiplier: `damageMultiplier = 1.0 + (moreDamageLevel * 0.1)` in StatCalculator/MiningSystem
- [ ] Implement upgrade purchase logic
  - [ ] Validate gems availability
  - [ ] Deduct gems cost
  - [ ] Increment upgrade level
  - [ ] Apply upgrade effects
  - [ ] Update UI state
- [ ] Implement upgrade effects
  - [ ] More Gems: Apply multiplier to chest rewards (with backend offset logic)
  - [ ] More Rebirths: Enable bulk rebirth functionality
  - [ ] More Coins: Apply percentage multiplier to ore selling
  - [ ] More Damage: Apply percentage multiplier to mining damage
- [ ] Add gems spending validation
- [ ] Test upgrade purchase flow
- [ ] Test upgrade effect application
- [ ] Balance upgrade costs and effects

### Phase 3: Balance & Polish
- [ ] Balance gems earning rates
- [ ] Balance gems costs
- [ ] Add gems-related achievements (if applicable)
- [ ] Add gems tooltips/help text
- [ ] Test full gems economy

## Technical Notes

### Backend
- Gems stored in `PlayerData.gems` (number)
- Use `gameManager.addGems(player, amount)` to add gems
- Gems automatically saved/loaded with player data
- Gems sent to UI via `POWER_STATS` and `GEMS_STATS` events

**Upgrade Levels (Persistent Storage):**
- Upgrade levels stored in `PlayerData` interface:
  - `moreGemsLevel: number` - Current "More Gems" upgrade level
  - `moreRebirthsLevel: number` - Current "More Rebirths" upgrade level
  - `moreCoinsLevel: number` - Current "More Coins" upgrade level
  - `moreDamageLevel: number` - Current "More Damage" upgrade level
- Upgrade levels initialized to 0 for new players
- Upgrade levels automatically saved/loaded with player data via PersistenceManager
- Upgrade levels persist across game sessions (if player is level 10, stays level 10 on rejoin)

**Upgrade Calculations:**
- More Gems cost: `y = 42.53732814 * e^(0.1985808056 * x) - 50.88152767` where x = current level
- More Rebirths cost: `y = 177.8192150860 * e^(0.1936304553 * x) - 205.8098819448` where x = current level
- More Coins cost: `y(x) = 47.83460235 * x^(1.395013237) * e^(0.375345887 * x)` where x = current level
- More Coins multiplier: `sellMultiplier = 1.0 + (moreCoinsLevel * 0.1)` - applied to ore sales
- More Damage cost: `y = 82.727459 * e^(1.515705435 * x) - 95.266667` where x = current level
- More Damage multiplier: `damageMultiplier = 1.0 + (moreDamageLevel * 0.1)` - applied to mining damage
- Upgrade effects applied in relevant game systems (mining, selling, rebirth, chest rewards)

### Frontend
- Gems state tracked in `state.gems`
- Gems displayed in HUD with id `gems-value`
- Gems styled with green color (#4caf50)
- Gems formatted using same `formatNumber()` function as gold

## References

- See `src/Core/PlayerData.ts` for data structure
- See `src/Core/GameManager.ts` for `addGems()` method
- See `assets/ui/index.html` for UI implementation
- See `src/Core/PersistenceManager.ts` for save/load logic

## Notes

- Gems system is designed to be parallel to gold system
- Backward compatibility: Old saves without gems will default to 0
- Gems can be added/removed using same patterns as gold
- **Important**: More Gems upgrade display is offset - UI shows 0x but backend is at 1x (always 1 ahead)
- **Critical**: All upgrade levels are persistent - saved in PlayerData and persist across sessions
- More Gems cost formula defined: `y = 42.53732814 * e^(0.1985808056 * x) - 50.88152767`
- More Rebirths cost formula defined: `y = 177.8192150860 * e^(0.1936304553 * x) - 205.8098819448`
- More Coins cost formula defined: `y(x) = 47.83460235 * x^(1.395013237) * e^(0.375345887 * x)`
- More Coins multiplier formula: `sellMultiplier = 1.0 + (moreCoinsLevel * 0.1)` - 160 levels max (0-159)
- More Damage cost formula defined: `y = 82.727459 * e^(1.515705435 * x) - 95.266667`
- More Damage multiplier formula: `damageMultiplier = 1.0 + (moreDamageLevel * 0.1)` - 50 levels max (0-49)
- More Rebirths upgrade will require careful implementation to handle bulk rebirths without losing accumulated power

