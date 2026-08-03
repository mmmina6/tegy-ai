import { generateStructured } from '../../../services/gemini.js';

const schema = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' }, hook: { type: 'STRING' }, concept: { type: 'STRING' },
    fullScript: { type: 'STRING' }, cta: { type: 'STRING' },
    scenes: {
      type: 'ARRAY', items: { type: 'OBJECT', properties: {
        number: { type: 'INTEGER' }, seconds: { type: 'STRING' }, visual: { type: 'STRING' },
        narration: { type: 'STRING' }, onScreenText: { type: 'STRING' },
        shotType: { type: 'STRING' }, location: { type: 'STRING' }, cast: { type: 'STRING' },
        camera: { type: 'STRING' }, audio: { type: 'STRING' }, props: { type: 'STRING' }
      }, required: ['number', 'seconds', 'visual', 'narration', 'onScreenText', 'shotType', 'location', 'cast', 'camera', 'audio', 'props'] }
    },
    structure: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      section: { type: 'STRING' }, purpose: { type: 'STRING' }, estimatedSeconds: { type: 'INTEGER' }
    }, required: ['section', 'purpose', 'estimatedSeconds'] } },
    productionNotes: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['title', 'hook', 'concept', 'fullScript', 'cta', 'scenes', 'structure', 'productionNotes']
};

export function writeScript(product, insight, scriptType, { creationMode, manualDraft }) {
  return generateStructured({
    schema,
    prompt: `You are TEGY's ${scriptType.label} Skill.
Create a production-ready script using this required structure: ${scriptType.requiredStructure.join(' → ')}.
${scriptType.id === 'advertisement' ? 'The Hook must work in the first 2–3 seconds. Build a clear benefit, reason to believe and CTA.' : 'Write a shootable YouTube script with a strong Cold Open, chapter progression, host A-roll, planned B-roll, Camera, Audio, Location, Cast and Props. Optimize pacing and retention without using clickbait.'}
Keep all spoken text natural and feasible within the requested duration. Each scene must be usable by a producer on set, not just a creative summary.
Creation mode: ${creationMode}. ${creationMode === 'manual' ? 'Preserve the operator draft as the source of truth. Improve structure, timing and production direction without replacing its meaning.' : 'Generate the script from the approved brief and shared insight.'}
Operator draft: ${manualDraft || '(none)'}
Never add unsupported medical, financial, comparative, certification, pricing, or performance claims. Write primarily in Japanese while retaining standard production terms in English.

Product brief: ${JSON.stringify(product)}
Persona and insight: ${JSON.stringify(insight)}`
  });
}
