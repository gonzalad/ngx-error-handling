# NgxErrorHandling

I created this library to provide a way to handle all errors that can happen in an angular application.

Before the introduction of signals, I was using an ErrorHandler and everything worked.

Now, the issue raises when we use signals since they memoize the errors.

If an error is generated when the value of a signal is evaluated, this error is thrown everytime
the signal is read.

References:

* https://medium.com/netanelbasal/handling-errors-with-tosignal-in-angular-6500511c0d6f
* https://github.com/angular/angular/issues/51949

 

## In summary: what does it do?

It will automatically non-handled handle rxjs, signal and classic errors and make them available in a rx subject (`ErrorBus`)

* log these errors in the console (useful during development).
* display these errors to the user.

The components in the library are:

```
Sensor -> Centralized Service -> Notification
```

* Sensor is meant to capture the errors.  
  The sensors handle the errors. The default configuration sends the error to the Centralized Service.  
  The library provides 3 sensors :
  * ErrorHandler
  * Signal
  * Http Interceptor (not really interesting, the errorHandler does the same stuff).
* Centralized service  
  The centralized service is the `ErrorBus` component.  
  It is basically a rxjs `Subject` wrapper.  
  Any component can listen to the errors that are sent to the ErrorBus.
* Notification  
  This component is meant to report the error to the end user.  
  The library doesn't provide any implementation for it, since I think every application
  will have its own need. 
  The implementation will be straightforward :
  * listen to the ErrorBus
  * diplay the error in a toaster or similar component. 
    

## How to use this library ?

### Using everything

If you want to use all the stuff, you'll need to :

* register the providers from `provideErrorHandler()` in your app.config.
* provide you ErrorNotifier

.app.config.ts
```typescript
import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideErrorHandler } from '@gonzal/ngx-error-handling';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideErrorHandler(),
    provideHttpClient(withInterceptors([errorHttpInterceptor])),
    // instantiates your ErrorNotifier at startup
    provideAppInitializer(() => {
      inject(ErrorNotifier);
    })
  ],
};
```

.ErrorNotifier
```typescript
import { inject, Injectable } from "@angular/core";
import { ErrorBus } from '@gonzal/ngx-error-handling';

@Injectable({providedIn: 'root'})
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
```

### Using only what you need

You can also use only the captor you need (i.e. signal captor).

Moreon this in the captor section.


## Captors


### Signals

To capture the errors that can be thrown in a signal, you'll need to use `safeSignal()` method.

This will replace any occurence of `computed()` or `toSignal()`.

Sample usage :

.Safe signal evaluation
```typescript
value = input('');

computedValue = safeSignal(() => {
    const value = this.value();
    return this.#businessLogic(value);
  },
  {
    // value that will be returned by the signal if an error is thrown
    fallback: 'default value',
    // error handling mechanism
    onError: (e) => console.error(e);
  }
);
```


.Safe observable to signal conversion
```typescript
#userService = inject(UserService);

users = safeSignal(this.#userService.getUsers(),
  {
    // value that will be returned by the signal if an error is thrown
    fallback: [],
    // error handling mechanism
    onError: (e) => console.error(e);
  }
);
```

The options parameter is optional. If the parameter is undefined, `safeSignal` will just use the options from the provider `SignalErrorConfiguration`
if it is available (if you use `provideErrorHandler()`, this configuration class is already provided and configured to send the errors to the `ErrorBus`).

So a more realistic sample would be :

```typescript
value = input('');

computedValue = safeSignal(() => {
  const value = this.value();
  return this.#businessLogic(value);
});
```


.Safe observable to signal conversion
```typescript
#userService = inject(UserService);

users = safeSignal(this.#userService.getUsers(), { fallback: [] });
```

### Http Interceptor

`ErrorHttpInterceptor` catches all errors thrown by httpClient.

It the ask the `ErrorHttpInterceptorConfiguration` provider if it should handle the error.

If yes, it call the `onError` of the `ErrorHttpInterceptorConfiguration`, marks the error as handled and just rethrows the error.

If `ErrorHttpInterceptorConfiguration` is not provided, `ErrorHttpInterceptor` is just a noop interceptor.

Note that `provideErrorHandler()` already provides `ErrorHttpInterceptorConfiguration`.

### ErrorHandler

`NgxErrorHandler` just propagates any error to the `ErrorBus`.

## ErrorBus

This is a wrapper around a rxjs Subject.

To use it:

```typescript
import { inject, Injectable } from "@angular/core";
import { ErrorBus } from '@gonzal/ngx-error-handling';

@Injectable({providedIn: 'root'})
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
```
