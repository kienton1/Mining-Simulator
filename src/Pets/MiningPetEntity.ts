/**
 * Mining Pet Entity
 *
 * A pet entity that dynamically follows the player using SimpleEntityController.
 * Includes formation positioning, step-up climbing, and stuck detection.
 *
 * Based on the PetEntity implementation from the Pets repository.
 */

import {
  Entity,
  SimpleEntityController,
  EntityEvent,
  CollisionGroup,
  ModelRegistry,
  SceneUI,
} from 'hytopia';
import type { World, Vector3Like, Player, PlayerEntity } from 'hytopia';

import type { PetId } from './PetData';
import { getPetDefinition } from './PetDatabase';
import { getPetModelUri, getPetTextureUri, getPetModelInfo } from './PetVisuals';
import { getModelScaleForHeight } from './PetModelHeights';
import {
  PET_FORMATION_BEHIND_DISTANCE,
  PET_FORMATION_SIDE_OFFSET,
  PET_FORMATION_ROW_SPACING,
  PET_FOLLOW_DISTANCE_STOP,
  PET_FOLLOW_DISTANCE_START,
  PET_TELEPORT_DISTANCE,
  PET_EXTREME_DISTANCE_THRESHOLD,
  PET_BASE_SPEED,
  PET_STEP_HEIGHT,
  PET_STEP_PROBE_DISTANCE,
  PET_STEP_UP_VELOCITY,
  PET_STUCK_CHECK_INTERVAL_MS,
  PET_STUCK_DISTANCE_THRESHOLD,
  PET_STUCK_MAX_DURATION_MS,
  PET_VISIBILITY_CHECK_INTERVAL_MS,
  PET_VISIBILITY_MIN_DISTANCE,
  PET_VISIBILITY_FAIL_MAX_COUNT,
  PET_BOUNCE_AMPLITUDE,
  PET_GRAVITY_SCALE,
  PET_BOUNCE_COOLDOWN_MS,
} from './PetConstants';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface MiningPetEntityOptions {
  petId: PetId;
  ownerId: string;
  slotIndex: number;
  totalPets: number;
}

/**
 * Calculate horizontal distance between two positions
 */
