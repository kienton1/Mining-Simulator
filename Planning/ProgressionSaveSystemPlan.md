# Progression Save System Implementation Plan

## Overview
This plan outlines the implementation of a persistent save system that stores player progression data across game sessions. All player statistics, inventory, and progression will be saved and automatically loaded when players reconnect.

---

## 1. Data to Persist

### Core Player Statistics (PlayerData Interface)
All fields from `PlayerData` interface need to be saved:

- **power** (number): Current power level (see PowerSystemPlan.md for details)
- **rebirths** (number): Number of times player has rebirthed (see PowerSystemPlan.md for details)
- **gold** (number): Current currency amount
- **wins** (number): Number of times player reached bottom of mines
- **currentPickaxeTier** (number): Currently equipped pickaxe tier (0-19)
- **inventory** (InventoryData): Complete ore inventory with all 20 ore types

### Inventory Data Structure
The inventory object contains:
- All 20 ore types (Stone, Coal, Clay, Sand, Copper, Iron, Lead, Nickel, Silver, Gold, Platinum, Titanium, Emerald, Ruby, Sapphire, Topaz, Diamond, Mythril, Adamantite, Cosmic)
- Each ore type maps to a quantity (number)
- Empty/invalid entries should be omitted or set to 0

---

## 2. Hytopia Persistence System

### Available Methods
Based on the Hytopia SDK, the persistence system provides:
- `world.persistence.getPlayerData(player)`: Async method to load player data
- `world.persistence.setPlayerData(player, data)`: Async method to save player data
- Data is automatically persisted to:
  - **Production**: Hytopia platform database
  - **Development**: Local `./dev/persistence` directory

### Data Format
- Persistence system expects JSON-serializable objects
- Player ID is automatically handled by the SDK
- Data is stored per-player automatically

---

## 3. Save Strategy

### When to Save Player Data

#### Immediate Saves (Critical Changes)
Save immediately when these events occur:
1. **Power/Rebirth changes**: See PowerSystemPlan.md for details
2. **Gold changes**: After selling ores, purchasing pickaxes
3. **Inventory changes**: After mining ores, selling ores
4. **Pickaxe purchases**: When player buys a new pickaxe
5. **Win events**: When player reaches bottom of mine (depth 1000)

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
5. **TrainingController**: See PowerSystemPlan.md
6. **MiningController**: Save after wins (reaching depth 1000)
7. **Rebirth System**: See PowerSystemPlan.md

---

## 4. Load Strategy

### When to Load Player Data

#### On Player Join
- Load data in `GameManager.initializePlayer()` method
- Replace the TODO comment with actual persistence loading
- Load should happen before any game systems initialize the player

### Load Process Flow

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

### Data Validation & Migration

- **Validate structure**: Ensure all required fields exist
- **Type checking**: Verify numbers are numbers, objects are objects
- **Default fallbacks**: If field is missing/invalid, use default value
- **Version migration**: If data structure changes in future, add migration logic
- **Sanitize data**: Ensure no negative values, reasonable maximums

---

## 5. Implementation Steps

### Phase 1: Core Save/Load Infrastructure

1. **Create PersistenceManager helper class** (optional)
   - Wraps Hytopia persistence calls
   - Adds error handling and logging
   - Provides save/load methods with validation
   - Location: `src/Core/PersistenceManager.ts`

2. **Update GameManager.initializePlayer()**
   - Replace TODO with actual load logic
   - Add async/await for persistence calls
   - Add error handling (fallback to defaults if load fails)
   - Add data validation and merging

