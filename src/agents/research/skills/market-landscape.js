import { generateStructured } from '../../../services/gemini.js';

const finding = {
  type: 'OBJECT',
  properties: {
    topic: { type: 'STRING' },
    finding: { type: 'STRING' },
    evidence: { type: 'STRING' },
    confidence: { type: 'STRING' },
    sourceUrl: { type: 'STRING' },
    needsVerification: { type: 'BOOLEAN' }
  },
  required: ['topic', 'finding', 'evidence', 'confidence', 'sourceUrl', 'needsVerification']
};

const schema = {
  type: 'OBJECT',
  properties: {
    companyAndProduct: { type: 'ARRAY', items: finding },
    marketAndTrends: { type: 'ARRAY', items: finding },
    competitorAccounts: { type: 'ARRAY', items: finding },
    paidAdvertising: { type: 'ARRAY', items: finding },
    organicAndVideo: { type: 'ARRAY', items: finding },
    platformAndPolicy: { type: 'ARRAY', items: finding },
    evidenceGaps: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['companyAndProduct', 'marketAndTrends', 'competitorAccounts', 'paidAdvertising', 'organicAndVideo', 'platformAndPolicy', 'evidenceGaps']
};

export function analyzeMarketLandscape({ projectContext, researchBook }) {
  return generateStructured({
    schema,
    prompt: `You are TEGY's Market Landscape Research Skill. Organize the supplied Project context and Research Book into an evidence-aware advertising research foundation.
Never invent sources, URLs, company facts, campaign results, market sizes, policy clauses, or product claims. If evidence is missing, leave sourceUrl empty, set needsVerification to true, and add the gap to evidenceGaps. Distinguish user-provided evidence from an analytical hypothesis. Match the primary language of the input.

Project context: ${JSON.stringify(projectContext || {})}
Research Book: ${JSON.stringify(researchBook || [])}`
  });
}
