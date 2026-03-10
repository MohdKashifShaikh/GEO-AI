# geo-ai-core

[![npm](https://img.shields.io/npm/v/geo-ai-core)](https://npmjs.com/package/geo-ai-core)

Part of the [GEO AI – AI Search Optimization](https://www.geoai.run) ecosystem. [GitHub](https://github.com/madeburo/GEO-AI)

Zero-dependency TypeScript engine for AI Search Optimization (GEO). Optimizes websites for AI search engines — ChatGPT, Claude, Gemini, Perplexity, DeepSeek, Grok, YandexGPT, GigaChat and more.

Works with any Node.js framework or plain server. For Next.js, use [`geo-ai-next`](https://npmjs.com/package/geo-ai-next) which adds static file generation, middleware, and a route handler on top.

Try the analyzer at [geoai.run/analyze](https://www.geoai.run/analyze)

## Installation

```bash
npm install geo-ai-core
# Next.js projects:
npm install geo-ai-next
```

## Quick Start

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

// llms.txt / llms-full.txt
const llmsTxt = await geo.generateLlms(false);
const llmsFullTxt = await geo.generateLlms(true);

// robots.txt block
const robotsTxt = geo.generateRobotsTxt();

// SEO signals
const metaTags = geo.generateMetaTags();
const linkHeader = geo.generateLinkHeader();
const jsonLd = geo.generateJsonLd();
```

## ContentProvider

For dynamic data sources, implement the `ContentProvider` interface:

```typescript
import { createGeoAI, type ContentProvider } from 'geo-ai-core';

class MyProvider implements ContentProvider {
  async getSections(options?: { locale?: string }) {
    return [
      { name: 'Products', type: 'product', resources: await fetchProducts() },
      { name: 'Blog', type: 'page', resources: await fetchPosts() },
    ];
  }
}

const geo = createGeoAI({
  siteName: 'My Site',
  siteUrl: 'https://example.com',
  provider: new MyProvider(),
  crawlers: 'all',
  cache: '24h',
  crawlTracking: true,
});
```

## AI Description Generation

Separate entry point — only loaded when imported, fully tree-shakeable:

```typescript
import { AiGenerator } from 'geo-ai-core/ai';

const ai = new AiGenerator({
  provider: 'anthropic',
  apiKey: 'sk-...',
  model: 'claude-sonnet-4-20250514',
});

const description = await ai.generate({
  title: 'Premium Widget',
  content: 'A high-quality widget...',
  type: 'product',
  price: '$29.99',
});
```

Bulk generation with progress (concurrent within each batch):

```typescript
const results = await ai.bulkGenerate(items, {
  batchSize: 5,
  maxItems: 50,
  onProgress: (completed, total) => console.log(`${completed}/${total}`),
});
```

## Configuration

```typescript
interface GeoAIConfig {
  siteName: string;
  siteUrl: string;
  provider: ContentProvider | Record<string, Resource[]>;

  siteDescription?: string;
  crawlers?: Record<string, 'allow' | 'disallow'> | 'all';
  cache?: CacheAdapter | string;  // '1h', '24h', '7d' or custom adapter
  crypto?: { encryptionKey: string };  // 64-char hex for AES-256-GCM
  crawlTracking?: { store?: CrawlStore; secret?: string } | true;
}
```

## Entry Points

| Entry | Import | Contents |
|-------|--------|----------|
| Main | `geo-ai-core` | `createGeoAI`, `LlmsGenerator`, `BotRulesEngine`, `CrawlTracker`, `SeoGenerator`, `CryptoService`, cache adapters, all types |
| AI | `geo-ai-core/ai` | `AiGenerator`, `RateLimiter`, `buildPrompt`, `classifyAiError`, `AiProviderError` |

## Supported AI Crawlers

GPTBot, OAI-SearchBot, ClaudeBot, claude-web, Google-Extended, PerplexityBot, DeepSeekBot, GrokBot, meta-externalagent, PanguBot, YandexBot, SputnikBot, Bytespider, Baiduspider, Amazonbot, Applebot

## Requirements

- Node.js >= 20
- TypeScript >= 5.5 (recommended)

## License

[GPL v2](../../LICENSE)
