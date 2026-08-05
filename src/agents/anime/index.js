import { buildAnimeTreatment } from './skills/anime-treatment.js';
import { buildTextStoryboard } from './skills/text-storyboard.js';

export async function runAnimeScriptAgent({ projectContext, researchContext, campaignScript, animeBrief }) {
  const treatment = await buildAnimeTreatment({ projectContext, researchContext, campaignScript, animeBrief });
  const textStoryboard = await buildTextStoryboard({ projectContext, animeBrief, treatment });
  return { agent:'anime-script', projectId:projectContext?.id, animeBrief, treatment, textStoryboard, createdAt:new Date().toISOString() };
}
