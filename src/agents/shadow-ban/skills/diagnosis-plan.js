import { generateStructured } from '../../../services/gemini.js';

const schema = {
  type: 'OBJECT',
  properties: {
    healthScore: { type: 'INTEGER' }, riskLevel: { type: 'STRING' }, confidence: { type: 'STRING' },
    diagnosis: { type: 'STRING' }, confirmedRestriction: { type: 'BOOLEAN' },
    likelyCauses: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      cause: { type: 'STRING' }, evidence: { type: 'STRING' }, likelihood: { type: 'STRING' }, alternativeExplanation: { type: 'STRING' }
    }, required: ['cause', 'evidence', 'likelihood', 'alternativeExplanation'] } },
    actions: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      priority: { type: 'STRING' }, action: { type: 'STRING' }, reason: { type: 'STRING' }, owner: { type: 'STRING' }, successMetric: { type: 'STRING' }
    }, required: ['priority', 'action', 'reason', 'owner', 'successMetric'] } },
    verificationSteps: { type: 'ARRAY', items: { type: 'STRING' } },
    monitoringMetrics: { type: 'ARRAY', items: { type: 'STRING' } },
    recoveryPlan: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      phase: { type: 'STRING' }, period: { type: 'STRING' }, objective: { type: 'STRING' }, tasks: { type: 'ARRAY', items: { type: 'STRING' } }, exitCriteria: { type: 'ARRAY', items: { type: 'STRING' } }
    }, required: ['phase', 'period', 'objective', 'tasks', 'exitCriteria'] } },
    disclaimer: { type: 'STRING' }
  },
  required: ['healthScore', 'riskLevel', 'confidence', 'diagnosis', 'confirmedRestriction', 'likelyCauses', 'actions', 'verificationSteps', 'monitoringMetrics', 'recoveryPlan', 'disclaimer']
};

export function buildDiagnosisPlan({ projectContext, snapshot, signalAnalysis, contentAudit }) {
  return generateStructured({
    schema,
    prompt: `You are TEGY's Channel Health Diagnosis Skill. Produce a cautious, evidence-based diagnosis and recovery/SEO action plan.
"Shadow ban" is not a directly observable diagnosis from performance metrics alone. Set confirmedRestriction to true only if the supplied input includes an explicit platform notice or verified restriction. Otherwise explain the uncertainty, compare alternative causes such as content demand, topic fit, seasonality, creative quality, audience mismatch, metadata, or posting consistency. Health score must be 0–100 and consistent with the deterministic anomaly score. Always write the operational report primarily in Japanese, keeping established industry terms in English.
Build a practical 90-day plan in three phases when evidence supports it: Day 1–30 diagnose and stop harmful patterns; Day 31–60 rebuild quality and originality; Day 61–90 optimize and monitor. Never promise recovery or claim 90 days is a platform guarantee. Include before/after success criteria. Prefer making problematic videos private over deletion only when appropriate, and never advise ban evasion, device fingerprint manipulation, or creating replacement accounts.

Project context: ${JSON.stringify(projectContext || {})}
Channel snapshot: ${JSON.stringify(snapshot || {})}
Signal analysis: ${JSON.stringify(signalAnalysis)}
Content audit: ${JSON.stringify(contentAudit)}`
  });
}
