import test from 'node:test';
import assert from 'node:assert/strict';
import { runResearchSteps, requestResearchStage, researchStages } from '../src/agents/research/client-runner.js';
import handler from '../api/research.js';

test('Research retries only the failed and subsequent steps, retaining evidence', async () => {
  const checkpoint = {};
  const calls = [];
  let fail = true;
  const request = async input => {
    calls.push(input.stage);
    if (input.stage === 'insight' && fail) throw new Error('interrupted');
    const step = researchStages.find(item => item.id === input.stage);
    if (input.stage === 'landscape') assert.equal(input.webEvidence.marker, 'evidence');
    if (input.stage === 'strategy') assert.equal(input.marketInsight.marker, 'insight');
    return { stage:input.stage, [step.field]:{ marker:input.stage } };
  };
  const input = { projectContext:{ id:'project-a' }, researchBook:[], checkpoint, request };
  await assert.rejects(runResearchSteps(input), /interrupted/);
  assert.equal(checkpoint.webEvidence.marker, 'evidence');
  assert.equal(checkpoint.landscape.marker, 'landscape');
  fail = false;
  const result = await runResearchSteps(input);
  assert.deepEqual(calls, ['evidence','landscape','insight','insight','strategy']);
  assert.equal(result.projectId, 'project-a');
  assert.equal(result.strategy.marker, 'strategy');
});

test('Research reports non-JSON gateway failures instead of a JSON parse error', async () => {
  await assert.rejects(requestResearchStage({}, { fetchImpl:async () => ({ status:504, ok:false, json:async () => { throw new SyntaxError('HTML'); } }) }), /タイムアウト/);
});

test('Research times out stalled connections and aborts the request', async () => {
  await assert.rejects(requestResearchStage({}, {
    timeoutMs:5,
    fetchImpl:async (_url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))
  }), /タイムアウト/);
});

test('Research stops when a response contains the wrong stage', async () => {
  const checkpoint = {};
  await assert.rejects(runResearchSteps({ projectContext:{}, researchBook:[], checkpoint, request:async () => ({ stage:'strategy', webEvidence:{} }) }), /形式/);
  assert.deepEqual(checkpoint, {});
});

function responseMock() {
  return { statusCode:200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; return this; } };
}

test('Research API rejects missing stage prerequisites before a model call', async () => {
  const response = responseMock();
  await handler({ method:'POST', body:{ stage:'strategy', projectContext:{ id:'a' }, researchBook:[] } }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.code, 'MISSING_RESEARCH_STAGE');
});

test('Research API performs one model call for an evidence step', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return { ok:true, json:async () => ({ candidates:[{ content:{ parts:[{ text:'Official company evidence' }] }, groundingMetadata:{ groundingChunks:[{ web:{ title:'Company', uri:'https://example.com' } }] } }] }) };
  };
  try {
    const response = responseMock();
    await handler({ method:'POST', body:{ stage:'evidence', projectContext:{ id:'a' }, researchBook:[] } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(calls, 1);
    assert.equal(response.payload.webEvidence.sources.length, 1);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});
