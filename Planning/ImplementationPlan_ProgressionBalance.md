# Implementation Plan: Progression Balance System
## Step-by-Step Guide to Apply Progression Balance Blueprint

### Overview
This plan outlines the implementation steps to integrate all 20 ores, 20 pickaxes, swing rate system, depth-based scaling, and economic balance into the game.

---

## Phase 1: Core Data Structures (Foundation)

### Step 1.1: Expand Ore Enum and Database
**File**: `src/Mining/Ore/OreData.ts`

**Tasks**:
- [ ] Add all 20 ore types to `OreType` enum (Stone, Coal, Clay, Sand, Copper, Iron, Lead, Nickel, Silver, Gold, Platinum, Titanium, Emerald, Ruby, Sapphire, Topaz, Diamond, Mythril, Adamantite, Cosmic)
- [ ] Update `OreData` interface to include `baseHP` property
- [ ] Populate `ORE_DATABASE` with all 20 ores using values from blueprint
- [ ] Ensure all ores have: `type`, `baseChance`, `baseHP`, `value`, `name`

**Estimated Time**: 30 minutes

### Step 1.2: Expand Pickaxe Database
**File**: `src/Pickaxe/PickaxeDatabase.ts`

**Tasks**:
- [ ] Expand `PICKAXE_DATABASE` array from 6 to 20 pickaxes
- [ ] Use cost formula: `Cost(Tier) = 100 × (5^(Tier - 1))`
- [ ] Use speed formula: `Speed = 0.25 × (1 + Tier × 0.15 + Tier² × 0.01)`
- [ ] Use luck formula: `Luck = (Tier^1.5) × 0.5` (capped at 400%)
- [ ] Double damage each tier: `Damage = 2^Tier`
- [ ] See PowerSystemPlan.md for power-related implementation

**Estimated Time**: 45 minutes

### Step 1.3: Update Game Constants
**File**: `src/Core/GameConstants.ts`

