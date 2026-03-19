# GEO AI Core

![GEO AI](GEO-AI.png?v=2)

**GEO AI – AI Search Optimization**

Universal TypeScript engine for optimizing websites for AI search engines.

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/gpl-2.0)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5%2B-3178C6.svg)](https://www.typescriptlang.org/)

A zero-dependency TypeScript engine that optimizes websites for AI search engines like ChatGPT, Claude, Gemini, Perplexity, DeepSeek, Grok, YandexGPT, GigaChat, and more. The core works with any Node.js environment — official integrations currently include Next.js and NestJS, with WordPress and Shopify available as separate ecosystem packages.

- **geo-ai-core** – Universal engine (llms.txt generation, bot rules, crawl tracking, caching, encryption, SEO signals, AI descriptions)
- **geo-ai-next** – Next.js wrapper: static file generation, middleware + route handler
- **geo-ai-nest** – NestJS wrapper: dynamic module, middleware, controller, guard, interceptor, decorators
- **geo-ai-cli** – CLI tool: `geo-ai init / generate / validate / inspect` for any Node.js project

> **Not sure what's what?**
> - `geo-ai-core` — open-source npm library, zero dependencies, works anywhere Node.js runs
> - `geo-ai-next` — open-source npm library, Next.js integration built on top of `geo-ai-core`
> - `geo-ai-nest` — open-source npm library, NestJS integration built on top of `geo-ai-core`
> - `geo-ai-cli` — open-source npm CLI, `geo-ai init / generate / validate / inspect` for any project
> - [geoai.run](https://www.geoai.run) — the analyzer, docs, and llms.txt specification site

Try the analyzer at [geoai.run/analyze](https://www.geoai.run/analyze)

---

## Why GEO AI?

Traditional SEO tools are built for search engines like Google. But AI search engines work differently — they read structured content, not meta keywords.

GEO AI provides infrastructure for **AI Search Optimization**:

- ✅ `llms.txt` generation — structured content for AI crawlers
- ✅ AI crawler management — per-bot allow/disallow rules for 16+ bots
- ✅ AI metadata — meta tags, Link headers, JSON-LD signals
- ✅ Structured signals — pricing, availability, variants in machine-readable format

---

## Architecture

```
                         GEO AI
                           │
            ┌──────────────┼──────────────┐
            │              │              │
        WordPress       Shopify        Node.js
            │              │              │
       GEO-AI-Woo   GEO-AI-Shopify   geo-ai-core
            │                          │     │
       WooCommerce               geo-ai-next  geo-ai-cli
```

### Ecosystem

| Platform | Package |
|----------|---------|
| WordPress / WooCommerce | `geo-ai-woo` |
| Shopify | `geo-ai-shopify` |
| Next.js | `geo-ai-next` |
| NestJS | `geo-ai-nest` |
| Any Node.js | `geo-ai-core` |
| CLI (any project) | `geo-ai-cli` |

---

## Quick Start

```bash
npm install geo-ai-core
```

```typescript
import { createGeoAI } from 'geo-ai-core';

const geo = createGeoAI({
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: {
    Pages: [{ title: 'Home', url: '/', description: 'Welcome' }],
  },
});

// Generate llms.txt
const llmsTxt = await geo.generateLlms(false);

// Generate llms-full.txt
const llmsFullTxt = await geo.generateLlms(true);
```

---

## Features

### llms.txt Generation

Generates `llms.txt` and `llms-full.txt` from any data source via the `ContentProvider` interface. Standard version includes resource links with descriptions; full version adds content, pricing, availability, and variants.

### AI Crawler Management

Built-in registry of 16+ AI crawlers with per-bot allow/disallow rules and robots.txt block generation.

| Bot | Provider |
|-----|----------|
| GPTBot | OpenAI / ChatGPT |
| OAI-SearchBot | OpenAI / Copilot Search |
| ClaudeBot | Anthropic / Claude |
| claude-web | Anthropic / Claude Web |
| Google-Extended | Google / Gemini |
| PerplexityBot | Perplexity AI |
| DeepSeekBot | DeepSeek |
| GrokBot | xAI / Grok |
| meta-externalagent | Meta / LLaMA |
| PanguBot | Alibaba / Qwen |
| YandexBot | Yandex / YandexGPT |
| SputnikBot | Sber / GigaChat |
| Bytespider | ByteDance / Douyin |
| Baiduspider | Baidu / ERNIE |
| Amazonbot | Amazon / Alexa |
| Applebot | Apple / Siri & Spotlight |

### TTL Caching

Pluggable cache via `CacheAdapter` interface with built-in implementations:
- `MemoryCacheAdapter` — In-memory with TTL and automatic expired entry eviction (configurable `maxEntries`, default 1 000)
- `FileCacheAdapter` — File-based with JSON metadata

### Crawl Tracking

GDPR-compliant bot visit logging with SHA-256 IP anonymization (Web Crypto API, Edge Runtime compatible). Pluggable storage via `CrawlStore` interface with built-in `MemoryCrawlStore` (configurable `maxEntries`, default 10 000).

### AI Description Generation

Optional module (`geo-ai-core/ai`) for generating AI-optimized descriptions via Claude or OpenAI APIs:
- Customizable prompt templates with `{title}`, `{content}`, `{type}`, `{price}`, `{category}` placeholders
- Bulk generation (up to 50 items, batched by 5 concurrently) with progress callback
- Sliding window rate limiter (default 10 req/min)
- Typed error classification (auth, rate limit, server, network)

### SEO Signals

- `<meta name="llms">` and `<meta name="llms-full">` tags
- HTTP `Link` header for AI content discovery
- JSON-LD Schema.org (WebSite, Product, Article)

### Encryption

AES-256-GCM encryption for API keys via `node:crypto`. Format: `base64(IV[12] + authTag[16] + ciphertext)`.

---

### Installation

```bash
npm install geo-ai-core
# or for Next.js projects:
npm install geo-ai-next
# or for NestJS projects:
npm install geo-ai-nest
# or CLI (any project):
npm install --save-dev geo-ai-cli
# or globally:
npm install -g geo-ai-cli
```

### Basic Usage

```typescript
import { createGeoAI } from 'geo-ai-core';

const geo = createGeoAI({
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: {
    Products: [
      { title: 'Widget', url: '/products/widget', description: 'A great widget' },
    ],
    Blog: [
      { title: 'Hello World', url: '/blog/hello', description: 'First post' },
    ],
  },
});

// Generate llms.txt
const llmsTxt = await geo.generateLlms(false);

// Generate llms-full.txt
const llmsFullTxt = await geo.generateLlms(true);

// Generate robots.txt block
const robotsTxt = geo.generateRobotsTxt();

// SEO signals
const metaTags = geo.generateMetaTags();
const linkHeader = geo.generateLinkHeader();
const jsonLd = geo.generateJsonLd();
```

### With ContentProvider

```typescript
import { createGeoAI, type ContentProvider } from 'geo-ai-core';

class StrapiProvider implements ContentProvider {
  async getSections(options?: { locale?: string }) {
    const products = await fetchProducts(options?.locale);
    return [
      { name: 'Products', type: 'product', resources: products },
      { name: 'Blog', type: 'page', resources: await fetchPosts() },
    ];
  }
}

const geo = createGeoAI({
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: new StrapiProvider(),
  crawlTracking: true,
});
```

### Next.js — Static File Generation (Recommended)

Generate `public/llms.txt` and `public/llms-full.txt` before `next build`:

```typescript
// scripts/generate-llms.ts
import { generateLlmsFiles } from 'geo-ai-next';

await generateLlmsFiles({
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: new MyProvider(),
});
```

```json
{
  "scripts": {
    "geo:generate": "geo-ai-generate",
    "build": "npm run geo:generate && next build"
  }
}
```

Next.js serves files from `public/` automatically — no middleware needed. Middleware and route handler still work for dynamic use cases.

### Next.js Middleware

```typescript
// middleware.ts
import { geoAIMiddleware } from 'geo-ai-next';

export default geoAIMiddleware({
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: new MyProvider(),
  cache: '24h',
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Next.js Route Handler

```typescript
// app/llms/route.ts
import { createLlmsHandler } from 'geo-ai-next';

export const { GET } = createLlmsHandler({
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: new MyProvider(),
  cacheMaxAge: 3600, // seconds, default 3600
});
```

### NestJS

Register `GeoAIModule` once at the application root — middleware, controller, guard, interceptor, and decorators are all available automatically:

```typescript
// app.module.ts
import { GeoAIModule } from 'geo-ai-nest';

@Module({
  imports: [
    GeoAIModule.forRoot({
      siteName: 'My Site',
      siteUrl: 'https://example.com',
      provider: new MyProvider(),
      isGlobal: true,
      injectLinkHeader: true, // inject Link header on all responses
    }),
  ],
})
export class AppModule {}
```

Async configuration with `useFactory`:

```typescript
GeoAIModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    siteName: config.get('SITE_NAME'),
    siteUrl: config.get('SITE_URL'),
    provider: new MyProvider(),
    cache: '24h',
  }),
})
```

Use `GeoAIService` anywhere via DI, protect routes with `GeoAIGuard`, and inject the detected bot name with `@IsAIBot()`:

```typescript
import { GeoAIService, GeoAIGuard, IsAIBot } from 'geo-ai-nest';

