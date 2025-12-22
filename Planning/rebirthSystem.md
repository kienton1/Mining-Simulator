# Rebirth System

## Overview

This document describes the Rebirth system that allows players to reset their progress in exchange for permanent power gain bonuses. Each rebirth provides a +10% power gain multiplier, creating an exponential progression loop.

**References**: 
- Planning/gameOverview.txt section 4
- **PowerSystemPlan.md** for complete power mechanics and integration

## 1. Rebirth Mechanics

### 1.1 Core Concept

**Rebirth = Reset + Permanent Bonus**

- Player spends Power to perform a rebirth
- Each rebirth grants +10% power gain per hit (multiplicative)
- Power is reset to a base value (typically 1)
- Rebirths are permanent and cumulative
- Formula: `PowerGainMultiplier = 1 + (Rebirths × 0.10)`

**Note**: For complete power mechanics, formulas, and integration, see `PowerSystemPlan.md`

### 1.2 Rebirth Cost Formula

**Base Cost**: 1,500 Power per rebirth

**Scaling**: Cost increases with number of rebirths
- Formula: `Cost = BaseCost × (1 + Rebirths × 0.1)`
- Example:
  - 1st rebirth: 1,500 × 1.0 = 1,500 Power
  - 2nd rebirth: 1,500 × 1.1 = 1,650 Power
  - 10th rebirth: 1,500 × 2.0 = 3,000 Power

**Alternative Formula** (from reference screenshot):
- Cost appears to scale: 1.5K, 7.5K, 30K, 472.5K
- Pattern: `Cost = 1,500 × (Rebirths × 0.5)` for single rebirths
- For multiple rebirths: Cost scales multiplicatively

**Recommended Formula**:
```typescript
function calculateRebirthCost(rebirths: number): number {
  const BASE_COST = 1500;
  return BASE_COST * Math.pow(1.1, rebirths); // 10% increase per rebirth
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

### 1.3 Power Reset

After rebirth:
- Power resets to base value (typically 1)
- All other stats remain (gold, inventory, pickaxe tier, etc.)
- Rebirth count increases by 1
- Power gain multiplier increases permanently

**See PowerSystemPlan.md** for detailed power reset behavior and implementation

## 2. UI Layout & Design

### 2.1 Rebirth Button (Left Side Middle)

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

### 2.2 Rebirth Modal Window

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

### 2.3 Rebirth Options

**Single Rebirth Options**:
- **1 Rebirth**: Shows "1 Rebirth" (green), "1.5K Power" (red), "Rebirth" button (green)
- **5 Rebirths**: Shows "5 Rebirths" (green), "7.5K Power" (red), "Rebirth" button (green)
- **20 Rebirths**: Shows "20 Rebirths" (green), "30K Power" (red), "Rebirth" button (green)

**Max Rebirth Option**:
- Special row with rainbow-colored border (red, orange, yellow, green, blue, purple gradient)
- Shows maximum available rebirths (e.g., "315 Rebirths" in green)
- Shows total power cost (e.g., "472.5K Power" in red)
- Yellow "Max" button with black outline

**Button States**:
- **Available**: Green button, clickable, shows "Rebirth" or "Max"
- **Unavailable**: Grayed out, disabled, if player doesn't have enough power

## 3. Rebirth Calculation Logic

### 3.1 Calculate Available Rebirths

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
    if (maxRebirths > 1000) break;
  }
  
  return maxRebirths;
}
```

### 3.2 Calculate Rebirth Cost

```typescript
function calculateRebirthCost(rebirths: number): number {
  const BASE_COST = 1500;
  // Exponential scaling: 10% increase per rebirth
  return BASE_COST * Math.pow(1.1, rebirths);
}

function calculateRebirthCostMultiple(rebirths: number, count: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += calculateRebirthCost(rebirths + i);
  }
  return total;
}
```

### 3.3 Power Gain Multiplier

```typescript
function calculatePowerGainMultiplier(rebirths: number): number {
  // Each rebirth adds 10% power gain
  return 1 + (rebirths * 0.10);
}
```

## 4. Data Flow

### 4.1 Opening Rebirth Modal

```
User clicks Rebirth button
  → UI sends 'OPEN_REBIRTH_UI' event to server
  → Server responds with 'REBIRTH_UI_DATA':
     - currentPower
     - currentRebirths
     - availableRebirthOptions: [
         { count: 1, cost: 1500 },
         { count: 5, cost: 7500 },
         { count: 20, cost: 30000 },
         { count: max, cost: totalMaxCost }
       ]
  → UI renders rebirth modal
```

