import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStoryboardImage } from '../src/services/gemini-image.js';

test('storyboard image service keeps the key server-side and returns a data URL', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'image-test-key';
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers['x-goog-api-key'], 'image-test-key');
    assert.doesNotMatch(options.body, /image-test-key/);
    const body = JSON.parse(options.body);
    assert.deepEqual(body.generationConfig.responseModalities, ['IMAGE']);
    return { ok:true, json:async()=>({ candidates:[{ content:{ parts:[{ inlineData:{ mimeType:'image/png', data:'YWJj' } }] } }] }) };
  };
  try {
    const result = await generateStoryboardImage({ prompt:'Shot 1', aspectRatio:'16:9' });
    assert.equal(result.dataUrl, 'data:image/png;base64,YWJj');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
