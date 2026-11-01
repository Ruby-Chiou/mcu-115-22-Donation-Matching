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
const MODEL = Deno.env.get('OPENROUTER_VISION_MODEL') ?? 'openai/gpt-4o-mini';

type DonationRow = {
  id: string;
  status: string;
  actual_material: string | null;
  demand_id: number | null;
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
      .select('id, status, actual_material, demand_id')
      .eq('id', donationId)
      .maybeSingle();

    if (donationError) {
      console.error('讀取捐助失敗', donationError.message);
      return json(500, { message: '讀取捐助失敗。' });
    }

    if (!donation) {
      return json(404, { message: '找不到這筆捐助。' });
    }

    const demandItem = await loadDemandItem(admin, donation.demand_id);
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
        demandItem,
        imageUrls,
      });
    } catch (error) {
      console.error('OpenRouter 辨識失敗', error instanceof Error ? error.message : error);
      const recorded = await recordReview(
        admin,
        donationId,
        'rejected',
        '無法自動判定',
        '系統影像辨識未完成，請機構直接依照片人工確認。',
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

async function loadDemandItem(admin: ReturnType<typeof adminClient>, demandId: number | null): Promise<string> {
  if (!demandId) {
    return '';
  }

  const { data } = await admin.from('agency_daily_supply_items').select('item').eq('id', demandId).maybeSingle();
  return typeof data?.item === 'string' ? data.item : '';
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
  input: { claimedMaterial: string; demandItem: string; imageUrls: string[] },
): Promise<{ decision: 'accepted' | 'rejected'; condition: string; reason: string }> {
  const prompt = [
    '你是物資捐助平台的照片審核助理。',
    '請只根據照片判斷：畫面中的物資是否大致符合捐助者填寫的實際物資名稱，以及需求項目。',
    '通過條件：照片清楚可見物資，且種類與填寫內容相符（品牌細節可略有差異）。',
    '不通過條件：無關畫面、自拍、螢幕截圖、空箱、明顯不同種類的物資、或完全看不清。',
    `需求項目：${input.demandItem || '（未提供）'}`,
    `捐助者填寫的實際物資：${input.claimedMaterial || '（空白）'}`,
    '請只回傳 JSON，不要 markdown：',
    '{"decision":"accepted 或 rejected","condition":"辨識到的物資狀態或種類","reason":"至少 20 字的中文說明"}',
  ].join('\n');

  const content: Array<Record<string, unknown>> = [{ type: 'text', text: prompt }];
  for (const url of input.imageUrls) {
    content.push({ type: 'image_url', image_url: { url } });
  }

  const response = await fetch(OPENROUTER_URL, {
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
      response_format: { type: 'json_object' },
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${raw.slice(0, 300)}`);
  }

  const parsed = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = parsed.choices?.[0]?.message?.content?.trim() ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('模型沒有回傳 JSON');
  }

  const body = JSON.parse(jsonMatch[0]) as {
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
