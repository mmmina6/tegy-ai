import { runScriptAgent } from '../src/agents/script/index.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });

  const { message, projectContext, researchContext } = request.body || {};
  if (typeof message !== 'string' || !message.trim()) {
    return response.status(400).json({ error: 'Please enter a product and advertising request.' });
  }
  if (message.length > 8000) return response.status(413).json({ error: 'The request is too long.' });
  if (JSON.stringify({ projectContext, researchContext }).length > 120000) return response.status(413).json({ error: 'Project context is too large.' });

  try {
    const result = await runScriptAgent({ message: message.trim(), projectContext, researchContext });
    return response.status(200).json(result);
  } catch (error) {
    console.error('Script Agent failed:', error);
    const configurationError = error.message.includes('GEMINI_API_KEY');
    return response.status(configurationError ? 503 : 502).json({
      error: configurationError ? 'Gemini is not configured yet.' : 'Script generation failed. Please try again.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
