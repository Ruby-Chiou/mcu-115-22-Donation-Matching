export const environment = {
  production: false,
  supabaseUrl: 'https://wxryryyiakzkeeoorlrq.supabase.co',
  supabasePublishableKey: 'sb_publishable_iPIGLsEblhCVK6GwJKxZSw_bbPX0pHO',

  /**
   * 已改由登入工作階段決定 uid。保持 null，避免未登入時套用示範捐助者。
   */
  memberDemoUid: null as string | null,

  /**
   * 捐助照片審核。開發時走 Angular proxy，正式站直接打後端。
   * 後端再呼叫 OpenRouter，並把結果寫回資料庫。
   */
  aiReviewApiUrl: 'https://mcu-115-22-donation-matching-backend.onrender.com',
};
