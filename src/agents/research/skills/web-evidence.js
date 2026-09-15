import { searchGroundedEvidence } from '../../../services/gemini.js';

function hostname(value = '') {
  try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return ''; }
}

export function buildResearchCollectionPlan(projectContext = {}) {
  const company = projectContext.clientName || projectContext.projectName || projectContext.name || '対象企業';
  const product = projectContext.productName || projectContext.product?.name || projectContext.finalRequirement || projectContext.requirement || '商品・サービス';
  const website = projectContext.website || projectContext.source || projectContext.customerContext?.website || '';
  const platforms = projectContext.platforms || projectContext.product?.platform || 'YouTube Instagram TikTok Meta Google';
  return [
    { area:'company', label:'企業情報', query:`${company} 公式 会社概要 沿革 企業理念 事業内容 ${website}`.trim() },
    { area:'product', label:'商品・サービス', query:`${company} ${product} 公式 商品 特徴 価格 保証 FAQ`.trim() },
    { area:'market', label:'市場・需要', query:`${product} 市場 動向 消費者 ニーズ 業界 統計`.trim() },
    { area:'competitors', label:'競合・対標', query:`${product} 競合 比較 主要企業 ブランド 公式`.trim() },
    { area:'paid', label:'広告・LP', query:`${company} ${product} 広告 キャンペーン LP Meta Ad Library`.trim() },
    { area:'organic', label:'Organic・動画', query:`${company} ${product} YouTube Instagram TikTok 動画 公式 アカウント`.trim() },
    { area:'policy', label:'媒体ルール', query:`${platforms} 公式 広告ポリシー クリエイティブ要件`.trim() }
  ];
}

export function normalizeGroundedSources(sources = [], projectContext = {}, retrievedAt = new Date().toISOString()) {
  const officialHost = hostname(projectContext.website || projectContext.source || projectContext.customerContext?.website || '');
  const seen = new Set();
  return sources.filter(source => {
    if (!source?.url || seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  }).map(source => {
    const domain = hostname(source.url);
    return {
      ...source,
      domain,
      sourceType: officialHost && (domain === officialHost || domain.endsWith(`.${officialHost}`)) ? 'official' : 'reference',
      verificationStatus: 'grounded',
      retrievedAt
    };
  });
}

export async function gatherWebEvidence({ projectContext, researchBook }) {
  const collectionPlan = buildResearchCollectionPlan(projectContext);
  const evidence = await searchGroundedEvidence({
    prompt: `You are TEGY's web evidence collector for an advertising agency's pre-sales research. Search the public web for current, verifiable evidence for every research area below.
Prioritize official company/product pages, official platform policy documentation, government or industry primary sources, official ad libraries, and directly observable competitor accounts. Cover the company itself (history, culture, business and brands) separately from its products/services (features, price, conditions and claims). Separate verified facts from hypotheses. Do not invent performance results or inaccessible data. Write mainly in Japanese; use English only for established product, platform, or marketing terms. For each claim, indicate the research area and make its supporting source easy to identify.

Collection plan: ${JSON.stringify(collectionPlan)}

Project context: ${JSON.stringify(projectContext || {})}
Research Book: ${JSON.stringify(researchBook || [])}`
  });
  const retrievedAt = new Date().toISOString();
  return { ...evidence, sources:normalizeGroundedSources(evidence.sources, projectContext, retrievedAt), collectionPlan, retrievedAt };
}
