import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyBatchEditComponent } from './supply-batch-edit.component';

describe('SupplyBatchEditComponent', () => {
  let component: SupplyBatchEditComponent;
  let fixture: ComponentFixture<SupplyBatchEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyBatchEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplyBatchEditComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
