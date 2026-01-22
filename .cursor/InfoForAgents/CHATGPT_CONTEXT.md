# Hytopia SDK Context for ChatGPT/Codex

**Copy this context when starting a conversation with ChatGPT/Codex about Hytopia development:**

---

## Project Context

I'm developing a Hytopia game called "Mining Simulator" using the Hytopia SDK. The project uses TypeScript and follows Hytopia's event-driven architecture.

## Hytopia SDK Resources

### Official Documentation
- **Main Server Documentation**: https://github.com/hytopiagg/sdk/blob/main/docs/server.md
- **SDK GitHub Repository**: https://github.com/hytopiagg/sdk
- **NPM Package**: https://www.npmjs.com/package/hytopia
- **Code Examples**: https://github.com/hytopiagg/sdk/tree/main/examples/payload-game
- **Discord Community**: https://discord.gg/DXCXJbHSJX

### Key SDK Concepts

**Entry Point:**
```typescript
import { startServer, PlayerEvent, World, Player } from 'hytopia';

startServer(world => {
  // Game initialization
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    // Handle player join
  });
});
```

**Core Modules:**
- `World` - Game world instance
- `Player` - Player object with UI, position, etc.
- `Entity` - Base class for game entities
- `PlayerEvent` - Player lifecycle events
- `PlayerUIEvent` - UI interaction events
- `CollisionGroup` - Physics collision groups
- `Audio` - Audio system
- `RigidBodyType` - Physics body types

**Common Patterns:**
- Use `world.on(PlayerEvent.JOINED_WORLD)` for player initialization
- Use `player.ui.load('ui/index.html')` to load UI per player
- Use `entity.spawn(world, { x, y, z })` to spawn entities
- Always `entity.despawn()` when cleaning up
- Use `world.entityManager` for entity management
- Use `world.chatManager` for player communication

## My Project Structure

```
Mining Simulator/
├── index.ts              # Main entry point using startServer()
├── src/
│   ├── Core/            # GameManager, MiningPlayerEntity
│   ├── Mining/          # Mining system, ore data, mining mechanics
│   ├── Shop/            # MerchantEntity, GemTraderEntity, shop systems
│   ├── Pets/            # Pet system, egg stations, pet management
│   ├── Pickaxe/         # PickaxeManager, pickaxe entities
│   └── Stats/           # Player statistics
├── Planning/            # Design documents and implementation plans
└── assets/             # Game assets (blocks, models, UI, etc.)
```

## Current Implementation Details

- **Game Type**: Mining simulator with progression, pets, and shops
- **Worlds**: Multiple worlds (Island 1 and Island 2/Beach World)
- **Key Systems**:
  - Instanced mining system
  - Pickaxe progression and upgrades
  - Pet hatching and management
  - Merchant trading system
  - Gem-based upgrade system
  - World switching/teleportation

## Code Style Guidelines

- Use TypeScript with proper type definitions
- Follow event-driven architecture
- Use JSDoc comments for public functions
- Keep functions focused and single-purpose
- Use async/await for asynchronous operations
- Reference `Planning/` folder for design specifications

## When Asking Questions

Please:
1. Reference the official Hytopia SDK documentation
2. Provide code examples that match Hytopia SDK patterns
3. Consider my existing project structure
4. Follow TypeScript best practices
5. Use Hytopia's event system for interactions
6. Ensure proper cleanup of entities and resources

---

**Use this context at the start of conversations to help ChatGPT/Codex understand your Hytopia project better.**
