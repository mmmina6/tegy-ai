import { extractProduct } from './skills/product-extract.js';
import { buildPersonaAndInsight } from './skills/persona-insight.js';
import { writeScript } from './skills/script.js';

export async function runScriptAgent({ message, project }) {
  const product = await extractProduct(message, project);
  const insight = await buildPersonaAndInsight(product);
  const script = await writeScript(product, insight);
  return { agent: 'script', product, insight, script, createdAt: new Date().toISOString() };
}
