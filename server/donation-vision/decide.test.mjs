import assert from 'node:assert/strict';
import { categoriesInText, decideReview } from './decide.mjs';

const scores = (pairs) => pairs.map(([id, zh, score]) => ({ id, zh, score }));

assert.deepEqual(categoriesInText('白鴿洗衣精'), ['detergent']);
assert.deepEqual(categoriesInText('成人紙尿褲'), ['diaper']);
assert.deepEqual(categoriesInText('15箱礦泉水'), ['water']);
assert.deepEqual(categoriesInText('一箱'), []);

const water = scores([
  ['water', '礦泉水', 0.46],
  ['mask', '醫療口罩', 0.12],
  ['pet', '寵物飼料', 0.08],
]);
const pet = scores([
  ['pet', '寵物飼料', 0.51],
  ['water', '礦泉水', 0.09],
  ['food', '包裝食品', 0.07],
]);

const matched = decideReview({
  images: [{ scores: water, caption: 'a pack of bottled water' }],
  claimedMaterial: '15箱礦泉水',
  demandItem: '瓶裝水',
});
const mismatched = decideReview({
  images: [{ scores: pet, caption: 'a pink cake with a star' }],
  claimedMaterial: '15箱礦泉水',
  demandItem: '瓶裝水',
});
const vague = decideReview({
  images: [{ scores: pet, caption: 'a bag of dog food' }],
  claimedMaterial: '一箱',
  demandItem: '狗飼料',
});

assert.equal(matched.decision, 'accepted');
assert.match(matched.reason, /礦泉水 0\.46/);
assert.equal(mismatched.decision, 'rejected');
assert.match(mismatched.reason, /a pink cake with a star/);
assert.match(mismatched.reason, /點心或蛋糕/);
assert.match(mismatched.reason, /不一致/);
assert.equal(vague.decision, 'rejected');
assert.notEqual(matched.reason, mismatched.reason);
assert.doesNotMatch(matched.reason, /請機構看過照片後決定/);

console.log('decide tests passed');
