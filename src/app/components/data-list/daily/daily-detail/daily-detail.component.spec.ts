import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyDetailComponent } from './daily-detail.component';

describe('DailyDetailComponent', () => {
  let component: DailyDetailComponent;
  let fixture: ComponentFixture<DailyDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
