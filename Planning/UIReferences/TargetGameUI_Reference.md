# Target Game UI & Gameplay Reference
## Based on Image Analysis - Save for Future Implementation

### Overview
This document captures the UI and gameplay elements from the target game we're copying. We will implement these features one by one.

---

## UI Layout Analysis

### Top Bar
- **Mine Reset Timer**: "Mine resets in: 01:11" (countdown timer, center top)
- **Depth Display**: "Depth: 14" (shows current mining depth)

### Left Side UI (Shop/Inventory/Boosts)
- **Shop Button**: Pink shopping basket icon with red exclamation mark
- **Pets**: Paw print icon with blue 'F'
- **Sale/Pro Pack**: Gift box icon labeled "SALE!" with red plus sign
- **Workers/Stats**: Person in hard hat icon
- **Pickaxe/Tools**: Pickaxe icon
- **Quests**: Computer screen icon with red 'X'
- **Daily Rewards**: Green refresh/loop icon with red exclamation mark
- **VIP/Premium**: Gold crown icon
- **Teleport/Trade**: Icon with two arrows pointing opposite directions
- **Special Offers**: "Only Ⓞ 19! Lava Dragon x100" (currency offers)

### Right Side UI (Rewards & Automation)
- **Timer**: "13m 52s" (top right)
- **REWARD Button**: Prominent button with target icon and rainbow text
- **Resource Displays** (with green plus buttons):
  - Trophy: "+ 0"
  - Gold Coins: "+ 8.39K"
  - Green Gems: "+ 99"
  - Red Starburst: "+ 472.86K"
  - Refresh/Loop: "+ 2"
- **Auto Mine Button**: Red button with pickaxe icon
- **Auto Train Button**: Red button with red starburst/explosion icon

### Bottom Center UI (Mining Boosts & Navigation)
- **Boost Buttons**:
  - Blue button: "x2 Speed" with pickaxe icon
  - Red button: "x2 Damage" with pickaxe icon
- **To Surface Button**: Green button labeled "To Surface" (exits mine)

### Bottom UI Bar (Progression)
- **Left Side**: Lock icon, face icon with "0%", gold coin with "x2"
- **Progress Bar**: Horizontal bar spanning bottom with markers:
  - "250M", "500M", "750M", "1,000M"
  - Player avatar icon positioned on bar showing current progress
  - Gold trophy icon at end of bar
- **Goal**: 1,000 blocks/depth (1000M = 1,000 meters/blocks)

### Mining Interface
- **Block Info Display**: Shows block name (e.g., "Stone"), HP bar (6/6 HP), rarity ("Common"), reward (gold coin icon with "5")
- **Block Types**: "Stone", "Bear Rare" (special resources)

---

## Gameplay Mechanics Observed

1. **Mining**: Player mines blocks with pickaxe, shows HP, rarity, and rewards
2. **Auto Mining**: Toggle button to automatically mine down
3. **Auto Training**: Toggle button to automatically train at training rocks
4. **Progress Tracking**: Visual progress bar showing depth progression toward 1000
5. **Timer Systems**: Mine reset timer and other countdown timers
6. **Reward Collection**: Auto-collected resources with + buttons
7. **Boost System**: Temporary speed and damage multipliers
8. **Teleport/Exit**: Quick way to return to surface from mine

---

## Implementation Priority

1. ✅ **Progress Bar**: Bottom bar showing progress toward 1000 blocks (HIGH PRIORITY)
2. ✅ **To Surface Button**: Green button in mines to teleport back (HIGH PRIORITY)
3. ✅ **Auto Mine Button**: Toggle button (green/red) for automatic mining (HIGH PRIORITY)
4. ⏳ Auto Train Button: Similar toggle for automatic training (HIGH PRIORITY)
5. ⏳ Resource Displays: Show collected ores/resources
6. ⏳ Boost Buttons: Speed and damage multipliers
7. ⏳ Mine Reset Timer: Countdown timer
8. ⏳ Shop System: Purchase pickaxes and upgrades
9. ⏳ Reward System: Claim rewards and bonuses

---

*Last Updated: Based on user screenshot analysis*

