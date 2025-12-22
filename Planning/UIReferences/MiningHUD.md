## Mining HUD

![Mining HUD](../images/ui/mining-hud.png)

### Bottom Middle Right - Mined Ore Popup
- Shows what ore was just mined (e.g., "Stone+")
- Appears when a block is successfully mined
- Displays ore name with a "+" icon
- Example: "Stone+", "Copper+", "Iron+", etc.

### Bottom Middle - Current Ore Display
- Shows what ore level the player is standing on/about to mine
- Updates as player mines down
- Displays the ore type they're currently looking at

### Bottom Middle Right - Damage Display
- Shows damage dealt to the current block
- Updates with each hit
- Example: "185 Dmg"
- Positioned near the mined ore popup area

### Mining Mechanics
- Player mines downward one block at a time
- When block is destroyed, player falls down 1 unit
- Block below is revealed
- Always generate at least one block below current position so player always sees something

