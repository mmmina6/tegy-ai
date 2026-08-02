const n = value => Number.isFinite(Number(value)) ? Number(value) : null;
const known = value => value === 'yes' || value === 'no';

const rule = (id, area, value, threshold, recommendation) => ({
  id, area, value, threshold, status: value === null ? 'needs-data' : threshold.test(value) ? 'review' : 'pass', recommendation
});

export function runOperationalAudit(snapshot = {}) {
  const checks = [
    rule('thumbnail-repeat', 'サムネイルの重複', n(snapshot.thumbnailDuplicatePercent), { label: '< 47%', test: value => value >= 47 }, '直近50本を抽出し、画像類似度を再確認して重複テンプレートを刷新します。'),
    rule('script-similarity', '台本のテンプレート化', n(snapshot.scriptSimilarityPercent), { label: '< 60%', test: value => value >= 60 }, '実体験、取材、データ、独自分析を追加し、同一テンプレートの言い換えを避けます。'),
    rule('stock-reuse', '素材の重複利用', n(snapshot.repeatedStockUsesIn20), { label: '< 3 / 20 videos', test: value => value >= 3 }, '素材ID、登場順、使用秒数を記録し、高頻度素材を差し替えます。'),
    rule('hashtags', 'Hashtag density', n(snapshot.hashtagsPerVideo), { label: 'TEGY review: ≤ 3', test: value => value > 3 }, '動画テーマに直接関係するタグだけを残し、keyword stuffingを避けます。'),
    rule('upload-density', '投稿密度', n(snapshot.uploadsPerDay), { label: 'TEGY review: < 3/day', test: value => value >= 3 }, '安定した投稿ペースに戻し、1本ごとの品質と視聴者反応から頻度を判断します。'),
    rule('human-originality', '一次情報・人間関与', n(snapshot.humanOriginalPercent), { label: 'TEGY target: ≥ 40%', test: value => value < 40 }, '一次情報、実写、肉声、独自見解を追加します。この比率は社内制作目標です。')
  ];
  const riskFields = [
    ['defaultAiVoice','デフォルトAI音声の反復'],['semanticMismatch','映像と台本の不一致'],['bulkDeletion','動画の一括削除'],
    ['abruptChannelChanges','チャンネル情報の急変'],['copyrightIssues','Copyright / Content ID'],['negativeFeedback','否定的なフィードバック'],
    ['incompleteProfile','チャンネル情報の不足'],['verificationIncomplete','チャンネル認証の未完了'],['linkedAccountHistory','関連アカウントのリスク']
  ];
  const accountChecks = riskFields.map(([id, area]) => ({ id, area, status: snapshot[id] === 'yes' ? 'review' : snapshot[id] === 'no' ? 'pass' : 'needs-data', evidence: known(snapshot[id]) ? `Operator selected: ${snapshot[id]}` : '確認資料なし' }));
  const all = [...checks, ...accountChecks];
  return {
    checks, accountChecks,
    summary: { review: all.filter(item => item.status === 'review').length, pass: all.filter(item => item.status === 'pass').length, needsData: all.filter(item => item.status === 'needs-data').length },
    note: '数値基準はTEGY社内のレビュー条件であり、YouTube公式のペナルティ基準ではありません。'
  };
}
