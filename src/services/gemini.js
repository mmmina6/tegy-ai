const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function generateStructured({ prompt, schema }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Gemini request failed (${response.status}).`);
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
  if (!text) throw new Error('Gemini returned an empty response.');

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Gemini returned invalid JSON.');
  }
}

export async function searchGroundedEvidence({ prompt }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_SEARCH_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  const response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.2 }
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `Gemini search failed (${response.status}).`);
  const candidate = payload?.candidates?.[0] || {};
  const text = candidate.content?.parts?.map(part => part.text || '').join('') || '';
  const sources = (candidate.groundingMetadata?.groundingChunks || [])
    .map((chunk, index) => ({ id: index + 1, title: chunk.web?.title || '', url: chunk.web?.uri || '' }))
    .filter(source => source.url);
  return { summary: text, sources, searchQueries: candidate.groundingMetadata?.webSearchQueries || [] };
}