function distanceHorizontal(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Calculate 3D distance between two positions
 */
function distance3D(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Mining Pet Entity - follows the player with dynamic movement
 */
export class MiningPetEntity extends Entity {
  // Identity
  public readonly petId: PetId;
  public readonly ownerId: string;
  public slotIndex: number;
  public totalPets: number;

  // Controller
  private simpleController: SimpleEntityController;

  // Stuck detection
  private lastPosition: Vec3 | null = null;
  private stuckTimeMs: number = 0;
  private stuckCheckAccumulator: number = 0;

  // Visibility check
  private visibilityCheckAccumulator: number = 0;
  private visibilityFailCount: number = 0;

  // Movement tracking
  private moveDirection: Vec3 = { x: 0, y: 0, z: 0 };
  private _isCurrentlyMoving: boolean = false;

  // Bounce animation state
  private _isGrounded: boolean = true;
  private _timeSinceLastBounce: number = 0;

  // Label SceneUI
  private _labelSceneUI: SceneUI | undefined;

  // Cached world reference
  private _worldRef: World | null = null;

  constructor(options: MiningPetEntityOptions) {
    const modelUri = getPetModelUri(options.petId);
    const textureUri = getPetTextureUri(options.petId);
    const modelInfo = getPetModelInfo(options.petId);

    // Calculate proper scale for uniform height
    const modelScale = modelInfo
      ? getModelScaleForHeight(modelInfo.modelFolder)
      : 0.35;

    // Get animations for this model
    let idleAnimations: string[] = [];
    let walkAnimations: string[] = [];

    if (modelUri) {
      try {
        const animationNames = ModelRegistry.instance.getAnimationNames(modelUri);
        if (Array.isArray(animationNames) && animationNames.length > 0) {
          // Find idle and walk animations
          for (const name of animationNames) {
            const lowerName = name.toLowerCase();
            if (lowerName.includes('idle') || lowerName.includes('stand')) {
              idleAnimations.push(name);
            } else if (lowerName.includes('walk') || lowerName.includes('run') || lowerName.includes('move')) {
              walkAnimations.push(name);
            }
          }
          // If no specific animations found, use first animation for idle
          if (idleAnimations.length === 0 && animationNames.length > 0) {
            idleAnimations = [animationNames[0]];
          }
        }
      } catch (err) {
        // Ignore animation lookup errors
      }
    }

    // Build entity options
    const entityOptions: any = {
      name: `Pet_${options.petId}`,
      modelUri: modelUri || undefined,
      modelScale,
      tag: 'pet',
    };

    if (textureUri) {
      entityOptions.modelTextureUri = textureUri;
    }

    super(entityOptions);

    this.petId = options.petId;
    this.ownerId = options.ownerId;
    this.slotIndex = options.slotIndex;
    this.totalPets = options.totalPets;

    // Create controller with animations
    this.simpleController = new SimpleEntityController({
      idleLoopedAnimations: idleAnimations,
      moveLoopedAnimations: walkAnimations.length > 0 ? walkAnimations : idleAnimations,
    });
  }

  /**
   * Spawn the pet into the world
   */
  public spawn(world: World, position: Vector3Like): void {
    this.setController(this.simpleController);
    super.spawn(world, position);
    this._worldRef = world;

    // Set up tick handler
    this.on(EntityEvent.TICK, this.onTick.bind(this));

    // Lock rotation on X and Z axes to prevent rolling/tilting
    // Only allow Y rotation (turning to face player)
    this.setEnabledRotations({ x: false, y: true, z: false });

    // Set collision groups - pets don't collide with players or other pets
    // Only collide with blocks
    for (const collider of this.colliders) {
      collider.setCollisionGroups({
        belongsTo: [CollisionGroup.GROUP_1],
        collidesWith: [CollisionGroup.BLOCK],
      });
    }

    this.lastPosition = { ...this.position } as Vec3;

    // Create floating name/rarity label above the pet
    const petDef = getPetDefinition(this.petId);
    this._labelSceneUI = new SceneUI({
      templateId: 'pet-label',
      attachedToEntity: this,
      offset: { x: 0, y: 0.8, z: 0 },
      viewDistance: 25,
      state: {
        name: petDef?.name ?? this.petId,
        rarity: petDef?.rarity ?? 'common',
      },
    });
    this._labelSceneUI.load(world);
  }

  /**
   * Tick handler - called every frame
   */
  private onTick({ tickDeltaMs }: { entity: Entity; tickDeltaMs: number }): void {
    // Update following
    this.updateFollow();

    // Check for step-up needed when moving
    if (this._isCurrentlyMoving) {
      this.checkStepUp();
    }

    // Apply bounce animation when moving
    this.updateBounce(tickDeltaMs);

    // Stuck detection
    this.stuckCheckAccumulator += tickDeltaMs;
    if (this.stuckCheckAccumulator >= PET_STUCK_CHECK_INTERVAL_MS) {
      this.checkStuck();
      this.stuckCheckAccumulator = 0;
    }

    // Visibility / line-of-sight check
    this.visibilityCheckAccumulator += tickDeltaMs;
    if (this.visibilityCheckAccumulator >= PET_VISIBILITY_CHECK_INTERVAL_MS) {
      this.checkVisibilityToOwner();
      this.visibilityCheckAccumulator = 0;
    }
  }

  /**
   * Follow logic - move toward formation position behind owner
   * Uses hysteresis to prevent jitter at the threshold boundary
   */
  private updateFollow(): void {
    const owner = this.getOwnerEntity();
    if (!owner) return;

    const targetPos = this.getFormationPosition(owner.position, owner.rotation);

    const distHoriz = distanceHorizontal(this.position as Vec3, targetPos);
    const distVert = Math.abs(this.position.y - targetPos.y);

    // Check if the player is moving (based on their velocity)
    const ownerVel = owner.linearVelocity;
    const ownerSpeed = Math.sqrt(ownerVel.x * ownerVel.x + ownerVel.z * ownerVel.z);
    const isOwnerMoving = ownerSpeed > 0.3; // Lower threshold for more responsive stopping

    // Teleport if too far horizontally OR if Y-axis gap is significant
    const yAxisStuckThreshold = 5;
    const isStuckVertically = distVert > yAxisStuckThreshold && distHoriz < PET_TELEPORT_DISTANCE;

    if (
      distHoriz > PET_EXTREME_DISTANCE_THRESHOLD ||
      distHoriz > PET_TELEPORT_DISTANCE ||
      isStuckVertically
    ) {
      this.teleportTo(targetPos);
      return;
    }

    // PRIORITY: If owner has stopped, pet should stop immediately (within reasonable distance)
    if (!isOwnerMoving && distHoriz < PET_TELEPORT_DISTANCE * 0.5) {
      if (this._isCurrentlyMoving) {
        this.simpleController.stopMove();
        this._isCurrentlyMoving = false;
      }
      // Don't face owner constantly when stopped - it causes jitter
      return;
    }

    // Hysteresis for when owner IS moving
    if (this._isCurrentlyMoving) {
      // Only stop when very close to target position
      if (distHoriz < PET_FOLLOW_DISTANCE_STOP) {
        this.simpleController.stopMove();
        this._isCurrentlyMoving = false;
        return;
      }
    } else {
      // Currently stopped - only start moving when further away
      if (distHoriz < PET_FOLLOW_DISTANCE_START) {
        return;
      }
    }

    // Calculate direction to target
    const dx = targetPos.x - this.position.x;
    const dz = targetPos.z - this.position.z;
    const len = Math.sqrt(dx * dx + dz * dz);

    if (len > 0.01) {
      this.moveDirection = { x: dx / len, y: 0, z: dz / len };
    }

    // Face the PLAYER (not target position) while moving, and move toward formation position
    this.simpleController.face(owner.position, 4);
    this.simpleController.move(targetPos, PET_BASE_SPEED, {
      moveIgnoreAxes: { y: true }, // Let physics handle Y
    });

    this._isCurrentlyMoving = true;
  }

  /**
   * Check if we need to step up an obstacle
   */
  private checkStepUp(): void {
    if (!this._worldRef || !this.isSpawned) return;

    // Use stored movement direction
    const dirLen = Math.sqrt(
      this.moveDirection.x * this.moveDirection.x +
      this.moveDirection.z * this.moveDirection.z
    );
    if (dirLen < 0.1) return;

    const dir = {
      x: this.moveDirection.x / dirLen,
      z: this.moveDirection.z / dirLen,
    };

    // Don't step if already going up significantly
    const vel = this.linearVelocity;
    if (vel.y > 3) return;

    const halfHeight = this.height / 2;
    const footY = this.position.y - halfHeight;

    // Probe for obstacles at multiple heights
    const probeHeights = [0.15, 0.3, 0.5, 0.7];
    let obstacleDetected = false;
    let closestDistance = PET_STEP_PROBE_DISTANCE;

    for (const heightOffset of probeHeights) {
      const origin = {
        x: this.position.x,
        y: footY + heightOffset,
        z: this.position.z,
      };

      const hit = this._worldRef.simulation.raycast(
        origin,
        { x: dir.x, y: 0, z: dir.z },
        PET_STEP_PROBE_DISTANCE,
        { filterExcludeRigidBody: this.rawRigidBody }
      );

      if (hit?.hitBlock) {
        obstacleDetected = true;
        if (hit.hitDistance !== undefined) {
          closestDistance = Math.min(closestDistance, hit.hitDistance);
        }
      }
    }

    if (!obstacleDetected) return;

    // Check ground level ahead to see if we need to step UP
    const checkAheadOrigin = {
      x: this.position.x + dir.x * (closestDistance + 0.5),
      y: footY + 1.5,
      z: this.position.z + dir.z * (closestDistance + 0.5),
    };

    const groundHit = this._worldRef.simulation.raycast(
      checkAheadOrigin,
      { x: 0, y: -1, z: 0 },
      2.0,
      { filterExcludeRigidBody: this.rawRigidBody }
    );

    let groundAheadY = footY;
    if (groundHit?.hitBlock && groundHit.hitDistance !== undefined) {
      groundAheadY = checkAheadOrigin.y - groundHit.hitDistance;
    }

    const heightDiff = groundAheadY - footY;

    // Only step if ground ahead is HIGHER
    if (heightDiff < 0.1) return;

    // Don't step if too high
    if (heightDiff > PET_STEP_HEIGHT) return;

    // Check headroom above landing spot
    const headroomHit = this._worldRef.simulation.raycast(
      { x: checkAheadOrigin.x, y: groundAheadY + 0.1, z: checkAheadOrigin.z },
      { x: 0, y: 1, z: 0 },
      this.height,
      { filterExcludeRigidBody: this.rawRigidBody }
    );

    const hasHeadroom =
      !headroomHit ||
      (headroomHit.hitDistance !== undefined && headroomHit.hitDistance >= this.height * 0.7);

    if (hasHeadroom) {
      // Calculate step velocity proportional to height difference
      const velocityMult = Math.min(1.0, heightDiff / 0.8 + 0.5);
      const stepVelocity = PET_STEP_UP_VELOCITY * velocityMult;

      // Apply upward velocity, maintaining some horizontal momentum
      this.setLinearVelocity({
        x: dir.x * PET_BASE_SPEED * 0.5,
        y: stepVelocity,
        z: dir.z * PET_BASE_SPEED * 0.5,
      });
    }
  }

  /**
   * Check if stuck and teleport if needed
   */
  private checkStuck(): void {
    if (!this.lastPosition) {
      this.lastPosition = { ...this.position } as Vec3;
      return;
    }

    const moved = distance3D(this.position as Vec3, this.lastPosition);

    if (moved < PET_STUCK_DISTANCE_THRESHOLD && this._isCurrentlyMoving) {
      this.stuckTimeMs += PET_STUCK_CHECK_INTERVAL_MS;

      if (this.stuckTimeMs >= PET_STUCK_MAX_DURATION_MS) {
        const owner = this.getOwnerEntity();
        if (owner) {
          this.teleportTo(this.getFormationPosition(owner.position, owner.rotation));
        }
        this.stuckTimeMs = 0;
      }
    } else {
      this.stuckTimeMs = 0;
    }

    this.lastPosition = { ...this.position } as Vec3;
  }

  /**
   * Check visibility / line of sight to owner
   * If pet cannot see owner (blocked by terrain), teleport after multiple failures
   */
  private checkVisibilityToOwner(): void {
    if (!this._worldRef || !this.isSpawned) return;

    const owner = this.getOwnerEntity();
    if (!owner) return;

    // Only check if we're a minimum distance away
    const dist = distance3D(this.position as Vec3, owner.position as Vec3);
    if (dist < PET_VISIBILITY_MIN_DISTANCE) {
      this.visibilityFailCount = 0;
      return;
    }

    // Raycast from pet center to owner center
    const petCenter = {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
    };

    const ownerCenter = {
      x: owner.position.x,
      y: owner.position.y,
      z: owner.position.z,
    };

    // Calculate direction to owner
    const dx = ownerCenter.x - petCenter.x;
    const dy = ownerCenter.y - petCenter.y;
    const dz = ownerCenter.z - petCenter.z;
    const dirLen = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dirLen < 0.1) return;

    const direction = {
      x: dx / dirLen,
      y: dy / dirLen,
      z: dz / dirLen,
    };

    // Raycast to check for blocking terrain
    const hit = this._worldRef.simulation.raycast(petCenter, direction, dist, {
      filterExcludeRigidBody: this.rawRigidBody,
    });

    // If we hit something before reaching the owner, visibility is blocked
    if (
      hit?.hitBlock &&
      hit.hitDistance !== undefined &&
      hit.hitDistance < dist - 1
    ) {
      this.visibilityFailCount++;

      if (this.visibilityFailCount >= PET_VISIBILITY_FAIL_MAX_COUNT) {
        // Teleport to owner
        const targetPos = this.getFormationPosition(owner.position, owner.rotation);
        this.teleportTo(targetPos);
        this.visibilityFailCount = 0;
      }
    } else {
      // Clear fail count if we can see the owner
      this.visibilityFailCount = 0;
    }
  }

  /**
   * Check if the pet is currently on the ground
   */
  private checkGrounded(): boolean {
    if (!this._worldRef || !this.isSpawned) return true;

    // Raycast downward from pet center to check for ground
    const rayOrigin = {
      x: this.position.x,
      y: this.position.y - this.height / 2 + 0.05, // Start just above feet
      z: this.position.z,
    };

    const hit = this._worldRef.simulation.raycast(
      rayOrigin,
      { x: 0, y: -1, z: 0 },
      0.15, // Very short distance - must be very close to ground
      { filterExcludeRigidBody: this.rawRigidBody }
    );

    return hit?.hitBlock !== undefined;
  }

  /**
   * Update bounce animation
   * Applies upward impulse when grounded and moving, with cooldown
   * Pets stay upright (no rotation sway)
   */
  private updateBounce(tickDeltaMs: number): void {
    // Update grounded state
    this._isGrounded = this.checkGrounded();

    // Track time since last bounce
    this._timeSinceLastBounce += tickDeltaMs;

    // Apply subtle anti-gravity only when in the air (makes descent floatier)
    if (!this._isGrounded) {
      const antiGravityForce = this.mass * 9.81 * (1 - PET_GRAVITY_SCALE) * (tickDeltaMs / 1000);
      this.applyImpulse({ x: 0, y: antiGravityForce, z: 0 });
    }

    // Only bounce if actively moving
    if (!this._isCurrentlyMoving) {
      return;
    }

    // Bounce when grounded and cooldown has passed
    const cooldownPassed = this._timeSinceLastBounce >= PET_BOUNCE_COOLDOWN_MS;

    if (this._isGrounded && cooldownPassed) {
      // Apply bounce impulse
      const impulseStrength = PET_BOUNCE_AMPLITUDE * this.mass * 20;
      this.applyImpulse({ x: 0, y: impulseStrength, z: 0 });
      this._timeSinceLastBounce = 0;
    }
  }

  /**
   * Teleport to position
   */
  private teleportTo(pos: Vec3): void {
    this.setPosition(pos);
    this.simpleController.stopMove();
    this.stuckTimeMs = 0;
    this._isCurrentlyMoving = false;
    this.lastPosition = { ...pos };
  }

  /**
   * Get formation position behind owner
   *
   * Formation layout (1-8 pets):
   *      PLAYER
   *         |
   *   [2] [0] [1]     <- Row 1 (distance: 3)
   *   [5] [3] [4]     <- Row 2 (distance: 5)
   *       [6] [7]     <- Row 3 (distance: 7)
   */
  private getFormationPosition(
    ownerPosition: Vector3Like,
    ownerRotation: { x: number; y: number; z: number; w: number } | undefined
  ): Vec3 {
    // Extract Y rotation angle from quaternion
    let facingAngle = 0;
    if (
      ownerRotation &&
      typeof ownerRotation.y === 'number' &&
      typeof ownerRotation.w === 'number'
    ) {
      facingAngle = 2 * Math.atan2(ownerRotation.y, ownerRotation.w);
    }

    // Calculate row and position within row
    const row = Math.floor(this.slotIndex / 3);
    const posInRow = this.slotIndex % 3;

    // Calculate how many pets are in this row
    const rowPetCount = Math.min(3, this.totalPets - row * 3);

    // Calculate side offset to center the row
    const center = (rowPetCount - 1) / 2;
    const sideOffset = (posInRow - center) * PET_FORMATION_SIDE_OFFSET;

    // Calculate distance behind player for this row
    const behindOffset = PET_FORMATION_BEHIND_DISTANCE + row * PET_FORMATION_ROW_SPACING;

    // Calculate position using owner's facing direction
    // Forward direction is (-sin(angle), -cos(angle)), so backward is (sin(angle), cos(angle))
    return {
      x:
        ownerPosition.x +
        Math.sin(facingAngle) * behindOffset +
        Math.cos(facingAngle) * sideOffset,
      y: ownerPosition.y,
      z:
        ownerPosition.z +
        Math.cos(facingAngle) * behindOffset -
        Math.sin(facingAngle) * sideOffset,
    };
  }

  /**
   * Get owner's player entity from the world
   */
  private getOwnerEntity(): PlayerEntity | null {
    if (!this._worldRef) return null;
    const playerEntities = this._worldRef.entityManager.getAllPlayerEntities();
    return playerEntities.find((pe) => pe.player.id === this.ownerId) || null;
  }

  /**
   * Update slot index and total pets (for formation recalculation)
   */
  public updateFormation(slotIndex: number, totalPets: number): void {
    this.slotIndex = slotIndex;
    this.totalPets = totalPets;
  }

  /**
   * Despawn the pet
   */
  public despawn(): void {
    // Clean up label SceneUI
    if (this._labelSceneUI?.isLoaded) {
      this._labelSceneUI.unload();
    }
    this._labelSceneUI = undefined;

    this._worldRef = null;
    super.despawn();
  }
}
