# Pet System Plan

## Overview
The Pet System enhances the training experience by providing power multipliers that stack across equipped pets. Players can hatch pets from eggs at designated areas, equip multiple pets, and benefit from cumulative multipliers applied to base training power gains.

## Core Mechanic
- **Base Training Power**: Power gained per swing on training rocks (from TrainingSystem)
- **Pet Multipliers**: Each pet has a Power Multiplier value
- **Calculation**: Sum all equipped pet multipliers → Multiply by base training power
  - Example: Base = 10, Pets equipped with multipliers 2, 5, 8 → Total multiplier = 15 → Final power gained = 10 × 15 = 150

## Egg Types & Pet Lists

### Stone Egg
**Cost**: 10 (currency to be determined - likely coins/gems)

| Pet Name | Rarity (Chance) | Power Multiplier |
|----------|-----------------|------------------|
| Stone Sprite | 30% (0.3) | 2 |
| Coal Companion | 40% (0.4) | 2 |
| Pebble Pal | 20% (0.2) | 2 |
| Rock Rascal | 10% (0.1) | 4 |

### Gem Egg
**Cost**: 100 (currency)

| Pet Name | Rarity (Chance) | Power Multiplier |
|----------|-----------------|------------------|
| Quartz Quill | 45% (0.45) | 5 |
| Emerald Eye | 30% (0.3) | 8 |
| Ruby Runner | 15% (0.15) | 12 |
| Sapphire Spark | 8% (0.08) | 20 |
| Diamond Dazzle | 2% (0.02) | 40 |

### Crystal Egg
**Cost**: 2500 (currency)

| Pet Name | Rarity (Chance) | Power Multiplier |
|----------|-----------------|------------------|
| Amethyst Aura | 43.5% (0.435) | 15 |
| Topaz Tracer | 30% (0.3) | 25 |
| Opal Orb | 15% (0.15) | 35 |
| Pearl Paladin | 8% (0.08) | 50 |
| Prism Protector | 3% (0.03) | 100 |
| Legendary Luster | 0.5% (0.005) | 250 |

*Note: Rarity chances should sum to 1.0 (100%) per egg type*

## System Components

### 1. Pet Data Structure
- **Pet ID**: Unique identifier
- **Pet Name**: Display name (e.g., "Stone Sprite")
- **Power Multiplier**: Numeric multiplier value
- **Rarity Tier**: Common, Rare, Epic, Legendary (for visual/UI purposes)
- **Egg Source**: Which egg type this pet comes from
- **Icon/Sprite**: Visual representation (placeholder: colored cube/sphere)

### 2. Pet Database
- Static data defining all pets, their multipliers, and egg associations
- Likely similar structure to PickaxeDatabase.ts or MinerDatabase.ts
- Contains hatching probability tables for each egg type

### 3. Player Pet Inventory
- List of all pets owned by the player
- **Capacity Limit: 50 pets maximum**
- Stored in PlayerData.ts or separate PetInventory
- Includes:
  - Pet ID references (duplicates allowed - can own multiple of same pet)
  - Quantity owned per pet type
  - Date obtained (optional)
  - Stats/metadata
- If inventory is full (50/50), hatching is blocked until space is freed
- UI should display capacity: "X/50 Pets"

### 4. Equipped Pets System
- Players can equip multiple pets simultaneously
- **Equip Limit: Maximum 8 pets can be equipped at once**
- Equipped pets are stored separately from inventory
- **Duplicates allowed**: Can equip multiple copies of the same pet (e.g., 8 Stone Sprites)
- Equipping a pet removes it from inventory count (or tracks it separately)
- UI shows equipped pets with their individual multipliers
- UI displays equipped count: "X/8 Equipped"

### 5. Hatching Areas/Stations
- **Three designated locations** in the game world (likely on surface/training area)
- Each station corresponds to one egg type:
  - Stone Egg Hatching Station
  - Gem Egg Hatching Station
  - Crystal Egg Hatching Station
- Players interact with station (NPC, sign, block, or UI trigger)
- Station shows:
  - Egg type name
  - Cost per hatch
  - Available pets list with rarities
  - Hatch button/action

### 6. Hatching Process
- **Pre-check**: Verify inventory has space (not at 50/50 capacity)
- **Pre-check**: Verify player has sufficient currency
- Player pays cost for egg type
- Random roll based on pet rarity probabilities
- New pet is added to player inventory (duplicates allowed)
- Visual feedback: animation, particle effects, pet reveal
- Notification/UI popup showing obtained pet
- If inventory full, show error message preventing hatch

## Egg Opening Gameplay Loop — Design & Flow

### High-Level Player Loop (What it feels like)

#### 1. Approach Egg Area
- Player walks up to an egg zone (grouped by progression tier)
- UI highlights the egg and shows:
  - Egg name
  - Cost (currency / gems / rebirth currency)
  - Possible pets + rarity percentages
  - Buttons: **Open 1**, **Open 3**, **Auto Open**

