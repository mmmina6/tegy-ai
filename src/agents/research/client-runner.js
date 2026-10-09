export const researchStages = [
  { id:'evidence', field:'webEvidence', label:'Webの出典を収集中' },
  { id:'landscape', field:'landscape', label:'会社・商品・競合を整理中' },
  { id:'insight', field:'marketInsight', label:'ペルソナ・市場インサイトを作成中' },
  { id:'strategy', field:'strategy', label:'提案方針・確認事項を作成中' }
];

export async function requestResearchStage(input, { fetchImpl = fetch, timeoutMs = 130000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('/api/research', {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify(input), signal:controller.signal
    });
    let payload;
    try { payload = await response.json(); }
    catch { throw new Error(response.status === 504 ? '調査がタイムアウトしました。再試行してください。' : `調査サービスから正常な応答がありません（${response.status}）。再試行してください。`); }
    if (!response.ok) throw new Error(payload.error || '調査を完了できませんでした。再試行してください。');
    return payload;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('接続がタイムアウトしました。再試行してください。');
    if (error instanceof TypeError) throw new Error('通信が途切れました。接続を確認して再試行してください。');
    throw error;
  } finally { clearTimeout(timer); }
}

// checkpoint belongs to one immutable input snapshot. A failed step never clears prior results.
export async function runResearchSteps({ projectContext, researchBook, checkpoint, onProgress = () => {}, request = requestResearchStage }) {
  for (const [index, step] of researchStages.entries()) {
    if (checkpoint[step.field]) continue;
    onProgress({ ...step, index });
    const prior = step.id === 'landscape' ? { webEvidence:checkpoint.webEvidence }
      : step.id === 'insight' ? { landscape:checkpoint.landscape }
      : step.id === 'strategy' ? { landscape:checkpoint.landscape, marketInsight:checkpoint.marketInsight } : {};
    const result = await request({ stage:step.id, projectContext, researchBook, ...prior });
    if (result.stage !== step.id || !result[step.field] || typeof result[step.field] !== 'object' || Array.isArray(result[step.field])) {
      throw new Error('調査結果の形式を確認できませんでした。ページを更新して再試行してください。');
    }
    checkpoint[step.field] = result[step.field];
  }
  return { agent:'research', projectId:projectContext.id, ...checkpoint, createdAt:new Date().toISOString() };
}
