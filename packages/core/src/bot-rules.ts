import { AI_BOTS } from './constants';

/**
 * Engine for managing AI crawler access rules and generating robots.txt directives.
 *
 * Default rule for bots without an explicit rule is `allow`.
 */
export class BotRulesEngine {
  constructor(private rules: Record<string, 'allow' | 'disallow'> = {}) {}

  /**
   * Generates a robots.txt block with User-agent / Allow / Disallow directives
   * for every bot in the AI_BOTS registry.
   */
  generateRobotsTxt(siteUrl: string): string {
    const url = siteUrl.replace(/\/$/, '');
    const lines: string[] = [];

    for (const bot of Object.keys(AI_BOTS)) {
      const rule = this.getRule(bot);
      lines.push(`User-agent: ${bot}`);
      if (rule === 'allow') {
        lines.push('Allow: /');
      } else {
        lines.push('Disallow: /');
      }
      lines.push('');
    }

    lines.push(`Sitemap: ${url}/sitemap.xml`);

    return lines.join('\n');
  }

  /**
   * Detects a known AI bot by matching User-Agent substrings from AI_BOTS.
   * Returns the bot identifier or `null` if no match.
   */
  detectBot(userAgent: string): string | null {
    for (const botId of Object.keys(AI_BOTS)) {
      if (userAgent.includes(botId)) {
        return botId;
      }
    }
    return null;
  }

  /** Returns the rule for a bot. Defaults to `'allow'` if not explicitly set. */
  getRule(botId: string): 'allow' | 'disallow' {
    return this.rules[botId] ?? 'allow';
  }

  /**
   * Generates status lines for the llms.txt "AI Crawler Rules" section.
   * Format: `- {BotId} ({DisplayName}): ✅ Allowed / ❌ Blocked`
   */
  getCrawlerStatusLines(): string[] {
    return Object.entries(AI_BOTS).map(([botId, displayName]) => {
      const rule = this.getRule(botId);
      const status = rule === 'allow' ? '✅ Allowed' : '❌ Blocked';
      return `- ${botId} (${displayName}): ${status}`;
    });
  }
}
