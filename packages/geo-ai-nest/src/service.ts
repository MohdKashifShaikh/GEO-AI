import { Injectable, Inject } from '@nestjs/common';
import { BotRulesEngine } from 'geo-ai-core';
import type { GeoAIInstance, Resource } from 'geo-ai-core';
import { GEO_AI_ENGINE } from './constants';

@Injectable()
export class GeoAIService {
  private readonly botRules = new BotRulesEngine();

  constructor(@Inject(GEO_AI_ENGINE) private readonly engine: GeoAIInstance) {}

  generateLlms(full = false, locale?: string): Promise<string> {
    return this.engine.generateLlms(full, locale);
  }

  generateRobotsTxt(): string {
    return this.engine.generateRobotsTxt();
  }

  generateMetaTags(): string {
    return this.engine.generateMetaTags();
  }

  generateLinkHeader(): string {
    return this.engine.generateLinkHeader();
  }

  generateJsonLd(resource?: Resource & { type?: string }): object {
    return this.engine.generateJsonLd(resource);
  }

  isAIBot(userAgent: string): string | null {
    return this.botRules.detectBot(userAgent);
  }

  trackCrawl(request: Request): Promise<void> {
    return this.engine.trackVisit(request);
  }

  getEngine(): GeoAIInstance {
    return this.engine;
  }

  invalidateCache(): Promise<void> {
    return this.engine.invalidateCache();
  }
}
