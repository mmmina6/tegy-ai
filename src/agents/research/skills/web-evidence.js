import { searchGroundedEvidence } from '../../../services/gemini.js';

export function gatherWebEvidence({ projectContext, researchBook }) {
  return searchGroundedEvidence({
    prompt: `You are TEGY's web evidence collector for advertising research. Search the public web for current, verifiable evidence relevant to the supplied project.
Prioritize official company/product pages, platform policy documentation, official ad libraries, government or industry primary sources, and directly observable competitor accounts. Separate verified facts from hypotheses. Do not invent performance results or inaccessible data. Reply in the primary language of the project and include concise claims tied to the sources returned by Google Search grounding.

Project context: ${JSON.stringify(projectContext || {})}
Research Book: ${JSON.stringify(researchBook || [])}`
  });
}
