const LETTER_INDEX = 'ABCDEFGHJKLMNPQRSTUVXYWZIO';

/** 台灣身分證字號檢查碼。PDF 開啟密碼使用這個值，所以先擋掉明顯打錯的號碼。 */
export function isTaiwanId(value: string): boolean {
  const id = value.trim().toUpperCase();

  if (!/^[A-Z][1289]\d{8}$/.test(id)) {
    return false;
  }

  const code = LETTER_INDEX.indexOf(id[0]) + 10;

  if (code < 10) {
    return false;
  }

  const digits = [Math.floor(code / 10), code % 10, ...id.slice(1).split('').map((digit) => Number(digit))];
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
  const sum = digits.reduce((total, digit, index) => total + digit * weights[index], 0);

  return sum % 10 === 0;
}

export function normalizeTaiwanId(value: string): string {
  return value.trim().toUpperCase();
}

/** 受助者畫面整段遮住，不露出任何一碼。 */
export function maskTaiwanId(value: string): string {
  const id = normalizeTaiwanId(value);

  if (!id) {
    return '尚未設定';
  }

  return '＊＊＊＊＊＊＊＊＊＊';
}
