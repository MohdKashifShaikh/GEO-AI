import type {
  ContentProvider,
  Resource,
  ResourceSection,
  GeoAIConfig,
  CacheAdapter,
} from './types';
import { BotRulesEngine } from './bot-rules';
import { LlmsGenerator } from './llms-generator';
import { SeoGenerator } from './seo';
import { CrawlTracker, MemoryCrawlStore } from './crawl-tracker';
import { MemoryCacheAdapter } from './cache';
import { AI_BOTS } from './constants';

// ── GeoAIInstance ───────────────────────────────────────────────────

export interface GeoAIInstance {
  generateLlms(isFull: boolean, locale?: string): Promise<string>;
  generateRobotsTxt(): string;
  generateMetaTags(): string;
  generateLinkHeader(): string;
  generateJsonLd(resource?: Resource & { type?: string }): object;
  trackVisit(request: Request): Promise<void>;
  invalidateCache(): Promise<void>;
}

// ── StaticContentProvider ───────────────────────────────────────────

/**
 * Internal adapter wrapping `Record<string, Resource[]>` into a ContentProvider.
 * All sections get `type: 'page'` by default.
 */
export class StaticContentProvider implements ContentProvider {
  constructor(private sections: Record<string, Resource[]>) {}

  async getSections(_options?: { locale?: string }): Promise<ResourceSection[]> {
    return Object.entries(this.sections).map(([name, resources]) => ({
      name,
      type: 'page',
      resources,
    }));
  }
}

// ── parseDuration ───────────────────────────────────────────────────

/**
 * Parse a human-readable duration string into seconds.
 * Supported formats: `'1h'`, `'24h'`, `'7d'`.
 * @throws {Error} for invalid format
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(h|d)$/);
  if (!match) throw new Error(`Invalid cache duration: ${duration}`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  return unit === 'h' ? value * 3600 : value * 86400;
}

// ── createGeoAI ─────────────────────────────────────────────────────

/**
 * Factory function — single entry point for initializing the GEO AI engine.
 * Normalizes configuration, creates internal module instances, and returns
 * a `GeoAIInstance` with all public methods.
 *
 * @throws {Error} if required fields (siteName, siteUrl, provider) are missing
 */
export function createGeoAI(config: GeoAIConfig): GeoAIInstance {
  if (!config.siteName || !config.siteUrl || !config.provider) {
    throw new Error('GeoAIConfig requires siteName, siteUrl, and provider');
  }

  // ── Normalize provider ─────────────────────────────────────────────
  const isContentProvider = (p: unknown): p is ContentProvider =>
    typeof p === 'object' && p !== null && 'getSections' in p && typeof (p as ContentProvider).getSections === 'function';

  const provider: ContentProvider = isContentProvider(config.provider)
    ? config.provider
    : new StaticContentProvider(config.provider as Record<string, Resource[]>);

  // ── Normalize crawlers → BotRulesEngine ────────────────────────────
  let crawlerRules: Record<string, 'allow' | 'disallow'> = {};
  if (config.crawlers === 'all') {
    for (const bot of Object.keys(AI_BOTS)) {
      crawlerRules[bot] = 'allow';
    }
  } else if (config.crawlers) {
    crawlerRules = config.crawlers;
  }
  const botRules = new BotRulesEngine(crawlerRules);

  // ── Normalize cache ────────────────────────────────────────────────
  let cache: CacheAdapter | undefined;
  let cacheTtl = 0;
  if (typeof config.cache === 'string') {
    cacheTtl = parseDuration(config.cache);
    cache = new MemoryCacheAdapter();
  } else if (config.cache) {
    cache = config.cache;
  }

  // ── Normalize crawlTracking ────────────────────────────────────────
  let crawlTracker: CrawlTracker | undefined;
  if (config.crawlTracking === true) {
    crawlTracker = new CrawlTracker(
      botRules,
      new MemoryCrawlStore(),
      crypto.randomUUID(),
    );
  } else if (config.crawlTracking) {
    const store = config.crawlTracking.store ?? new MemoryCrawlStore();
    const secret = config.crawlTracking.secret ?? crypto.randomUUID();
    crawlTracker = new CrawlTracker(botRules, store, secret);
  }

  // ── Create modules ─────────────────────────────────────────────────
  const llmsGenerator = new LlmsGenerator(provider, {
    siteName: config.siteName,
    siteUrl: config.siteUrl,
    siteDescription: config.siteDescription,
    botRules,
  });

  const seoGenerator = new SeoGenerator({
    siteUrl: config.siteUrl,
    siteName: config.siteName,
  });

  // ── Build instance ─────────────────────────────────────────────────
  return {
    async generateLlms(isFull: boolean, locale?: string): Promise<string> {
      const cacheKey = `llms_${isFull ? 'full' : 'standard'}${locale ? `_${locale}` : ''}`;

      if (cache) {
        const cached = await cache.get(cacheKey);
        if (cached) return cached;
      }

      const content = await llmsGenerator.generate(isFull, locale);

      if (cache && cacheTtl > 0) {
        await cache.set(cacheKey, content, cacheTtl);
      }

      return content;
    },

    generateRobotsTxt(): string {
      return botRules.generateRobotsTxt(config.siteUrl);
    },

    generateMetaTags(): string {
      return seoGenerator.generateMetaTags();
    },

    generateLinkHeader(): string {
      return seoGenerator.generateLinkHeader();
    },

    generateJsonLd(resource?: Resource & { type?: string }): object {
      return seoGenerator.generateJsonLd(resource);
    },

    async trackVisit(request: Request): Promise<void> {
      if (crawlTracker) {
        await crawlTracker.trackVisit(request);
      }
    },

    async invalidateCache(): Promise<void> {
      if (cache) {
        await cache.invalidate();
      }
    },
  };
}
