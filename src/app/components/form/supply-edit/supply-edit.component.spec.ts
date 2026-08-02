import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyEditComponent } from './supply-edit.component';

describe('SupplyEditComponent', () => {
  let component: SupplyEditComponent;
  let fixture: ComponentFixture<SupplyEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplyEditComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
