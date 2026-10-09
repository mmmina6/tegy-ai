import { analyzeMarketLandscape } from './skills/market-landscape.js';
import { buildMarketInsight } from './skills/market-insight.js';
import { buildStrategySummary } from './skills/strategy-summary.js';
import { gatherWebEvidence } from './skills/web-evidence.js';

// Each HTTP request performs one model call; completed steps can be retried independently.
export async function runResearchStage({ stage, projectContext, researchBook, webEvidence, landscape, marketInsight }) {
  if (stage === 'evidence') {
    const evidence = await gatherWebEvidence({ projectContext, researchBook });
    if (!evidence.summary?.trim() || !evidence.sources?.length) {
      throw Object.assign(new Error('No grounded sources returned.'), { code:'RESEARCH_NO_SOURCES' });
    }
    return { webEvidence:evidence };
  }
  if (stage === 'landscape') return { landscape:await analyzeMarketLandscape({ projectContext, researchBook, webEvidence }) };
  if (stage === 'insight') return { marketInsight:await buildMarketInsight({ projectContext, landscape }) };
  if (stage === 'strategy') return { strategy:await buildStrategySummary({ projectContext, landscape, marketInsight }) };
  throw new Error('Unknown Research stage.');
}

export async function runResearchAgent({ projectContext, researchBook, enableWebResearch = true }) {
  const webEvidence = enableWebResearch ? await gatherWebEvidence({ projectContext, researchBook }) : { summary:'', sources:[], searchQueries:[] };
  const landscape = await analyzeMarketLandscape({ projectContext, researchBook, webEvidence });
  const marketInsight = await buildMarketInsight({ projectContext, landscape });
  const strategy = await buildStrategySummary({ projectContext, landscape, marketInsight });
  return {
    agent: 'research', projectId: projectContext?.id,
    webEvidence, landscape, marketInsight, strategy, createdAt: new Date().toISOString()
  };
}
