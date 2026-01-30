/**
 * Egg Display Animator
 *
 * Spawns and animates egg models at egg stations with hover and spin effects.
 * Includes gentle sparkle particles around each egg.
 */

import { World, Entity, RigidBodyType, ParticleEmitter } from 'hytopia';

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
  private interval?: NodeJS.Timeout;
  private particleEmitters: Map<Entity, ParticleEmitter[]> = new Map();

  // Animation parameters (slowed down)
  private readonly TICK_MS = 16; // ~60fps
  private readonly HOVER_AMPLITUDE = 0.12; // blocks (slightly reduced)
  private readonly HOVER_FREQUENCY = 0.8; // Hz (slowed from 1.5)
  private readonly SPIN_SPEED = 0.2; // rotations per second (slowed from 0.5)
  private readonly EGG_SCALE = 2.2;

  // Particle textures and colors
  private readonly PARTICLE_TEXTURES = [
    'particles/star_01.png',
    'particles/star_04.png',
    'particles/symbol_02.png',
  ];

  private readonly PARTICLE_COLORS = [
    { start: { r: 255, g: 215, b: 0 }, end: { r: 255, g: 180, b: 0 } },     // Golden
    { start: { r: 255, g: 255, b: 220 }, end: { r: 255, g: 255, b: 180 } }, // Warm white
    { start: { r: 255, g: 200, b: 255 }, end: { r: 255, g: 150, b: 220 } }, // Pink/magical
  ];

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
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }

    // Despawn all eggs and their particle emitters
    for (const state of this.eggStates) {
      const emitters = this.particleEmitters.get(state.entity);
      if (emitters) {
        for (const emitter of emitters) {
          if (emitter.isSpawned) {
            emitter.despawn();
          }
        }
      }
      if (state.entity.isSpawned) {
        state.entity.despawn();
      }
    }
    this.eggStates = [];
    this.particleEmitters.clear();
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

      // Create and spawn particle emitters for this egg
      const emitters = this.createParticleEmittersForEgg(config.position);
      this.particleEmitters.set(entity, emitters);
      for (const emitter of emitters) {
        emitter.spawn(this.world);
      }

      this.eggStates.push({
        entity,
        baseY: config.position.y,
        startTime: now,
      });
    }

    console.log(`[EggDisplayAnimator] Spawned ${this.eggStates.length} egg entities`);
  }

  private createParticleEmittersForEgg(eggPosition: { x: number; y: number; z: number }): ParticleEmitter[] {
    const emitters: ParticleEmitter[] = [];

    for (let i = 0; i < this.PARTICLE_TEXTURES.length; i++) {
      const emitter = new ParticleEmitter({
        position: { x: eggPosition.x, y: eggPosition.y, z: eggPosition.z },
        textureUri: this.PARTICLE_TEXTURES[i],

        // Colors
        colorStart: this.PARTICLE_COLORS[i].start,
        colorEnd: this.PARTICLE_COLORS[i].end,

        // HIGH COLOR INTENSITY - values > 1 create HDR/bloom effects
        colorIntensityStart: 8,
        colorIntensityEnd: 5,

        // Opacity
        opacityStart: 1.0,
        opacityEnd: 0.3,

        // Size - bigger particles
        sizeStart: 0.4,
        sizeEnd: 0.15,
        sizeStartVariance: 0.15,

        // Movement - simulate swirl effect
        velocity: { x: 0, y: 0.3, z: 0 },
        velocityVariance: { x: 0.5, y: 0.2, z: 0.5 },

        // Position spread around egg
        positionVariance: { x: 1.2, y: 0.3, z: 1.2 },

        // Timing - less frequent
        lifetime: 3.0,
        lifetimeVariance: 1.0,
        rate: 1,
        maxParticles: 5,
      });

      emitters.push(emitter);
    }

    return emitters;
  }

  private tick(): void {
    const now = Date.now();

    // Update eggs - ParticleEmitter handles particle lifecycle automatically
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
  }
}
