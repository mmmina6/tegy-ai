import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCoworkerIntent, workNameForIntent } from '../src/coworker/intent-router.js';

test('AI Coworker routes natural language to the appropriate Work', () => {
  assert.equal(detectCoworkerIntent('縦型、日本線画漫画の30秒の小猫anime'), 'animation');
  assert.equal(detectCoworkerIntent('このYouTubeチャンネルのSEOとシャドウバンを診断して'), 'shadow');
  assert.equal(detectCoworkerIntent('競合と市場調査をして'), 'research');
  assert.equal(detectCoworkerIntent('来月の投稿予定を作って'), 'operations');
  assert.equal(detectCoworkerIntent('30秒広告の台本を作って'), 'script');
  assert.equal(detectCoworkerIntent('このProjectで次に進める仕事を一緒に整理して'), 'manager');
  assert.equal(workNameForIntent('animation'), 'AI Anime Agent');
});
