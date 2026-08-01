import { runResearchAgent } from '../src/agents/research/index.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  const { projectContext, researchBook } = request.body || {};
  if (!projectContext || typeof projectContext !== 'object') return response.status(400).json({ error: 'Project context is required.' });
  if (!Array.isArray(researchBook)) return response.status(400).json({ error: 'Research Book is required.' });
  if (JSON.stringify({ projectContext, researchBook }).length > 120000) return response.status(413).json({ error: 'Research input is too large.' });

  try {
    return response.status(200).json(await runResearchAgent({ projectContext, researchBook }));
  } catch (error) {
    console.error('Research Agent failed:', error);
    const configurationError = error.message.includes('GEMINI_API_KEY');
    return response.status(configurationError ? 503 : 502).json({
      error: configurationError ? 'Gemini is not configured yet.' : 'Research generation failed. Please try again.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
