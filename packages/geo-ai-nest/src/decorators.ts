// Feature: geo-ai-nest — @IsAIBot() and @GeoAIMeta() decorators
import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { BotRulesEngine } from 'geo-ai-core';

// Module-level singleton — createParamDecorator runs outside the DI container,
// so we cannot inject GeoAIService here. This is intentional (see design doc).
const botRules = new BotRulesEngine();

export const IsAIBot = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const req = ctx.switchToHttp().getRequest<any>();
    // Truncate User-Agent to prevent memory abuse
    const rawUa: string = req.headers?.['user-agent'] ?? req.raw?.headers?.['user-agent'] ?? '';
    const ua = rawUa.slice(0, 1024);
    return botRules.detectBot(ua);
  },
);

export const GEO_AI_META_KEY = 'geo-ai-meta';

export const GeoAIMeta = (value: unknown) => SetMetadata(GEO_AI_META_KEY, value);
