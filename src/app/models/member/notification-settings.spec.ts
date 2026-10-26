import { alertsInApp } from './notification-settings';

describe('in-app notification toggles', () => {
  const inApp = { system: false, agency: true, donation: false };

  it('hides closed categories from the bell and still alerts the open one', () => {
    expect(alertsInApp('SYSTEM', inApp)).toBeFalse();
    expect(alertsInApp('DONATION', inApp)).toBeFalse();
    expect(alertsInApp('AGENCY', inApp)).toBeTrue();
  });

  it('counts every category before settings have loaded', () => {
    expect(alertsInApp('SYSTEM', null)).toBeTrue();
  });
});
