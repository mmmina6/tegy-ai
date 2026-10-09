const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function requestGemini(model, body, timeoutMs) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('GEMINI_API_KEY is not configured.'), { code:'MODEL_NOT_CONFIGURED' });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method:'POST', signal:controller.signal,
      headers:{ 'Content-Type':'application/json', 'x-goog-api-key':apiKey },
      body:JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) throw Object.assign(new Error(payload?.error?.message || `Gemini request failed (${response.status}).`), { status:response.status });
    return payload;
  } catch (error) {
    if (controller.signal.aborted) throw Object.assign(new Error('Gemini request timed out.'), { code:'MODEL_TIMEOUT' });
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateStructured({ prompt, schema, timeoutMs = 110000 }) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const payload = await requestGemini(model, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: schema
      }
  }, timeoutMs);

  const text = payload?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
  if (!text) throw new Error('Gemini returned an empty response.');

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Gemini returned invalid JSON.');
  }
}

export async function searchGroundedEvidence({ prompt, timeoutMs = 110000 }) {
  const model = process.env.GEMINI_SEARCH_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const payload = await requestGemini(model, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.2 }
  }, timeoutMs);
  const candidate = payload?.candidates?.[0] || {};
  const text = candidate.content?.parts?.map(part => part.text || '').join('') || '';
  const sources = (candidate.groundingMetadata?.groundingChunks || [])
    .map((chunk, index) => ({ id: index + 1, title: chunk.web?.title || '', url: chunk.web?.uri || '' }))
    .filter(source => source.url);
  return { summary: text, sources, searchQueries: candidate.groundingMetadata?.webSearchQueries || [] };
}
