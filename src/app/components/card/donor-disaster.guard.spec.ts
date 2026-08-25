import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { donorDisasterGuard } from './donor-disaster.guard';

describe('donorDisasterGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => TestBed.runInInjectionContext(() => donorDisasterGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
