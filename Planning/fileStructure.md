# File Structure Proposal
## Instanced Mining + Surface Training Simulator

```
Assets/
├── Scripts/
│   ├── Core/
│   │   ├── GameManager.cs                    # Main game state manager
│   │   ├── PlayerData.cs                      # Persistent player stats (Power, Rebirths, Gold)
│   │   ├── PlayerController.cs                # Player movement and interaction
│   │   └── GameConstants.cs                   # Global constants (PowerScalingConstant, etc.)
│   │
│   ├── Surface/
│   │   ├── SurfaceWorldManager.cs             # Manages surface/lobby world
│   │   ├── Training/
│   │   │   ├── TrainingRock.cs                # Training rock behavior
│   │   │   ├── TrainingRockData.cs            # ScriptableObject: Rock stats (ID, RequiredRebirths, PowerMultiplier)
│   │   │   ├── TrainingSystem.cs              # Handles training logic and auto-hitting
│   │   │   └── TrainingRockManager.cs         # Manages all training rocks in scene
│   │   ├── Rebirth/
│   │   │   ├── RebirthSystem.cs               # Rebirth logic and calculations
│   │   │   ├── RebirthAltar.cs                # Rebirth altar interactable
│   │   │   └── RebirthData.cs                 # Rebirth requirements and benefits
│   │   ├── Shop/
│   │   │   ├── ShopManager.cs                 # Shop system manager
│   │   │   ├── PickaxeShop.cs                 # Pickaxe purchasing logic
│   │   │   └── ShopItem.cs                    # Base shop item class
│   │   └── Selling/
│   │       ├── SellStation.cs                 # Ore selling station/NPC
│   │       └── SellingSystem.cs               # Selling logic and calculations
│   │
│   ├── Mining/
│   │   ├── MineInstanceManager.cs             # Manages instanced mine creation/destruction
│   │   ├── MineController.cs                  # Controls individual mine instance
│   │   ├── MiningSystem.cs                    # Core mining mechanics (hitting blocks)
│   │   ├── Block/
│   │   │   ├── MineBlock.cs                   # Individual block behavior
│   │   │   ├── BlockGenerator.cs              # Procedural block generation
│   │   │   └── BlockData.cs                   # Block type data (Stone, Copper, etc.)
│   │   ├── Ore/
│   │   │   ├── OreData.cs                     # ScriptableObject: Ore stats (Type, BaseChance, Value)
│   │   │   ├── OreGenerator.cs                # Luck-based ore generation
│   │   │   └── OreRarityTable.cs              # Weighted probability tables
│   │   └── MineTimer.cs                       # 2-minute timer and auto-teleport
│   │
│   ├── Pickaxe/
│   │   ├── PickaxeData.cs                     # ScriptableObject: Pickaxe stats (Tier, Damage, Speed, Luck, PowerBonus)
│   │   ├── PickaxeManager.cs                  # Manages player's current pickaxe
│   │   └── PickaxeDatabase.cs                 # All pickaxe definitions
│   │
│   ├── Inventory/
│   │   ├── InventorySystem.cs                 # Core inventory management
│   │   ├── InventoryItem.cs                   # Individual inventory item (OreType, Amount)
│   │   └── InventoryData.cs                   # Serializable inventory data
│   │
│   ├── Stats/
│   │   ├── PowerSystem.cs                     # Power calculations and management
│   │   ├── LuckSystem.cs                      # Luck calculations
│   │   ├── MiningStats.cs                     # Combined mining stats (damage, speed)
│   │   └── StatCalculator.cs                  # All stat formulas (PowerGain, MiningDamage, etc.)
│   │
│   ├── Networking/
│   │   ├── NetworkManager.cs                  # Multiplayer networking (if using Unity Netcode/Mirror)
│   │   ├── PlayerNetworkData.cs               # Networked player data sync
│   │   └── InstanceManager.cs                 # Manages instanced mine creation for players
│   │
│   ├── Teleport/
│   │   ├── TeleportSystem.cs                  # Handles teleportation between surface and mines
│   │   ├── MinePortal.cs                      # Portal to enter mines
│   │   └── TeleportData.cs                    # Data passed during teleport (stats, inventory)
│   │
│   ├── UI/
│   │   ├── UIManager.cs                       # Main UI controller
│   │   ├── Training/
│   │   │   ├── TrainingUI.cs                  # Training rock UI (TRAIN button)
│   │   │   └── TrainingStatsDisplay.cs        # Shows power gain, etc.
│   │   ├── Mining/
│   │   │   ├── MiningUI.cs                    # Mining interface (timer, depth)
│   │   │   └── BlockDisplay.cs                # Current block info
│   │   ├── Inventory/
│   │   │   ├── InventoryUI.cs                 # Inventory panel
│   │   │   └── InventorySlot.cs               # Individual inventory slot UI
│   │   ├── Shop/
│   │   │   ├── ShopUI.cs                      # Shop interface
│   │   │   └── ShopItemUI.cs                  # Shop item display
│   │   ├── Selling/
│   │   │   ├── SellUI.cs                      # Selling interface (Sell All, Sell Selected)
│   │   │   └── SellConfirmation.cs            # Sell confirmation dialog
│   │   ├── Rebirth/
│   │   │   ├── RebirthUI.cs                   # Rebirth interface
│   │   │   └── RebirthConfirmation.cs         # Rebirth confirmation
│   │   ├── Stats/
│   │   │   ├── StatsDisplay.cs                # Power, Luck, Rebirths display
│   │   │   └── PickaxeDisplay.cs              # Current pickaxe info
│   │   └── HUD/
│   │       ├── HUDController.cs               # Main HUD overlay
│   │       ├── GoldDisplay.cs                 # Gold counter
│   │       └── TimerDisplay.cs                # Mine timer display
│   │
│   ├── Data/
│   │   ├── ScriptableObjects/
│   │   │   ├── PickaxeDataSO.cs               # Pickaxe ScriptableObject
│   │   │   ├── OreDataSO.cs                   # Ore ScriptableObject
│   │   │   ├── TrainingRockDataSO.cs          # Training Rock ScriptableObject
│   │   │   └── GameConfigSO.cs                 # Global game configuration
│   │   ├── SaveSystem/
│   │   │   ├── SaveManager.cs                 # Save/load system
│   │   │   ├── SaveData.cs                    # Serializable save data structure
│   │   │   └── SaveFileHandler.cs             # File I/O operations
│   │   └── Config/
│   │       ├── GameConfig.cs                  # Game configuration (constants, formulas)
│   │       └── BalanceConfig.cs               # Game balance values
│   │
│   └── Utilities/
│       ├── MathUtils.cs                       # Math helper functions
│       ├── ProbabilityUtils.cs                # Weighted random, normalization
│       ├── EventSystem.cs                     # Custom event system (if not using Unity Events)
│       └── Extensions.cs                      # Extension methods
│
├── Prefabs/
│   ├── Player/
│   │   └── Player.prefab
│   ├── Surface/
│   │   ├── TrainingRock.prefab
│   │   ├── RebirthAltar.prefab
│   │   ├── Shop.prefab
│   │   ├── SellStation.prefab
│   │   └── MinePortal.prefab
│   ├── Mining/
│   │   ├── MineBlock.prefab
│   │   └── MineInstance.prefab
│   └── UI/
│       ├── TrainingUI.prefab
│       ├── InventoryUI.prefab
│       ├── ShopUI.prefab
│       ├── SellUI.prefab
│       └── HUD.prefab
│
├── Scenes/
│   ├── SurfaceWorld.unity                     # Main lobby/surface scene
│   ├── MineInstance.unity                     # Instanced mine scene template
│   └── MainMenu.unity                         # Main menu (optional)
│
├── ScriptableObjects/
│   ├── Pickaxes/
│   │   ├── RustyPickaxe.asset
│   │   ├── StonePickaxe.asset
│   │   ├── IronPickaxe.asset
│   │   └── ... (all pickaxe tiers)
│   ├── Ores/
│   │   ├── StoneOre.asset
│   │   ├── CopperOre.asset
│   │   ├── IronOre.asset
│   │   ├── GoldOre.asset
│   │   └── DiamondOre.asset
│   └── TrainingRocks/
│       ├── StoneRock.asset
│       ├── IronRock.asset
│       ├── GoldRock.asset
│       ├── DiamondRock.asset
│       └── CrystalRock.asset
│
├── Art/
│   ├── Models/
│   │   ├── Player/
│   │   ├── Blocks/
│   │   ├── Ores/
│   │   └── TrainingRocks/
│   ├── Textures/
│   │   ├── Blocks/
│   │   ├── Ores/
│   │   └── UI/
│   └── Materials/
│
├── Audio/
│   ├── SFX/
│   │   ├── Mining/
│   │   ├── Training/
│   │   └── UI/
│   └── Music/
│
└── Resources/
    └── Config/
        └── defaultGameConfig.json             # Default game configuration (optional)
```

