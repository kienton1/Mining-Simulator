/**
 * Daily Chest Entity
 *
 * Spawns treasure chest models near gem upgrade stores with sparkle particle effects.
 */

import { World, Entity, RigidBodyType, ParticleEmitter } from 'hytopia';

interface ChestPosition {
  x: number;
  y: number;
  z: number;
}

export class DailyChestEntity {
  private world: World;
  private position: ChestPosition;
  private entity?: Entity;
  private particleEmitters: ParticleEmitter[] = [];

  // Model settings
  private readonly MODEL_URI = 'models/environment/Dungeon/legendary-loot-chest.gltf';
  private readonly SCALE = 2;
  private readonly Y_OFFSET = 0.25;
  // 90 degrees anticlockwise around Y axis: quaternion for -90 degrees
  private readonly ROTATION = { x: 0, y: -0.7071067811865476, z: 0, w: 0.7071067811865476 };

  // Particle textures
  private readonly PARTICLE_TEXTURES = [
    'particles/star_01.png',
    'particles/star_04.png',
    'particles/symbol_02.png',
  ];

  // Particle colors (Gold, Green, Warm)
  private readonly PARTICLE_COLORS = [
    { start: { r: 255, g: 200, b: 50 }, end: { r: 255, g: 180, b: 0 } },   // Gold
    { start: { r: 200, g: 255, b: 200 }, end: { r: 150, g: 255, b: 150 } }, // Green
    { start: { r: 255, g: 220, b: 150 }, end: { r: 255, g: 200, b: 100 } }, // Warm
  ];

  constructor(world: World, position: ChestPosition) {
    this.world = world;
    this.position = position;
  }

  /**
   * Spawns the chest entity and particle emitters
   */
  spawn(): void {
    // Calculate spawn position with Y offset
    const spawnPosition = {
      x: this.position.x,
      y: this.position.y + this.Y_OFFSET,
      z: this.position.z,
    };

    // Spawn chest entity
    this.entity = new Entity({
      name: 'daily-chest',
      modelUri: this.MODEL_URI,
      modelScale: this.SCALE,
      rigidBodyOptions: {
        type: RigidBodyType.KINEMATIC_POSITION,
      },
      tag: 'daily-chest',
    });

    this.entity.spawn(this.world, spawnPosition);

    // Apply rotation (90 degrees anticlockwise)
    this.entity.setRotation(this.ROTATION);

    // Create and spawn particle emitters
    this.createParticleEmitters();

    console.log(`[DailyChestEntity] Spawned chest at (${spawnPosition.x}, ${spawnPosition.y}, ${spawnPosition.z})`);
  }

  /**
   * Despawns the chest entity and particle emitters
   */
  despawn(): void {
    // Despawn particle emitters
    for (const emitter of this.particleEmitters) {
      if (emitter.isSpawned) {
        emitter.despawn();
      }
    }
    this.particleEmitters = [];

    // Despawn entity
    if (this.entity?.isSpawned) {
      this.entity.despawn();
    }
    this.entity = undefined;
  }

  /**
   * Creates particle emitters for the chest
   */
  private createParticleEmitters(): void {
    for (let i = 0; i < this.PARTICLE_TEXTURES.length; i++) {
      const emitter = new ParticleEmitter({
        position: {
          x: this.position.x,
          y: this.position.y + this.Y_OFFSET + 0.5, // Slightly above chest base
          z: this.position.z,
        },
        textureUri: this.PARTICLE_TEXTURES[i],

        // Colors
        colorStart: this.PARTICLE_COLORS[i].start,
        colorEnd: this.PARTICLE_COLORS[i].end,

        // High color intensity for glow effect
        colorIntensityStart: 6,
        colorIntensityEnd: 4,

        // Opacity
        opacityStart: 1.0,
        opacityEnd: 0.3,

        // Size
        sizeStart: 0.35,
        sizeEnd: 0.12,
        sizeStartVariance: 0.1,

        // Movement - gentle upward drift with spread
        velocity: { x: 0, y: 0.4, z: 0 },
        velocityVariance: { x: 0.4, y: 0.2, z: 0.4 },

        // Position spread around chest
        positionVariance: { x: 1.0, y: 0.3, z: 1.0 },

        // Timing
        lifetime: 2.5,
        lifetimeVariance: 0.8,
        rate: 1.2,
        maxParticles: 6,
      });

      emitter.spawn(this.world);
      this.particleEmitters.push(emitter);
    }
  }

  /**
   * Gets the position of this chest
   */
  getPosition(): ChestPosition {
    return { ...this.position };
  }
}
