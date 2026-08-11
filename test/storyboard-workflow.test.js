import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleStoryboardIndexes, estimatedStoryboardCost, nextAssetReviewStatus } from '../src/agents/script/storyboard-workflow.js';

test('storyboard batch only includes approved AI shots', () => {
  const plans = [
    { source:'ai', planApproved:true, selected:true },
    { source:'upload', planApproved:true, selected:true },
    { source:'ai', planApproved:false, selected:true },
    { source:'ai', planApproved:true, selected:false }
  ];
  assert.deepEqual(eligibleStoryboardIndexes(plans),[0]);
  assert.deepEqual(eligibleStoryboardIndexes(plans,{allApproved:true}),[0,3]);
});

test('storyboard estimates current 1K image output cost and advances review state', () => {
  assert.equal(estimatedStoryboardCost(3),0.201);
  assert.equal(nextAssetReviewStatus('draft'),'review');
  assert.equal(nextAssetReviewStatus('review'),'approved');
});
