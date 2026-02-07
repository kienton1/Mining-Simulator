/**
 * Golden Machine Entity
 *
 * A fixed station that opens the Golden Pets merge UI when a player is nearby.
 */

import { Collider, CollisionGroup, Entity, RigidBodyType, SceneUI, type Player, type World } from 'hytopia';

export class GoldenMachineEntity {
  private world: World;
  private entity?: Entity;
  private sceneUi?: SceneUI;
  private position: { x: number; y: number; z: number };
  private proximityRadius: number;
  private playerProximityMap: Map<Player, boolean> = new Map();
  private trackedPlayers: Set<Player> = new Set();
  private proximityCheckInterval?: NodeJS.Timeout;

  public onProximityChange?: (player: Player, inProximity: boolean, distance: number) => void;

  private modelUri: string;
  private modelScale: number;

  constructor(
    world: World,
    position: { x: number; y: number; z: number },
    modelUri: string,
    options?: { proximityRadius?: number; modelScale?: number }
  ) {
    this.world = world;
    this.position = position;
    this.modelUri = modelUri;
    this.proximityRadius = options?.proximityRadius ?? 3.0;
    // Default scale tuned for BuyStations props
    this.modelScale = options?.modelScale ?? 1.5;
  }

  spawn(): void {
    if (this.entity?.isSpawned) return;

    const colliderOptions = Collider.optionsFromModelUri(this.modelUri);

    this.entity = new Entity({
      name: 'Golden Machine',
      modelUri: this.modelUri,
      modelScale: this.modelScale,
      tag: 'golden-machine',
      rigidBodyOptions: {
        type: RigidBodyType.FIXED,
        colliders: colliderOptions
          ? [
              {
                ...colliderOptions,
                collisionGroups: {
                  belongsTo: [CollisionGroup.GROUP_1],
                  collidesWith: [CollisionGroup.ALL],
                },
              },
            ]
          : undefined,
      },
    });

    this.entity.spawn(this.world, this.position);

    // Floating label
    this.sceneUi = new SceneUI({
      templateId: 'shop:prompt',
      viewDistance: 48,
      attachedToEntity: this.entity,
      offset: { x: 0, y: 2.5, z: 0 },
      state: {
        visible: true,
        title: 'Golden Machine',
        subtitle: 'Merge pets here',
      },
    });
    this.sceneUi.load(this.world);

    this.startProximityChecking();
  }

  despawn(): void {
    this.stopProximityChecking();
    if (this.sceneUi?.isLoaded) {
      try {
        this.sceneUi.unload();
      } catch {
        // ignore
      }
    }
    this.sceneUi = undefined;

    if (this.entity?.isSpawned) {
      this.entity.despawn();
    }
    this.entity = undefined;
  }

  addPlayer(player: Player): void {
    this.trackedPlayers.add(player);
  }

  removePlayer(player: Player): void {
    this.trackedPlayers.delete(player);
    this.playerProximityMap.delete(player);
  }

  private startProximityChecking(): void {
    if (this.proximityCheckInterval) return;
    this.proximityCheckInterval = setInterval(() => this.checkPlayerProximity(), 300);
  }

  private stopProximityChecking(): void {
    if (!this.proximityCheckInterval) return;
    clearInterval(this.proximityCheckInterval);
    this.proximityCheckInterval = undefined;
  }

  private checkPlayerProximity(): void {
    for (const player of this.trackedPlayers) {
      const playerEntities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
      if (playerEntities.length === 0) continue;

      const playerEntity = playerEntities[0];
      const pos = playerEntity.position;
      const dx = pos.x - this.position.x;
      const dy = pos.y - this.position.y;
      const dz = pos.z - this.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const wasIn = this.playerProximityMap.get(player) || false;
      const isIn = distance <= this.proximityRadius;

      if (wasIn === isIn) continue;
      this.playerProximityMap.set(player, isIn);
      this.onProximityChange?.(player, isIn, distance);
    }
  }
}

