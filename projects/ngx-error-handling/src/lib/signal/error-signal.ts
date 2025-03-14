import { computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, Observable, of, throwError } from 'rxjs';

export interface SignalErrorOptions<T> {
  /**
   * Value returned if an error is caught and handled (if `onError` has been called).
   */
  fallback?: T;
  /**
   * Method called if an error occurs.
   *
   * If onError is undefined, the one defined in the default configuration (SignalErrorConfiguration) is used.
   *
   * If the default configuration does not define any `onError` behavior,
   * it falls back to Angular's native behavior (the error is propagated).
   */
  onError?: (error: unknown) => void;
}

export class SignalErrorConfiguration {
  constructor(public options: SignalErrorOptions<unknown> = {}) {}
}

type SignalOrObservableInput<T> = (() => T) | Observable<T>;

/**
 * This function allows handling errors triggered by
 * signals.
 *
 * **Signals and errors**
 * In the absence of this functionality, when a signal generates an
 * error, the error is hidden (memorized).
 * The error will be emitted on each read of the signal.
 * This implies that the same error can be triggered multiple times
 * when displaying an HTML page, and then at each `changeDetection`.
 *
 * **Behavior of the `safeSignal()` utility**:
 * `safeSignal` catches errors.
 * When an error is generated, `safeSignal()`:
 * - passes the error to `options.onError`
 * - returns the value `options.fallback` instead of the error.
 *
 * If `options.onError` is undefined, then the native behavior takes over (the exception is propagated).
 *
 * The `option` parameter is not mandatory.
 * If `option` is not specified, the default options are used.
 * The default options are defined by `SignalErrorConfiguration`, which must be
 * defined in the `providers` section of your application.
 *
 * @example &lt;caption>Basic example, without options (uses default options)&lt;/caption>
 * ```typescript
 * users = safeSignal(this.#userService.getUsers());
 * ```
 *
 * @example &lt;caption>Example with explicit options&lt;/caption>
 * ```typescript
 * users = safeSignal(this.#userService.getUsers(), {
 *      onError: (e) => console.error(e),
 *      fallback: undefined,
 * });
 * ```
 *
 * @example &lt;caption>Example with the combined use of toObservable()&lt;/caption>
 * ```typescript
 * user = safeSignal(
 *   toObservable(this.userId).pipe(
 *     switchMap((id) => this.#userService.getUser(id))
 *   )
 * );
 * ```
 *
 * @param input data source (Signal or Observable)
 * @param options (optional) composed of:
 *   - `onError`: method called when an error is generated.
 *     If `onError` is not defined, the `onError` from the default options is used.
 *     If `onError` is not defined in the default options, it falls back to the
 *     default behavior of Angular (the error will be hidden in the signal and generated
 *     on each read).
 *   - `fallback`: if `onError` is defined, then the `fallback` value is returned as
 *      the value of the signal. Note that this value is also used as
 *      the initial value of the signal.
 */
export function safeSignal<T, Fallback = undefined>(
  input: SignalOrObservableInput<T>,
  options: SignalErrorOptions<Fallback> = {},
): Signal<T | Fallback> {
  // optional because safeSignal must continue to work even
  // if error handling is disabled.
  // This allows testing with/without error handling without having to modify
  // the application code.
  const config = inject(SignalErrorConfiguration, { optional: true });

  const globalDefault = config?.options ?? {};
  const finalOptions: SignalErrorOptions<Fallback> = {
    fallback: options.fallback ?? (globalDefault.fallback as Fallback),
    onError: options.onError ?? globalDefault.onError,
  };
  if (input instanceof Observable) {
    return toSignal(
      input.pipe(
        catchError((e) => {
          if (!finalOptions?.onError) {
            // if onError is undefined we fallback to default angular behaviour
            return throwError(() => e);
          }
          finalOptions?.onError?.(e);
          return of(finalOptions.fallback);
        }),
      ),
      { initialValue: finalOptions.fallback },
    ) as Signal<T | Fallback>;
  }
  return computed(() => {
    try {
      return input();
    } catch (e) {
      if (!finalOptions?.onError) {
        throw e;
      }
      finalOptions?.onError?.(e);
      return finalOptions.fallback;
    }
  }) as Signal<T | Fallback>;
}
