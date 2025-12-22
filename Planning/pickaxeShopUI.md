# Pickaxe Shop UI System

## Overview

This document describes the Pickaxe Shop UI system that allows players to view, purchase, and equip pickaxes. The shop displays all pickaxes in progression order, shows their stats and costs, and enforces tier-based purchase restrictions.

**Reference**: Planning/inventoryAndSellingSystem.md section 3

## 1. UI Layout & Design

### 1.1 Main Shop Window

The shop appears as a modal window with:
- **Background**: Light blue with repeating pickaxe icon pattern
- **Close Button**: Red 'X' button in top-right corner
- **Layout**: Two-panel design (Left: Equipped pickaxe details, Right: Shop grid)

### 1.2 Left Panel - Equipped Pickaxe Details

**Components**:
- **Title**: Current pickaxe name (e.g., "Diamond Pickaxe")
- **Image**: Large pickaxe icon/visual representation
- **Stats Display**: Shows all stat bonuses:
  - `+X% Coins` (yellow text) - Money bonus
  - `+X% Ore Luck` (green text) - Luck bonus percentage
  - `+X Speed` (light blue text) - Mining speed
- **Status Badge**: "Equipped" text at bottom (white text)

**Data Source**: `PlayerData.currentPickaxeTier` → `PICKAXE_DATABASE[tier]`

### 1.3 Right Panel - Pickaxe Shop Grid

**Layout**: Grid of pickaxe items (3-4 columns, multiple rows)

**Each Pickaxe Item Shows**:
- Pickaxe icon/visual
- Pickaxe name
- Cost (with gold coin icon)
- Lock icon (if not available for purchase)
- Checkmark icon (if currently equipped)
- Purchase/Equip button state

### 1.4 Purchase Restrictions

