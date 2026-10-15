import test from 'node:test';import assert from 'node:assert/strict';
import {scriptScenes} from '../src/anime-canvas.js';
test('Anime canvas copies script scenes without mutating the source',()=>{
  const input={script:{scenes:[{visual:'Product scene',narration:'Hello',seconds:5}]}};
  const result=scriptScenes(input);result[0].visual='edited';
  assert.equal(input.script.scenes[0].visual,'Product scene');assert.equal(result[0].seconds,'5');assert.equal(result[0].title,'Scene 1');
});
test('Anime canvas starts empty without a script; no short-film shortcut or auto generation',()=>{
  assert.deepEqual(scriptScenes(null),[]);assert.deepEqual(scriptScenes({}),[]);
});
