import { EnvironmentProviders, ErrorHandler, Provider } from '@angular/core';
import { ErrorBus, ErrorBusConfigurationParameters } from './bus/error-bus';
import {
  SignalErrorConfiguration,
  SignalErrorOptions,
} from './signal/error-signal';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ErrorHttpInterceptorConfiguration,
  ErrorHttpInterceptorOptions,
} from './http/error-http-interceptor';
import { NgxErrorHandler } from './handler/error-handler';

export interface NgxErrorConfigurationParameters {
  bus?: {
    options?: ErrorBusConfigurationParameters;
  };
  monitors?: {
    signal?: {
      /**
       * Default value true
       */
      enabled?: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options?: SignalErrorOptions<any>;
    };
    http?: {
      /**
       * Default value true
       */
      enabled?: boolean;
      options?: ErrorHttpInterceptorOptions;
    };
    errorHandler?: {
      /**
       * Default value true
       */
      enabled?: boolean;
    };
  };
}

export class DefaultErrorHttpInterceptorConfiguration extends ErrorHttpInterceptorConfiguration {
  #ignoredStatusCode = new Set([400, 412]);

  constructor(errorBus: ErrorBus) {
    super({
      onError: (error) => errorBus.onError(error),
      handles: (error) => this.#handlesError(error),
    });
  }

  #handlesError(error: unknown): boolean {
    if (error instanceof HttpErrorResponse) {
      const statusCode = error.status;
      return !this.#ignoredStatusCode.has(statusCode);
    }
    return true;
  }
}

function signalErrorConfiguration(config?: NgxErrorConfigurationParameters) {
  return (errorBus: ErrorBus): SignalErrorConfiguration => {
    return config?.monitors?.signal?.options
      ? new SignalErrorConfiguration(config.monitors.signal.options)
      : new SignalErrorConfiguration({
          fallback: undefined,
          onError: (error) => errorBus.onError(error),
        });
  };
}

function errorHttpInterceptorConfiguration(
  config?: NgxErrorConfigurationParameters,
) {
  return (errorBus: ErrorBus): ErrorHttpInterceptorConfiguration => {
    return config?.monitors?.http?.options
      ? new ErrorHttpInterceptorConfiguration(config.monitors.http.options)
      : new DefaultErrorHttpInterceptorConfiguration(errorBus);
  };
}

function isEnabled(activable: { enabled?: boolean } | undefined) {
  return activable?.enabled == null || activable.enabled === true;
}

function provideIf(condition: () => boolean, provider: Provider): Provider[] {
  return condition() ? [provider] : [];
}

export function provideErrorHandler(
  config?: NgxErrorConfigurationParameters,
): (Provider | EnvironmentProviders)[] {
  return [
    ErrorBus,
    ...provideIf(() => isEnabled(config?.monitors?.errorHandler), {
      provide: ErrorHandler,
      useClass: NgxErrorHandler,
    }),
    ...provideIf(() => isEnabled(config?.monitors?.signal), {
      provide: SignalErrorConfiguration,
      useFactory: (errorBus: ErrorBus) =>
        signalErrorConfiguration(config)(errorBus),
      deps: [ErrorBus],
    }),
    ...provideIf(() => isEnabled(config?.monitors?.http), {
      provide: ErrorHttpInterceptorConfiguration,
      useFactory: (errorBus: ErrorBus) =>
        errorHttpInterceptorConfiguration(config)(errorBus),
      deps: [ErrorBus],
    }),
  ];
}
