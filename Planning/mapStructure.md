# Map Structure Notes

## Training Area (Surface)
- **Cobbled-Deepslate Clusters** = Training Rocks
- These are the practice areas where players increase Power
- Each cluster represents a training rock with different tiers
- Players auto-hit these to gain Power

## Mining Area (Surface → Instanced Mines)
- **Gold Block Area** = Mine Portal/Entrance
- Multiple gold blocks represent different "levels" or mine instances
- When player interacts with gold block:
  - Either: All gold blocks act as one unified mine entrance
  - Or: Each gold block represents a different mine level/depth
- Players mine downward from the gold block area
- Mining is instanced (private per player or small party)

## Implementation Notes
- Need to handle gold blocks as either:
  1. Single unified mine entrance (all gold blocks = one mine)
  2. Level-based system (each gold block = different starting depth/level)
- Cobbled-deepslate clusters need to be identified and mapped to training rock tiers
- Training rocks should be interactable entities in the world

