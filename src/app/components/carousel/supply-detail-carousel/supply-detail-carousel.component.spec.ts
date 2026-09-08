import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyDetailCarouselComponent } from './supply-detail-carousel.component';

describe('SupplyDetailCarouselComponent', () => {
  let component: SupplyDetailCarouselComponent;
  let fixture: ComponentFixture<SupplyDetailCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyDetailCarouselComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplyDetailCarouselComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
