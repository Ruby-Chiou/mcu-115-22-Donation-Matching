import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyLocationsComponent } from './daily-locations.component';

describe('DailyLocationsComponent', () => {
  let component: DailyLocationsComponent;
  let fixture: ComponentFixture<DailyLocationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyLocationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyLocationsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
