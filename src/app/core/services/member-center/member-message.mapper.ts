import { MemberMessage, MessageCategory } from '../../../models/member/member-message';

/** Supabase `member_messages` 列結構（與資料表欄位對齊） */
export interface MemberMessageRow {
  id: number | string;
  recipientUid: string;
  recipientName: string | null;
  senderUid: string | null;
  senderName: string | null;
  category: string | null;
  subject: string | null;
  content: string | null;
  relatedDonationId?: string | null;
  parentId: number | string | null;
  isRead: boolean | null;
  isStarred: boolean | null;
  createdAt: string | null;
}

/** 資料列 → 領域模型（純函式，方便單測、不依賴 Angular） */
export function mapRowToMemberMessage(row: MemberMessageRow): MemberMessage {
  return {
    id: Number(row.id),
    recipientUid: row.recipientUid,
    recipientName: row.recipientName ?? '',
    senderUid: row.senderUid,
    senderName: row.senderName ?? '',
    category: (row.category ?? 'SYSTEM') as MessageCategory,
    subject: row.subject ?? '',
    content: row.content ?? '',
    relatedDonationId: row.relatedDonationId?.trim() || null,
    parentId: row.parentId == null ? null : Number(row.parentId),
    isRead: row.isRead ?? false,
    isStarred: row.isStarred ?? false,
    createdAt: row.createdAt ?? '',
  };
}
