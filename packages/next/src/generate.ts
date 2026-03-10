import { createGeoAI } from 'geo-ai-core';
import type { GeoAIConfig } from 'geo-ai-core';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// ── Config ──────────────────────────────────────────────────────────

export interface GenerateLlmsFilesConfig extends GeoAIConfig {
  /** Output directory for generated files. Default: 'public' (relative to cwd) */
  outDir?: string;
  /** Locale for content generation */
  locale?: string;
}

export interface GenerateLlmsFilesResult {
  llmsPath: string;
  llmsFullPath: string;
}

// ── Generator ───────────────────────────────────────────────────────

/**
 * Generates `llms.txt` and `llms-full.txt` as static files in the output
 * directory (default: `public/`). Designed to be called from a build script
 * or `next.config.js` before `next build`.
 *
 * - Creates the output directory if it doesn't exist
 * - Overwrites existing files atomically (write to temp, then rename)
 * - Logs progress to stdout
 * - Throws on failure with a descriptive error
 *
 * @example
 * ```ts
 * // scripts/generate-llms.ts
 * import { generateLlmsFiles } from 'geo-ai-next';
 *
 * await generateLlmsFiles({
 *   siteName: 'My Site',
 *   siteUrl: 'https://example.com',
 *   provider: { Pages: [{ title: 'Home', url: '/' }] },
 * });
 * ```
 */
export async function generateLlmsFiles(
  config: GenerateLlmsFilesConfig,
): Promise<GenerateLlmsFilesResult> {
  const outDir = resolve(config.outDir ?? 'public');

  console.log(`[geo-ai] Generating llms files → ${outDir}`);

  const core = createGeoAI(config);

  // Ensure output directory exists
  await mkdir(outDir, { recursive: true });

  // Generate both variants
  const [llmsContent, llmsFullContent] = await Promise.all([
    core.generateLlms(false, config.locale),
    core.generateLlms(true, config.locale),
  ]);

  const llmsPath = join(outDir, 'llms.txt');
  const llmsFullPath = join(outDir, 'llms-full.txt');

  // Write files atomically: write temp then rename
  const tmpLlms = `${llmsPath}.tmp`;
  const tmpFull = `${llmsFullPath}.tmp`;

  try {
    await Promise.all([
      writeFile(tmpLlms, llmsContent, 'utf-8'),
      writeFile(tmpFull, llmsFullContent, 'utf-8'),
    ]);

    // Rename is atomic on most filesystems
    const { rename } = await import('node:fs/promises');
    await Promise.all([
      rename(tmpLlms, llmsPath),
      rename(tmpFull, llmsFullPath),
    ]);
  } catch (err) {
    // Clean up temp files on failure
    const { unlink } = await import('node:fs/promises');
    await unlink(tmpLlms).catch(() => {});
    await unlink(tmpFull).catch(() => {});
    throw err;
  }

  console.log(`[geo-ai] ✓ ${llmsPath} (${llmsContent.length} bytes)`);
  console.log(`[geo-ai] ✓ ${llmsFullPath} (${llmsFullContent.length} bytes)`);

  return { llmsPath, llmsFullPath };
}
