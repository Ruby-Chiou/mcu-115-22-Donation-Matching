import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * 取代 Render：讀取捐助與物資照片 → OpenRouter 影像辨識 → 寫入 record_ai_donation_review。
 * 前端：POST /functions/v1/ai-donation-review?donationId=...
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BUCKET = 'donation-files';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_VISION_MODEL = 'openai/gpt-4o-mini';

/** Secrets 若誤填變數名本身或空字串，會被 OpenRouter 打回 400；這裡強制回退。 */
function resolveVisionModel(): string {
  const configured = Deno.env.get('OPENROUTER_VISION_MODEL')?.trim() ?? '';
  if (!configured || configured === 'OPENROUTER_VISION_MODEL' || !configured.includes('/')) {
    if (configured) {
      console.warn(`OPENROUTER_VISION_MODEL 無效「${configured}」，改用 ${DEFAULT_VISION_MODEL}`);
    }
    return DEFAULT_VISION_MODEL;
  }
  return configured;
}

const MODEL = resolveVisionModel();

type DonationRow = {
  id: string;
  status: string;
  actual_material: string | null;
  demand_id: number | null;
  manufacture_date: string | null;
  shelf_life_duration: string | null;
  expiry_date: string | null;
};

type FileRow = {
  storage_path: string;
  file_type: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { message: '只接受 POST 審核請求。' });
  }

  try {
    const donationId = await resolveDonationId(req);
    if (!donationId) {
      return json(400, { message: '缺少 donationId。' });
    }

    const admin = adminClient();
    const { data: donation, error: donationError } = await admin
      .from('donor_daily_donations')
      .select('id, status, actual_material, demand_id, manufacture_date, shelf_life_duration, expiry_date')
      .eq('id', donationId)
      .maybeSingle();

    if (donationError) {
      console.error('讀取捐助失敗', donationError.message);
      return json(500, { message: '讀取捐助失敗。' });
    }

    if (!donation) {
      return json(404, { message: '找不到這筆捐助。' });
    }

    const demand = await loadDemandMeta(admin, donation.demand_id);
    const imageUrls = await loadImageUrls(admin, donationId);

    if (imageUrls.length === 0) {
      const recorded = await recordReview(admin, donationId, 'rejected', '無法判斷', '沒有上傳物資照片，AI 無法完成審核。請補上傳後再送審。');
      return json(200, toClientPayload(recorded));
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      const recorded = await recordReview(
        admin,
        donationId,
        'rejected',
        '無法自動判定',
        '系統尚未設定 OpenRouter 金鑰，已轉交機構人工依照片確認。',
      );
      return json(200, toClientPayload(recorded));
    }

    let vision: { decision: 'accepted' | 'rejected'; condition: string; reason: string };
    try {
      vision = await askVision(apiKey, {
        claimedMaterial: donation.actual_material ?? '',
        demandItem: demand.item,
        requireShelfLife: demand.requireShelfLife,
        manufactureDate: donation.manufacture_date ?? '',
        shelfLifeDuration: donation.shelf_life_duration ?? '',
        expiryDate: donation.expiry_date ?? '',
        imageUrls,
      });
    } catch (error) {
      console.error('OpenRouter 辨識失敗', error instanceof Error ? error.message : error);
      const diagnostic = visionFailureDiagnostic(error);
      const recorded = await recordReview(
        admin,
        donationId,
        'rejected',
        '無法自動判定',
        `系統影像辨識未完成，請機構直接依照片人工確認。${diagnostic}`,
      );
      return json(200, toClientPayload(recorded));
    }

    const recorded = await recordReview(admin, donationId, vision.decision, vision.condition, vision.reason);
    return json(200, toClientPayload(recorded));
  } catch (error) {
    console.error('AI 審核失敗', error instanceof Error ? error.message : error);
    return json(500, { message: error instanceof Error ? error.message : 'AI 審核失敗。' });
  }
});

async function resolveDonationId(req: Request): Promise<string> {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get('donationId')?.trim();
  if (fromQuery) {
    return fromQuery;
  }

  const pathMatch = url.pathname.match(/donations\/([^/]+)\/ai-review/i);
  if (pathMatch?.[1]) {
    return decodeURIComponent(pathMatch[1]);
  }

  const body = (await req.json().catch(() => null)) as { donationId?: unknown } | null;
  return typeof body?.donationId === 'string' ? body.donationId.trim() : '';
}

