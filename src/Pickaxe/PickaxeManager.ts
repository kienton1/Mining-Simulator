/**
 * Pickaxe Manager
 * 
 * Manages the visual representation of the player's pickaxe.
 * Handles spawning and attaching the pickaxe model to the player entity.
 * 
 * Reference: Planning/fileStructure.md - Pickaxe/PickaxeManager
 */

import { World, Player, Entity, RigidBodyType, ModelRegistry } from 'hytopia';
import type { PickaxeData } from './PickaxeData';
import { getPickaxeByTier } from './PickaxeDatabase';

/**
 * Pickaxe model mapping
 * Maps pickaxe names to their model folder and GLTF file
 */
interface PickaxeModelInfo {
  modelFolder: string;
  gltfFile: string;
}

/**
 * Maps pickaxe names to their model folders
 * Each model folder contains a GLTF model and a Textures folder with pickaxe-specific textures
 */
const PICKAXE_MODEL_MAP: Record<string, PickaxeModelInfo> = {
  // PickaxeModelWooden
  'Wooden': { modelFolder: 'PickaxeModelWooden', gltfFile: 'wooden-pickaxe.gltf' },
  'Aurora Spire': { modelFolder: 'PickaxeModelWooden', gltfFile: 'wooden-pickaxe.gltf' },
  'Crescent Hammer': { modelFolder: 'PickaxeModelWooden', gltfFile: 'wooden-pickaxe.gltf' },
  'Glacial Shard': { modelFolder: 'PickaxeModelWooden', gltfFile: 'wooden-pickaxe.gltf' },
  'Neon Crystal': { modelFolder: 'PickaxeModelWooden', gltfFile: 'wooden-pickaxe.gltf' },
  'Prybar': { modelFolder: 'PickaxeModelWooden', gltfFile: 'wooden-pickaxe.gltf' },
  
  // PickaxeModelStone
  'Stone': { modelFolder: 'PickaxeModelStone', gltfFile: 'stone-pickaxe.gltf' },
  'Crimson Blade': { modelFolder: 'PickaxeModelStone', gltfFile: 'stone-pickaxe.gltf' },
  'Frostcore': { modelFolder: 'PickaxeModelStone', gltfFile: 'stone-pickaxe.gltf' },
  'Shatterblade': { modelFolder: 'PickaxeModelStone', gltfFile: 'stone-pickaxe.gltf' },
  'Star Scepter': { modelFolder: 'PickaxeModelStone', gltfFile: 'stone-pickaxe.gltf' },
  'Stormfury Pickaxe': { modelFolder: 'PickaxeModelStone', gltfFile: 'stone-pickaxe.gltf' },
  'Toxic Reaper': { modelFolder: 'PickaxeModelStone', gltfFile: 'stone-pickaxe.gltf' },
  
  // PickaxeModelIron
  'Iron': { modelFolder: 'PickaxeModelIron', gltfFile: 'iron-pickaxe.gltf' },
  'Ancient Scythe': { modelFolder: 'PickaxeModelIron', gltfFile: 'iron-pickaxe.gltf' },
  'Frozen Edge': { modelFolder: 'PickaxeModelIron', gltfFile: 'iron-pickaxe.gltf' },
  'Skybreaker Pickaxe': { modelFolder: 'PickaxeModelIron', gltfFile: 'iron-pickaxe.gltf' },
  'Toxic Pixel': { modelFolder: 'PickaxeModelIron', gltfFile: 'iron-pickaxe.gltf' },
  'Violet Wing': { modelFolder: 'PickaxeModelIron', gltfFile: 'iron-pickaxe.gltf' },
  'Voidrend': { modelFolder: 'PickaxeModelIron', gltfFile: 'iron-pickaxe.gltf' },
  
  // PickaxeModelGolden
  'Golden': { modelFolder: 'PickaxeModelGolden', gltfFile: 'golden-pickaxe.gltf' },
  'Crystal Breaker': { modelFolder: 'PickaxeModelGolden', gltfFile: 'golden-pickaxe.gltf' },
  'Emberhorn Cleaver': { modelFolder: 'PickaxeModelGolden', gltfFile: 'golden-pickaxe.gltf' },
  'Neon Purple Pickaxe': { modelFolder: 'PickaxeModelGolden', gltfFile: 'golden-pickaxe.gltf' },
  'Plunger': { modelFolder: 'PickaxeModelGolden', gltfFile: 'golden-pickaxe.gltf' },
  'Skullgrinder Prime': { modelFolder: 'PickaxeModelGolden', gltfFile: 'golden-pickaxe.gltf' },
  'Toxinspike': { modelFolder: 'PickaxeModelGolden', gltfFile: 'golden-pickaxe.gltf' },
  
  // PickaxeModelDiamond
  'Diamond': { modelFolder: 'PickaxeModelDiamond', gltfFile: 'diamond-pickaxe.gltf' },
  'Bonegrinder': { modelFolder: 'PickaxeModelDiamond', gltfFile: 'diamond-pickaxe.gltf' },
  'Crystal Cleaver': { modelFolder: 'PickaxeModelDiamond', gltfFile: 'diamond-pickaxe.gltf' },
  'Double Axe': { modelFolder: 'PickaxeModelDiamond', gltfFile: 'diamond-pickaxe.gltf' },
  'Fire Axe': { modelFolder: 'PickaxeModelDiamond', gltfFile: 'diamond-pickaxe.gltf' },
  'Gemstone Destroyer': { modelFolder: 'PickaxeModelDiamond', gltfFile: 'diamond-pickaxe.gltf' },
  'Lumina Pickaxe': { modelFolder: 'PickaxeModelDiamond', gltfFile: 'diamond-pickaxe.gltf' },
  'Quill': { modelFolder: 'PickaxeModelDiamond', gltfFile: 'diamond-pickaxe.gltf' },
  
  // PickaxeModelEmerald
  'Blossom': { modelFolder: 'PickaxeModelEmerald', gltfFile: 'emerald-pickaxe.gltf' },
  'Demolisher': { modelFolder: 'PickaxeModelEmerald', gltfFile: 'emerald-pickaxe.gltf' },
  'Frost Cube': { modelFolder: 'PickaxeModelEmerald', gltfFile: 'emerald-pickaxe.gltf' },
  'Frostbite Shard': { modelFolder: 'PickaxeModelEmerald', gltfFile: 'emerald-pickaxe.gltf' },
  'Skyforge': { modelFolder: 'PickaxeModelEmerald', gltfFile: 'emerald-pickaxe.gltf' },
  'Thornspike': { modelFolder: 'PickaxeModelEmerald', gltfFile: 'emerald-pickaxe.gltf' },
  
  // PickaxeModelRuby
  'Sunstone': { modelFolder: 'PickaxeModelRuby', gltfFile: 'ruby-pickaxe.gltf' },
  'Abyssal Twin Edge': { modelFolder: 'PickaxeModelRuby', gltfFile: 'ruby-pickaxe.gltf' },
  'Pixel Blade': { modelFolder: 'PickaxeModelRuby', gltfFile: 'ruby-pickaxe.gltf' },
  'Radiant Reaper': { modelFolder: 'PickaxeModelRuby', gltfFile: 'ruby-pickaxe.gltf' },
  'Thunderstrike': { modelFolder: 'PickaxeModelRuby', gltfFile: 'ruby-pickaxe.gltf' },
  'Timber Crusher': { modelFolder: 'PickaxeModelRuby', gltfFile: 'ruby-pickaxe.gltf' },
  'Twin Flame Scythe': { modelFolder: 'PickaxeModelRuby', gltfFile: 'ruby-pickaxe.gltf' },
  
  // PickaxeModelSapphire
  'Venomstrike': { modelFolder: 'PickaxeModelSapphire', gltfFile: 'sapphire-pickaxe.gltf' },
  'Inferno Cleaver': { modelFolder: 'PickaxeModelSapphire', gltfFile: 'sapphire-pickaxe.gltf' },
  'Inferno Scythe': { modelFolder: 'PickaxeModelSapphire', gltfFile: 'sapphire-pickaxe.gltf' },
  'Jester\u2019s Mallet': { modelFolder: 'PickaxeModelSapphire', gltfFile: 'sapphire-pickaxe.gltf' },
  'Mailbox Pickaxe': { modelFolder: 'PickaxeModelSapphire', gltfFile: 'sapphire-pickaxe.gltf' },
  'Voidrend Prime': { modelFolder: 'PickaxeModelSapphire', gltfFile: 'sapphire-pickaxe.gltf' },
};

