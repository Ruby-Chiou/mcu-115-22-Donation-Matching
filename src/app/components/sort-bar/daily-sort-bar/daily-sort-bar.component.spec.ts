import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailySortBarComponent } from './daily-sort-bar.component';

describe('DailySortBarComponent', () => {
  let component: DailySortBarComponent;
  let fixture: ComponentFixture<DailySortBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailySortBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailySortBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
