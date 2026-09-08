import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyFilterComponent } from './supply-filter.component';

describe('SupplyFilterComponent', () => {
  let component: SupplyFilterComponent;
  let fixture: ComponentFixture<SupplyFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplyFilterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