/**
 * Gets the model URI for a pickaxe
 * 
 * @param pickaxeName - Name of the pickaxe
 * @returns Model URI path or null if not found
 */
function getPickaxeModelUri(pickaxeName: string): string | null {
  const modelInfo = PICKAXE_MODEL_MAP[pickaxeName];
  if (!modelInfo) {
    console.warn(`[PickaxeManager] No model mapping found for pickaxe: ${pickaxeName}`);
    return null;
  }
  
  return `models/Pickaxes/${modelInfo.modelFolder}/${modelInfo.gltfFile}`;
}

/**
 * Gets the texture URI for a pickaxe
 * The texture is located in the Textures folder within the model folder
 * 
 * @param pickaxeName - Name of the pickaxe
 * @returns Texture URI path or null if not found
 */
export function getPickaxeTextureUri(pickaxeName: string): string | null {
  const modelInfo = PICKAXE_MODEL_MAP[pickaxeName];
  if (!modelInfo) {
    return null;
  }
  
  // Texture path: models/Pickaxes/{ModelFolder}/Textures/{PickaxeName}.png
  return `models/Pickaxes/${modelInfo.modelFolder}/Textures/${pickaxeName}.png`;
}

/**
 * Scale mapping for each pickaxe
 * Each pickaxe has a unique scale between 1.5 and 2.0 to add visual variety
 */
