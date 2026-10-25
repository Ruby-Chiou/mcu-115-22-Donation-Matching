/** 與 src/app/core/content/support-contact.ts 的類型名稱保持一致。 */
const CATEGORY_LABELS: Record<string, string> = {
  account: '帳號與登入',
  donation: '捐助相關',
  logistics: '物流相關',
  disaster: '災害救助',
  system: '平台使用問題',
  other: '其他問題',
};

export const SUPPORT_EMAIL = 'donation.matching1113@gmail.com';
export const PLATFORM_NAME = '智慧捐助媒合平台';
export const MAIL_FROM_NAME = '智慧捐助媒合平台客服中心';

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export class ComplaintInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComplaintInputError';
  }
}

export interface ComplaintMail {
  senderName: string;
  senderEmail: string;
  category: string;
  subject: string;
  body: string;
}

export function parseComplaint(input: unknown): ComplaintMail {
  if (!input || typeof input !== 'object') {
    throw new ComplaintInputError('客訴內容不正確。');
  }

  const raw = input as Record<string, unknown>;
  const senderName = oneLine(raw['senderName'], 40, '姓名');
  const senderEmail = oneLine(raw['senderEmail'], 120, 'Email');
  const category = oneLine(raw['category'], 40, '問題類型');
  const body = multiline(raw['body'], 2000);
  const subject = CATEGORY_LABELS[category];

  if (!subject) {
    throw new ComplaintInputError('請選擇問題類型。');
  }

  if (!EMAIL_PATTERN.test(senderEmail)) {
    throw new ComplaintInputError('Email 格式不正確。');
  }

  return { senderName, senderEmail, category, subject, body };
}

