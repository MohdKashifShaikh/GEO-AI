// NestJS-specific exports
export { GeoAIModule } from './module';
export { GeoAIService } from './service';
export { GeoAIMiddleware } from './middleware';
export { GeoAIController } from './controller';
export { GeoAIGuard } from './guard';
export { GeoAIInterceptor } from './interceptor';
export { IsAIBot, GeoAIMeta, GEO_AI_META_KEY } from './decorators';
export { GEO_AI_OPTIONS, GEO_AI_ENGINE } from './constants';
export type { GeoAIOptions, GeoAIAsyncOptions, GeoAIOptionsFactory } from './interfaces';

// Re-exports from geo-ai-core
export {
  createGeoAI,
  parseDuration,
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
  ResourceSection,
  GeoAIConfig,
  ProductResource,
  ContentProvider,
  CacheAdapter,
  CrawlEntry,
  CrawlActivity,
  CrawlStore,
  CrawlTrackingConfig,
  CryptoConfig,
  AiProvider,
  AiGeneratorConfig,
  AiError,
  AiBulkConfig,
  AiContext,
} from 'geo-ai-core';

// Re-export AiGenerator from separate entry point
export { AiGenerator } from 'geo-ai-core/ai';
