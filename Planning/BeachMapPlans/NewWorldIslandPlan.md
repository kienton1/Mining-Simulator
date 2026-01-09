# New World/Island Creation Plan

## Overview
This document outlines the plan for creating a completely new world/island that is structurally identical to the existing one, but uses **different ores, training numbers, and pets**. All other game mechanics, systems, and structures remain the same.

---

## 1. Current System Analysis

### Existing Components to Replicate:
- **Map Structure**: Same map layout with training rocks, mine entrance, NPC locations, egg stations
- **Game Systems**: Mining, training, rebirth, pickaxe shop, miner shop, gem trader, merchant, pet system
- **Core Mechanics**: Auto-mine, auto-train, power system, damage calculations, inventory system
- **NPCs & Entities**: Merchant, Mine Reset Upgrade NPC, Gem Trader, Egg Stations (3 types)
- **UI Systems**: All modals, shops, and interfaces remain identical

### Components That NEED to Change:
1. **Ore Database** - All 24 ores replaced
2. **Training Rock Numbers** - 6 training rocks with new values/requirements
3. **Pet Database** - All 16 pets replaced with new pets

---

## 2. Ore System Changes

### Files to Modify:
- `src/Mining/Ore/OreData.ts` - OreType enum and ORE_DATABASE

### Current Ore Structure (24 ores - Island 1):
```
Common (4): Stone, Deepslate, Coal, Iron
Uncommon (4): Tin, Cobalt, Pyrite, Gold
Rare (4): Obsidian, Ruby, Diamond, Amber
Very Rare (4): Quartz, Topaz, Emerald, Relic
Ultra Rare (4): Amethyst, Sapphire, Luminite, Prismatic
Legendary (4): Sunstone, Mithrial, Astralite, Dragonstone
```

### New Island 2 Ore Structure (24 ores - Ocean Theme):
**Theme Confirmed**: Ocean/Underwater theme

**Ore Database (Island 2):**

| Ore Name | Rarity (1 in X) | Base Value | First Depth | First Health | Last Depth | Last Health | Block Folder |
|----------|----------------|------------|-------------|--------------|------------|-------------|--------------|
| Dunestone | 1 in 1 | 1,000 | 1 | 15,000 | 1000 | 30,000,000 | Dunestone/ |
| Driftite | 1 in 5 | 15,000 | 5 | 175,000 | 1000 | 70,000,000 | Driftite/ |
| Anchorite | 1 in 10 | 30,000 | 5 | 200,000 | 1000 | 90,000,000 | Anchorite/ |
| Barnacite | 1 in 12 | 35,000 | 5 | 45,000 | 1000 | 100,000,000 | Barnacite/ |
| Seaglassium | 1 in 14 | 100,000 | 10 | 130,000 | 1000 | 125,000,000 | Seaglassium/ |
| Shellchromite | 1 in 16 | 250,000 | 25 | 1,070,000 | 1000 | 200,000,000 | Shellchromite/ |
| Turtlite | 1 in 22 | 650,000 | 30 | 1,000,000 | 1000 | 290,000,000 | Turtlite/ |
| Prismarine | 1 in 33 | 2,500,000 | 70 | 6,000,000 | 1000 | 400,000,000 | Prismarine/ |
| Opalstone | 1 in 50 | 4,000,000 | 80 | 10,000,000 | 1000 | 603,000,000 | Opalstone/ |
| Azurite | 1 in 100 | 7,500,000 | 80 | 12,000,000 | 1000 | 800,000,000 | Azurite/ |
| Mangrovite | 1 in 100 | 19,000,000 | 80 | 15,000,000 | 1000 | 1,000,000,000 | Mangrovite/ |
| Basaltite | 1 in 100 | 15,000,000 | 120 | 35,000,000 | 1000 | 1,200,000,000 | Basaltite/ |
| Reefium | 1 in 20 | 25,000,000 | 250 | 110,000,000 | 1000 | 1,300,000,000 | Reefium/ |
| Kelpite | 1 in 200 | 27,500,000 | 150 | 61,000,000 | 1000 | 1,400,000,000 | Kelpite/ |
| Sunstonite | 1 in 33 | 40,000,000 | 200 | 100,000,000 | 1000 | 1,500,000,000 | Sunstonite/ |
| Riptidite | 1 in 222 | 75,000,000 | 150 | 100,000,000 | 1000 | 2,000,000,000 | Riptidite/ |
| Trenchite | 1 in 285 | 100,000,000 | 250 | 300,000,000 | 1000 | 2,500,000,000 | Trenchite/ |
| Stormium | 1 in 33 | 150,000,000 | 300 | 350,000,000 | 1000 | 2,000,000,000 | Stormium/ |
| Lavastone | 1 in 333 | 200,000,000 | 250 | 325,000,000 | 1000 | 2,800,000,000 | Lavastone/ |
| Wreckite | 1 in 100 | 250,000,000 | 250 | 1,000,000,000 | 1000 | 3,500,000,000 | Wreckite/ |
| Biolumite | 1 in 370 | 300,000,000 | 250 | 362,000,000 | 1000 | 3,400,000,000 | Biolumite/ |
| Oceanium | 1 in 200 | 400,000,000 | 350 | 700,000,000 | 1000 | 3,500,000,000 | Oceanium/ |
| Palmitite | 1 in 400 | 400,000,000 | 250 | 450,000,000 | 1000 | 3,700,000,000 | Palmitite/ |
| Tradewindite | 1 in 1000 | 1,750,000,000 | 500 | 2,200,000,000 | 1000 | 7,000,000,000 | Tradewindite/ |

**Block Assets**: All ore block textures already exist in `assets/blocks/` folder ✓

**Ore Grouping (for reference):**
- **Common (6)**: Dunestone, Driftite, Anchorite, Barnacite, Seaglassium, Shellchromite
- **Uncommon (4)**: Turtlite, Prismarine, Opalstone, Azurite
- **Rare (4)**: Mangrovite, Basaltite, Reefium, Kelpite
- **Very Rare (4)**: Sunstonite, Riptidite, Trenchite, Stormium
- **Ultra Rare (4)**: Lavastone, Wreckite, Biolumite, Oceanium
- **Legendary (2)**: Palmitite, Tradewindite

