/**
 * Egg Display Animator
 *
 * Spawns and animates egg models at egg stations with hover and spin effects.
 * Includes gentle sparkle particles around each egg.
 */

import { World, Entity, RigidBodyType, ColliderShape } from 'hytopia';

interface EggConfig {
  name: string;
  modelUri: string;
  position: { x: number; y: number; z: number };
}

interface EggAnimationState {
  entity: Entity;
  baseY: number;
  startTime: number;
}

interface ParticleData {
  entity: Entity;
  spawnTime: number;
  lifetime: number;
  basePosition: { x: number; y: number; z: number };
  orbitRadius: number;
  orbitSpeed: number;
  orbitOffset: number;
  floatSpeed: number;
}

// Egg configurations for all islands
const EGG_CONFIGS: EggConfig[] = [
  // Island 1
  { name: 'moss-egg', modelUri: 'models/Eggs/moss-egg.gltf', position: { x: -13, y: 2, z: 9 } },
  { name: 'gem-egg', modelUri: 'models/Eggs/GemEgg.gltf', position: { x: -13, y: 2, z: 5 } },
  { name: 'crystal-egg', modelUri: 'models/Eggs/CrystalEgg.gltf', position: { x: -13, y: 2, z: 1 } },
  // Island 2
  { name: 'abyssal-egg', modelUri: 'models/Eggs/AbyssalEgg.gltf', position: { x: -300, y: 2, z: 10 } },
  { name: 'boardwalk-egg', modelUri: 'models/Eggs/BoardwalkEgg.gltf', position: { x: -300, y: 2, z: 6 } },
  { name: 'shipwreck-egg', modelUri: 'models/Eggs/ShipwreckEgg.gltf', position: { x: -300, y: 2, z: 2 } },
  // Island 3
  { name: 'sand-egg', modelUri: 'models/Eggs/SandEgg.gltf', position: { x: -600, y: 2, z: 12 } },
  { name: 'snow-egg', modelUri: 'models/Eggs/SnowEgg.gltf', position: { x: -600, y: 2, z: 8 } },
  { name: 'lava-egg', modelUri: 'models/Eggs/LavaEgg.gltf', position: { x: -600, y: 2, z: 4 } },
];

export class EggDisplayAnimator {
  private world: World;
  private eggStates: EggAnimationState[] = [];
  private particles: Map<Entity, ParticleData> = new Map();
  private interval?: NodeJS.Timeout;
  private particleSpawnInterval?: NodeJS.Timeout;

  // Animation parameters (slowed down)
  private readonly TICK_MS = 16; // ~60fps
  private readonly HOVER_AMPLITUDE = 0.12; // blocks (slightly reduced)
  private readonly HOVER_FREQUENCY = 0.8; // Hz (slowed from 1.5)
  private readonly SPIN_SPEED = 0.2; // rotations per second (slowed from 0.5)
  private readonly EGG_SCALE = 2.2;

  // Particle parameters
  private readonly PARTICLE_SIZE = { x: 0.04, y: 0.04, z: 0.04 };
  private readonly PARTICLE_LIFETIME_MS = 2500;
  private readonly PARTICLE_SPAWN_INTERVAL_MS = 400;
  private readonly PARTICLES_PER_EGG = 3;

  constructor(world: World) {
    this.world = world;
  }

  start(): void {
    // Spawn all egg entities
    this.spawnEggs();

    // Start animation loop
    if (!this.interval) {
      this.interval = setInterval(() => this.tick(), this.TICK_MS);
    }

    // Start particle spawning
    if (!this.particleSpawnInterval) {
      this.particleSpawnInterval = setInterval(
        () => this.spawnParticles(),
        this.PARTICLE_SPAWN_INTERVAL_MS
      );
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }

    if (this.particleSpawnInterval) {
      clearInterval(this.particleSpawnInterval);
      this.particleSpawnInterval = undefined;
    }

    // Despawn all eggs
    for (const state of this.eggStates) {
      if (state.entity.isSpawned) {
        state.entity.despawn();
      }
    }
    this.eggStates = [];

    // Despawn all particles
    for (const [entity] of this.particles) {
      if (entity.isSpawned) {
        entity.despawn();
      }
    }
    this.particles.clear();
  }

