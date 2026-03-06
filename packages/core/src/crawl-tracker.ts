import { BotRulesEngine } from './bot-rules';
import { AI_BOTS } from './constants';
import type { CrawlEntry, CrawlActivity, CrawlStore } from './types';

/**
 * CrawlTracker — logs AI bot visits with GDPR-compliant IP anonymization.
 *
 * Uses `crypto.subtle.digest('SHA-256')` (Web Crypto API) for IP hashing,
 * making it compatible with both Node.js >= 18 and Edge Runtime (e.g. Next.js Edge Middleware).
 */
export class CrawlTracker {
  constructor(
    private botRules: BotRulesEngine,
    private store: CrawlStore,
    private secret: string,
  ) {}

  /**
   * Produces an irreversible SHA-256 hash of `ip + secret`.
   * Deterministic: same input always yields the same hex string.
   *
   * Uses Web Crypto API (`crypto.subtle.digest`) for Edge Runtime compatibility.
   */
  async anonymizeIp(ip: string): Promise<string> {
    const data = new TextEncoder().encode(ip + this.secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Logs a bot visit extracted from an incoming Request.
   * Only records the visit when the User-Agent matches a known bot.
   * Errors from `store.log()` are suppressed (fire-and-forget).
   */
  async trackVisit(request: Request, fileType?: string): Promise<void> {
    const userAgent = request.headers.get('user-agent') ?? '';
    const botName = this.botRules.detectBot(userAgent);

    if (!botName) return;

    const ip = CrawlTracker.extractIp(request);
    const ipHash = await this.anonymizeIp(ip);

    try {
      await this.store.log({
        botName,
        fileType: fileType ?? 'standard',
        ipHash,
        userAgent,
        timestamp: new Date(),
      });
    } catch {
      // fire-and-forget: suppress store errors per design doc
    }
  }

  /**
   * Extracts the client IP from request headers.
   * Priority: x-forwarded-for (first IP, trimmed) → cf-connecting-ip → 'unknown'
   */
  static extractIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp) {
      return cfIp;
    }

    return 'unknown';
  }
}

/**
 * In-memory implementation of CrawlStore.
 * Suitable for development, testing, and serverless environments
 * where persistence across restarts is not required.
 */
export class MemoryCrawlStore implements CrawlStore {
  private entries: CrawlEntry[] = [];

  async log(entry: CrawlEntry): Promise<void> {
    this.entries.push(entry);
  }

  async getActivity(options?: { days?: number }): Promise<CrawlActivity[]> {
    const days = options?.days ?? 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const filtered = this.entries.filter((e) => e.timestamp >= since);

    const grouped = new Map<string, { totalVisits: number; lastVisit: Date }>();
    for (const entry of filtered) {
      const existing = grouped.get(entry.botName);
      if (existing) {
        existing.totalVisits++;
        if (entry.timestamp > existing.lastVisit) {
          existing.lastVisit = entry.timestamp;
        }
      } else {
        grouped.set(entry.botName, {
          totalVisits: 1,
          lastVisit: entry.timestamp,
        });
      }
    }

    return Array.from(grouped.entries()).map(([botName, stats]) => ({
      botName,
      displayName: AI_BOTS[botName] ?? botName,
      totalVisits: stats.totalVisits,
      lastVisit: stats.lastVisit,
    }));
  }

  async cleanup(olderThanDays: number): Promise<void> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    this.entries = this.entries.filter((e) => e.timestamp >= cutoff);
  }
}
