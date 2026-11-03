export const environment = {
  production: false,
  supabaseUrl: 'https://wxryryyiakzkeeoorlrq.supabase.co',
  supabasePublishableKey: 'sb_publishable_iPIGLsEblhCVK6GwJKxZSw_bbPX0pHO',

  /**
   * 已改由登入工作階段決定 uid。保持 null，避免未登入時套用示範捐助者。
   */
  memberDemoUid: null as string | null,

  /**
   * AI 審核／客服：Supabase Edge Functions（免費、不長睡）。
   * 需在 Dashboard Secrets 設定 OPENROUTER_API_KEY。
   * aiReviewApiUrl 僅供 supabaseUrl 未設定時向下相容。
   */
  aiReviewApiUrl: 'https://wxryryyiakzkeeoorlrq.supabase.co/functions/v1/ai-donation-review',
  aiChatApiUrl: 'https://wxryryyiakzkeeoorlrq.supabase.co/functions/v1/ai-assistant-chat',
  aiInspectionApiUrl: 'http://127.0.0.1:8000',
};
