const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const changeRate = (current, baseline) => baseline > 0 ? (current - baseline) / baseline * 100 : 0;

export function analyzeDistributionSignals(snapshot = {}) {
  const baselineImpressions = number(snapshot.baselineImpressions);
  const recentImpressions = number(snapshot.recentImpressions);
  const impressionChangePercent = changeRate(recentImpressions, baselineImpressions);
  const recommendationTrafficPercent = number(snapshot.recommendationTrafficPercent);
  const searchTrafficPercent = number(snapshot.searchTrafficPercent);
  const clickThroughRate = number(snapshot.clickThroughRate);
  const averageRetentionPercent = number(snapshot.averageRetentionPercent);
  const stayToWatchPercent = number(snapshot.stayToWatchPercent);
  const policyWarnings = Math.max(0, number(snapshot.policyWarnings));

  const signals = [
    { id: 'impressions', label: 'Impression trend', value: impressionChangePercent, unit: '%', status: impressionChangePercent <= -60 ? 'critical' : impressionChangePercent <= -30 ? 'review' : 'healthy' },
    { id: 'recommendation', label: 'Recommendation traffic', value: recommendationTrafficPercent, unit: '%', status: recommendationTrafficPercent < 5 ? 'critical' : recommendationTrafficPercent < 15 ? 'review' : 'healthy' },
    { id: 'search', label: 'Search visibility', value: searchTrafficPercent, unit: '%', status: searchTrafficPercent < 2 ? 'review' : 'healthy' },
    { id: 'ctr', label: 'Click-through rate', value: clickThroughRate, unit: '%', status: clickThroughRate < 2 ? 'review' : 'healthy' },
    { id: 'retention', label: 'Average retention', value: averageRetentionPercent, unit: '%', status: averageRetentionPercent < 25 ? 'review' : 'healthy' },
    { id: 'stay', label: 'Stay to watch', value: stayToWatchPercent, unit: '%', status: !stayToWatchPercent ? 'unknown' : stayToWatchPercent < 30 ? 'critical' : stayToWatchPercent < 45 ? 'review' : 'healthy' },
    { id: 'policy', label: 'Policy warnings', value: policyWarnings, unit: '', status: policyWarnings > 0 ? 'critical' : 'healthy' }
  ];
  const weights = { critical: 20, review: 9, healthy: 0, unknown: 0 };
  const anomalyScore = Math.min(100, signals.reduce((sum, signal) => sum + weights[signal.status], 0));
  return {
    platform: snapshot.platform || 'YouTube', channelUrl: snapshot.channelUrl || '', period: snapshot.period || 'Last 28 days',
    baselineImpressions, recentImpressions, impressionChangePercent: Math.round(impressionChangePercent * 10) / 10,
    signals, anomalyScore, dataQuality: baselineImpressions && recentImpressions ? 'sufficient' : 'limited',
    auditBenchmarks: {
      thumbnailDuplicatePercent: number(snapshot.thumbnailDuplicatePercent),
      scriptSimilarityPercent: number(snapshot.scriptSimilarityPercent),
      repeatedStockUsesIn20: number(snapshot.repeatedStockUsesIn20),
      hashtagsPerVideo: number(snapshot.hashtagsPerVideo),
      uploadsPerDay: number(snapshot.uploadsPerDay),
      humanOriginalPercent: number(snapshot.humanOriginalPercent)
    }
  };
}
