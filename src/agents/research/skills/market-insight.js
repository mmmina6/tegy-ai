import { generateStructured } from '../../../services/gemini.js';

const persona = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' }, audience: { type: 'STRING' }, context: { type: 'STRING' },
    needs: { type: 'ARRAY', items: { type: 'STRING' } }, pains: { type: 'ARRAY', items: { type: 'STRING' } },
    motivations: { type: 'ARRAY', items: { type: 'STRING' } }, barriers: { type: 'ARRAY', items: { type: 'STRING' } },
    mediaBehavior: { type: 'STRING' }, evidenceBasis: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['name', 'audience', 'context', 'needs', 'pains', 'motivations', 'barriers', 'mediaBehavior', 'evidenceBasis']
};

const schema = {
  type: 'OBJECT',
  properties: {
    marketPersonas: { type: 'ARRAY', items: persona },
    primaryMarketInsight: { type: 'STRING' },
    supportingInsights: { type: 'ARRAY', items: { type: 'STRING' } },
    demandSignals: { type: 'ARRAY', items: { type: 'STRING' } },
    communicationOpportunities: { type: 'ARRAY', items: { type: 'STRING' } },
    risksAndUnknowns: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['marketPersonas', 'primaryMarketInsight', 'supportingInsights', 'demandSignals', 'communicationOpportunities', 'risksAndUnknowns']
};

export function buildMarketInsight({ projectContext, landscape }) {
  return generateStructured({
    schema,
    prompt: `You are TEGY's Market Persona & Insight Research Skill. Create Project-level Market Personas and durable market insights from the evidence-aware landscape.
These are not Campaign Personas. Do not narrow to one advertisement, invent demographics, or turn hypotheses into facts. Each persona and insight must be traceable to supplied findings; put uncertainties in risksAndUnknowns. Match the input language.

Project context: ${JSON.stringify(projectContext || {})}
Market landscape: ${JSON.stringify(landscape)}`
  });
}
