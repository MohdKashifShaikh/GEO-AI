/**
 * AiGenerator — AI description generation via Anthropic Claude or OpenAI.
 *
 * Separate entry point: `geo-ai-core/ai`
 * Supports single and bulk generation with rate limiting,
 * prompt template placeholders, and error classification.
 *
 * Requirements: 5.1–5.10
 */

import type {
  AiContext,
  AiBulkConfig,
  AiError,
  AiGeneratorConfig,
  AiProvider,
  Resource,
} from '../types';

import {
  DEFAULT_RATE_LIMIT,
  DEFAULT_BATCH_SIZE,
  DEFAULT_MAX_ITEMS,
  DEFAULT_MAX_DESCRIPTION_LENGTH,
  DEFAULT_PROMPT,
} from '../constants';

// Re-export types for consumers of geo-ai-core/ai
export type { AiContext, AiBulkConfig, AiError, AiGeneratorConfig, AiProvider };

// ── Rate limiter (sliding window) ────────────────────────────────────────

const RATE_WINDOW_MS = 60_000; // 1 minute

interface RateLimiterState {
  count: number;
  windowStart: number;
}

/**
 * Simple sliding-window rate limiter for AI API calls.
 * In-memory, per-process — not shared across instances.
 */
export class RateLimiter {
  private state: RateLimiterState;
  private limit: number;
  private _now: () => number;

  constructor(limit = DEFAULT_RATE_LIMIT, nowFn?: () => number) {
    this.limit = limit;
    this._now = nowFn ?? (() => Date.now());
    this.state = { count: 0, windowStart: this._now() };
  }

  /** Returns true if a request is allowed, false if rate-limited. */
  tryAcquire(): boolean {
    const now = this._now();
    if (now - this.state.windowStart >= RATE_WINDOW_MS) {
      this.state = { count: 0, windowStart: now };
    }
    if (this.state.count >= this.limit) {
      return false;
    }
    this.state.count++;
    return true;
  }

  /** Reset the limiter state. */
  reset(): void {
    this.state = { count: 0, windowStart: this._now() };
  }
}

// ── Prompt template ──────────────────────────────────────────────────────

/**
 * Replaces placeholders {title}, {content}, {type}, {price}, {category}
 * in the prompt template with actual values from the context.
 *
 * Uses function replacer to avoid issues with special replacement patterns
 * (e.g. `$` characters in values).
 */
export function buildPrompt(template: string, context: AiContext): string {
  return template
    .replace(/\{title\}/g, () => context.title ?? '')
    .replace(/\{content\}/g, () => context.content ?? '')
    .replace(/\{type\}/g, () => context.type ?? '')
    .replace(/\{price\}/g, () => context.price ?? '')
    .replace(/\{category\}/g, () => context.category ?? '');
}

// ── Error classification ─────────────────────────────────────────────────

/**
 * Classifies an AI provider HTTP error into a user-friendly category.
 */
export function classifyAiError(
  statusCode: number,
  body?: unknown,
): AiError {
  if (statusCode === 401 || statusCode === 403) {
    return {
      type: 'auth_error',
      message: 'Invalid API key. Please check your key in settings.',
      statusCode,
    };
  }
  if (statusCode === 429) {
    return {
      type: 'rate_limit',
      message: 'AI provider rate limit exceeded. Please wait and try again.',
      statusCode,
    };
  }
  if (statusCode >= 500) {
    return {
      type: 'server_error',
      message: 'AI service is temporarily unavailable. Please try later.',
      statusCode,
    };
  }
  return {
    type: 'unknown',
    message:
      (body as Record<string, Record<string, string>>)?.error?.message ??
      'Unknown AI provider error.',
    statusCode,
  };
}

// ── AiProviderError ──────────────────────────────────────────────────────

export class AiProviderError extends Error {
  readonly type: AiError['type'];
  readonly statusCode?: number;

