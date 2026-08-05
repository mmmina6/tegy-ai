import test from 'node:test';
import assert from 'node:assert/strict';
import { runAnimeScriptAgent } from '../src/agents/anime/index.js';

test('Anime Script Agent creates a treatment before the text storyboard', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  const outputs = [
    { title:'Morning',logline:'A short story',targetDurationSeconds:15,aspectRatio:'9:16',tone:'Warm',visualApproach:'2D anime',fullScript:'Narration',characters:[],productionRules:[] },
    { totalSeconds:15,scenes:[{sceneNumber:1,title:'Opening',location:'Home',sceneSeconds:15,shots:[{shotNumber:'01-01',seconds:15,visual:'Room',characterAction:'Looks up',camera:'Close-up',dialogueNarration:'Hello',onScreenText:'',audio:'BGM',transition:'Cut',imagePrompt:'Anime room',productionNote:''}]}],timingNotes:[] }
  ];
  let call = 0;
  globalThis.fetch = async () => ({ ok:true, json:async () => ({ candidates:[{content:{parts:[{text:JSON.stringify(outputs[call++])}]}}] }) });
  try {
    const result = await runAnimeScriptAgent({ projectContext:{id:'demo'}, animeBrief:{mode:'auto',durationSeconds:15} });
    assert.equal(call, 2);
    assert.equal(result.projectId, 'demo');
    assert.equal(result.treatment.title, 'Morning');
    assert.equal(result.textStoryboard.scenes[0].shots[0].shotNumber, '01-01');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalKey;
  }
});
