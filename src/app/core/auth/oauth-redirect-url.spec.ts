import { oauthRedirectUrl } from './oauth-redirect-url';

describe('oauthRedirectUrl', () => {
  it('returns the local dev server to the home page', () => {
    expect(oauthRedirectUrl('http://127.0.0.1:4200', '/')).toBe('http://127.0.0.1:4200/home');
  });

  it('includes the GitHub Pages project folder', () => {
    expect(oauthRedirectUrl('https://ruby-chiou.github.io', '/mcu-115-22-Donation-Matching/')).toBe(
      'https://ruby-chiou.github.io/mcu-115-22-Donation-Matching/home',
    );
  });

  it('accepts a base path without a trailing slash', () => {
    expect(oauthRedirectUrl('https://ruby-chiou.github.io', '/mcu-115-22-Donation-Matching')).toBe(
      'https://ruby-chiou.github.io/mcu-115-22-Donation-Matching/home',
    );
  });
});
