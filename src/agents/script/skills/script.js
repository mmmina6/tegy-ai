import { generateStructured } from '../../../services/gemini.js';

const schema = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' }, hook: { type: 'STRING' }, concept: { type: 'STRING' },
    fullScript: { type: 'STRING' }, cta: { type: 'STRING' },
    scenes: {
      type: 'ARRAY', items: { type: 'OBJECT', properties: {
        number: { type: 'INTEGER' }, seconds: { type: 'STRING' }, visual: { type: 'STRING' },
        narration: { type: 'STRING' }, onScreenText: { type: 'STRING' }
      }, required: ['number', 'seconds', 'visual', 'narration', 'onScreenText'] }
    },
    productionNotes: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['title', 'hook', 'concept', 'fullScript', 'cta', 'scenes', 'productionNotes']
};

export function writeScript(product, insight) {
  return generateStructured({
    schema,
    prompt: `You are TEGY's Script Skill, an expert social-video advertising writer.
Write a production-ready script for the requested platform and duration, using the selected persona and consumer insight. The hook must work in the first 2–3 seconds. Keep narration speakable within the requested duration. Never add unsupported medical, financial, comparative, certification, pricing, or performance claims. Match the input language.

Product brief: ${JSON.stringify(product)}
Persona and insight: ${JSON.stringify(insight)}`
  });
}