export function complaintLetter(row: ComplaintMail & { id: number; createdAt: string; senderUid: string | null }): {
  subject: string;
  text: string;
  html: string;
} {
  const when = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(row.createdAt));
  const caseNo = `DM-${String(row.id).padStart(4, '0')}`;
  const member = row.senderUid ?? '未登入';
  const fields = [
    ['案件編號', caseNo],
    ['受理時間', `${when}（台北時間）`],
    ['問題類型', row.subject],
    ['來信者', row.senderName],
    ['聯絡信箱', row.senderEmail],
    ['會員編號', member],
  ] as const;

  const text = [
    PLATFORM_NAME,
    '客服中心｜客訴通知',
    '',
    ...fields.map(([label, value]) => `${label}　${value}`),
    '',
    '您好：',
    '',
    '平台已收到一則新的客訴，並同步寄至客服信箱。請到平台客訴列表貼上回覆再送出。送出後會寄給來信者，這個信箱也會留下同一封。',
    '',
    '————————————————',
    '來信內容',
    '————————————————',
    '',
    row.body,
    '',
    '————————————————',
    '回信請沿用此格式',
    '————————————————',
    '',
    `${row.senderName} 您好：`,
    '',
    `感謝您來信${PLATFORM_NAME}。關於您所詢問的「${row.subject}」（案件編號 ${caseNo}），說明如下：`,
    '',
    '（請填寫處理結果）',
    '',
    `若需進一步協助，請回覆本信，或來信 ${SUPPORT_EMAIL}，並註明案件編號。`,
    '',
    '祝　平安',
    '',
    `${PLATFORM_NAME}　客服中心`,
    SUPPORT_EMAIL,
    '',
    '本信由平台系統寄出。請客服人員回覆來信者，勿將案件內容轉寄至外部信箱。',
  ].join('\n');

  const fieldRows = fields
    .map(
      ([label, value]) =>
        `<tr><th style="width:108px;padding:8px 12px;text-align:left;vertical-align:top;background:#faf7f2;border-bottom:1px solid #e7e0d4;">${escapeHtml(label)}</th><td style="padding:8px 12px;border-bottom:1px solid #e7e0d4;">${escapeHtml(value)}</td></tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="margin:0;padding:24px;background:#f3f0e8;color:#1c1917;font-family:'PingFang TC','Noto Sans TC','Microsoft JhengHei',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e7e0d4;">
    <tr>
      <td style="padding:22px 28px;background:#1f3a34;color:#f8f5ef;">
        <div style="font-size:13px;letter-spacing:0.12em;">${escapeHtml(PLATFORM_NAME)}</div>
        <div style="margin-top:6px;font-size:22px;font-weight:700;">客服中心｜客訴通知</div>
      </td>
    </tr>
    <tr>
      <td style="height:4px;background:#b45309;font-size:0;line-height:0;">&nbsp;</td>
    </tr>
    <tr>
      <td style="padding:28px;font-size:15px;line-height:1.75;">
        <p style="margin:0 0 16px;">您好：</p>
        <p style="margin:0 0 20px;">平台已收到一則新的客訴，並同步寄至客服信箱。請到平台客訴列表貼上回覆再送出。送出後會寄給來信者，這個信箱也會留下同一封。</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
          ${fieldRows}
        </table>
        <p style="margin:0 0 8px;font-weight:700;">來信內容</p>
        <div style="margin:0 0 24px;padding:16px;background:#faf7f2;border-left:3px solid #1f3a34;white-space:pre-wrap;">${escapeHtml(row.body)}</div>
        <p style="margin:0 0 8px;font-weight:700;">回信請沿用此格式</p>
        <div style="padding:16px;background:#faf7f2;white-space:pre-wrap;">${escapeHtml(`${row.senderName} 您好：\n\n感謝您來信${PLATFORM_NAME}。關於您所詢問的「${row.subject}」（案件編號 ${caseNo}），說明如下：\n\n（請填寫處理結果）\n\n若需進一步協助，請回覆本信，或來信 ${SUPPORT_EMAIL}，並註明案件編號。\n\n祝　平安\n\n${PLATFORM_NAME}　客服中心\n${SUPPORT_EMAIL}`)}</div>
        <p style="margin:20px 0 0;color:#57534e;font-size:13px;">本信由平台系統寄出。請客服人員回覆來信者，勿將案件內容轉寄至外部信箱。</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: `【${PLATFORM_NAME}】客訴通知｜${caseNo}｜${row.subject}`,
    text,
    html,
  };
}

export function parseReply(input: unknown): { complaintId: number; body: string } {
  if (!input || typeof input !== 'object') {
    throw new ComplaintInputError('回覆內容不正確。');
  }

  const raw = input as Record<string, unknown>;
  const complaintId = raw['complaintId'];
  if (typeof complaintId !== 'number' || !Number.isInteger(complaintId) || complaintId < 1) {
    throw new ComplaintInputError('找不到這筆客訴。');
  }

  if (typeof raw['body'] !== 'string') {
    throw new ComplaintInputError('回覆內容不正確。');
  }

  const body = raw['body'].replace(/\u0000/g, '').trim();
  if (body.length < 1 || body.length > 2000) {
    throw new ComplaintInputError('回覆內容的長度不正確。');
  }

  return { complaintId, body };
}

export function replyLetter(row: {
  id: number;
  subject: string;
  senderName: string;
  senderEmail: string;
  body: string;
  createdAt: string;
}): { subject: string; text: string; html: string } {
  const when = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(row.createdAt));
  const caseNo = `DM-${String(row.id).padStart(4, '0')}`;
  const fields = [
    ['案件編號', caseNo],
    ['回覆時間', `${when}（台北時間）`],
    ['問題類型', row.subject],
    ['來信者', row.senderName],
    ['寄達信箱', row.senderEmail],
  ] as const;
  const replyText = [
    `${row.senderName} 您好：`,
    '',
    `感謝您來信${PLATFORM_NAME}。關於您所詢問的「${row.subject}」（案件編號 ${caseNo}），回覆如下：`,
    '',
    row.body,
    '',
    `若需進一步協助，請回覆本信，或來信 ${SUPPORT_EMAIL}，並註明案件編號。`,
    '',
    '祝　平安',
    '',
    `${PLATFORM_NAME}　客服中心`,
    SUPPORT_EMAIL,
  ].join('\n');

  const text = [
    PLATFORM_NAME,
    '客服中心｜客訴回覆',
    '',
    '這封信已寄給來信者，並同步留在客服信箱。',
    '',
    ...fields.map(([label, value]) => `${label}　${value}`),
    '',
    replyText,
  ].join('\n');

  const fieldRows = fields
    .map(
      ([label, value]) =>
        `<tr><th style="width:108px;padding:8px 12px;text-align:left;vertical-align:top;background:#faf7f2;border-bottom:1px solid #e7e0d4;">${escapeHtml(label)}</th><td style="padding:8px 12px;border-bottom:1px solid #e7e0d4;">${escapeHtml(value)}</td></tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="margin:0;padding:24px;background:#f3f0e8;color:#1c1917;font-family:'PingFang TC','Noto Sans TC','Microsoft JhengHei',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e7e0d4;">
    <tr>
      <td style="padding:22px 28px;background:#1f3a34;color:#f8f5ef;">
        <div style="font-size:13px;letter-spacing:0.12em;">${escapeHtml(PLATFORM_NAME)}</div>
        <div style="margin-top:6px;font-size:22px;font-weight:700;">客服中心｜客訴回覆</div>
      </td>
    </tr>
    <tr>
      <td style="height:4px;background:#b45309;font-size:0;line-height:0;">&nbsp;</td>
    </tr>
    <tr>
      <td style="padding:28px;font-size:15px;line-height:1.75;">
        <p style="margin:0 0 20px;">這封信已寄給來信者，並同步留在客服信箱。</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
          ${fieldRows}
        </table>
        <div style="padding:16px;background:#faf7f2;border-left:3px solid #1f3a34;white-space:pre-wrap;">${escapeHtml(replyText)}</div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: `【${PLATFORM_NAME}】客訴回覆｜${caseNo}｜${row.subject}`,
    text,
    html,
  };
}

