# Contributing to GEO AI Core

Thanks for your interest in contributing! GEO AI Core is an open-source project and we welcome pull requests, bug reports, and feature suggestions.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/madeburo/GEO-AI.git
cd GEO-AI/geo-ai-core

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npx vitest run
```

## Requirements

- Node.js 20+
- npm 10+

## Project Structure

```
geo-ai-core/
├── packages/
│   ├── core/           # geo-ai-core — universal engine
│   │   ├── src/        # Source modules (types, llms-generator, bot-rules, etc.)
│   │   └── __tests__/  # Unit and property-based tests
│   └── next/           # geo-ai-next — Next.js wrapper
│       ├── src/        # Middleware, handler, re-exports
│       └── __tests__/  # Integration tests
├── package.json        # Workspace root
├── tsconfig.base.json  # Shared TypeScript config
└── vitest.config.ts    # Shared Vitest config
```

## Coding Standards

This project uses TypeScript with strict mode and follows these conventions:

- TypeScript strict mode, ESNext target, bundler moduleResolution
- One module per file, one class/concern per module
- Interfaces defined in `types.ts`, implementations in module files
- Exported helpers alongside classes for testability
- Zero runtime dependencies — only standard Node.js/Web APIs
- `globalThis.fetch` for HTTP calls (no external HTTP libs)
- `crypto.subtle` for Edge-compatible hashing, `node:crypto` for server-only encryption

### Naming Conventions

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Test files: `{module}.test.ts` (unit), `{module}.property.test.ts` (property-based)

### Testing

Tests use Vitest with fast-check for property-based testing:

```bash
# Run all tests
npx vitest run

# Watch mode (for development)
npx vitest
```

- Unit tests in `packages/{core|next}/__tests__/{module}.test.ts`
- Property-based tests in `packages/{core|next}/__tests__/{module}.property.test.ts`
- Property tests use minimum 100 iterations (`numRuns: 100`)

## Submitting Changes

### Bug Reports

Open an [issue](https://github.com/madeburo/GEO-AI/issues) with:

- Node.js version
- Steps to reproduce
- Expected vs. actual behavior

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`: `git checkout -b feature/your-feature`
3. Make your changes following the coding standards above
4. Add tests for new functionality
5. Run `npx vitest run` and `npx tsc --noEmit` to verify
6. Commit with a clear message: `git commit -m "Add: brief description"`
7. Push and open a PR against `main`

### Commit Message Format

```
Add: new feature description
Fix: bug description
Update: what was changed
Remove: what was removed
```

## Adding a New Module

See the skill guide at `.kiro/skills/new-module.md` for the full checklist. Key steps:

1. Define interfaces in `packages/core/src/types.ts`
2. Create module file in `packages/core/src/`
3. Export from `packages/core/src/index.ts`
4. Re-export from `packages/next/src/index.ts`
5. Add tests in `packages/core/__tests__/`
6. Verify: `npx vitest run` and `npm run build`

## Adding a New Framework Wrapper

See `.kiro/skills/new-wrapper.md` for the full template. The wrapper should:

1. Live in `packages/{framework}/`
2. Have `geo-ai-core` as a dependency (not peer)
3. Have the framework as a peerDependency
4. Re-export all public types and classes from `geo-ai-core`

## Architecture Notes

- Monorepo with npm workspaces (`packages/*`)
- tsup for dual ESM/CJS builds with `.mjs`/`.cjs` extensions
- Provider pattern abstracts data sources (CMS, API, static files)
- Factory pattern (`createGeoAI`) normalizes config and wires modules
- Adapter pattern for pluggable cache (`CacheAdapter`) and storage (`CrawlStore`)
- AI module in separate entry point (`geo-ai-core/ai`) for tree-shaking

## License

By contributing, you agree that your contributions will be licensed under the [GPL v2](LICENSE).
