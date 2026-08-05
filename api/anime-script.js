import { runAnimeScriptAgent } from '../src/agents/anime/index.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  const { projectContext, researchContext, campaignScript, animeBrief } = request.body || {};
  if (!projectContext || typeof projectContext !== 'object') return response.status(400).json({ error: 'Project context is required.' });
  if (!animeBrief || typeof animeBrief !== 'object') return response.status(400).json({ error: 'Anime brief is required.' });
  if (JSON.stringify(request.body).length > 120000) return response.status(413).json({ error: 'Anime script input is too large.' });

  try {
    return response.status(200).json(await runAnimeScriptAgent({ projectContext, researchContext, campaignScript, animeBrief }));
  } catch (error) {
    console.error('Anime Script Agent failed:', error);
    const configurationError = error.message.includes('GEMINI_API_KEY');
    return response.status(configurationError ? 503 : 502).json({
      error: configurationError ? 'Gemini is not configured yet.' : 'Anime script generation failed. Please try again.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
