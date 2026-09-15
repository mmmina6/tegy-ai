import test from 'node:test';
import assert from 'node:assert/strict';
import { runResearchAgent } from '../src/agents/research/index.js';
import { buildResearchCollectionPlan, normalizeGroundedSources } from '../src/agents/research/skills/web-evidence.js';

test('Research collection plan covers the advertising research foundation', () => {
  const plan = buildResearchCollectionPlan({ projectName:'花王', productName:'THE CORE', website:'https://www.kao.com/' });
  assert.deepEqual(plan.map(item => item.area), ['company','product','market','competitors','paid','organic','policy']);
  assert.match(plan[0].query, /花王/);
  assert.match(plan[1].query, /THE CORE/);
});

test('Grounded sources are deduplicated and official sources are identified', () => {
  const sources = normalizeGroundedSources([
    { title:'Kao', url:'https://www.kao.com/jp/' },
    { title:'Duplicate', url:'https://www.kao.com/jp/' },
    { title:'Industry', url:'https://example.org/report' }
  ], { website:'https://www.kao.com/' }, '2026-09-15T00:00:00.000Z');
  assert.equal(sources.length, 2);
  assert.equal(sources[0].sourceType, 'official');
  assert.equal(sources[1].sourceType, 'reference');
  assert.equal(sources[0].verificationStatus, 'grounded');
});

test('Research Agent builds landscape, Market Insight, and strategy in order', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  const outputs = [
    { candidates: [{ content: { parts: [{ text: 'Grounded evidence summary.' }] }, groundingMetadata: { groundingChunks: [{ web: { title: 'Official source', uri: 'https://example.com/official' } }], webSearchQueries: ['example product official'] } }] },
    { companyProfile: [], productPortfolio: [], companyAndProduct: [], marketAndTrends: [], competitorAccounts: [], paidAdvertising: [], organicAndVideo: [], platformAndPolicy: [], evidenceGaps: ['Verify market size'] },
    { marketPersonas: [], primaryMarketInsight: 'Trust reduces decision friction.', supportingInsights: [], demandSignals: [], communicationOpportunities: [], risksAndUnknowns: [] },
    { executiveSummary: 'Evidence-aware summary.', strategicDirections: [], clientQuestions: [], nextResearchTasks: [], recommendedWorkSequence: ['AI Script'] }
  ];
  let call = 0;
  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    if (body.tools) return { ok: true, json: async () => outputs[call++] };
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(outputs[call++]) }] } }] }) };
  };

  try {
    const result = await runResearchAgent({ projectContext: { id: 'demo' }, researchBook: [] });
    assert.equal(call, 4);
    assert.equal(result.webEvidence.sources[0].title, 'Official source');
    assert.equal(result.webEvidence.collectionPlan.length, 7);
    assert.equal(result.projectId, 'demo');
    assert.equal(result.marketInsight.primaryMarketInsight, 'Trust reduces decision friction.');
    assert.deepEqual(result.strategy.recommendedWorkSequence, ['AI Script']);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
