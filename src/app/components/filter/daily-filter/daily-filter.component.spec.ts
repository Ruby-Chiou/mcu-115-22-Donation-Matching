import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyFilterComponent } from './daily-filter.component';

describe('DailyFilterComponent', () => {
  let component: DailyFilterComponent;
  let fixture: ComponentFixture<DailyFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyFilterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
