import type { ParsedArgs } from '../lib/args.js';
import type { FsAdapter } from '../lib/fs.js';
import { safeFetch } from '../lib/fetch.js';
import * as path from 'node:path';

export type ValidationStatus = 'pass' | 'warn' | 'fail' | 'not_found';

export interface ValidationResult {
  target: string;
  status: ValidationStatus;
  message: string;
}

const FILES = ['llms.txt', 'llms-full.txt'] as const;

/**
 * Pure function: assigns status based on content string.
 * null → 'not_found'
 * length < 50 → 'warn'
 * starts with '# ' → 'pass'
 * otherwise → 'fail'
 */
export function assignStatus(content: string | null): ValidationStatus {
  if (content === null) return 'not_found';
  if (content.length < 50) return 'warn';
  if (content.startsWith('# ')) return 'pass';
  return 'fail';
}

function recommendation(status: ValidationStatus, target: string): string {
  switch (status) {
    case 'not_found':
      return `${target} was not found. Run \`geo-ai generate\` to create it.`;
    case 'warn':
      return `${target} exists but is too short (< 50 chars). Check your config has enough content.`;
    case 'fail':
      return `${target} exists but does not start with a valid \`# <siteName>\` heading. Regenerate with \`geo-ai generate\`.`;
    default:
      return '';
  }
}

async function validateLocal(
  dir: string,
  fs: FsAdapter,
): Promise<ValidationResult[]> {
  return Promise.all(
    FILES.map(async (file) => {
      const target = path.join(dir, file);
      const content = await fs.readFile(target);
      const status = assignStatus(content);
      return { target, status, message: recommendation(status, target) };
    }),
  );
}

async function validateRemote(
  baseUrl: string,
  fetchFn: typeof globalThis.fetch,
): Promise<ValidationResult[]> {
  return Promise.all(
    FILES.map(async (file) => {
      const target = `${baseUrl.replace(/\/$/, '')}/${file}`;
      let content: string | null;
      const result = await safeFetch(target, fetchFn, 10_000, 1_048_576);
      if (!result.ok) {
        if ('timedOut' in result) {
          return { target, status: 'fail', message: `${target} timed out. The server did not respond in time.` };
        }
        if ('tooLarge' in result) {
          return { target, status: 'fail', message: `${target} response body too large (> 1 MiB).` };
        }
        if (result.httpStatus === 404) {
          content = null;
        } else {
          return { target, status: 'fail', message: `${target} returned HTTP ${result.httpStatus}. Check your deployment.` };
        }
      } else {
        content = result.text;
      }
      const status = assignStatus(content);
      return { target, status, message: recommendation(status, target) };
    }),
  );
}

export async function runValidate(
  args: ParsedArgs,
  fs: FsAdapter,
  fetchFn: typeof globalThis.fetch,
): Promise<{ results: ValidationResult[]; exitCode: 0 | 1 }> {
  let results: ValidationResult[];

  if (args.url) {
    results = await validateRemote(args.url, fetchFn);
  } else {
    const dir = args.path ?? './public';
    results = await validateLocal(dir, fs);
  }

  const exitCode: 0 | 1 = results.some(
    (r) => r.status === 'fail' || r.status === 'not_found',
  )
    ? 1
    : 0;

  return { results, exitCode };
}
