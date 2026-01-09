# Island 2 Implementation Roadmap

## Overview
This document outlines the step-by-step implementation plan for adding Island 2 (Beach World) to the game. All planning information has been collected and confirmed.

---

## Phase 1: World System Foundation (Core Architecture)

### 1.1 Create World System Infrastructure
**Goal**: Set up the foundation for multi-world support

**Tasks**:
- [ ] Create `src/worlds/` directory structure
- [ ] Create `WorldConfig.ts` interface (from planning doc section 14)
- [ ] Create `WorldRegistry.ts` class (central world database)
- [ ] Create `WorldManager.ts` class (world switching, loading logic)
- [ ] Create `WorldContext.ts` interface (per-world state)

**Files to Create**:
- `src/worlds/WorldConfig.ts`
- `src/worlds/WorldRegistry.ts`
- `src/worlds/WorldManager.ts`
- `src/worlds/types/WorldContext.ts`

**Estimated Time**: 2-3 hours

---

### 1.2 Update PlayerData for Multi-World Support
**Goal**: Add world tracking to player data

**Tasks**:
- [ ] Add `currentWorld: string` to `PlayerData` interface
- [ ] Add `unlockedWorlds: string[]` to `PlayerData` interface
- [ ] Add `trophies: number` to `PlayerData` interface
- [ ] Add per-world mine state tracking:
  - `worldMineStates: Map<string, MiningState>`
  - `worldMineResetUpgrades: Map<string, boolean>` (per-world upgrade state)
  - `worldMineTimers: Map<string, { remainingSeconds: number, isUpgraded: boolean }>`
- [ ] Update `PersistenceManager` to save/load world data

**Files to Modify**:
- `src/Core/PlayerData.ts`
- `src/Core/PersistenceManager.ts`

**Estimated Time**: 1-2 hours

---

## Phase 2: Island 2 Data Files (Ores, Training Rocks, Pets)

### 2.1 Create Island 2 Ore Database
**Goal**: Create Island 2 ore definitions with all 24 ocean-themed ores

**Tasks**:
- [ ] Create `src/worlds/data/island2/Ores.ts`
- [ ] Define `ISLAND2_ORE_TYPE` enum (24 ores: Dunestone → Tradewindite)
- [ ] Create `ISLAND2_ORE_DATABASE` with all ore properties:
  - Rarity, base value, firstDepth, firstHealth, lastDepth, lastHealth
  - Block identifiers, colors (from planning doc)
- [ ] Export ore database

**Files to Create**:
- `src/worlds/data/island2/Ores.ts`

**Data Source**: Planning doc section 2 (all 24 ores with values)

**Estimated Time**: 2-3 hours

---

### 2.2 Create Island 2 Training Rock Database
**Goal**: Create Island 2 training rock definitions

**Tasks**:
- [ ] Create `src/worlds/data/island2/TrainingRocks.ts`
- [ ] Define `ISLAND2_TRAINING_ROCK_TIER` enum (6 tiers)
- [ ] Create training rock database with:
  - Unlock requirements (Power OR Rebirths)
  - UI power bonuses (+300 to +25,000)
  - Formula constants (10.157... to 848.632...)
  - Hit rates (3/sec for rocks 1-5, 4/sec for rock 6)
  - Training rock names ("Dunestone Training Area", etc.)
- [ ] Map block types to tiers (Dunestone→Rock1, Barnacite→Rock2, etc.)

**Files to Create**:
- `src/worlds/data/island2/TrainingRocks.ts`

**Data Source**: Planning doc section 3 (training rock formulas and specs)

**Estimated Time**: 2-3 hours

---

### 2.3 Create Island 2 Pet Database
**Goal**: Create Island 2 pet definitions with all 17 ocean-themed pets

**Tasks**:
- [ ] Create `src/worlds/data/island2/Pets.ts`
- [ ] Define `ISLAND2_EGG_TYPE` enum (Abyssal, Boardwalk, Shipwreck)
- [ ] Create `ISLAND2_EGG_DEFINITIONS` with costs (100K, 250M, 1B)
- [ ] Create `ISLAND2_PET_IDS` object (17 pet IDs)
- [ ] Create `ISLAND2_PET_DEFINITIONS` array with:
  - Pet names, rarities, multipliers
  - Drop rates converted to weights
- [ ] Create `ISLAND2_EGG_LOOT_TABLES` with pet distributions

**Files to Create**:
- `src/worlds/data/island2/Pets.ts`

**Data Source**: Planning doc section 4 (all 17 pets with drop rates)

**Estimated Time**: 2-3 hours

---

### 2.4 Create Island 2 World Configuration
**Goal**: Create Island 2 world config file

