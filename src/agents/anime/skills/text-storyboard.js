import { generateStructured } from '../../../services/gemini.js';

const schema = {
  type:'OBJECT', properties:{
    totalSeconds:{type:'INTEGER'},
    scenes:{type:'ARRAY',items:{type:'OBJECT',properties:{
      sceneNumber:{type:'INTEGER'},title:{type:'STRING'},location:{type:'STRING'},sceneSeconds:{type:'INTEGER'},
      shots:{type:'ARRAY',items:{type:'OBJECT',properties:{
        shotNumber:{type:'STRING'},seconds:{type:'INTEGER'},visual:{type:'STRING'},characterAction:{type:'STRING'},camera:{type:'STRING'},dialogueNarration:{type:'STRING'},onScreenText:{type:'STRING'},audio:{type:'STRING'},transition:{type:'STRING'},imagePrompt:{type:'STRING'},productionNote:{type:'STRING'}
      },required:['shotNumber','seconds','visual','characterAction','camera','dialogueNarration','onScreenText','audio','transition','imagePrompt','productionNote']}}
    },required:['sceneNumber','title','location','sceneSeconds','shots']}},
    timingNotes:{type:'ARRAY',items:{type:'STRING'}}
  },required:['totalSeconds','scenes','timingNotes']
};

export function buildTextStoryboard({ projectContext, animeBrief, treatment }) {
  return generateStructured({ schema, prompt:`You are TEGY's Storyboard / 字コンテ Skill. Convert the approved animation treatment into a practical Scene and Shot table.
The sum of shot seconds should closely match the requested duration. Each shot must be independently producible as a storyboard image and later as Image-to-Video. Keep character, product, wardrobe, location, and art direction consistent. imagePrompt is an internal production prompt, not marketing copy. Write primarily in Japanese and retain standard production terms in English.

Project context: ${JSON.stringify(projectContext || {})}
Anime brief: ${JSON.stringify(animeBrief || {})}
Approved treatment: ${JSON.stringify(treatment || {})}` });
}
