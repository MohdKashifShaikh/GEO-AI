import {
  DynamicModule,
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
  Type,
} from '@nestjs/common';
import { GEO_AI_ENGINE, GEO_AI_OPTIONS } from './constants';
import { GeoAIService } from './service';
import { GeoAIMiddleware } from './middleware';
import { GeoAIController } from './controller';
import { createGeoAI } from 'geo-ai-core';
import type { GeoAIOptions, GeoAIAsyncOptions, GeoAIOptionsFactory } from './interfaces';

@Module({})
export class GeoAIModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Always apply middleware unconditionally. The registerMiddleware flag is checked
    // inside GeoAIMiddleware.use() instead, because forRootAsync resolves options
    // asynchronously — configure() is called synchronously during module init, so
    // options would be undefined when using forRootAsync.
    consumer
      .apply(GeoAIMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }

  static forRoot(options: GeoAIOptions): DynamicModule {
    const providers = GeoAIModule.buildProviders(options);
    return GeoAIModule.buildModule(options, providers);
  }

  static forRootAsync(options: GeoAIAsyncOptions): DynamicModule {
    const asyncProviders = GeoAIModule.buildAsyncProviders(options);
    const engineProvider = {
      provide: GEO_AI_ENGINE,
      useFactory: (opts: GeoAIOptions) => createGeoAI(opts),
      inject: [GEO_AI_OPTIONS],
    };
    return GeoAIModule.buildModule(
      options as GeoAIOptions,
      [...asyncProviders, engineProvider],
    );
  }

  private static buildProviders(options: GeoAIOptions) {
    return [
      { provide: GEO_AI_OPTIONS, useValue: options },
      {
        provide: GEO_AI_ENGINE,
        useFactory: (opts: GeoAIOptions) => createGeoAI(opts),
        inject: [GEO_AI_OPTIONS],
      },
    ];
  }

  private static buildAsyncProviders(options: GeoAIAsyncOptions) {
    if (options.useFactory) {
      return [
        {
          provide: GEO_AI_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ];
    }
    const token = (options.useClass ?? options.useExisting) as Type<GeoAIOptionsFactory>;
    const providers: any[] = [
      {
        provide: GEO_AI_OPTIONS,
        useFactory: (factory: GeoAIOptionsFactory) => factory.createGeoAIOptions(),
        inject: [token],
      },
    ];
    if (options.useClass) {
      providers.push({ provide: token, useClass: token });
    }
    return providers;
  }

  private static buildModule(options: GeoAIOptions, providers: any[]): DynamicModule {
    const controllers = options.registerController !== false ? [GeoAIController] : [];
    const mod: DynamicModule = {
      module: GeoAIModule,
      imports: (options as GeoAIAsyncOptions).imports ?? [],
      controllers,
      providers: [...providers, GeoAIService, GeoAIMiddleware],
      exports: [GeoAIService],
    };
    if ((options as GeoAIOptions).isGlobal) {
      (mod as any).global = true;
    }
    return mod;
  }
}
