import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DonorDonationHistoryService } from '../../../core/services/member-center/donor-donation-history.service';
import { TrackingComponent } from './tracking.component';

describe('TrackingComponent', () => {
  let component: TrackingComponent;
  let fixture: ComponentFixture<TrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingComponent],
      providers: [
        provideRouter([]),
        {
          provide: DonorDonationHistoryService,
          useValue: {
            records: () => [],
            loadHistory: async () => [],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