  constructor(error: AiError) {
    super(error.message);
    this.name = 'AiProviderError';
    this.type = error.type;
    this.statusCode = error.statusCode;
  }
}

// ── Fetch type ───────────────────────────────────────────────────────────

type FetchFn = typeof globalThis.fetch;

// ── AiGenerator ──────────────────────────────────────────────────────────

export class AiGenerator {
  private config: AiGeneratorConfig;
  private rateLimiter: RateLimiter;
  private _fetch: FetchFn;

  constructor(config: AiGeneratorConfig, fetchFn?: FetchFn) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit ?? DEFAULT_RATE_LIMIT);
    this._fetch = fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  private defaultModel(): string {
    return this.config.provider === 'anthropic'
      ? 'claude-sonnet-4-5-20250514'
      : 'gpt-4o-mini';
  }

  /** Generate a single AI description. */
  async generate(context: AiContext): Promise<string> {
    if (!this.rateLimiter.tryAcquire()) {
      throw new AiProviderError({
        type: 'rate_limit',
        message: 'Internal rate limit exceeded. Please wait before generating more descriptions.',
      });
    }

    const template = this.config.promptTemplate ?? DEFAULT_PROMPT;
    const prompt = buildPrompt(template, context);
    const model = this.config.model ?? this.defaultModel();
    const maxLen = this.config.maxDescriptionLength ?? DEFAULT_MAX_DESCRIPTION_LENGTH;

    const result =
      this.config.provider === 'anthropic'
        ? await this.callClaude(model, prompt)
        : await this.callOpenAI(model, prompt);

    return result.slice(0, maxLen);
  }

  // ── Provider calls ───────────────────────────────────────────────────

  private async callClaude(model: string, prompt: string): Promise<string> {
    let response: Response;
    try {
      response = await this._fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 256,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } catch {
      throw new AiProviderError({
        type: 'network_error',
        message: 'Failed to connect to Anthropic API.',
      });
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new AiProviderError(classifyAiError(response.status, body));
    }

    const body = await response.json();
    const text = body?.content?.[0]?.text;
    if (typeof text !== 'string') {
      throw new AiProviderError({
        type: 'unknown',
        message: 'Unexpected Claude API response format.',
      });
    }
    return text.trim();
  }

  private async callOpenAI(model: string, prompt: string): Promise<string> {
    let response: Response;
    try {
      response = await this._fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: 256,
            messages: [{ role: 'user', content: prompt }],
          }),
        },
      );
    } catch {
      throw new AiProviderError({
        type: 'network_error',
        message: 'Failed to connect to OpenAI API.',
      });
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new AiProviderError(classifyAiError(response.status, body));
    }

    const body = await response.json();
    const text = body?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      throw new AiProviderError({
        type: 'unknown',
        message: 'Unexpected OpenAI API response format.',
      });
    }
    return text.trim();
  }

  // ── Bulk generation ────────────────────────────────────────────────────

  /**
   * Bulk-generate AI descriptions for multiple contexts.
   * Processes in batches with progress callback.
   */
  async bulkGenerate(
    contexts: AiContext[],
    options?: AiBulkConfig,
  ): Promise<Array<{ context: AiContext; result: string | null; error?: AiError }>> {
    const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
    const maxItems = options?.maxItems ?? DEFAULT_MAX_ITEMS;
    const items = contexts.slice(0, maxItems);
    const results: Array<{ context: AiContext; result: string | null; error?: AiError }> = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      for (const ctx of batch) {
        try {
          const result = await this.generate(ctx);
          results.push({ context: ctx, result });
        } catch (err) {
          const aiErr: AiError =
            err instanceof AiProviderError
              ? { type: err.type, message: err.message, statusCode: err.statusCode }
              : { type: 'unknown', message: String(err) };
          results.push({ context: ctx, result: null, error: aiErr });
        }

        if (options?.onProgress) {
          options.onProgress(results.length, items.length, ctx as unknown as Resource);
        }
      }
    }

    return results;
  }
}
