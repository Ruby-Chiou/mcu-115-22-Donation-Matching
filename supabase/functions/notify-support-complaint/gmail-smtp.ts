import { MAIL_FROM_NAME, SUPPORT_EMAIL } from './complaint-mail.ts';

export class MailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MailConfigError';
  }
}

type OutboundMail = {
  to: string;
  toName?: string;
  cc?: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendSupportCopy(mail: { subject: string; text: string; html: string; replyTo: string }): Promise<void> {
  await sendMail({
    to: SUPPORT_EMAIL,
    toName: MAIL_FROM_NAME,
    replyTo: mail.replyTo,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
}

export async function sendReplyCopy(mail: { to: string; toName: string; subject: string; text: string; html: string }): Promise<void> {
  await sendMail({
    to: mail.to,
    toName: mail.toName,
    cc: mail.to === SUPPORT_EMAIL ? undefined : SUPPORT_EMAIL,
    replyTo: SUPPORT_EMAIL,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
}

async function sendMail(mail: OutboundMail): Promise<void> {
  const password = (Deno.env.get('GMAIL_APP_PASSWORD') ?? '').replace(/\s+/g, '');
  if (!password) {
    throw new MailConfigError('伺服器還沒有 Gmail 應用程式密碼，所以這封信沒有寄出。');
  }

  let conn: Deno.TlsConn;
  try {
    conn = await Deno.connectTls({ hostname: 'smtp.gmail.com', port: 465 });
  } catch (error) {
    console.error('連不到 Gmail SMTP', error instanceof Error ? error.message : error);
    throw new MailConfigError('連不到 Gmail，所以這封信沒有寄出。');
  }

  try {
    await deliver(conn, password, mail);
  } finally {
    try {
      conn.close();
    } catch {
      // 連線已關閉
    }
  }
}

async function deliver(conn: Deno.TlsConn, password: string, mail: OutboundMail): Promise<void> {
  const session = new SmtpSession(conn);
  await session.readReply([220]);
  await session.command('EHLO donation-matching', [250]);
  await session.command('AUTH LOGIN', [334]);
  await session.command(btoa(SUPPORT_EMAIL), [334]);
  await session.command(btoa(password), [235]);
  await session.command(`MAIL FROM:<${SUPPORT_EMAIL}>`, [250]);
  await session.command(`RCPT TO:<${mail.to}>`, [250]);
  if (mail.cc && mail.cc !== mail.to) {
    await session.command(`RCPT TO:<${mail.cc}>`, [250]);
  }
  await session.command('DATA', [354]);

  const boundary = `dm-${crypto.randomUUID()}`;
  const message = [
    `From: ${encodeHeader(MAIL_FROM_NAME)} <${SUPPORT_EMAIL}>`,
    `To: ${formatAddress(mail.toName, mail.to)}`,
    ...(mail.cc && mail.cc !== mail.to ? [`Cc: ${formatAddress(MAIL_FROM_NAME, mail.cc)}`] : []),
    `Reply-To: ${mail.replyTo}`,
    `Subject: ${encodeHeader(mail.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap(utf8Base64(mail.text), 76),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap(utf8Base64(mail.html), 76),
    `--${boundary}--`,
  ]
    .join('\r\n')
    .split('\r\n')
    .map((line) => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n');

  await session.writeRaw(`${message}\r\n.\r\n`);
  await session.readReply([250]);
  await session.command('QUIT', [221]);
}

class SmtpSession {
  private buffer = new Uint8Array(0);

  constructor(private readonly conn: Deno.TlsConn) {}

  async command(line: string, expected: number[]): Promise<void> {
    await this.writeRaw(`${line}\r\n`);
    await this.readReply(expected);
  }

  async writeRaw(value: string): Promise<void> {
    const payload = new TextEncoder().encode(value);
    let sent = 0;
    while (sent < payload.length) {
      sent += await this.conn.write(payload.subarray(sent));
    }
  }

  async readReply(expected: number[]): Promise<void> {
    const lines: string[] = [];
    while (true) {
      const line = await this.readLine();
      lines.push(line);
      if (line.length < 4 || line[3] !== '-') {
        break;
      }
    }

    const code = Number(lines.at(-1)?.slice(0, 3));
    if (!expected.includes(code)) {
      console.error('Gmail SMTP 拒絕', lines.join(' | '));
      const message = code === 535 ? 'Gmail 沒有接受應用程式密碼，所以這封信沒有寄出。' : 'Gmail 沒有收下這封信。';
      throw new MailConfigError(message);
    }
  }

  private async readLine(): Promise<string> {
    const decoder = new TextDecoder();
    while (true) {
      const nl = this.buffer.indexOf(10);
      if (nl >= 0) {
        const line = decoder.decode(this.buffer.slice(0, nl)).replace(/\r$/, '');
        this.buffer = this.buffer.slice(nl + 1);
        return line;
      }

      const chunk = new Uint8Array(4096);
      const read = await this.conn.read(chunk);
      if (read === null) {
        throw new MailConfigError('寄信連線中斷，這封信沒有寄出。');
      }
      this.buffer = concat(this.buffer, chunk.slice(0, read));
    }
  }
}

function formatAddress(name: string | undefined, email: string): string {
  if (!name) {
    return email;
  }
  return `${encodeHeader(name)} <${email}>`;
}

function encodeHeader(value: string): string {
  const words: string[] = [];
  let rest = value;
  while (rest.length > 0) {
    let size = Math.min(rest.length, 16);
    let encoded = '';
    while (size > 0) {
      encoded = `=?UTF-8?B?${utf8Base64(rest.slice(0, size))}?=`;
      if (encoded.length <= 75) {
        break;
      }
      size -= 1;
    }
    if (size < 1) {
      throw new MailConfigError('客訴已記下，但郵件主旨無法編碼。不用再送一次。');
    }
    words.push(encoded);
    rest = rest.slice(size);
  }
  return words.join('\r\n ');
}

function utf8Base64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function wrap(value: string, width: number): string {
  const lines: string[] = [];
  for (let index = 0; index < value.length; index += width) {
    lines.push(value.slice(index, index + width));
  }
  return lines.join('\r\n');
}

function concat(left: Uint8Array, right: Uint8Array): Uint8Array {
  const next = new Uint8Array(left.length + right.length);
  next.set(left);
  next.set(right, left.length);
  return next;
}
