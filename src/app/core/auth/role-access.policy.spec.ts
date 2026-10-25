import { RoleAccessPolicy } from './role-access.policy';
import { safeReturnUrl } from './safe-return-url';

describe('RoleAccessPolicy', () => {
  const policy = new RoleAccessPolicy();

  it('lets a guest read a demand detail and blocks the donate form', () => {
    expect(policy.canActivate('guest', '/donor/daily/detail/12')).toBe(true);
    expect(policy.canActivate('guest', '/donor/disaster/supply/detail/3')).toBe(true);
    expect(policy.decide('guest', '/donor/daily/form/12')).toBe('login');
    expect(policy.decide('guest', '/donor/history')).toBe('login');
    expect(policy.decide('guest', '/member')).toBe('login');
  });

  it('sends each signed-in role to its own home', () => {
    expect(policy.home('donor')).toBe('/home');
    expect(policy.home('agency')).toBe('/agency/dashboard');
    expect(policy.home('admin')).toBe('/admin/dashboard');
  });

  it('keeps agency, donor, and admin areas apart', () => {
    expect(policy.canActivate('donor', '/donor/daily/form/4')).toBe(true);
    expect(policy.decide('donor', '/agency/dashboard')).toBe('home');
    expect(policy.decide('agency', '/admin/dashboard')).toBe('home');
    expect(policy.decide('admin', '/agency/daily')).toBe('home');
    expect(policy.canActivate('agency', '/member')).toBe(true);
    expect(policy.canActivate('admin', '/admin/disaster-control')).toBe(true);
  });

  it('rejects external return urls', () => {
    expect(safeReturnUrl('/donor/daily/form/8')).toBe('/donor/daily/form/8');
    expect(safeReturnUrl('https://evil.example/steal')).toBeNull();
    expect(safeReturnUrl('//evil.example')).toBeNull();
    expect(safeReturnUrl('/login?next=/admin')).toBeNull();
  });
});