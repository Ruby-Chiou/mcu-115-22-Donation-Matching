export const environment = {
  production: false,
  supabaseUrl: 'https://wxryryyiakzkeeoorlrq.supabase.co',
  supabasePublishableKey: 'sb_publishable_iPIGLsEblhCVK6GwJKxZSw_bbPX0pHO',

  /**
   * 已改由登入工作階段決定 uid。保持 null，避免未登入時套用示範捐助者。
   */
  memberDemoUid: null as string | null,

  /**
   * 正式環境不走 Render（免費方案會休眠）。
   * AI 審核／客服改由下方 Supabase Edge Functions 直連 OpenRouter。
   * 本機若要打 C# Backend 開發，可暫時填 http://localhost:5015。
   */
  backendApiUrl: '',

  /** 捐助影像 AI 審核（含保質期規則） */
  aiReviewApiUrl: 'https://wxryryyiakzkeeoorlrq.supabase.co/functions/v1/ai-donation-review',
  /** AI 客服聊天 */
  aiChatApiUrl: 'https://wxryryyiakzkeeoorlrq.supabase.co/functions/v1/ai-assistant-chat',
  aiInspectionApiUrl: 'http://127.0.0.1:8000',
};
