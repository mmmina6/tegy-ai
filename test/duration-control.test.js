import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeDuration} from '../src/duration-control.js';
test('duration clamps per-shot Video to 10 and overall Anime target to 90 seconds',()=>{
  assert.equal(normalizeDuration('100秒',1,10),10);assert.equal(normalizeDuration(0,1,10),1);
  assert.equal(normalizeDuration('120',1,90),90);assert.equal(normalizeDuration('48',1,90),48);
  assert.equal(normalizeDuration('invalid',1,10,5),5);
});
