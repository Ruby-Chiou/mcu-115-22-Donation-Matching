import { oauthRedirectUrl } from './oauth-redirect-url';

describe('oauthRedirectUrl', () => {
  it('keeps the local dev server on /login', () => {
    expect(oauthRedirectUrl('http://127.0.0.1:4200', '/')).toBe('http://127.0.0.1:4200/login');
  });

  it('includes the GitHub Pages project folder', () => {
    expect(oauthRedirectUrl('https://ruby-chiou.github.io', '/mcu-115-22-Donation-Matching/')).toBe(
      'https://ruby-chiou.github.io/mcu-115-22-Donation-Matching/login',
    );
  });

  it('accepts a base path without a trailing slash', () => {
    expect(oauthRedirectUrl('https://ruby-chiou.github.io', '/mcu-115-22-Donation-Matching')).toBe(
      'https://ruby-chiou.github.io/mcu-115-22-Donation-Matching/login',
    );
  });
});