**Tier-Based Progression**:
- Players can ONLY buy the next tier pickaxe (currentTier + 1)
- Example: If player has Tier 1, they can only buy Tier 2
- Cannot skip tiers (e.g., can't buy Tier 4 if on Tier 1)
- Locked pickaxes show padlock icon and are not clickable

**Visual Indicators**:
- ✅ **Unlocked & Available**: No lock, shows cost, "Buy" button
- 🔒 **Locked**: Yellow padlock icon, grayed out, no button
- ✓ **Equipped**: Green checkmark in top-right, "Equipped" status

## 2. UI Button (Left Side Middle)

### 2.1 Pickaxe Shop Button

**Position**: Left side, middle of screen (vertically centered)

**Appearance**: 
- Blue background with starburst pattern
- Pickaxe icon (silver-grey head, brown handle)
- Clickable button that opens the shop modal

**Behavior**:
- Clicking opens the Pickaxe Shop modal
- Button remains visible when shop is open (can close via X button)
- Button highlights on hover

## 3. Data Flow

### 3.1 Opening Shop

```
User clicks Pickaxe Shop button
  → UI sends 'OPEN_PICKAXE_SHOP' event to server
  → Server responds with 'PICKAXE_SHOP_DATA':
     - currentPickaxeTier
     - playerGold
     - allPickaxes (with availability status)
  → UI renders shop modal
```

### 3.2 Purchasing Pickaxe

```
User clicks "Buy" on available pickaxe
  → UI sends 'BUY_PICKAXE' event with tier
  → Server validates:
     - Check if tier === currentTier + 1
     - Check if playerGold >= pickaxe.cost
  → If valid:
     - Deduct gold: playerData.gold -= pickaxe.cost
     - Update tier: playerData.currentPickaxeTier = tier
     - Update visual: PickaxeManager.attachPickaxeToPlayer()
     - Send 'PICKAXE_PURCHASED' response to UI
  → UI updates:
     - Close shop or refresh shop data
     - Update equipped pickaxe display
     - Update gold display in HUD
```

### 3.3 Equipping Pickaxe

**Note**: Since players can only buy next tier, "equip" is automatic on purchase. However, if we add the ability to own multiple pickaxes later, we'd need an equip button.

**Current Behavior**:
- Purchasing a pickaxe automatically equips it
- No separate "Equip" button needed
- "Equipped" status shows on currently owned pickaxe

## 4. Pickaxe Availability Logic

### 4.1 Availability States

For each pickaxe tier, determine:

```typescript
function getPickaxeAvailability(tier: number, currentTier: number, playerGold: number): 'equipped' | 'available' | 'locked' | 'owned' {
  if (tier === currentTier) return 'equipped';
  if (tier < currentTier) return 'owned'; // Already owned (if we track owned pickaxes)
  if (tier === currentTier + 1) {
    // Next tier - check if affordable
    const pickaxe = getPickaxeByTier(tier);
    if (pickaxe && playerGold >= pickaxe.cost) return 'available';
    return 'locked'; // Can't afford
  }
  return 'locked'; // Too far ahead
}
```

### 4.2 Display Rules

- **Equipped**: Green checkmark, "Equipped" badge, no button
- **Available** (next tier + affordable): Normal display, "Buy" button, shows cost
- **Locked** (not next tier or can't afford): Grayed out, padlock icon, no button
- **Owned** (lower tier): Normal display, "Equip" button (if we add multi-pickaxe system)

## 5. Stats Display

### 5.1 Stat Calculations

**Coins Bonus**: 
- Currently not in PickaxeData
- May need to add `coinBonusMultiplier` field
- Or derive from other stats
- Display as percentage (e.g., "+50% Coins")

**Ore Luck**:
- From `PickaxeData.luckBonus` (0.0 to 4.0)
- Display as percentage: `(luckBonus * 100).toFixed(0) + '%'`
- Example: `luckBonus = 0.5` → "+50% Ore Luck"

**Speed**:
- From `PickaxeData.miningSpeed` (swings per second)
- Display as integer: `Math.round(miningSpeed)`
- Example: `miningSpeed = 2.3` → "+2 Speed"

**Power Bonus**:
- From `PickaxeData.powerBonusMultiplier`
- Display as multiplier: `(powerBonusMultiplier * 100 - 100).toFixed(0) + '%'`
- Example: `powerBonusMultiplier = 1.5` → "+50% Power"

### 5.2 Stat Display Format

```
+50% Coins        (yellow text)
+5% Ore Luck      (green text)
+20 Speed         (light blue text)
+50% Power        (red text, if we add this)
```

## 6. Implementation Tasks

### 6.1 UI Components

1. **Pickaxe Shop Button** (Left side middle)
   - Create button element
   - Style with blue background and pickaxe icon
   - Position: `left: 40px, top: 50%, transform: translateY(-50%)`
   - Add click handler to open shop

2. **Shop Modal Window**
   - Create modal container
   - Add close button (red X)
   - Create two-panel layout (left/right)
   - Style with blue background and pattern

3. **Equipped Pickaxe Panel** (Left)
   - Display current pickaxe name
   - Show pickaxe image/icon
   - List all stat bonuses
   - Show "Equipped" badge

4. **Pickaxe Grid** (Right)
   - Create grid layout (3-4 columns)
   - Render all 20 pickaxes from `PICKAXE_DATABASE`
   - Apply availability logic for each
   - Show locks, checkmarks, costs, buttons

### 6.2 Server-Side Logic

1. **Shop Data Handler**
   - Handle `OPEN_PICKAXE_SHOP` event
   - Get player's current tier and gold
   - Calculate availability for each pickaxe
   - Send `PICKAXE_SHOP_DATA` response

2. **Purchase Handler**
   - Handle `BUY_PICKAXE` event
   - Validate tier progression (must be currentTier + 1)
   - Validate gold amount
   - Update player data
   - Update pickaxe visual
   - Send confirmation response

3. **Update Existing PickaxeShop**
   - Modify `buyPickaxe()` to enforce tier progression
   - Add validation: `if (tier !== currentTier + 1) return error`
   - Keep existing gold validation

### 6.3 Data Updates

1. **PickaxeData Interface**
   - Consider adding `coinBonusMultiplier` if needed
   - Or document how coin bonus is calculated

2. **PlayerData**
   - Already has `currentPickaxeTier` ✓
   - Already has `gold` ✓
   - No changes needed

## 7. UI Events

### 7.1 Client → Server

- `OPEN_PICKAXE_SHOP` - Request shop data
- `BUY_PICKAXE` - Purchase pickaxe (includes tier)
- `CLOSE_PICKAXE_SHOP` - Close shop modal

### 7.2 Server → Client

- `PICKAXE_SHOP_DATA` - Shop data response
  ```typescript
  {
    type: 'PICKAXE_SHOP_DATA',
    currentTier: number,
    playerGold: number,
    pickaxes: Array<{
      tier: number,
      name: string,
      cost: number,
      availability: 'equipped' | 'available' | 'locked',
      stats: {
        coinBonus: number,
        luckBonus: number,
        speed: number,
        powerBonus: number
      }
    }>
  }
  ```

- `PICKAXE_PURCHASED` - Purchase confirmation
  ```typescript
  {
    type: 'PICKAXE_PURCHASED',
    success: boolean,
    newTier: number,
    goldSpent: number,
    remainingGold: number
  }
  ```

## 8. Visual Design Notes

### 8.1 Color Scheme

- **Background**: Light blue (#B0E0E6 or similar) with pattern
- **Text**: White with black outline for readability
- **Buttons**: 
  - Buy button: Green gradient
  - Close button: Red
  - Locked items: Grayed out
- **Stats Colors**:
  - Coins: Yellow (#FFD700)
  - Luck: Green (#4CAF50)
  - Speed: Light blue (#87CEEB)
  - Power: Red (#FF5252)

### 8.2 Icons

- **Pickaxe Icons**: Different colors/styles per tier
- **Lock Icon**: Yellow padlock for locked pickaxes
- **Checkmark**: Green checkmark for equipped pickaxe
- **Coin Icon**: Gold coin for costs

### 8.3 Layout Spacing

- Grid items: 12px gap between items
- Panel padding: 20px
- Button padding: 12px 24px
- Stat list: 8px gap between stats

## 9. Future Enhancements

### 9.1 Multi-Pickaxe Ownership

If we allow players to own multiple pickaxes:
- Add "Equip" button for owned but not equipped pickaxes
- Track owned pickaxes in `PlayerData.ownedPickaxes: number[]`
- Allow switching between owned pickaxes

### 9.2 Premium Tiers

The reference shows "Special", "OP", "PRO", "MEGA" tiers:
- These could be premium currency purchases
- Separate from gold-based progression
- Would need premium currency system

### 9.3 Pickaxe Upgrades

- Allow upgrading existing pickaxes
- Cost reduction for owned pickaxes
- Visual customization options

