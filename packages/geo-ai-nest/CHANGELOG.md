# Changelog

All notable changes to `geo-ai-nest` will be documented in this file.

## [0.1.1] - 2026-03-17

### Security

- **User-Agent truncation** — `GeoAIMiddleware`, `GeoAIGuard`, and `@IsAIBot()` now truncate the `User-Agent` header to 1024 characters before processing, preventing memory abuse from maliciously large UA strings stored in `CrawlEntry.userAgent`.

### Added

- **`generateTimeout` option** — new `GeoAIOptions` field (default `30 000` ms). `GeoAIMiddleware` wraps `generateLlms()` in `Promise.race()` against a configurable timeout; returns `500 Internal Server Error` if the `ContentProvider` hangs.

## [0.1.0] - 2026-03-12

### Added

- `GeoAIModule` — NestJS dynamic module with `forRoot` (sync) and `forRootAsync` (async via `useFactory`, `useClass`, `useExisting`)
- `GeoAIService` — injectable service wrapping `GeoAIInstance` from `geo-ai-core`
- `GeoAIMiddleware` — HTTP middleware serving `GET /llms.txt`, `GET /llms-full.txt`, `GET /.well-known/llms.txt`; Express and Fastify adapter-agnostic
- `GeoAIController` — auto-registered controller serving `GET /robots-ai.txt`
- `GeoAIGuard` — route guard restricting access to verified AI bot requests
- `GeoAIInterceptor` — response interceptor injecting `Link` header via RxJS `tap`
- `@IsAIBot()` — parameter decorator injecting detected bot name or `null`
- `@GeoAIMeta()` — class/method decorator attaching GEO metadata via `SetMetadata`
- `GEO_AI_OPTIONS`, `GEO_AI_ENGINE` — DI injection tokens
- Re-exports all public types and classes from `geo-ai-core` and `geo-ai-core/ai`
- Dual ESM/CJS build (`.mjs` / `.cjs`) with full TypeScript declarations
