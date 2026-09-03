import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyOnShelfComponent } from './supply-on-shelf.component';

describe('SupplyOnShelfComponent', () => {
  let component: SupplyOnShelfComponent;
  let fixture: ComponentFixture<SupplyOnShelfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyOnShelfComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplyOnShelfComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
