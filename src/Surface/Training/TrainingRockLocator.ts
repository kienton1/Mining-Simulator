import fs from 'node:fs';
import path from 'node:path';
import { TrainingRockTier } from './TrainingRockData';

interface MapBlockType {
  id: number;
  name: string;
}

interface MapFile {
  blockTypes: MapBlockType[];
  blocks: Record<string, number>;
}

export interface TrainingRockPlacement {
  tier: TrainingRockTier;
  position: { x: number; y: number; z: number };
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

const TRAINING_ORDER: TrainingRockTier[] = [
  TrainingRockTier.DIRT,
  TrainingRockTier.COBBLESTONE,
  TrainingRockTier.IRON_DEEPSLATE,
  TrainingRockTier.GOLD_DEEPSLATE,
  TrainingRockTier.DIAMOND_DEEPSLATE,
  TrainingRockTier.EMERALD_DEEPSLATE,
];

/**
 * Mapping of block type names to training rock tiers
 * Each block type maps to a specific tier based on position and power gain
 * - cobblestone → DIRT (+1 Power)
 * - deepslate-iron-ore → COBBLESTONE (+3 Power)
 * - deepslate-gold-ore → IRON_DEEPSLATE (+15 Power)
 * - deepslate-diamond-ore → GOLD_DEEPSLATE (+45 Power)
 * - deepslate-emerald-ore → DIAMOND_DEEPSLATE (+80 Power)
 * - deepslate-ruby-ore → EMERALD_DEEPSLATE (+175 Power)
 */
const BLOCK_TYPE_TO_TIER: Record<string, TrainingRockTier> = {
  'cobblestone': TrainingRockTier.DIRT,              // +1 Power
  'deepslate-iron-ore': TrainingRockTier.COBBLESTONE, // +3 Power
  'deepslate-gold-ore': TrainingRockTier.IRON_DEEPSLATE, // +15 Power
  'deepslate-diamond-ore': TrainingRockTier.GOLD_DEEPSLATE, // +45 Power
  'deepslate-emerald-ore': TrainingRockTier.DIAMOND_DEEPSLATE, // +80 Power
  'deepslate-ruby-ore': TrainingRockTier.EMERALD_DEEPSLATE, // +175 Power
};

const SURFACE_Y_MIN = -2;
const SURFACE_Y_MAX = 5;

function parseCoord(key: string) {
  const [x, y, z] = key.split(',').map(Number);
  return { x, y, z };
}

function resolveMapPath(customPath?: string) {
  if (customPath) return customPath;
  return path.resolve(process.cwd(), 'assets', 'map.json');
}

export function detectTrainingRockPlacements(mapPath?: string): TrainingRockPlacement[] {
  try {
    const absolutePath = resolveMapPath(mapPath);
    const file = fs.readFileSync(absolutePath, 'utf8');
    const data = JSON.parse(file) as MapFile;

    const blockTypeLookup = new Map(data.blockTypes.map(bt => [bt.name, bt.id]));
    
    // Get block IDs for all training rock types
    const trainingBlockIds = new Map<TrainingRockTier, number>();
    for (const [blockName, tier] of Object.entries(BLOCK_TYPE_TO_TIER)) {
      const blockId = blockTypeLookup.get(blockName);
      if (blockId !== undefined) {
        trainingBlockIds.set(tier, blockId);
      }
    }

    if (trainingBlockIds.size === 0) {
      return [];
    }

    // Group blocks by tier and position
    const tierColumns = new Map<TrainingRockTier, Map<string, { x: number; y: number; z: number }>>();
    
    for (const [tier, blockId] of trainingBlockIds.entries()) {
      tierColumns.set(tier, new Map());
    }

    for (const [key, value] of Object.entries(data.blocks)) {
      // Find which tier this block belongs to
      let blockTier: TrainingRockTier | null = null;
      for (const [tier, blockId] of trainingBlockIds.entries()) {
        if (value === blockId) {
          blockTier = tier;
          break;
        }
      }
      
      if (!blockTier) continue;
      
      const { x, y, z } = parseCoord(key);
      if (y < SURFACE_Y_MIN || y > SURFACE_Y_MAX) continue;
      
      const columnKey = `${x},${z}`;
      const columns = tierColumns.get(blockTier)!;
      const existing = columns.get(columnKey);
      if (!existing || y > existing.y) {
        columns.set(columnKey, { x, y, z });
      }
    }

    // Find blocks and assign tiers directly based on block type (no position-based assignment)
    // Each block type maps directly to its tier
    const allPlacements: TrainingRockPlacement[] = [];
    
    for (const [blockTier, columns] of tierColumns.entries()) {
      if (!columns || columns.size === 0) continue;

      // Get the top block in each column (highest Y value)
      const topBlocks: Array<{ x: number; y: number; z: number }> = [];
      for (const column of columns.values()) {
        topBlocks.push(column); // Already filtered to top block per column
      }

      if (topBlocks.length === 0) continue;

      // Calculate center position from all blocks of this type
      const sum = topBlocks.reduce(
        (acc, cur) => {
          acc.x += cur.x;
          acc.y += cur.y;
          acc.z += cur.z;
          return acc;
        },
        { x: 0, y: 0, z: 0 }
      );

      const center = {
        x: sum.x / topBlocks.length,
        y: sum.y / topBlocks.length,
        z: sum.z / topBlocks.length,
      };

      // Use exact block position (add 0.5 for center of block)
      const position = {
        x: Math.round(center.x) + 0.5,
        y: center.y + 0.5, // Top of block
        z: Math.round(center.z) + 0.5,
      };

      // Find dirt blocks (id 9) near this training rock
      // The bounds will be calculated from the dirt patch where players stand
      const oreX = Math.round(center.x);
      const oreZ = Math.round(center.z);
      const dirtId = blockTypeLookup.get('dirt');
      const dirtBlocks: Array<{ x: number; z: number }> = [];
      
      if (dirtId !== undefined) {
        for (const [key, value] of Object.entries(data.blocks)) {
          if (value === dirtId) {
            const { x, y, z } = parseCoord(key);
            // Look for dirt at y=0 within 2 blocks X and 3 blocks Z of the training rock
            // This matches the actual dirt patch layout around each ore
            if (y === 0 && Math.abs(x - oreX) <= 2 && Math.abs(z - oreZ) <= 3) {
              dirtBlocks.push({ x, z });
            }
          }
        }
      }

      // Calculate bounds from dirt patch - players must be on dirt to interact
      let bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
      
      if (dirtBlocks.length > 0) {
        // Use dirt patch bounds (where player stands)
        const dirtMinX = Math.min(...dirtBlocks.map(b => b.x));
        const dirtMaxX = Math.max(...dirtBlocks.map(b => b.x));
        const dirtMinZ = Math.min(...dirtBlocks.map(b => b.z));
        const dirtMaxZ = Math.max(...dirtBlocks.map(b => b.z));
        
        bounds = {
          minX: dirtMinX,
          maxX: dirtMaxX + 1, // +1 because block occupies space to x+1
          minZ: dirtMinZ,
          maxZ: dirtMaxZ + 1, // +1 because block occupies space to z+1
        };
      } else {
        // Fallback: use training rock position with default bounds
        // This shouldn't happen if map.json has dirt patches
        bounds = {
          minX: oreX - 2,
          maxX: oreX + 2,
          minZ: oreZ - 3,
          maxZ: oreZ + 3,
        };
      }

      allPlacements.push({ 
        tier: blockTier, // Use tier directly from block type mapping
        position, 
        bounds 
      });
    }


    return allPlacements;
  } catch (error) {
    return [];
  }
}

