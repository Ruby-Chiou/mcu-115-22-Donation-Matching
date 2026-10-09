export type MessageCategory = 'SYSTEM' | 'AGENCY' | 'DONATION';

export type MessageFolder = 'inbox' | 'sent';

export const MESSAGE_CATEGORY_LABELS: Record<MessageCategory, string> = {
  SYSTEM: '系統通知',
  AGENCY: '機構訊息',
  DONATION: '捐贈進度',
};

export interface MemberMessage {
  id: number;
  recipientUid: string;
  recipientName: string;
  senderUid: string | null; // 系統通知沒有寄件者
  senderName: string;
  category: MessageCategory;
  subject: string;
  content: string;
  parentId: number | null; // 回覆的原始信件 id
  isRead: boolean;
  isStarred: boolean;
  createdAt: string;
}

export interface MessageContact {
  uid: string;
  name: string;
}

export interface SendMessagePayload {
  recipientUid: string;
  recipientName: string;
  subject: string;
  content: string;
  parentId?: number | null;
}
