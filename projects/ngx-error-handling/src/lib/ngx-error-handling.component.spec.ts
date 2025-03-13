import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxErrorHandlingComponent } from './ngx-error-handling.component';

describe('NgxErrorHandlingComponent', () => {
  let component: NgxErrorHandlingComponent;
  let fixture: ComponentFixture<NgxErrorHandlingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxErrorHandlingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxErrorHandlingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
