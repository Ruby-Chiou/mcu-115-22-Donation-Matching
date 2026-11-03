import { describe, expect, it } from 'vitest';

import { detectCarrier } from './detect-carrier';

describe('detectCarrier', () => {
  it('detects postal and common numeric tracking formats', () => {
    expect(detectCarrier('RF123456789TW')).toBe('中華郵政');
    expect(detectCarrier('771234567890')).toBe('黑貓宅急便');
    expect(detectCarrier('12345678')).toBe('7-ELEVEN');
    expect(detectCarrier('1234567890')).toBe('嘉里物流');
    expect(detectCarrier('12345678901')).toBe('新竹物流');
  });

  it('does not guess when the format is ambiguous or incomplete', () => {
    expect(detectCarrier('12345')).toBeNull();
    expect(detectCarrier('')).toBeNull();
  });
});
