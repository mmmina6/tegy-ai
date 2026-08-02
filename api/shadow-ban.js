import { runShadowBanAgent } from '../src/agents/shadow-ban/index.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  const { projectContext, channelSnapshot } = request.body || {};
  if (!projectContext || typeof projectContext !== 'object') return response.status(400).json({ error: 'Project context is required.' });
  if (!channelSnapshot || typeof channelSnapshot !== 'object') return response.status(400).json({ error: 'Channel snapshot is required.' });
  if (JSON.stringify({ projectContext, channelSnapshot }).length > 120000) return response.status(413).json({ error: 'Channel audit input is too large.' });
  try {
    return response.status(200).json(await runShadowBanAgent({ projectContext, channelSnapshot }));
  } catch (error) {
    console.error('Shadow Ban Agent failed:', error);
    const configurationError = error.message.includes('GEMINI_API_KEY');
    return response.status(configurationError ? 503 : 502).json({
      error: configurationError ? 'Gemini is not configured yet.' : 'Channel audit failed. Please try again.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
