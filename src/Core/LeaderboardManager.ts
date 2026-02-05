/**
 * Leaderboard Manager
 *
 * Manages a globally-persisted, cached leaderboard with dirty-tracking.
 * Scores are batched and flushed every 30 seconds via read-merge-write
 * for multi-server safety.
 */

import { Player, PersistenceManager } from 'hytopia';
import type { PlayerData } from './PlayerData';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LeaderboardCategoryId =
  | 'power'
  | 'blocksMined'
  | 'rebirths'
  | 'timePlayed'
  | 'maxCoins'
  | 'eggsHatched';

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  value: string;       // BigInt-safe string
  updatedAt: number;
}

export interface LeaderboardData {
  version: number;
  categories: Record<LeaderboardCategoryId, LeaderboardEntry[]>;
  lastPersistedAt: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GLOBAL_KEY = 'leaderboard';
const FLUSH_INTERVAL_MS = 30_000;
const LEADERBOARD_LIMIT = 10;

const ALL_CATEGORIES: LeaderboardCategoryId[] = [
  'power',
  'blocksMined',
  'rebirths',
  'timePlayed',
  'maxCoins',
  'eggsHatched',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toBigIntSafe(value: number | string | undefined | null): bigint {
  if (typeof value === 'string') {
    try { return BigInt(value); } catch { return 0n; }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.floor(value));
  }
  return 0n;
}

function emptyCategories(): Record<LeaderboardCategoryId, LeaderboardEntry[]> {
  const cats = {} as Record<LeaderboardCategoryId, LeaderboardEntry[]>;
  for (const id of ALL_CATEGORIES) cats[id] = [];
  return cats;
}

function emptyLeaderboardData(): LeaderboardData {
  return { version: 0, categories: emptyCategories(), lastPersistedAt: 0 };
}

// ---------------------------------------------------------------------------
// LeaderboardManager
// ---------------------------------------------------------------------------

export class LeaderboardManager {
  private cached: LeaderboardData = emptyLeaderboardData();

  /**
   * dirtyEntries stores the latest score per player per category that has
   * not yet been flushed into the cached snapshot.
   * Key: `${playerId}:${categoryId}`
   */
  private dirtyEntries: Map<string, LeaderboardEntry & { category: LeaderboardCategoryId }> = new Map();

  private flushTimer?: NodeJS.Timeout;
  private isFlushing = false;

  // ------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------

  async initialize(): Promise<void> {
    try {
      const raw = await (PersistenceManager.instance as any).getGlobalData(GLOBAL_KEY) as Record<string, unknown> | undefined;
      if (raw && typeof raw === 'object' && raw.categories) {
        this.cached = this.parseRemote(raw);
        console.log(`[LeaderboardManager] Loaded persisted leaderboard (version ${this.cached.version})`);
      } else {
        console.log('[LeaderboardManager] No persisted leaderboard found, starting fresh');
      }
    } catch (err) {
      console.error('[LeaderboardManager] Failed to load global leaderboard:', err);
    }
    this.flushTimer = setInterval(() => this.flushAndReload(), FLUSH_INTERVAL_MS);
  }

  getLeaderboardSnapshot(): LeaderboardData {
    return this.cached;
  }

  // ------------------------------------------------------------------
  // Score extraction
  // ------------------------------------------------------------------

  updatePlayerScores(player: Player, data: PlayerData): void {
    const id = String(player.id);
    const name = player.username;
    const now = Date.now();

    // For power, use the best-ever power (high-score) so rebirth doesn't drop the ranking
    const bestPower = toBigIntSafe(data.leaderboardHighScores?.bestPower);
    const currentPower = toBigIntSafe(data.power);
    const powerValue = bestPower > currentPower ? bestPower : currentPower;

    // For coins, use the best-ever coins (high-score) so spending doesn't drop the ranking
    const bestCoins = toBigIntSafe(data.leaderboardHighScores?.bestCoins);
    const currentCoins = toBigIntSafe(data.gold ?? 0);
    const maxGoldEver = toBigIntSafe(data.maxGoldEverHeld ?? 0);
    const coinsHigh = bestCoins > currentCoins ? bestCoins : currentCoins;
    const coinsValue = coinsHigh > maxGoldEver ? coinsHigh : maxGoldEver;

    const scores: [LeaderboardCategoryId, bigint][] = [
      ['power', powerValue],
      ['blocksMined', toBigIntSafe(data.achievementProgress?.blocksMined ?? 0)],
      ['rebirths', toBigIntSafe(data.rebirths ?? 0)],
      ['timePlayed', toBigIntSafe(data.achievementProgress?.timePlayedMs ?? 0)],
      ['maxCoins', coinsValue],
      ['eggsHatched', toBigIntSafe(data.achievementProgress?.eggsHatched ?? 0)],
    ];

    for (const [cat, val] of scores) {
      this.markDirty(id, name, cat, val.toString(), now);
    }
  }

  // ------------------------------------------------------------------
  // Dirty tracking
  // ------------------------------------------------------------------

