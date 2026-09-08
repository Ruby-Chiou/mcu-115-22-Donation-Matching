import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailySearchBarComponent } from './daily-search-bar.component';

describe('DailySearchBarComponent', () => {
  let component: DailySearchBarComponent;
  let fixture: ComponentFixture<DailySearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailySearchBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailySearchBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
