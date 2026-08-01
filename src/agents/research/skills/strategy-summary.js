import { generateStructured } from '../../../services/gemini.js';

const schema = {
  type: 'OBJECT',
  properties: {
    executiveSummary: { type: 'STRING' },
    strategicDirections: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      priority: { type: 'INTEGER' }, direction: { type: 'STRING' }, rationale: { type: 'STRING' },
      evidence: { type: 'ARRAY', items: { type: 'STRING' } }, recommendedWork: { type: 'STRING' }
    }, required: ['priority', 'direction', 'rationale', 'evidence', 'recommendedWork'] } },
    clientQuestions: { type: 'ARRAY', items: { type: 'STRING' } },
    nextResearchTasks: { type: 'ARRAY', items: { type: 'STRING' } },
    recommendedWorkSequence: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['executiveSummary', 'strategicDirections', 'clientQuestions', 'nextResearchTasks', 'recommendedWorkSequence']
};

export function buildStrategySummary({ projectContext, landscape, marketInsight }) {
  return generateStructured({
    schema,
    prompt: `You are TEGY's Research Strategy Summary Skill. Turn the validated research foundation and Project-level Market Insight into a concise client-meeting summary and a recommended sequence of Work.
Do not introduce facts or claims that are absent from the inputs. Make verification gaps and client questions explicit. Match the input language.

Project context: ${JSON.stringify(projectContext || {})}
Market landscape: ${JSON.stringify(landscape)}
Market Persona and Insight: ${JSON.stringify(marketInsight)}`
  });
}