**Tasks**:
- [ ] Add `BASE_SWING_RATE = 2.0` constant (1 hit per 0.5 seconds)
- [ ] Add `DEPTH_HP_SCALING = 0.1` (10% per 100 levels)
- [ ] Add `DEPTH_SCALING_INTERVAL = 100` (scaling every 100 levels)
- [ ] Remove or update old ore constants (they'll be in OreData now)
- [ ] See PowerSystemPlan.md for power constants

**Estimated Time**: 15 minutes

---

## Phase 2: Mining System Updates

### Step 2.1: Update MineBlock to Use Ore HP
**File**: `src/Mining/MineBlock.ts`

**Tasks**:
- [ ] Update `MineBlock` constructor to accept `oreType: OreType` instead of hardcoded HP
- [ ] Load `baseHP` from `ORE_DATABASE[oreType].baseHP`
- [ ] Add `applyDepthScaling(depth: number)` method
- [ ] Calculate final HP: `baseHP × (1 + floor(depth / 100) × 0.1)`
- [ ] Update `takeDamage()` to use scaled HP

**Estimated Time**: 30 minutes

### Step 2.2: Update Ore Generation Logic
**File**: `src/Mining/MiningSystem.ts`

**Tasks**:
- [ ] Update `generateOreType()` to use all 20 ores from `ORE_DATABASE`
- [ ] Ensure base chances sum to ~100% (as per blueprint)
- [ ] Verify luck normalization works correctly
- [ ] Test ore distribution at different luck levels

**Estimated Time**: 45 minutes

### Step 2.3: Update Block Creation with Depth Scaling
**File**: `src/Mining/MiningSystem.ts`

**Tasks**:
- [ ] Update `ensureLevelGenerated()` to pass depth to `MineBlock`
- [ ] Modify block creation to use `new MineBlock(oreType, depth)` 
- [ ] Ensure `MineBlock` calculates scaled HP based on depth
- [ ] Test HP scaling at different depths (0, 100, 500, 1000)

**Estimated Time**: 30 minutes

---

## Phase 3: Swing Rate System

### Step 3.1: Implement Base Swing Rate
**File**: `src/Core/GameConstants.ts` (already done in Phase 1)

**Tasks**:
- [ ] Verify `BASE_SWING_RATE = 0.25` is defined
- [ ] Document that this is 4 seconds per swing

**Estimated Time**: 5 minutes (verification only)

### Step 3.2: Update Mining Speed Calculation
**File**: `src/Stats/StatCalculator.ts`

**Tasks**:
- [ ] Update `getMiningSpeed()` to use pickaxe `miningSpeed` directly
- [ ] The `miningSpeed` property already contains the final swings/second
- [ ] Verify it matches blueprint formula

**Estimated Time**: 10 minutes

### Step 3.3: Update Mining Loop Interval
**File**: `src/Mining/MiningSystem.ts` - `startMiningLoop()`

**Tasks**:
- [ ] Verify `hitInterval = 1000 / pickaxe.miningSpeed` calculation
- [ ] Test that intervals match expected swing rates
- [ ] Example: Tier 0 = 0.25 swings/sec = 4000ms interval ✓
- [ ] Example: Tier 19 = 14.2 swings/sec = 70ms interval

**Estimated Time**: 20 minutes

---

## Phase 4: Pickaxe System Integration

### Step 4.1: Verify Pickaxe Data Structure
**File**: `src/Pickaxe/PickaxeData.ts`

**Tasks**:
- [ ] Ensure `PickaxeData` interface has all required fields:
  - `tier`, `name`, `damage`, `miningSpeed`, `luckBonus`, `cost`
  - For power-related fields, see PowerSystemPlan.md
- [ ] All fields should match blueprint values

**Estimated Time**: 10 minutes (verification)

### Step 4.2: Update Shop System (if exists)
**File**: Check for shop files

**Tasks**:
- [ ] Locate shop/pickaxe purchase logic
- [ ] Ensure it can handle all 20 tiers
- [ ] Verify cost calculations match blueprint
- [ ] Test purchasing pickaxes 1-20

**Estimated Time**: 30 minutes (if shop exists, otherwise skip)

---

## Phase 5: UI Updates

### Step 5.1: Update Ore Display Names
**Files**: `assets/ui/index.html`, any ore-related UI

**Tasks**:
- [ ] Ensure all 20 ore names display correctly
- [ ] Update any hardcoded ore lists
- [ ] Test ore name display in health bar

**Estimated Time**: 20 minutes

### Step 5.2: Update Shop UI (if exists)
**Files**: Shop UI files

**Tasks**:
- [ ] Display all 20 pickaxes
- [ ] Show costs formatted properly (K, M, B, T)
- [ ] Show speed, luck, damage stats
- [ ] Indicate which pickaxe player owns

**Estimated Time**: 45 minutes (if shop exists)

---

## Phase 6: Testing & Balancing

### Step 6.1: Test Ore Generation
**Tasks**:
- [ ] Spawn ores at different depths (0, 100, 500, 1000)
- [ ] Verify rarity distribution matches blueprint
- [ ] Test with different luck values (0%, 50%, 200%, 400%)
- [ ] Verify total chance always equals 100%

**Estimated Time**: 1 hour

### Step 6.2: Test HP Scaling
**Tasks**:
- [ ] Create blocks at depth 0, verify base HP
- [ ] Create blocks at depth 100, verify +10% HP
- [ ] Create blocks at depth 500, verify +50% HP
- [ ] Create blocks at depth 1000, verify +100% HP
- [ ] Verify formula: `HP = baseHP × (1 + floor(depth / 100) × 0.1)`

**Estimated Time**: 45 minutes

### Step 6.3: Test Pickaxe Progression
**Tasks**:
- [ ] Test each pickaxe tier (0-19)
- [ ] Verify swing rates match blueprint
- [ ] Verify damage values
- [ ] Verify luck bonuses
- [ ] Test cost calculations

**Estimated Time**: 1 hour

### Step 6.4: Test Economic Balance
**Tasks**:
- [ ] Calculate expected gold/hour at each pickaxe tier
- [ ] Verify pickaxe affordability timeline
- [ ] Test ore selling values
- [ ] Verify progression feels smooth

**Estimated Time**: 1 hour

### Step 6.5: Test Progression Pacing
**Tasks**:
- [ ] Play from level 0-100, measure time
- [ ] Play from level 100-400, measure time
- [ ] Play from level 400-700, measure time
- [ ] Play from level 700-900, measure time
- [ ] Play from level 900-1000, measure time
- [ ] Verify total time ≈ 10 hours

**Estimated Time**: 3+ hours (actual gameplay testing)

---

## Phase 7: Polish & Optimization

### Step 7.1: Code Cleanup
**Tasks**:
- [ ] Remove any hardcoded ore/pickaxe references
- [ ] Update all comments to reflect new system
- [ ] Remove old/unused constants
- [ ] Ensure consistent naming

**Estimated Time**: 30 minutes

### Step 7.2: Performance Testing
**Tasks**:
- [ ] Test with all 20 ores spawning
- [ ] Verify no performance issues with ore generation
- [ ] Test mining loop at high swing rates (Tier 19)
- [ ] Optimize if needed

**Estimated Time**: 30 minutes

### Step 7.3: Documentation
**Tasks**:
- [ ] Update code comments
- [ ] Document formulas in code
- [ ] Add JSDoc comments for new functions
- [ ] Reference blueprint in relevant files

**Estimated Time**: 30 minutes

---

## Implementation Order Summary

### Week 1: Foundation
1. ✅ Phase 1: Core Data Structures (1.5 hours)
2. ✅ Phase 2: Mining System Updates (1.75 hours)
3. ✅ Phase 3: Swing Rate System (35 minutes)

**Total Week 1**: ~3.5 hours

### Week 2: Integration & Testing
4. ✅ Phase 4: Pickaxe System Integration (40 minutes)
5. ✅ Phase 5: UI Updates (1.25 hours)
6. ✅ Phase 6: Testing & Balancing (6+ hours)

**Total Week 2**: ~8+ hours

### Week 3: Polish
7. ✅ Phase 7: Polish & Optimization (1.5 hours)

**Total Implementation**: ~13+ hours

---

## Critical Implementation Details

### Ore HP Scaling Formula
```typescript
function calculateScaledHP(baseHP: number, depth: number): number {
  const depthModifier = Math.floor(depth / 100) * 0.1;
  return baseHP * (1 + depthModifier);
}
```

### Pickaxe Speed Formula
```typescript
function calculatePickaxeSpeed(tier: number): number {
  const BASE_SPEED = 2.0; // 1 hit per 0.5 seconds
  const multiplier = 1 + (tier * 0.15) + (tier * tier * 0.01);
  return BASE_SPEED * multiplier;
}
```

### Pickaxe Cost Formula
```typescript
function calculatePickaxeCost(tier: number): number {
  if (tier === 0) return 0; // Free starter
  if (tier === 19) return 100_000_000_000_000; // Cap at 100 trillion
  return 100 * Math.pow(5, tier - 1);
}
```

### Pickaxe Luck Formula
```typescript
function calculatePickaxeLuck(tier: number): number {
  if (tier === 0) return 0;
  const luck = Math.pow(tier, 1.5) * 0.5;
  return Math.min(luck, 4.0); // Cap at 400%
}
```

---

## Testing Checklist

- [ ] All 20 ores spawn correctly
- [ ] All 20 pickaxes are purchasable
- [ ] HP scales correctly with depth
- [ ] Swing rates match blueprint
- [ ] Luck affects ore rarity
- [ ] Economic progression feels balanced
- [ ] Progression pacing ≈ 10 hours to level 1000
- [ ] No performance issues
- [ ] UI displays all ores/pickaxes correctly

---

## Rollback Plan

If issues arise during implementation:

1. **Keep old ore/pickaxe data** as backup
2. **Use feature flags** to toggle new system
3. **Test in isolated branch** before merging
4. **Have rollback script** ready to revert constants

---

## Notes

- Start with Phase 1 (data structures) - this is the foundation
- Test incrementally after each phase
- Don't skip Phase 6 testing - crucial for balance
- Adjust values from blueprint based on actual gameplay feel
- Document any deviations from blueprint with reasoning

---

*This plan should be followed sequentially, with testing after each major phase. Adjust timeline based on actual development pace.*

