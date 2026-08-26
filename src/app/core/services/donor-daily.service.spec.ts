import { TestBed } from '@angular/core/testing';

import { DonorDailyService } from './donor-daily.service';

describe('DonorDailyService', () => {
  let service: DonorDailyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DonorDailyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