@Controller('ai')
@UseGuards(GeoAIGuard) // allow only verified AI bots
export class AiController {
  constructor(private readonly geoAI: GeoAIService) {}

  @Get('meta')
  getMeta(@IsAIBot() bot: string | null) {
    return { bot, meta: this.geoAI.generateMetaTags() };
  }
}
```

`/llms.txt`, `/llms-full.txt`, and `/.well-known/llms.txt` are served automatically by the built-in middleware. `/robots-ai.txt` is served by the built-in controller.

### CLI

Generate and validate `llms.txt` without writing any code:

```bash
# Scaffold config
npx geo-ai init

# Generate llms.txt + llms-full.txt into ./public
npx geo-ai generate

# Validate local files
npx geo-ai validate

# Validate remote deployment
npx geo-ai validate --url https://example.com

# Preview config before generating
npx geo-ai inspect
```

See [`geo-ai-cli`](https://npmjs.com/package/geo-ai-cli) for full documentation.

### AI Description Generation

```typescript
import { AiGenerator } from 'geo-ai-core/ai';

const ai = new AiGenerator({
  provider: 'anthropic',
  apiKey: 'sk-...',
  model: 'claude-sonnet-4-20250514',
});

const description = await ai.generate({
  title: 'Premium Widget',
  content: 'A high-quality widget made from...',
  type: 'product',
  price: '$29.99',
});
```

---

## Configuration

```typescript
interface GeoAIConfig {
  // Required
  siteName: string;
  siteUrl: string;
  provider: ContentProvider | Record<string, Resource[]>;

