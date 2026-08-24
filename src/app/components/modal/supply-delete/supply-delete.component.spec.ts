import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyDeleteComponent } from './supply-delete.component';

describe('SupplyDeleteComponent', () => {
  let component: SupplyDeleteComponent;
  let fixture: ComponentFixture<SupplyDeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyDeleteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplyDeleteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
