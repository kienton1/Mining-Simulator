# Instanced Mines with Shared Descent Hole

Goal: All players gather at a single visible mine entrance (a 10-block-deep vertical hole). Everyone jumps down together; upon landing at the bottom, each player is seamlessly teleported into their own private mine instance. Below is the implementation plan using Hytopia patterns without writing code yet.

## Experience Flow
- Shared entrance: A 10-block-deep shaft in the surface area that everyone can see and jump into.
- Safe descent: Players fall or climb down; when they reach the bottom trigger, we teleport them.
- Private mine handoff: Teleport sends them to their per-player mine space (different world/offset) so mining is fully isolated.
- Return: A ladder/portal at the instance exit returns players to the shared surface.

## Technical Approach
### 1) Shared Entrance & Trigger
- Create a visible 10-block shaft in the main world.
- Place a trigger volume at shaft bottom (or a thin trigger slab) that fires when a player touches it.
- Optional: Add a top trigger to start fall damage suppression while inside shaft.

### 2) Per-Player Mine Instances
- Each player gets a `PlayerMineInstance` managed by `MiningSystem`.
- Two viable isolation methods; pick one based on SDK support:
  - Separate space via spatial offset: Give each player a unique large XY offset and keep Y the same; their mine is far away in the same world.
  - Separate World (if supported): Spawn/assign a child world per player; teleport to that world’s entry.
- Mine contents (blocks, ores, HP) live only in the player’s instance; no shared world edits.

### 3) Teleport Handoff
- On trigger hit at shaft bottom, call a handoff that:
  - Ensures the player’s mine instance exists/loaded (generate first level if needed).
  - Teleports player to their mine entry position (instance world or offset).
  - Re-enables normal physics (if fall protection was active).
- Use a short fade or screen hint to hide the teleport pop.

### 4) Collision & Safety
- Disable/limit fall damage while inside the shaft (timer or trigger-based).
- Keep shaft walls/ladder collidable so players can’t clip out.
- Make the bottom trigger one-way (only fires on entry from above) to avoid loops.

### 5) Interaction & Visibility Rules
- In the instance, only that player’s blocks/entities should be spawned.
- If using spatial offsets in the same world:
  - Assign a unique offset per player; all mine coords are translated by that offset.
  - Raycasts and block maps operate in instance space; world writes are avoided.
- If using separate worlds:
  - Spawn/render only the player’s mine world; no other players present there.

### 6) Instance Lifecycle
- Create on first entry; reuse on subsequent entries.
- Cleanup on player leave/logout (despawn entities, free memory).
- Optional persistence: save progress to restore on reconnect.

## Hytopia SDK Notes (patterns to apply)
- Use an `Entity` or `AreaTrigger` at the shaft bottom for detecting entry; hook into its `onEnter`/`onOverlap` callback with `Player`.
- Use `world.entityManager` for spawn/despawn; tag entities with player ownership if needed.
- For teleporting:
  - If single world: use player rigid body `setPosition` (or teleport helper) to the offset mine entry.
  - If multi-world supported: move player to the per-player world and position them at the mine entry spawn.
- For safety: toggle/restore physics flags (fall damage, collision masks) while inside the shaft/teleport.

## Concrete Steps to Implement
1) Build the shared shaft
   - Add a 10-block vertical hole with ladder/vines; top trigger starts fall-protect; bottom trigger detects arrival.
2) Add bottom trigger logic
   - On player enter: stop fall damage, get/create `PlayerMineInstance`, teleport to instance entry, then restore normal state.
3) Define instance entry coordinates
   - Spatial offset plan: reserve large XY grid cells per player (e.g., +2000x,+2000z per player index); entry at the same Y as surface.
   - Or child-world plan: define a mine spawn point inside the per-player world.
4) Instance generation
   - On first teleport, generate the first mine level for that player; do not write to shared chunk lattice.
5) Return path
   - Place a return trigger/ladder in the instance that teleports back to the shared surface spawn.
6) Cleanup & persistence
   - On disconnect, despawn that player’s mine entities; optionally persist progress for reconnection.

## Testing Checklist
- Entrance works: players can jump/fall the 10-block shaft without dying.
- Trigger fires once per entry; no double teleports or loops.
- Teleport lands player at their own mine; no other players visible there.
- Mining isolation: breaking a block affects only the current player’s mine.
- Return trigger brings player back to the shared surface reliably.
- Re-entry restores the same personal mine state if persistence is enabled.

## Decision: Offset vs Separate World
- Default recommendation: spatial offset in the main world (simpler, fewer SDK unknowns).
- If SDK supports stable per-player worlds and we need stronger isolation/perf, switch to per-player world handoff with the same trigger flow.