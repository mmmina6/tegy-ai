export const STORYBOARD_IMAGE_PRICE_USD_1K = 0.067;

export function estimatedStoryboardCost(count, unitPrice = STORYBOARD_IMAGE_PRICE_USD_1K) {
  return Math.max(0, Number(count) || 0) * unitPrice;
}

export function eligibleStoryboardIndexes(plans, { allApproved = false } = {}) {
  return plans.map((plan,index) => ({ plan,index })).filter(({plan}) => plan?.source === 'ai' && plan.planApproved && (allApproved || plan.selected)).map(({index}) => index);
}

export function nextAssetReviewStatus(status) {
  return status === 'draft' ? 'review' : 'approved';
}