**Tasks**:
- [ ] Create `src/worlds/configs/Island2Config.ts`
- [ ] Define `ISLAND2_CONFIG: WorldConfig` with:
  - Basic info (id: 'island2', name: 'Beach World', displayOrder: 2)
  - Unlock requirement (1 win)
  - Trophy multiplier (x100)
  - Map file ('BeachMap.json')
  - Map offset (X: 750, Z: 750)
  - Spawn point (X: 750, Y: 10, Z: 750)
  - Mining area bounds (X: 746-752, Z: 766-772)
  - NPC positions (all offset by 750, 750)
  - Training rock positions (same relative, offset)
  - Data file references (Ores.ts, TrainingRocks.ts, Pets.ts)

**Files to Create**:
- `src/worlds/configs/Island2Config.ts`

**Data Source**: Planning doc section 12 (map placement, NPC positions)

**Estimated Time**: 1 hour

---

## Phase 3: Update Core Systems for Multi-World Support

### 3.1 Update MiningSystem for Multi-World
**Goal**: Make mining system world-aware

**Tasks**:
- [ ] Update `MiningSystem` to accept world context
- [ ] Change `miningStates` from `Map<Player, MiningState>` to `Map<Player, Map<string, MiningState>>` (per-world)
- [ ] Update `getOrCreateOffset()` to account for world base position
- [ ] Update ore generation to use world-specific `ORE_DATABASE`
- [ ] Add method `getMiningState(player, worldId)`
- [ ] Add method `switchWorld(player, fromWorld, toWorld)` - saves/loads mine state
- [ ] Update mine reset logic to be world-specific

**Files to Modify**:
- `src/Mining/MiningSystem.ts`
- `src/Mining/OreGenerator.ts` (make it accept ore database parameter)

**Estimated Time**: 3-4 hours

---

### 3.2 Update TrainingController for Multi-World
**Goal**: Make training system world-aware

**Tasks**:
- [ ] Update `TrainingController` to accept world context
- [ ] Update training rock detection to use world-specific block types
- [ ] Update training rock database lookup to use world-specific data
- [ ] Update power gain formulas to use world-specific constants
- [ ] Update hit rates (3/sec vs 4/sec) based on world
- [ ] Add block type mapping for Island 2 (Dunestone→Rock1, etc.)

**Files to Modify**:
- `src/Surface/Training/TrainingController.ts`
- `src/Surface/Training/TrainingSystem.ts`
- `src/Surface/Training/TrainingRockLocator.ts`

**Estimated Time**: 2-3 hours

---

### 3.3 Update PetManager for Multi-World
**Goal**: Make pet system world-aware

**Tasks**:
- [ ] Update `PetManager` to accept world context
- [ ] Update pet database lookup to use world-specific data
- [ ] Update egg hatching to use world-specific egg definitions
- [ ] Update pet definitions to use world-specific pets
- [ ] Ensure pet inventory is shared across worlds (or separate? - need decision)

**Files to Modify**:
- `src/Pets/PetManager.ts`
- `src/Pets/HatchingSystem.ts`

**Estimated Time**: 2-3 hours

---

### 3.4 Update GameManager for Multi-World
**Goal**: Add world management to GameManager

**Tasks**:
- [ ] Add `WorldManager` instance to `GameManager`
- [ ] Add `currentWorld: Map<Player, string>` tracking
- [ ] Add method `switchPlayerWorld(player, targetWorldId)`
- [ ] Update `initializePlayerMine()` to accept world parameter
- [ ] Update `isPlayerInMine()` to check correct world
- [ ] Update mine reset timer to be world-specific
- [ ] Update mine reset upgrade purchase to be world-specific (2M vs 750B)
- [ ] Add trophy awarding on mine completion
- [ ] Add world unlock system

**Files to Modify**:
- `src/Core/GameManager.ts`

**Estimated Time**: 4-5 hours

---

## Phase 4: World Selection UI System

### 4.1 Create Worlds UI Panel
**Goal**: Create the Worlds selection UI

**Tasks**:
- [ ] Create `ui/worlds-panel.html` (or add to existing UI)
- [ ] Design Worlds panel layout (scrollable list, world entries)
- [ ] Add HUD button on left side (next to shop buttons)
- [ ] Implement panel open/close functionality
- [ ] Style with blue background, pickaxe/star patterns

**Files to Create/Modify**:
- `assets/ui/index.html` (add Worlds panel)
- `assets/ui/worlds-panel.css` (styling)

**Estimated Time**: 3-4 hours

---

### 4.2 Create World Entry Components
**Goal**: Create individual world entry UI components

