import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyDetailComponent } from './supply-detail.component';

describe('SupplyDetailComponent', () => {
  let component: SupplyDetailComponent;
  let fixture: ComponentFixture<SupplyDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplyDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
