import { TestBed } from '@angular/core/testing';

import { DailyDonationService } from './daily-donation.service';

describe('DailyDonationService', () => {
  let service: DailyDonationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyDonationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
