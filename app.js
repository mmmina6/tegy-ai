const projects = [
  { id: 'azabu', name: '日本インプラント', sub: 'Japan Implant', mark: '日' },
  { id: 'imai', name: '明治安田生命', sub: 'Meijiyasuda Seimei', mark: '明' },
  { id: 'tegy', name: 'TEGY', sub: 'Internal Project', mark: 'T' },
  { id: 'demo', name: 'Demo Project', sub: 'Test & Explore', mark: 'D' }
];

const baseNodes = [
  { id: 'pm', name: 'AI Project Manager', icon: '✦', cls: 'pm', x: 36, y: 6, status: 'Thinking...', type: 'progress', detail: 'プロジェクトを推進中です', progress: 55 },
  { id: 'brand', name: 'Brand Agent', icon: '◇', cls: 'mint-bg', x: 10, y: 35, status: 'Completed', type: 'done', detail: 'ブランド分析完了', progress: 100 },
  { id: 'script', name: 'Script Agent', icon: '✎', cls: 'cyan-bg', x: 40, y: 34, status: 'Ready', type: 'progress', detail: '商品情報をチャットに入力してください', progress: 0 },
  { id: 'animation', name: 'Animation Agent', icon: '▷', cls: 'pink-bg', x: 69, y: 35, status: 'Waiting', type: 'waiting', detail: 'スクリプト完了後に開始', progress: 0 },
  { id: 'shadow', name: 'ShadowBan Agent', icon: '⬡', cls: 'orange-bg', x: 51, y: 67, status: 'Ready', type: 'progress', detail: 'YouTubeチャンネル分析準備完了', progress: 0 }
];

let selectedProject = null;
let nodes = [];
let selectedNode = null;
let generating = false;
const outputs = loadOutputs();

const $ = id => document.getElementById(id);
const app = $('app');
const welcome = $('welcomeScreen');
const canvas = $('canvasScreen');
const inspector = $('inspector');
const nodeLayer = $('nodeLayer');
const connections = $('connections');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function loadOutputs() {
  try { return JSON.parse(localStorage.getItem('tegy-script-outputs') || '{}'); }
  catch { return {}; }
}

function saveOutputs() {
  localStorage.setItem('tegy-script-outputs', JSON.stringify(outputs));
}

function renderProjects() {
  $('projectList').innerHTML = projects.map(p => `<button class="project-card ${selectedProject === p.id ? 'active' : ''}" data-project="${p.id}"><span class="project-icon">${p.mark}</span><span><strong>${p.name}</strong><small>${p.sub}</small></span><span>•••</span></button>`).join('');
  $('collapsedProjects').innerHTML = projects.map(p => `<button class="${selectedProject === p.id ? 'active' : ''}" data-project="${p.id}" title="${p.name}">${p.mark}</button>`).join('') + '<button id="collapsedAdd">＋</button>';
  document.querySelectorAll('[data-project]').forEach(button => { button.onclick = () => openProject(button.dataset.project); });
  const add = $('collapsedAdd');
  if (add) add.onclick = createProject;
}

function openProject(id) {
  selectedProject = id;
  nodes = structuredClone(baseNodes);
  const latest = outputs[id]?.at(-1);
  if (latest) updateScriptNode('Completed', 'done', latest.script.title, 100);
  app.classList.remove('sidebar-hidden');
  welcome.classList.add('hidden');
  canvas.classList.remove('hidden');
  renderProjects();
  const project = projects.find(item => item.id === id);
  $('breadcrumbs').innerHTML = `<strong>${project.name}</strong><span class="active-project-pill">● Active Project</span><span class="project-subline">› YouTube Organic 広告制作プロジェクト　✎</span>`;
  $('chatTitle').textContent = 'AI Script Agent';
  $('chatSubtitle').textContent = '商品の情報を普段の言葉で教えてください。';
  renderNodes();
  renderHistory();
  if (latest) renderOutput(latest);
  requestAnimationFrame(() => selectNode('script'));
}

function showWelcome() {
  selectedProject = null;
  app.classList.add('sidebar-hidden');
  welcome.classList.remove('hidden');
  canvas.classList.add('hidden');
  closeInspector();
  $('breadcrumbs').innerHTML = '';
  $('chatTitle').textContent = 'こんにちは、Minaさん 👋';
  $('chatSubtitle').textContent = '今日は何を創りましょうか？';
  renderProjects();
}

function renderNodes() {
  nodeLayer.innerHTML = '';
  nodes.forEach(node => {
    const element = document.createElement('article');
    element.className = `node${selectedNode === node.id ? ' selected' : ''}`;
    element.dataset.id = node.id;
    element.style.left = `${node.x}%`;
    element.style.top = `${node.y}%`;
    element.innerHTML = `<div class="node-head"><div class="node-icon ${node.cls}">${node.icon}</div><div><h3>${node.name}</h3><span class="node-status ${node.type}">● ${node.status}</span></div></div><p>${escapeHtml(node.detail)}</p>${node.progress ? `<div class="node-progress"><span style="width:${node.progress}%"></span></div>` : ''}`;
    element.onclick = event => { event.stopPropagation(); selectNode(node.id); };
    enableDrag(element, node);
    nodeLayer.appendChild(element);
  });
  requestAnimationFrame(drawConnections);
}

