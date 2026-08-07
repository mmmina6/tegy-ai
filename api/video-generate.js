import { startVideoGeneration } from '../src/services/gemini-video.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error:'Method not allowed.' });
  const { prompt, imageDataUrl, aspectRatio, durationSeconds, resolution } = request.body || {};
  if (!prompt || prompt.length > 12000) return response.status(400).json({ error:'A valid video prompt is required.' });
  try { return response.status(202).json(await startVideoGeneration({ prompt, imageDataUrl, aspectRatio, durationSeconds, resolution })); }
  catch (error) { console.error('Video start failed:', error); return response.status(error.message.includes('GEMINI_API_KEY') ? 503 : 502).json({ error:'Video generation could not start.', detail:process.env.NODE_ENV === 'development' ? error.message : undefined }); }
}
