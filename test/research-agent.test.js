import test from 'node:test';
import assert from 'node:assert/strict';
import { runResearchAgent } from '../src/agents/research/index.js';

test('Research Agent builds landscape, Market Insight, and strategy in order', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  const outputs = [
    { candidates: [{ content: { parts: [{ text: 'Grounded evidence summary.' }] }, groundingMetadata: { groundingChunks: [{ web: { title: 'Official source', uri: 'https://example.com/official' } }], webSearchQueries: ['example product official'] } }] },
    { companyAndProduct: [], marketAndTrends: [], competitorAccounts: [], paidAdvertising: [], organicAndVideo: [], platformAndPolicy: [], evidenceGaps: ['Verify market size'] },
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
    assert.equal(result.projectId, 'demo');
    assert.equal(result.marketInsight.primaryMarketInsight, 'Trust reduces decision friction.');
    assert.deepEqual(result.strategy.recommendedWorkSequence, ['AI Script']);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