function enableDrag(element, node) {
  let down = false, startX = 0, startY = 0, originX = 0, originY = 0;
  element.onpointerdown = event => {
    if (event.button !== 0) return;
    down = true; startX = event.clientX; startY = event.clientY; originX = element.offsetLeft; originY = element.offsetTop;
    element.setPointerCapture(event.pointerId);
  };
  element.onpointermove = event => {
    if (!down) return;
    const x = Math.max(0, Math.min(nodeLayer.clientWidth - element.offsetWidth, originX + event.clientX - startX));
    const y = Math.max(0, Math.min(nodeLayer.clientHeight - element.offsetHeight, originY + event.clientY - startY));
    element.style.left = `${x}px`; element.style.top = `${y}px`;
    node.x = x / nodeLayer.clientWidth * 100; node.y = y / nodeLayer.clientHeight * 100;
    drawConnections();
  };
  element.onpointerup = () => { down = false; };
}

function drawConnections() {
  connections.innerHTML = '';
  const pairs = [['pm', 'brand', '#56d9aa'], ['pm', 'script', '#4f83ff'], ['pm', 'animation', '#f34eb4'], ['brand', 'script', '#4bcdb2'], ['script', 'animation', '#f15fb7'], ['script', 'shadow', '#ff8b36']];
  const canvasRect = canvas.getBoundingClientRect();
  pairs.forEach(([a, b, color]) => {
    const first = nodeLayer.querySelector(`[data-id="${a}"]`), second = nodeLayer.querySelector(`[data-id="${b}"]`);
    if (!first || !second) return;
    const ar = first.getBoundingClientRect(), br = second.getBoundingClientRect();
    const x1 = ar.left + ar.width / 2 - canvasRect.left, y1 = ar.top + ar.height / 2 - canvasRect.top;
    const x2 = br.left + br.width / 2 - canvasRect.left, y2 = br.top + br.height / 2 - canvasRect.top;
    const dx = Math.max(60, Math.abs(x2 - x1) * .48);
    connections.insertAdjacentHTML('beforeend', `<path d="M${x1} ${y1} C${x1 + dx} ${y1},${x2 - dx} ${y2},${x2} ${y2}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>`);
  });
}

function selectNode(id) {
  selectedNode = id;
  const node = nodes.find(item => item.id === id);
  if (!node) return;
  app.classList.add('inspector-open');
  inspector.classList.remove('hidden');
  $('inspectorTitle').textContent = node.name;
  $('inspectorAgentName').textContent = node.name;
  $('progressText').textContent = `${node.progress || 0}%`;
  $('progressBar').style.width = `${node.progress || 0}%`;
  renderNodes();
}

function closeInspector() {
  selectedNode = null;
  app.classList.remove('inspector-open');
  inspector.classList.add('hidden');
  if (nodes.length) renderNodes();
}

function createProject() {
  const name = prompt('新しいプロジェクト名を入力してください');
  if (!name) return;
  const id = `p${Date.now()}`;
  projects.push({ id, name, sub: 'New Project', mark: name.trim().charAt(0) || '＋' });
  renderProjects(); openProject(id);
}

function addAgent(name) {
  if (!selectedProject) return;
  const map = { 'Brand Agent': ['◇', 'mint-bg'], 'Script Agent': ['✎', 'cyan-bg'], 'Animation Agent': ['▷', 'pink-bg'], 'ShadowBan Agent': ['⬡', 'orange-bg'], 'Image Agent': ['▧', 'pink-bg'] };
  const [icon, cls] = map[name] || ['✦', 'cyan-bg'];
  nodes.push({ id: `n${Date.now()}`, name, icon, cls, x: 38 + Math.random() * 28, y: 45 + Math.random() * 22, status: 'Ready', type: 'progress', detail: '新しいAgentを追加しました', progress: 0 });
  renderNodes();
}

function updateScriptNode(status, type, detail, progress) {
  const node = nodes.find(item => item.id === 'script');
  if (!node) return;
  Object.assign(node, { status, type, detail, progress });
  $('progressText').textContent = `${progress}%`;
  $('progressBar').style.width = `${progress}%`;
  renderNodes();
}

function setStatus(message, kind = '') {
  const status = $('chatStatus');
  status.textContent = message;
  status.className = `chat-status ${kind}`;
  if (!message) status.classList.add('hidden');
}

function showTab(name) {
  ['overview', 'output', 'history', 'prompt'].forEach(tab => {
    $(`${tab}Panel`).classList.toggle('hidden', tab !== name);
  });
  document.querySelectorAll('#inspectorTabs button').forEach(button => button.classList.toggle('active', button.dataset.tab === name));
}

