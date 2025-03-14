import { ErrorBus, ErrorBusConfiguration } from './error-bus';
import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

describe('ErrorBus', () => {
  let notifier: jasmine.Spy<(e: Error) => void>;
  let errorBus: ErrorBus;
  let subscription: Subscription;
  let testScheduler: TestScheduler;

  describe('basic usage', () => {
    beforeEach(() => {
      notifier = jasmine.createSpy('notifier');
      TestBed.configureTestingModule({
        imports: [],
        providers: [{ provide: ErrorBus }],
      });
      errorBus = TestBed.inject(ErrorBus);
      subscription = errorBus.getErrorStream().subscribe((e) => notifier(e));

      // Initialize the TestScheduler
      testScheduler = new TestScheduler((actual, expected) => {
        expect(actual).toEqual(expected);
      });
    });

    afterEach(() => {
      subscription?.unsubscribe();
    });

    it('should send error to all notifiers', fakeAsync(() => {
      const error = new Error('my error');

      errorBus.onError(error);
      flush();

      expect(notifier).toHaveBeenCalledWith(error);
    }));
  });

  describe('throwTime test', () => {
    let testScheduler: TestScheduler;

    beforeEach(async () => {
      // Initialize the TestScheduler
      testScheduler = new TestScheduler((actual, expected) => {
        expect(actual).toEqual(expected);
      });
    });

    it('should throttle emitted values', () => {
      const errorBus = new ErrorBus(
        new ErrorBusConfiguration({
          throttle: 2,
        }),
      );

      // The expected marbles string should reflect the throttled emissions
      const expectedMarbles = '-a--c---d-';
      const expectedValues = {
        a: 'a',
        c: 'c',
        d: 'd',
      };

      // Schedule emissions with respect to the throttle time
      testScheduler.schedule(() => errorBus.onError('a'), 1); // Emit 'a' at time 1
      testScheduler.schedule(() => errorBus.onError('b'), 3); // Emit 'b' time 3 = 1 (a) + 2 (2 is in throttleTime range, hence it does not emit)
      testScheduler.schedule(() => errorBus.onError('c'), 4); // Emit 'c' after 6ms
      testScheduler.schedule(() => errorBus.onError('d'), 8); // Emit 'd' after 9ms

      testScheduler.run(({ expectObservable }) => {
        expectObservable(errorBus.getErrorStream()).toBe(
          expectedMarbles,
          expectedValues,
        );
      });
    });
  });
});
