import { TestBed } from '@angular/core/testing';

import { VolunteerDemandService } from './volunteer-demand.service';

describe('VolunteerDemandService', () => {
  let service: VolunteerDemandService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VolunteerDemandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
