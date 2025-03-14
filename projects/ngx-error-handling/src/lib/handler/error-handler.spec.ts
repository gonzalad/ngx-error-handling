import { ErrorBus } from '../bus/error-bus';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { NgxErrorHandler } from './error-handler';

describe('ErrorHandler', () => {
  let errorBus: jasmine.SpyObj<ErrorBus>;
  let errorHandler: NgxErrorHandler;

  beforeEach(() => {
    errorBus = jasmine.createSpyObj('ErrorBus', ['onError']);
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: ErrorBus, useValue: errorBus },
        { provide: NgxErrorHandler },
      ],
    });
    errorHandler = TestBed.inject(NgxErrorHandler);
  });

  it('should send error to errorBus', fakeAsync(() => {
    const error = new Error('my error');

    errorHandler.handleError(error);

    expect(errorBus.onError).toHaveBeenCalledWith(error);
  }));

  it('should not send error if it was already handled', fakeAsync(() => {
    const error = new Error('my error');
    (error as any).__handled = true;

    errorHandler.handleError(error);

    expect(errorBus.onError).not.toHaveBeenCalled();
  }));
});
