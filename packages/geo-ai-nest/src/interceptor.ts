import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GeoAIService } from './service';

@Injectable()
export class GeoAIInterceptor implements NestInterceptor {
  constructor(@Inject(GeoAIService) private readonly geoAI: GeoAIService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = context.switchToHttp().getResponse<any>();
    return next.handle().pipe(
      tap(() => {
        res.setHeader('Link', this.geoAI.generateLinkHeader());
      }),
    );
  }
}
