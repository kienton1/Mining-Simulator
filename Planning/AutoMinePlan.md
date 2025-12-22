# Auto Mine Behavior Plan

Goal: Keep auto-mine reliable and deterministic across all floors. When enabled, the player moves to the mine center, mines downward continuously, and re-centers if displaced until auto-mine is turned off.

## Target Position
- Center of mines (world coords): `x: -0.63, y: 1.79, z: 19.44` (current known middle). Treat as a configurable constant (e.g., `AUTO_MINE_TARGET`), not hardcoded inline.
- Allow easy tweaks per map by keeping it in `GameConstants`.

## State / Flags
- `autoMineEnabled`: true/false per player.
- `autoMineInterval`: interval/loop handle for recenter checks.
- Optional `isAutoMiningDown`: guards start/stop of mining loop.

## Activation Flow (TOGGLE_AUTO_MINE on → true)
1) Set `autoMineEnabled = true`; disable auto-train if needed.
2) Immediately teleport/move player to `AUTO_MINE_TARGET` (respect current depth if you need floor alignment; else use target.y).
3) After a short delay (e.g., 300–500 ms) start the mining loop if not already mining.
4) Begin recenter watchdog (interval ~2s):
   - Check 3D distance from target (XYZ). If > threshold (e.g., 1.5–2.0), teleport/move back to target.
   - Optionally, if falling or depth changes, update `y` target to current depth + 1 to stay on the new floor.
5) Keep mining loop running; if mining loop stops unexpectedly while auto-mine is true, restart it.

## Deactivation Flow (TOGGLE_AUTO_MINE off)
1) Set `autoMineEnabled = false`.
2) Stop mining loop.
3) Clear recenter watchdog interval.
4) Send UI state (`AUTO_MINE_STATE`) to keep button in sync.

## Mining Loop Behavior
- Start once when auto-mine turns on; continues until auto-mine off.
- Executes the same hits as manual mining loop.
- If loop stops due to errors/state loss while `autoMineEnabled` is true, restart on next watchdog tick.

## Recenter Logic
- Distance check uses full 3D distance to target.
- Threshold: ~1.5–2.0 units.
- Correction: teleport (simple, reliable). Optionally consider pathing later.
- Runs every ~2s; could tighten if players drift quickly.

## Depth Handling
- Preferred: maintain `y` around current mining depth + 1 so player stands above mined block. When descending to next floor, recenter to the same X/Z and updated Y.
- If not tracking depth yet, keep using a fixed `AUTO_MINE_TARGET.y` and rely on mining loop/fall to descend; still recenter X/Z.

## UI Contract
- Client sends `TOGGLE_AUTO_MINE`.
- Server sends `AUTO_MINE_STATE { enabled: boolean }`.
- Client button shows green when false, red when true (already implemented).

## Failure/Edge Cases
- Player teleported: watchdog re-teleports to target if auto-mine on.
- Player moves manually: watchdog snaps back while auto-mine on.
- Mining loop stopped but flag on: restart on next tick.
- Player leaves/disconnects: stop intervals/loops; clear state.

## Implementation Notes
- Add `AUTO_MINE_TARGET` to `GameConstants`.
- In `GameManager.startAutoMine`:
  - teleport to target,
  - start mining loop after delay,
  - set watchdog interval for recenter + loop restart.
- In `stopAutoMine`: clear interval and stop mining loop.
- Keep all per-player state in `playerAutoStates` map.

