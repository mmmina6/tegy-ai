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

export function buildPersonaAndInsight(product) {
  return generateStructured({
    schema,
    prompt: `You are TEGY's Persona & Insight Skill for performance and organic social advertising.
Create exactly two distinct, realistic customer personas from the product brief. Go beyond demographics: identify daily pain, hidden emotional insight, motivation, purchase objections, triggers, and social-media behavior.
Select the persona most suitable for this specific ad and explain why. Do not present stereotypes as facts. Match the product brief's language.

Product brief: ${JSON.stringify(product)}`
  });
}
