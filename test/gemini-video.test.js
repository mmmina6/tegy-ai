import test from 'node:test';
import assert from 'node:assert/strict';
import { startVideoGeneration, getVideoOperation } from '../src/services/gemini-video.js';

test('Veo service starts and polls a long-running video operation', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'server-only-key';
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url:String(url), options });
    if (String(url).includes(':predictLongRunning')) return { ok:true, json:async () => ({ name:'operations/video-1' }) };
    return { ok:true, json:async () => ({ done:true, response:{ generateVideoResponse:{ generatedSamples:[{ video:{ uri:'https://generativelanguage.googleapis.com/file.mp4', mimeType:'video/mp4' } }] } } }) };
  };
  try {
    const started = await startVideoGeneration({ prompt:'Animate this approved storyboard frame', durationSeconds:8 });
    assert.equal(started.operation,'operations/video-1');
    const status = await getVideoOperation(started.operation);
    assert.equal(status.done,true);
    assert.equal(status.videoUri,'https://generativelanguage.googleapis.com/file.mp4');
    assert.equal(calls[0].options.headers['x-goog-api-key'],'server-only-key');
    assert.equal(calls[1].options.headers['x-goog-api-key'],'server-only-key');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalKey;
  }
});

test('Veo status rejects arbitrary operation paths', async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'server-only-key';
  try { await assert.rejects(() => getVideoOperation('https://evil.example.com'), /Invalid video operation/); }
  finally { if (originalKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalKey; }
});
