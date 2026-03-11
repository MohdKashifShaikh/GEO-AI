import { readFile, writeFile, readdir, unlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { CacheAdapter } from './types';

// ── MemoryCacheAdapter ──────────────────────────────────────────────

/**
 * In-memory cache with TTL.
 *
 * Expired entries are lazily removed on read and proactively purged
 * when the store exceeds `maxEntries` (default 1 000).
 */
export class MemoryCacheAdapter implements CacheAdapter {
  private store = new Map<string, { value: string; expiresAt: number }>();
  private readonly maxEntries: number;

  constructor(maxEntries = 1_000) {
    this.maxEntries = maxEntries;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    if (this.store.size > this.maxEntries) {
      this.evictExpired();
      // FIFO eviction: if still over cap after removing expired entries,
      // delete oldest-inserted entries until within bounds
      for (const k of this.store.keys()) {
        if (this.store.size <= this.maxEntries) break;
        this.store.delete(k);
      }
    }
  }

  async invalidate(key?: string): Promise<void> {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }

  /** Remove all entries whose TTL has elapsed. */
  private evictExpired(): void {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (now >= v.expiresAt) {
        this.store.delete(k);
      }
    }
  }
}

// ── FileCacheAdapter ────────────────────────────────────────────────

/** Sanitize cache key to a safe filename */
function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, '_');
}

interface CacheFileContent {
  value: string;
  expiresAt: number; // Unix timestamp ms
}

/**
 * File-system cache storing entries as JSON files in `{cacheDir}/{key}.json`.
 * Each file contains the cached value and TTL metadata.
 * Corrupted JSON is treated as a cache miss (returns null).
 */
export class FileCacheAdapter implements CacheAdapter {
  constructor(private cacheDir: string) {}

  async get(key: string): Promise<string | null> {
    const filePath = this.filePath(key);
    try {
      const raw = await readFile(filePath, 'utf-8');
      const data: CacheFileContent = JSON.parse(raw);

      if (Date.now() >= data.expiresAt) {
        await unlink(filePath).catch(() => {});
        return null;
      }

      return data.value;
    } catch {
      // File doesn't exist or corrupted JSON → cache miss
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await mkdir(this.cacheDir, { recursive: true });

    const data: CacheFileContent = {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };

    await writeFile(this.filePath(key), JSON.stringify(data), 'utf-8');
  }

  async invalidate(key?: string): Promise<void> {
    if (key) {
      await unlink(this.filePath(key)).catch(() => {});
    } else {
      try {
        const files = await readdir(this.cacheDir);
        await Promise.all(
          files
            .filter((f) => f.endsWith('.json'))
            .map((f) => unlink(join(this.cacheDir, f)).catch(() => {})),
        );
      } catch {
        // Directory doesn't exist — nothing to clear
      }
    }
  }

  private filePath(key: string): string {
    return join(this.cacheDir, `${sanitizeKey(key)}.json`);
  }
}
