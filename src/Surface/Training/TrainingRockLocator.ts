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
  TrainingRockTier.STONE,
  TrainingRockTier.IRON,
  TrainingRockTier.GOLD,
  TrainingRockTier.DIAMOND,
  TrainingRockTier.CRYSTAL,
];

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
    const coalId = blockTypeLookup.get('coal-block');

    if (coalId === undefined) {
      console.warn('[TrainingRockLocator] Could not find block type "coal-block" in map data.');
      return [];
    }

    const coalColumns = new Map<string, { x: number; y: number; z: number }>();

    for (const [key, value] of Object.entries(data.blocks)) {
      if (value !== coalId) continue;
      const { x, y, z } = parseCoord(key);
      if (y < SURFACE_Y_MIN || y > SURFACE_Y_MAX) continue;
      const columnKey = `${x},${z}`;
      const existing = coalColumns.get(columnKey);
      if (!existing || y > existing.y) {
        coalColumns.set(columnKey, { x, y, z });
      }
    }

    if (coalColumns.size === 0) {
      console.warn('[TrainingRockLocator] No surface coal clusters detected.');
      return [];
    }

    const clusters: Array<{ columns: { x: number; y: number; z: number }[]; center: { x: number; y: number; z: number } }> = [];
    const visited = new Set<string>();
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (const column of coalColumns.values()) {
      const startKey = `${column.x},${column.z}`;
      if (visited.has(startKey)) continue;

      const queue = [column];
      visited.add(startKey);
      const nodes: typeof queue = [];

      while (queue.length) {
        const current = queue.shift()!;
        nodes.push(current);

        for (const [dx, dz] of dirs) {
          const nx = current.x + dx;
          const nz = current.z + dz;
          const neighborKey = `${nx},${nz}`;
          if (visited.has(neighborKey)) continue;
          const neighbor = coalColumns.get(neighborKey);
          if (!neighbor) continue;
          visited.add(neighborKey);
          queue.push(neighbor);
        }
      }

      const sum = nodes.reduce(
        (acc, cur) => {
          acc.x += cur.x;
          acc.y += cur.y;
          acc.z += cur.z;
          return acc;
        },
        { x: 0, y: 0, z: 0 }
      );

      clusters.push({
        columns: nodes,
        center: {
          x: sum.x / nodes.length,
          y: sum.y / nodes.length,
          z: sum.z / nodes.length,
        },
      });
    }

    clusters.sort((a, b) => a.center.x - b.center.x);

    const placements: TrainingRockPlacement[] = [];
    for (let i = 0; i < clusters.length && i < TRAINING_ORDER.length; i++) {
      const cluster = clusters[i];
      const tier = TRAINING_ORDER[i];

      const averageY = cluster.columns.reduce((max, cur) => Math.max(max, cur.y), 0);
      const position = {
        x: Math.round(cluster.center.x) + 0.5,
        y: Math.round(averageY),
        z: Math.round(cluster.center.z) + 0.5,
      };

      const boundsPadding = 0.25;
      const bounds = {
        minX: Math.min(...cluster.columns.map(c => c.x)) - boundsPadding,
        maxX: Math.max(...cluster.columns.map(c => c.x)) + 1 + boundsPadding,
        minZ: Math.min(...cluster.columns.map(c => c.z)) - boundsPadding,
        maxZ: Math.max(...cluster.columns.map(c => c.z)) + 1 + boundsPadding,
      };

      placements.push({ tier, position, bounds });
    }

    return placements;
  } catch (error) {
    console.warn('[TrainingRockLocator] Failed to detect training rocks:', error);
    return [];
  }
}

