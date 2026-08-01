import { extractProduct } from './skills/product-extract.js';
import { buildPersonaAndInsight } from './skills/persona-insight.js';
import { writeScript } from './skills/script.js';

export async function runScriptAgent({ message, projectContext, researchContext }) {
  const product = await extractProduct(message, projectContext);
  const insight = await buildPersonaAndInsight(product, researchContext);
  const script = await writeScript(product, insight);
  return { agent: 'script', projectId: projectContext?.id, product, insight, script, createdAt: new Date().toISOString() };
}