function renderOutput(result) {
  const { product, insight, script } = result;
  const personas = insight.personas.map((persona, index) => `<article class="result-card ${index === insight.selectedPersonaIndex ? 'selected-persona' : ''}"><div class="result-kicker">PERSONA ${index + 1}${index === insight.selectedPersonaIndex ? ' · RECOMMENDED' : ''}</div><h3>${escapeHtml(persona.name)} · ${escapeHtml(persona.age)}</h3><p>${escapeHtml(persona.profile)}</p><dl><dt>Pain</dt><dd>${persona.pain.map(escapeHtml).join(' / ')}</dd><dt>Insight</dt><dd>${escapeHtml(persona.insight)}</dd><dt>Objection</dt><dd>${persona.objections.map(escapeHtml).join(' / ')}</dd><dt>Trigger</dt><dd>${persona.triggers.map(escapeHtml).join(' / ')}</dd></dl></article>`).join('');
  const scenes = script.scenes.map(scene => `<tr><td>${scene.number}<small>${escapeHtml(scene.seconds)}</small></td><td><b>${escapeHtml(scene.visual)}</b><p>${escapeHtml(scene.narration)}</p><em>${escapeHtml(scene.onScreenText)}</em></td></tr>`).join('');
  $('outputPanel').innerHTML = `<div class="result-head"><div class="result-kicker">${escapeHtml(product.platform)} · ${product.durationSeconds}s</div><h2>${escapeHtml(script.title)}</h2><p>${escapeHtml(product.productName)} — ${escapeHtml(product.audience)}</p></div><section class="result-section"><h3>Product Brief</h3><p>${escapeHtml(product.description)}</p><div class="tag-row">${product.benefits.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div></section><section class="result-section"><h3>Persona & Insight</h3>${personas}<p class="direction"><b>Creative Direction</b>${escapeHtml(insight.creativeDirection)}</p></section><section class="result-section script-result"><div class="result-kicker">HOOK</div><blockquote>${escapeHtml(script.hook)}</blockquote><h3>Full Script</h3><p class="script-copy">${escapeHtml(script.fullScript)}</p><table><tbody>${scenes}</tbody></table><div class="cta-box"><b>CTA</b>${escapeHtml(script.cta)}</div></section>`;
  showTab('output');
  selectNode('script');
}

function renderHistory() {
  const history = outputs[selectedProject] || [];
  $('historyPanel').innerHTML = history.length ? history.slice().reverse().map((item, index) => `<button class="history-item" data-history-index="${history.length - 1 - index}"><b>${escapeHtml(item.script.title)}</b><span>${escapeHtml(item.product.productName)} · ${new Date(item.createdAt).toLocaleString()}</span></button>`).join('') : '<div class="empty-output">まだ生成履歴はありません。</div>';
  document.querySelectorAll('[data-history-index]').forEach(button => { button.onclick = () => renderOutput(history[Number(button.dataset.historyIndex)]); });
}

async function submitChat(event) {
  event.preventDefault();
  const input = $('chatInput');
  const message = input.value.trim();
  if (!message || generating) return;
  if (!selectedProject) openProject('demo');
  generating = true;
  $('chatSubmit').disabled = true;
  input.disabled = true;
  setStatus('Product → Persona & Insight → Script を生成しています…', 'loading');
  updateScriptNode('In Progress', 'progress', '3つのSkillを実行中...', 35);
  selectNode('script');

  try {
    const project = projects.find(item => item.id === selectedProject);
    const response = await fetch('/api/script', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, project }) });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (!isJson) throw new Error('AI服务器接口が起動していません。Vercel Dev またはデプロイ環境で実行してください。');
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || payload.error || 'Generation failed.');
    outputs[selectedProject] ||= [];
    outputs[selectedProject].push(payload);
    saveOutputs();
    renderOutput(payload);
    renderHistory();
    updateScriptNode('Completed', 'done', payload.script.title, 100);
    setStatus('脚本を生成しました。右側の Output で確認できます。', 'success');
    input.value = '';
  } catch (error) {
    updateScriptNode('Needs attention', 'waiting', error.message, 0);
    setStatus(error.message, 'error');
  } finally {
    generating = false;
    $('chatSubmit').disabled = false;
    input.disabled = false;
    input.focus();
  }
}

$('menuButton').onclick = () => app.classList.toggle('sidebar-hidden');
$('closeInspector').onclick = closeInspector;
$('newProjectBtn').onclick = createProject;
$('quickAdd').onclick = () => selectedProject ? addAgent('Image Agent') : createProject();
$('floatingAdd').onclick = () => addAgent('Image Agent');
document.querySelectorAll('[data-add-agent]').forEach(button => { button.onclick = () => addAgent(button.dataset.addAgent); });
document.querySelectorAll('#inspectorTabs button').forEach(button => { button.onclick = () => showTab(button.dataset.tab); });
$('chatForm').onsubmit = submitChat;
window.addEventListener('resize', drawConnections);
canvas.onclick = () => closeInspector();
renderProjects();
showWelcome();
