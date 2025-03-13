import { TestBed } from '@angular/core/testing';

import { NgxErrorHandlingService } from './ngx-error-handling.service';

describe('NgxErrorHandlingService', () => {
  let service: NgxErrorHandlingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxErrorHandlingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
