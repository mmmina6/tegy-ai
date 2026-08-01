import { analyzeMarketLandscape } from './skills/market-landscape.js';
import { buildMarketInsight } from './skills/market-insight.js';
import { buildStrategySummary } from './skills/strategy-summary.js';

export async function runResearchAgent({ projectContext, researchBook }) {
  const landscape = await analyzeMarketLandscape({ projectContext, researchBook });
  const marketInsight = await buildMarketInsight({ projectContext, landscape });
  const strategy = await buildStrategySummary({ projectContext, landscape, marketInsight });
  return {
    agent: 'research', projectId: projectContext?.id,
    landscape, marketInsight, strategy, createdAt: new Date().toISOString()
  };
}
