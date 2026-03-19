import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { GeoAIService } from './service';

@Injectable()
export class GeoAIGuard implements CanActivate {
  constructor(@Inject(GeoAIService) private readonly geoAI: GeoAIService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<any>();
    // Truncate User-Agent to prevent memory abuse
    const rawUa: string = req.headers?.['user-agent'] ?? req.raw?.headers?.['user-agent'] ?? '';
    const ua = rawUa.slice(0, 1024);
    return this.geoAI.isAIBot(ua) !== null;
  }
}
