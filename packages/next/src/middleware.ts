import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createGeoAI } from 'geo-ai-core';
import type { GeoAIConfig, GeoAIInstance } from 'geo-ai-core';

// ── Config ──────────────────────────────────────────────────────────

export interface GeoAIMiddlewareConfig extends GeoAIConfig {
  /** Inject Link header pointing to llms.txt on non-llms responses. Default: false */
  injectLinkHeader?: boolean;
}

// ── Middleware factory ───────────────────────────────────────────────

/**
 * Creates a Next.js middleware function that intercepts `/llms.txt` and
 * `/llms-full.txt` requests, returning generated content as `text/plain`.
 * All other paths are passed through via `NextResponse.next()`.
 */
export function geoAIMiddleware(
  config: GeoAIMiddlewareConfig,
): (request: NextRequest) => Promise<NextResponse> {
  const core: GeoAIInstance = createGeoAI(config);
  const injectLink = config.injectLinkHeader ?? false;

  return async (request: NextRequest): Promise<NextResponse> => {
    const { pathname } = request.nextUrl;

    // ── Match llms paths ───────────────────────────────────────────
    if (pathname === '/llms.txt' || pathname === '/llms-full.txt') {
      const isFull = pathname === '/llms-full.txt';

      try {
        const content = await core.generateLlms(isFull);

        // Fire-and-forget: track visit without blocking the response
        core.trackVisit(request as unknown as Request).catch(() => {});

        return new NextResponse(content, {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      } catch {
        return new NextResponse('Internal Server Error', {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    }

    // ── Passthrough ────────────────────────────────────────────────
    const response = NextResponse.next();

    if (injectLink) {
      response.headers.set('Link', core.generateLinkHeader());
    }

    return response;
  };
}
