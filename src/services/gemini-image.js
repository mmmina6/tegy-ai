const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function generateStoryboardImage({ prompt, aspectRatio = '16:9' }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');

  const response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio } }
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `Image generation failed (${response.status}).`);
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  const image = parts.find(part => part.inlineData?.data || part.inline_data?.data);
  const inline = image?.inlineData || image?.inline_data;
  if (!inline?.data) throw new Error('Image model returned no image.');
  return { dataUrl: `data:${inline.mimeType || inline.mime_type || 'image/png'};base64,${inline.data}`, model, usage:payload.usageMetadata || null };
}
