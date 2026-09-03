import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyOffShelfComponent } from './supply-off-shelf.component';

describe('SupplyOffShelfComponent', () => {
  let component: SupplyOffShelfComponent;
  let fixture: ComponentFixture<SupplyOffShelfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyOffShelfComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplyOffShelfComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
