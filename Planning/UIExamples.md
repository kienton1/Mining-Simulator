# UI Examples

## Surface HUD (Image 1)
- Vertical HUD shows, top → bottom: `Wins`, `Coins`, `Gems`, `Power`, `Rebirths`.
- Each stat has a green `+` button for boosts/purchases.
- Buttons at bottom: `Auto Mine` (pickaxe icon) and `Auto Train` (power icon).
- Timer banner at top (`Reward` with countdown) highlights limited-time bonuses.

## Power Gain Popup (Image 2)
- When auto-training swings connect, a floating red number (e.g., `81`) pops near the player.
- Indicates per-swing power gain; each value instantly adds to global Power shown in HUD.
- Accumulates while auto-train is active; multiple popups can appear in sequence.

## Training Rock Interaction (Image 3)
- Each rock pedestal displays required Power and/or Rebirths (e.g., `5K power OR 15 rebirths`) plus the Power reward per hit.
- Approaching the rock spawns an `Interact (E)` prompt; pressing the key auto-moves the player beside the rock and starts swinging.
- Training is separate from mining—no mining blocks involved; swings only occur at designated rocks.
- Every swing triggers the Power popup and increases total Power, provided the player meets the requirement threshold.
