import { generateStructured } from '../../../services/gemini.js';

const personaItem = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' }, age: { type: 'STRING' }, profile: { type: 'STRING' },
    lifestyle: { type: 'STRING' }, socialBehavior: { type: 'STRING' }, pain: { type: 'ARRAY', items: { type: 'STRING' } },
    insight: { type: 'STRING' }, motivation: { type: 'STRING' }, objections: { type: 'ARRAY', items: { type: 'STRING' } },
    triggers: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['name', 'age', 'profile', 'lifestyle', 'socialBehavior', 'pain', 'insight', 'motivation', 'objections', 'triggers']
};

const schema = {
  type: 'OBJECT',
  properties: {
    personas: { type: 'ARRAY', items: personaItem },
    selectedPersonaIndex: { type: 'INTEGER' },
    selectionReason: { type: 'STRING' },
    creativeDirection: { type: 'STRING' },
    recommendedHooks: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['personas', 'selectedPersonaIndex', 'selectionReason', 'creativeDirection', 'recommendedHooks']
};

export function buildPersonaAndInsight(product, researchContext) {
  return generateStructured({
    schema,
    prompt: `You are TEGY's Persona & Insight Skill for performance and organic social advertising.
Create exactly two distinct, realistic Campaign Personas for this specific advertisement. Research already owns the Project-level Market Personas and Market Insight. Use that shared research as the evidence foundation, then narrow it using this campaign's product, audience, objective and platform.
Go beyond demographics: identify daily pain, hidden emotional insight, motivation, purchase objections, triggers, and social-media behavior. Select the persona most suitable for this ad and explain why. Do not present stereotypes as facts. Match the product brief's language.

Shared Research context: ${JSON.stringify(researchContext || {})}
Product brief: ${JSON.stringify(product)}`
  });
}
