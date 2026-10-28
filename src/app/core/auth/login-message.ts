export function toLoginMessage(error: unknown, email = ''): string {
  const message = error instanceof Error ? error.message : '';
  const looksGmail = /@gmail\.com$/i.test(email.trim()) || /@googlemail\.com$/i.test(email.trim());

  if (/invalid login credentials/i.test(message)) {
    if (looksGmail) {
      return '帳號或密碼不正確。若你曾用 Google 按鈕登入，這個 Gmail 可能還沒設定密碼；請改按 Google，或到「忘記密碼」用同一信箱設定密碼後再登入。';
    }

    return '帳號或密碼不正確。若曾用第三方登入，請先到「忘記密碼」設定密碼，或改用原本的登入方式。';
  }

  if (/email not confirmed/i.test(message)) {
    return '信箱尚未完成驗證。請到收件匣（含垃圾郵件）點啟用連結，或到「忘記密碼」重設後再登入。';
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