### 4.2 Performing Rebirth

```
User clicks "Rebirth" or "Max" button
  → UI sends 'PERFORM_REBIRTH' event with:
     - rebirthCount: number (1, 5, 20, or max)
  → Server validates:
     - Check if player has enough power
     - Calculate total cost for requested rebirths
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

### 4.3 Power Reset Behavior

**Question**: Should power reset to 1, or keep remaining power after cost?

**Option A: Reset to Base**
- Power = 1 after rebirth
- Clean reset, forces player to rebuild

**Option B: Keep Remaining**
- Power = currentPower - cost
- Allows partial power retention
- More forgiving

**Recommendation**: Option A (reset to 1) for true rebirth feel, but make it configurable.

## 5. Implementation Tasks

### 5.1 UI Components

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

### 5.2 Server-Side Logic

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
   - Calculate available rebirth options
   - Send `REBIRTH_UI_DATA` response

3. **Rebirth Execution Handler**
   - Handle `PERFORM_REBIRTH` event
   - Validate power and cost
   - Execute rebirth (deduct power, increase rebirths, reset power)
   - Update power gain multiplier
   - Send `REBIRTH_COMPLETE` response

### 5.3 Power Gain Integration

**See PowerSystemPlan.md** for complete power gain integration details, including:
- StatCalculator updates
- TrainingController integration
- Power gain formulas with rebirth multiplier
- Training system implementation

### 5.4 Data Updates

1. **PlayerData**
   - Already has `rebirths: number` ✓
   - Already has `power: number` ✓
   - No changes needed

2. **GameManager**
   - Add `RebirthController` instance
   - Add method: `performRebirth(player: Player, count: number)`
   - For power gain calculation integration, see PowerSystemPlan.md

## 6. UI Events

### 6.1 Client → Server

- `OPEN_REBIRTH_UI` - Request rebirth data
- `PERFORM_REBIRTH` - Execute rebirth (includes count)
- `CLOSE_REBIRTH_UI` - Close rebirth modal

### 6.2 Server → Client

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

## 7. Visual Design Notes

### 7.1 Color Scheme

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

### 7.2 Icons

- **Refresh Icon**: Green circular arrow (🔄)
- **Power Icon**: Red explosion (💥)
- **Notification Badge**: Red square with white exclamation mark

### 7.3 Layout Spacing

- Modal padding: 30px
- Option rows: 12px gap between rows
- Button padding: 12px 24px
- Header margin: 20px bottom

## 8. Rebirth Options Configuration

### 8.1 Predefined Options

```typescript
const REBIRTH_OPTIONS = [
  { count: 1, label: '1 Rebirth' },
  { count: 5, label: '5 Rebirths' },
  { count: 20, label: '20 Rebirths' },
  { count: 'max', label: 'Max' } // Special case
];
```

### 8.2 Cost Display Format

- Format numbers with K/M suffixes
- Example: 1,500 → "1.5K", 472,500 → "472.5K"
- Use `formatNumber()` function from UI

## 9. Power Reset Behavior

### 9.1 Reset Strategy

**Recommended**: Reset to base value (1)

**Rationale**:
- True "rebirth" feel
- Forces player to rebuild power
- Makes rebirth decision meaningful
- Aligns with typical idle game mechanics

**Alternative**: Keep remaining power
- More forgiving
- Allows partial retention
- Less dramatic reset

### 9.2 Implementation

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

## 10. Future Enhancements

### 10.1 Rebirth Milestones

- Unlock new training rocks at certain rebirth counts
- Unlock new pickaxe tiers
- Unlock new mine depths
- Special bonuses at milestones (5, 10, 25, 50, 100, etc.)

### 10.2 Rebirth Prestige

- Multiple rebirth "tiers" or "prestige levels"
- Each prestige level resets rebirths but grants new bonuses
- Exponential progression system

### 10.3 Rebirth Bonuses

- Beyond power gain (see PowerSystemPlan.md), rebirths could grant:
  - Increased gold gain
  - Increased inventory capacity
  - Permanent stat boosts
  - Unlock new content

### 10.4 Rebirth History

- Track total rebirths across all resets
- Display lifetime statistics
- Achievement system based on rebirths

