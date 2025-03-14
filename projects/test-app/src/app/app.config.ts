import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  errorHttpInterceptor,
  provideErrorHandler,
} from '@gonzal/ngx-error-handling';
import { ErrorNotifier } from './core/error/error-notifier';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideErrorHandler(),
    provideHttpClient(withInterceptors([errorHttpInterceptor])),
    // instantiates the ErrorNotifier at app at startup
    provideAppInitializer(() => {
      inject(ErrorNotifier);
    }),
  ],
};
