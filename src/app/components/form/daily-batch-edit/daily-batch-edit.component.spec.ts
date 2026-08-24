import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyBatchEditComponent } from './daily-batch-edit.component';

describe('DailyBatchEditComponent', () => {
  let component: DailyBatchEditComponent;
  let fixture: ComponentFixture<DailyBatchEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyBatchEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyBatchEditComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
