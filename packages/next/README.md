# geo-ai-next

[![npm](https://img.shields.io/npm/v/geo-ai-next)](https://npmjs.com/package/geo-ai-next)

Part of the [GEO AI – AI Search Optimization](https://www.geoai.run) ecosystem. [GitHub](https://github.com/madeburo/GEO-AI)

Next.js integration for [geo-ai-core](https://npmjs.com/package/geo-ai-core) — static file generation, middleware, and App Router route handler for `llms.txt` / `llms-full.txt`.

Try the analyzer at [geoai.run/analyze](https://www.geoai.run/analyze)

## Installation

```bash
npm install geo-ai-next
```

Peer dependency: `next >= 16`

---

## Recommended Production Setup

The shortest path to working GEO AI files in production:

**1.** Create `geo-ai.config.mjs` in your project root
**2.** Add the build script to `package.json`
**3.** Run `npm run build` — files appear in `public/`
**4.** Deploy — done

```json
{
  "scripts": {
    "geo:generate": "geo-ai-generate",
    "build": "npm run geo:generate && next build"
  }
}
```

```js
// geo-ai.config.mjs
export default {
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: { Pages: [{ title: 'Home', url: '/', description: 'Welcome' }] },
  crawlers: 'all',
};
```

After build, verify:
```bash
ls public/llms.txt public/llms-full.txt  # both files present
```

Full details and options in the sections below.

---

## llms.txt vs llms-full.txt

Both files follow the [llms.txt standard](https://llmstxt.org) for making site content readable by AI search engines.

| File | Purpose | Content |
|------|---------|---------|
| `llms.txt` | Concise index for AI crawlers | Site name, description, crawler rules, resource list with titles, URLs, and short descriptions |
| `llms-full.txt` | Extended version for deep indexing | Everything in `llms.txt` plus full page content, product pricing, availability, and variants |

AI crawlers like GPTBot and ClaudeBot discover `llms.txt` first. If they need more detail — for example to answer a product question — they fetch `llms-full.txt`. Serving both maximizes your site's visibility in AI search results.

---

## Static File Generation (Recommended)

The most reliable approach for production. Generates `public/llms.txt` and `public/llms-full.txt` as static files before `next build` — Next.js serves them automatically, no middleware needed.

```typescript
// scripts/generate-llms.ts
import { generateLlmsFiles } from 'geo-ai-next';

await generateLlmsFiles({
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  siteDescription: 'AI-optimized site description',
  provider: {
    Pages: [
      { title: 'Home', url: '/', description: 'Welcome page' },
      { title: 'About', url: '/about', description: 'About us' },
    ],
    Products: [
      { title: 'Widget', url: '/products/widget', description: 'A great widget', price: '$29' },
    ],
  },
  crawlers: 'all',
});
```

Add to `package.json`:

```json
{
  "scripts": {
    "geo:generate": "geo-ai-generate",
    "build": "npm run geo:generate && next build"
  }
}
```

After `npm run build`, both files are written to `public/` and served at:
- `https://yoursite.com/llms.txt`
- `https://yoursite.com/llms-full.txt`

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `outDir` | `string` | `'public'` | Output directory (relative to cwd) |
| `locale` | `string` | — | Locale for content generation |
| + all `GeoAIConfig` options | | | `siteName`, `siteUrl`, `provider`, `crawlers`, `cache`, etc. |

### CLI

The `geo-ai-generate` binary is included in the package. It reads `geo-ai.config.mjs` from your project root by default.

```bash
# Run directly (reads geo-ai.config.mjs)
npx geo-ai-generate

# Custom config path
npx geo-ai-generate --config ./config/geo-ai.mjs
```

Example `geo-ai.config.mjs`:

```js
// geo-ai.config.mjs
export default {
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: {
    Pages: [
      { title: 'Home', url: '/', description: 'Welcome' },
      { title: 'About', url: '/about', description: 'About us' },
    ],
  },
  crawlers: 'all',
};
```

With this config file in place, your `package.json` scripts become:

```json
{
  "scripts": {
    "geo:generate": "geo-ai-generate",
    "build": "npm run geo:generate && next build"
  }
}
```

### Troubleshooting: 404 on `/llms.txt`

1. Make sure `generateLlmsFiles()` runs before `next build`
2. Check that `public/llms.txt` exists after generation
3. Vercel and Netlify serve `public/` automatically — no extra config needed
4. For custom servers, ensure static file serving is configured for the `public/` directory

---

## End-to-End Example

Minimal Next.js app that generates and serves both files:

**1. Install**
```bash
npm install geo-ai-next
```

**2. Create `geo-ai.config.mjs`**
```js
export default {
  siteName: 'Acme Store',
  siteUrl: 'https://acme.example.com',
  siteDescription: 'Quality widgets for every need',
  provider: {
    Pages: [
      { title: 'Home', url: '/', description: 'Welcome to Acme Store' },
      { title: 'About', url: '/about', description: 'Our story' },
    ],
    Products: [
      {
        title: 'Classic Widget',
        url: '/products/classic',
        description: 'Our best-selling widget',
        price: '$29.99',
        available: true,
      },
    ],
  },
  crawlers: 'all',
};
```

**3. Add scripts to `package.json`**
```json
{
  "scripts": {
    "geo:generate": "geo-ai-generate",
    "build": "npm run geo:generate && next build"
  }
}
```

**4. Run build**
```bash
npm run build
```

Output:
```
[geo-ai] Generating llms files → /your-project/public
[geo-ai] ✓ /your-project/public/llms.txt (843 bytes)
[geo-ai] ✓ /your-project/public/llms-full.txt (1204 bytes)
[geo-ai] Done.
```

**5. Verify**
```bash
curl https://acme.example.com/llms.txt
curl https://acme.example.com/llms-full.txt
```

Both return `200 OK` with `text/plain` content — no middleware, no route handler needed.

---

## Runtime Serving (Alternative)

If you were already using middleware or a route handler, they continue to work. Static generation is the recommended production approach, but runtime serving is still valid for dynamic use cases like per-request locale or content that changes too frequently to regenerate at build time.

| Approach | When to use |
|----------|-------------|
| Static generation (`generateLlmsFiles`) | Production default — works on Vercel, Netlify, any static host |
| Middleware (`geoAIMiddleware`) | Dynamic content per-request, edge locale detection |
| Route handler (`createLlmsHandler`) | Custom route path, App Router, programmatic control |

---

## Middleware

Intercepts `/llms.txt` and `/llms-full.txt` at the edge, passes everything else through. Use this when you need dynamic content per-request (e.g. locale from cookies, A/B testing).

```typescript
// middleware.ts
import { geoAIMiddleware } from 'geo-ai-next';

export default geoAIMiddleware({
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: new MyProvider(),
  cache: '24h',
  cacheMaxAge: 3600,      // Cache-Control max-age in seconds (default 3600)
  injectLinkHeader: true, // adds Link header to all responses
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Route Handler

For App Router — serves llms content at a custom route. File type is determined by URL path (`/llms-full.txt`) or query param `?type=full`.

```typescript
// app/llms/route.ts
import { createLlmsHandler } from 'geo-ai-next';

export const { GET } = createLlmsHandler({
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: new MyProvider(),
  cacheMaxAge: 3600, // optional, default 3600
});
```

---

## Re-exports

All public API from `geo-ai-core` is re-exported — no need to install both packages:

```typescript
import {
  createGeoAI,
  BotRulesEngine,
  CrawlTracker,
  SeoGenerator,
  AI_BOTS,
  type ContentProvider,
  type Resource,
  type GeoAIConfig,
} from 'geo-ai-next';
```

---

## Requirements

- Node.js >= 20
- Next.js >= 16
- TypeScript >= 5.5 (recommended)

## License

[GPL v2](../../LICENSE)
