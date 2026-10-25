export function toLoginMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';

  if (/invalid login credentials/i.test(message)) {
    return '帳號或密碼不正確。';
  }

  if (/email not confirmed/i.test(message)) {
    return '信箱尚未完成驗證。';
  }

  if (/provider is not enabled|unsupported provider/i.test(message)) {
    return '這個第三方登入尚未在認證服務開通。請改用帳號密碼，或請管理者到 Supabase 啟用 Google、LINE、Facebook。';
  }

  if (/redirect url|redirect_to|redirect_uri/i.test(message)) {
    return '登入後要回到的網址尚未加入允許清單。';
  }

  if (/too many requests|rate limit/i.test(message)) {
    return '嘗試次數過多，請稍後再試。';
  }

  if (/[\u4e00-\u9fff]/.test(message)) {
    return message;
  }

  if (/database error querying schema/i.test(message)) {
    return '登入服務讀取帳號時發生錯誤，請稍後再試。';
  }

  if (/database error saving new user/i.test(message)) {
    return '註冊時寫入身分資料失敗，請稍後再試。';
  }

  return '登入失敗，請稍後再試。';
}
