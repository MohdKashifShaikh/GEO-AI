// geo-ai-next main entry point

// Next.js middleware
export { geoAIMiddleware } from './middleware';
export type { GeoAIMiddlewareConfig } from './middleware';

// Next.js route handler
export { createLlmsHandler } from './handler';
export type { LlmsHandlerConfig } from './handler';

// Re-export all public types, interfaces, and classes from geo-ai-core
export {
  createGeoAI,
  MemoryCacheAdapter,
  FileCacheAdapter,
  CrawlTracker,
  MemoryCrawlStore,
  CryptoService,
  BotRulesEngine,
  AI_BOTS,
  SeoGenerator,
  LlmsGenerator,
} from 'geo-ai-core';

export type {
  GeoAIInstance,
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
} from 'geo-ai-core';
