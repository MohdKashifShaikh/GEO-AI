# GEO AI — Roadmap

**GEO AI – AI Search Optimization**

Make any site visible to ChatGPT, Claude, Perplexity, Gemini, Grok & other AI search engines.

---

## Ecosystem Overview

| Package | Stack | Status |
|---------|-------|--------|
| [GEO AI Woo](https://github.com/madeburo/GEO-AI-Woo) | WordPress / PHP | ✅ Released |
| [GEO AI Shopify](https://github.com/madeburo/GEO-AI-Shopify) | Shopify / TypeScript | ✅ Released |
| [geo-ai-core](https://www.npmjs.com/package/geo-ai-core) | TypeScript (framework-agnostic) | ✅ Released |
| [geo-ai-next](https://www.npmjs.com/package/geo-ai-next) | Next.js | ✅ Released |
| [geo-ai-cli](https://www.npmjs.com/package/geo-ai-cli) | CLI / Any Node.js project | ✅ Released |
| [geo-ai-nest](https://www.npmjs.com/package/geo-ai-nest) | NestJS | 🚧 In Development |

---

## Working on

| Phase | Package | Description |
|-------|---------|-------------|
| 7 | geo-ai-laravel | Laravel package — middleware + Artisan commands |
| 8 | GEO AI Assistant | AI-powered analysis companion that explains GEO findings, recommends fixes, and helps teams improve AI search readiness |

---

## Phase 1: Core Packages ✅

**geo-ai-core** — Framework-agnostic engine

- llms.txt / llms-full.txt generation
- 16 AI crawler registry and bot rules engine
- Provider interface for any CMS/API/static data
- TTL caching (memory + file adapters)
- Crawl tracking with GDPR-compliant IP anonymization
- AI description generation via Claude / OpenAI (opt-in)
- SEO signals: meta tags, Link header, JSON-LD
- AES-256-GCM API key encryption

**geo-ai-next** — Next.js wrapper

- Middleware intercepting `/llms.txt` and `/llms-full.txt`
- App Router route handler
- Static file generation (`generateLlmsFiles`) for Vercel/Netlify/`next export`
- `geo-ai-generate` binary for pre-build step
- Zero-config setup: `npm install geo-ai-next` + one config object

**geo-ai-cli** — Standalone CLI for any Node.js project

- `geo-ai init` — scaffolds `geo-ai.config.ts` with starter template
- `geo-ai generate` — generates `llms.txt` + `llms-full.txt` from config into `./public`
- `geo-ai validate` — checks local files or remote URLs for presence and valid content
- `geo-ai inspect` — previews config: site info, crawler rules, resource sections with item counts
- Zero runtime dependencies beyond `geo-ai-core`
- Config auto-discovery: `.ts` → `.js` → `.json`
- Typed error classes with exit codes (`1` user errors, `2` internal)
- `DEBUG=geo-ai` for verbose stack traces

---

## Phase 2: Documentation Site

**docs.geoai.run**

Developer documentation covering all platforms:

| Section | Content |
|---------|---------|
| `/concepts` | What is GEO, AI Search vs SEO, how AI crawlers work, llms.txt explained |
| `/nextjs` | geo-ai-next setup, middleware config, route handlers, examples |
| `/node` | geo-ai-core standalone usage, custom providers, API reference |
| `/wordpress` | GEO AI Woo installation, settings, WP-CLI, hooks |
| `/shopify` | GEO AI Shopify setup, metafields, theme extension, API |

### `/concepts` — Educational Content

| Page | Content |
|------|---------|
| What is GEO | Generative Engine Optimization explained — why traditional SEO isn't enough for AI search |
| AI Search vs SEO | Side-by-side comparison — how Google indexes vs how ChatGPT/Perplexity discover content |
| How AI Crawlers Work | GPTBot, ClaudeBot, PerplexityBot — what they look for, how they parse, what they ignore |
| llms.txt Explained | The standard, the format, why it matters — robots.txt told crawlers what to skip, llms.txt tells AI what to read |

**Why `/concepts` matters:** educational content ranks for searches like "what is GEO", "AI SEO", "llms.txt" — drives organic traffic from developers and merchants who don't yet know GEO AI exists.

---

## Phase 3: GEO Specification

**GEO-SPEC.md** — Open specification for AI search optimization signals.

A reference document defining the full stack of signals that make a website AI-discoverable:

| Signal | Description |
|--------|-------------|
| `llms.txt` | Structured Markdown index at site root for AI crawlers |
| `llms-full.txt` | Complete content version with product data, pricing, availability |
| AI Metadata | `<meta name="llms">`, `<meta name="ai-description">` tags |
| Crawler Rules | Per-bot robots.txt directives for 16+ AI crawlers |
| Structured Signals | JSON-LD Schema.org markup (Product, Article, WebSite with ReadAction) |
| Link Header | `Link: <url>; rel="ai-content-index"` HTTP header |

**Why a specification:**
- Positions GEO AI as the standard, not just a tool
- Other developers can build compatible implementations
- Referenced by docs, blog posts, conference talks
- Lives in the GEO-AI monorepo as the source of truth

---

## Phase 4: GEO Analyzer

**geoai.run/analyze**

Free public tool — enter any URL, get an AI visibility audit.

### How it works

1. User enters website URL
2. Analyzer checks: llms.txt presence, AI metadata, crawler rules, Schema.org markup, content structure
3. Returns AI Visibility Score (0–100) with actionable breakdown

### Example output

```
AI Visibility Score: 72/100

✓ llms.txt detected at /llms.txt
✓ AI meta tags present
✗ Crawler rules missing — no bot-specific robots.txt directives
✗ Schema.org incomplete — Product markup missing price and availability
✗ No llms-full.txt found

Recommendations:
→ Add crawler rules for GPTBot, ClaudeBot, PerplexityBot
→ Add price and availability to Product schema
→ Generate llms-full.txt for comprehensive AI indexing
```

### AI Crawler Simulator

Simulate how specific AI bots see your site:

```
Simulate GPTBot crawl     → shows what ChatGPT can extract
Simulate ClaudeBot crawl  → shows what Claude can extract
Simulate PerplexityBot    → shows what Perplexity can extract
```

Each simulation shows: what the bot finds, what it misses, and a **"Fix with GEO AI"** button linking directly to the right package (WordPress plugin, Shopify app, or npm package).

### AI Citation Readiness

Beyond crawlability — check if your content is structured for AI to quote and cite:

```
AI Citation Readiness: 3/5

✓ Clear headings with question-answer structure
✓ Concise paragraphs (avg 45 words — ideal for LLM extraction)
✗ No FAQ schema detected
✗ Long paragraphs on 4 pages (200+ words — hard for LLMs to quote)
✗ Key definitions not marked up (no <dfn>, no glossary structure)

Recommendations:
→ Add FAQ schema to top 10 pages
→ Break long paragraphs into quotable chunks (50-80 words)
→ Structure answers as direct statements LLMs can cite
```

**Why this matters:** llms.txt makes your site discoverable, but citation readiness makes your content quotable. Especially valuable for blogs, knowledge bases, and documentation sites where being cited by ChatGPT/Perplexity drives authority and traffic.

### Why Analyzer is a growth engine

Tools like Ahrefs Site Audit, Google PageSpeed Insights, and SEO audit tools generate massive organic traffic because people search for solutions to specific problems. The same pattern applies here:

| Search Query | Lands On |
|-------------|----------|
| "AI SEO check" | geoai.run/analyze |
| "AI visibility score" | geoai.run/analyze |
| "llms.txt checker" | geoai.run/analyze |
| "is my site visible to ChatGPT" | geoai.run/analyze |
| "check AI crawlers" | geoai.run/analyze |

**Conversion funnel:**
1. User runs analysis → sees score and issues
2. Clicks "Fix with GEO AI" → lands on docs or package
3. Installs plugin/package → reruns analysis → sees improved score
4. Shares result → viral loop

---

## Phase 5: geo-ai-nest 

**geo-ai-nest** — NestJS adapter (~250–300 lines) around `geo-ai-core`.

Install:

```bash
npm install geo-ai-nest
```

**Implemented:**

- `GeoAIModule.forRoot()` / `forRootAsync()` — dynamic module with full async provider support (`useFactory`, `useClass`, `useExisting`)
- `GeoAIService` — injectable service exposing all `geo-ai-core` capabilities via DI
- `GeoAIMiddleware` — HTTP middleware exclusively owning `/llms.txt`, `/llms-full.txt`, `/.well-known/llms.txt`; compatible with Express and Fastify adapters
- `GeoAIController` — auto-registered controller serving `/robots-ai.txt` with dynamic `Cache-Control`
- `GeoAIGuard` — route guard restricting access to verified AI bot requests
- `GeoAIInterceptor` — response interceptor injecting the `Link` header via RxJS `tap`
- `@IsAIBot()` — parameter decorator injecting detected bot name (or `null`) into handler params
- `@GeoAIMeta()` — class/method decorator attaching GEO metadata via `SetMetadata`
- Full re-export of all `geo-ai-core` public API — one import for everything
- Dual ESM/CJS build, TypeScript declarations, NestJS 10+ peer dependency

```typescript
// app.module.ts
import { GeoAIModule } from 'geo-ai-nest';

@Module({
  imports: [
    GeoAIModule.forRoot({
      siteName: 'My Site',
      siteUrl: 'https://example.com',
      provider: { Pages: [{ title: 'Home', url: '/', description: 'Welcome' }] },
      isGlobal: true,
      injectLinkHeader: true,
    }),
  ],
})
export class AppModule {}
```

---

## Phase 6: GEO AI CLI 

**geo-ai-cli** — Released `v0.1.0`. Install via npm:

```bash
npm install -g geo-ai-cli
# or per-project:
npm install --save-dev geo-ai-cli
```

**Implemented commands:**

```bash
geo-ai init                          # scaffold geo-ai.config.ts
geo-ai generate [--config] [--out]   # generate llms.txt + llms-full.txt
geo-ai validate [--path] [--url]     # validate local files or remote URL
geo-ai inspect  [--config] [--url]   # preview config or remote llms files
geo-ai --version                     # show version
geo-ai --help                        # show help
geo-ai <command> --help              # per-command help
```

**Planned for future CLI versions:**

- `geo-ai analyze <url>` — AI visibility audit from terminal (same engine as geoai.run/analyze)
- `geo-ai crawlers <url>` — check which AI bots can access the site
- Interactive `geo-ai init` wizard with framework detection (Next.js / NestJS / Node.js / Static)

---

*hi@geoai.run · [Geoai.run](https://www.geoai.run)*
