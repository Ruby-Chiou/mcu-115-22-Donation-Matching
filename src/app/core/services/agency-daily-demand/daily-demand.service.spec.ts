import { TestBed } from '@angular/core/testing';

import { DailyDemandService } from './daily-demand.service';

describe('DailyDemandService', () => {
  let service: DailyDemandService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyDemandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
