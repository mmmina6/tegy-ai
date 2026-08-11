import test from 'node:test';
import assert from 'node:assert/strict';
import { generateHuggingFaceAnimeImage } from '../src/services/huggingface-anime-image.js';

test('Hugging Face Anime image adapter returns a server-side data URL', async () => {
  let request;
  const client = { textToImage:async options => { request=options; return new Blob([Buffer.from('anime')], { type:'image/png' }); } };
  const result = await generateHuggingFaceAnimeImage({ prompt:'A cat fashion vlogger', aspectRatio:'9:16', client });
  assert.equal(request.parameters.width, 576);
  assert.equal(request.parameters.height, 1024);
  assert.match(request.inputs, /anime production keyframe/i);
  assert.equal(result.dataUrl, 'data:image/png;base64,YW5pbWU=');
  assert.equal(result.provider, 'Hugging Face Inference Providers');
});