export function closeLetter(row: {
  id: number;
  subject: string;
  senderName: string;
  closeMethod: 'manual' | 'auto';
  closedAt: string;
}): { subject: string; text: string; html: string } {
  const when = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(row.closedAt));
  const caseNo = `DM-${String(row.id).padStart(4, '0')}`;
  const kind = row.closeMethod === 'auto' ? '逾期自動結案' : '手動結案';
  const reason =
    row.closeMethod === 'auto'
      ? `平台回覆後已滿七天，未再收到 ${row.senderName} 的回覆，系統已自動結案。`
      : '客服人員已將此案件手動結案。';
  const text = [
    PLATFORM_NAME,
    `客服中心｜${kind}`,
    '',
    `案件編號　${caseNo}`,
    `結案時間　${when}（台北時間）`,
    `結案方式　${kind}`,
    `來信者　　${row.senderName}`,
    '',
    `${row.senderName} 您好：`,
    '',
    `您向${PLATFORM_NAME}反映的「${row.subject}」（案件編號 ${caseNo}）已經結案。`,
    reason,
    '',
    `若仍需協助，請重新來信 ${SUPPORT_EMAIL}，並註明案件編號。`,
    '',
    '此信同時寄給來信者與客服信箱。',
    '',
    `${PLATFORM_NAME}　客服中心`,
    SUPPORT_EMAIL,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="margin:0;padding:24px;background:#f3f0e8;color:#1c1917;font-family:'PingFang TC','Noto Sans TC','Microsoft JhengHei',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e7e0d4;">
    <tr>
      <td style="padding:22px 28px;background:#1f3a34;color:#f8f5ef;">
        <div style="font-size:13px;letter-spacing:0.12em;">${escapeHtml(PLATFORM_NAME)}</div>
        <div style="margin-top:6px;font-size:22px;font-weight:700;">客服中心｜${escapeHtml(kind)}</div>
      </td>
    </tr>
    <tr><td style="height:4px;background:#b45309;font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr>
      <td style="padding:28px;font-size:15px;line-height:1.75;white-space:pre-wrap;">${escapeHtml(text)}</td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: `【${PLATFORM_NAME}】客訴${kind}｜${caseNo}｜${row.subject}`,
    text,
    html,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function oneLine(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string') {
    throw new ComplaintInputError(`${label}不正確。`);
  }

  const text = value.replace(/[\u0000\r\n]+/g, ' ').trim();
  if (text.length < 1 || text.length > max) {
    throw new ComplaintInputError(`${label}的長度不正確。`);
  }

  return text;
}

function multiline(value: unknown, max: number): string {
  if (typeof value !== 'string') {
    throw new ComplaintInputError('問題內容不正確。');
  }

  const text = value.replace(/\u0000/g, '').trim();
  if (text.length < 1 || text.length > max) {
    throw new ComplaintInputError('問題內容的長度不正確。');
  }

  return text;
}
