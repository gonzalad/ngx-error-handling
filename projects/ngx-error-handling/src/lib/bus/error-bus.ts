import { Injectable, Optional } from '@angular/core';
import { Observable, Subject, throttleTime } from 'rxjs';

export interface ErrorBusConfigurationParameters {
  /**
   * error throttling in ms
   *
   * Default value : 2000 ms
   */
  throttle?: number;
}

const DEFAULT_THROTTLE = 2000;

export class ErrorBusConfiguration {
  constructor(
    public parameters: ErrorBusConfigurationParameters = {
      throttle: DEFAULT_THROTTLE,
    },
  ) {}
}

/**
 * Centralized error management service.
 *
 * This service:
 *
 * - must be alerted as soon as an error is detected (method `onError(error)`).
 * - allows any component to be notified of the occurrence of an error
 *   (by subscribing to the observable `getErrorStream()`).
 *   Typically, a notification component will listen to this observable
 *   to display errors in a toaster.
 *
 * Note that this service:
 *
 * - logs all errors.
 * - implements a throttling mechanism (configurable, default 3s).
 *   If an error has already been emitted less than `throttle` ms ago, then it
 *   is not transmitted to the observable `getErrorStream()`.
 *   This prevents freezing the application in the case of spurious errors.
 *
 * The configuration can be modified via the `ErrorBusConfiguration` service.
 */
@Injectable()
export class ErrorBus {
  #errorStream = new Subject<Error>();
  #errorStream$: Observable<Error>;

  constructor(@Optional() configuration?: ErrorBusConfiguration) {
    const parameters: ErrorBusConfigurationParameters =
      configuration?.parameters ?? new ErrorBusConfiguration().parameters;
    this.#errorStream$ = parameters.throttle
      ? this.#errorStream.pipe(throttleTime(parameters.throttle))
      : this.#errorStream;
  }

  onError(error: unknown) {
    this.#logError(error);
    this.#errorStream.next(error as Error);
  }

  getErrorStream(): Observable<Error> {
    return this.#errorStream$;
  }

  #logError(error: unknown) {
    console.log(error);
  }
}
