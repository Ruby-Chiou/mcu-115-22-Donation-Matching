/**
 * 取代 Render AI 客服：把使用者問題與平台摘要送到 OpenRouter，回傳中文答覆。
 * 前端：POST /functions/v1/ai-assistant-chat
 * body: { message, role, history, system }
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = Deno.env.get('OPENROUTER_CHAT_MODEL') ?? 'openai/gpt-4o-mini';

const DEFAULT_SYSTEM = `你是「智慧捐助媒合平台」的客服。只回答與本平台有關的問題。
平台只媒合物資捐助，沒有金錢捐款。請用繁體中文、簡短清楚回答。`;

type HistoryItem = { sender?: unknown; content?: unknown; role?: unknown };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { message: '只接受 POST。' });
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      message?: unknown;
      role?: unknown;
      history?: unknown;
      system?: unknown;
    } | null;

    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message) {
      return json(400, { message: '請輸入問題。' });
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      return json(500, { message: '系統尚未設定 OpenRouter 金鑰。' });
    }

    const system =
      typeof body?.system === 'string' && body.system.trim()
        ? body.system.trim()
        : DEFAULT_SYSTEM;
    const roleHint = typeof body?.role === 'string' && body.role.trim()
      ? `目前使用者角色：${body.role.trim()}。`
      : '';

    const history = Array.isArray(body?.history) ? (body.history as HistoryItem[]) : [];
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: `${system}\n${roleHint}`.trim() },
    ];

    for (const item of history.slice(-12)) {
      const content = typeof item.content === 'string' ? item.content.trim() : '';
      if (!content) {
        continue;
      }
      const sender = String(item.sender ?? item.role ?? '').toLowerCase();
      messages.push({
        role: sender === 'assistant' || sender === 'bot' ? 'assistant' : 'user',
        content,
      });
    }

    messages.push({ role: 'user', content: message });

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SUPABASE_URL') ?? 'https://donation-matching.local',
        'X-Title': 'Donation Matching Assistant',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages,
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      console.error('OpenRouter chat 失敗', response.status, raw.slice(0, 400));
      return json(502, { message: 'AI 客服暫時無法回答，請稍後再試。' });
    }

    const parsed = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = parsed.choices?.[0]?.message?.content?.trim() || '目前沒有可用的回覆。';

    return json(200, {
      answer,
      message: answer,
      reply: answer,
    });
  } catch (error) {
    console.error('AI 客服失敗', error instanceof Error ? error.message : error);
    return json(500, { message: 'AI 客服失敗，請稍後再試。' });
  }
});

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
