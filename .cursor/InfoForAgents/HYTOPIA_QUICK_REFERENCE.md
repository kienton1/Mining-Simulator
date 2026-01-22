# Hytopia SDK Quick Reference

## 🔗 Essential Links

### Documentation
- **Main Server Docs**: https://github.com/hytopiagg/sdk/blob/main/docs/server.md
- **SDK Repository**: https://github.com/hytopiagg/sdk
- **NPM Package**: https://www.npmjs.com/package/hytopia
- **Examples**: https://github.com/hytopiagg/sdk/tree/main/examples/payload-game

### Community & Support
- **Discord**: https://discord.gg/DXCXJbHSJX
- **GitHub Issues**: https://github.com/hytopiagg/sdk/issues

## 📚 Key SDK Modules

### Core Imports (from 'hytopia')
```typescript
import {
  startServer,        // Entry point
  World,             // World instance
  Player,            // Player object
  Entity,            // Entity base class
  PlayerEvent,       // Player events
  PlayerUIEvent,     // UI events
  CollisionGroup,    // Physics collision
  Audio,             // Audio system
  RigidBodyType,     // Physics body types
} from 'hytopia';
```

### Main SDK Paths (via MCP)
- `/sdk/server/src/players/` - Player management
- `/sdk/server/src/worlds/` - World, blocks, entities
- `/sdk/server/src/entities/` - Entity system
- `/sdk/server/src/networking/` - Network layer
- `/sdk/server/src/events/` - Event system
- `/docs/sdk-guides/` - Documentation guides

## 🎯 Common Patterns

### Server Entry Point
```typescript
startServer(world => {
  // Your game initialization
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    // Handle player join
  });
});
```

### Player Events
- `PlayerEvent.JOINED_WORLD` - Player joins
- `PlayerEvent.LEFT_WORLD` - Player leaves
- `PlayerEvent.MOVED` - Player movement
- `PlayerEvent.CHAT` - Chat messages

### UI Events
- `PlayerUIEvent.DATA` - UI data received from client

### Entity Management
```typescript
// Spawn entity
entity.spawn(world, { x, y, z });

// Despawn entity
entity.despawn();

// Get player entities
world.entityManager.getPlayerEntitiesByPlayer(player);
```

## 🔍 MCP Search Queries

Use these semantic queries with MCP:

- "How to create custom entities"
- "Player event handling examples"
- "UI data communication between server and client"
- "Physics collision detection"
- "World and block management"
- "Audio system implementation"
- "Entity controllers and movement"

## 📁 Your Project Structure

```
Mining Simulator/
├── index.ts              # Main entry point
├── src/
│   ├── Core/            # Core game logic
│   ├── Mining/          # Mining system
│   ├── Shop/            # Shop and merchants
│   ├── Pets/            # Pet system
│   └── Pickaxe/         # Pickaxe management
├── Planning/            # Design documents
└── assets/             # Game assets
```

## 💡 Quick Tips

1. **Always use `startServer()`** as your entry point
2. **Clean up entities** when players leave: `entity.despawn()`
3. **Use events** for player interactions: `world.on(PlayerEvent...)`
4. **UI is per-player**: `player.ui.load('ui/index.html')`
5. **Reference planning docs** in `Planning/` folder for game design

## 🛠️ MCP Tools Available

- `askQuestion` - Get AI answers from docs
- `search` - Semantic code search
- `ls` - List files/directories
- `cat` - Read file contents
- `grep` - Regex search
- `tree` - View file structure

---

**For detailed setup instructions, see `MCP_INTEGRATION_GUIDE.md`**
