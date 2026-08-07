import { downloadGeneratedVideo } from '../src/services/gemini-video.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error:'Method not allowed.' });
  try {
    const upstream = await downloadGeneratedVideo(String(request.query?.uri || ''));
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'video/mp4');
    response.setHeader('Content-Disposition', 'inline; filename="tegy-generated-video.mp4"');
    const bytes = Buffer.from(await upstream.arrayBuffer());
    return response.status(200).send(bytes);
  } catch (error) { console.error('Video download failed:', error); return response.status(502).json({ error:'Generated video is unavailable.' }); }
}