## Key Design Principles

### 1. **Separation of Concerns**
   - Core systems are isolated (Power, Mining, Training)
   - Data (ScriptableObjects) separated from logic
   - UI separated from game logic

### 2. **Modularity**
   - Each system can be developed/tested independently
   - Easy to add new pickaxes, ores, or training rocks via ScriptableObjects
   - Configurable formulas in StatCalculator

### 3. **Scalability**
   - ScriptableObject-based data allows designers to tweak without code changes
   - Event system enables loose coupling
   - Save system handles persistence cleanly

### 4. **Multiplayer Ready**
   - Networking folder prepared for multiplayer implementation
   - Instance management separated for instanced mines
   - Player data structured for network sync

## Implementation Notes

- **ScriptableObjects**: Use for all game data (Pickaxes, Ores, Training Rocks) to allow easy tweaking
- **Managers**: Each major system has a manager class for centralized control
- **Data Classes**: Separate data structures from MonoBehaviour logic
- **UI**: Modular UI components that can be enabled/disabled independently
- **Save System**: Centralized save/load for player progression

## Alternative Structure (If Not Unity)

If using a different engine or framework, adapt the structure:
- Replace `ScriptableObjects/` with `Data/JSON` or `Data/YAML`
- Replace `Prefabs/` with `Entities/` or `GameObjects/`
- Replace `Scenes/` with `Levels/` or `Worlds/`
- Keep the same logical organization in `Scripts/`

