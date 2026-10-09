import { runResearchAgent, runResearchStage } from '../src/agents/research/index.js';

const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  response.setHeader('Cache-Control', 'no-store');
  const { projectContext, researchBook, enableWebResearch = true, stage, webEvidence, landscape, marketInsight } = request.body || {};
  if (!isObject(projectContext)) return response.status(400).json({ error: 'Project context is required.' });
  if (!Array.isArray(researchBook)) return response.status(400).json({ error: 'Research Book is required.' });
  if (JSON.stringify(request.body).length > 600000) return response.status(413).json({ error:'調査資料が大きすぎます。入力資料を減らして再実行してください。' });
  if (stage !== undefined) {
    if (!['evidence','landscape','insight','strategy'].includes(stage)) return response.status(400).json({ error:'Unknown Research stage.' });
    if ((stage === 'landscape' && (!isObject(webEvidence) || !Array.isArray(webEvidence.sources) || !webEvidence.sources.length)) ||
        (['insight','strategy'].includes(stage) && !isObject(landscape)) ||
        (stage === 'strategy' && !isObject(marketInsight))) {
      return response.status(400).json({ error:'前の調査ステップの結果がありません。', code:'MISSING_RESEARCH_STAGE' });
    }
  }

  try {
    if (stage) return response.status(200).json({ stage, ...await runResearchStage({ stage, projectContext, researchBook, webEvidence, landscape, marketInsight }) });
    // Compatibility for already-open clients; new clients use the staged path above.
    return response.status(200).json(await runResearchAgent({ projectContext, researchBook, enableWebResearch }));
  } catch (error) {
    console.error('Research stage failed', { stage:stage || 'legacy', code:error.code, status:error.status });
    let status = 502, code = 'RESEARCH_FAILED', message = '調査サービスに接続できませんでした。時間をおいて再試行してください。';
    if (error.code === 'MODEL_NOT_CONFIGURED' || [401,403,404].includes(error.status)) {
      status = 503; code = 'MODEL_CONFIGURATION'; message = 'AIの接続設定・モデルの利用権限を管理者に確認してください。';
    } else if (error.code === 'MODEL_TIMEOUT') {
      status = 504; code = error.code; message = 'この調査ステップが時間内に完了しませんでした。再試行できます。';
    } else if (error.status === 429) {
      status = 429; code = 'MODEL_RATE_LIMIT'; message = 'AIの利用上限に達しました。時間をおくか、管理者に利用枠を確認してください。';
    } else if (error.code === 'RESEARCH_NO_SOURCES') {
      status = 422; code = error.code; message = '確認できる出典を取得できませんでした。会社名・公式URL・調査内容を確認して再試行してください。';
    }
    return response.status(status).json({ error:message, code, stage });
  }
}
