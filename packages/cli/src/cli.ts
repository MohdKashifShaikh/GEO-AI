import { createRequire } from 'node:module';
import { parseArgs } from './lib/args.js';
import { createLogger } from './lib/logger.js';
import { CliError } from './lib/errors.js';
import { nodeFsAdapter } from './lib/fs.js';
import { runInit } from './commands/init.js';
import { runGenerate } from './commands/generate.js';
import { runValidate } from './commands/validate.js';
import { runInspect } from './commands/inspect.js';
import type { Command } from './lib/args.js';

const logger = createLogger(process.env['DEBUG'] === 'geo-ai');

// Read version from package.json via createRequire (works in ESM)
const require = createRequire(import.meta.url);

function printVersion(): void {
  const pkg = require('../package.json') as { version: string };
  process.stdout.write(pkg.version + '\n');
}

function printHelp(): void {
  process.stdout.write(
    [
      'Usage: geo-ai <command> [options]',
      '',
      'Commands:',
      '  init       Scaffold a starter geo-ai.config.ts in the current directory',
      '  generate   Generate llms.txt and llms-full.txt from your config',
      '  validate   Check that your GEO AI output files are present and valid',
      '  inspect    Preview your configuration and output targets',
      '',
      'Options:',
      '  -h, --help     Show help',
      '  -v, --version  Show version',
      '',
      'Run `geo-ai <command> --help` for command-specific help.',
      '',
    ].join('\n'),
  );
}

function printCommandHelp(command: Command): void {
  const lines: string[] = [];

  switch (command) {
    case 'init':
      lines.push(
        'Usage: geo-ai init',
        '',
        'Scaffold a starter geo-ai.config.ts in the current directory.',
        'If a config file already exists, the command exits without overwriting it.',
        '',
        'Options:',
        '  -h, --help  Show this help',
      );
      break;

    case 'generate':
      lines.push(
        'Usage: geo-ai generate [options]',
        '',
        'Generate llms.txt and llms-full.txt from your geo-ai config.',
        '',
        'Options:',
        '  --config <path>  Path to config file (default: auto-discover geo-ai.config.ts)',
        '  --out <path>     Output directory (default: ./public)',
        '  -h, --help       Show this help',
      );
      break;

    case 'validate':
      lines.push(
        'Usage: geo-ai validate [options]',
        '',
        'Check that your GEO AI output files are present and have valid content.',
        '',
        'Options:',
        '  --path <dir>  Local directory to check (default: ./public)',
        '  --url <url>   Remote base URL to fetch and validate',
        '  -h, --help    Show this help',
      );
      break;

    case 'inspect':
      lines.push(
        'Usage: geo-ai inspect [options]',
        '',
        'Preview your configuration: site info, crawler rules, and resource sections.',
        '',
        'Options:',
        '  --config <path>  Path to config file (default: auto-discover geo-ai.config.ts)',
        '  --url <url>      Fetch and display remote llms.txt / llms-full.txt instead',
        '  -h, --help       Show this help',
      );
      break;
  }

  process.stdout.write(lines.join('\n') + '\n');
}

async function main(): Promise<void> {
  const result = parseArgs(process.argv.slice(2));

  if (!result.ok) {
    logger.error(result.error);
    process.exit(1);
  }

  const { args } = result;

  // --version takes priority over everything
  if (args.version) {
    printVersion();
    process.exit(0);
  }

  // Show help when no arguments or --help/-h
  if (args.help || args.command === null) {
    if (args.command !== null) {
      printCommandHelp(args.command);
    } else {
      printHelp();
    }
    process.exit(0);
  }

  switch (args.command) {
    case 'init':
      await runInit(process.cwd(), nodeFsAdapter, logger);
      break;
    case 'generate':
      await runGenerate(process.cwd(), args, nodeFsAdapter, logger);
      break;
    case 'validate': {
      const { results, exitCode } = await runValidate(args, nodeFsAdapter, fetch);
      for (const r of results) {
        if (r.status === 'pass') {
          logger.success(r.target);
        } else if (r.status === 'warn') {
          logger.warn(r.message);
        } else {
          logger.error(r.message);
        }
      }
      process.exit(exitCode);
      break;
    }
    case 'inspect':
      await runInspect(process.cwd(), args, nodeFsAdapter, fetch, logger);
      break;
  }
}

main().catch((err: unknown) => {
  const exitCode = err instanceof CliError ? err.exitCode : 2;
  const message = err instanceof Error ? err.message : String(err);
  logger.error(message, err);
  process.exit(exitCode);
});
