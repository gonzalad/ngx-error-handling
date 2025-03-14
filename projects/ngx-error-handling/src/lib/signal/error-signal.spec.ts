import { SignalErrorOptions } from './error-signal';
import { TestBed } from '@angular/core/testing';
import { safeSignal, SignalErrorConfiguration } from './error-signal';
import { Subject } from 'rxjs';

describe('ErrorSignal', () => {
  let mockErrorHandler: jasmine.Spy<(error: unknown) => void>;

  beforeEach(() => {
    mockErrorHandler = jasmine.createSpy('mockErrorHandler');
  });

  describe('Without global config', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [],
        providers: [],
      });
    });

    it('should send error to onError', () => {
      const error = new Error('une erreur');
      const signal = TestBed.runInInjectionContext(() =>
        safeSignal(
          () => {
            throw error;
          },
          {
            onError: mockErrorHandler,
            fallback: undefined,
          },
        ),
      );

      const result = signal();

      expect(result).toBeUndefined();
      expect(mockErrorHandler).toHaveBeenCalledOnceWith(error);
    });

    const safeSignalTestCases: {
      name: string;
      options: SignalErrorOptions<any>;
      expectedError?: boolean;
      expectedValue?: any;
    }[] = [
      {
        name: 'should throw error if onError is undefined',
        options: {
          onError: undefined,
          fallback: undefined,
        },
        expectedError: true,
      },
      {
        name: 'should send error to onError',
        options: {
          onError: (e: unknown) => mockErrorHandler(e),
        },
        expectedValue: undefined,
      },
      {
        name: 'should send error to onError and use explicit fallback value',
        options: {
          onError: (e: unknown) => mockErrorHandler(e),
          fallback: '1',
        },
        expectedValue: '1',
      },
    ];
    safeSignalTestCases.forEach((testCase) => {
      it(`signal: ${testCase.name}`, () => {
        const error = new Error('some error');
        const signal = TestBed.runInInjectionContext(() =>
          safeSignal(() => {
            throw error;
          }, testCase.options),
        );

        const result = () => signal();

        if (testCase.expectedError === true) {
          expect(result).toThrowError();
          expect(mockErrorHandler).not.toHaveBeenCalled();
        } else {
          expect(result()).toEqual(testCase.expectedValue);
          expect(mockErrorHandler).toHaveBeenCalledOnceWith(error);
        }
      });

      it(`observable: ${testCase.name}`, () => {
        const error = new Error('some error');
        const subject = new Subject();
        const signal = TestBed.runInInjectionContext(() =>
          safeSignal(subject, testCase.options),
        );
        subject.error(error);

        const result = () => signal();

        if (testCase.expectedError === true) {
          expect(result).toThrowError();
          expect(mockErrorHandler).not.toHaveBeenCalled();
        } else {
          expect(result()).toEqual(testCase.expectedValue);
          expect(mockErrorHandler).toHaveBeenCalledOnceWith(error);
        }
      });
    });

    it('should throw error if onError is undefined', () => {
      const error = new Error('some error');
      const signal = TestBed.runInInjectionContext(() =>
        safeSignal(
          () => {
            throw error;
          },
          {
            onError: undefined,
            fallback: undefined,
          },
        ),
      );

      const result = () => signal();

      expect(result).toThrowError();
      expect(mockErrorHandler).not.toHaveBeenCalled();
    });
  });

  describe('With global config', () => {
    let signalErrorConfiguration: jasmine.SpyObj<SignalErrorConfiguration>;

    beforeEach(() => {
      signalErrorConfiguration = jasmine.createSpyObj(
        'SignalErrorConfiguration',
        ['options'],
      );

      TestBed.configureTestingModule({
        imports: [],
        providers: [
          {
            provide: SignalErrorConfiguration,
            useValue: signalErrorConfiguration,
          },
        ],
      });
    });

    it('should send error to onError using value from default config', () => {
      signalErrorConfiguration.options = {
        onError: mockErrorHandler,
        fallback: '1',
      };
      const error = new Error('some error');
      const signal = TestBed.runInInjectionContext<any>(() =>
        safeSignal(() => {
          throw error;
        }),
      );

      const result = signal();

      expect(result).toEqual('1');
      expect(mockErrorHandler).toHaveBeenCalledOnceWith(error);
    });

    it('toSafeSignal should send error to onError using value from default config', () => {
      signalErrorConfiguration.options = {
        onError: mockErrorHandler,
        fallback: '1',
      };
      const error = new Error('some error');
      const subject = new Subject();
      const signal = TestBed.runInInjectionContext(() => safeSignal(subject));
      subject.error(error);

      const result = signal();

      expect(result).toEqual('1');
      expect(mockErrorHandler).toHaveBeenCalledOnceWith(error);
    });
  });
});
