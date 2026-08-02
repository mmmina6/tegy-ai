import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeDistributionSignals } from '../src/agents/shadow-ban/skills/signal-analysis.js';
import { runShadowBanAgent } from '../src/agents/shadow-ban/index.js';
import { runOperationalAudit } from '../src/agents/shadow-ban/skills/operational-audit.js';
import { buildSeoOperations } from '../src/agents/shadow-ban/skills/seo-operations.js';
import { buildRecoveryWorkflow } from '../src/agents/shadow-ban/skills/recovery-workflow.js';

test('signal analysis flags sharp distribution loss without declaring a ban', () => {
  const result = analyzeDistributionSignals({ baselineImpressions: 100000, recentImpressions: 30000, recommendationTrafficPercent: 4, searchTrafficPercent: 1, clickThroughRate: 4, averageRetentionPercent: 40, policyWarnings: 0 });
  assert.equal(result.impressionChangePercent, -70);
  assert.equal(result.signals.find(signal => signal.id === 'impressions').status, 'critical');
  assert.equal(result.signals.find(signal => signal.id === 'recommendation').status, 'critical');
  assert.ok(result.anomalyScore > 0);
  assert.equal('confirmedRestriction' in result, false);
});

test('operational audit turns TEGY review rules into evidence-aware checks', () => {
  const result = runOperationalAudit({ thumbnailDuplicatePercent: 52, scriptSimilarityPercent: 30, bulkDeletion: 'unknown', verificationIncomplete: 'yes' });
  assert.equal(result.checks.find(item => item.id === 'thumbnail-repeat').status, 'review');
  assert.equal(result.checks.find(item => item.id === 'script-similarity').status, 'pass');
  assert.equal(result.accountChecks.find(item => item.id === 'bulkDeletion').status, 'needs-data');
  assert.equal(result.accountChecks.find(item => item.id === 'verificationIncomplete').status, 'review');
  assert.match(result.note, /内部复核/);
});

test('SEO operations request source material instead of inventing an audit', () => {
  const missing = buildSeoOperations({});
  assert.equal(missing.sourceProvided, false);
  assert.ok(missing.requiredInputs.length >= 4);
  const supplied = buildSeoOperations({ recentContentNotes: 'title | description | query' });
  assert.equal(supplied.sourceProvided, true);
});

test('recovery workflow creates three operational phases and an evidence queue', () => {
  const operationalAudit = runOperationalAudit({ thumbnailDuplicatePercent: 55 });
  const workflow = buildRecoveryWorkflow({ operationalAudit, signalAnalysis: { anomalyScore: 45 }, snapshot: { period: '28 days' } });
  assert.equal(workflow.phases.length, 3);
  assert.equal(workflow.baseline.anomalyScore, 45);
  assert.ok(workflow.evidenceQueue.length > 0);
  assert.match(workflow.promise, /不保证/);
});

test('Shadow Ban Agent combines deterministic signals with cautious AI diagnosis', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  const outputs = [
    { metadataFindings: [], contentPatternFindings: [], possiblePolicyRisks: [], seoGaps: ['Review titles'], missingEvidence: ['Traffic source history'] },
    { healthScore: 62, riskLevel: 'Review', confidence: 'Limited', diagnosis: 'Distribution changed, but no restriction is confirmed.', confirmedRestriction: false, likelyCauses: [], actions: [], verificationSteps: ['Compare traffic sources'], monitoringMetrics: ['Impressions'], disclaimer: 'Performance metrics alone cannot confirm a shadow ban.' }
  ];
  let call = 0;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(outputs[call++]) }] } }] }) });
  try {
    const result = await runShadowBanAgent({ projectContext: { id: 'demo' }, channelSnapshot: { baselineImpressions: 100, recentImpressions: 60 } });
    assert.equal(call, 2);
    assert.equal(result.projectId, 'demo');
    assert.ok(result.operationalAudit);
    assert.ok(result.seoOperations);
    assert.equal(result.recoveryWorkflow.phases.length, 3);
    assert.equal(result.diagnosis.confirmedRestriction, false);
    assert.match(result.diagnosis.disclaimer, /cannot confirm/i);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
