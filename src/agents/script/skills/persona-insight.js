import { generateStructured } from '../../../services/gemini.js';

const personaItem = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' }, age: { type: 'STRING' }, profile: { type: 'STRING' },
    lifestyle: { type: 'STRING' }, socialBehavior: { type: 'STRING' }, pain: { type: 'ARRAY', items: { type: 'STRING' } },
    insight: { type: 'STRING' }, motivation: { type: 'STRING' }, objections: { type: 'ARRAY', items: { type: 'STRING' } },
    triggers: { type: 'ARRAY', items: { type: 'STRING' } },
    situation: { type: 'STRING' }, jobsToBeDone: { type: 'ARRAY', items: { type: 'STRING' } },
    problemCauses: { type: 'ARRAY', items: { type: 'STRING' } }, emotions: { type: 'ARRAY', items: { type: 'STRING' } },
    currentAlternatives: { type: 'ARRAY', items: { type: 'STRING' } }, decisionCriteria: { type: 'ARRAY', items: { type: 'STRING' } },
    informationNeeds: { type: 'ARRAY', items: { type: 'STRING' } }, interviewQuestions: { type: 'ARRAY', items: { type: 'STRING' } },
    messageAngle: { type: 'STRING' }
  },
  required: ['name', 'age', 'profile', 'lifestyle', 'socialBehavior', 'pain', 'insight', 'motivation', 'objections', 'triggers', 'situation', 'jobsToBeDone', 'problemCauses', 'emotions', 'currentAlternatives', 'decisionCriteria', 'informationNeeds', 'interviewQuestions', 'messageAngle']
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
Go far beyond demographics. Each persona must be a detailed research hypothesis, not a short marketing summary. Include the concrete situation in which the problem occurs; 3-5 pains; jobs-to-be-done; hypotheses for why the problem persists; emotions and internal conflicts; current workarounds; motivation; objections; decision criteria; information needs; social behavior; triggers; a message angle; and 6-8 open-ended interview questions that would validate or falsify the hypothesis. Make the two personas meaningfully different in situation, motivation and decision process. Select the persona most suitable for this production and explain why, but keep both available for a human to choose. Do not present stereotypes or hypotheses as verified facts. Match the product brief's language and write substantial, specific Japanese content.

Shared Research context: ${JSON.stringify(researchContext || {})}
Product brief: ${JSON.stringify(product)}`
  });
}
