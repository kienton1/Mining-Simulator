# Implementation Roadmap: Inventory & Shop Systems

## ✅ What's Done

### Backend Systems (Complete)
- ✅ `InventoryManager.ts` - All inventory operations
- ✅ `SellingSystem.ts` - Selling logic and calculations
- ✅ `PickaxeShop.ts` - Pickaxe purchase logic
- ✅ Integration into `GameManager` - Systems are initialized and accessible
- ✅ Mining system already uses `addOreToInventory()` - Ores are added when mined

## 🚧 What Needs to Be Done

### Priority 1: Inventory Display UI
**Goal**: Show player's current inventory in the HUD

**Tasks**:
1. Add inventory panel to `assets/ui/index.html`
   - Display list of ores with quantities
   - Show total inventory value
   - Update in real-time as ores are mined
2. Add server-to-client data sync
   - Send inventory updates from server to UI
   - Use `hytopia.onData()` in UI to receive updates
   - Send inventory data when player joins and when inventory changes

**Files to modify**:
- `assets/ui/index.html` - Add inventory UI HTML/CSS/JS
- `src/Core/GameManager.ts` - Add method to send inventory data to UI
- `src/Inventory/InventoryManager.ts` - Trigger UI update after inventory changes

---

### Priority 2: Selling UI
**Goal**: Allow players to sell ores for gold

**Tasks**:
1. Add "Sell" button/panel to UI
   - "Sell All" button
   - Display total value before selling
   - Show confirmation or instant sell
2. Add UI event handler
   - Send `SELL_ALL` event from UI to server
   - Handle in `index.ts` UI event handler
   - Call `gameManager.getSellingSystem().sellAll(player)`
3. Update UI after selling
   - Send updated gold amount to UI
   - Clear inventory display
   - Show gold gained notification

**Files to modify**:
- `assets/ui/index.html` - Add sell UI
- `index.ts` - Add `SELL_ALL` case in UI event handler
- `src/Core/GameManager.ts` - Add method to send gold updates

---

### Priority 3: Pickaxe Shop UI
**Goal**: Allow players to buy pickaxes with gold

**Tasks**:
1. Add shop panel to UI
   - List available pickaxes (tiers higher than current)
   - Show pickaxe stats (damage, speed, luck)
   - For power-related display, see PowerSystemPlan.md
   - Show cost and highlight affordable pickaxes
   - "Buy" button for each pickaxe
2. Add UI event handler
   - Send `BUY_PICKAXE` event with tier from UI to server
   - Handle in `index.ts` UI event handler
   - Call `gameManager.getPickaxeShop().buyPickaxe(player, tier)`
   - Return success/error message to UI
3. Update UI after purchase
   - Update gold display
   - Update pickaxe visual (handled by PickaxeManager)
   - Show purchase confirmation

**Files to modify**:
- `assets/ui/index.html` - Add shop UI
- `index.ts` - Add `BUY_PICKAXE` case in UI event handler
- `src/Core/GameManager.ts` - Add method to send shop data

---

### Priority 4: Interaction Points (Optional)
**Goal**: Add physical locations for shop/sell stations

**Tasks**:
1. Create sell station entity/area
   - Detect when player is near
   - Show "Press E to Sell" prompt
   - Open sell UI when interacted
2. Create shop entity/area
   - Detect when player is near
   - Show "Press E to Shop" prompt
   - Open shop UI when interacted

**Files to create/modify**:
- `src/Shop/SellStation.ts` - Sell station interaction
- `src/Shop/ShopStation.ts` - Shop station interaction
- `index.ts` - Register interaction handlers

---

## Recommended Implementation Order

1. **Start with Inventory Display** (Priority 1)
   - Easiest to implement
   - Provides immediate value (players can see what they have)
   - No user interaction needed, just display

2. **Then Selling UI** (Priority 2)
   - Builds on inventory display
   - Simple interaction (one button)
   - Completes the mining → inventory → gold loop

3. **Then Pickaxe Shop** (Priority 3)
   - Completes the gold → upgrade loop
   - More complex UI (list of items)
   - Full progression cycle complete

4. **Finally Interaction Points** (Priority 4)
   - Nice-to-have polish
   - Makes game feel more complete
   - Can be added later

---

## Quick Start: Inventory Display

Here's a minimal example to get started:

### Step 1: Add Inventory HTML to `assets/ui/index.html`
```html
<!-- Inventory Panel -->
<div id="inventory-panel" class="inventory-panel">
  <h3>Inventory</h3>
  <div id="inventory-list"></div>
  <div id="inventory-total-value">Total Value: 0 gold</div>
</div>
```

### Step 2: Add CSS for inventory panel
```css
.inventory-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 15px;
  border-radius: 8px;
  color: white;
  max-width: 250px;
}
```

### Step 3: Add JavaScript to receive inventory data
```javascript
hytopia.onData(data => {
  if (data.type === 'INVENTORY_UPDATE') {
    updateInventoryDisplay(data.inventory, data.totalValue);
  }
});

function updateInventoryDisplay(inventory, totalValue) {
  const list = document.getElementById('inventory-list');
  list.innerHTML = '';
  
  for (const [oreType, amount] of Object.entries(inventory)) {
    if (amount > 0) {
      const item = document.createElement('div');
      item.textContent = `${oreType}: ${amount}`;
      list.appendChild(item);
    }
  }
  
  document.getElementById('inventory-total-value').textContent = 
    `Total Value: ${totalValue} gold`;
}
```

### Step 4: Send inventory data from server
In `GameManager.ts`, add method to send inventory:
```typescript
sendInventoryUpdate(player: Player): void {
  const inventory = this.inventoryManager.getInventory(player);
  const totalValue = this.inventoryManager.calculateTotalValue(player);
  
  player.ui.sendData({
    type: 'INVENTORY_UPDATE',
    inventory,
    totalValue,
  });
}
```

---

## Next Steps

1. **Choose where to start**: I recommend starting with Inventory Display
2. **Implement one feature at a time**: Complete each priority before moving to next
3. **Test as you go**: Make sure each feature works before adding complexity
4. **Iterate on UI**: Start simple, improve styling later

Would you like me to start implementing the Inventory Display UI now?

