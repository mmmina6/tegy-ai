import { generateStructured } from '../../../services/gemini.js';

export const productSchema = {
  type: 'OBJECT',
  properties: {
    productName: { type: 'STRING' },
    description: { type: 'STRING' },
    benefits: { type: 'ARRAY', items: { type: 'STRING' } },
    audience: { type: 'STRING' },
    platform: { type: 'STRING' },
    durationSeconds: { type: 'INTEGER' },
    objective: { type: 'STRING' },
    tone: { type: 'STRING' },
    cta: { type: 'STRING' },
    assumptions: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['productName', 'description', 'benefits', 'audience', 'platform', 'durationSeconds', 'objective', 'tone', 'cta', 'assumptions']
};

export function extractProduct(message, projectContext) {
  return generateStructured({
    schema: productSchema,
    prompt: `You are TEGY's Product Extract Skill. Convert the user's natural-language advertising request into a precise production brief.
Do not invent factual product claims, prices, certifications, ingredients, or performance numbers. Put reasonable creative defaults in assumptions.
Write all values in the same primary language as the user's request.

Shared Project context: ${JSON.stringify(projectContext || {})}
Use known customer, product/service and final requirement as stable context. The user request is the campaign-specific brief. Never invent missing Project facts.
User request: ${message}`
  });
}
