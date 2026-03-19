import type { GeoAIConfig } from 'geo-ai-core';
import type { Type } from '@nestjs/common';

export interface GeoAIOptions extends GeoAIConfig {
  isGlobal?: boolean;           // default: false
  injectLinkHeader?: boolean;   // default: false
  cacheMaxAge?: number;         // default: 3600 (seconds)
  registerController?: boolean; // default: true
  registerMiddleware?: boolean; // default: true
  generateTimeout?: number;     // default: 30000 (ms) — timeout for llms.txt generation
}

export interface GeoAIOptionsFactory {
  createGeoAIOptions(): GeoAIOptions | Promise<GeoAIOptions>;
}

export interface GeoAIAsyncOptions {
  imports?: any[];
  useFactory?: (...args: any[]) => GeoAIOptions | Promise<GeoAIOptions>;
  inject?: any[];
  useClass?: Type<GeoAIOptionsFactory>;
  useExisting?: Type<GeoAIOptionsFactory>;
}
