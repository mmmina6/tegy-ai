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

export function buildPersonaAndInsight(product, researchContext, scriptType) {
  return generateStructured({
    schema,
    prompt: `You are TEGY's Audience & Insight Skill for ${scriptType.label}.
Create exactly two distinct audience profiles. For Advertisement Script, treat them as Campaign Personas. For YouTube Shooting Script, treat them as Viewer Profiles defined by viewing intent, knowledge level, retention risk and desired takeaway. Research already owns the Project-level Market Personas and Market Insight. Use that shared research as the evidence foundation, then narrow it for this production.
Go beyond demographics: identify daily pain, hidden emotional insight, motivation, purchase objections, triggers, and social-media behavior. Select the persona most suitable for this ad and explain why. Do not present stereotypes as facts. Match the product brief's language.

Shared Research context: ${JSON.stringify(researchContext || {})}
Product brief: ${JSON.stringify(product)}`
  });
}
