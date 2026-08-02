import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyCreateComponent } from './supply-create.component';

describe('SupplyCreateComponent', () => {
  let component: SupplyCreateComponent;
  let fixture: ComponentFixture<SupplyCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplyCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
