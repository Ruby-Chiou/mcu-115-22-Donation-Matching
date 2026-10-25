/** 捐助照片會被 CLIP 對到這些類別。鍵愈長愈先比對，避免「洗衣精」被看成衣服。 */
export const CATEGORIES = [
  { id: 'water', zh: '礦泉水', en: 'bottled mineral water', keys: ['礦泉水', '飲用水', '瓶裝水'] },
  { id: 'mask', zh: '醫療口罩', en: 'a box of medical face masks', keys: ['醫療口罩', '口罩'] },
  { id: 'diaper', zh: '紙尿褲', en: 'a package of adult diapers', keys: ['紙尿褲', '紙尿布', '尿布'] },
  { id: 'detergent', zh: '洗衣精', en: 'a bottle of laundry detergent', keys: ['洗衣精', '洗衣粉', '洗衣'] },
  { id: 'alcohol', zh: '酒精', en: 'a bottle of rubbing alcohol', keys: ['酒精', '消毒'] },
  { id: 'pet', zh: '寵物飼料', en: 'a bag of dog or cat food', keys: ['狗飼料', '貓飼料', '飼料'] },
  { id: 'rice', zh: '米', en: 'a bag of rice', keys: ['白米', '稻米', '米飯', '糯米'] },
  { id: 'clothes', zh: '衣物', en: 'folded clothing or a blanket', keys: ['外套', '棉被', '毯子', '衣服', '衣物'] },
  { id: 'medicine', zh: '藥品', en: 'medicine bottles or pills', keys: ['藥品', '藥'] },
  { id: 'food', zh: '包裝食品', en: 'packaged or canned food', keys: ['罐頭', '泡麵', '食品'] },
  { id: 'unrelated', zh: '與物資無關的畫面', en: 'a computer screen, a selfie, or an unrelated object', keys: [] },
];

const CATEGORY_BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

const CAPTION_GLOSSES = [
  { pattern: /cake|dessert|cupcake|pastry/i, zh: '點心或蛋糕' },
  { pattern: /dog|cat food|pet food|kibble/i, zh: '寵物飼料' },
  { pattern: /face mask|medical mask|\bmasks?\b/i, zh: '口罩' },
  { pattern: /water bottle|bottled water|mineral water/i, zh: '瓶裝水' },
  { pattern: /diaper/i, zh: '紙尿褲' },
  { pattern: /detergent|laundry/i, zh: '洗衣用品' },
  { pattern: /cartoon|meme|drawing/i, zh: '插圖' },
  { pattern: /person|people|\bman\b|\bwoman\b|crowd|walking/i, zh: '人物' },
  { pattern: /rice|grain/i, zh: '米' },
];

function glossCaption(caption) {
  return CAPTION_GLOSSES.find((item) => item.pattern.test(caption))?.zh ?? '';
}

export function categoriesInText(text) {
  const source = String(text ?? '');
  const keys = CATEGORIES.flatMap((category) => category.keys.map((key) => ({ key, id: category.id }))).sort(
    (left, right) => right.key.length - left.key.length
  );

  let remaining = source;
  const found = [];

  for (const entry of keys) {
    if (!remaining.includes(entry.key)) {
      continue;
    }

    found.push(entry.id);
    remaining = remaining.split(entry.key).join('');
  }

  return [...new Set(found)];
}

function formatScore(score) {
  return Number(score).toFixed(2);
}

function rankText(scores) {
  return [...scores]
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((item) => `${item.zh} ${formatScore(item.score)}`)
    .join('、');
}

/**
 * 只有照片的最高分類落在捐助者填寫的物資上，才算通過。
 * 對不出種類、信心不夠、或照片更像別的東西，都不通過，並把模型排序寫進說明。
 */
export function decideReview({ images, claimedMaterial, demandItem }) {
  const claimCategories = categoriesInText(claimedMaterial);
  const demand = String(demandItem ?? '').trim();
  const claim = String(claimedMaterial ?? '').trim() || '（空白）';
  const summaries = images.map((image, index) => {
    const scores = [...image.scores].sort((left, right) => right.score - left.score);
    const top = scores[0];
    const claimBest = scores.find((item) => claimCategories.includes(item.id)) ?? null;
    const rival = scores.find((item) => !claimCategories.includes(item.id)) ?? null;
    const caption = String(image.caption ?? '').trim();
    const gloss = glossCaption(caption);

    let outcome = 'rejected';

    if (claimCategories.length > 0 && claimBest && rival) {
      const matched = claimBest.score >= rival.score && claimBest.score >= 0.2 && claimBest.id === top?.id;
      outcome = matched ? 'accepted' : 'rejected';
    }

    return {
      index,
      outcome,
      top,
      caption,
      gloss,
      rank: rankText(scores),
    };
  });

  const contradiction = summaries.find((item) => item.outcome === 'rejected');
  const accepted = !contradiction && summaries.some((item) => item.outcome === 'accepted');
  const decision = accepted ? 'accepted' : 'rejected';
  const focus = contradiction ?? summaries[0];
  const detected = focus?.top ? `${focus.top.zh} ${formatScore(focus.top.score)}` : '';

  const photoLines = summaries
    .map((item) => {
      const seen = item.caption ? `影像模型看到：「${item.caption}」${item.gloss ? `（${item.gloss}）` : ''}。` : '';
      return `第 ${item.index + 1} 張照片，${seen}分類分數：${item.rank}。`;
    })
    .join('');

  let judgement;

  if (claimCategories.length === 0) {
    judgement = `填寫的「${claim}」看不出物資種類，不能當成照片符合。`;
  } else if (decision === 'accepted') {
    const names = claimCategories.map((id) => CATEGORY_BY_ID.get(id)?.zh ?? id).join('、');
    judgement = `最高分類落在捐助者填的「${names}」，和「${claim}」相符。`;
  } else if (focus?.gloss) {
    judgement = `照片內容是${focus.gloss}，和填寫的「${claim}」不一致。`;
  } else if (focus?.top && !claimCategories.includes(focus.top.id)) {
    judgement = `照片更像「${focus.top.zh}」，和填寫的「${claim}」不一致。`;
  } else {
    judgement = `模型和「${claim}」對不上足夠的把握，不能視為通過。`;
  }

  const demandText = demand ? `這筆對應的需求是「${demand}」。` : '';
  const reason = `${photoLines}${judgement}${demandText}已交給機構人工審核。`;
  const decisionText = decision === 'accepted'
    ? `照片辨識為${focus?.top?.zh ?? '所填物資'}，已交給機構審核`
    : `照片和「${claim}」對不上，已交給機構審核`;

  return {
    decision,
    decisionText,
    detected,
    reason,
  };
}
