export function buildRecoveryWorkflow({ operationalAudit, signalAnalysis, snapshot = {} }) {
  const flagged = [...operationalAudit.checks, ...operationalAudit.accountChecks].filter(item => item.status === 'review');
  const unknown = [...operationalAudit.checks, ...operationalAudit.accountChecks].filter(item => item.status === 'needs-data');
  const phases = [
    { id:'diagnose', period:'Day 1–30', objective:'停止可疑模式并建立基线', tasks:['保存当前 Analytics 导出与平台通知','完成直近 50 条内容/SEO 清单',...flagged.slice(0,4).map(item => `处理：${item.area}`),'不要批量删除；先逐条判断是否保持公开、非公开或申诉'], exitCriteria:['关键资料齐全','高风险模式停止','建立每周基线'] },
    { id:'rebuild', period:'Day 31–60', objective:'重建原创性、相关性与观众价值', tasks:['制作差异化缩略图和标题','增加一次信息、真实演示或原创分析','确保画面、台本与搜索意图一致','用小批量内容测试而非一次大量发布'], exitCriteria:['完成至少一轮新内容测试','CTR、停留和负面反馈可比较'] },
    { id:'optimize', period:'Day 61–90', objective:'验证改善并固定运营标准', tasks:['按来源比较推荐、搜索和订阅流量','记录每条改动与结果，避免同时改太多变量','形成继续/停止/扩大测试结论','输出 Before / After 报告和运营手册'], exitCriteria:['连续多周趋势可解释','形成下一周期内容与 SEO 计划'] }
  ];
  return {
    phases,
    weeklyMetrics:['Impressions','Browse / Suggested / Search share','CTR','Average view duration / retention','Stay to watch / Swipe away','Returning viewers','Negative feedback','Policy / Copyright notices'],
    evidenceQueue: unknown.map(item => item.area),
    baseline: { anomalyScore: signalAnalysis.anomalyScore, period: snapshot.period || 'Last 28 days' },
    promise: '这是验证型恢复流程，不保证平台在固定天数恢复分发。'
  };
}
