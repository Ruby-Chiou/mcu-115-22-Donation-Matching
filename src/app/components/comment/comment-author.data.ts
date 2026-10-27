export type CommentAuthorRole = 'donor' | 'agency';

export interface CommentAuthorSample {
  userId: string;
  name: string;
  role: CommentAuthorRole;
  summary: string;
  comment: string;
}

/** 公開名片摘要；uid 對應測試帳號時可從留言開站內私訊。 */
export const COMMENT_AUTHOR_SAMPLES: CommentAuthorSample[] = [
  {
    userId: '11111111-1111-4111-8111-111111111111',
    name: '測試捐助者',
    role: 'donor',
    summary: '個人捐助者。公開留言只顯示這個暱稱，不含電話與住址。',
    comment: '這箱白米我週五可以送到機構，請問收貨時間方便嗎？',
  },
  {
    userId: '22222222-2222-4222-8222-222222222222',
    name: '測試受助者',
    role: 'agency',
    summary: '受助機構窗口。這裡只顯示機構名稱與身分，詳細地址在需求頁。',
    comment: '感謝詢問。平日下午兩點到五點都可以收，到了跟櫃檯說是平台媒合。',
  },
  {
    userId: '55555555-5555-4555-8555-555555555555',
    name: '測試愛心企業',
    role: 'donor',
    summary: '企業捐助者。名片顯示所在縣市與已公開的感謝紀錄。',
    comment: '我也可以再補 10 包衛生紙，若還需要請私訊我。',
  },
];

const SAMPLE_SUMMARY = new Map(COMMENT_AUTHOR_SAMPLES.map((sample) => [sample.userId, sample.summary]));

export function commentAuthorSummary(userId: string | null, role: CommentAuthorRole, name: string): string {
  if (userId && SAMPLE_SUMMARY.has(userId)) {
    return SAMPLE_SUMMARY.get(userId) ?? '';
  }

  if (role === 'agency') {
    return `${name}是受助機構的公開窗口。名片只顯示名稱與身分。`;
  }

  return `${name}是捐助者。名片只顯示暱稱與身分。`;
}

export function commentAuthorRoleLabel(role: CommentAuthorRole): string {
  return role === 'agency' ? '受助者' : '捐助者';
}

export interface CommentListItem {
  id: number;
  demand_id: number;
  user_id: string | null;
  user_role: CommentAuthorRole;
  user_name: string;
  content: string;
  created_at: string;
  parent_comment_id: number | null;
  like_count: number;
  liked_user_ids: string[];
}

const PREVIEW_IDS = new Set([-11, -12, -13]);

export function commentPreviewNotice(loadFailed: boolean): string {
  return loadFailed ? '留言暫時讀不到，請稍後再試。' : '';
}

/** 相容舊呼叫；留言已改由資料庫提供，不再插入前端示範列。 */
export function commentPreviewItems(_demandId: number): CommentListItem[] {
  return [];
}

export function withCommentPreviews<T extends { id: number }>(comments: T[], _demandId: number): T[] {
  return comments.filter((comment) => !PREVIEW_IDS.has(comment.id));
}

export function commentAuthor(
  principal: { role: string; userId: string | null; displayName: string },
  fallback: CommentAuthorRole,
): { userId: string | null; role: CommentAuthorRole; name: string } {
  if (principal.role === 'guest' || !principal.userId) {
    return { userId: null, role: fallback, name: '訪客' };
  }

  return {
    userId: principal.userId,
    role: principal.role === 'agency' ? 'agency' : 'donor',
    name: principal.displayName || '會員',
  };
}

export function canDeleteOwnComment(comment: { id: number; user_id: string | null }, userId: string | null): boolean {
  return comment.id > 0 && !!userId && comment.user_id === userId;
}

export function commentDeleteError(error: unknown): string {
  const record = error as { message?: string; code?: string } | null;
  const message = record?.message ?? '';

  if (record?.code === 'LOGIN_REQUIRED') {
    return '請先登入後再刪除留言。';
  }

  if (record?.code === '23503' || /foreign key/i.test(message)) {
    return '這則留言下面還有回覆，先刪回覆才能刪這則。';
  }

  if (record?.code === 'DELETE_EMPTY') {
    return message || '這則留言刪不掉。只能刪自己發布的留言。';
  }

  return '留言沒有刪除，請稍後再試。';
}

export function commentWriteError(error: unknown): string {
  const record = error as { message?: string; code?: string } | null;
  const message = record?.message ?? '';

  if (record?.code === 'LOGIN_REQUIRED') {
    return '請先登入後再發布留言。';
  }

  if (/permission denied for table/i.test(message)) {
    return '這個帳號已經登入，但留言資料表還沒開放寫入。';
  }

  if (record?.code === '42501' || /row-level security|permission denied/i.test(message)) {
    return '留言沒有寫入。請用目前登入的帳號再發布一次。';
  }

  return '留言沒有送出，請稍後再試。';
}
