# Changelog

All notable changes to GEO AI Core will be documented in this file.

## [0.2.0] - 2026-03-10

### Added

#### geo-ai-next
- `generateLlmsFiles(config)` — static file generation for `public/llms.txt` and `public/llms-full.txt` before `next build`
  - Creates output directory if missing
  - Atomic writes (temp file + rename) to prevent partial files
  - Configurable `outDir` (default: `public`) and `locale`
  - Logs progress and file sizes to stdout
  - Throws with descriptive error on failure
- `geo-ai-generate` CLI binary — run via `npx geo-ai-generate` with optional `--config` flag
- New exports: `GenerateLlmsFilesConfig`, `GenerateLlmsFilesResult` types

#### Testing
- 9 new tests for `generateLlmsFiles`: file creation, directory creation, overwrite safety, non-empty content, isFull flags, locale passthrough, re-generation, error handling, logging

### Fixed

#### geo-ai-next
- **Production 404 on `/llms.txt`** — middleware and route handler only served content dynamically at runtime; static hosting (Vercel, Netlify, `next export`) had no files to serve. `generateLlmsFiles()` now writes static files to `public/` as a pre-build step.

### Docs
- README: added Static File Generation section (recommended approach), CLI usage, troubleshooting for 404 on `/llms.txt`

## [0.1.2] - 2026-03-07

### Docs
- Updated documentation with new domain geoai.run
- Added ecosystem overview

## [0.1.1] - 2026-03-07

### Fixed

#### Infrastructure
- Type checking now works from root — added `tsconfig.json` with `paths` mapping for cross-package resolution, `typecheck` script changed to `tsc --noEmit`
- Fixed tsup DTS build — removed `composite: true` from package tsconfigs that conflicted with tsup's declaration generation

#### geo-ai-core
- `MemoryCrawlStore` — added `maxEntries` cap (default 10 000) with automatic eviction of oldest 20% on overflow, preventing unbounded memory growth
- `MemoryCacheAdapter` — added `maxEntries` cap (default 1 000) with proactive expired entry eviction on `set()`, preventing stale entries from accumulating indefinitely
- `getPriceRange` — replaced `Math.min(...spread)` / `Math.max(...spread)` with iterative loop, eliminating potential stack overflow on large variant arrays
- `bulkGenerate` — batches now process concurrently via `Promise.allSettled()` instead of sequentially, making `batchSize` control actual parallelism
- `AiBulkConfig.onProgress` — callback type changed from `Resource` to `AiContext`, removing unsafe `as unknown as Resource` cast

#### geo-ai-next
- `geoAIMiddleware` — added `Cache-Control: public, max-age=3600` header to llms.txt responses, consistent with `createLlmsHandler`
- Both `GeoAIMiddlewareConfig` and `LlmsHandlerConfig` now accept optional `cacheMaxAge` (seconds, default 3600) for configurable Cache-Control

## [0.1.0] - 2026-03-06

### Added

#### geo-ai-core
- `createGeoAI(config)` factory function — single config object initializes all modules
- `ContentProvider` interface and `StaticContentProvider` for `Record<string, Resource[]>` shorthand
- `LlmsGenerator` — generates llms.txt and llms-full.txt Markdown from provider data
  - Helper functions: `stripHtml`, `trimWords`, `getPriceRange`, `getSalePrices`, `getAvailabilityStatus`
  - Standard format: `- [title](url): description [keywords]`
  - Full format: content (trimmed to 200 words), pricing, availability, variants
  - Locale support with `Language` metadata line
  - AI Crawler Rules section with per-bot status
  - Footer with generator name and UTC timestamp
- `BotRulesEngine` — per-bot allow/disallow rules, robots.txt block generation, bot detection by User-Agent
- `AI_BOTS` registry with 16 supported crawlers: GPTBot, OAI-SearchBot, ClaudeBot, Google-Extended, PerplexityBot, DeepSeekBot, GrokBot, meta-externalagent, PanguBot, YandexBot, SputnikBot, Bytespider, Baiduspider, claude-web, Amazonbot, Applebot
- `CrawlTracker` — bot visit logging with GDPR-compliant IP anonymization (SHA-256 via Web Crypto API, Edge Runtime compatible)
- `MemoryCrawlStore` — in-memory crawl store with `log()`, `getActivity()`, `cleanup()`
- `CrawlStore` interface for pluggable storage backends
- `MemoryCacheAdapter` — in-memory TTL cache with expiry check on read
- `FileCacheAdapter` — file-based TTL cache with JSON metadata
- `CacheAdapter` interface for pluggable cache backends
- `CryptoService` — AES-256-GCM encryption/decryption via `node:crypto`, format: `base64(IV + authTag + ciphertext)`
- `SeoGenerator` — HTML meta tags, HTTP Link header, JSON-LD (WebSite/Product/Article)
- `AiGenerator` (separate entry point `geo-ai-core/ai`) — Claude and OpenAI API integration via `globalThis.fetch`
  - `RateLimiter` — sliding window rate limiter (default 10 req/min)
  - `buildPrompt` — template placeholder replacement (`{title}`, `{content}`, `{type}`, `{price}`, `{category}`)
  - `classifyAiError` — HTTP status to error type mapping (auth, rate_limit, server, network, unknown)
  - `AiProviderError` — typed error class
  - `bulkGenerate` — batch processing (default 5 per batch, max 50 items) with `onProgress` callback
- `parseDuration` — cache duration string parser (`'1h'`, `'24h'`, `'7d'` → seconds)
- Dual ESM/CJS build via tsup (`.mjs`/`.cjs` extensions)
- Two entry points: `.` (main) and `./ai` (AI generator)
- Full TypeScript declarations (`.d.ts`) for all exports
- Zero runtime dependencies

#### geo-ai-next
- `geoAIMiddleware(config)` — Next.js middleware intercepting `/llms.txt` and `/llms-full.txt`
  - Returns `text/plain` response for llms paths
  - `NextResponse.next()` passthrough for all other paths
  - Optional `Link` header injection via `injectLinkHeader` config
  - Fire-and-forget bot visit tracking
- `createLlmsHandler(config)` — Next.js App Router route handler
  - File type detection by URL path or `?type=full` query parameter
  - `Content-Type: text/plain`, `Cache-Control: public, max-age=3600`
  - Bot visit logging
- Re-exports all public types, interfaces, and classes from `geo-ai-core`
- `geo-ai-core` as regular dependency (not peer), `next >= 16` as peerDependency

#### Testing
- Vitest test suite with 114 tests across 9 test files
- Property-based tests via fast-check (100+ iterations per property)
- Properties tested: stripHtml, trimWords, empty sections, llms.txt structure, locale metadata, bot rules, bot detection, IP anonymization, buildPrompt, classifyAiError
- Unit tests: BotRulesEngine, AiGenerator (mock fetch), createGeoAI, middleware, route handler

#### Infrastructure
- npm workspaces monorepo (`packages/*`)
- Shared `tsconfig.base.json` (strict, ESNext, bundler moduleResolution)
- Shared `vitest.config.ts` with v8 coverage
- Kiro steering files: product.md, tech.md, structure.md
- Kiro skills: new-bot, new-module, new-wrapper, new-test, new-cache-adapter, new-crawl-store
