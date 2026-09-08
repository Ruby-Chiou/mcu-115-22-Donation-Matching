import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyListComponent } from './daily-list.component';

describe('DailyListComponent', () => {
  let component: DailyListComponent;
  let fixture: ComponentFixture<DailyListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
