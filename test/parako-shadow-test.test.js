import test from 'node:test';
import assert from 'node:assert/strict';
import { parakoProject, parakoProjectDetails, parakoWorks, parakoShadowResult } from '../src/fixtures/parako-shadow-test.js';

test('Parako test project opens the Shadow Ban / SEO work by default', () => {
  assert.equal(parakoProject.id, 'parako-shadow-test');
  assert.equal(parakoProjectDetails.defaultNode, 'shadow');
  assert.ok(parakoWorks.some(work => work.id === 'shadow'));
});

test('public audit does not claim a confirmed shadow ban', () => {
  assert.equal(parakoShadowResult.diagnosis.confirmedRestriction, false);
  assert.match(parakoShadowResult.diagnosis.confidence, /Limited for platform restrictions/);
  assert.ok(parakoShadowResult.publicSnapshot.some(item => item.metric === 'Subscribers'));
  assert.ok(parakoShadowResult.publicSnapshot.some(item => item.metric === 'Total views'));
});

test('private YouTube metrics are explicitly marked as Studio data', () => {
  const studio = parakoShadowResult.dataCoverage.studioRequired.join(' ');
  assert.match(studio, /Impressions/);
  assert.match(studio, /CTR/);
  assert.match(studio, /retention/);
  const unavailableSignals = parakoShadowResult.signalAnalysis.signals.filter(signal => signal.status === 'needs-data');
  assert.ok(unavailableSignals.length >= 4);
  assert.ok(unavailableSignals.every(signal => /Needs/.test(signal.value)));
});

test('all evidence references use public https URLs', () => {
  assert.ok(parakoShadowResult.evidenceSources.length >= 4);
  assert.ok(parakoShadowResult.evidenceSources.every(source => source.url.startsWith('https://')));
});
