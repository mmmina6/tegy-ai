import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parakoProject, parakoProjectDetails, parakoWorks, parakoShadowResult } from '../src/fixtures/parako-shadow-test.js';

// Execute the actual app functions with a small DOM/storage adapter; omit browser startup.
function appHarness() {
  const elements = new Map();
  const storage = new Map();
  const element = key => {
    if (!elements.has(key)) {
      const classes = new Set();
      elements.set(key, {
        innerHTML:'', textContent:'', value:'', style:{}, dataset:{},
        classList:{ add:(...names) => names.forEach(name => classes.add(name)), remove:(...names) => names.forEach(name => classes.delete(name)), toggle:(name, state) => state ? classes.add(name) : classes.delete(name), contains:name => classes.has(name) },
        querySelector:selector => element(`${key}:${selector}`), querySelectorAll:() => [],
        setAttribute() {}, close() {}, focus() {}
      });
    }
    return elements.get(key);
  };
  const context = vm.createContext({
    console, structuredClone, URLSearchParams, Date, setTimeout, clearTimeout, setInterval, clearInterval,
    parakoProject, parakoProjectDetails, parakoWorks, parakoShadowResult,
    document:{ getElementById:element, querySelector:element, querySelectorAll:() => [], body:element('body') },
    window:{}, location:{ protocol:'https:' }, requestAnimationFrame:() => {}, alert:() => {},
    localStorage:{ getItem:key => storage.get(key) ?? null, setItem:(key,value) => storage.set(key,String(value)) }
  });
  const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const declarations = source.slice(0, source.indexOf("$('menuButton').onclick")).replace(/^import .*;\n/gm, '');
  vm.runInContext(declarations, context);
  vm.runInContext(`
    renderNodes = () => {}; renderHistory = () => {}; renderOutput = () => {};
    updateScriptNode = () => {}; closeTaskPreview = () => {};
    globalThis.inspectProject = () => ({ selectedProject, nodes, competitorCompanies, book:getActiveResearchItems(), activeResearchIndex });
  `, context);
  return { context, element, storage, run:code => vm.runInContext(code, context) };
}

test('Research switches Meiji → Implant → Meiji without inheriting competitors or recommendations', async () => {
  const app = appHarness();
  await app.run("openProject('imai')");
  app.run(`
    getActiveResearchItems()[0].rows = [['Meiji only','insurance','https://meiji.example','要確認']];
    saveResearchBook();
    hydrateCompetitorCompanies([{ companyName:'Insurance competitor', products:[] }]);
    researchOutputs.imai = [{ strategy:{ strategicDirections:[{ recommendedWork:'Meiji plan' }] } }];
    renderResearchRecommendations();
  `);
  assert.match(app.element('researchRecommendations').innerHTML, /Meiji plan/);
  await app.run("openProject('azabu')");
  app.run("openFullWorkspace('research'); activeResearchIndex = 2; renderResearchBook()");
  assert.equal(app.run('inspectProject().competitorCompanies.length'), 0);
  assert.doesNotMatch(app.run('JSON.stringify(inspectProject().book)'), /Meiji only|insurance/);
  assert.match(app.element('competitorExplorer').innerHTML, /まだありません/);
  assert.equal(app.element('researchRecommendations').innerHTML, '');
  assert.doesNotMatch(app.run('JSON.stringify(researchExportRows())'), /Insurance competitor|Meiji only/);
  await app.run("openProject('imai')");
  app.run("openFullWorkspace('research')");
  assert.equal(app.run('inspectProject().competitorCompanies[0].name'), 'Insurance competitor');
  assert.equal(app.run('inspectProject().book[0].rows[0][0]'), 'Meiji only');
  assert.match(app.element('researchRecommendations').innerHTML, /Meiji plan/);
});

test('An explicit empty competitor list does not restore old output or another Project', async () => {
  const app = appHarness();
  await app.run("openProject('imai')");
  app.run("hydrateCompetitorCompanies([{companyName:'Meiji competitor',products:[]}])");
  app.storage.set('tegy-competitors-azabu', '[]');
  await app.run("openProject('azabu')");
  assert.equal(app.run('inspectProject().competitorCompanies.length'), 0);
});

test('A slow older Project response cannot overwrite a more recently selected Project', async () => {
  const app = appHarness();
  const pending = new Map();
  app.context.requestProject = path => new Promise(resolve => pending.set(path, resolve));
  app.run(`
    projects.push({id:'remote-a',remote:true,name:'A'}, {id:'remote-b',remote:true,name:'B'});
    dataRequest = requestProject;
  `);
  const first = app.run("openProject('remote-a')");
  const second = app.run("openProject('remote-b')");
  pending.get('/v1/projects/remote-b')({ works:[{id:'b-work',title:'B Research',type:'research'}], records:[], tasks:[], assets:[] });
  await second;
  pending.get('/v1/projects/remote-a')({ works:[{id:'a-work',title:'A Research',type:'research'}], records:[], tasks:[], assets:[] });
  await first;
  assert.equal(app.run('inspectProject().selectedProject'), 'remote-b');
  assert.equal(app.run('inspectProject().nodes[1].id'), 'b-work');
  assert.match(app.element('breadcrumbs').innerHTML, />B</);
});

test('An in-flight Project response cannot reopen a Project after returning Home', async () => {
  const app = appHarness();
  let resolveRequest;
  app.context.requestProject = () => new Promise(resolve => { resolveRequest = resolve; });
  app.run("projects.push({id:'remote-a',remote:true,name:'A'}); dataRequest = requestProject;");
  const pending = app.run("openProject('remote-a')");
  app.run('showWelcome()');
  resolveRequest({ works:[], records:[], tasks:[], assets:[] });
  await pending;
  assert.equal(app.run('inspectProject().selectedProject'), null);
  assert.equal(app.element('breadcrumbs').innerHTML, '');
});

test('Research finishing after a switch saves only to its original Project', async () => {
  const app = appHarness();
  let resolveResearch;
  app.context.runResearchSteps = () => new Promise(resolve => { resolveResearch = resolve; });
  await app.run("openProject('imai')");
  const pending = app.run("runResearchWorkspace(nodes.find(node => node.id === 'research'))");
  await app.run("openProject('azabu'); openFullWorkspace('research')");
  resolveResearch({
    projectId:'imai', webEvidence:{sources:[]},
    landscape:{companyProfile:[{topic:'Meiji',finding:'insurance only',sourceUrl:'https://meiji.example'}],competitorCompanies:[{companyName:'Insurance company',products:[]}],evidenceGaps:[]},
    marketInsight:{marketPersonas:[]}, strategy:{strategicDirections:[]}
  });
  await pending;
  assert.equal(app.run('inspectProject().selectedProject'), 'azabu');
  assert.equal(app.run('researchBooks.imai[0].rows[0][1]'), 'insurance only');
  assert.doesNotMatch(app.run('JSON.stringify(inspectProject().book)'), /insurance only/);
  assert.equal(app.run('inspectProject().competitorCompanies.length'), 0);
  assert.equal(app.run('researchOutputs.azabu'), undefined);
  assert.equal(app.run('researchOutputs.imai.length'), 1);
});