  private spawnEggs(): void {
    const now = Date.now();

    for (const config of EGG_CONFIGS) {
      const entity = new Entity({
        name: config.name,
        modelUri: config.modelUri,
        modelScale: this.EGG_SCALE,
        rigidBodyOptions: {
          type: RigidBodyType.KINEMATIC_POSITION,
        },
        tag: 'egg',
      });

      entity.spawn(this.world, config.position);

      this.eggStates.push({
        entity,
        baseY: config.position.y,
        startTime: now,
      });
    }

    console.log(`[EggDisplayAnimator] Spawned ${this.eggStates.length} egg entities`);
  }

  private spawnParticles(): void {
    const now = Date.now();

    for (const state of this.eggStates) {
      // Spawn a few particles per egg
      for (let i = 0; i < this.PARTICLES_PER_EGG; i++) {
        // Random orbit parameters
        const orbitRadius = 0.6 + Math.random() * 0.4; // 0.6 to 1.0
        const orbitSpeed = 0.5 + Math.random() * 0.5; // 0.5 to 1.0 rad/s
        const orbitOffset = Math.random() * Math.PI * 2; // Random start angle
        const floatSpeed = 0.3 + Math.random() * 0.3; // Upward drift

        // Gentle golden/white sparkle color
        const sparkleColors = [
          { r: 255, g: 255, b: 200 }, // Warm white
          { r: 255, g: 230, b: 150 }, // Golden
          { r: 200, g: 220, b: 255 }, // Cool white
          { r: 255, g: 200, b: 255 }, // Pink tint
        ];
        const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];

        const particle = new Entity({
          name: 'egg-sparkle',
          blockTextureUri: 'blocks/glass.png',
          blockHalfExtents: this.PARTICLE_SIZE,
          tintColor: color,
          opacity: 0.7,
          rigidBodyOptions: {
            type: RigidBodyType.FIXED,
            colliders: [
              {
                shape: ColliderShape.BLOCK,
                halfExtents: this.PARTICLE_SIZE,
                isSensor: true,
              },
            ],
          },
          tag: 'egg-particle',
        });

        const basePos = {
          x: state.entity.position.x,
          y: state.entity.position.y,
          z: state.entity.position.z,
        };

        // Spawn at orbit position
        const startX = basePos.x + Math.cos(orbitOffset) * orbitRadius;
        const startZ = basePos.z + Math.sin(orbitOffset) * orbitRadius;

        particle.spawn(this.world, { x: startX, y: basePos.y, z: startZ });

        this.particles.set(particle, {
          entity: particle,
          spawnTime: now,
          lifetime: this.PARTICLE_LIFETIME_MS,
          basePosition: basePos,
          orbitRadius,
          orbitSpeed,
          orbitOffset,
          floatSpeed,
        });
      }
    }
  }

  private tick(): void {
    const now = Date.now();

    // Update eggs
    for (const state of this.eggStates) {
      const elapsed = (now - state.startTime) / 1000; // seconds

      // Hover: sinusoidal Y movement
      const hoverOffset = this.HOVER_AMPLITUDE *
        Math.sin(elapsed * this.HOVER_FREQUENCY * Math.PI * 2);

      // Spin: continuous Y rotation
      const spinAngle = elapsed * this.SPIN_SPEED * Math.PI * 2;

      // Update position
      state.entity.setPosition({
        x: state.entity.position.x,
        y: state.baseY + hoverOffset,
        z: state.entity.position.z,
      });

      // Update rotation (quaternion for Y-axis rotation)
      const halfAngle = spinAngle / 2;
      state.entity.setRotation({
        x: 0,
        y: Math.sin(halfAngle),
        z: 0,
        w: Math.cos(halfAngle),
      });
    }

    // Update particles
    const particlesToRemove: Entity[] = [];

    for (const [entity, data] of this.particles) {
      const elapsed = now - data.spawnTime;
      const progress = elapsed / data.lifetime;

      if (progress >= 1) {
        particlesToRemove.push(entity);
        continue;
      }

      // Calculate orbit position
      const angle = data.orbitOffset + (elapsed / 1000) * data.orbitSpeed;
      const x = data.basePosition.x + Math.cos(angle) * data.orbitRadius;
      const z = data.basePosition.z + Math.sin(angle) * data.orbitRadius;
      const y = data.basePosition.y + (elapsed / 1000) * data.floatSpeed;

      entity.setPosition({ x, y, z });

      // Fade out opacity
      const opacity = 0.7 * (1 - progress);
      entity.setOpacity(opacity);
    }

    // Remove expired particles
    for (const entity of particlesToRemove) {
      if (entity.isSpawned) {
        entity.despawn();
      }
      this.particles.delete(entity);
    }
  }
}
