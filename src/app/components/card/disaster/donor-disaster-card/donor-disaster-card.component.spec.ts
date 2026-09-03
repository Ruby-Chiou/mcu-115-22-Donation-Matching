import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DonorDisasterCardComponent } from './donor-disaster-card.component';

describe('DonorDisasterCardComponent', () => {
  let component: DonorDisasterCardComponent;
  let fixture: ComponentFixture<DonorDisasterCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DonorDisasterCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(DonorDisasterCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
