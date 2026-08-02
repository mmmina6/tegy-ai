import { analyzeDistributionSignals } from './skills/signal-analysis.js';
import { auditChannelContent } from './skills/content-audit.js';
import { buildDiagnosisPlan } from './skills/diagnosis-plan.js';
import { runOperationalAudit } from './skills/operational-audit.js';
import { buildSeoOperations } from './skills/seo-operations.js';
import { buildRecoveryWorkflow } from './skills/recovery-workflow.js';

export async function runShadowBanAgent({ projectContext, channelSnapshot }) {
  const signalAnalysis = analyzeDistributionSignals(channelSnapshot);
  const operationalAudit = runOperationalAudit(channelSnapshot);
  const seoOperations = buildSeoOperations(channelSnapshot);
  const contentAudit = await auditChannelContent({ projectContext, snapshot: channelSnapshot, signalAnalysis, operationalAudit, seoOperations });
  const diagnosis = await buildDiagnosisPlan({ projectContext, snapshot: channelSnapshot, signalAnalysis, contentAudit });
  const recoveryWorkflow = buildRecoveryWorkflow({ operationalAudit, signalAnalysis, snapshot: channelSnapshot });
  return { agent: 'shadow-ban', projectId: projectContext?.id, channelSnapshot, signalAnalysis, operationalAudit, seoOperations, contentAudit, diagnosis, recoveryWorkflow, createdAt: new Date().toISOString() };
}
