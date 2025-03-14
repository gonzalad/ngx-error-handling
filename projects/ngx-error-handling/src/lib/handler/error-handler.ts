import { ErrorHandler, inject, Injectable } from '@angular/core';
import { ErrorBus } from '../bus/error-bus';
import { HandledError } from '../error.model';

/**
 * Interface the Angular ErrorHandler with the ErrorBus.
 */
@Injectable()
export class NgxErrorHandler implements ErrorHandler {
  #errorBus = inject(ErrorBus);

  /**
   * Called by Angular when an error has not been caught.
   *
   * The implementation of the GlobalErrorHandler performs the following processes:
   *
   * - checks if the error has already been handled (does the property `__handled` exist
   *   and is it true)
   *   if the error has already been handled, GlobalErrorHandler ignores the error and does not process it.
   * - if the error has not been handled, it transmits the error to the centralized service (`EventBus`)
   *
   * @param error error transmitted by Angular
   */
  handleError(error: Error): void {
    try {
      if ((error as HandledError).__handled) {
        return;
      }
      this.#errorBus.onError(error);
    } catch (handlerError) {
      console.error('Error inside ErrorHandler:', handlerError);
    }
  }
}
