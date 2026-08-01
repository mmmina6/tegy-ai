import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStructured } from '../src/services/gemini.js';

test('Gemini service keeps the API key server-side and parses structured output', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';

  globalThis.fetch = async (url, options) => {
    assert.match(url, /gemini-2\.5-flash:generateContent$/);
    assert.equal(options.headers['x-goog-api-key'], 'test-key');
    const body = JSON.parse(options.body);
    assert.equal(body.generationConfig.responseMimeType, 'application/json');
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] }) };
  };

  try {
    assert.deepEqual(await generateStructured({ prompt: 'test', schema: { type: 'OBJECT' } }), { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});

test('Gemini service fails clearly when no key is configured', async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    await assert.rejects(() => generateStructured({ prompt: 'test', schema: {} }), /GEMINI_API_KEY/);
  } finally {
    if (originalKey !== undefined) process.env.GEMINI_API_KEY = originalKey;
  }
});
