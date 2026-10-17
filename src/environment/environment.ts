export const environment = {
  production: false,
  supabaseUrl: 'https://wxryryyiakzkeeoorlrq.supabase.co',
  supabasePublishableKey: 'sb_publishable_iPIGLsEblhCVK6GwJKxZSw_bbPX0pHO',

  /**
   * 尚未有 Auth session 時，會員專區暫時使用的開發用捐助者 uid。
   * 必須與 supabase/seed.sql 的測試帳一致。
   * 正式接上登入後應改為 null，並要求未登入導向 /login。
   */
  memberDemoUid: 'dev-donor-001' as string | null,
};