async function loadDemandMeta(
  admin: ReturnType<typeof adminClient>,
  demandId: number | null,
): Promise<{ item: string; requireShelfLife: boolean }> {
  if (!demandId) {
    return { item: '', requireShelfLife: false };
  }

  const { data } = await admin
    .from('agency_daily_supply_items')
    .select('item, require_shelf_life')
    .eq('id', demandId)
    .maybeSingle();

  return {
    item: typeof data?.item === 'string' ? data.item : '',
    requireShelfLife: !!data?.require_shelf_life,
  };
}

async function loadImageUrls(admin: ReturnType<typeof adminClient>, donationId: string): Promise<string[]> {
  const { data, error } = await admin
    .from('donation_files')
    .select('storage_path, file_type')
    .eq('donation_id', donationId)
    .eq('file_type', 'material_image')
    .order('created_at', { ascending: true })
    .limit(4);

  if (error) {
    throw new Error(error.message);
  }

  const urls: string[] = [];
  for (const row of (data ?? []) as FileRow[]) {
    const { data: signed, error: signedError } = await admin.storage.from(BUCKET).createSignedUrl(row.storage_path, 600);
    if (signedError || !signed?.signedUrl) {
      console.error('簽名照片失敗', signedError?.message);
      continue;
    }
    urls.push(signed.signedUrl);
  }

  return urls;
}

async function askVision(
  apiKey: string,
  input: {
    claimedMaterial: string;
    demandItem: string;
    requireShelfLife: boolean;
    manufactureDate: string;
    shelfLifeDuration: string;
    expiryDate: string;
    imageUrls: string[];
  },
): Promise<{ decision: 'accepted' | 'rejected'; condition: string; reason: string }> {
  const shelfLifeRules = input.requireShelfLife
    ? [
        'Shelf-life requirement is ON for this demand.',
        'You MUST reject if none of the photos clearly show a readable manufacture date, expiry date, or best-before date on the packaging/label.',
        'Blurry, cropped-away, or missing date text counts as reject.',
        `Donor-entered manufacture date: ${input.manufactureDate || '(empty)'}`,
        `Donor-entered shelf-life duration: ${input.shelfLifeDuration || '(empty)'}`,
        `Donor-entered expiry date: ${input.expiryDate || '(empty)'}`,
        'If dates are visible but do not roughly match the entered values, prefer reject and explain the mismatch.',
      ]
    : ['Shelf-life requirement is OFF. Do not require date labels on packaging.'];

  const prompt = [
    'You are a photo reviewer for a donation-matching platform.',
    'Decide only from the photos whether the goods roughly match the claimed material and the demand item.',
    'Accept when the goods are clearly visible and the type matches (brand details may differ slightly).',
    'Reject for unrelated scenes, selfies, screenshots, empty boxes, clearly wrong item types, or unreadable photos.',
    ...shelfLifeRules,
    `Demand item: ${input.demandItem || '(none)'}`,
    `Donor claimed material: ${input.claimedMaterial || '(empty)'}`,
    'Return JSON only, no markdown.',
    'The "reason" field MUST be Traditional Chinese (Taiwan), at least 20 characters.',
    '{"decision":"accepted or rejected","condition":"detected goods condition or type","reason":"Traditional Chinese explanation"}',
  ].join('\n');

  const imageUrls = input.imageUrls.slice(0, 2);
  const attempts: Array<{ label: string; urls: string[] }> = [
    { label: 'signed-url', urls: imageUrls },
  ];

  try {
    const dataUrls = await Promise.all(imageUrls.map((url) => downloadImageAsDataUrl(url)));
    attempts.push({ label: 'base64', urls: dataUrls });
  } catch (error) {
    console.warn('照片轉 base64 失敗，改用簽名網址', safeErrorMessage(error));
  }

  let lastError: unknown;
  for (const attempt of attempts) {
    const content: Array<Record<string, unknown>> = [{ type: 'text', text: prompt }];
    for (const url of attempt.urls) {
      content.push({ type: 'image_url', image_url: { url } });
    }

    for (const useResponseFormat of [true, false]) {
      try {
        return await requestVision(apiKey, content, useResponseFormat);
      } catch (error) {
        lastError = error;
        console.warn(
          `OpenRouter 失敗（${attempt.label}, jsonFormat=${useResponseFormat}）`,
          safeErrorMessage(error),
        );
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('OpenRouter 辨識失敗');
}

async function requestVision(
  apiKey: string,
  content: Array<Record<string, unknown>>,
  useResponseFormat: boolean,
): Promise<{ decision: 'accepted' | 'rejected'; condition: string; reason: string }> {
  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SUPABASE_URL') ?? 'https://donation-matching.local',
        'X-Title': 'Donation Matching AI Review',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: [{ role: 'user', content }],
        ...(useResponseFormat ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    throw new VisionProviderError(
      error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'network',
      undefined,
      safeErrorMessage(error),
    );
  }

  const raw = await response.text();
  if (!response.ok) {
    throw new VisionProviderError('response', response.status, `OpenRouter ${response.status}: ${raw.slice(0, 300)}`);
  }

  try {
    return normalizeVisionResult(extractVisionJson(raw));
  } catch (error) {
    console.error('OpenRouter 回傳無法解析', raw.slice(0, 500));
    throw new VisionProviderError('payload', response.status, safeErrorMessage(error));
  }
}

function extractVisionJson(raw: string): unknown {
  const parsed = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: unknown; reasoning?: unknown } }>;
  };
  const message = parsed.choices?.[0]?.message;
  const text = extractMessageText(message?.content) || extractMessageText(message?.reasoning);
  if (!text) {
    throw new Error('模型沒有回傳文字內容');
  }

  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
  const candidate = fenced?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) {
    throw new Error(`模型沒有回傳 JSON：${text.slice(0, 120)}`);
  }

  return JSON.parse(candidate);
}

