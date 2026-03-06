/**
 * Supported AI crawlers: bot User-Agent identifier → human-readable name.
 * Minimum 13 bots per spec requirement 3.1.
 */
export const AI_BOTS: Record<string, string> = {
  GPTBot: 'OpenAI / ChatGPT',
  'OAI-SearchBot': 'OpenAI / Copilot Search',
  ClaudeBot: 'Anthropic / Claude',
  'Google-Extended': 'Google / Gemini',
  PerplexityBot: 'Perplexity AI',
  DeepSeekBot: 'DeepSeek',
  GrokBot: 'xAI / Grok',
  'meta-externalagent': 'Meta / LLaMA',
  PanguBot: 'Alibaba / Qwen',
  YandexBot: 'Yandex / YandexGPT',
  SputnikBot: 'Sber / GigaChat',
  Bytespider: 'ByteDance / Douyin',
  Baiduspider: 'Baidu / ERNIE',
  'claude-web': 'Anthropic / Claude Web',
  Amazonbot: 'Amazon / Alexa',
  Applebot: 'Apple / Siri & Spotlight',
};

/** Default maximum words for content in llms-full.txt */
export const DEFAULT_MAX_CONTENT_WORDS = 200;

/** Default AI API requests per minute */
export const DEFAULT_RATE_LIMIT = 10;

/** Default items per batch in bulk AI generation */
export const DEFAULT_BATCH_SIZE = 5;

/** Default maximum items for bulk AI generation */
export const DEFAULT_MAX_ITEMS = 50;

/** Default maximum AI description length (characters) */
export const DEFAULT_MAX_DESCRIPTION_LENGTH = 200;

/** Default prompt template for AI description generation */
export const DEFAULT_PROMPT = `Write a concise AI-optimized description (max 200 characters) for the following {type}.

Title: {title}
Content: {content}
Price: {price}
Category: {category}

The description should be informative, keyword-rich, and suitable for AI search engines. Focus on the key features and value proposition.`;
