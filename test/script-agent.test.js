import test from 'node:test';
import assert from 'node:assert/strict';
import { runScriptAgent } from '../src/agents/script/index.js';
import { resolveScriptType } from '../src/agents/script/script-types.js';

test('script types resolve safely to advertisement by default', () => {
  assert.equal(resolveScriptType('youtube_shooting').id, 'youtube_shooting');
  assert.equal(resolveScriptType('unknown').id, 'advertisement');
});

test('YouTube manual mode preserves the operator draft in the generation workflow', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  const prompts = [];
  const outputs = [
    { productName:'TEGY', description:'Channel', benefits:[], audience:'Creators', platform:'YouTube', durationSeconds:480, objective:'Education', tone:'Clear', cta:'Subscribe', assumptions:[] },
    { personas:[], selectedPersonaIndex:0, selectionReason:'Intent', creativeDirection:'Practical', recommendedHooks:[] },
    { title:'撮影台本', hook:'Cold open', concept:'How-to', fullScript:'Draft', cta:'Subscribe', scenes:[], structure:[], productionNotes:[] }
  ];
  let call = 0;
  globalThis.fetch = async (_url, options) => {
    prompts.push(JSON.parse(options.body).contents[0].parts[0].text);
    return { ok:true, json:async()=>({ candidates:[{ content:{ parts:[{ text:JSON.stringify(outputs[call++]) }] } }] }) };
  };
  try {
    const result = await runScriptAgent({ message:'8分の撮影台本', scriptType:'youtube_shooting', creationMode:'manual', manualDraft:'この文章を残してください' });
    assert.equal(result.scriptType, 'youtube_shooting');
    assert.equal(result.creationMode, 'manual');
    assert.match(prompts[2], /Cold Open/);
    assert.match(prompts[2], /この文章を残してください/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
