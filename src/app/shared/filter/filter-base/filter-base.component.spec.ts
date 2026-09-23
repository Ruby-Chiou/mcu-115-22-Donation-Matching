import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterBaseComponent } from './filter-base.component';

describe('FilterBaseComponent', () => {
  let component: FilterBaseComponent;
  let fixture: ComponentFixture<FilterBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterBaseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBaseComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
