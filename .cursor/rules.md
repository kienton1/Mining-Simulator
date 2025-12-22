# Development Rules & Guidelines
## Instanced Mining + Surface Training Simulator

## Core Principles

### 1. Always Reference File Structure Plan
- **BEFORE creating any new file**, check `Planning/fileStructure.md` to ensure:
  - The file is placed in the correct directory
  - The naming convention matches the proposed structure
  - Related files are grouped logically
  - If a file doesn't exist in the plan, propose an update to the structure first

### 2. Always Reference Development Plan
- **BEFORE implementing features**, review `Planning/gameOverview.txt` section 12 (Implementation Roadmap):
  - Follow the implementation order when possible
  - Ensure features align with the TDD specifications
  - Reference relevant sections (Power System, Mining System, Training System, etc.)
  - Verify formulas match the documented math in section 10

### 3. Hytopia Best Practices

#### Code Style
- Use **TypeScript** with proper type definitions
- Follow **event-driven architecture** - use Hytopia's event system (`world.on()`, `PlayerEvent`, etc.)
- Use **JSDoc comments** for all public functions and classes
- Keep functions focused and single-purpose
- Use **async/await** for asynchronous operations

#### Hytopia SDK Patterns
- Use `startServer()` as the entry point
- Handle player lifecycle with `PlayerEvent.JOINED_WORLD` and `PlayerEvent.LEFT_WORLD`
- Clean up entities when players leave: `entity.despawn()`
- Use `world.entityManager` for entity management
- Use `world.chatManager` for player communication
- Use `player.ui.load()` for UI management
- Use `world.loadMap()` for map loading

#### Entity Management
- Always despawn entities when no longer needed
- Use `world.entityManager.getPlayerEntitiesByPlayer(player)` to find player entities
- Spawn entities with proper position data: `entity.spawn(world, { x, y, z })`

#### World & Instance Management
- For instanced mines, create separate world instances or use proper isolation
- Clean up instances when players leave or mines reset
- Use proper teleportation methods for scene transitions

### 4. Code Quality Standards

#### Simplicity & Elegance
- **Keep it simple**: Prefer straightforward solutions over complex abstractions
- **DRY (Don't Repeat Yourself)**: Extract common logic into reusable functions
- **Single Responsibility**: Each class/function should do one thing well
- **Avoid premature optimization**: Write clear code first, optimize when needed

#### Comments & Documentation
- **JSDoc for all public APIs**: Document parameters, return values, and purpose
- **Inline comments for complex logic**: Explain "why" not "what"
- **Section comments**: Group related code with clear section headers
- **Example comments**: Show usage examples for complex functions

#### Code Structure
```typescript
/**
 * Brief description of what this class/function does.
 * 
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @example
 * // Usage example
 * const result = functionName(param);
 */
```

#### Error Handling
- Handle edge cases gracefully
- Provide meaningful error messages
- Use try-catch for async operations
- Validate inputs before processing

#### Type Safety
- Use TypeScript interfaces for data structures
- Avoid `any` types - use proper types or `unknown`
- Define enums for constants (OreType, PickaxeTier, etc.)
- Use type guards when needed

### 5. File Organization Rules

#### Naming Conventions
- **Files**: PascalCase for classes (`TrainingRock.ts`), camelCase for utilities (`mathUtils.ts`)
- **Classes**: PascalCase (`TrainingSystem`, `MineController`)
- **Functions**: camelCase (`calculatePowerGain`, `generateOre`)
- **Constants**: UPPER_SNAKE_CASE (`BASE_POWER_GAIN`, `MINE_RESET_TIME`)
- **Interfaces**: PascalCase with `I` prefix or descriptive name (`IPickaxeData`, `OreData`)

#### Directory Structure
- Follow the structure in `Planning/fileStructure.md`
- Group related files in subdirectories
- Keep UI components separate from game logic
- Keep data structures separate from behavior classes

### 6. Implementation Checklist

Before implementing any feature:
- [ ] Check `Planning/fileStructure.md` for correct file location
- [ ] Review relevant sections in `Planning/gameOverview.txt`
- [ ] Verify formulas match TDD specifications
- [ ] Plan the implementation approach
- [ ] Write JSDoc comments first
- [ ] Implement with proper TypeScript types
- [ ] Add inline comments for complex logic
- [ ] Test edge cases
- [ ] Clean up unused code

### 7. Formula Verification

Always verify formulas match the TDD:
- **Power Gain**: `BasePower × RockMultiplier × PickaxeMultiplier × (1 + Rebirths × 0.10)`
- **Mining Damage**: `PickaxeDamage × (1 + Power / PowerConstant)`
- **Mining Speed**: `PickaxeMiningSpeed`
- **Ore Chance**: `BaseChance × (1 + Luck)` then normalized
- **Rebirth Multiplier**: `1 + (Rebirths × 0.10)`

### 8. Testing Considerations

- Test with edge cases (0 power, max rebirths, etc.)
- Verify formulas produce expected results
- Test player lifecycle (join, leave, reconnect)
- Test instance cleanup and reset mechanics
- Verify UI updates correctly

---

**Remember**: When in doubt, refer back to:
1. `Planning/fileStructure.md` - Where files should go
2. `Planning/gameOverview.txt` - What to implement and how
3. Hytopia SDK docs - How to use Hytopia APIs correctly

