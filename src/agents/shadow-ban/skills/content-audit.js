import { generateStructured } from '../../../services/gemini.js';

const schema = {
  type: 'OBJECT',
  properties: {
    metadataFindings: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      area: { type: 'STRING' }, finding: { type: 'STRING' }, severity: { type: 'STRING' }, evidence: { type: 'STRING' }, needsVerification: { type: 'BOOLEAN' }
    }, required: ['area', 'finding', 'severity', 'evidence', 'needsVerification'] } },
    contentPatternFindings: { type: 'ARRAY', items: { type: 'STRING' } },
    possiblePolicyRisks: { type: 'ARRAY', items: { type: 'STRING' } },
    seoGaps: { type: 'ARRAY', items: { type: 'STRING' } },
    technicalRisks: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      area: { type: 'STRING' }, status: { type: 'STRING' }, evidence: { type: 'STRING' }, recommendation: { type: 'STRING' }
    }, required: ['area', 'status', 'evidence', 'recommendation'] } },
    operationalRisks: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      area: { type: 'STRING' }, status: { type: 'STRING' }, evidence: { type: 'STRING' }, recommendation: { type: 'STRING' }
    }, required: ['area', 'status', 'evidence', 'recommendation'] } },
    missingEvidence: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['metadataFindings', 'contentPatternFindings', 'possiblePolicyRisks', 'seoGaps', 'technicalRisks', 'operationalRisks', 'missingEvidence']
};

export function auditChannelContent({ projectContext, snapshot, signalAnalysis, operationalAudit, seoOperations }) {
  return generateStructured({
    schema,
    prompt: `You are TEGY's Channel Content & SEO Audit Skill. Audit only the supplied channel snapshot, recent-content notes, and computed signals.
Do not claim a shadow ban, policy violation, ranking penalty, or platform action without direct evidence. Do not invent platform policy clauses, analytics, video titles, or causes. Separate observed evidence from hypotheses, mark missing evidence, and match the input language.
Cover the TEGY audit framework: review the latest 50 videos when supplied; thumbnail repetition, repeated stock footage/BGM, script similarity and video/script relevance, default AI voice, metadata/hashtag spam, upload density, device/account history, channel verification, borderline or reused content, misleading thumbnails, bulk deletion, abrupt topic/metadata changes, copyright/Content ID, suspicious managers, negative feedback, incomplete profile, inactivity, and possible technical errors. Treat any numeric thresholds as TEGY internal review triggers—not proven YouTube penalty thresholds.
For SEO, examine title/query intent alignment, descriptions, keywords, hashtags, topic consistency, search traffic, and missing evidence. Do not recommend keyword stuffing.

Project context: ${JSON.stringify(projectContext || {})}
Channel snapshot: ${JSON.stringify(snapshot || {})}
Computed signals: ${JSON.stringify(signalAnalysis)}
Computed operational audit: ${JSON.stringify(operationalAudit)}
SEO operations checklist: ${JSON.stringify(seoOperations)}`
  });
}