  private markDirty(
    playerId: string,
    name: string,
    category: LeaderboardCategoryId,
    value: string,
    updatedAt: number,
  ): void {
    const cachedList = this.cached.categories[category];
    const valueBig = toBigIntSafe(value);

    // Quick-reject: if the player is NOT already in the top-10 and their
    // score is <= the bottom entry, there's nothing to update.
    if (cachedList.length >= LEADERBOARD_LIMIT) {
      const bottomValue = toBigIntSafe(cachedList[cachedList.length - 1].value);
      const alreadyInTop = cachedList.some(e => e.playerId === playerId);
      if (!alreadyInTop && valueBig <= bottomValue) return;
    }

    const key = `${playerId}:${category}`;
    this.dirtyEntries.set(key, { playerId, name, value, updatedAt, category });
  }

  // ------------------------------------------------------------------
  // Flush (read-merge-write)
  // ------------------------------------------------------------------

  async flushAndReload(): Promise<void> {
    if (this.isFlushing) return;
    if (this.dirtyEntries.size === 0) return;
    this.isFlushing = true;

    try {
      // 1. Snapshot and clear dirty entries
      const snapshot = new Map(this.dirtyEntries);
      this.dirtyEntries.clear();

      // 2. Read fresh remote state
      let remote: LeaderboardData;
      try {
        const raw = await (PersistenceManager.instance as any).getGlobalData(GLOBAL_KEY) as Record<string, unknown> | undefined;
        remote = raw && typeof raw === 'object' && raw.categories
          ? this.parseRemote(raw)
          : emptyLeaderboardData();
      } catch {
        remote = { ...this.cached };
      }

      // 3. Merge per category
      const merged = emptyCategories();
      for (const cat of ALL_CATEGORIES) {
        // Collect remote entries + dirty entries for this category
        const byPlayer = new Map<string, LeaderboardEntry>();

        // Start with remote
        for (const entry of remote.categories[cat]) {
          byPlayer.set(entry.playerId, entry);
        }

        // Also include current local cache (may contain entries remote lost in a race)
        for (const entry of this.cached.categories[cat]) {
          const existing = byPlayer.get(entry.playerId);
          if (!existing || toBigIntSafe(entry.value) > toBigIntSafe(existing.value)) {
            byPlayer.set(entry.playerId, entry);
          }
        }

        // Overlay dirty entries (keep higher value)
        for (const [, dirty] of snapshot) {
          if (dirty.category !== cat) continue;
          const existing = byPlayer.get(dirty.playerId);
          if (!existing || toBigIntSafe(dirty.value) > toBigIntSafe(existing.value)) {
            byPlayer.set(dirty.playerId, {
              playerId: dirty.playerId,
              name: dirty.name,
              value: dirty.value,
              updatedAt: dirty.updatedAt,
            });
          }
        }

        // Sort descending, trim to top 10
        const sorted = Array.from(byPlayer.values()).sort((a, b) => {
          const av = toBigIntSafe(a.value);
          const bv = toBigIntSafe(b.value);
          if (av === bv) return a.name.localeCompare(b.name);
          return av > bv ? -1 : 1;
        });

        merged[cat] = sorted.slice(0, LEADERBOARD_LIMIT);
      }

      // 4. Build merged leaderboard
      const newVersion = remote.version + 1;
      const now = Date.now();
      const mergedData: LeaderboardData = {
        version: newVersion,
        categories: merged,
        lastPersistedAt: now,
      };

      // 5. Persist
      try {
        await (PersistenceManager.instance as any).setGlobalData(GLOBAL_KEY, mergedData as unknown as Record<string, unknown>);
      } catch (err) {
        console.error('[LeaderboardManager] Failed to persist leaderboard:', err);
        // Re-queue dirty entries that we couldn't persist
        for (const [key, entry] of snapshot) {
          if (!this.dirtyEntries.has(key)) {
            this.dirtyEntries.set(key, entry);
          }
        }
      }

      // 6. Update local cache
      this.cached = mergedData;
    } finally {
      this.isFlushing = false;
    }
  }

  async forceFlush(): Promise<void> {
    await this.flushAndReload();
  }

  cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  // ------------------------------------------------------------------
  // Parsing remote data
  // ------------------------------------------------------------------

  private parseRemote(raw: Record<string, unknown>): LeaderboardData {
    const version = typeof raw.version === 'number' ? raw.version : 0;
    const lastPersistedAt = typeof raw.lastPersistedAt === 'number' ? raw.lastPersistedAt : 0;
    const cats = emptyCategories();

    const remoteCats = raw.categories as Record<string, unknown> | undefined;
    if (remoteCats && typeof remoteCats === 'object') {
      for (const cat of ALL_CATEGORIES) {
        const entries = (remoteCats as any)[cat];
        if (!Array.isArray(entries)) continue;
        cats[cat] = entries
          .filter((e: any) => e && typeof e.playerId === 'string' && typeof e.value === 'string')
          .map((e: any) => ({
            playerId: String(e.playerId),
            name: typeof e.name === 'string' ? e.name : 'Unknown',
            value: /^\d+$/.test(e.value) ? e.value : '0',
            updatedAt: typeof e.updatedAt === 'number' ? e.updatedAt : 0,
          }))
          .slice(0, LEADERBOARD_LIMIT);
      }
    }

    return { version, categories: cats, lastPersistedAt };
  }
}
