#!/usr/bin/env node

/**
 * CLI entry point for generating llms.txt files.
 *
 * Usage:
 *   npx geo-ai-generate
 *   npx geo-ai-generate --config ./geo-ai.config.ts
 *
 * Or via package.json script:
 *   "geo:generate": "geo-ai-generate"
 */

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let configPath = resolve('geo-ai.config.ts');

  // Parse --config flag
  const configIdx = args.indexOf('--config');
  if (configIdx !== -1 && args[configIdx + 1]) {
    configPath = resolve(args[configIdx + 1]);
  }

  // Try loading config file
  let config: Record<string, unknown>;
  try {
    // Try .ts first via tsx/ts-node, fall back to .js/.mjs
    const mod = await import(pathToFileURL(configPath).href);
    config = mod.default ?? mod;
  } catch {
    // Try .js/.mjs variants
    const jsPath = configPath.replace(/\.ts$/, '.mjs');
    try {
      const mod = await import(pathToFileURL(jsPath).href);
      config = mod.default ?? mod;
    } catch {
      console.error(`[geo-ai] Could not load config from ${configPath}`);
      console.error(`[geo-ai] Create a geo-ai.config.ts (or .mjs) file in your project root.`);
      console.error(`[geo-ai] Example:\n`);
      console.error(`  import type { GenerateLlmsFilesConfig } from 'geo-ai-next';`);
      console.error(`  export default {`);
      console.error(`    siteName: 'My Site',`);
      console.error(`    siteUrl: 'https://example.com',`);
      console.error(`    provider: { Pages: [{ title: 'Home', url: '/' }] },`);
      console.error(`  } satisfies GenerateLlmsFilesConfig;\n`);
      process.exit(1);
    }
  }

  const { generateLlmsFiles } = await import('./generate');
  await generateLlmsFiles(config as unknown as Parameters<typeof generateLlmsFiles>[0]);

  console.log('[geo-ai] Done.');
}

main().catch((err) => {
  console.error('[geo-ai] Generation failed:', err);
  process.exit(1);
});