**Tasks**:
- [ ] Create world entry panel component
- [ ] Display world name (left side)
- [ ] Display trophy multiplier (golden trophy icon + "x{multiplier}")
- [ ] Add background image (blurred world preview)
- [ ] Implement Teleport button (green, if unlocked)
- [ ] Implement Unlock button (yellow, if locked) with win requirement
- [ ] Handle button click events

**Files to Create/Modify**:
- `assets/ui/worlds-panel.html` (world entry template)

**Estimated Time**: 2-3 hours

---

### 4.3 Implement World Selection Backend
**Goal**: Connect UI to backend world system

**Tasks**:
- [ ] Add `OPEN_WORLDS_PANEL` UI event handler
- [ ] Add `WORLDS_PANEL_DATA` response (list of worlds with unlock status)
- [ ] Add `UNLOCK_WORLD` UI event handler
- [ ] Add `TELEPORT_TO_WORLD` UI event handler
- [ ] Implement world unlock logic (check wins, subtract, save)
- [ ] Implement world teleportation logic (save state, switch world, teleport)
- [ ] Update UI when world is unlocked/teleported

**Files to Modify**:
- `index.ts` (UI event handlers)
- `src/Core/GameManager.ts` (world unlock/teleport methods)

**Estimated Time**: 3-4 hours

---

## Phase 5: Map Loading & Initialization

### 5.1 Load Both Maps
**Goal**: Load Island 1 and Island 2 maps simultaneously

**Tasks**:
- [ ] Load `assets/map.json` at default position (X: 0, Z: 0)
- [ ] Load `assets/BeachMap.json` at offset (X: 750, Z: 750)
- [ ] Verify both maps load correctly
- [ ] Test coordinate ranges don't overlap

**Files to Modify**:
- `index.ts` (map loading in startServer)

**Estimated Time**: 1 hour

---

### 5.2 Initialize World Registry
**Goal**: Register all worlds in the system

**Tasks**:
- [ ] Create Island 1 config (or use existing as default)
- [ ] Import and register Island 2 config
- [ ] Initialize WorldManager with all registered worlds
- [ ] Load world-specific data files (ores, training rocks, pets)

**Files to Modify**:
- `index.ts` (world registration)
- `src/worlds/configs/Island1Config.ts` (create if needed)

**Estimated Time**: 1-2 hours

---

### 5.3 Spawn NPCs for Both Worlds
**Goal**: Spawn NPCs on both islands

**Tasks**:
- [ ] Update NPC spawning to be world-aware
- [ ] Spawn Island 1 NPCs at original positions
- [ ] Spawn Island 2 NPCs at offset positions (X: +750, Z: +750)
- [ ] Update NPC proximity detection to work with world context
- [ ] Update Mine Reset Upgrade NPC cost based on world (2M vs 750B)

**Files to Modify**:
- `index.ts` (NPC spawning)
- `src/Shop/MineResetUpgradeNPC.ts` (world-aware cost)

**Estimated Time**: 2-3 hours

---

## Phase 6: World Switching & State Management

### 6.1 Implement World Switch Logic
**Goal**: Handle player switching between worlds

**Tasks**:
- [ ] Implement `switchPlayerWorld()` in GameManager
- [ ] Save current world mine state before switch
- [ ] Reset mine (clear blocks, reset depth, reset timer)
- [ ] Load target world context (ores, training rocks, pets)
- [ ] Apply target world's timer state (2 min or 5 min)
- [ ] Teleport player to target world spawn
- [ ] Initialize fresh mine for target world
- [ ] Update `currentWorld` tracking

**Files to Modify**:
- `src/Core/GameManager.ts`
- `src/worlds/WorldManager.ts`

**Estimated Time**: 3-4 hours

---

### 6.2 Implement Per-World Mine State
**Goal**: Track mine state separately for each world

**Tasks**:
- [ ] Update `MiningSystem` to store mine states per world
- [ ] Save mine state when leaving world
- [ ] Load mine state when entering world (or generate fresh)
- [ ] Ensure mine blocks are isolated per world
- [ ] Test mine state persistence across world switches

**Files to Modify**:
- `src/Mining/MiningSystem.ts`
- `src/Core/GameManager.ts`

**Estimated Time**: 2-3 hours

---

### 6.3 Implement Per-World Timer System
**Goal**: Independent mine reset timers per world

