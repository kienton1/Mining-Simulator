# Island 2 Implementation Summary

## ✅ Confirmed Details

### Map Layout
- **Identical to Island 1**: All interactive elements at same relative coordinates
- **Visual Differences Only**: Different block textures/models (ocean theme)
- **Same Positions**: Mining area, training rocks, NPCs, egg stations all at same relative locations

### World Switching Behavior
- **Mine Reset**: When switching worlds, mines are completely reset (blocks regenerate, depth resets to start)
- **Timer Reset**: Timer resets based on upgrade state in that world:
  - If not upgraded: 2 minutes
  - If upgraded: 5 minutes
- **Independent Timers**: Each world maintains its own timer state
  - Island 1 timer independent from Island 2 timer
  - Upgrading in one world doesn't affect the other

### Mine Reset Upgrade System
- **Island 1**: 
  - Default: 2 minutes
  - Upgrade Cost: 2,000,000 gold (2M)
  - Upgraded: 5 minutes
  
- **Island 2**:
  - Default: 2 minutes
  - Upgrade Cost: 750,000,000,000 gold (750B)
  - Upgraded: 5 minutes

- **Independence**: Each world tracks its own upgrade state separately

### Training Rock Block Types (Island 2)
From left to right (Rock 1 → Rock 6):
1. **Dunestone** block → Rock 1
2. **Barnacite** block → Rock 2
3. **Prismarine** block → Rock 3
4. **Basaltite** block → Rock 4
5. **Wreckite** block → Rock 5
6. **Tradewindite** block → Rock 6

### Training Rock Names (Island 2)
Using ore block names as training rock names:
1. **Dunestone Training Area**
2. **Barnacite Training Area**
3. **Prismarine Training Area**
4. **Basaltite Training Area**
5. **Wreckite Training Area**
6. **Tradewindite Training Area**

### NPC Positions
All NPCs at same relative positions as Island 1, offset by map offset:
- Merchant: X: -12.82, Y: 1.79, Z: 11.28
- Mine Reset Upgrade NPC: X: 5.08, Y: 1.79, Z: 14.35
- Gem Trader: X: 14.83, Y: 1.75, Z: 9.29
- Egg Stations: X: -13, Y: 2, Z: 1, 5, 9

### World Settings
- **Unlock Requirement**: 1 win
- **Trophy Multiplier**: x100 trophies per mine completion
- **Spawn Point**: Same as Island 1 (X: 0, Y: 10, Z: 0) offset by map offset

---

## ✅ All Information Complete!

### 1. Training Rock Names
**✅ CONFIRMED**: Using ore block names as training rock names
- Rock 1: **Dunestone Training Area**
- Rock 2: **Barnacite Training Area**
- Rock 3: **Prismarine Training Area**
- Rock 4: **Basaltite Training Area**
- Rock 5: **Wreckite Training Area**
- Rock 6: **Tradewindite Training Area**

### 2. Ore UI Colors
**✅ PROVIDED**: Ocean-themed hex color codes for all 24 ores (see below)

### 3. Map Offset Coordinates
**✅ CONFIRMED**: Diagonal offset
- **Map Offset X**: 750
- **Map Offset Z**: 750

**Calculated Positions:**
- **Spawn Point**: X: 750, Y: 10, Z: 750
- **Mining Area**: X: 746 to 752, Z: 766 to 772, Y: 0
- **Merchant**: X: 737.18, Y: 1.79, Z: 761.28
- **Mine Reset Upgrade NPC**: X: 755.08, Y: 1.79, Z: 764.35
- **Gem Trader**: X: 764.83, Y: 1.75, Z: 759.29
- **Egg Stations**: 
  - Abyssal: X: 737, Y: 2, Z: 751
  - Boardwalk: X: 737, Y: 2, Z: 755
  - Shipwreck: X: 737, Y: 2, Z: 759
- **Training Rocks**: Same relative positions, offset by (750, 750)

---

## Implementation Notes

### Per-World State Tracking
Need to track separately for each world:
- `mineResetUpgradePurchased: boolean` (per world)
- `mineTimerState: { remainingSeconds: number, isUpgraded: boolean }` (per world)
- `currentMineDepth: number` (per world)
- `mineBlocks: Map` (per world)

### World Switch Logic
When player switches worlds:
1. Save current world mine state (if any)
2. Reset mine (clear blocks, reset depth, reset timer)
3. Load target world context (ores, training rocks, pets)
4. Apply target world's timer state (2 min or 5 min based on upgrade)
5. Teleport player to target world spawn
6. Initialize fresh mine for target world

### Training Rock Detection
For Island 2, need to detect training rocks by block type:
- Dunestone block → Rock 1
- Barnacite block → Rock 2
- Prismarine block → Rock 3
- Basaltite block → Rock 4
- Wreckite block → Rock 5
- Tradewindite block → Rock 6

Can use same auto-detection system as Island 1, but with different block type mapping.

---

## Ore UI Colors (Ocean-Themed)

All 24 ores with suggested ocean-themed hex color codes:

### Common Ores (Early Game)
- **Dunestone**: `#8B7D6B` (Dune/sand beige)
- **Driftite**: `#A8A8A8` (Driftwood gray)
- **Anchorite**: `#4A4A4A` (Anchor metal dark gray)
- **Barnacite**: `#6B4423` (Barnacle brown)
- **Seaglassium**: `#87CEEB` (Sky blue - sea glass)
- **Shellchromite**: `#F5DEB3` (Shell cream/pearl)

### Uncommon Ores (Early-Mid Game)
- **Turtlite**: `#228B22` (Turtle green)
- **Prismarine**: `#00CED1` (Prismarine cyan)
- **Opalstone**: `#E6E6FA` (Opal lavender)
- **Azurite**: `#007FFF` (Azure blue)
- **Mangrovite**: `#8B4513` (Mangrove brown)
- **Basaltite**: `#2F2F2F` (Basalt dark gray)

### Rare Ores (Mid Game)
- **Reefium**: `#FF6347` (Coral reef red-orange)
- **Kelpite**: `#2E8B57` (Kelp green)
- **Sunstonite**: `#FFD700` (Sunstone gold)
- **Riptidite**: `#4682B4` (Riptide steel blue)

### Very Rare Ores (Mid-Late Game)
- **Trenchite**: `#191970` (Trench midnight blue)
- **Stormium**: `#708090` (Storm gray)
- **Lavastone**: `#FF4500` (Lava orange-red)
- **Wreckite**: `#8B4513` (Shipwreck brown)

### Ultra Rare Ores (Late Game)
- **Biolumite**: `#00FF00` (Bioluminescent green)
- **Oceanium**: `#0000CD` (Deep ocean blue)
- **Palmitite**: `#FFE4B5` (Palm cream)
- **Tradewindite**: `#87CEFA` (Trade wind light blue)

**All colors are ocean/beach/underwater themed to match the Island 2 aesthetic!**

---

## ✅ Implementation Ready!

All required information has been provided:
1. ✅ Training Rock Names - Using ore block names
2. ✅ Ore UI Colors - Ocean-themed colors provided above
3. ✅ Map Offset - X: 750, Z: 750
4. ✅ Training Rock Block Types - All 6 confirmed (Dunestone, Barnacite, Prismarine, Basaltite, Wreckite, Tradewindite)

**Ready to proceed with full implementation!** 🚀

