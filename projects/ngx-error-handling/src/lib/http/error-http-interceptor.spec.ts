import { firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  HttpClient,
  HttpErrorResponse,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  errorHttpInterceptor,
  ErrorHttpInterceptorConfiguration,
  ErrorHttpInterceptorOptions,
} from './error-http-interceptor';

describe('ErrorHttpInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let mockErrorHandler: jasmine.Spy<(error: unknown) => void>;
  let mockHandles: jasmine.Spy<
    (error: unknown, req: HttpRequest<unknown>) => boolean
  >;

  beforeEach(() => {
    mockErrorHandler = jasmine.createSpy('mockErrorHandler');
    mockHandles = jasmine.createSpy('mockHandles').and.returnValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorHttpInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ErrorHttpInterceptorConfiguration,
          useValue: new ErrorHttpInterceptorConfiguration({
            handles: mockHandles,
            onError: mockErrorHandler,
          }),
        },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should handle error and call onError if handles returns true', async () => {
    const errorContents = { status: 404, statusText: 'Not Found' };
    const errorResponse = new HttpErrorResponse(errorContents);

    const result = firstValueFrom(httpClient.get('/data'));
    httpTestingController.expectOne('/data').flush(null, errorResponse);

    const expectedError = {
      ...errorContents,
      __handled: true,
    };
    // même si errorInterceptor gère l'erreur, il continue à la propager à l'appelant
    await expectAsync(result).toBeRejectedWith(
      jasmine.objectContaining(expectedError),
    );
    expect(mockErrorHandler).toHaveBeenCalledWith(
      jasmine.objectContaining(expectedError),
    );
    httpTestingController.verify();
  });

  it('should propagate error if handles returns false', async () => {
    mockHandles.and.returnValue(false); // Change behavior to return false
    const errorContents = { status: 500, statusText: 'Internal Server Error' };

    const errorResponse = new HttpErrorResponse(errorContents);

    const result = firstValueFrom(httpClient.get('/data'));
    httpTestingController.expectOne('/data').flush(null, errorResponse);

    const expectedError = {
      ...errorContents,
    };

    await expectAsync(result).toBeRejectedWith(
      jasmine.objectContaining(expectedError),
    );
    expect(mockErrorHandler).not.toHaveBeenCalled();
    httpTestingController.verify();
  });
});
