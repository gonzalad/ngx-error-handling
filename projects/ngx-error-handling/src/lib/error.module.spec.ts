import { ErrorBus } from './bus/error-bus';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { SignalErrorConfiguration } from './signal/error-signal';
import { ErrorHttpInterceptorConfiguration } from './http/error-http-interceptor';
import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideErrorHandler } from './error.module';

describe('ErrorModule', () => {
  describe('default configuration', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideErrorHandler(),
        ],
      });
    });

    it('verify providers configured', fakeAsync(() => {
      const errorBus = TestBed.inject(ErrorBus, null, { optional: true });
      expect(errorBus).toBeDefined();
      // ErrorHandler is not cleaned up between test cases, we comment the following assertion :
      // const errorHandler = TestBed.inject(ErrorHandler, null, { optional: true });
      // expect(errorHandler).toBeInstanceOf(NgxErrorHandler);
      const signalErrorConfiguration = TestBed.inject(
        SignalErrorConfiguration,
        null,
        { optional: true },
      );
      expect(signalErrorConfiguration).toBeDefined();
      const errorHttpInterceptorConfiguration = TestBed.inject(
        ErrorHttpInterceptorConfiguration,
        null,
        { optional: true },
      );
      expect(errorHttpInterceptorConfiguration).toBeDefined();
    }));
  });

  describe('custom configuration', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideErrorHandler({
            monitors: {
              signal: {
                options: {
                  fallback: '1',
                  onError: (e: unknown) => console.log(e),
                },
              },
              http: {
                options: {
                  handles: (e: unknown) =>
                    (e as Error).message.startsWith('filter'),
                  onError: (e: unknown) => console.log(e),
                },
              },
            },
          }),
        ],
      });
    });

    it('verify providers configured', fakeAsync(() => {
      const signalErrorConfiguration = TestBed.inject(
        SignalErrorConfiguration,
        null,
        { optional: true },
      );
      expect(signalErrorConfiguration).toBeDefined();
      expect(signalErrorConfiguration?.options.fallback).toEqual('1');
      expect(signalErrorConfiguration?.options.onError).toBeDefined();
      const errorHttpInterceptorConfiguration = TestBed.inject(
        ErrorHttpInterceptorConfiguration,
        null,
        { optional: true },
      );
      expect(errorHttpInterceptorConfiguration).toBeDefined();
      expect(errorHttpInterceptorConfiguration?.options.onError).toBeDefined();
      expect(errorHttpInterceptorConfiguration?.options.handles).toBeDefined();
      expect(
        errorHttpInterceptorConfiguration?.options?.handles?.(
          new Error('filtered'),
          {} as HttpRequest<any>,
        ),
      ).toBeTrue();
      expect(
        errorHttpInterceptorConfiguration?.options?.handles?.(
          new Error('not filtered'),
          {} as HttpRequest<any>,
        ),
      ).toBeFalse();
    }));
  });
});
