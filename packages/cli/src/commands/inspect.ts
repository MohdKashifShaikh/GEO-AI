import { AI_BOTS } from 'geo-ai-core';
import { loadConfig } from '../lib/config.js';
import { safeFetch } from '../lib/fetch.js';
import type { FsAdapter } from '../lib/fs.js';
import type { Logger } from '../lib/logger.js';
import type { ParsedArgs } from '../lib/args.js';
import type { Resource } from 'geo-ai-core';

export interface InspectSummary {
  siteName: string;
  siteUrl: string;
  siteDescription?: string;
  crawlers: Record<string, 'allow' | 'disallow'>;
  outDir: string;
  sections: Array<{ name: string; itemCount: number }>;
}

export async function runInspect(
  cwd: string,
  args: ParsedArgs,
  _fs: FsAdapter,
  fetchFn: typeof globalThis.fetch,
  logger: Logger,
): Promise<InspectSummary | null> {
  // 10.3 When --url is provided, fetch and display raw llms.txt and llms-full.txt
  if (args.url) {
    const baseUrl = args.url.replace(/\/$/, '');
    const files = ['llms.txt', 'llms-full.txt'] as const;

    for (const file of files) {
      const url = `${baseUrl}/${file}`;
      const result = await safeFetch(url, fetchFn, 10_000, 1_048_576);
      if (!result.ok) {
        if ('timedOut' in result) {
          logger.warn(`${url} timed out`);
        } else if ('tooLarge' in result) {
          logger.warn(`${url} response body too large (> 1 MiB)`);
        } else {
          logger.warn(`${url} returned HTTP ${result.httpStatus}`);
        }
        continue;
      }
      logger.info(`--- ${url} ---`);
      for (const line of result.text.split('\n')) {
        logger.info(line);
      }
    }

    return null;
  }

  // 10.1 Load config — propagate errors to top-level handler
  const config = await loadConfig(cwd, args.config);

  // 10.2 Build InspectSummary from config
  const outDir = args.out ?? config.outDir ?? './public';

  // Resolve crawler rules
  let crawlers: Record<string, 'allow' | 'disallow'>;
  if (!config.crawlers || config.crawlers === 'all') {
    // All known bots are allowed
    crawlers = Object.fromEntries(
      Object.keys(AI_BOTS).map((bot) => [bot, 'allow' as const]),
    );
  } else {
    crawlers = config.crawlers as Record<string, 'allow' | 'disallow'>;
  }

  // Resolve sections from provider (static Record<string, Resource[]> shape)
  const sections: Array<{ name: string; itemCount: number }> = [];
  const provider = config.provider;

  if (provider && typeof provider === 'object' && !('getSections' in provider)) {
    // Static provider: Record<string, Resource[]>
    for (const [name, items] of Object.entries(provider as Record<string, Resource[]>)) {
      sections.push({ name, itemCount: Array.isArray(items) ? items.length : 0 });
    }
  }
  // If provider is a ContentProvider instance (has getSections), we can't count statically

  const summary: InspectSummary = {
    siteName: config.siteName,
    siteUrl: config.siteUrl,
    siteDescription: config.siteDescription,
    crawlers,
    outDir,
    sections,
  };

  // 10.4 Log summary in readable format
  logger.info(`Site: ${summary.siteName}`);
  logger.info(`URL:  ${summary.siteUrl}`);
  if (summary.siteDescription) {
    logger.info(`Desc: ${summary.siteDescription}`);
  }
  logger.info(`Out:  ${summary.outDir}`);

  logger.info('Crawlers:');
  for (const [bot, rule] of Object.entries(summary.crawlers)) {
    logger.info(`  ${bot}: ${rule}`);
  }

  if (summary.sections.length > 0) {
    logger.info('Sections:');
    for (const section of summary.sections) {
      logger.info(`  ${section.name}: ${section.itemCount} item(s)`);
    }
  } else {
    logger.info('Sections: (dynamic provider — run `geo-ai generate` to see output)');
  }

  return summary;
}
