import {
  HttpEvent,
  HttpHandler,
  HttpHandlerFn,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { HandledError } from '../error.model';

export interface ErrorHttpInterceptorOptions {
  handles?: (error: unknown, req: HttpRequest<unknown>) => boolean;
  onError?: (error: unknown) => void;
}

export class ErrorHttpInterceptorConfiguration {
  constructor(public options: ErrorHttpInterceptorOptions = {}) {}
}

/**
 * HTTP interceptor that allows handling errors.
 *
 * When an error is generated, this interceptor catches it and executes
 * the following processes:
 *
 * - checks if the interceptor should handle the error (via call to `options.handles(err, req)`).
 *   - if `handles` returns false, the interceptor propagates the error and does nothing more.
 *     This scenario typically occurs when one wants to handle the error at the application level
 *     and not in a transversal manner.
 *   - if `handles` returns true, then the interceptor moves to the next step.
 * - calls `options.onError(err)`
 *   The idea is that `onError` calls a centralized error management service (i.e. `ErrorBus`).
 * - indicates that the error has been handled (adding the property `__handled` to true in the error)
 * - regenerates the original error
 *   The idea here is that interceptors must return something in all cases.
 *   Rather than returning a default value (which would break the caller), we let
 *   the error propagate.
 *   The Angular errorHandler will be responsible for checking that the error has already been handled (property `__handled`)
 *
 * The `options` are defined by the `ErrorHttpInterceptorConfiguration` service.
 */
export function errorHttpInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) {
  const options = inject(ErrorHttpInterceptorConfiguration).options ?? {};
  return next(req).pipe(
    catchError((err) => {
      if (options.handles?.(err, req) && options.onError) {
        options.onError(err);
        // avoids handling the error multiple times (i.e. at the ErrorHandler level)
        (err as HandledError).__handled = true;
      }
      return throwError(() => err);
    }),
  );
}

/**
 * Identical to `errorHttpInterceptor()`
 */
export class ErrorHttpInterceptor implements HttpInterceptor {
  intercept(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req: HttpRequest<any>,
    next: HttpHandler,
  ): // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Observable<HttpEvent<any>> {
    return errorHttpInterceptor(req, (req) => next.handle(req));
  }
}