  // Optional
  siteDescription?: string;
  crawlers?: Record<string, 'allow' | 'disallow'> | 'all';
  cache?: CacheAdapter | string;  // '1h', '24h', '7d' or custom adapter
  crypto?: { encryptionKey: string };  // 64-char hex
  crawlTracking?: { store?: CrawlStore; secret?: string } | true;
}
```

---

## Packages

| Package | Description | Entry Points |
|---------|-------------|-------------|
| `geo-ai-core` | Universal engine | `.` (main), `./ai` (AI generator) |
| `geo-ai-next` | Next.js: static generation, middleware, route handler | `.` |
| `geo-ai-nest` | NestJS: dynamic module, middleware, controller, guard, interceptor, decorators | `.` |
| `geo-ai-cli` | CLI: init, generate, validate, inspect | `geo-ai` binary |

---

## Requirements

- Node.js 20 or higher
- TypeScript 5.5+ (recommended, ships .d.ts)

---

## Development

```bash
# Clone
git clone https://github.com/madeburo/GEO-AI.git
cd GEO-AI/geo-ai-core

# Install
npm install

# Build all packages
npm run build

# Run tests
npx vitest run

# Type check
npx tsc --noEmit
```

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

GEO AI Core is open-source software licensed under the [GPL v2](LICENSE).

---

## Credits

- **Author:** Made Büro
- **Website:** [geoai.run](https://www.geoai.run)
- **GitHub:** [@madeburo](https://github.com/madeburo/GEO-AI)
- **X:** [@imadeburo](https://x.com/imadeburo)