3. **Update GameManager.updatePlayerData()**
   - Add automatic save call after data updates
   - Make save async (don't block game loop)
   - Add error handling (log but don't crash)
   - Consider debouncing to avoid excessive saves

### Phase 2: Integration Points

4. **InventoryManager integration**
   - Save after `addOre()` calls
   - Save after `removeOre()` calls
   - Save after `clearInventory()` calls

5. **SellingSystem integration**
   - Save after `sellAllOres()` calls
   - Save after `sellOre()` calls
   - Save after gold changes

6. **PickaxeShop integration**
   - Save after `purchasePickaxe()` calls
   - Save after gold deduction

7. **TrainingController integration**
   - See PowerSystemPlan.md for power-specific save implementation

8. **MiningController integration**
   - Save after win events (reaching depth 1000)
   - Save after significant depth milestones (optional)

### Phase 3: Disconnect Handling

9. **Add disconnect event handler**
   - Listen to `PlayerEvent.LEFT_WORLD` in `index.ts`
   - Call save before player cleanup
   - Ensure save completes before removing player from memory

10. **Add periodic save mechanism**
    - Set up interval timer (30-60 seconds)
    - Save all active players' data
    - Use debouncing to avoid saving unchanged data

### Phase 4: Error Handling & Edge Cases

11. **Handle persistence failures gracefully**
    - If save fails, log error but don't crash
    - Retry failed saves (with exponential backoff)
    - Queue saves if persistence is temporarily unavailable

12. **Handle corrupted/invalid data**
    - Validate loaded data structure
    - Fallback to defaults if data is invalid
    - Log warnings for data issues

13. **Handle missing fields (migration)**
    - Merge loaded data with defaults
    - Add missing fields with default values
    - Support future data structure changes

---

## 6. Error Handling Strategy

### Save Errors
- **Log error** but don't crash the game
- **Retry mechanism**: Retry failed saves 2-3 times with delays
- **Queue system**: If persistence is down, queue saves for later
- **Player notification**: Optionally notify player if save fails (via UI)

### Load Errors
- **Fallback to defaults**: If load fails, use `createDefaultPlayerData()`
- **Log warning**: Alert that player data couldn't be loaded
- **Partial data**: If some fields are missing, merge with defaults
- **Corruption handling**: If data is corrupted, reset to defaults and log

### Data Validation
- **Type checking**: Ensure numbers are numbers, not strings
- **Range validation**: Ensure values are within reasonable bounds
- **Structure validation**: Ensure all required fields exist
- **Sanitization**: Fix common issues (negative values, NaN, etc.)

---

## 7. Performance Considerations

### Save Optimization
- **Debouncing**: Don't save on every single change
  - Batch multiple rapid changes (see PowerSystemPlan.md for power-specific debouncing)
  - Save at most once per 1-2 seconds per player
- **Async saves**: Don't block game loop
  - Use async/await properly
  - Fire-and-forget for non-critical saves
- **Periodic saves**: Use interval timer, not per-action saves
  - Save all players every 30-60 seconds
  - Only save if data has changed (track dirty flag)

### Load Optimization
- **Lazy loading**: Load data only when player joins
- **Caching**: Keep loaded data in memory (already done with `playerDataMap`)
- **Async loading**: Don't block player join process
  - Show loading state in UI if needed
  - Initialize player with defaults, then update when load completes

---

## 8. Testing Strategy

### Unit Tests
- Test data validation functions
- Test merge logic (saved data + defaults)
- Test error handling paths

### Integration Tests
- Test save/load cycle with real persistence
- Test with missing/corrupted data
- Test with new players (no saved data)
- Test with existing players (saved data)

### Manual Testing Checklist
- [ ] New player gets default data
- [ ] Existing player loads saved data correctly
- [ ] Gold changes are saved
- [ ] Inventory changes are saved
- [ ] Pickaxe purchases are saved
- [ ] Wins are saved
- [ ] Data persists after server restart
- [ ] Data persists after player disconnect/reconnect
- [ ] Multiple players can save/load independently
- [ ] Corrupted data is handled gracefully
- [ ] Missing fields are filled with defaults
- [ ] Power/Rebirth persistence: See PowerSystemPlan.md

---

## 9. Code Structure

### New Files
- `src/Core/PersistenceManager.ts` (optional helper class)
  - `loadPlayerData(player): Promise<PlayerData | null>`
  - `savePlayerData(player, data): Promise<boolean>`
  - `validatePlayerData(data): boolean`
  - `mergeWithDefaults(savedData, defaults): PlayerData`

### Modified Files
- `src/Core/GameManager.ts`
  - `initializePlayer()`: Add load logic
  - `updatePlayerData()`: Add save logic
  - Add periodic save mechanism
- `src/Core/InventoryManager.ts`
  - Add save calls after inventory changes
- `src/Shop/SellingSystem.ts`
  - Add save calls after gold/inventory changes
- `src/Shop/PickaxeShop.ts`
  - Add save calls after purchases
- `src/Surface/Training/TrainingController.ts`
  - See PowerSystemPlan.md for power-specific save logic
- `src/Mining/MiningController.ts`
  - Add save calls after wins
- `index.ts`
  - Add `PlayerEvent.LEFT_WORLD` handler for disconnect saves

---

## 10. Implementation Priority

### High Priority (Core Functionality)
1. Load data on player join
2. Save data on critical changes (gold, inventory, pickaxe)
3. Save data on disconnect
4. Power/Rebirth saving: See PowerSystemPlan.md

### Medium Priority (Reliability)
4. Periodic backup saves
5. Error handling and retry logic
6. Data validation

### Low Priority (Optimization)
7. Debouncing saves
8. Dirty flag tracking
9. Advanced migration system

---

## 11. Future Considerations

### Potential Enhancements
- **Data versioning**: Add version field to support future migrations
- **Compression**: Compress large inventory data if needed
- **Partial saves**: Only save changed fields (optimization)
- **Cloud backup**: Additional backup system
- **Data export/import**: Allow players to export/import saves
- **Statistics tracking**: Save additional stats (playtime, blocks mined, etc.)

### Migration Strategy
- Add `dataVersion` field to PlayerData
- When loading, check version and migrate if needed
- Support multiple versions during transition period
- Document migration functions for each version change

---

## 12. Example Data Flow

### Player Joins
```
Player joins → PlayerEvent.JOINED_WORLD
  → GameManager.initializePlayer()
    → world.persistence.getPlayerData(player)
      → If exists: merge with defaults, validate
      → If not exists: use createDefaultPlayerData()
    → Store in playerDataMap
    → Initialize game systems
```

### Player Data Changes
```
// For power-specific save flow, see PowerSystemPlan.md
Data change → Update playerData
  → GameManager.updatePlayerData()
    → Store in playerDataMap
    → world.persistence.setPlayerData(player, data) [async, debounced]
```

### Player Disconnects
```
Player leaves → PlayerEvent.LEFT_WORLD
  → GameManager.savePlayerData(player) [ensure completes]
    → world.persistence.setPlayerData(player, data)
  → Cleanup player from memory
```

---

## Summary

This plan provides a comprehensive approach to implementing persistent save/load functionality for player progression. The key principles are:

1. **Save frequently** on important changes, but optimize with debouncing
2. **Load on join** and merge with defaults for safety
3. **Handle errors gracefully** - never crash, always fallback
4. **Validate data** to prevent corruption issues
5. **Test thoroughly** to ensure data persists correctly

The implementation should be done in phases, starting with core save/load functionality and then integrating into all systems that modify player data.

