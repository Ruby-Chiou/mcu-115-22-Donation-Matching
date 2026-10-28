/** 註冊電話：正好 10 位數字（手機或含區碼的市話）。 */
export const REGISTRATION_PHONE_PATTERN = /^\d{10}$/;

/**
 * 註冊密碼：至少 8 碼，且同時含英文大寫、小寫與數字。
 */
export const REGISTRATION_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

export const REGISTRATION_PHONE_HINT = '請輸入 10 位數字，不加空格或橫線。';
export const REGISTRATION_PASSWORD_HINT = '密碼須至少 8 碼，且同時包含英文大寫、小寫與數字。';

export function registrationPhoneMessage(value: string): string {
  return REGISTRATION_PHONE_PATTERN.test(value.trim()) ? '' : REGISTRATION_PHONE_HINT;
}

export function registrationPasswordMessage(value: string): string {
  return REGISTRATION_PASSWORD_PATTERN.test(value) ? '' : REGISTRATION_PASSWORD_HINT;
}
