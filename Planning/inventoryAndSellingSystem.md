# Inventory & Selling System

## Overview

This document describes the inventory management and selling systems for the Mining Game.

**Reference**: Planning/gameOverview.txt section 8

## 1. Inventory System

### 1.1 Inventory Structure

Tracks item type + amount:

```typescript
Inventory = {
  Stone: 54,
  Copper: 7,
  Iron: 3,
  Diamond: 1
}
```

The inventory is stored in `PlayerData.inventory` as `InventoryData`, which maps `OreType` to quantity.

### 1.2 Inventory Operations

- **Add Ore**: Add ore to inventory when mined
- **Remove Ore**: Remove ore when sold
- **Get Count**: Get quantity of specific ore type
- **Get Total Value**: Calculate total gold value of all ores
- **Check Capacity**: (Optional) Check if inventory has space

### 1.3 Implementation

- `InventoryManager` class manages all inventory operations
- Inventory is stored in `PlayerData.inventory`
- All 20 ore types from `OreData` are supported

## 2. Selling System

### 2.1 Selling Flow

1. Player goes to "Sell NPC" on surface
2. Sell UI appears with:
   - "Sell All" button
   - "Sell Selected" button (optional)
   - List of ores with quantities and values
3. Player clicks button
4. Ores are removed from inventory
5. Gold is added to player's account
6. UI updates to show new gold amount

### 2.2 Sell Formula

```
TotalGold = Σ (OreAmount_i × OreValue_i)
```

Where:
- `OreAmount_i` = quantity of ore type `i` in inventory
- `OreValue_i` = gold value of ore type `i` (from `ORE_DATABASE`)

### 2.3 Implementation

- `SellingSystem` class handles selling logic
- Uses `ORE_DATABASE` to get ore values
- Updates `PlayerData.gold` and `PlayerData.inventory`
- Can sell all ores or selected ores

## 3. Pickaxe Shop System

### 3.1 Shop Flow

1. Player approaches pickaxe shop on surface
2. Shop UI appears showing:
   - Available pickaxes (based on current tier)
   - Pickaxe stats (damage, speed, luck, power bonus)
   - Cost in gold
   - "Buy" button for affordable pickaxes
3. Player clicks "Buy" on a pickaxe
4. Gold is deducted
5. Player's pickaxe tier is updated
6. Pickaxe entity is updated visually

### 3.2 Pickaxe Purchase Requirements

- Player must have enough gold (`playerData.gold >= pickaxe.cost`)
- Player can only buy pickaxes of higher tier than current
- Starter pickaxe (Tier 0) is free

### 3.3 Implementation

- `PickaxeShop` class handles purchase logic
- Uses `PICKAXE_DATABASE` to get pickaxe data
- Updates `PlayerData.currentPickaxeTier` and `PlayerData.gold`
- Triggers `PickaxeManager.attachPickaxeToPlayer()` to update visual

## 4. Integration Points

### 4.1 Mining System → Inventory

When ore is mined:
- `MiningSystem` calls `InventoryManager.addOre(player, oreType, amount)`
- Inventory is updated in `PlayerData`

### 4.2 Inventory → Selling System

When player sells:
- `SellingSystem.sellAll(player)` or `SellingSystem.sellSelected(player, oreTypes)`
- Calls `InventoryManager.removeOre()` for each ore
- Adds gold to `PlayerData.gold`

### 4.3 Shop → Pickaxe System

When player buys pickaxe:
- `PickaxeShop.buyPickaxe(player, tier)`
- Updates `PlayerData.currentPickaxeTier`
- Calls `PickaxeManager.attachPickaxeToPlayer(player, tier)`

## 5. UI Requirements

### 5.1 Inventory UI

- Display current ore counts
- Show total inventory value
- Update in real-time as ores are mined

### 5.2 Selling UI

- List all ores with quantities
- Show individual ore values
- Show total value
- "Sell All" button
- "Sell Selected" button (optional)

### 5.3 Shop UI

- List available pickaxes
- Show pickaxe stats
- Show costs
- Highlight affordable pickaxes
- "Buy" buttons

## 6. Data Flow

```
Mining → InventoryManager.addOre() → PlayerData.inventory
                                                      ↓
SellingSystem.sellAll() → InventoryManager.removeOre() → PlayerData.gold
                                                      ↓
PickaxeShop.buyPickaxe() → PlayerData.currentPickaxeTier → PickaxeManager
```

