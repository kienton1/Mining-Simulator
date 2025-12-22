# Training System

The Training System allows players to auto-hit training rocks to gain Power.

## Usage Example

```typescript
import { GameManager } from '../../Core/GameManager';
import { TrainingRockTier } from './TrainingRockData';

// Get training controller from game manager
const gameManager = new GameManager(world);
const trainingController = gameManager.getTrainingController();

// Register training rocks in the world (call this during world initialization)
const rockManager = trainingController.getRockManager();
rockManager.registerTrainingRocksFromMap([
  { position: { x: 10, y: 5, z: 10 }, tier: TrainingRockTier.STONE },
  { position: { x: 20, y: 5, z: 10 }, tier: TrainingRockTier.IRON },
  // ... more rocks
]);

// When player wants to start training (e.g., from UI button click)
const nearbyRock = trainingController.getNearbyTrainingRock(player);
if (nearbyRock) {
  trainingController.startTraining(player, nearbyRock);
}

// To stop training
trainingController.stopTraining(player);

// Check if player is training
const isTraining = trainingController.isPlayerTraining(player);
```

## Files

- **TrainingRockData.ts** - Data structures and database for training rocks
- **TrainingSystem.ts** - Core training logic (auto-hitting, power gain)
- **TrainingRockManager.ts** - Manages training rock locations in the world
- **TrainingController.ts** - Main controller that coordinates everything

## Integration

The training system is automatically initialized when you create a `GameManager`. Access it via:

```typescript
const trainingController = gameManager.getTrainingController();
```

