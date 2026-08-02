const n = value => Number.isFinite(Number(value)) ? Number(value) : null;
const known = value => value === 'yes' || value === 'no';

const rule = (id, area, value, threshold, recommendation) => ({
  id, area, value, threshold, status: value === null ? 'needs-data' : threshold.test(value) ? 'review' : 'pass', recommendation
});

export function runOperationalAudit(snapshot = {}) {
  const checks = [
    rule('thumbnail-repeat', '缩略图重复', n(snapshot.thumbnailDuplicatePercent), { label: '< 47%', test: value => value >= 47 }, '抽样直近 50 条，用图像相似度复核并刷新高重复模板。'),
    rule('script-similarity', '脚本模板化', n(snapshot.scriptSimilarityPercent), { label: '< 60%', test: value => value >= 60 }, '增加真实经验、采访、数据或独立分析，避免只改写同一模板。'),
    rule('stock-reuse', '素材重复', n(snapshot.repeatedStockUsesIn20), { label: '< 3 / 20条', test: value => value >= 3 }, '记录素材 ID、出现顺序和时长，替换高频重复片段。'),
    rule('hashtags', 'Hashtag 密度', n(snapshot.hashtagsPerVideo), { label: 'TEGY review: ≤ 3', test: value => value > 3 }, '只保留与视频主题直接相关的标签，禁止关键词堆砌。'),
    rule('upload-density', '发布密度', n(snapshot.uploadsPerDay), { label: 'TEGY review: < 3/day', test: value => value >= 3 }, '恢复稳定发布节奏，并用单条质量和观众反馈决定频率。'),
    rule('human-originality', '原创/真人信息', n(snapshot.humanOriginalPercent), { label: 'TEGY target: ≥ 40%', test: value => value < 40 }, '补充一次信息、真实演示、肉声或原创观点；比例仅作为内部制作目标。')
  ];
  const riskFields = [
    ['defaultAiVoice','默认 AI 音声'],['semanticMismatch','画面与脚本不相关'],['bulkDeletion','大量删除视频'],
    ['abruptChannelChanges','频道信息突然变更'],['copyrightIssues','版权 / Content ID'],['negativeFeedback','负面反馈'],
    ['incompleteProfile','频道资料不完整'],['verificationIncomplete','频道认证未完成'],['linkedAccountHistory','关联账号风险']
  ];
  const accountChecks = riskFields.map(([id, area]) => ({ id, area, status: snapshot[id] === 'yes' ? 'review' : snapshot[id] === 'no' ? 'pass' : 'needs-data', evidence: known(snapshot[id]) ? `Operator selected: ${snapshot[id]}` : '未提供证据' }));
  const all = [...checks, ...accountChecks];
  return {
    checks, accountChecks,
    summary: {
      review: all.filter(item => item.status === 'review').length,
      pass: all.filter(item => item.status === 'pass').length,
      needsData: all.filter(item => item.status === 'needs-data').length
    },
    note: '数值为 TEGY 内部复核触发器，不代表 YouTube 官方处罚阈值。'
  };
}
