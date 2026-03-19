import { Injectable, Inject, NestMiddleware } from '@nestjs/common';
import { GeoAIService } from './service';
import { GEO_AI_OPTIONS } from './constants';
import type { GeoAIOptions } from './interfaces';

const LLMS_PATHS = new Set(['/llms.txt', '/llms-full.txt', '/.well-known/llms.txt']);

// Adapter-agnostic response helper — works on both Express and Fastify.
// Express uses .status()/.setHeader()/.end(); Fastify uses .code()/.header()/.send().
function sendPlainText(res: any, status: number, body: string, maxAge: number): void {
  (res.status ?? res.code).call(res, status);
  const setHeader = res.setHeader?.bind(res) ?? res.header?.bind(res);
  setHeader('Content-Type', 'text/plain; charset=utf-8');
  setHeader('Cache-Control', `public, max-age=${maxAge}`);
  (res.end ?? res.send).call(res, body);
}

@Injectable()
export class GeoAIMiddleware implements NestMiddleware {
  constructor(
    @Inject(GeoAIService) private readonly geoAI: GeoAIService,
    @Inject(GEO_AI_OPTIONS) private readonly options: GeoAIOptions,
  ) {}

  async use(req: any, res: any, next: () => void): Promise<void> {
    // Respect opt-out flag — checked here (not in configure()) because
    // forRootAsync resolves options asynchronously after configure() runs.
    if (this.options.registerMiddleware === false) {
      return next();
    }

    const url: string = req.url ?? req.raw?.url ?? '';
    const path = url.split('?')[0];
    // Truncate User-Agent to prevent memory abuse from malicious requests
    const rawUa: string = req.headers?.['user-agent'] ?? req.raw?.headers?.['user-agent'] ?? '';
    const ua = rawUa.slice(0, 1024);
    const maxAge = this.options.cacheMaxAge ?? 3600;
    const timeout = this.options.generateTimeout ?? 30_000;

    // Fire-and-forget bot tracking (non-blocking)
    if (this.geoAI.isAIBot(ua)) {
      this.geoAI.trackCrawl(req as unknown as Request).catch(() => {});
    }

    if (LLMS_PATHS.has(path)) {
      const isFull = path === '/llms-full.txt';
      try {
        const content = await Promise.race([
          this.geoAI.generateLlms(isFull),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Generation timeout')), timeout),
          ),
        ]);
        sendPlainText(res, 200, content, maxAge);
      } catch {
        sendPlainText(res, 500, 'Internal Server Error', 0);
      }
      return; // do NOT call next()
    }

    if (this.options.injectLinkHeader) {
      const setHeader = res.setHeader?.bind(res) ?? res.header?.bind(res);
      setHeader('Link', this.geoAI.generateLinkHeader());
    }

    next();
  }
}
