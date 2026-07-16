import { TestBed } from '@angular/core/testing';

import { DisasterDemandService } from './disaster-demand.service';

describe('DisasterDemandService', () => {
  let service: DisasterDemandService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DisasterDemandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
