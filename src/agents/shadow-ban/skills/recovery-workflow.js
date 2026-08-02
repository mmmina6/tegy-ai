export function buildRecoveryWorkflow({ operationalAudit, signalAnalysis, snapshot = {} }) {
  const flagged = [...operationalAudit.checks, ...operationalAudit.accountChecks].filter(item => item.status === 'review');
  const unknown = [...operationalAudit.checks, ...operationalAudit.accountChecks].filter(item => item.status === 'needs-data');
  const phases = [
    { id:'diagnose', phase:'診断・停止 / Diagnose', period:'Day 1–30', objective:'疑わしい運用を止め、baselineを確立する', tasks:['現在のAnalyticsとplatform noticeを保存','直近50本のContent / SEO inventoryを完成',...flagged.slice(0,4).map(item => `対応：${item.area}`),'一括削除は行わず、公開・非公開・申立てを1本ずつ判断'], exitCriteria:['主要資料が揃っている','高リスク運用を停止','週次baselineを設定'] },
    { id:'rebuild', phase:'品質再構築 / Rebuild', period:'Day 31–60', objective:'独自性、関連性、視聴者価値を再構築する', tasks:['サムネイルとTitleを差別化','一次情報、実演、独自分析を追加','映像・台本・search intentを一致','少量のcontent testを実施'], exitCriteria:['新コンテンツの初回テスト完了','CTR、retention、negative feedbackを比較可能'] },
    { id:'optimize', phase:'最適化・監視 / Optimize', period:'Day 61–90', objective:'改善を検証し、運用基準を固定する', tasks:['Browse / Suggested / Searchを流入元別に比較','変更内容と結果を記録し、一度に多変数を変更しない','Continue / Stop / Scaleの判断を作成','Before / After reportと運用manualを出力'], exitCriteria:['複数週の傾向を説明できる','次期Content / SEO planが完成'] }
  ];
  return { phases, weeklyMetrics:['Impressions','Browse / Suggested / Search share','CTR','Average view duration / retention','Stay to watch / Swipe away','Returning viewers','Negative feedback','Policy / Copyright notices'], evidenceQueue: unknown.map(item => item.area), baseline: { anomalyScore: signalAnalysis.anomalyScore, period: snapshot.period || 'Last 28 days' }, promise: '検証型のrecovery workflowであり、一定期間での配信回復を保証するものではありません。' };
}
