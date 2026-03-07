# geo-ai-next

[![npm](https://img.shields.io/npm/v/geo-ai-next)](https://npmjs.com/package/geo-ai-next)

Part of the [GEO AI – AI Search Optimization](https://www.geoai.run) ecosystem. [GitHub](https://github.com/madeburo/GEO-AI). Full documentation → [geo-ai-core](https://npmjs.com/package/geo-ai-core)

Thin Next.js wrapper for [geo-ai-core](../core) — middleware and App Router route handler for serving `llms.txt` / `llms-full.txt`.

Try the analyzer at [geoai.run/analyze](https://www.geoai.run/analyze)

## Installation

```bash
npm install geo-ai-next
```

Peer dependency: `next >= 16`

## Middleware

Intercepts `/llms.txt` and `/llms-full.txt` requests, passes everything else through:

```typescript
// middleware.ts
import { geoAIMiddleware } from 'geo-ai-next';

export default geoAIMiddleware({
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: new MyProvider(),
  cache: '24h',
  cacheMaxAge: 3600,    // Cache-Control max-age in seconds (default 3600)
  injectLinkHeader: true, // adds Link header to all responses
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Route Handler

For App Router — serves llms content at any route you choose:

```typescript
// app/llms/route.ts
import { createLlmsHandler } from 'geo-ai-next';

export const { GET } = createLlmsHandler({
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: new MyProvider(),
  cacheMaxAge: 7200, // optional, default 3600
});
```

Type is determined by URL path (`/llms-full.txt`) or query param `?type=full`.

## Re-exports

All public API from `geo-ai-core` is re-exported, so you don't need to install both:

```typescript
import {
  createGeoAI,
  BotRulesEngine,
  CrawlTracker,
  SeoGenerator,
  AI_BOTS,
  type ContentProvider,
  type Resource,
} from 'geo-ai-next';
```

## Requirements

- Node.js >= 20
- Next.js >= 16
- TypeScript >= 5.5 (recommended)

## License

[GPL v2](../../LICENSE)