#### 2. Initiate Egg Open
- Player selects an open option
- Game checks:
  - Player has enough currency
  - Inventory has space (or auto-delete rules exist)

#### 3. Egg Opening Animation
- Egg appears in front of the player or camera
- Egg shakes / bounces with anticipation
- Optional effects:
  - Screen shake
  - Glow intensity ramps up
  - Sound cue builds suspense

#### 4. Reveal Phase
- Egg cracks or explodes into light
- Pet model/icon appears with:
  - Rarity color
  - Sparkles / particles based on rarity
- Rare pets have longer or more dramatic reveals

#### 5. Result Feedback
- UI shows:
  - Pet name
  - Rarity
  - Power / multiplier
  - "NEW" tag if first time obtained
- Inventory updates instantly

#### 6. Repeat / Chain Open
- If Auto Open is enabled:
  - Loop immediately starts again
- If manual:
  - Player can open again or leave the area

#### 7. Meta Progression Hook
- Duplicate pets encourage:
- Stronger pets increase player power → faster progression → unlock better eggs

### System-Level Gameplay Loop (What the code does)

#### 1. Egg Interaction Trigger
- Detect player entering egg interaction range
- Load egg data:
  - Cost
  - Loot table (pets + weights)
  - Animation profile

#### 2. Validation Step
- Before opening:
  - Check currency ≥ egg cost × quantity
  - Check inventory capacity
  - Apply discounts (gamepasses, boosts, rebirth bonuses)
- If validation fails:
  - Show error feedback (shake UI, red flash, sound)

#### 3. Currency Deduction
- Deduct cost immediately (before reveal)
- Lock input to prevent double spending
- Sync deduction server-side (authoritative)

#### 4. Roll Pet Result (Core RNG Step)
- Select pet using weighted random roll:
  - Common → very high weight
  - Legendary/Mythic → extremely low weight
- This roll is final before animation

#### 5. Play Egg Animation
- Spawn egg visual
- Play animation timeline:
  - Idle → shake → crack → burst
- Delay reveal until animation reaches reveal frame
- Camera may temporarily lock / zoom (optional)

#### 6. Reveal & Feedback
- Spawn pet model/icon
- Apply rarity effects:
  - Common: quick reveal
  - Rare+: glow, particles, longer screen time
- Play rarity-specific sound
- Show UI card with pet details

#### 7. Inventory & Progress Update
- Add pet to inventory
- Mark as "new" if first time unlocked
- Update:
  - Total power
  - Equipped pet recalculation
  - Quest / achievement progress (future feature)

### 7. Training System Integration
- TrainingController or TrainingSystem reads equipped pets
- Calculates total multiplier sum
- Applies multiplier to base power gain calculation
- Power gain formula: `finalPower = basePowerGain × (1 + sumOfPetMultipliers)`
  - *Note: Decide if multiplier is additive (1 + sum) or pure multiplicative (base × sum)*
  - Based on user description, seems like pure multiplicative: `basePowerGain × sumOfPetMultipliers`

## Technical Implementation Plan

### Files to Create/Modify

#### New Files:
1. `src/Pets/PetData.ts`
   - Pet data structure/interface
   - Pet type definitions
   - Rarity enum

2. `src/Pets/PetDatabase.ts`
   - All pet definitions with multipliers
   - Hatching probability tables
   - Get pet by ID, get pets by egg type

3. `src/Pets/PetInventory.ts`
   - Player's pet collection management
   - Add pet, remove pet, query owned pets
   - Pet quantity tracking (duplicates allowed)
   - Inventory capacity enforcement (max 50 pets)
   - Check if inventory is full before hatching

4. `src/Pets/PetManager.ts`
   - Core pet system logic
   - Equip/unequip pets (max 8 equipped)
   - Validate equip limit before allowing equips
   - Calculate total equipped multiplier
   - Integration point for other systems

5. `src/Pets/HatchingStation.ts` or `HatchingSystem.ts`
   - Hatching logic and probability rolls
   - Integration with hatching station entities
   - Cost validation and payment processing
   - Multi-open functionality (Open 1, Open 3, Auto Open)
   - Currency deduction handling
   - Inventory space validation
   - First-time pet tracking ("NEW" tag system)

6. `src/Pets/EggAnimationController.ts` (optional, or part of HatchingSystem)
   - Egg animation timeline (idle → shake → crack → burst)
   - Camera effects (optional zoom/lock)
   - Screen shake effects
   - Glow/particle effects
   - Reveal timing coordination

7. `src/Pets/HatchingStationEntity.ts` (if entity-based)
   - Entity for each hatching station location
   - UI interaction for hatching
   - Player interaction range detection
   - Or integrate into existing MerchantEntity pattern

