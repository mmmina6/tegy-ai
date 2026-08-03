import { extractProduct } from './skills/product-extract.js';
import { buildPersonaAndInsight } from './skills/persona-insight.js';
import { writeScript } from './skills/script.js';
import { resolveScriptType } from './script-types.js';

export async function runScriptAgent({ message, projectContext, researchContext, scriptType, creationMode = 'auto', manualDraft = '' }) {
  const type = resolveScriptType(scriptType);
  const product = await extractProduct(message, projectContext, type);
  const insight = await buildPersonaAndInsight(product, researchContext, type);
  const script = await writeScript(product, insight, type, { creationMode, manualDraft });
  return { agent: 'script', projectId: projectContext?.id, scriptType: type.id, creationMode, product, insight, script, createdAt: new Date().toISOString() };
}