**Implementation Checklist:**
- [x] 24 new ore names designed (Ocean theme)
- [x] Rarity values assigned (1-1000 range)
- [x] Base gold values assigned (1,000 to 1.75 Billion)
- [x] First depth values assigned (1-500 range)
- [x] First health values assigned (15,000 to 2.2 Billion range)
- [x] Last depth confirmed (all 1000)
- [x] Last health values assigned (30M to 7B range)
- [x] Block folders confirmed in assets/blocks/
- [ ] Assign colors for UI (#hex format) - TBD
- [ ] Update OreType enum with new names
- [ ] Update ORE_DATABASE object with new values

**Notes:**
- Much higher value scaling than Island 1 (starts at 1,000 vs 2, ends at 1.75B vs 500K)
- Higher health scaling (starts at 15K vs 3, ends at 7B vs 1.3M)
- Earlier first depths (starts at 1 vs 26, but has ores up to depth 500)
- Ocean-themed names match the underwater theme perfectly

---

## 3. Training Rock System Changes

### Files to Modify:
- `src/Core/GameConstants.ts` - TRAINING_ROCK_MULTIPLIERS, TRAINING_ROCK_REQUIRED_REBIRTHS, TRAINING_ROCK_POWER_REQUIREMENTS
- `src/Surface/Training/TrainingRockData.ts` - TrainingRockTier enum and TRAINING_ROCK_DATABASE

### Current Training Rocks (Island 1 - 6 tiers):
1. **DIRT**: +1 Power, 0 rebirths, 0 power (always available)
2. **COBBLESTONE**: +3 Power, 5 rebirths, 250 power
3. **IRON_DEEPSLATE**: +15 Power, 15 rebirths, 5000 power
4. **GOLD_DEEPSLATE**: +45 Power, 50 rebirths, 75000 power
5. **DIAMOND_DEEPSLATE**: +80 Power, 250 rebirths, 500000 power
6. **EMERALD_DEEPSLATE**: +175 Power, 1000 rebirths, 10000000 power

**Island 1 Formula Structure (for reference):**
- All rocks use: `y(x) = ⌊Constant ⋅ x^(0.9993304728909983)⌋`
- Where `x = player rebirth count`
- Where `y = power gained per training hit`
- Constants increase per rock tier

### New Island 2 Training Rocks (Ocean Theme - 6 tiers):

**Training Hit Rates:**
- **Rocks 1-5**: 3 hits per second (0.333... seconds per hit)
- **Rock 6**: 4 hits per second (0.25 seconds per hit)

**Training Rock Specifications:**

| Rock | Unlock (Power OR Rebirths) | UI Power Bonus | Formula Constant | Hit Rate |
|------|---------------------------|----------------|------------------|----------|
| **Rock 1** | 250,000,000 Power OR 2,500 Rebirths | +300 Power | 10.157182969523832 | 3/sec |
| **Rock 2** | 5,000,000,000 Power OR 25,000 Rebirths | +500 Power | 16.928638282539723 | 3/sec |
| **Rock 3** | 100,000,000,000 Power OR 150,000 Rebirths | +1,500 Power | 50.78591484761917 | 3/sec |
| **Rock 4** | 1,000,000,000,000 Power OR 750,000 Rebirths | +4,000 Power | 135.42910626031778 | 3/sec |
| **Rock 5** | 100,000,000,000,000 Power OR 10,000,000 Rebirths | +12,000 Power | 406.28731878095334 | 3/sec |
| **Rock 6** | 1,000,000,000,000,000 Power OR 45,000,000 Rebirths | +25,000 Power | 848.6326371037162 | 4/sec |

**Formula Structure (All Rocks):**
- **Formula**: `y(x) = ⌊Constant ⋅ x^(0.9993304728909983)⌋`
- **Where**: 
  - `x = player rebirth count`
  - `y = power gained per training hit`
  - `⌊ ⌋ = floor()` function (rounds down to integer)
- **Exponent**: `0.9993304728909983` (same for all rocks, same as Island 1)
- **Constants**: Increase per rock tier (see table above)

**Power Gain Per Second Calculation:**
- **Rocks 1-5**: `Power/sec = y(x) × 3`
- **Rock 6**: `Power/sec = y(x) × 4`

**Example Calculations:**
- At 1,000 rebirths on Rock 1: `y(1000) = ⌊10.157182969523832 × 1000^(0.9993304728909983)⌋ = ⌊10,157⌋ = 10,157 power/hit`
  - Power/sec = 10,157 × 3 = 30,471 power/second
- At 1,000 rebirths on Rock 6: `y(1000) = ⌊848.6326371037162 × 1000^(0.9993304728909983)⌋ = ⌊848,633⌋ = 848,633 power/hit`
  - Power/sec = 848,633 × 4 = 3,394,532 power/second

### Training Rock Implementation Checklist:

#### Rock Data:
- [x] 6 training rock formulas defined (all use same exponent structure)
- [x] Unlock requirements defined (Power OR Rebirths for each)
- [x] UI power bonuses defined (+300, +500, +1,500, +4,000, +12,000, +25,000)
- [x] Formula constants defined (10.157... to 848.632...)
- [x] Hit rates defined (3/sec for rocks 1-5, 4/sec for rock 6)
- [ ] Design 6 new training rock names (ocean-themed)
- [ ] Assign new block types (ocean-themed blocks for visual representation)

#### Code Updates:
- [ ] Update TrainingRockTier enum with new identifiers
- [ ] Update TRAINING_ROCK_DATABASE with new rock definitions
- [ ] Update GameConstants.ts with new multipliers, rebirths, and power requirements
- [ ] Update TrainingController.ts to implement new formulas and hit rates
- [ ] Update TrainingSystem.ts to handle different hit rates (3/sec vs 4/sec)
- [ ] Update map.json block types if different blocks are needed for visual representation

### Notes:
- **Formula Structure**: Same exponential formula structure as Island 1 (maintains consistency)
- **Exponent**: Identical to Island 1 (0.9993304728909983) - ensures same scaling curve
- **Constants**: Higher constants than Island 1 (10.157 vs ~1, 848.632 vs ~175) - much higher power gains
- **Unlock Requirements**: Much higher than Island 1 (250M power vs 0, 45M rebirths vs 1000) - endgame focused
- **Hit Rates**: Different from Island 1 (3/sec for most, 4/sec for rock 6) - faster training
- **Power Scaling**: Significantly higher power gains per hit due to higher constants
- **Visual Blocks**: Should use ocean-themed blocks to match the island theme
- **Training Rock Names**: Should be ocean-themed (e.g., "Tide Pool", "Coral Reef", "Abyssal Trench", etc.)

---

## 4. Pet System Changes

### Files to Modify:
- `src/Pets/PetData.ts` - PetRarity enum (keep same), EggType enum (can keep same or rename)
- `src/Pets/PetDatabase.ts` - PET_IDS, PET_DEFINITIONS, EGG_LOOT_TABLES

### Current Pet Structure (Island 1):
- **3 Egg Types**: Stone, Gem, Crystal
  - Stone Egg: 10 gold, 4 pets (Stone Sprite, Coal Companion, Pebble Pal, Rock Rascal)
  - Gem Egg: 100 gold, 5 pets (Quartz Quill, Emerald Eye, Ruby Runner, Sapphire Spark, Diamond Dazzle)
  - Crystal Egg: 2500 gold, 6 pets (Amethyst Aura, Topaz Tracer, Opal Orb, Pearl Paladin, Prism Protector, Legendary Luster)

### New Island 2 Pet Structure (Ocean Theme):

**3 Egg Types - Ocean Themed:**

#### 1. Abyssal Egg (Replaces Stone Egg)
- **Cost**: 100,000 gold (vs Island 1: 10 gold = 10,000x more expensive)
- **5 Pets Total**:

| Pet Name | Drop Rate | Multiplier | Rarity Estimate |
|----------|-----------|------------|-----------------|
| Baby Sandray | 63.270% | 5,500 | Common |
| Baby Tidepup | 30.000% | 8,000 | Common |
| Baby Reefwing | 6.000% | 30,000 | Rare |
| Baby Krakling | 0.700% | 65,000 | Epic |
| Baby Ghostgull | 0.040% | 150,000 | Legendary |

**Total Drop Rate**: 100.010% (slight rounding, acceptable)

#### 2. Boardwalk Egg (Replaces Gem Egg)
- **Cost**: 250,000,000 gold (250 Million) (vs Island 1: 100 gold = 2,500,000x more expensive)
- **6 Pets Total**:

| Pet Name | Drop Rate | Multiplier | Rarity Estimate |
|----------|-----------|------------|-----------------|
| Lifeguard | 70.449% | 250 | Common |
| Baby TriShell | 25.000% | 450 | Common |
| Baby Rockheron | 4.000% | 1,000 | Rare |
| Baby MadMariner | 0.500% | 3,000 | Epic |
| Baby Turte | 0.050% | 10,000 | Epic |
| Baby Seal | 0.001% | 17,500 | Legendary |

**Total Drop Rate**: 100.000%

#### 3. Shipwreck Egg (Replaces Crystal Egg)
- **Cost**: 1,000,000,000 gold (1 Billion) (vs Island 1: 2,500 gold = 400,000x more expensive)
- **6 Pets Total**:

| Pet Name | Drop Rate | Multiplier | Rarity Estimate |
|----------|-----------|------------|-----------------|
| Baby Coralclad | 64.269% | 10,000 | Common |
| Baby Gigglecrab | 30.000% | 17,500 | Common |
| Baby Skifflet | 5.000% | 50,000 | Rare |
| Baby Emberfin | 0.700% | 150,000 | Epic |
| Baby Neonkelp | 0.030% | 280,000 | Epic |
| Baby Pearlmaw | 0.001% | 650,000 | Legendary |

**Total Drop Rate**: 100.000%

**Total Pets**: 17 pets (vs Island 1: 16 pets)

### Pet Implementation Checklist:

#### Egg Type Planning:
- [x] 3 egg type names decided (Abyssal, Boardwalk, Shipwreck - Ocean theme)
- [x] Egg costs set (100K, 250M, 1B - much higher than Island 1)
- [ ] Update EggType enum with new names (or use existing and map differently)

#### Pet Design (17 pets total):
- [x] **Abyssal Egg (5 pets)**:
  - [x] Pet names designed (all ocean-themed)
  - [x] Drop rates assigned (63.27%, 30%, 6%, 0.7%, 0.04%)
  - [x] Multipliers assigned (5,500 to 150,000)
  - [x] Rarities can be inferred from drop rates

- [x] **Boardwalk Egg (6 pets)**:
  - [x] Pet names designed (ocean/beach-themed)
  - [x] Drop rates assigned (70.449%, 25%, 4%, 0.5%, 0.05%, 0.001%)
  - [x] Multipliers assigned (250 to 17,500)
  - [x] Rarities can be inferred from drop rates

- [x] **Shipwreck Egg (6 pets)**:
  - [x] Pet names designed (ocean/treasure-themed)
  - [x] Drop rates assigned (64.269%, 30%, 5%, 0.7%, 0.03%, 0.001%)
  - [x] Multipliers assigned (10,000 to 650,000)
  - [x] Rarities can be inferred from drop rates

- [ ] Assign rarities explicitly (COMMON, RARE, EPIC, LEGENDARY)
- [ ] Update PET_IDS object with new pet identifiers
- [ ] Update PET_DEFINITIONS_ARRAY with all new pet definitions
- [ ] Update EGG_LOOT_TABLES with drop rates (convert percentages to weights)
- [ ] Update EGG_DEFINITIONS with new egg costs

### Pet Rarity Mapping (Suggested):

**Abyssal Egg:**
- Baby Sandray (63.27%) → COMMON
- Baby Tidepup (30%) → COMMON
- Baby Reefwing (6%) → RARE
- Baby Krakling (0.7%) → EPIC
- Baby Ghostgull (0.04%) → LEGENDARY

**Boardwalk Egg:**
- Lifeguard (70.449%) → COMMON
- Baby TriShell (25%) → COMMON
- Baby Rockheron (4%) → RARE
- Baby MadMariner (0.5%) → EPIC
- Baby Turte (0.05%) → EPIC
- Baby Seal (0.001%) → LEGENDARY

**Shipwreck Egg:**
- Baby Coralclad (64.269%) → COMMON
- Baby Gigglecrab (30%) → COMMON
- Baby Skifflet (5%) → RARE
- Baby Emberfin (0.7%) → EPIC
- Baby Neonkelp (0.03%) → EPIC
- Baby Pearlmaw (0.001%) → LEGENDARY

### Notes:
- **Cost Scaling**: Island 2 pet eggs are MUCH more expensive (100K, 250M, 1B vs 10, 100, 2500)
  - This aligns with the higher ore values on Island 2
  - Players will need to earn more gold to afford pets
- **Multiplier Scaling**: Island 2 pets have much higher multipliers (250-650K vs 2-250)
  - This compensates for the higher training rock values (if training rocks scale similarly)
- **Drop Rate Format**: Provided as percentages (need to convert to weights for loot table)
  - Current system uses relative weights (0.3, 0.4, etc.)
  - Can use percentages directly as weights (0.6327, 0.30, etc.) or normalize
- **Pet Count**: 17 pets total (vs Island 1: 16 pets)
  - One extra pet in the Boardwalk Egg category
- **Theme Consistency**: All pets are ocean/beach/underwater themed ✓
- **Rarity Distribution**: Similar pattern to Island 1 (mostly common, few rare/epic, very few legendary)

---

## 5. File Modification Summary

### Files Requiring Changes:

#### Core Ore Files:
- `src/Mining/Ore/OreData.ts`
  - Update `OreType` enum (24 new ore types)
  - Update `ORE_DATABASE` object (all 24 ore definitions)

#### Core Training Rock Files:
- `src/Core/GameConstants.ts`
  - Update `TRAINING_ROCK_MULTIPLIERS` (6 values)
  - Update `TRAINING_ROCK_REQUIRED_REBIRTHS` (6 values)
  - Update `TRAINING_ROCK_POWER_REQUIREMENTS` (6 values)

- `src/Surface/Training/TrainingRockData.ts`
  - Update `TrainingRockTier` enum (6 new tier identifiers)
  - Update `TRAINING_ROCK_DATABASE` object (6 rock definitions)

#### Core Pet Files:
- `src/Pets/PetDatabase.ts`
  - Update `PET_IDS` object (16 new pet IDs)
  - Update `PET_DEFINITIONS_ARRAY` (16 new pet definitions)
  - Update `EGG_LOOT_TABLES` (3 egg types with pet distributions)

- `src/Pets/PetData.ts` (Optional)
  - Update `EggType` enum if renaming egg types

#### Optional Files (if visual blocks change):
- `assets/map.json` - Update block types if training rocks use different visual blocks
- Any block texture files if new ore blocks are added

### Files That DO NOT Need Changes:
- `index.ts` - World initialization (uses the data files above)
- All game systems (MiningController, TrainingController, etc.)
- UI files (references data dynamically)
- Shop systems (PickaxeShop, MinerShop - independent of ores/pets)
- Rebirth system (independent of ores/pets)
- Persistence system (handles any pet IDs generically)
- Map structure (unless changing visual blocks)

---

## 6. Implementation Steps

### Phase 1: Design & Planning
1. **Choose Theme**: Decide on a cohesive theme for the new world (e.g., Ocean, Space, Forest, Fire)
2. **Design Ores**: Create 24 new ore names with values matching current progression curve
3. **Design Training Rocks**: Create 6 new rock names with balanced multipliers and requirements
4. **Design Pets**: Create 16 new pet names with balanced rarities and multipliers
5. **Review Balance**: Ensure progression feels similar to current world (same difficulty curve)

### Phase 2: Ore Implementation
1. Open `src/Mining/Ore/OreData.ts`
2. Replace all values in `OreType` enum with new ore names
3. Replace all entries in `ORE_DATABASE` with new ore definitions
4. Test that all ore properties are valid (rarity, value, health scaling, etc.)

### Phase 3: Training Rock Implementation
1. Open `src/Core/GameConstants.ts`
2. Update `TRAINING_ROCK_MULTIPLIERS` with new power values
3. Update `TRAINING_ROCK_REQUIRED_REBIRTHS` with new rebirth thresholds
4. Update `TRAINING_ROCK_POWER_REQUIREMENTS` with new power thresholds
5. Open `src/Surface/Training/TrainingRockData.ts`
6. Update `TrainingRockTier` enum with new tier identifiers
7. Update `TRAINING_ROCK_DATABASE` with new rock data (names, IDs, requirements)
8. Verify training rock piecewise functions still work (may need adjustment in TrainingController.ts)

### Phase 4: Pet Implementation
1. Open `src/Pets/PetDatabase.ts`
2. Update `PET_IDS` object with new pet identifier constants
3. Update `PET_DEFINITIONS_ARRAY` with all 16 new pet definitions
4. Update `EGG_LOOT_TABLES` with new pet IDs and weights
5. Optionally update `src/Pets/PetData.ts` if renaming EggType enum values

### Phase 5: Visual Updates (Optional)
1. If changing training rock block types, update `assets/map.json` block references
2. Add new block textures if creating new ore block visuals
3. Update any UI color references if ore colors change

### Phase 6: Testing & Validation
1. **Ore Testing**: 
   - Verify all 24 ores appear in mines
   - Test ore spawning rates match rarity values
   - Test ore sell values with merchant
   - Verify ore health scaling works at different depths

2. **Training Rock Testing**:
   - Verify all 6 rocks are accessible at correct thresholds
   - Test power gain values match expected multipliers
   - Test rebirth/power unlock conditions
   - Verify training rock UI displays correct values

3. **Pet Testing**:
   - Test hatching all 3 egg types
   - Verify pet drop rates match loot table weights
   - Test pet equipping/unequipping
   - Verify pet multipliers apply correctly to training
   - Test pet inventory/equip capacity limits

4. **Integration Testing**:
   - Test full gameplay loop (mine → sell → train → rebirth)
   - Verify progression feels balanced
   - Test persistence (save/load with new pets/ores)
   - Test all UI elements display new names/values correctly

---

## 7. Balance Guidelines

### Ore Balance:
- Maintain similar value progression curve (exponential growth)
- Keep rarity progression similar (more valuable = rarer)
- Health scaling should feel similar (tougher ores at deeper depths)
- Ensure ore values align with economy (gold per hour should be similar)

### Training Rock Balance:
- Power multipliers should maintain exponential progression
- Rebirth requirements should create meaningful milestones
- Power requirements should be achievable at similar rebirth counts
- Higher-tier rocks should feel like significant upgrades

### Pet Balance:
- Pet multipliers should scale appropriately (common < rare < epic < legendary)
- Egg costs should create meaningful progression gates
- Loot table weights should make higher-rarity pets appropriately rare
- Total possible multipliers should align with training rock progression

---

## 8. Theme Suggestions & Examples

### Ocean Theme Example:
- **Ores**: Coral, Pearl, Abyssal Stone, Kelp, Seaweed, Starfish, Aquamarine, Triton's Gold, Kraken's Ink, Nautilus Shell, etc.
- **Training Rocks**: Tide Pool, Shallow Reef, Deep Coral, Abyssal Trench, Mariana Depth, Kraken's Lair
- **Pets**: Hermit Crab, Seahorse, Jellyfish, Stingray, Dolphin, Whale, Leviathan, Poseidon's Trident

### Space Theme Example:
- **Ores**: Meteorite, Stardust, Nebula Gas, Comet Tail, Asteroid Fragment, Plasma Core, Solar Flare, Neutron Star, Black Hole Fragment, etc.
- **Training Rocks**: Moon Surface, Mars Crater, Asteroid Belt, Jupiter's Moon, Saturn's Ring, Neutron Star Surface
- **Pets**: Shooting Star, Asteroid Buddy, Comet Trail, Nebula Wisp, Galaxy Guardian, Cosmic Dragon

### Forest Theme Example:
- **Ores**: Bark, Moss, Root Fiber, Leaf Essence, Flower Pollen, Seed Core, Thorn Spike, Acorn, Pine Resin, etc.
- **Training Rocks**: Mossy Ground, Ancient Root, Old Oak, Elder Tree, World Tree Bark, Sacred Grove
- **Pets**: Forest Sprite, Leaf Pals, Bark Guardian, Flower Fairy, Tree Spirit, Nature Guardian

---

## 9. Quick Reference: Current vs New World Checklist

### What Stays the Same:
- ✅ Map layout and structure
- ✅ All game systems (mining, training, rebirth, shops)
- ✅ Core mechanics (auto-mine, auto-train, power calculations)
- ✅ UI layout and functionality
- ✅ NPCs and their locations
- ✅ Pickaxe system (unchanged)
- ✅ Miner system (unchanged)
- ✅ Gem trader upgrades (unchanged)
- ✅ Save/persistence system
- ✅ All code architecture

### What Changes:
- ❌ All 24 ore types (names, values, properties)
- ❌ All 6 training rock values and requirements
- ❌ All 16 pet definitions (names, rarities, multipliers)
- ⚠️ Optional: Training rock visual blocks (if desired)
- ⚠️ Optional: Egg type names (if renaming)

---

## 10. Next Steps

1. **Decide on Theme**: Choose a cohesive theme that matches your vision
2. **Design Phase**: Create all names and values following balance guidelines
3. **Review**: Double-check all values maintain similar progression curves
4. **Implementation**: Follow Phase 2-6 step by step
5. **Testing**: Thoroughly test all systems with new values
6. **Balance Adjustments**: Fine-tune based on gameplay feel
7. **Documentation**: Update any player-facing documentation with new names

---

---

## 11. Second Island Placement & Mining Areas Layout

### Current Island Layout (Island 1)

**Training Area (South Side - Negative Z):**
- **Training Rocks**: Located at Z: -12 to -6, X: -13 to 14
  - 6 training rocks spread horizontally across the south area
  - Each rock has its own dirt patch for player interaction

**Mining Area (North Side - Positive Z):**
- **Mine Entrance**: X: -4 to 2, Z: 16 to 22 (7x7 blocks, 49 blocks total)
- **Location**: North-central area of the island
- **Depth**: Players drop 10 blocks down (Y: 0 → Y: -10) then teleport to personal mine instance

**NPC & Shop Area (Positive Z - Central/North):**
- **Merchant** (sell ores): X: -12.82, Z: 11.28
- **Mine Reset Upgrade NPC**: X: 5.08, Z: 14.35
- **Gem Trader** (gem upgrades): X: 14.83, Z: 9.29
- **Egg Stations** (3 barrels): X: -13, Z: 1, 5, 9

**Overall Layout:**
```
                    [NPCs & Shops Area]
                    Z: 0-22, X: -15 to 15
                    
                          [Mining Area]
                    X: -4 to 2, Z: 16 to 22
                    
    [Egg Stations]     [Merchant]     [Gem Trader]
    X: -13, Z: 1-9     X: -12, Z: 11  X: 14, Z: 9
    
                    [Training Rocks Area]
                    Z: -12 to -6, X: -13 to 14
```

---

### Second Island Placement Strategy

#### Option 1: Horizontal Separation (Recommended)
**Place Island 2 to the East/West of Island 1**

**Island 2 Layout (Placed at X: 50+ for example):**

**Training Area (South Side - Negative Z):**
- **Training Rocks**: X: 37 to 64, Z: -12 to -6
  - Same relative positions but offset +50 on X-axis
  - Maintains same spacing between rocks

**Mining Area (North Side - Positive Z):**
- **Mine Entrance**: X: 46 to 52, Z: 16 to 22
  - 7x7 blocks (49 blocks total)
  - Same relative position offset +50 on X-axis
  - Same drop depth (10 blocks)

**NPC & Shop Area (Positive Z):**
- **Merchant**: X: 37.18, Z: 11.28 (offset +50 from original)
- **Mine Reset Upgrade NPC**: X: 55.08, Z: 14.35
- **Gem Trader**: X: 64.83, Z: 9.29
- **Egg Stations**: X: 37, Z: 1, 5, 9 (offset +50 from original)

**Separation Distance:**
- **Minimum**: ~30-40 blocks between islands (comfortable walking distance)
- **Recommended**: 50+ blocks for clear separation
- **Maximum**: No limit, but consider player travel time

**Visual Layout:**
```
Island 1                    Island 2
X: -15 to 15                X: 35 to 65
      ↓                           ↓
[Training] [NPCs] [Mining]  [Training] [NPCs] [Mining]
[  Rocks ] [Shops] [Area ]  [  Rocks ] [Shops] [Area ]
```

#### Option 2: Vertical Separation (North/South)
**Place Island 2 to the North/South of Island 1**

**Island 2 Layout (Placed at Z: 50+ for example):**

**Training Area:**
- **Training Rocks**: X: -13 to 14, Z: 38 to 44 (offset +50 on Z-axis)

**Mining Area:**
- **Mine Entrance**: X: -4 to 2, Z: 66 to 72 (offset +50 on Z-axis)

**NPC & Shop Area:**
- All NPCs offset +50 on Z-axis

**Separation Distance:**
- **Minimum**: ~30-40 blocks
- **Recommended**: 50+ blocks

#### Option 3: Diagonal Separation (Southeast/Northwest)
**Place Island 2 diagonally from Island 1**

**Island 2 Layout (Placed at X: 50, Z: 50 for example):**

**Training Area:**
- **Training Rocks**: X: 37 to 64, Z: 38 to 44

**Mining Area:**
- **Mine Entrance**: X: 46 to 52, Z: 66 to 72

**NPC & Shop Area:**
- All NPCs offset +50 on both X and Z axes

---

### Mining Area Specifications for Island 2

#### Requirements:
1. **Size**: Same as Island 1 - 7x7 blocks (49 blocks total)
2. **Shape**: Square grid of stone blocks (mineable blocks)
3. **Depth**: Same 10-block drop shaft (Y: 0 → Y: -10)
4. **Location**: North side of island (positive Z, relative to training area)

#### Recommended Mining Area Coordinates:

**If Island 2 at X: 50 (Horizontal Separation):**
```
Mining Area Bounds:
- X: 46 to 52 (7 columns) - Offset +50 from original (-4 to 2)
- Z: 16 to 22 (7 rows) - Same Z as original
- Y: 0 (surface level)
```

**If Island 2 at Z: 50 (Vertical Separation):**
```
Mining Area Bounds:
- X: -4 to 2 (7 columns) - Same X as original
- Z: 66 to 72 (7 rows) - Offset +50 from original (16 to 22)
- Y: 0 (surface level)
```

**If Island 2 at X: 50, Z: 50 (Diagonal):**
```
Mining Area Bounds:
- X: 46 to 52 (7 columns) - Offset +50
- Z: 66 to 72 (7 rows) - Offset +50
- Y: 0 (surface level)
```

#### Mining Area Block Layout:
- **Total Blocks**: 49 blocks (7x7 grid)
- **Block Type**: Stone blocks (same as Island 1)
- **Pattern**: Uniform grid, all mineable
- **Shared Shaft**: Same 10-block deep drop at center or all blocks
- **Teleport Trigger**: At Y: -5.5 (5 blocks down)

---

### World Selection System (Required for 2 Islands)

Since you're adding a second island, you'll need a way for players to choose which island/world they want to use:

#### Approach 1: Teleport System (Simple)
- Add a **World Portal** or **Teleporter** on each island
- Players walk up and press a key to teleport between islands
- Each island has identical functionality, just different ores/pets/rocks
- **Pros**: Simple, no UI needed, players can switch anytime
- **Cons**: Players must travel between islands physically

#### Approach 2: World Selector NPC (Recommended)
- Add a **World Selector NPC** at spawn (or center of both islands)
- NPC shows a menu: "Island 1" vs "Island 2"
- Selecting an island teleports player there
- **Pros**: Clear UI, easy to understand, centralized
- **Cons**: Requires UI implementation

#### Approach 3: Spawn Selection
- On first join, player sees a selection screen
- Choose Island 1 or Island 2
- Spawn location based on selection
- Can change via NPC later
- **Pros**: Clean initial experience
- **Cons**: Requires spawn selection system

#### Recommended: World Selector NPC
- **Location**: X: 0, Z: 0 (center between both islands, or duplicate on each island)
- **Function**: Opens UI menu to teleport to Island 1 or Island 2
- **Display**: Shows current island name and allows switching

---

### Island Separation Best Practices

#### Minimum Requirements:
1. **Clear Visual Separation**: Islands should be obviously separate (water, void, or gap)
2. **Sufficient Distance**: 30-50+ blocks minimum to prevent confusion
3. **Consistent Layout**: Same relative positions make navigation easier
4. **Landmark**: Consider adding a unique visual element to each island for easy identification

#### Recommended Spacing:
- **Small Islands**: 30-40 blocks apart
- **Medium Islands** (Recommended): 50-75 blocks apart
- **Large Islands**: 100+ blocks apart

#### Visual Markers:
- **Island 1**: Could have green/forest theme
- **Island 2**: Could have different theme (ocean, space, fire, etc.)
- **Signs/Banners**: Add visible markers showing "Island 1" vs "Island 2"
- **Color Coding**: Different colored paths or landmarks

---

### Implementation Notes for Second Island

#### Files That Need World Selection:
1. **index.ts** - Need to handle world selection, spawn players on correct island
2. **GameManager.ts** - May need to track current island/world
3. **MiningSystem.ts** - Mining areas need to check which island player is on
4. **TrainingController.ts** - Training rocks need island context
5. **NPCs** - All NPCs need to be spawned on both islands (or shared at center)

#### Constants That Need Updates:
1. **GameConstants.ts** - Need `ISLAND_2_MINING_AREA_BOUNDS`, `ISLAND_2_MINING_AREA_POSITIONS`
2. **TrainingRockLocator.ts** - Need to detect rocks on Island 2
3. **NPC positions** - Need Island 2 positions for all NPCs

#### Map.json Considerations:
- Add Island 2 structures to the map
- Place mining area blocks (7x7 stone grid)
- Place training rock blocks (cobbled-deepslate clusters)
- Place NPC locations (or use entity spawning like current)
- Add visual separation (water, void, bridge, etc.)

---

## 12. Map Placement & Mine Instance Management

### Current Map System (Island 1):
- **Map File**: `assets/map.json` (loaded via `world.loadMap(worldMap)`)
- **Mine Instances**: Each player gets a spatial offset (X/Z) to isolate their mine
- **Mine Offset System**: Uses `MINE_INSTANCE_SPACING = 256` blocks between instances
- **Mine Storage**: `MiningState` per player stores blockMap, chestMap, currentDepth, offset, etc.
- **Mine Generation**: Mines are generated on-demand when player enters (lazy generation)

### Island 2 Map File:
- **Map File**: `assets/BeachMap.json` (contains Island 2/Beach world data)
- **Theme**: Ocean/Beach themed island
- **Structure**: Contains all blocks, entities, props for Island 2

### Map Placement Strategy

#### Option 1: Single World with Two Maps (Recommended)
**Load both maps into the same world at different coordinates**

**Implementation:**
1. Load Island 1 map (`assets/map.json`) at default position (X: 0, Z: 0)
2. Load Island 2 map (`assets/BeachMap.json`) at offset position (e.g., X: 500, Z: 0)
3. Both maps exist simultaneously in the same world
4. Players can walk/fly between islands OR use teleportation

**Pros:**
- Simple implementation (just load second map at offset)
- Players can see both islands
- No map switching needed
- Easy to add bridges/connections

**Cons:**
- Larger world size (more memory)
- Both maps loaded at once
- Need to manage coordinate ranges carefully

**Coordinate Ranges:**
```
Island 1: X: -50 to 50, Z: -50 to 50 (approximate)
Island 2: X: 450 to 550, Z: -50 to 50 (offset +500 on X)
Gap: ~400 blocks between islands (walkable or teleport)
```

#### Option 2: Dynamic Map Loading (Advanced)
**Load/unload maps based on player location**

**Implementation:**
1. Only one map loaded at a time per player
2. When player teleports to Island 2, unload Island 1 map, load Island 2 map
3. When player teleports to Island 1, unload Island 2 map, load Island 1 map
4. Requires map state management per player

**Pros:**
- Lower memory usage (only one map loaded)
- Cleaner separation
- Can have different map sizes

**Cons:**
- Complex implementation (map loading/unloading)
- Need to handle player position during map switch
- Potential for bugs if map unloads while player is in it

**Recommendation: Option 1 (Single World with Two Maps)**

### Mine Instance Management for Dual Islands

#### Problem:
- Each player needs **TWO separate mine instances**: one for Island 1, one for Island 2
- Each island uses different ores (Island 1: Stone/Diamond/etc., Island 2: Dunestone/Oceanium/etc.)
- When player switches islands, need to:
  - Save current mine state (if in Island 1 mine)
  - Load/Generate Island 2 mine (if switching to Island 2)
  - Or vice versa

#### Solution: Per-Island Mine Instances

**Mine Instance Structure:**
```typescript
interface PlayerMineInstances {
  island1: MiningState | null;  // Island 1 mine state
  island2: MiningState | null;  // Island 2 mine state
  currentIsland: 'island1' | 'island2';  // Which island player is on
}
```

**Mine Offset Strategy:**
- **Island 1 Mines**: Use existing offset system (X: 0 + offset, Z: original mining area)
- **Island 2 Mines**: Use offset system with Island 2 base position (X: 500 + offset, Z: Island 2 mining area)

**Example:**
```
Player A, Island 1 Mine:
  Base: X: 0, Z: 16-22 (mining area)
  Offset: X: 256, Z: 0 (instance spacing)
  Final: X: 256, Z: 16-22

Player A, Island 2 Mine:
  Base: X: 500, Z: 16-22 (Island 2 mining area)
  Offset: X: 256, Z: 0 (same instance spacing)
  Final: X: 756, Z: 16-22
```

#### Mine State Management

**When Player Switches Islands:**

1. **Save Current Mine State:**
   - If player is in Island 1 mine → Save Island 1 `MiningState` to `playerMineInstances.island1`
   - If player is in Island 2 mine → Save Island 2 `MiningState` to `playerMineInstances.island2`
   - Store: blockMap, chestMap, currentDepth, generatedDepths, etc.

2. **Load/Generate New Mine:**
   - Check if Island 2 mine exists for player
   - If exists: Restore `MiningState` from saved state
   - If not exists: Generate new Island 2 mine (first time entering)
   - Update `currentIsland` to 'island2'

3. **Teleport Player:**
   - Teleport player to Island 2 surface (or Island 2 mine entrance if they were in mine)
   - Update player's current island tracking

4. **Mine Generation:**
   - Island 1 mines: Use Island 1 `ORE_DATABASE` (Stone, Diamond, etc.)
   - Island 2 mines: Use Island 2 `ORE_DATABASE` (Dunestone, Oceanium, etc.)
   - Same generation logic, different ore database

#### Implementation Details

**Files to Modify:**

1. **MiningSystem.ts**:
   - Change `miningStates: Map<Player, MiningState>` to `miningStates: Map<Player, { island1: MiningState | null, island2: MiningState | null }>`
   - Add method: `getMiningState(player, island: 'island1' | 'island2')`
   - Add method: `switchIsland(player, fromIsland, toIsland)`
   - Update `getOrCreateOffset()` to account for island base position

2. **GameManager.ts**:
   - Add `currentIsland: Map<Player, 'island1' | 'island2'>`
   - Add method: `switchPlayerIsland(player, targetIsland)`
   - Update `initializePlayerMine()` to accept island parameter
   - Update `isPlayerInMine()` to check correct island

3. **MiningController.ts**:
   - Update to use island-aware mining state
   - Pass current island to `MiningSystem` methods

4. **index.ts**:
   - Load both maps: `world.loadMap(worldMap)` and `world.loadMap(beachMap, { offset: { x: 500, z: 0 } })`
   - Add world selector/teleporter system
   - Initialize Island 2 mining areas

**Mine Degeneration (Cleanup):**

**When to Clean Up Mines:**
- **Option A**: Keep mines loaded (persist in memory)
  - Pros: Fast switching, no regeneration needed
  - Cons: Memory usage (two mines per player)

- **Option B**: Unload mines when player leaves island
  - Pros: Lower memory usage
  - Cons: Need to regenerate on return (but can save state)

**Recommended: Option A (Keep Mines Loaded)**
- Mines are relatively small (7x7 per level, ~1000 levels max)
- Fast switching between islands
- Can implement Option B later if memory becomes issue

### Island 2 Mining Area Placement

**Island 2 Mining Area Coordinates (if Island 2 at X: 500):**

```
Island 2 Mining Area Bounds:
- X: 496 to 502 (7 columns) - Offset +500 from Island 1
- Z: 16 to 22 (7 rows) - Same Z as Island 1 (or adjust if needed)
- Y: 0 (surface level)
```

**Island 2 Shared Shaft:**
- Same structure as Island 1 (10-block drop)
- Located at Island 2 mining area center
- Teleport trigger at Y: -5.5 (same as Island 1)

### World Selector/Teleporter System

**Implementation Options:**

1. **NPC Teleporter** (Recommended):
   - Location: X: 0, Z: 0 (center) OR duplicate on each island
   - Function: Opens UI menu
   - Options: "Go to Island 1" / "Go to Island 2"
   - Action: Teleports player + switches mine context

2. **Portal Blocks**:
   - Place portal blocks on each island
   - Walk through to teleport
   - Visual: Different colored blocks or particle effects

3. **Command**:
   - `/island1` and `/island2` commands
   - Simple but less user-friendly

**Recommended: NPC Teleporter + Command (hybrid)**

### Coordinate Management

**Island 1 Boundaries:**
- Surface: X: -50 to 50, Z: -50 to 50 (approximate)
- Mining Area: X: -4 to 2, Z: 16 to 22
- Training Rocks: X: -13 to 14, Z: -12 to -6
- NPCs: Various positions in positive Z area

**Island 2 Boundaries (if offset X: 500):**
- Surface: X: 450 to 550, Z: -50 to 50 (approximate)
- Mining Area: X: 496 to 502, Z: 16 to 22
- Training Rocks: X: 487 to 514, Z: -12 to -6 (offset +500)
- NPCs: Various positions offset +500 on X

**Separation:**
- Gap: ~400 blocks between islands (X: 50 to 450)
- Can add bridge, water, void, or teleport-only access

### Implementation Checklist:

#### Map Loading:
- [ ] Load `assets/map.json` at default position (X: 0, Z: 0)
- [ ] Load `assets/BeachMap.json` at offset position (X: 500, Z: 0)
- [ ] Verify both maps load correctly
- [ ] Test coordinate ranges don't overlap

#### Mine Instance System:
- [ ] Update `MiningSystem` to support per-island mine states
- [ ] Update `MiningState` structure to include island identifier
- [ ] Update mine offset calculation for Island 2
- [ ] Implement `switchIsland()` method
- [ ] Update `OreGenerator` to use correct `ORE_DATABASE` based on island
- [ ] Test mine generation for both islands

#### World Switching:
- [ ] Implement world selector/teleporter
- [ ] Add `currentIsland` tracking to `GameManager`
- [ ] Implement island switch logic (save/load mine states)
- [ ] Update player position tracking for both islands
- [ ] Test switching between islands

#### Island 2 Constants:
- [ ] Add `ISLAND_2_MINING_AREA_BOUNDS` to `GameConstants.ts`
- [ ] Add `ISLAND_2_MINING_AREA_POSITIONS` to `GameConstants.ts`
- [ ] Add `ISLAND_2_SHARED_SHAFT` constants
- [ ] Update training rock detection for Island 2

#### Testing:
- [ ] Test player can mine on Island 1
- [ ] Test player can mine on Island 2
- [ ] Test switching islands preserves mine state
- [ ] Test both islands generate correct ores
- [ ] Test training rocks work on both islands
- [ ] Test NPCs work on both islands

---

## 13. World Selection UI System

### Overview
A UI system that allows players to view, unlock, and teleport between different worlds/islands. Players access this through a HUD element and can scroll through available worlds, see their trophy multipliers, and unlock new worlds using wins.

### UI Structure

#### HUD Element (Entry Point)
- **Location**: Left side of screen, next to Miner/Pickaxe shop buttons
- **Visual**: Button/icon that opens the Worlds UI panel
- **Function**: Click to open/close the Worlds selection menu
- **Always Visible**: Yes (persistent HUD element)

#### Worlds Panel (Main UI)
- **Title**: "Worlds" (displayed at top)
- **Background**: Blue background with subtle white pickaxe and star patterns
- **Close Button**: Red 'X' button in top right corner
- **Content Area**: Scrollable list of world entries
- **Scrollbar**: White scrollbar on right side (visible when content overflows)

### World Entry Panel Structure

Each world is displayed as a **dark rectangular panel with blue border** containing:

#### Left Side:
1. **World Name**: White text at top left
   - Examples: "Moon World", "Frostlands", "Ashlands", "Island 1", "Island 2 (Beach)"
   
2. **Trophy Multiplier**: Below world name
   - **Icon**: Golden trophy icon
   - **Text**: "x1", "x100", "x1,000", etc.
   - **Meaning**: How many trophies player earns per mine completion in this world
   - **Format**: `x{multiplier}` (e.g., "x100" = 100 trophies per mine completion)

3. **Feature Icons** (Optional): Small icons representing world features
   - Visual indicators of world theme/features
   - Examples: Building icons, platform icons, etc.

#### Background Image:
- **Blurred background image** representing the world theme
- Examples:
  - Island 1: Forest/grass theme
  - Island 2 (Beach): Ocean/beach theme


#### Right Side:
**Action Button** (one of two types):

1. **Teleport Button** (if world is unlocked):
   - **Color**: Bright green rectangular button
   - **Text**: "Teleport"
   - **Function**: Teleports player to that world
   - **Available**: Only shown if world is already unlocked

2. **Unlock Button** (if world is locked):
   - **Color**: Bright yellow rectangular button
   - **Text**: "Unlock"
   - **Win Requirement**: Displayed above button
     - **Format**: Golden trophy icon + "x{winCount}" (e.g., "x1K" = 1,000 wins)
     - **Meaning**: Number of wins required to unlock this world
   - **Function**: Unlocks the world (spends wins, changes button to Teleport)
   - **Available**: Only shown if world is not yet unlocked

### Trophy System

#### Trophy Multipliers Per World:
- **Island 1 (World 1)**: x1 trophy per mine completion
- **Island 2 / Beach World (World 2)**: x100 trophies per mine completion
- **Future Worlds**: Can have higher multipliers (x1,000, x10,000, etc.)

#### Trophy Earning:
- **Trigger**: When player completes a mine (reaches depth 1000 or wins)
- **Calculation**: `Trophies Earned = Base Trophy (1) × World Trophy Multiplier`
- **Examples**:
  - Complete mine in Island 1 → 1 × 1 = **1 trophy**
  - Complete mine in Island 2 → 1 × 100 = **100 trophies**
  - Complete mine in World 3 (if x1,000) → 1 × 1,000 = **1,000 trophies**

#### Trophy Storage:
- Store in `PlayerData` as `trophies: number`
- Persist across sessions
- Display in UI (HUD or stats panel)

### World Unlock System

#### Unlock Requirements:
- **Island 1**: Always unlocked (starting world)
- **Island 2 / Beach World**: Requires X wins to unlock
- **Future Worlds**: Each has its own win requirement (escalating: 1, 10, 100, 1K, 10K, etc.)

#### Unlock Process:
1. Player clicks "Unlock" button on locked world
2. System checks if player has enough wins
3. If yes:
   - Subtract wins from player's total
   - Mark world as unlocked in `PlayerData`
   - Save unlock state to persistence
   - Update UI (change Unlock button to Teleport button)
4. If no:
   - Show error message: "Not enough wins! Need X more wins."

#### Unlock Persistence:
- **Once Unlocked, Always Unlocked**: Unlock state is permanent
- **Storage**: Store in `PlayerData` as `unlockedWorlds: string[]` or `unlockedWorlds: Set<string>`
- **Persistence**: Save to player data file, load on join
- **No Re-locking**: Worlds cannot be locked again once unlocked

#### Win Requirements (Examples):
- **Island 1**: Always unlocked (0 wins)
- **Island 2 / Beach**: 1 win (or higher, TBD)
- **World 3 (Moon)**: 100 wins
- **World 4 (Frostlands)**: 1,000 wins
- **World 5 (Ashlands)**: 10,000 wins

### Teleportation System

#### Teleport Function:
- **Trigger**: Click "Teleport" button on unlocked world
- **Action**: 
  1. Save current world state (if in mine, save mine state)
  2. Switch to target world context
  3. Teleport player to target world spawn point
  4. Load/restore target world mine state (if player was in mine)
  5. Update UI to show current world

#### Teleport Locations:
- **Island 1**: Spawn at X: 0, Y: 10, Z: 0 (or surface spawn point)
- **Island 2 / Beach**: Spawn at X: 500, Y: 10, Z: 0 (or Island 2 surface spawn)
- **Future Worlds**: Each has its own spawn point

#### Teleport Restrictions:
- **Must Be Unlocked**: Can only teleport to unlocked worlds
- **No Cooldown**: Players can teleport freely between unlocked worlds
- **State Preservation**: Current mine state is saved before teleporting

### Implementation Details

#### PlayerData Updates:
```typescript
interface PlayerData {
  // ... existing fields ...
  
  /** Total trophies earned across all worlds */
  trophies: number;
  
  /** List of unlocked world IDs */
  unlockedWorlds: string[]; // e.g., ['island1', 'island2', 'moon']
  
  /** Current world player is in */
  currentWorld: string; // e.g., 'island1', 'island2'
}
```

#### World Configuration:
```typescript
interface WorldConfig {
  id: string; // 'island1', 'island2', 'moon', etc.
  name: string; // 'Island 1', 'Beach World', 'Moon World'
  trophyMultiplier: number; // 1, 100, 1000, etc.
  unlockWinsRequired: number; // 0 = always unlocked, 1, 100, 1000, etc.
  spawnPoint: { x: number; y: number; z: number };
  mapFile: string; // 'map.json', 'BeachMap.json', etc.
  mapOffset?: { x: number; z: number }; // For map placement
  backgroundImage?: string; // Path to world preview image
  featureIcons?: string[]; // Paths to feature icon images
}
```

#### World Database:
```typescript
const WORLD_DATABASE: Record<string, WorldConfig> = {
  island1: {
    id: 'island1',
    name: 'Island 1',
    trophyMultiplier: 1,
    unlockWinsRequired: 0, // Always unlocked
    spawnPoint: { x: 0, y: 10, z: 0 },
    mapFile: 'map.json',
    mapOffset: { x: 0, z: 0 },
  },
  island2: {
    id: 'island2',
    name: 'Beach World',
    trophyMultiplier: 100,
    unlockWinsRequired: 1, // Requires 1 win
    spawnPoint: { x: 500, y: 10, z: 0 },
    mapFile: 'BeachMap.json',
    mapOffset: { x: 500, z: 0 },
  },
  // Future worlds...
};
```

### UI Implementation Checklist:

#### HUD Element:
- [ ] Add world selection button to left HUD (next to shop buttons)
- [ ] Create click handler to open/close Worlds panel
- [ ] Style button to match existing HUD elements

#### Worlds Panel:
- [ ] Create Worlds UI panel component
- [ ] Add "Worlds" title at top
- [ ] Add close button (red X) in top right
- [ ] Implement scrollable list container
- [ ] Style with blue background and pickaxe/star patterns
- [ ] Add scrollbar styling

#### World Entry Panel:
- [ ] Create world entry panel component
- [ ] Display world name (left side, white text)
- [ ] Display trophy multiplier (golden trophy icon + "x{multiplier}")
- [ ] Add background image (blurred world preview)
- [ ] Add feature icons (optional)
- [ ] Implement Teleport button (green, if unlocked)
- [ ] Implement Unlock button (yellow, if locked)
- [ ] Display win requirement above Unlock button
- [ ] Handle button click events

#### Backend Integration:
- [ ] Add `trophies` field to `PlayerData`
- [ ] Add `unlockedWorlds` field to `PlayerData`
- [ ] Add `currentWorld` field to `PlayerData`
- [ ] Create `WORLD_DATABASE` with world configurations
- [ ] Implement `unlockWorld(player, worldId)` function
- [ ] Implement `teleportToWorld(player, worldId)` function
- [ ] Implement `awardTrophies(player, worldId)` function (on mine completion)
- [ ] Update persistence to save/load world unlock state

#### Trophy System:
- [ ] Award trophies when player completes mine (reaches depth 1000)
- [ ] Calculate trophies: `1 × worldTrophyMultiplier`
- [ ] Display trophy count in UI (HUD or stats)
- [ ] Update trophy display when trophies are earned

#### World Switching:
- [ ] Save current world mine state before teleport
- [ ] Load target world mine state after teleport
- [ ] Update `currentWorld` in `PlayerData`
- [ ] Teleport player to world spawn point
- [ ] Update UI to reflect current world

### UI Event Flow:

#### Opening Worlds Panel:
1. Player clicks HUD world selection button
2. UI sends `{ type: 'OPEN_WORLDS_PANEL' }` to server
3. Server responds with `{ type: 'WORLDS_PANEL_DATA', worlds: [...] }`
4. Client displays Worlds panel with world list

#### Unlocking a World:
1. Player clicks "Unlock" button on locked world
2. UI sends `{ type: 'UNLOCK_WORLD', worldId: 'island2' }` to server
3. Server checks if player has enough wins
4. If yes:
   - Subtract wins from player
   - Add world to `unlockedWorlds`
   - Save player data
   - Respond with `{ type: 'WORLD_UNLOCKED', worldId: 'island2', remainingWins: X }`
5. If no:
   - Respond with `{ type: 'UNLOCK_FAILED', message: 'Not enough wins!' }`
6. Client updates UI (changes Unlock to Teleport button)

#### Teleporting to World:
1. Player clicks "Teleport" button on unlocked world
2. UI sends `{ type: 'TELEPORT_TO_WORLD', worldId: 'island2' }` to server
3. Server:
   - Saves current world mine state
   - Switches to target world context
   - Loads/restores target world mine state
   - Teleports player to spawn point
   - Responds with `{ type: 'TELEPORTED', worldId: 'island2' }`
4. Client updates UI to show current world

### Visual Design Notes:

#### Color Scheme:
- **Panel Background**: Dark with blue border
- **Teleport Button**: Bright green (#00FF00 or similar)
- **Unlock Button**: Bright yellow (#FFFF00 or similar)
- **Trophy Icon**: Golden/yellow
- **Text**: White for world names, appropriate colors for other text

#### Layout:
- **World Name**: Top left, prominent
- **Trophy Multiplier**: Below name, smaller text with icon
- **Action Button**: Right side, prominent
- **Background Image**: Blurred, behind all elements
- **Feature Icons**: Small, positioned appropriately

#### Responsive Design:
- **Scrollable**: If more than 3-4 worlds, enable scrolling
- **Panel Size**: Fixed width, variable height based on content
- **Button Size**: Large enough for easy clicking

### Future Expansion:

#### Additional Worlds:
- Easy to add new worlds by adding entries to `WORLD_DATABASE`
- Each world can have:
  - Unique trophy multiplier
  - Unique unlock requirement
  - Unique spawn point
  - Unique map file
  - Unique theme/background

#### Trophy Shop (Future):
- Could add trophy shop where players spend trophies
- Unlock cosmetic items, upgrades, etc.
- Trophy count displayed prominently

#### World Progression:
- Worlds unlock in sequence (Island 1 → Island 2 → Moon → Frostlands → Ashlands)
- Higher worlds = higher trophy multipliers
- Creates progression incentive

---

## 14. Dynamic World System Architecture

### Overview
The world system should be designed from the ground up to easily add new worlds/islands without modifying core game logic. All world-specific data should be configuration-driven and separated from game systems.

### Core Design Principles

#### 1. Configuration-Driven Architecture
- **All world data in configuration files/objects** - No hardcoded world logic
- **World registry system** - Central database of all worlds
- **Dynamic loading** - Worlds loaded from config, not hardcoded
- **Easy addition** - Adding a world = adding a config entry

#### 2. Separation of Concerns
- **World Data**: Separate from game logic
- **World Manager**: Handles world switching, loading, state
- **Game Systems**: Work with any world (ore database, training rocks, pets)
- **UI Systems**: Dynamically generate from world config

#### 3. Modular World Components
Each world should be self-contained with:
- **Ore Database**: World-specific ores
- **Training Rock Data**: World-specific training values
- **Pet Database**: World-specific pets
- **Map File**: World-specific map
- **Spawn Point**: World-specific spawn location
- **NPC Positions**: World-specific NPC locations

### World Configuration System

#### World Configuration Structure
```typescript
interface WorldConfig {
  // Basic Info
  id: string;                    // Unique identifier: 'island1', 'island2', 'moon', etc.
  name: string;                 // Display name: 'Island 1', 'Beach World', 'Moon World'
  displayOrder: number;          // Order in UI list (0 = first, 1 = second, etc.)
  
  // Unlock System
  unlockWinsRequired: number;    // Wins needed to unlock (0 = always unlocked)
  isUnlockedByDefault: boolean; // If true, ignore unlockWinsRequired
  
  // Trophy System
  trophyMultiplier: number;      // Trophies per mine completion (1, 100, 1000, etc.)
  
  // Map & Spawn
  mapFile: string;               // 'map.json', 'BeachMap.json', 'MoonMap.json'
  mapOffset: { x: number; z: number }; // Where to place map in world
  spawnPoint: { x: number; y: number; z: number }; // Player spawn location
  
  // Visual
  backgroundImage?: string;       // Path to world preview image
  featureIcons?: string[];       // Array of feature icon paths
  themeColor?: string;           // Hex color for UI theming
  
  // World-Specific Data Files
  oreDatabaseFile?: string;     // Path to world-specific ore database
  trainingRockFile?: string;    // Path to world-specific training rock data
  petDatabaseFile?: string;     // Path to world-specific pet data
  
  // Mining Area
  miningAreaBounds: {
    minX: number;
    maxX: number;
    y: number;
    minZ: number;
    maxZ: number;
  };
  sharedShaftConfig: {
    topY: number;
    bottomY: number;
    teleportThresholdY: number;
  };
  
  // NPC Positions (optional - can be in map file instead)
  npcPositions?: {
    merchant?: { x: number; y: number; z: number };
    mineResetUpgrade?: { x: number; y: number; z: number };
    gemTrader?: { x: number; y: number; z: number };
    eggStations?: Array<{ x: number; y: number; z: number; eggType: string }>;
  };
  
  // Training Rock Positions (optional - can be auto-detected)
  trainingRockPositions?: Array<{
    x: number;
    y: number;
    z: number;
    tier: string;
  }>;
}
```

#### World Registry (Central Database)
```typescript
// worlds/WorldRegistry.ts
export class WorldRegistry {
  private static worlds: Map<string, WorldConfig> = new Map();
  private static worldOrder: string[] = []; // Ordered list of world IDs
  
  /**
   * Register a new world configuration
   * This is called during initialization to add all worlds
   */
  static registerWorld(config: WorldConfig): void {
    this.worlds.set(config.id, config);
    this.worldOrder.push(config.id);
    this.worldOrder.sort((a, b) => {
      const worldA = this.worlds.get(a)!;
      const worldB = this.worlds.get(b)!;
      return worldA.displayOrder - worldB.displayOrder;
    });
  }
  
  /**
   * Get world configuration by ID
   */
  static getWorld(id: string): WorldConfig | undefined {
    return this.worlds.get(id);
  }
  
  /**
   * Get all registered worlds in display order
   */
  static getAllWorlds(): WorldConfig[] {
    return this.worldOrder.map(id => this.worlds.get(id)!);
  }
  
  /**
   * Get worlds that player can see (unlocked or next to unlock)
   */
  static getVisibleWorlds(playerUnlockedWorlds: string[]): WorldConfig[] {
    return this.getAllWorlds().filter(world => {
      // Always show first world
      if (world.isUnlockedByDefault || world.unlockWinsRequired === 0) {
        return true;
      }
      // Show if unlocked
      if (playerUnlockedWorlds.includes(world.id)) {
        return true;
      }
      // Show next world to unlock (if player has enough wins for previous)
      // This logic can be expanded
      return true; // For now, show all
    });
  }
}
```

### World Data File Structure

#### Recommended File Organization:
```
src/
  worlds/
    WorldRegistry.ts          // Central world registry
    WorldManager.ts           // World switching, loading logic
    configs/
      Island1Config.ts        // Island 1 configuration
      Island2Config.ts        // Island 2 configuration
      MoonWorldConfig.ts      // Future: Moon world config
      // ... more world configs
    data/
      island1/
        Ores.ts              // Island 1 ore database
        TrainingRocks.ts      // Island 1 training rock data
        Pets.ts              // Island 1 pet database
      island2/
        Ores.ts              // Island 2 ore database
        TrainingRocks.ts      // Island 2 training rock data
        Pets.ts              // Island 2 pet database
      moon/
        Ores.ts              // Future: Moon world ores
        TrainingRocks.ts      // Future: Moon world training rocks
        Pets.ts              // Future: Moon world pets
```

#### Example: Adding a New World (Workflow)

**Step 1: Create World Configuration File**
```typescript
// worlds/configs/MoonWorldConfig.ts
import { WorldConfig } from '../WorldConfig';

export const MOON_WORLD_CONFIG: WorldConfig = {
  id: 'moon',
  name: 'Moon World',
  displayOrder: 3,
  unlockWinsRequired: 100,
  isUnlockedByDefault: false,
  trophyMultiplier: 1000,
  mapFile: 'MoonMap.json',
  mapOffset: { x: 1000, z: 0 },
  spawnPoint: { x: 1000, y: 10, z: 0 },
  backgroundImage: 'images/worlds/moon-preview.png',
  featureIcons: ['icons/moon-base.png', 'icons/space-station.png'],
  themeColor: '#C0C0C0',
  miningAreaBounds: {
    minX: 996,
    maxX: 1002,
    y: 0,
    minZ: 16,
    maxZ: 22,
  },
  sharedShaftConfig: {
    topY: 0,
    bottomY: -10,
    teleportThresholdY: -5.5,
  },
};
```

**Step 2: Create World Data Files**
```typescript
// worlds/data/moon/Ores.ts
export const MOON_ORE_DATABASE = {
  // ... moon-specific ores
};

// worlds/data/moon/TrainingRocks.ts
export const MOON_TRAINING_ROCKS = {
  // ... moon-specific training rocks
};

// worlds/data/moon/Pets.ts
export const MOON_PET_DATABASE = {
  // ... moon-specific pets
};
```

**Step 3: Register World**
```typescript
// In index.ts or WorldRegistry initialization
import { WorldRegistry } from './worlds/WorldRegistry';
import { MOON_WORLD_CONFIG } from './worlds/configs/MoonWorldConfig';

WorldRegistry.registerWorld(MOON_WORLD_CONFIG);
```

**That's it!** The world is now available in the system.

### World Manager System

#### WorldManager Class
```typescript
// worlds/WorldManager.ts
export class WorldManager {
  private world: World;
  private currentWorlds: Map<string, WorldContext> = new Map();
  
  /**
   * Initialize all registered worlds
   * Loads maps, sets up contexts
   */
  initializeAllWorlds(): void {
    const worlds = WorldRegistry.getAllWorlds();
    for (const config of worlds) {
      this.initializeWorld(config);
    }
  }
  
  /**
   * Initialize a single world
   */
  private initializeWorld(config: WorldConfig): void {
    // Load map at offset
    this.world.loadMap(config.mapFile, { offset: config.mapOffset });
    
    // Create world context
    const context: WorldContext = {
      config,
      oreDatabase: this.loadOreDatabase(config),
      trainingRocks: this.loadTrainingRocks(config),
      pets: this.loadPets(config),
      // ... other world-specific data
    };
    
    this.currentWorlds.set(config.id, context);
  }
  
  /**
   * Switch player to a different world
   */
  switchPlayerWorld(
    player: Player,
    targetWorldId: string
  ): void {
    const targetWorld = WorldRegistry.getWorld(targetWorldId);
    if (!targetWorld) {
      throw new Error(`World ${targetWorldId} not found`);
    }
    
    // Save current world state
    this.saveCurrentWorldState(player);
    
    // Load target world context
    const context = this.currentWorlds.get(targetWorldId);
    if (!context) {
      throw new Error(`World ${targetWorldId} not initialized`);
    }
    
    // Switch player context
    this.setPlayerWorldContext(player, context);
    
    // Teleport player
    this.teleportPlayerToWorld(player, targetWorld);
  }
  
  /**
   * Get world-specific data for current world
   */
  getWorldOreDatabase(worldId: string): OreDatabase {
    const context = this.currentWorlds.get(worldId);
    return context?.oreDatabase || DEFAULT_ORE_DATABASE;
  }
  
  // ... more methods
}
```

### Dynamic Data Loading

#### Ore Database Loading
```typescript
// worlds/data/loaders/OreDatabaseLoader.ts
export class OreDatabaseLoader {
  /**
   * Load ore database for a specific world
   * Dynamically imports world-specific ore data
   */
  static async loadOreDatabase(worldId: string): Promise<OreDatabase> {
    switch (worldId) {
      case 'island1':
        const { ISLAND1_ORE_DATABASE } = await import('../island1/Ores');
        return ISLAND1_ORE_DATABASE;
      case 'island2':
        const { ISLAND2_ORE_DATABASE } = await import('../island2/Ores');
        return ISLAND2_ORE_DATABASE;
      case 'moon':
        const { MOON_ORE_DATABASE } = await import('../moon/Ores');
        return MOON_ORE_DATABASE;
      default:
        // Fallback to default
        return DEFAULT_ORE_DATABASE;
    }
  }
}
```

#### Better: Configuration-Based Loading
```typescript
// Even more dynamic - no switch statement needed
export class OreDatabaseLoader {
  static async loadOreDatabase(worldId: string): Promise<OreDatabase> {
    try {
      // Try to load world-specific database
      const module = await import(`../${worldId}/Ores`);
      return module[`${worldId.toUpperCase()}_ORE_DATABASE`] || DEFAULT_ORE_DATABASE;
    } catch {
      // Fallback if file doesn't exist
      return DEFAULT_ORE_DATABASE;
    }
  }
}
```

### Game System Integration

#### Mining System - World-Aware
```typescript
// MiningSystem should work with any world's ore database
export class MiningSystem {
  private worldManager: WorldManager;
  
  /**
   * Get ore database for player's current world
   */
  private getOreDatabaseForPlayer(player: Player): OreDatabase {
    const currentWorld = this.worldManager.getPlayerCurrentWorld(player);
    return this.worldManager.getWorldOreDatabase(currentWorld.id);
  }
  
  /**
   * Generate ore based on player's current world
   */
  generateOre(player: Player, depth: number): OreType {
    const oreDatabase = this.getOreDatabaseForPlayer(player);
    const generator = new OreGenerator(oreDatabase);
    return generator.generateOre(depth, playerLuck);
  }
}
```

#### Training System - World-Aware
```typescript
// TrainingController should work with any world's training rocks
export class TrainingController {
  private worldManager: WorldManager;
  
  /**
   * Get training rock data for player's current world
   */
  private getTrainingRocksForPlayer(player: Player): TrainingRockDatabase {
    const currentWorld = this.worldManager.getPlayerCurrentWorld(player);
    return this.worldManager.getWorldTrainingRocks(currentWorld.id);
  }
}
```

#### Pet System - World-Aware
```typescript
// PetManager should work with any world's pet database
export class PetManager {
  private worldManager: WorldManager;
  
  /**
   * Get pet database for player's current world
   */
  private getPetDatabaseForPlayer(player: Player): PetDatabase {
    const currentWorld = this.worldManager.getPlayerCurrentWorld(player);
    return this.worldManager.getWorldPets(currentWorld.id);
  }
}
```

### UI System - Dynamic Generation

#### Worlds Panel - Auto-Generated
```typescript
// UI automatically generates from WorldRegistry
export function generateWorldsPanel(): WorldPanelData {
  const worlds = WorldRegistry.getAllWorlds();
  const playerUnlocked = getPlayerUnlockedWorlds();
  
  return {
    worlds: worlds.map(world => ({
      id: world.id,
      name: world.name,
      trophyMultiplier: world.trophyMultiplier,
      isUnlocked: playerUnlocked.includes(world.id),
      unlockWinsRequired: world.unlockWinsRequired,
      backgroundImage: world.backgroundImage,
      featureIcons: world.featureIcons,
    })),
  };
}
```

**No hardcoded world list!** UI automatically shows all registered worlds.

### Mine Instance Management - Per World

#### Enhanced MiningState
```typescript
interface MiningState {
  // ... existing fields ...
  
  /** Which world this mine belongs to */
  worldId: string;
  
  /** World-specific offset (base position for this world) */
  worldBaseOffset: { x: number; z: number };
}
```

#### Mine Instance Key
```typescript
// Each player can have mines in multiple worlds
interface PlayerMineInstances {
  // Map of worldId -> MiningState
  mines: Map<string, MiningState>;
  
  // Current world player is in
  currentWorld: string;
}
```

**Benefits:**
- Each world has isolated mine instances
- Easy to add new worlds (just add new map entry)
- No conflicts between worlds

### Adding a New World - Complete Checklist

#### Step 1: Create World Configuration
- [ ] Create `worlds/configs/{WorldName}Config.ts`
- [ ] Define `WorldConfig` with all required fields
- [ ] Set appropriate `displayOrder`, `unlockWinsRequired`, `trophyMultiplier`
- [ ] Define `mapOffset` (ensure no overlap with existing worlds)
- [ ] Define `spawnPoint` within world bounds
- [ ] Define `miningAreaBounds` for new world

#### Step 2: Create World Data Files
- [ ] Create `worlds/data/{worldId}/Ores.ts` with ore database
- [ ] Create `worlds/data/{worldId}/TrainingRocks.ts` with training rock data
- [ ] Create `worlds/data/{worldId}/Pets.ts` with pet database
- [ ] Export all data with consistent naming: `{WORLD_ID}_ORE_DATABASE`

#### Step 3: Create Map File
- [ ] Create map file (e.g., `assets/{WorldName}Map.json`)
- [ ] Place mining area blocks at correct coordinates
- [ ] Place training rock blocks
- [ ] Place NPC positions (or define in config)
- [ ] Add world-specific blocks/textures

#### Step 4: Register World
- [ ] Import world config in `WorldRegistry` initialization
- [ ] Call `WorldRegistry.registerWorld(config)`
- [ ] Verify world appears in UI

#### Step 5: Test
- [ ] Test world loads correctly
- [ ] Test teleportation to new world
- [ ] Test mining with new ores
- [ ] Test training with new training rocks
- [ ] Test pets with new pet database
- [ ] Test unlock system (if requires wins)
- [ ] Test trophy multiplier

**That's it!** No core game logic changes needed.

### Configuration Validation

#### World Config Validator
```typescript
// worlds/WorldConfigValidator.ts
export class WorldConfigValidator {
  static validate(config: WorldConfig): ValidationResult {
    const errors: string[] = [];
    
    // Required fields
    if (!config.id) errors.push('World ID is required');
    if (!config.name) errors.push('World name is required');
    if (!config.mapFile) errors.push('Map file is required');
    
    // Uniqueness checks
    if (WorldRegistry.getWorld(config.id)) {
      errors.push(`World ID ${config.id} already exists`);
    }
    
    // Coordinate validation
    if (this.hasOverlappingMapOffset(config)) {
      errors.push('Map offset overlaps with existing world');
    }
    
    // ... more validations
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  private static hasOverlappingMapOffset(config: WorldConfig): boolean {
    // Check if map offset conflicts with existing worlds
    const existingWorlds = WorldRegistry.getAllWorlds();
    // ... overlap detection logic
    return false;
  }
}
```

### World Context System

#### WorldContext Interface
```typescript
interface WorldContext {
  config: WorldConfig;
  oreDatabase: OreDatabase;
  trainingRocks: TrainingRockDatabase;
  pets: PetDatabase;
  mapLoaded: boolean;
  npcsSpawned: boolean;
  // ... other world-specific state
}
```

**Benefits:**
- All world data in one place
- Easy to switch contexts
- Clean separation of concerns

### Future-Proofing Considerations

#### 1. World-Specific Features
Some worlds might have unique features:
- **Moon World**: Low gravity, oxygen system
- **Frostlands**: Cold damage, ice mechanics
- **Ashlands**: Heat damage, lava mechanics

**Solution:** Add optional feature flags to `WorldConfig`:
```typescript
interface WorldConfig {
  // ... existing fields ...
  
  features?: {
    lowGravity?: boolean;
    requiresOxygen?: boolean;
    environmentalDamage?: {
      type: 'cold' | 'heat' | 'poison';
      damagePerSecond: number;
    };
  };
}
```

#### 2. World-Specific Game Modes
Some worlds might have different rules:
- **Speed Run World**: Time limits
- **Hardcore World**: No respawns
- **Creative World**: Unlimited resources

**Solution:** Add `gameMode` to `WorldConfig`:
```typescript
interface WorldConfig {
  // ... existing fields ...
  
  gameMode?: 'normal' | 'speedrun' | 'hardcore' | 'creative';
  gameModeSettings?: Record<string, any>;
}
```

#### 3. World Progression Requirements
Some worlds might require:
- Complete previous world X times
- Reach certain depth in previous world
- Collect certain items

**Solution:** Expand unlock system:
```typescript
interface WorldConfig {
  // ... existing fields ...
  
  unlockRequirements?: {
    wins?: number;
    previousWorldCompletions?: { worldId: string; count: number };
    maxDepth?: number;
    itemsCollected?: { itemId: string; count: number }[];
  };
}
```

### Best Practices for Adding Worlds

#### 1. Consistent Naming
- World IDs: lowercase, underscore: `island1`, `island2`, `moon_world`
- Config files: PascalCase: `Island1Config.ts`, `MoonWorldConfig.ts`
- Data exports: UPPER_SNAKE_CASE: `ISLAND1_ORE_DATABASE`

#### 2. Coordinate Planning
- **Map out coordinate ranges** before adding world
- **Document coordinate ranges** in world config comments
- **Use coordinate calculator** to ensure no overlaps
- **Leave buffer zones** between worlds (50+ blocks)

#### 3. Data Organization
- **One folder per world** in `worlds/data/`
- **Consistent file structure** (Ores.ts, TrainingRocks.ts, Pets.ts)
- **Export naming convention** matches world ID

#### 4. Testing Checklist
- Always test world isolation (no interference with other worlds)
- Test mine instance generation
- Test world switching
- Test unlock system
- Test trophy multiplier

### Summary: Adding a World is Now Just:

1. **Create config file** → Define world properties
2. **Create data files** → Define ores, training rocks, pets
3. **Create map file** → Build world geometry
4. **Register world** → One line: `WorldRegistry.registerWorld(config)`
5. **Done!** → World automatically appears in UI, works with all systems

**No core game logic changes required!**

---

## Notes

- This plan now covers ADDING a second world alongside the existing one (not replacing)
- You'll need a world selection system to allow players to choose between islands
- All progression balance should feel similar between worlds - same difficulty curve, same time-to-complete expectations
- Each island has its own ores, pets, and training rock values but shared game systems
- The map structure needs Island 2 added to map.json with same layout but offset coordinates

