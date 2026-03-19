import {
  Controller,
  Get,
  Header,
  Inject,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { GeoAIService } from './service';
import { GEO_AI_OPTIONS } from './constants';
import type { GeoAIOptions } from './interfaces';

@Controller()
export class GeoAIController {
  constructor(
    @Inject(GeoAIService) private readonly geoAI: GeoAIService,
    @Inject(GEO_AI_OPTIONS) private readonly options: GeoAIOptions,
  ) {}

  @Get('robots-ai.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getRobotsAi(@Res({ passthrough: true }) res: any): string {
    const maxAge = this.options.cacheMaxAge ?? 3600;
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    try {
      return this.geoAI.generateRobotsTxt();
    } catch {
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
