import * as path from 'node:path';
import { createGeoAI } from 'geo-ai-core';
import { loadConfig } from '../lib/config.js';
import { CliError, FsWriteError } from '../lib/errors.js';
import type { FsAdapter } from '../lib/fs.js';
import type { Logger } from '../lib/logger.js';
import type { ParsedArgs } from '../lib/args.js';

export async function runGenerate(
  cwd: string,
  args: ParsedArgs,
  fs: FsAdapter,
  logger: Logger,
): Promise<void> {
  // 8.1 Load config — propagate ConfigNotFoundError, ConfigParseError, ConfigValidationError
  const config = await loadConfig(cwd, args.config);

  // 8.2 Generate llms.txt and llms-full.txt via geo-ai-core
  let llmsTxt: string;
  let llmsFullTxt: string;
  try {
    const instance = createGeoAI(config);
    llmsTxt = await instance.generateLlms(false);
    llmsFullTxt = await instance.generateLlms(true);
  } catch (err) {
    throw new CliError(
      err instanceof Error ? err.message : String(err),
      1,
      err,
    );
  }

  // 8.3 Ensure output directory exists, then write files
  const outDir = args.out ?? config.outDir ?? './public';
  const llmsPath = path.join(outDir, 'llms.txt');
  const llmsFullPath = path.join(outDir, 'llms-full.txt');

  await fs.mkdir(outDir);

  try {
    await fs.writeFile(llmsPath, llmsTxt);
  } catch (err) {
    throw new FsWriteError(llmsPath, err);
  }

  try {
    await fs.writeFile(llmsFullPath, llmsFullTxt);
  } catch (err) {
    throw new FsWriteError(llmsFullPath, err);
  }

  // 8.4 Log success summary and next steps
  logger.success(`Generated ${llmsPath}`);
  logger.success(`Generated ${llmsFullPath}`);
  logger.nextSteps([
    'Run `geo-ai validate` to check your output files',
    'Deploy the files to your public directory',
    'Add `geo-ai generate` to your build pipeline',
    'Run `geo-ai inspect` to preview your configuration',
  ]);
}