const PICKAXE_SCALE_MAP: Record<string, number> = {
  // Common Pickaxes (Tier 0-7)
  'Wooden': 1.5,
  'Stone': 1.55,
  'Iron': 1.6,
  'Golden': 1.65,
  'Diamond': 1.7,
  'Blossom': 1.75,
  'Sunstone': 1.8,
  'Venomstrike': 1.85,
  
  // Rare Pickaxes (Tier 8-15)
  'Aurora Spire': 1.6,
  'Frostcore': 1.65,
  'Violet Wing': 1.7,
  'Crystal Breaker': 1.75,
  'Quill': 1.8,
  'Demolisher': 1.85,
  'Timber Crusher': 1.9,
  'Jester\u2019s Mallet': 1.95,
  
  // Epic Pickaxes (Tier 16-23)
  'Glacial Shard': 1.6,
  'Shatterblade': 1.65,
  'Voidrend': 1.7,
  'Toxinspike': 1.75,
  'Bonegrinder': 1.8,
  'Frostbite Shard': 1.85,
  'Pixel Blade': 1.9,
  'Inferno Scythe': 1.95,
  
  // Legendary Pickaxes (Tier 24-31)
  'Prybar': 1.55,
  'Crimson Blade': 1.6,
  'Frozen Edge': 1.65,
  'Skullgrinder Prime': 1.7,
  'Gemstone Destroyer': 1.75,
  'Thornspike': 1.8,
  'Frost Cube': 1.85,
  'Twin Flame Scythe': 1.9,
  
  // Mythic Pickaxes (Tier 32-39)
  'Voidrend Prime': 1.6,
  'Toxic Reaper': 1.65,
  'Toxic Pixel': 1.7,
  'Emberhorn Cleaver': 1.75,
  'Crystal Cleaver': 1.8,
  'Radiant Reaper': 1.85,
  'Mailbox Pickaxe': 1.9,
  'Crescent Hammer': 1.95,
  
  // Exotic Pickaxes (Tier 40-47)
  'Stormfury Pickaxe': 1.6,
  'Skybreaker Pickaxe': 1.65,
  'Neon Purple Pickaxe': 1.7,
  'Lumina Pickaxe': 1.75,
  'Abyssal Twin Edge': 1.8,
  'Inferno Cleaver': 1.85,
  'Neon Crystal': 1.9,
  'Star Scepter': 1.95,
  
  // Secret Pickaxes (Tier 48-53)
  'Ancient Scythe': 1.7,
  'Plunger': 1.75,
  'Fire Axe': 1.8,
  'Double Axe': 1.85,
  'Skyforge': 1.9,
  'Thunderstrike': 2.0,
};

