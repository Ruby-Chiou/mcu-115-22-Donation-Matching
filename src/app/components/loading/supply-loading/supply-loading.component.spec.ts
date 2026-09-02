import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyLoadingComponent } from './supply-loading.component';

describe('SupplyLoadingComponent', () => {
  let component: SupplyLoadingComponent;
  let fixture: ComponentFixture<SupplyLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyLoadingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplyLoadingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
