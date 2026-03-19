// geo-ai-core main entry point

// Factory
export { createGeoAI, parseDuration } from './create-geo-ai';
export type { GeoAIInstance } from './create-geo-ai';

// Types & interfaces
export type {
  Resource,
  ProductResource,
  ResourceSection,
  ContentProvider,
  CacheAdapter,
  CrawlEntry,
  CrawlActivity,
  CrawlStore,
  CrawlTrackingConfig,
  CryptoConfig,
  GeoAIConfig,
  AiProvider,
  AiGeneratorConfig,
  AiError,
  AiBulkConfig,
  AiContext,
} from './types';

// Cache adapters
export { MemoryCacheAdapter, FileCacheAdapter } from './cache';

// Crawl tracking
export { CrawlTracker, MemoryCrawlStore } from './crawl-tracker';

// Crypto
export { CryptoService } from './crypto';

// Bot rules
export { BotRulesEngine } from './bot-rules';
export { AI_BOTS } from './constants';

// SEO
export { SeoGenerator } from './seo';

// LlmsGenerator
export { LlmsGenerator } from './llms-generator';
