import { generateStructured } from '../../../services/gemini.js';

const schema = {
  type:'OBJECT', properties:{
    title:{ type:'STRING' }, logline:{ type:'STRING' }, targetDurationSeconds:{ type:'INTEGER' }, aspectRatio:{ type:'STRING' },
    tone:{ type:'STRING' }, visualApproach:{ type:'STRING' }, fullScript:{ type:'STRING' },
    characters:{ type:'ARRAY', items:{ type:'OBJECT', properties:{ name:{type:'STRING'}, role:{type:'STRING'}, description:{type:'STRING'}, continuityRules:{type:'ARRAY',items:{type:'STRING'}} }, required:['name','role','description','continuityRules'] } },
    productionRules:{ type:'ARRAY', items:{type:'STRING'} }
  }, required:['title','logline','targetDurationSeconds','aspectRatio','tone','visualApproach','fullScript','characters','productionRules']
};

export function buildAnimeTreatment({ projectContext, researchContext, campaignScript, animeBrief }) {
  return generateStructured({ schema, prompt:`You are TEGY's Anime Script Director. Create a production-ready animation treatment, not a market analysis.
Use shared Project facts and an approved Campaign Script when supplied. In manual mode, preserve the operator's source script and improve only clarity, timing, and visual direction. Do not invent product claims. Write primarily in Japanese and retain standard production terms in English.

Project context: ${JSON.stringify(projectContext || {})}
Research context: ${JSON.stringify(researchContext || {})}
Campaign Script: ${JSON.stringify(campaignScript || {})}
Anime brief: ${JSON.stringify(animeBrief || {})}` });
}
