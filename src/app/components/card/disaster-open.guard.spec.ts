import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { disasterOpenGuard } from './disaster-open.guard';

describe('disasterOpenGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => TestBed.runInInjectionContext(() => disasterOpenGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
