import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelperSortBarComponent } from './helper-sort-bar.component';

describe('HelperSortBarComponent', () => {
  let component: HelperSortBarComponent;
  let fixture: ComponentFixture<HelperSortBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelperSortBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HelperSortBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
