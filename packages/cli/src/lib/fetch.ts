import { NetworkError } from './errors.js';

export type SafeFetchResult =
  | { ok: true; text: string }
  | { ok: false; timedOut: true }
  | { ok: false; tooLarge: true }
  | { ok: false; httpStatus: number };

/**
 * Fetches a URL with a timeout and response body size limit.
 * Returns a structured result — never calls process.exit().
 *
 * @param url       - URL to fetch
 * @param fetchFn   - fetch implementation (injectable for testing)
 * @param timeoutMs - abort after this many ms (default: 10 000)
 * @param maxBytes  - reject bodies larger than this (default: 1 MiB)
 */
export async function safeFetch(
  url: string,
  fetchFn: typeof globalThis.fetch,
  timeoutMs = 10_000,
  maxBytes = 1_048_576,
): Promise<SafeFetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchFn(url, { signal: controller.signal });

    if (!res.ok) {
      return { ok: false, httpStatus: res.status };
    }

    // Guard: null body (e.g. 204 No Content or environments without streaming)
    if (res.body === null) {
      return { ok: true, text: '' };
    }

    // Size-limited streaming body read
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, tooLarge: true };
      }
      chunks.push(value);
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder().decode(combined);
    return { ok: true, text };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, timedOut: true };
    }
    throw new NetworkError(url, err);
  } finally {
    clearTimeout(timer);
  }
}
