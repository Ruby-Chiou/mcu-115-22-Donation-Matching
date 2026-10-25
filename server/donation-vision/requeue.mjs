import { readFileSync } from 'node:fs';

const envFile = readFileSync(new URL('../../src/environment/environment.ts', import.meta.url), 'utf8');
const supabaseUrl = envFile.match(/supabaseUrl:\s*'([^']+)'/)?.[1];
const supabaseKey = envFile.match(/supabasePublishableKey:\s*'([^']+)'/)?.[1];
const visionUrl = envFile.match(/donationVisionApiUrl:\s*'([^']+)'/)?.[1] ?? 'http://127.0.0.1:8000';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('讀不到 Supabase 設定');
}

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
};

async function rest(path, options = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${path} ${response.status} ${text.slice(0, 300)}`);
  }

  return body;
}

const donations = await rest(
  '/rest/v1/donor_daily_donations?status=eq.pending_ai_review&select=id,actual_material,demand_id'
);

for (const donation of donations) {
  const demandRows = await rest(`/rest/v1/agency_daily_supply_items?id=eq.${donation.demand_id}&select=item`);
  const files = await rest(
    `/rest/v1/donation_files?donation_id=eq.${donation.id}&file_type=eq.material_image&select=storage_path`
  );
  const imageUrls = [];

  for (const file of files) {
    const signed = await rest(`/storage/v1/object/sign/donation-files/${file.storage_path}`, {
      method: 'POST',
      body: JSON.stringify({ expiresIn: 600 }),
    });
    const signedPath = signed.signedURL || signed.signedUrl;
    imageUrls.push(signedPath.startsWith('http') ? signedPath : `${supabaseUrl}/storage/v1${signedPath}`);
  }

  const review = await fetch(`${visionUrl}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrls,
      claimedMaterial: donation.actual_material,
      demandItem: demandRows[0]?.item ?? '',
    }),
  });
  const vision = await review.json();

  if (!review.ok) {
    console.log(`${donation.actual_material}: 失敗 ${vision.error}`);
    continue;
  }

  await rest('/rest/v1/rpc/record_ai_donation_review', {
    method: 'POST',
    body: JSON.stringify({
      p_donation_id: donation.id,
      p_decision: vision.decision,
      p_condition: vision.detected,
      p_reason: vision.reason,
    }),
  });

  console.log(`${donation.actual_material}: ${vision.decision} ${vision.reason}`);
}
