import { TestBed } from '@angular/core/testing';

import { HelperDemandService } from './helper-demand.service';

describe('HelperDemandService', () => {
  let service: HelperDemandService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HelperDemandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