/**
 * Gets the scale for a pickaxe
 * 
 * @param pickaxeName - Name of the pickaxe
 * @returns Scale value between 1.5 and 2.0, defaults to 1.75 if not found
 */
function getPickaxeScale(pickaxeName: string): number {
  return PICKAXE_SCALE_MAP[pickaxeName] ?? 1.75;
}

/**
 * Pickaxe Manager class
 * Manages pickaxe entities attached to players
 */
export class PickaxeManager {
  private world: World;
  private playerPickaxeEntities: Map<Player, Entity> = new Map();
  private pickaxeAttachedCallbacks: Map<Player, (() => void)[]> = new Map();

  /**
   * Creates a new PickaxeManager instance
   *
   * @param world - Hytopia world instance
   */
  constructor(world: World) {
    this.world = world;
  }

  /**
   * Register a callback to be called when pickaxe is attached to a player
   *
   * @param player - Player to monitor
   * @param callback - Function to call when pickaxe is attached
   */
  onPickaxeAttached(player: Player, callback: () => void): void {
    if (!this.pickaxeAttachedCallbacks.has(player)) {
      this.pickaxeAttachedCallbacks.set(player, []);
    }
    this.pickaxeAttachedCallbacks.get(player)!.push(callback);
  }

  /**
   * Call all registered callbacks for a player when pickaxe is attached
   *
   * @param player - Player whose pickaxe was attached
   */
  private notifyPickaxeAttached(player: Player): void {
    const callbacks = this.pickaxeAttachedCallbacks.get(player);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }

