import { createGeoAI } from 'geo-ai-core';
import type { GeoAIConfig, GeoAIInstance } from 'geo-ai-core';

// ── Config ──────────────────────────────────────────────────────────

export interface LlmsHandlerConfig extends GeoAIConfig {}

// ── Route Handler factory ───────────────────────────────────────────

/**
 * Creates a Next.js App Router route handler that serves llms.txt content.
 * File type is determined by URL path (`/llms-full.txt`) or query `?type=full`.
 *
 * Usage in `app/llms/route.ts`:
 * ```ts
 * export const { GET } = createLlmsHandler({ ... });
 * ```
 */
export function createLlmsHandler(config: LlmsHandlerConfig): {
  GET: (request: Request) => Promise<Response>;
} {
  const core: GeoAIInstance = createGeoAI(config);

  return {
    async GET(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const isFull =
        url.pathname.endsWith('/llms-full.txt') ||
        url.searchParams.get('type') === 'full';

      try {
        const content = await core.generateLlms(isFull);

        // Fire-and-forget: log bot visit without blocking the response
        core.trackVisit(request).catch(() => {});

        return new Response(content, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch {
        return new Response('Internal Server Error', {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    },
  };
}
