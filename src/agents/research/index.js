import { analyzeMarketLandscape } from './skills/market-landscape.js';
import { buildMarketInsight } from './skills/market-insight.js';
import { buildStrategySummary } from './skills/strategy-summary.js';
import { gatherWebEvidence } from './skills/web-evidence.js';

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
