const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function keyAndModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  return { apiKey, model:process.env.GEMINI_VIDEO_MODEL || 'veo-3.1-fast-generate-preview' };
}

export async function startVideoGeneration({ prompt, imageDataUrl, aspectRatio = '16:9', durationSeconds = 8, resolution = '720p' }) {
  const { apiKey, model } = keyAndModel();
  const instance = { prompt };
  if (imageDataUrl) {
    const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('Starting image must be a base64 data URL.');
    instance.image = { inlineData:{ mimeType:match[1], data:match[2] } };
  }
  const response = await fetch(`${API_BASE}/models/${encodeURIComponent(model)}:predictLongRunning`, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-goog-api-key':apiKey }, body:JSON.stringify({ instances:[instance], parameters:{ aspectRatio, durationSeconds:Number(durationSeconds), resolution, sampleCount:1 } }) });
  const payload = await response.json();
  if (!response.ok || !payload.name) throw new Error(payload?.error?.message || `Video generation failed (${response.status}).`);
  return { operation:payload.name, model, durationSeconds:Number(durationSeconds), resolution };
}

export async function getVideoOperation(operation) {
  const { apiKey } = keyAndModel();
  if (!/^operations\/[a-zA-Z0-9._/-]+$/.test(operation)) throw new Error('Invalid video operation.');
  const response = await fetch(`${API_BASE}/${operation}`, { headers:{ 'x-goog-api-key':apiKey } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `Video status failed (${response.status}).`);
  const sample = payload?.response?.generateVideoResponse?.generatedSamples?.[0];
  return { operation, done:Boolean(payload.done), error:payload.error?.message || null, videoUri:sample?.video?.uri || null, mimeType:sample?.video?.mimeType || 'video/mp4' };
}

export async function downloadGeneratedVideo(uri) {
  const { apiKey } = keyAndModel();
  const url = new URL(uri);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('googleapis.com')) throw new Error('Invalid generated video URL.');
  const response = await fetch(url, { headers:{ 'x-goog-api-key':apiKey }, redirect:'follow' });
  if (!response.ok) throw new Error(`Video download failed (${response.status}).`);
  return response;
}