function extractMessageText(content: unknown): string {
  if (typeof content === 'string') {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text?: unknown }).text ?? '');
        }
        return '';
      })
      .join('\n')
      .trim();
  }
  return '';
}

function normalizeVisionResult(value: unknown): { decision: 'accepted' | 'rejected'; condition: string; reason: string } {
  const body = value as {
    decision?: unknown;
    condition?: unknown;
    reason?: unknown;
  };

  const decision = body.decision === 'accepted' ? 'accepted' : 'rejected';
  const condition = typeof body.condition === 'string' && body.condition.trim() ? body.condition.trim() : '無法判斷';
  let reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (reason.length < 8) {
    reason = decision === 'accepted'
      ? '照片與填寫物資大致相符，已交給機構人工確認。'
      : '照片與填寫物資不符或無法辨識，已交給機構人工確認。';
  }

  return { decision, condition, reason };
}

async function downloadImageAsDataUrl(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  } catch (error) {
    throw new VisionProviderError('image_download', undefined, safeErrorMessage(error));
  }

  if (!response.ok) {
    throw new VisionProviderError('image_download', response.status, `下載照片失敗：${response.status}`);
  }

  const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  const mimeType = contentType === 'image/png' ? 'image/png' : 'image/jpeg';
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

class VisionProviderError extends Error {
  constructor(
    readonly kind: 'timeout' | 'network' | 'response' | 'payload' | 'image_download',
    readonly status?: number,
    message = '影像辨識供應商錯誤',
  ) {
    super(message);
    this.name = 'VisionProviderError';
  }
}

function visionFailureDiagnostic(error: unknown): string {
  if (
    error instanceof VisionProviderError &&
    (error.kind === 'timeout' || error.kind === 'network' || error.status === 408 || error.status === 429 || (error.status ?? 0) >= 500)
  ) {
    return '（供應商回應錯誤／逾時）';
  }
  if (error instanceof VisionProviderError && error.kind === 'image_download') {
    return '（照片下載錯誤）';
  }
  return '（供應商回應錯誤）';
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function recordReview(
  admin: ReturnType<typeof adminClient>,
  donationId: string,
  decision: 'accepted' | 'rejected',
  condition: string,
  reason: string,
) {
  const { data, error } = await admin.rpc('record_ai_donation_review', {
    p_donation_id: donationId,
    p_decision: decision,
    p_condition: condition,
    p_reason: reason,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? {}) as Record<string, unknown>;
}

function toClientPayload(recorded: Record<string, unknown>) {
  const decision = String(recorded.decision ?? '');
  const reason = String(recorded.reason ?? '');
  return {
    donationId: recorded.donationId,
    status: recorded.status,
    decision,
    aiDecision: decision,
    decisionText: recorded.decisionText,
    detectedCondition: recorded.detectedCondition,
    reason,
    conditionMatches: Boolean(recorded.conditionMatches),
    message: reason,
  };
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY');
  if (!url || !serviceKey) {
    throw new Error('Edge Function 缺少資料庫金鑰。');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
