import { generateHuggingFaceAnimeImage } from '../src/services/huggingface-anime-image.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error:'Method not allowed.' });
  const { scene, projectContext, animeContext, aspectRatio } = request.body || {};
  if (!scene?.visual) return response.status(400).json({ error:'Scene visual is required.' });
  if (JSON.stringify(request.body).length > 120000) return response.status(413).json({ error:'Anime image request is too large.' });
  const prompt = `Project: ${JSON.stringify(projectContext || {})}\nAnime: ${JSON.stringify(animeContext || {})}\nScene: ${JSON.stringify(scene)}`;
  try {
    return response.status(200).json(await generateHuggingFaceAnimeImage({ prompt, aspectRatio:aspectRatio || '9:16' }));
  } catch (error) {
    console.error('Hugging Face Anime image failed:', error);
    const configurationError = error.message.includes('HF_TOKEN');
    const safeDetail = String(error.message || 'Unknown provider error').replace(/hf_[A-Za-z0-9]+/g, '[REDACTED]').slice(0, 300);
    return response.status(configurationError ? 503 : 502).json({ error:configurationError ? 'Hugging Face trial is not configured.' : 'Anime image generation failed.', providerDetail:safeDetail });
  }
}
