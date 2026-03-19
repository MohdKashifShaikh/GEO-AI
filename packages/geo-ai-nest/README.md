# geo-ai-nest

NestJS integration for [GEO AI](https://www.geoai.run) — dynamic module, middleware, controller, guard, interceptor, and decorators for `llms.txt` / AI Search Optimization (GEO).

Wraps [`geo-ai-core`](../core/README.md) in NestJS idioms. All GEO logic lives in `geo-ai-core`; this package only adapts it to NestJS: dynamic modules, dependency injection, middleware, controllers, guards, interceptors, and decorators.

## Requirements

- Node.js >= 20
- NestJS >= 10 (Express or Fastify adapter)
- TypeScript >= 5.5

## Installation

```bash
npm install geo-ai-nest
```

`@nestjs/common` and `@nestjs/core` are peer dependencies — they must already be installed in your project.

---

## Quick Start

### forRoot (synchronous)

```typescript
import { Module } from '@nestjs/common';
import { GeoAIModule } from 'geo-ai-nest';

@Module({
  imports: [
    GeoAIModule.forRoot({
      siteName: 'My Site',
      siteUrl: 'https://example.com',
      provider: {
        docs: [
          { title: 'Getting Started', url: '/docs/start', content: 'Introduction...' },
        ],
      },
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

Once registered, `GET /llms.txt`, `GET /llms-full.txt`, and `GET /.well-known/llms.txt` are served automatically by the middleware, and `GET /robots-ai.txt` is served by the built-in controller.

---

### forRootAsync (asynchronous / config service)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GeoAIModule } from 'geo-ai-nest';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GeoAIModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        siteName: config.get('SITE_NAME'),
        siteUrl: config.get('SITE_URL'),
        provider: { /* ... */ },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

`forRootAsync` also supports `useClass` and `useExisting` via the `GeoAIOptionsFactory` interface.

---

## Configuration

`GeoAIOptions` extends `GeoAIConfig` from `geo-ai-core` with NestJS-specific fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `siteName` | `string` | required | Site name for llms.txt header |
| `siteUrl` | `string` | required | Canonical site URL |
| `provider` | `ContentProvider \| Record<string, Resource[]>` | required | Content source |
| `siteDescription` | `string?` | — | Optional site description |
| `crawlers` | `Record<string, 'allow'\|'disallow'> \| 'all'` | — | Per-bot crawler rules |
| `cache` | `CacheAdapter \| string` | — | Cache adapter or TTL string (e.g. `'24h'`) |
| `crawlTracking` | `CrawlTrackingConfig \| true` | — | Crawl tracking config |
| `isGlobal` | `boolean?` | `false` | Mark module as global |
| `injectLinkHeader` | `boolean?` | `false` | Inject `Link` header on all responses |
| `cacheMaxAge` | `number?` | `3600` | `Cache-Control` max-age in seconds |
| `registerController` | `boolean?` | `true` | Register `GeoAIController` (`/robots-ai.txt`) |
| `registerMiddleware` | `boolean?` | `true` | Apply `GeoAIMiddleware` (llms.txt routes) |
| `generateTimeout` | `number?` | `30000` | Timeout (ms) for llms.txt generation; returns 500 on expiry |

---

## Components

### GeoAIMiddleware

Applied automatically to all routes. Exclusively handles:

- `GET /llms.txt` → `generateLlms(false)` → `200 text/plain`
- `GET /llms-full.txt` → `generateLlms(true)` → `200 text/plain`
- `GET /.well-known/llms.txt` → `generateLlms(false)` → `200 text/plain`

For all other paths it calls `next()`. When `injectLinkHeader: true`, it sets the `Link` header before passing through. AI bot requests trigger fire-and-forget crawl tracking.

Disable with `registerMiddleware: false` in options.

---

### GeoAIController

Registers `GET /robots-ai.txt` automatically. Returns `text/plain` with a `Cache-Control: public, max-age={cacheMaxAge}` header.

Disable with `registerController: false` in options.

---

### GeoAIService

Injectable service exposing all `geo-ai-core` capabilities:

```typescript
import { Injectable } from '@nestjs/common';
import { GeoAIService } from 'geo-ai-nest';

@Injectable()
export class MyService {
  constructor(private readonly geoAI: GeoAIService) {}

  async getLlms() {
    return this.geoAI.generateLlms();          // standard llms.txt
  }

  async getFullLlms() {
    return this.geoAI.generateLlms(true);      // llms-full.txt
  }

  getRobots() {
    return this.geoAI.generateRobotsTxt();
  }

  getMetaTags() {
    return this.geoAI.generateMetaTags();
  }

  getLinkHeader() {
    return this.geoAI.generateLinkHeader();
  }

  getJsonLd() {
    return this.geoAI.generateJsonLd();
  }

  checkBot(ua: string) {
    return this.geoAI.isAIBot(ua);             // bot name or null
  }

  getEngine() {
    return this.geoAI.getEngine();             // raw GeoAIInstance
  }

  async clearCache() {
    await this.geoAI.invalidateCache();
  }
}
```

---

### GeoAIGuard

Restricts route access to verified AI bot requests:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { GeoAIGuard } from 'geo-ai-nest';

@Controller('bot-only')
export class BotOnlyController {
  @Get()
  @UseGuards(GeoAIGuard)
  handle() {
    return 'AI bots only';
  }
}
```

Returns `true` when the `User-Agent` matches a known AI bot, `false` otherwise.

---

### GeoAIInterceptor

Appends the `Link` header pointing to `llms.txt` on all responses from the decorated controller or handler:

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { GeoAIInterceptor } from 'geo-ai-nest';

@Controller()
@UseInterceptors(GeoAIInterceptor)
export class AppController {
  @Get()
  index() {
    return 'Hello';
  }
}
```

Can also be registered as a global interceptor via `app.useGlobalInterceptors(new GeoAIInterceptor(geoAIService))`.

---

### Decorators

#### @IsAIBot()

Parameter decorator that injects the detected bot name (or `null`) into a handler parameter:

```typescript
import { Controller, Get } from '@nestjs/common';
import { IsAIBot } from 'geo-ai-nest';

@Controller()
export class AppController {
  @Get()
  index(@IsAIBot() bot: string | null) {
    if (bot) {
      return `Hello, ${bot}`;
    }
    return 'Hello, human';
  }
}
```

#### @GeoAIMeta()

Class/method decorator that attaches GEO metadata to a controller or handler via `Reflect.metadata`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { GeoAIMeta } from 'geo-ai-nest';

@Controller()
@GeoAIMeta({ section: 'docs', priority: 'high' })
export class DocsController {
  @Get('article')
  @GeoAIMeta({ type: 'article' })
  getArticle() { /* ... */ }
}
```

Retrieve metadata with `Reflector` using the `GEO_AI_META_KEY` constant (`'geo-ai-meta'`).

---

## Re-exported from geo-ai-core

`geo-ai-nest` re-exports all public symbols from `geo-ai-core` so you only need one import:

```typescript
import {
  // Classes
  createGeoAI,
  BotRulesEngine,
  LlmsGenerator,
  SeoGenerator,
  CrawlTracker,
  MemoryCacheAdapter,
  FileCacheAdapter,
  MemoryCrawlStore,
  CryptoService,
  AI_BOTS,
  parseDuration,
  AiGenerator,           // from geo-ai-core/ai

  // Types
  GeoAIInstance,
  GeoAIConfig,
  Resource,
  ResourceSection,
  ContentProvider,
  CacheAdapter,
  CrawlStore,
  // ... and more
} from 'geo-ai-nest';
```

---

## Fastify Adapter

The middleware and guard include Express/Fastify fallbacks for request/response access. Fastify support is experimental — E2E tests cover Express only. Verify Fastify compatibility manually with `@nestjs/platform-fastify`.

---

## License

GPL-2.0 — see [LICENSE](../../LICENSE).
