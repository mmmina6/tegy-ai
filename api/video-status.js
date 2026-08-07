import { getVideoOperation } from '../src/services/gemini-video.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error:'Method not allowed.' });
  try { return response.status(200).json(await getVideoOperation(String(request.query?.operation || ''))); }
  catch (error) { console.error('Video status failed:', error); return response.status(502).json({ error:'Video status is unavailable.', detail:process.env.NODE_ENV === 'development' ? error.message : undefined }); }
}
