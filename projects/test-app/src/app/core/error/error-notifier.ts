import { inject, Injectable } from '@angular/core';
import { ErrorBus } from '@gonzal/ngx-error-handling';

@Injectable({ providedIn: 'root' })
export class ErrorNotifier {
  #errorBus = inject(ErrorBus);

  constructor() {
    this.#errorBus.getErrorStream().subscribe((error) => this.#notify(error));
  }

  #notify(error: Error) {
    // or whatever other error reporting mechanism you want to use
    console.log(error);
  }
}