#### Files to Modify:
1. `src/Core/PlayerData.ts`
   - Add pet inventory array (max 50 pets)
   - Add equipped pet IDs array (max 8 pets)
   - Add first-time obtained pets set/array (for "NEW" tag tracking)
   - Persistence fields
   - Validation helpers for capacity limits

2. `src/Core/PersistenceManager.ts`
   - Save/load pet inventory
   - Save/load equipped pets

3. `src/Surface/Training/TrainingController.ts` or `TrainingSystem.ts`
   - Read equipped pets from PetManager
   - Apply multiplier to power calculations
   - Display multiplier in UI (optional)

4. `src/Core/GameManager.ts`
   - Initialize PetManager
   - Register pet system

## UI/UX Considerations

### Hatching Station UI
- Display egg type name and cost
- Show available pets with rarity percentages
- **Button options**: "Open 1", "Open 3", "Auto Open"
- Cost display (highlight if insufficient funds)
- Animation/feedback on hatch
- Show current inventory space (X/50)
- Error feedback for failed validations (shake UI, red flash, sound)
- **Reveal UI Card** shows:
  - Pet name
  - Rarity (with color coding)
  - Power multiplier
  - "NEW" tag if first time obtained

### Pet Inventory UI
- Grid/list of owned pets
- Show pet name, multiplier, rarity tier
- Equip/Unequip buttons per pet
- Filter by egg source, rarity
- Quantity display (show count for duplicate pets)
- **Capacity indicator**: "X/50 Pets" prominently displayed
- Visual indication when inventory is full
- Disable hatching button when inventory is full (with message)

### Equipped Pets UI
- Always visible section (maybe in training area HUD)
- List equipped pets with multipliers (up to 8 slots)
- Show total combined multiplier
- Quick unequip buttons
- **Equip count indicator**: "X/8 Equipped"
- Disable equip button when 8/8 equipped (with message)
- Show empty slots when less than 8 equipped

### Training UI Integration
- Display active multiplier (e.g., "Training Power: ×15")
- Show breakdown of equipped pets contributing
- Visual indicator that pets are active

## Game Balance Considerations

### Multiplier Scaling
- Current multipliers range from 2 to 250
- With multiple pets equipped, totals can get very large
- Consider if there should be:
  - Diminishing returns
  - Maximum multiplier cap
  - Or let it scale freely for progression

### Cost Balancing
- Stone Egg: 10 (entry level)
- Gem Egg: 100 (10x more)
- Crystal Egg: 2500 (25x Gem Egg, 250x Stone Egg)
- Ensure costs are appropriate for game economy
- Consider if hatching should be purchasable repeatedly or have cooldowns

### Duplicate Pets
- **Confirmed**: Players can own and equip multiple copies of the same pet
- Stacking same pets can be powerful (e.g., 8 Legendary Lusters = 8 × 250 = 2000 multiplier)
- Encourages collecting many of the best pets
- Inventory management becomes strategic (50 capacity limit)

## Persistence & Save System
- Save pet inventory (array of pet IDs owned, max 50)
- Save equipped pets (array of equipped pet IDs, max 8)
- Load on game start
- Validate on load: ensure inventory count ≤ 50, equipped count ≤ 8
- Integrate with existing PersistenceManager pattern

## Visual Placeholders & Behavior
- Start with simple geometric shapes:
  - Colored cubes or spheres
  - Different colors per pet type
  - Glowing effect for higher rarity
- Can replace with proper models/textures later

### Pet Following Behavior (Final Implementation Phase)
- **Visual only** - does not affect gameplay mechanics
- Equipped pets will follow the player using an anchor system
- **Fixed distance**: Pets stay exactly 2 blocks behind the player (no more, no less)
- All equipped pets (up to 8) will follow at this fixed distance
- Implementation to be done at the very end of pet system development
- When multiple pets are equipped, they may need positioning logic (e.g., spread horizontally or in a formation)

## Entity Placement
- Three hatching stations need to be placed in world
- Likely near training area or spawn point
- Use existing entity patterns (MerchantEntity, Sign, etc.)
- Or create dedicated HatchingStationEntity class

## Future Enhancements (Out of Scope for Now)
- Pet levels/upgrades
- Pet abilities beyond multipliers
- Pet visual customization
- Pet evolution/breeding
- Pet animations/effects
- Pet trading between players

## Open Questions
1. **Currency Type**: What currency is used to purchase eggs? (coins, gems, training points?)
2. **Multiplier Formula**: Is it `base × sum(multipliers)` or `base × (1 + sum(multipliers))`? Based on description, seems like pure multiplicative.
3. **Hatching Animation**: What kind of feedback/celebration for hatching rare pets?
4. **Inventory Management**: Should there be a way to "release" or "delete" pets to free up inventory space?
5. **Multiple Pet Formation**: When 8 pets are equipped and following, how should they be positioned? (single file line, spread horizontally, or other formation?)

