import { generateStoryboardImage } from '../src/services/gemini-image.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error:'Method not allowed.' });
  const { scene, projectContext, scriptContext, aspectRatio } = request.body || {};
  if (!scene?.visual) return response.status(400).json({ error:'Scene visual is required.' });
  if (JSON.stringify(request.body).length > 120000) return response.status(413).json({ error:'Storyboard request is too large.' });
  const prompt = `Create one clean professional storyboard frame for a commercial or YouTube production.
Use the supplied scene as the source of truth. Do not add unsupported product claims, logos, text, characters or props. Keep character, wardrobe, product and art direction consistent with the supplied context. No captions, UI, borders or shot numbers inside the image.
Project context: ${JSON.stringify(projectContext || {})}
Script context: ${JSON.stringify(scriptContext || {})}
Scene: ${JSON.stringify(scene)}`;
  try {
    return response.status(200).json(await generateStoryboardImage({ prompt, aspectRatio:aspectRatio || '16:9' }));
  } catch (error) {
    console.error('Storyboard image failed:', error);
    return response.status(error.message.includes('GEMINI_API_KEY') ? 503 : 502).json({ error:'Storyboard image generation failed.', detail:process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
}
