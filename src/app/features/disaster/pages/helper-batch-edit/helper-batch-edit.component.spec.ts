import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelperBatchEditComponent } from './helper-batch-edit.component';

describe('HelperBatchEditComponent', () => {
  let component: HelperBatchEditComponent;
  let fixture: ComponentFixture<HelperBatchEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelperBatchEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HelperBatchEditComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