**Tasks**:
- [ ] Update timer tracking to be per-world
- [ ] Store timer state: `Map<Player, Map<string, TimerState>>`
- [ ] Apply correct timer duration on world switch (2 min or 5 min)
- [ ] Update mine reset upgrade to be world-specific
- [ ] Test timer independence (upgrade in one world doesn't affect other)

**Files to Modify**:
- `src/Core/GameManager.ts`
- `src/Shop/MineResetUpgradeNPC.ts`

**Estimated Time**: 2-3 hours

---

## Phase 7: Trophy System

### 7.1 Implement Trophy Earning
**Goal**: Award trophies when player completes a mine

**Tasks**:
- [ ] Add trophy awarding on mine completion (depth 1000)
- [ ] Calculate trophies: `1 × worldTrophyMultiplier`
- [ ] Update player's trophy count
- [ ] Save trophies to persistence
- [ ] Display trophy count in UI

**Files to Modify**:
- `src/Core/GameManager.ts` (mine completion handler)
- `src/Mining/MiningSystem.ts` (completion detection)

**Estimated Time**: 1-2 hours

---

### 7.2 Implement World Unlock System
**Goal**: Allow players to unlock worlds with wins

**Tasks**:
- [ ] Check player wins when unlocking world
- [ ] Subtract wins from player total
- [ ] Add world to `unlockedWorlds` array
- [ ] Save unlock state to persistence
- [ ] Update UI to show Teleport button instead of Unlock
- [ ] Prevent re-unlocking already unlocked worlds

**Files to Modify**:
- `src/Core/GameManager.ts` (unlock method)
- `index.ts` (UI event handler)

**Estimated Time**: 1-2 hours

---

## Phase 8: Testing & Validation

### 8.1 Basic Functionality Testing
**Tasks**:
- [ ] Test world selection UI opens/closes
- [ ] Test world unlock (spend wins, unlock Island 2)
- [ ] Test world teleportation (switch between worlds)
- [ ] Test spawn points (player spawns at correct location)
- [ ] Test mine generation (ores spawn correctly in each world)
- [ ] Test training rocks (work correctly in each world)
- [ ] Test pets (hatch correctly in each world)

**Estimated Time**: 2-3 hours

---

### 8.2 World Isolation Testing
**Tasks**:
- [ ] Test mine state isolation (mines don't interfere between worlds)
- [ ] Test timer independence (timers work separately)
- [ ] Test upgrade independence (upgrade in one world doesn't affect other)
- [ ] Test NPCs work correctly on both worlds
- [ ] Test coordinate calculations (no overlaps)

**Estimated Time**: 2-3 hours

---

### 8.3 Progression Testing
**Tasks**:
- [ ] Test trophy earning (correct multiplier per world)
- [ ] Test world unlock progression
- [ ] Test persistence (save/load world states correctly)
- [ ] Test mine reset on world switch
- [ ] Test all game systems work in both worlds

**Estimated Time**: 2-3 hours

---

## Phase 9: Polish & Optimization

### 9.1 UI Polish
**Tasks**:
- [ ] Add world preview background images
- [ ] Add feature icons to world entries
- [ ] Polish Worlds panel styling
- [ ] Add visual feedback for world switching
- [ ] Add trophy display in HUD

**Estimated Time**: 2-3 hours

---

### 9.2 Performance Optimization
**Tasks**:
- [ ] Optimize mine state storage (only store active mines?)
- [ ] Optimize map loading (ensure both maps load efficiently)
- [ ] Test with multiple players switching worlds
- [ ] Profile memory usage

**Estimated Time**: 2-3 hours

---

## Implementation Order Summary

### Week 1: Foundation
1. Phase 1: World System Foundation
2. Phase 2: Island 2 Data Files
3. Phase 5: Map Loading & Initialization

### Week 2: Core Systems
4. Phase 3: Update Core Systems for Multi-World
5. Phase 6: World Switching & State Management

### Week 3: UI & Features
6. Phase 4: World Selection UI System
7. Phase 7: Trophy System

### Week 4: Testing & Polish
8. Phase 8: Testing & Validation
9. Phase 9: Polish & Optimization

---

## Quick Start: Minimum Viable Implementation

If you want to get Island 2 working quickly, focus on:

1. **Phase 1.1** - World System Foundation (basic structure)
2. **Phase 2** - Island 2 Data Files (ores, training rocks, pets)
3. **Phase 5** - Map Loading (load both maps)
4. **Phase 3.1** - Update MiningSystem (world-aware mining)
5. **Phase 6.1** - World Switch Logic (basic teleportation)
6. **Phase 4** - Basic UI (simple teleport button, no unlock system yet)

This gets Island 2 playable, then you can add unlock system, trophies, and polish later.

---

## Estimated Total Time

- **Foundation & Data**: ~10-15 hours
- **Core Systems**: ~15-20 hours
- **UI System**: ~8-12 hours
- **Testing & Polish**: ~8-12 hours

**Total**: ~40-60 hours of development time

---

## Next Immediate Steps

1. **Start with Phase 1.1** - Create world system infrastructure
2. **Then Phase 2** - Create Island 2 data files (ores, training rocks, pets)
3. **Then Phase 5.1** - Load both maps to verify setup

This gives you a solid foundation to build on!