  /**
   * Spawns and attaches a pickaxe to a player
   * 
   * @param player - Player to attach pickaxe to
   * @param pickaxeTier - Tier of pickaxe to spawn
   */
  attachPickaxeToPlayer(player: Player, pickaxeTier: number): void {
    // Remove existing pickaxe if any
    this.removePickaxeFromPlayer(player);

    const pickaxe = getPickaxeByTier(pickaxeTier);
    if (!pickaxe) {
      return;
    }

    // Get player entity
    const playerEntities = this.world.entityManager.getPlayerEntitiesByPlayer(player);
    if (playerEntities.length === 0) {
      return;
    }

    const playerEntity = playerEntities[0];
    const playerPosition = playerEntity.position;

    // List all available anchor points from the player model
    if (playerEntity.modelUri) {
      try {
        const modelRegistry = ModelRegistry.instance;
        const allNodes = modelRegistry.getNodeNames(playerEntity.modelUri);
        const anchorNodes = allNodes.filter(n => 
          n.toLowerCase().includes('anchor') || 
          n.toLowerCase().includes('hand') ||
          n.toLowerCase().includes('weapon') ||
          n.toLowerCase().includes('attach')
        );
      } catch (e) {
        // Silently handle node listing errors
      }
    }

    // Get the model URI, texture URI, and scale for this pickaxe
    const modelUri = getPickaxeModelUri(pickaxe.name);
    const textureUri = getPickaxeTextureUri(pickaxe.name);
    const scale = getPickaxeScale(pickaxe.name);
    
    if (!modelUri) {
      console.warn(`[PickaxeManager] Could not load model for pickaxe: ${pickaxe.name}, using fallback`);
      // Fallback to block if model not found
      const pickaxeEntity = new Entity({
        name: `${pickaxe.name} Pickaxe`,
        blockTextureUri: 'blocks/stone.png',
        blockHalfExtents: { x: 0.15, y: 0.4, z: 0.15 },
        tag: 'pickaxe',
        rigidBodyOptions: {
          type: RigidBodyType.KINEMATIC_VELOCITY,
        },
      });
      pickaxeEntity.spawn(this.world, {
        x: playerPosition.x + 1,
        y: playerPosition.y + 1,
        z: playerPosition.z + 1,
      });
      this.playerPickaxeEntities.set(player, pickaxeEntity);
      return;
    }

    // Create pickaxe entity using the actual GLTF model with texture override and unique scale
    const entityOptions: any = {
      name: `${pickaxe.name} Pickaxe`,
      modelUri: modelUri,
      modelScale: scale, // Unique scale for each pickaxe (1.5 to 2.0)
      tag: 'pickaxe',
      // Use KINEMATIC_VELOCITY so it can follow the player
      rigidBodyOptions: {
        type: RigidBodyType.KINEMATIC_VELOCITY,
      },
    };

    // Apply texture override if available
    if (textureUri) {
      entityOptions.modelTextureUri = textureUri;
    }

    const pickaxeEntity = new Entity(entityOptions);

    // Spawn the pickaxe first at a visible position to test
    const testPosition = {
      x: playerPosition.x + 1,
      y: playerPosition.y + 1,
      z: playerPosition.z + 1,
    };
    pickaxeEntity.spawn(this.world, testPosition);
    
    // Wait a moment to ensure entity is fully spawned, then attach
    setTimeout(() => {
      // Now try to attach to hand - use setParent which won't crash if node doesn't exist
      // Based on console output, the actual anchor name is 'hand-right-anchor' (with dashes)
      const possibleAnchorNames = [
        'hand-right-anchor',  // This is the actual anchor name from the model (with dashes)
        'hand_right_anchor',   // Try underscore version too
        'handRightAnchor',
        'hand_r_anchor',
        'rightHandAnchor',
        'weapon_anchor',
        'weaponAnchor',
      ];
      
      let attached = false;
      for (const anchorName of possibleAnchorNames) {
        try {
          pickaxeEntity.setParent(
            playerEntity,
            anchorName,
            { x: 0, y: 0, z: 0 }, // Position relative to anchor - centered in hand
            { x: 0.7071, y: -0.7071, z: 0.7071, w: -0.7071 }
          );
          attached = true;
          break;
        } catch (error) {
          // Try next anchor name
          continue;
        }
      }
      
      if (!attached) {
        try {
          pickaxeEntity.setParent(
            playerEntity,
            undefined, // No specific node - attaches to root
            { x: 0.3, y: 0.5, z: 0.3 }, // Position relative to player (right hand area)
            { x: 0, y: 0, z: 0, w: 1 }
          );
        } catch (error) {
        }
      }

      // Notify that pickaxe attachment is complete
      this.notifyPickaxeAttached(player);
    }, 100);

    // Store reference for cleanup (do this immediately, attachment happens in setTimeout)
    this.playerPickaxeEntities.set(player, pickaxeEntity);
  }

  /**
   * Removes pickaxe from player
   * 
   * @param player - Player to remove pickaxe from
   */
  removePickaxeFromPlayer(player: Player): void {
    const pickaxeEntity = this.playerPickaxeEntities.get(player);
    if (pickaxeEntity) {
      pickaxeEntity.despawn();
      this.playerPickaxeEntities.delete(player);
    }
  }

  /**
   * Updates player's pickaxe (removes old, attaches new)
   * 
   * @param player - Player to update
   * @param newPickaxeTier - New pickaxe tier
   */
  updatePlayerPickaxe(player: Player, newPickaxeTier: number): void {
    this.attachPickaxeToPlayer(player, newPickaxeTier);
  }

  /**
   * Cleans up pickaxe when player leaves
   * 
   * @param player - Player who left
   */
  cleanupPlayer(player: Player): void {
    this.removePickaxeFromPlayer(player);
  }
}

