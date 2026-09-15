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

const competitorCompany = {
  type: 'OBJECT',
  properties: {
    companyName: { type:'STRING' }, group: { type:'STRING' }, category: { type:'STRING' }, position: { type:'STRING' },
    overview: { type:'STRING' }, background: { type:'STRING' }, culture: { type:'STRING' },
    businesses: { type:'ARRAY', items:{ type:'STRING' } }, sourceUrl: { type:'STRING' },
    products: { type:'ARRAY', items:{ type:'OBJECT', properties:{
      name:{ type:'STRING' }, type:{ type:'STRING' }, summary:{ type:'STRING' }, offer:{ type:'STRING' },
      target:{ type:'STRING' }, strengths:{ type:'STRING' }, evidence:{ type:'STRING' }, channels:{ type:'STRING' }
    }, required:['name','type','summary','offer','target','strengths','evidence','channels'] } }
  },
  required: ['companyName','group','category','position','overview','background','culture','businesses','sourceUrl','products']
};

const schema = {
  type: 'OBJECT',
  properties: {
    companyProfile: { type: 'ARRAY', items: finding },
    productPortfolio: { type: 'ARRAY', items: finding },
    companyAndProduct: { type: 'ARRAY', items: finding },
    marketAndTrends: { type: 'ARRAY', items: finding },
    competitorAccounts: { type: 'ARRAY', items: finding },
    competitorCompanies: { type: 'ARRAY', items: competitorCompany },
    paidAdvertising: { type: 'ARRAY', items: finding },
    organicAndVideo: { type: 'ARRAY', items: finding },
    platformAndPolicy: { type: 'ARRAY', items: finding },
    evidenceGaps: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['companyProfile', 'productPortfolio', 'companyAndProduct', 'marketAndTrends', 'competitorAccounts', 'paidAdvertising', 'organicAndVideo', 'platformAndPolicy', 'evidenceGaps']
};

export function analyzeMarketLandscape({ projectContext, researchBook, webEvidence }) {
  return generateStructured({
    schema,
    prompt: `You are TEGY's Market Landscape Research Skill. Organize the supplied Project context and Research Book into an evidence-aware advertising research foundation. Write mainly in Japanese; keep established English platform and marketing terms where clearer.
companyProfile must cover the legal/company overview, history, culture/philosophy, business areas, brands, reputation or public trust signals. productPortfolio must separately cover each relevant product/service, its relationship to the company, features, price/offer, conditions, proof, target and channels. companyAndProduct is a concise shared summary, not a duplicate dump. competitorCompanies must list real named competitors discovered in the supplied grounded web evidence, with a source URL for each company. Classify them into comparison groups A, B, or C and include 2–3 relevant products/services per company when evidence exists. Do not return placeholders such as "競合会社 A". competitorAccounts may separately contain specific social or video accounts.
Never invent sources, URLs, company facts, campaign results, market sizes, policy clauses, or product claims. If evidence is missing, leave sourceUrl empty, set needsVerification to true, and add the gap to evidenceGaps. Distinguish user-provided evidence from an analytical hypothesis. Match the primary language of the input.

Project context: ${JSON.stringify(projectContext || {})}
Research Book: ${JSON.stringify(researchBook || [])}`
    + `\nGrounded web evidence: ${JSON.stringify(webEvidence || {})}`
  });
}
