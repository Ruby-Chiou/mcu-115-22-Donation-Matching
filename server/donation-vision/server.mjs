import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, pipeline } from '@huggingface/transformers';
import { CATEGORIES, decideReview } from './decide.mjs';

const port = Number(process.env.PORT || 8000);
const storageHost = 'https://wxryryyiakzkeeoorlrq.supabase.co/';
const root = path.dirname(fileURLToPath(import.meta.url));

env.cacheDir = path.join(root, '.cache');

const labelByText = new Map(CATEGORIES.map((category) => [category.en, category]));
const candidateLabels = CATEGORIES.map((category) => category.en);
let classifier;
let captioner;

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error('請求太大'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('請求不是 JSON'));
      }
    });

    req.on('error', reject);
  });
}

async function classifyImage(imageUrl) {
  if (!imageUrl.startsWith(storageHost)) {
    throw new Error('只接受這個平台儲存空間裡的物資照片');
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error('照片下載失敗');
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const blob = new Blob([bytes]);
  const ranked = await classifier(blob, candidateLabels);
  const captionOutput = await captioner(blob);
  const caption = (Array.isArray(captionOutput) ? captionOutput[0]?.generated_text : captionOutput?.generated_text) ?? '';

  if (!caption.trim()) {
    throw new Error('模型沒有描述這張照片');
  }
  const scores = ranked.map((item) => {
    const category = labelByText.get(item.label);
    if (!category) {
      throw new Error(`模型回了未定義的分類：${item.label}`);
    }

    return {
      id: category.id,
      zh: category.zh,
      score: item.score,
    };
  });

  if (scores.length === 0) {
    throw new Error('模型沒有產生分類');
  }

  return { scores, caption };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return;
  }

  const url = new URL(req.url || '/', 'http://127.0.0.1');

  if (req.method === 'GET' && url.pathname === '/health') {
    send(res, 200, { ready: Boolean(classifier && captioner) });
    return;
  }

  if (req.method !== 'POST' || url.pathname !== '/review') {
    send(res, 404, { error: '找不到這個路徑' });
    return;
  }

  try {
    const body = await readJson(req);
    const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.filter((item) => typeof item === 'string') : [];

    if (imageUrls.length === 0) {
      send(res, 400, { error: '沒有物資照片' });
      return;
    }

    const images = [];
    for (const imageUrl of imageUrls.slice(0, 4)) {
      images.push(await classifyImage(imageUrl));
    }

    send(res, 200, decideReview({
      images,
      claimedMaterial: body.claimedMaterial,
      demandItem: body.demandItem,
    }));
  } catch (error) {
    send(res, 502, { error: error instanceof Error ? error.message : '影像審核失敗' });
  }
});

classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');

server.listen(port, '127.0.0.1', () => {
  console.log(`donation vision ready on http://127.0.0.1:${port}`);
});
