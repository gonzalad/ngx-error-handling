/**
 * Formalizes the fact that an error has already been handled.
 *
 * Prevents the same error from being processed multiple times in a row.
 */
export interface HandledError {
  /**
   * true if the error has been handled
   */
  __handled?: boolean;
}
