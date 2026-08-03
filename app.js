const projects = [
  { id: 'azabu', name: '日本インプラント', sub: 'Japan Implant', mark: '日' },
  { id: 'imai', name: '明治安田生命', sub: 'Meijiyasuda Seimei', mark: '明' },
  { id: 'tegy', name: 'TEGY', sub: 'Internal Project', mark: 'T' },
  { id: 'demo', name: 'Demo Project', sub: 'Test & Explore', mark: 'D' }
];

const projectDetails = {
  azabu: { owner:'Mina Rho', deadline:'2026/08/28', requirement:'信頼性を保ちながら相談予約につながる広告制作' },
  imai: { owner:'Mina Rho', deadline:'2026/09/12', requirement:'若年層にも身近に感じるブランドコミュニケーション' },
  tegy: { owner:'Mina Rho', deadline:'2026/09/30', requirement:'AI 広告会社の持続可能な業務基盤を構築' },
  demo: { owner:'Mina Rho', deadline:'2026/08/15', requirement:'商品の価値を生活シーンで伝える短尺広告' }
};

const baseNodes = [
  { id: 'pm', name: 'AI Project Manager', icon: '✦', cls: 'pm', x: 36, y: 6, status: 'Thinking...', type: 'progress', detail: 'プロジェクトを推進中です', progress: 55 },
  { id: 'research', name: 'Research Agent', icon: '◎', cls: 'mint-bg', x: 9, y: 38, status: 'In Progress', type: 'progress', detail: '市場・競合・広告リサーチ', progress: 48 },
  { id: 'script', name: 'Script Agent', icon: '✎', cls: 'cyan-bg', x: 40, y: 34, status: 'Ready', type: 'progress', detail: '商品情報をチャットに入力してください', progress: 0 },
  { id: 'animation', name: 'Animation Agent', icon: '▷', cls: 'pink-bg', x: 69, y: 35, status: 'Waiting', type: 'waiting', detail: 'スクリプト完了後に開始', progress: 0 },
  { id: 'shadow', name: 'ShadowBan Agent', icon: '⬡', cls: 'orange-bg', x: 51, y: 67, status: 'Ready', type: 'progress', detail: 'YouTubeチャンネル分析準備完了', progress: 0 }
];

let selectedProject = null;
let nodes = [];
let selectedNode = null;
let generating = false;
const outputs = loadOutputs();
const projectWorks = loadProjectWorks();
const researchOutputs = loadResearchOutputs();
const shadowOutputs = loadShadowOutputs();
let activeWorkspaceNodeId = null;

const $ = id => document.getElementById(id);
const app = $('app');
const welcome = $('welcomeScreen');
const canvas = $('canvasScreen');
const inspector = $('inspector');
const nodeLayer = $('nodeLayer');
const connections = $('connections');
const fullWorkspace = $('fullWorkspace');

const researchItems = [
  { title: 'Company & Product', kicker: '01 · FOUNDATION', description: '会社、商品・サービス、ブランドの事実をプロジェクト共通情報として整理します。', insight: '事実情報と広告表現に使える根拠を分けて管理します。', columns: ['Research item','Finding / evidence','Source / URL','Status'], rows: [['Company overview','企業概要、事業領域、ブランドの強み','','Review'],['Product / service','商品特徴、価格、保証、提供条件','','Open'],['Customer requirement','最終要件と今回の相談背景','','Confirmed']] },
  { title: 'Market & Trend', kicker: '02 · MARKET', description: '市場規模、カテゴリートレンド、消費者の変化、検索需要をまとめます。', insight: '長期的な市場ニーズと一時的なトレンドを分けて評価します。', columns: ['Theme','Market finding','Evidence','Opportunity'], rows: [['Category demand','市場で顕在化している需要','',''],['Consumer trend','生活・価値観・購買行動の変化','',''],['Search trend','検索されている悩みと関連語','','']] },
  { title: 'Competitor Accounts', kicker: '03 · BENCHMARK', description: '競合企業と対標アカウントを、媒体・表現・反応まで横並びで比較します。', insight: '会社単位ではなく、実際に成果が見えるアカウントと投稿単位でも比較します。', columns: ['Account / brand','Platform','What works','Reference URL'], rows: [['Competitor A','Instagram / Meta','',''],['Benchmark account','YouTube Organic','',''],['Category leader','TikTok','','']] },
  { title: 'Paid Advertising', kicker: '04 · PAID MEDIA', description: 'Meta などの広告出稿、クリエイティブ、オファー、LP 導線を調査します。', insight: '媒体ごとに広告表現・オファー・着地ページの組み合わせを記録します。', columns: ['Advertiser','Channel','Creative / offer','Ad library / URL'], rows: [['Meta ad reference','Meta Ads','',''],['Search advertising','Google Ads','',''],['Landing page','LP','','']] },
  { title: 'Organic & Video', kicker: '05 · ORGANIC', description: 'Google Organic、YouTube、SNS 動画など、広告以外の参考コンテンツを収集します。', insight: '動画制作に使える構成、Hook、尺、コメント反応を一覧化できます。', columns: ['Reference video','Channel / format','Why it works','Video URL'], rows: [['Reference video 01','YouTube / Long','',''],['Reference short','YouTube Shorts / Reels','',''],['Organic Google result','Google Organic','','']] },
  { title: 'Platform & Policy', kicker: '06 · PLATFORM', description: '媒体特性、広告ポリシー、表現上の注意点、審査リスクを整理します。', insight: '制作前に必要な表現制限を共有し、後工程の手戻りを減らします。', columns: ['Platform','Requirement / risk','Action needed','Source'], rows: [['Meta','広告ポリシー・審査注意点','',''],['Google / YouTube','動画・広告・検索の要件','',''],['TikTok','クリエイティブと審査要件','','']] },
  { title: 'Market Persona & Insight', kicker: '07 · SHARED INSIGHT', description: '市場全体の需要、痛み、心理、Market Persona を統合し、全 Work で共有します。', insight: 'これは特定広告の Campaign Persona ではなく、Project に長期保存する Market Insight です。', columns: ['Market persona','Need / pain','Underlying insight','Evidence'], rows: [['Primary market persona','','',''],['Secondary market persona','','',''],['Key market insight','','','']] },
  { title: 'Strategy Summary', kicker: '08 · DIRECTION', description: '調査結果から、クライアント会議で確認する方向性と次の Work を整理します。', insight: 'Research の最終出力を PDF と共有データにまとめます。', columns: ['Priority','Strategic direction','Reason','Next Work'], rows: [['01','','','AI Script'],['02','','','Video'],['03','','','Operations']] }
];
try {
  const savedResearchItems = JSON.parse(localStorage.getItem('tegy-research-book') || 'null');
  if (Array.isArray(savedResearchItems) && savedResearchItems.length) researchItems.splice(0, researchItems.length, ...savedResearchItems);
} catch {}
let activeResearchIndex = 0;

function saveResearchBook() {
  localStorage.setItem('tegy-research-book', JSON.stringify(researchItems));
}

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

function loadProjectWorks() {
  try { return JSON.parse(localStorage.getItem('tegy-project-works') || '{}'); }
  catch { return {}; }
}

function saveProjectWorks() {
  if (!selectedProject) return;
  projectWorks[selectedProject] = structuredClone(nodes);
  localStorage.setItem('tegy-project-works', JSON.stringify(projectWorks));
}

function loadResearchOutputs() {
  try { return JSON.parse(localStorage.getItem('tegy-research-outputs') || '{}'); }
  catch { return {}; }
}

function saveResearchOutputs() {
  localStorage.setItem('tegy-research-outputs', JSON.stringify(researchOutputs));
}

function loadShadowOutputs() {
  try { return JSON.parse(localStorage.getItem('tegy-shadow-outputs-v2-ja') || '{}'); }
  catch { return {}; }
}

function saveShadowOutputs() {
  localStorage.setItem('tegy-shadow-outputs-v2-ja', JSON.stringify(shadowOutputs));
}

function buildProjectContext() {
  const project = projects.find(item => item.id === selectedProject) || {};
  const details = projectDetails[selectedProject] || {};
  return { id: project.id, name: project.name, customer: project.sub, owner: details.owner, deadline: details.deadline, finalRequirement: details.requirement };
}

function renderProjects() {
  $('projectList').innerHTML = projects.map(p => `<button class="project-card ${selectedProject === p.id ? 'active' : ''}" data-project="${p.id}"><span class="project-icon">${p.mark}</span><span><strong>${p.name}</strong><small>${p.sub}</small></span><span>•••</span></button>`).join('');
  $('collapsedProjects').innerHTML = projects.map(p => `<button class="${selectedProject === p.id ? 'active' : ''}" data-project="${p.id}" title="${p.name}">${p.mark}</button>`).join('') + '<button id="collapsedAdd">＋</button>';
  document.querySelectorAll('[data-project]').forEach(button => { button.onclick = () => openProject(button.dataset.project); });
  const add = $('collapsedAdd');
  if (add) add.onclick = createProject;
}

function renderProjectSearch(query = '') {
  const value = query.trim().toLowerCase();
  const results = value ? projects.filter(project => `${project.name} ${project.sub} ${project.id}`.toLowerCase().includes(value)) : projects;
  $('searchResults').innerHTML = results.length
    ? `<small>PROJECTS</small>${results.slice(0, 8).map(project => `<button data-search-project="${project.id}"><span class="search-project-icon">${escapeHtml(project.mark)}</span><div><b>${escapeHtml(project.name)}</b><em>${escapeHtml(project.sub)}</em></div><i>Open →</i></button>`).join('')}`
    : '<div class="no-search-result">該当するProjectがありません</div>';
  $('searchResults').classList.remove('hidden');
  document.querySelectorAll('[data-search-project]').forEach(button => { button.onclick = event => { event.preventDefault(); openProject(button.dataset.searchProject); closeProjectSearch(); }; });
}

function closeProjectSearch() {
  $('searchResults').classList.add('hidden');
  $('globalSearch').value = '';
}

function openProject(id) {
  closeFullWorkspace();
  selectedProject = id;
  nodes = structuredClone(projectWorks[id] || baseNodes);
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
    element.ondblclick = event => { event.stopPropagation(); openFullWorkspace(node.id); };
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
  element.onpointerup = () => { if (down) saveProjectWorks(); down = false; };
}

function drawConnections() {
  connections.innerHTML = '';
  const pairs = [['pm', 'research', '#56d9aa'], ['research', 'script', '#4bcdb2'], ['pm', 'script', '#4f83ff'], ['pm', 'animation', '#f34eb4'], ['script', 'animation', '#f15fb7'], ['script', 'shadow', '#ff8b36']];
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
  const inspectorIcon = document.querySelector('.agent-title .agent-icon');
  inspectorIcon.textContent = node.icon;
  inspectorIcon.className = `agent-icon ${node.cls}`;
  document.querySelector('.status-pill').textContent = `● ${node.status}`;
  $('progressText').textContent = `${node.progress || 0}%`;
  $('progressBar').style.width = `${node.progress || 0}%`;
  renderInspectorDetails(node);
  nodeLayer.querySelectorAll('.node').forEach(element => element.classList.toggle('selected', element.dataset.id === id));
}

function renderInspectorDetails(node) {
  const key = getWorkspaceKey(node);
  const details = projectDetails[selectedProject] || { owner:'Mina Rho', deadline:'Not set', requirement:'Project requirement has not been added.' };
  const config = {
    research: { steps:['Project brief','Market & competitor research','Market Persona / Insight','Research Report'], task:'市場・競合・広告リサーチを整理' },
    script: { steps:['Campaign brief','Campaign Persona','Script & Hook','Scene / Storyboard'], task:'Campaign Persona と Script を作成' },
    animation: { steps:['Creative brief','Style & characters','Scenes & shots','Animation export'], task:'スタイルとキャラクター資産を設計' },
    shadow: { steps:['Channel input','Health check','SEO action plan','Monitoring report'], task:'チャンネル健全性と検索露出を診断' },
    video: { steps:['Video brief','Reference analysis','Edit review','Final delivery'], task:'参考動画と Shot Plan を整理' },
    operations: { steps:['Channel setup','Content calendar','Publish & monitor','Monthly report'], task:'公開予定と運用タスクを管理' },
    brand: { steps:['Brand input','Positioning','Voice & visual rules','Brand Book'], task:'ブランド判断基準を共通化' },
    manager: { steps:['Project setup','Work planning','Client review','Final delivery'], task:'次の Work と確認事項を整理' }
  }[key];
  const completed = Math.max(0, Math.floor((node.progress || 0) / 25));
  $('inspectorSteps').innerHTML = config.steps.map((step,index) => `<li class="${index < completed ? 'done' : index === completed ? 'active' : ''}">${index < completed ? '✓' : index === completed ? '●' : '○'} ${escapeHtml(step)}<em>${index < completed ? '完了' : index === completed ? '進行中' : '待機中'}</em></li>`).join('');
  $('inspectorMeta').innerHTML = `<div><span>Owner</span><b>${escapeHtml(details.owner)}</b></div><div><span>Deadline</span><b>${escapeHtml(details.deadline)}</b></div><div><span>Final requirement</span><b>${escapeHtml(details.requirement)}</b></div>`;
  $('inspectorCurrentTask').innerHTML = `<b>${escapeHtml(config.task)}</b><span>${escapeHtml(node.detail)}</span>`;
}

function openFullWorkspace(id) {
  const node = nodes.find(item => item.id === id);
  if (!node) return;
  activeWorkspaceNodeId = id;
  closeInspector();
  fullWorkspace.classList.remove('hidden');
  $('chatPanel').classList.add('hidden');
  $('fullWorkspaceTitle').textContent = `${node.name} Workspace`;
  $('fullWorkspaceIcon').textContent = node.icon;
  $('fullWorkspaceIcon').className = `workspace-agent-icon ${node.cls}`;
  const workspaceKey = getWorkspaceKey(node);
  $('runWorkspaceAgent').textContent = workspaceKey === 'research' ? '↻ Run Research' : workspaceKey === 'script' ? '↻ Generate Script' : '↻ Run Agent';
  const stepMap = {
    research: ['01. Project Brief','02. Company & Product','03. Market Research','04. Competitors','05. Ads & Organic','06. Market Insight','07. Report'],
    script: ['01. Campaign Brief','02. Campaign Persona','03. Hooks','04. Generate Script','05. Scene & Storyboard'],
    animation: ['01. Creative Brief','02. Style & Characters','03. Scenes & Shots','04. Animate','05. Compose & Export'],
    shadow: ['01. Channel Input','02. Health Check','03. Content Audit','04. SEO Actions','05. Monitoring Report'],
    video: ['01. Video Brief','02. References','03. Shot Plan','04. Edit & Review','05. Delivery'],
    operations: ['01. Channel Setup','02. Content Calendar','03. Publish','04. Performance','05. Report'],
    brand: ['01. Brand Input','02. Identity Audit','03. Positioning','04. Guidelines','05. Brand Book'],
    manager: ['01. Project Setup','02. Work Planning','03. Dependencies','04. Review','05. Delivery']
  };
  const steps = stepMap[workspaceKey] || stepMap.manager;
  $('workspaceSteps').innerHTML = steps.map((step,index) => `<button class="${index === 0 ? 'done' : index === 1 ? 'active' : ''}">${escapeHtml(step)}<span>${index === 0 ? '✓' : index === 1 ? 'In Progress' : 'Pending'}</span></button>`).join('');
  $('researchWorkspace').classList.toggle('hidden', workspaceKey !== 'research');
  $('genericWorkspace').classList.toggle('hidden', workspaceKey === 'research');
  if (workspaceKey === 'research') renderResearchBook();
  else renderDeliveryWorkspace(workspaceKey, node);
}

function getWorkspaceKey(node) {
  if (node.id === 'research' || node.name.includes('Research')) return 'research';
  if (node.id === 'script' || node.name.includes('Script')) return 'script';
  if (node.id === 'animation' || node.name.includes('Animation') || node.name.includes('Anime')) return 'animation';
  if (node.id === 'shadow' || node.name.includes('Shadow') || node.name.includes('SEO')) return 'shadow';
  if (node.name.includes('Video')) return 'video';
  if (node.name.includes('Operations')) return 'operations';
  if (node.id === 'brand' || node.name.includes('Brand')) return 'brand';
  return 'manager';
}

function renderDeliveryWorkspace(key, node) {
  const definitions = {
    script: { kicker:'CAMPAIGN CREATION', title:'Campaign Persona & Script', copy:'Project の Market Insight を読み、この広告専用の Campaign Persona、Hook、Script、Scene を生成します。', nav:['Campaign Brief','Campaign Persona','Hook Library','Script Editor','Scenes','Versions'], center:'script', insight:'この Campaign では「安心」だけでなく、行動を妨げている具体的な不安を最初の3秒で言語化します。', exports:['Export Script','Storyboard PDF'] },
    animation: { kicker:'ANIMATION DIRECTOR', title:'Bring the story to life', copy:'キャラクター、世界観、シーン、ショットを一つの制作ボードで管理します。', nav:['Creative Brief','Style References','Characters','Scenes','Shots','Asset Library'], center:'animation', insight:'キャラクターと背景の一貫性を先に固定し、ショットごとの再生成を減らします。', exports:['Preview MP4','Asset Package'] },
    shadow: { kicker:'CHANNEL HEALTH', title:'Shadow Ban / SEO Audit', copy:'チャンネルの健全性、検索露出、投稿パターン、改善アクションをまとめます。', nav:['Channel Overview','Health Signals','Content Audit','Keywords','Action Plan','Monitoring'], center:'shadow', insight:'単一指標で Shadow Ban と断定せず、露出・検索・視聴維持・投稿履歴を組み合わせて評価します。', exports:['Audit Report','Action CSV'] },
    video: { kicker:'VIDEO PRODUCTION', title:'Video Production Board', copy:'参考動画から Shot Plan、素材、編集レビュー、最終納品までを管理します。', nav:['Video Brief','References','Shot List','Footage','Edit Review','Deliverables'], center:'video', insight:'参考動画は見た目だけでなく、Hook、尺、画面変化、CTA の構造として分解します。', exports:['Review Link','Delivery Package'] },
    operations: { kicker:'CHANNEL OPERATIONS', title:'Publishing & Growth', copy:'投稿計画、承認、公開、数値、次の改善を一つの運用画面にまとめます。', nav:['Channel Setup','Calendar','Approval Queue','Publishing','Performance','Reports'], center:'operations', insight:'制作数ではなく、公開後の学習が次の Research と Script に戻る運用ループを作ります。', exports:['Monthly Report','Calendar CSV'] },
    brand: { kicker:'BRAND FOUNDATION', title:'Brand Intelligence', copy:'ブランドの事実、ポジショニング、Tone of Voice、表現ルールを共通資産にします。', nav:['Brand Input','Identity','Positioning','Voice','Visual Rules','Brand Book'], center:'brand', insight:'すべての Agent が同じブランド判断基準を参照できる状態を作ります。', exports:['Brand Book','Guidelines'] },
    manager: { kicker:'PROJECT CONTROL', title:'Project Delivery Overview', copy:'Work、依存関係、レビュー、クライアント確認、最終納品を管理します。', nav:['Project Brief','Work Plan','Dependencies','Approvals','Timeline','Delivery'], center:'manager', insight:'止まっている Work と次に必要な判断を優先表示します。', exports:['Project Report','Delivery Index'] }
  };
  const d = definitions[key] || definitions.manager;
  $('genericWorkspace').innerHTML = `<div class="delivery-workspace ${key}-delivery"><aside class="delivery-nav"><div class="delivery-nav-title"><span class="node-icon ${node.cls}">${node.icon}</span><div><b>${escapeHtml(node.name)}</b><small>Project Work</small></div></div><nav>${d.nav.map((item,index)=>`<button class="${index===1?'active':''}"><span>${String(index+1).padStart(2,'0')}</span>${escapeHtml(item)}</button>`).join('')}</nav><button class="delivery-add">＋ Add item</button></aside><main class="delivery-main"><header><div><small>${d.kicker}</small><h1>${d.title}</h1><p>${d.copy}</p></div><button>•••</button></header>${deliveryCenterMarkup(d.center)}</main><aside class="delivery-rail"><section><small>AI INSIGHT</small><h3>Recommended direction</h3><p>${d.insight}</p></section><section><small>HISTORY</small><ul><li><b>10:25</b> Workspace updated</li><li><b>10:10</b> Project context synced</li><li><b>Yesterday</b> Client requirement added</li></ul></section><section><small>EXPORT & DELIVERY</small>${d.exports.map(item=>`<button>${escapeHtml(item)} <span>→</span></button>`).join('')}</section></aside></div>`;
  if (key === 'shadow') {
    const form = $('shadowAuditForm');
    if (form) form.onsubmit = event => { event.preventDefault(); runShadowAudit(); };
  }
  if (key === 'script') {
    const form = $('scriptWorkspaceForm');
    if (form) form.onsubmit = event => { event.preventDefault(); runScriptWorkspace(); };
    const save = $('saveScriptEdits');
    if (save) save.onclick = saveScriptWorkspaceEdits;
  }
}

function deliveryCenterMarkup(type) {
  if (type === 'animation') return `<div class="animation-director"><div class="director-toolbar"><button class="active">All Assets</button><button>Characters</button><button>Scenes</button><button>References</button><button class="create-asset">＋ Create Asset</button></div><div class="animation-hero"><div><small>DIRECTOR'S BOARD</small><h2>Good afternoon, director!</h2><p>まず世界観とキャラクターを固定して、シーンとショットを組み立てます。</p></div><div class="play-orb">▷</div></div><h3>Style & Character Assets</h3><div class="asset-grid"><article class="asset-card character"><div><span>CHARACTER</span><b>Hero Character</b></div></article><article class="asset-card style"><div><span>STYLE</span><b>Soft 3D / Warm light</b></div></article><article class="asset-card scene"><div><span>SCENE</span><b>Morning Interior</b></div></article></div><div class="shot-board"><div><h3>Scene 01 · Opening</h3><span>3 shots · 8 sec</span></div><div class="shot-strip"><article><b>01</b><p>Establishing shot</p><span>00:00–00:02</span></article><article><b>02</b><p>Character close-up</p><span>00:02–00:05</span></article><article><b>03</b><p>Product reveal</p><span>00:05–00:08</span></article><button>＋</button></div></div></div>`;
  if (type === 'script') return scriptWorkspaceMarkup(outputs[selectedProject]?.at(-1));
  if (type === 'shadow') return shadowWorkspaceMarkup(shadowOutputs[selectedProject]?.at(-1));
  if (type === 'video') return `<div class="video-board"><div class="video-preview"><button>▷</button><span>00:00 / 00:30</span></div><div class="video-meta"><section><small>REFERENCE ANALYSIS</small><h3>Hook → Proof → CTA</h3><p>最初の3秒、画面変化、字幕密度、CTA の構造を参考動画から抽出。</p></section><section><small>REVIEW STATUS</small><h3>Rough Cut v03</h3><p>2 comments waiting · Mina Rho</p></section></div><div class="timeline"><b>V1</b><i></i><i></i><i></i><b>A1</b><i></i><i></i></div></div>`;
  if (type === 'operations') return `<div class="operations-board"><div class="calendar-head"><button>←</button><h2>August 2026</h2><button>→</button><span>＋ New Post</span></div><div class="content-calendar">${['MON 3','TUE 4','WED 5','THU 6','FRI 7'].map((day,index)=>`<article><b>${day}</b>${index===1?'<div class="post youtube">YouTube<br><span>How-to video · 18:00</span></div>':''}${index===3?'<div class="post instagram">Instagram<br><span>Reels · Approved</span></div>':''}</article>`).join('')}</div><div class="performance-row"><article><small>VIEWS</small><b>128.4K</b><span>↑ 18%</span></article><article><small>ENGAGEMENT</small><b>6.8%</b><span>↑ 1.2%</span></article><article><small>LEADS</small><b>342</b><span>↑ 24%</span></article></div></div>`;
  if (type === 'brand') return `<div class="brand-board"><div class="brand-hero"><span>BRAND ESSENCE</span><h2>Trust that feels human.</h2><p>専門性を、生活者が理解できる言葉と温度で届ける。</p></div><div class="brand-grid"><article><small>POSITIONING</small><h3>Clear expertise</h3><p>複雑な情報を透明で分かりやすく。</p></article><article><small>TONE OF VOICE</small><h3>Calm · Honest · Warm</h3><p>強く売り込まず、判断を助ける。</p></article><article><small>DO</small><h3>Evidence first</h3><p>具体例、根拠、利用者視点。</p></article><article><small>DON'T</small><h3>Fear or pressure</h3><p>過度な断定と不安訴求を避ける。</p></article></div></div>`;
  return `<div class="manager-board"><div class="manager-summary"><article><small>WORK</small><b>6</b><span>2 in progress</span></article><article><small>REVIEWS</small><b>3</b><span>Client decision</span></article><article><small>DEADLINE</small><b>28 Aug</b><span>27 days left</span></article></div><div class="dependency-map"><div>Research</div><i>→</i><div>AI Script</div><i>→</i><div>Video</div><i>→</i><div>Operations</div></div></div>`;
}

function scriptWorkspaceMarkup(result) {
  const script = result?.script;
  const scenes = script?.scenes || [];
  return `<div class="multi-script-board"><form id="scriptWorkspaceForm" class="script-brief-form"><div class="script-type-head"><div><small>SCRIPT TYPE</small><h2>制作する台本を選択</h2></div><button type="submit">Generate Script →</button></div><div class="script-type-grid"><label><input type="radio" name="scriptType" value="advertisement" ${result?.scriptType !== 'youtube_shooting' ? 'checked' : ''}><span><b>Advertisement Script</b><small>Hook · Benefit · Proof · CTA</small></span></label><label><input type="radio" name="scriptType" value="youtube_shooting" ${result?.scriptType === 'youtube_shooting' ? 'checked' : ''}><span><b>YouTube Shooting Script</b><small>Cold Open · A-roll · B-roll · Camera</small></span></label></div><div class="script-mode-row"><label>Creation Mode<select name="creationMode"><option value="auto">AI Auto Generate</option><option value="manual">Manual Draft + AI Structure</option></select></label><label>Duration / Platform<input name="productionSettings" placeholder="例：YouTube 8分 / 16:9 / Studio shooting"></label></div><label>Production Brief<textarea name="message" required placeholder="商品・テーマ、視聴者、目的、Tone、必須内容、CTAなどを入力してください。"></textarea></label><label>Manual Draft（Manual mode）<textarea name="manualDraft" placeholder="既存の台本を貼り付けると、内容を保持したまま構成・尺・撮影指示を整理します。"></textarea></label></form>${script ? `<section class="production-script-editor"><header><div><small>${escapeHtml(result.scriptType === 'youtube_shooting' ? 'YOUTUBE SHOOTING SCRIPT' : 'ADVERTISEMENT SCRIPT')}</small><h2 contenteditable="true" data-script-field="title">${escapeHtml(script.title)}</h2></div><button id="saveScriptEdits">Save Edits</button></header><div class="script-editor-meta"><article><small>HOOK / COLD OPEN</small><p contenteditable="true" data-script-field="hook">${escapeHtml(script.hook)}</p></article><article><small>CONCEPT</small><p contenteditable="true" data-script-field="concept">${escapeHtml(script.concept)}</p></article></div><div class="full-script-edit"><small>FULL SCRIPT</small><p contenteditable="true" data-script-field="fullScript">${escapeHtml(script.fullScript)}</p></div><div class="shooting-table-wrap"><table class="shooting-script-table"><thead><tr><th>Shot / Time</th><th>Visual / Dialogue</th><th>Production</th></tr></thead><tbody>${scenes.map((scene,index)=>`<tr data-scene-index="${index}"><td><b>${scene.number}</b><span contenteditable="true" data-scene-field="seconds">${escapeHtml(scene.seconds)}</span><em>${escapeHtml(scene.shotType || '')}</em></td><td><strong contenteditable="true" data-scene-field="visual">${escapeHtml(scene.visual)}</strong><p contenteditable="true" data-scene-field="narration">${escapeHtml(scene.narration)}</p><small contenteditable="true" data-scene-field="onScreenText">${escapeHtml(scene.onScreenText)}</small></td><td><p><b>Camera</b> <span contenteditable="true" data-scene-field="camera">${escapeHtml(scene.camera || '')}</span></p><p><b>Audio</b> <span contenteditable="true" data-scene-field="audio">${escapeHtml(scene.audio || '')}</span></p><p><b>Location</b> ${escapeHtml(scene.location || '')}</p><p><b>Cast / Props</b> ${escapeHtml(scene.cast || '')} · ${escapeHtml(scene.props || '')}</p></td></tr>`).join('')}</tbody></table></div></section>` : '<div class="script-workspace-empty"><span>✎</span><h3>Script Briefを入力してください</h3><p>AI Auto GenerateまたはManual Draftから、制作可能な台本を作成します。</p></div>'}</div>`;
}

function saveScriptWorkspaceEdits() {
  const latest = outputs[selectedProject]?.at(-1);
  if (!latest) return;
  document.querySelectorAll('[data-script-field]').forEach(element => { latest.script[element.dataset.scriptField] = element.textContent.trim(); });
  document.querySelectorAll('[data-scene-index]').forEach(row => {
    const scene = latest.script.scenes[Number(row.dataset.sceneIndex)];
    row.querySelectorAll('[data-scene-field]').forEach(element => { scene[element.dataset.sceneField] = element.textContent.trim(); });
  });
  saveOutputs();
  $('workspaceSaveStatus').textContent = '✓ Manual edits saved';
}

async function runScriptWorkspace() {
  const form = $('scriptWorkspaceForm');
  const node = nodes.find(item => item.id === activeWorkspaceNodeId);
  if (!form || !node) return;
  const data = Object.fromEntries(new FormData(form));
  data.message = `${data.message}\nProduction settings: ${data.productionSettings || 'Not specified'}`;
  $('runWorkspaceAgent').disabled = true;
  form.querySelector('button[type="submit"]').disabled = true;
  $('workspaceSaveStatus').textContent = '● Script Skills running...';
  try {
    const latestResearch = researchOutputs[selectedProject]?.at(-1) || null;
    const response = await fetch('/api/script', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ message:data.message, scriptType:data.scriptType, creationMode:data.creationMode, manualDraft:data.manualDraft, projectContext:buildProjectContext(), researchContext:latestResearch ? { marketInsight:latestResearch.marketInsight, strategy:latestResearch.strategy } : null }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || payload.error || 'Script generation failed.');
    outputs[selectedProject] ||= [];
    outputs[selectedProject].push(payload);
    saveOutputs();
    node.status = 'Completed'; node.progress = 100; node.detail = payload.script.title; saveProjectWorks();
    renderDeliveryWorkspace('script', node);
    $('workspaceSaveStatus').textContent = '✓ Script generated and saved';
  } catch (error) {
    $('workspaceSaveStatus').textContent = error.message;
  } finally {
    $('runWorkspaceAgent').disabled = false;
    const currentForm = $('scriptWorkspaceForm');
    if (currentForm) currentForm.querySelector('button[type="submit"]').disabled = false;
  }
}

function shadowWorkspaceMarkup(result) {
  {
    const riskOptionsJa = '<option value="unknown">未確認 / Unknown</option><option value="no">なし / No</option><option value="yes">あり / Yes</option>';
    return `<div class="audit-board"><form class="channel-audit-form" id="shadowAuditForm">
      <div class="audit-form-head"><div><small>TEGY · CHANNEL HEALTH / SEO</small><h3>YouTube チャンネル診断</h3><p>通常期間と直近データを比較し、直近50本・アカウントリスク・Search visibilityを監査します。</p></div><button type="submit">Run Full Audit →</button></div>
      <div class="audit-section-title"><b>01 · Distribution Signals</b><span>Traffic decline ≠ confirmed Shadow Ban</span></div>
      <div class="audit-input-grid"><label>Platform<select name="platform"><option>YouTube</option></select></label><label>Channel URL<input name="channelUrl" type="url" placeholder="https://..." /></label><label>Period<input name="period" value="Last 28 days" /></label><label>通常時 Impressions<input name="baselineImpressions" type="number" min="0" value="100000" /></label><label>直近 Impressions<input name="recentImpressions" type="number" min="0" value="65000" /></label><label>Recommendation traffic %<input name="recommendationTrafficPercent" type="number" min="0" max="100" step="0.1" value="18" /></label><label>Search traffic %<input name="searchTrafficPercent" type="number" min="0" max="100" step="0.1" value="6" /></label><label>CTR %<input name="clickThroughRate" type="number" min="0" max="100" step="0.1" value="4.2" /></label><label>Average retention %<input name="averageRetentionPercent" type="number" min="0" max="100" step="0.1" value="38" /></label><label>Stay to watch %<input name="stayToWatchPercent" type="number" min="0" max="100" step="0.1" placeholder="Shorts" /></label><label>Policy warnings<input name="policyWarnings" type="number" min="0" value="0" /></label></div>
      <div class="audit-section-title"><b>02 · Latest 50 Content Audit</b><span>TEGY internal review criteria</span></div>
      <div class="audit-input-grid"><label>サムネイル類似度 %<input name="thumbnailDuplicatePercent" type="number" min="0" max="100" placeholder="例：47" /></label><label>台本類似度 %<input name="scriptSimilarityPercent" type="number" min="0" max="100" placeholder="例：60" /></label><label>同一素材の使用回数 / 20本<input name="repeatedStockUsesIn20" type="number" min="0" /></label><label>Hashtags / Video<input name="hashtagsPerVideo" type="number" min="0" /></label><label>最大投稿数 / Day<input name="uploadsPerDay" type="number" min="0" /></label><label>一次情報・実写・肉声 %<input name="humanOriginalPercent" type="number" min="0" max="100" /></label></div>
      <label class="audit-notes">直近50本のContent / SEO Inventory<textarea name="recentContentNotes" placeholder="Title、Description、Keywords / Hashtags、公開日時、Analytics、素材やサムネイルの重複状況を貼り付けてください。"></textarea></label>
      <div class="audit-section-title"><b>03 · Account & Operation Risks</b><span>不明な項目は「未確認」のままにしてください</span></div>
      <div class="audit-risk-grid"><label>デフォルトAI音声の反復<select name="defaultAiVoice">${riskOptionsJa}</select></label><label>映像と台本の不一致<select name="semanticMismatch">${riskOptionsJa}</select></label><label>動画の一括削除<select name="bulkDeletion">${riskOptionsJa}</select></label><label>テーマ・名称・国の急な変更<select name="abruptChannelChanges">${riskOptionsJa}</select></label><label>Copyright / Content ID<select name="copyrightIssues">${riskOptionsJa}</select></label><label>苦情・Negative feedback<select name="negativeFeedback">${riskOptionsJa}</select></label><label>チャンネル情報の不足<select name="incompleteProfile">${riskOptionsJa}</select></label><label>電話番号・高度な機能の未認証<select name="verificationIncomplete">${riskOptionsJa}</select></label><label>管理者・関連アカウントの違反履歴<select name="linkedAccountHistory">${riskOptionsJa}</select></label></div>
      <label class="audit-notes">Platform Notice（ない場合は空欄）<textarea name="platformNotice" placeholder="YouTube Studio / Emailの警告、制限、申立て結果を原文のまま貼り付けてください。"></textarea></label>
    </form>${result ? shadowResultMarkup(result) : '<div class="audit-empty"><span>⬡</span><h3>Full Channel Auditを開始してください</h3><p>Signals、Content / SEO、Account risk、90-day workflow、Monitoringをまとめて出力します。不明点はNeeds dataとして表示されます。</p></div>'}</div>`;
  }
  const riskOptions = '<option value="unknown">未确认</option><option value="no">没有</option><option value="yes">有</option>';
  return `<div class="audit-board"><form class="channel-audit-form" id="shadowAuditForm"><div class="audit-form-head"><div><small>TEGY · CHANNEL HEALTH / SEO</small><h3>YouTube 频道诊断</h3><p>先比较正常期与近期数据，再审计直近 50 条内容、账号风险和搜索优化。</p></div><button type="submit">Run Full Audit →</button></div><div class="audit-section-title"><b>01 · Distribution signals</b><span>流量下降不等于 Shadow Ban</span></div><div class="audit-input-grid"><label>Platform<select name="platform"><option>YouTube</option></select></label><label>Channel URL<input name="channelUrl" type="url" placeholder="https://..." /></label><label>Period<input name="period" value="Last 28 days" /></label><label>通常 Impressions<input name="baselineImpressions" type="number" min="0" value="100000" /></label><label>直近 Impressions<input name="recentImpressions" type="number" min="0" value="65000" /></label><label>Recommendation traffic %<input name="recommendationTrafficPercent" type="number" min="0" max="100" step="0.1" value="18" /></label><label>Search traffic %<input name="searchTrafficPercent" type="number" min="0" max="100" step="0.1" value="6" /></label><label>CTR %<input name="clickThroughRate" type="number" min="0" max="100" step="0.1" value="4.2" /></label><label>Average retention %<input name="averageRetentionPercent" type="number" min="0" max="100" step="0.1" value="38" /></label><label>Stay to watch %<input name="stayToWatchPercent" type="number" min="0" max="100" step="0.1" placeholder="Shorts" /></label><label>Policy warnings<input name="policyWarnings" type="number" min="0" value="0" /></label></div><div class="audit-section-title"><b>02 · Latest 50 content audit</b><span>TEGY 内部复核指标，不是平台公开处罚线</span></div><div class="audit-input-grid"><label>缩略图相似度 %<input name="thumbnailDuplicatePercent" type="number" min="0" max="100" placeholder="例：47" /></label><label>脚本相似度 %<input name="scriptSimilarityPercent" type="number" min="0" max="100" placeholder="例：60" /></label><label>同素材重复次数 / 20条<input name="repeatedStockUsesIn20" type="number" min="0" /></label><label>每条 Hashtag 数<input name="hashtagsPerVideo" type="number" min="0" /></label><label>每日最高发布数<input name="uploadsPerDay" type="number" min="0" /></label><label>实拍/肉声/原创信息 %<input name="humanOriginalPercent" type="number" min="0" max="100" /></label></div><label class="audit-notes">直近 50 条内容与 SEO 清单<textarea name="recentContentNotes" placeholder="可粘贴：视频标题、说明、关键词/标签、主题、发布时间、观看数据、缩略图和素材重复情况…"></textarea></label><div class="audit-section-title"><b>03 · Account & operation risks</b><span>请选择已知事实，其余保持“未确认”</span></div><div class="audit-risk-grid"><label>默认 AI 音声反复使用<select name="defaultAiVoice">${riskOptions}</select></label><label>画面与脚本不相关<select name="semanticMismatch">${riskOptions}</select></label><label>大量删除视频<select name="bulkDeletion">${riskOptions}</select></label><label>主题/名称/国家突然变更<select name="abruptChannelChanges">${riskOptions}</select></label><label>版权 / Content ID 问题<select name="copyrightIssues">${riskOptions}</select></label><label>异常投诉/负面反馈<select name="negativeFeedback">${riskOptions}</select></label><label>频道资料不完整<select name="incompleteProfile">${riskOptions}</select></label><label>电话/高级功能未认证<select name="verificationIncomplete">${riskOptions}</select></label><label>管理员或关联账号有违规历史<select name="linkedAccountHistory">${riskOptions}</select></label></div><label class="audit-notes">平台明确通知（没有请留空）<textarea name="platformNotice" placeholder="请原样粘贴 YouTube Studio / Email 的限制、警告或申诉结果。"></textarea></label></form>${result ? shadowResultMarkup(result) : '<div class="audit-empty"><span>⬡</span><h3>等待 Full Channel Audit</h3><p>输出包含：检测依据、内容与 SEO 审计、可能原因、90 天恢复计划和持续监测。所有不确定内容都会标记为“需要验证”。</p></div>'}</div>`;
}

function shadowResultMarkup(result) {
  const diagnosis = result.diagnosis || {};
  const signals = result.signalAnalysis?.signals || [];
  const actions = diagnosis.actions || [];
  const causes = diagnosis.likelyCauses || [];
  const audit = result.contentAudit || {};
  const recoveryPlan = result.recoveryWorkflow?.phases || diagnosis.recoveryPlan || [];
  const score = Math.max(0, Math.min(100, Number(diagnosis.healthScore) || 0));
  const auditItems = [...(audit.technicalRisks || []), ...(audit.operationalRisks || [])];
  if (!auditItems.length) auditItems.push({ status:'needs-data', area:'Content / Operation Audit', evidence:'監査に必要な情報が不足しています。', recommendation:'直近50本のContent inventoryとAnalyticsを追加してください。' });
  if (!audit.seoGaps?.length) audit.seoGaps = ['Title、Description、Keywords、YouTube Search queriesを追加してください。'];
  return `<section class="audit-result"><div class="health-score"><div style="--score:${score * 3.6}deg"><strong>${score}</strong><span>/ 100</span></div><section><small>CHANNEL HEALTH</small><h3>${escapeHtml(diagnosis.riskLevel || 'Needs review')}</h3><p>${escapeHtml(diagnosis.diagnosis || '')}</p><span class="confidence">Confidence · ${escapeHtml(diagnosis.confidence || 'Limited')}</span></section></div><div class="shadow-ban-verdict ${diagnosis.confirmedRestriction ? 'confirmed' : ''}"><b>${diagnosis.confirmedRestriction ? 'Explicit restriction evidence found' : 'No confirmed Shadow Ban'}</b><p>${escapeHtml(diagnosis.disclaimer || 'Performance changes alone cannot confirm a platform restriction.')}</p></div><div class="signal-grid">${signals.map(signal => `<article><span class="${signal.status === 'healthy' ? 'good' : signal.status === 'critical' ? 'critical' : 'warn'}">● ${escapeHtml(signal.status)}</span><h3>${escapeHtml(signal.label)}</h3><b>${escapeHtml(signal.value)}${escapeHtml(signal.unit)}</b></article>`).join('')}</div><section class="audit-findings"><small>CONTENT / OPERATION AUDIT</small><div>${auditItems.map(item => `<article><span>${escapeHtml(item.status)}</span><b>${escapeHtml(item.area)}</b><p>${escapeHtml(item.evidence)}</p><em>${escapeHtml(item.recommendation)}</em></article>`).join('') || '<p>需要更多资料完成内容审计。</p>'}</div></section><section class="seo-findings"><small>SEO CHECK</small><ul>${(audit.seoGaps || []).map(item => `<li>${escapeHtml(item)}</li>`).join('') || '<li>请提供标题、说明、关键词与搜索查询数据。</li>'}</ul></section><section class="cause-section"><small>POSSIBLE CAUSES</small>${causes.map(cause => `<article><div><b>${escapeHtml(cause.cause)}</b><span>${escapeHtml(cause.likelihood)}</span></div><p>${escapeHtml(cause.evidence)}</p><em>Alternative: ${escapeHtml(cause.alternativeExplanation)}</em></article>`).join('')}</section><table class="action-table"><thead><tr><th>Priority</th><th>Recommended action</th><th>Reason</th><th>Success metric</th></tr></thead><tbody>${actions.map(action => `<tr><td>${escapeHtml(action.priority)}</td><td>${escapeHtml(action.action)}<small>${escapeHtml(action.owner)}</small></td><td>${escapeHtml(action.reason)}</td><td>${escapeHtml(action.successMetric)}</td></tr>`).join('')}</tbody></table><section class="recovery-roadmap"><small>90-DAY RECOVERY ROADMAP</small><div>${recoveryPlan.map(phase => `<article><span>${escapeHtml(phase.period)}</span><h3>${escapeHtml(phase.phase)}</h3><p>${escapeHtml(phase.objective)}</p><ul>${(phase.tasks || []).map(task => `<li>${escapeHtml(task)}</li>`).join('')}</ul><b>Exit · ${(phase.exitCriteria || []).map(escapeHtml).join(' / ')}</b></article>`).join('')}</div></section><section class="verification-plan"><div><small>VERIFICATION STEPS</small><ul>${(diagnosis.verificationSteps || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div><div><small>MONITORING METRICS</small><ul>${(diagnosis.monitoringMetrics || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div></section></section>`;
}

function closeFullWorkspace() {
  activeWorkspaceNodeId = null;
  fullWorkspace.classList.add('hidden');
  $('chatPanel').classList.remove('hidden');
}

async function runActiveWorkspaceAgent() {
  const node = nodes.find(item => item.id === activeWorkspaceNodeId);
  if (!node) return;
  const key = getWorkspaceKey(node);
  if (key === 'shadow') return runShadowAudit();
  if (key === 'script') return runScriptWorkspace();
  if (key !== 'research') {
    $('workspaceSaveStatus').textContent = key === 'script' ? 'AI Script は下部チャットから実行できます' : 'この Agent の実行コードは次の開発フェーズです';
    return;
  }
  const button = $('runWorkspaceAgent');
  button.disabled = true;
  $('workspaceSaveStatus').textContent = '● Research Agent 実行中...';
  node.status = 'In Progress'; node.progress = 55; saveProjectWorks();
  try {
    const response = await fetch('/api/research', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ projectContext:buildProjectContext(), researchBook:researchItems }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || payload.error || 'Research failed.');
    researchOutputs[selectedProject] ||= [];
    researchOutputs[selectedProject].push(payload);
    saveResearchOutputs();
    applyResearchOutput(payload);
    node.status = 'Completed'; node.progress = 100; saveProjectWorks();
    $('workspaceSaveStatus').textContent = '✓ Research Report を保存しました';
  } catch (error) {
    node.status = 'Needs attention'; node.progress = 0; saveProjectWorks();
    $('workspaceSaveStatus').textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function runShadowAudit() {
  const node = nodes.find(item => item.id === activeWorkspaceNodeId);
  const form = $('shadowAuditForm');
  if (!node || !form) return;
  const data = Object.fromEntries(new FormData(form));
  const numericFields = ['baselineImpressions','recentImpressions','recommendationTrafficPercent','searchTrafficPercent','clickThroughRate','averageRetentionPercent','stayToWatchPercent','policyWarnings','thumbnailDuplicatePercent','scriptSimilarityPercent','repeatedStockUsesIn20','hashtagsPerVideo','uploadsPerDay','humanOriginalPercent'];
  numericFields.forEach(field => { data[field] = Number(data[field] || 0); });
  const button = $('runWorkspaceAgent');
  button.disabled = true;
  form.querySelector('button[type="submit"]').disabled = true;
  $('workspaceSaveStatus').textContent = '● Channel signals を分析中...';
  node.status = 'In Progress'; node.progress = 55; saveProjectWorks();
  try {
    const response = await fetch('/api/shadow-ban', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ projectContext:buildProjectContext(), channelSnapshot:data }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || payload.error || 'Channel audit failed.');
    shadowOutputs[selectedProject] ||= [];
    shadowOutputs[selectedProject].push(payload);
    saveShadowOutputs();
    node.status = 'Completed'; node.progress = 100; node.detail = `${payload.diagnosis.riskLevel} · Health ${payload.diagnosis.healthScore}/100`; saveProjectWorks();
    $('workspaceSaveStatus').textContent = '✓ Channel Audit を保存しました';
    button.disabled = false;
    renderDeliveryWorkspace('shadow', node);
  } catch (error) {
    node.status = 'Needs attention'; node.progress = 0; saveProjectWorks();
    $('workspaceSaveStatus').textContent = error.message;
    button.disabled = false;
    form.querySelector('button[type="submit"]').disabled = false;
  }
}

function applyResearchOutput(result) {
  const sectionMap = [
    ['companyAndProduct', 0], ['marketAndTrends', 1], ['competitorAccounts', 2],
    ['paidAdvertising', 3], ['organicAndVideo', 4], ['platformAndPolicy', 5]
  ];
  sectionMap.forEach(([key,index]) => {
    const findings = result.landscape?.[key] || [];
    if (findings.length) researchItems[index].rows = findings.map(item => [item.topic, item.finding, item.sourceUrl || item.evidence, item.needsVerification ? 'Verify' : 'Ready']);
  });
  const market = result.marketInsight;
  if (market?.marketPersonas?.length) researchItems[6].rows = market.marketPersonas.map(persona => [persona.name, persona.needs.join(' / '), persona.context, persona.evidenceBasis.join(' / ')]).concat([['Primary Market Insight','',market.primaryMarketInsight,'Research Agent']]);
  if (result.strategy?.strategicDirections?.length) researchItems[7].rows = result.strategy.strategicDirections.map(item => [String(item.priority), item.direction, item.rationale, item.recommendedWork]);
  saveResearchBook();
  renderResearchBook();
}

function renderResearchBook() {
  $('researchSections').innerHTML = researchItems.map((item,index) => `<button class="${index === activeResearchIndex ? 'active' : ''}" data-research-section="${index}"><span>${String(index + 1).padStart(2,'0')}</span>${escapeHtml(item.title)}</button>`).join('');
  document.querySelectorAll('[data-research-section]').forEach(button => { button.onclick = () => { activeResearchIndex = Number(button.dataset.researchSection); renderResearchBook(); }; });
  const item = researchItems[activeResearchIndex];
  $('researchPageKicker').textContent = item.kicker;
  $('researchPageTitle').textContent = item.title;
  $('researchPageDescription').textContent = item.description;
  $('researchInsightTitle').textContent = item.title;
  $('researchInsightCopy').textContent = item.insight;
  $('researchTableHead').innerHTML = `<tr>${item.columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}<th></th></tr>`;
  $('researchTableBody').innerHTML = item.rows.map((row,rowIndex) => `<tr>${row.map((cell,columnIndex) => `<td contenteditable="true" data-row="${rowIndex}" data-column="${columnIndex}">${escapeHtml(cell)}</td>`).join('')}<td><button data-delete-row="${rowIndex}" aria-label="Delete row">×</button></td></tr>`).join('');
  document.querySelectorAll('#researchTableBody [contenteditable]').forEach(cell => { cell.onblur = () => { item.rows[Number(cell.dataset.row)][Number(cell.dataset.column)] = cell.textContent.trim(); saveResearchBook(); }; });
  document.querySelectorAll('[data-delete-row]').forEach(button => { button.onclick = () => { item.rows.splice(Number(button.dataset.deleteRow),1); saveResearchBook(); renderResearchBook(); }; });
}

function addResearchRow() {
  researchItems[activeResearchIndex].rows.push(researchItems[activeResearchIndex].columns.map(() => ''));
  saveResearchBook();
  renderResearchBook();
}

function addResearchSection() {
  const title = prompt('追加する調査項目名を入力してください');
  if (!title) return;
  researchItems.push({ title, kicker: `${String(researchItems.length + 1).padStart(2,'0')} · CUSTOM`, description: 'この Project のために追加した自由調査項目です。', insight: '必要な項目と参考情報を自由に追加できます。', columns: ['Research item','Finding','Source / URL','Notes'], rows: [['','','','']] });
  saveResearchBook();
  activeResearchIndex = researchItems.length - 1;
  renderResearchBook();
}

function closeInspector() {
  selectedNode = null;
  app.classList.remove('inspector-open');
  inspector.classList.add('hidden');
  $('workActionMenu').classList.add('hidden');
  nodeLayer.querySelectorAll('.node.selected').forEach(element => element.classList.remove('selected'));
}

function toggleWorkMenu() {
  if (!selectedNode) return;
  $('workActionMenu').classList.toggle('hidden');
  $('deleteWork').disabled = selectedNode === 'pm';
}

function renameSelectedWork() {
  const node = nodes.find(item => item.id === selectedNode);
  if (!node || node.id === 'pm') return;
  const name = prompt('Work name', node.name);
  if (!name?.trim()) return;
  node.name = name.trim();
  saveProjectWorks();
  renderNodes();
  selectNode(node.id);
  $('workActionMenu').classList.add('hidden');
}

function duplicateSelectedWork() {
  const node = nodes.find(item => item.id === selectedNode);
  if (!node || node.id === 'pm') return;
  const copy = structuredClone(node);
  copy.id = `n${Date.now()}`;
  copy.name = `${node.name} Copy`;
  copy.x = Math.min(72, node.x + 5);
  copy.y = Math.min(72, node.y + 7);
  copy.status = 'Ready';
  copy.progress = 0;
  nodes.push(copy);
  saveProjectWorks();
  renderNodes();
  selectNode(copy.id);
  $('workActionMenu').classList.add('hidden');
}

function deleteSelectedWork() {
  const node = nodes.find(item => item.id === selectedNode);
  if (!node || node.id === 'pm') return;
  if (!confirm(`「${node.name}」をこのProjectから削除しますか？`)) return;
  nodes = nodes.filter(item => item.id !== node.id);
  saveProjectWorks();
  closeInspector();
  renderNodes();
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
  const map = { 'Research Agent': ['◎', 'mint-bg'], 'Script Agent': ['✎', 'cyan-bg'], 'Animation Agent': ['▷', 'pink-bg'], 'ShadowBan Agent': ['⬡', 'orange-bg'], 'Video Agent': ['▧', 'pink-bg'], 'Operations Agent': ['⌘', 'mint-bg'] };
  const [icon, cls] = map[name] || ['✦', 'cyan-bg'];
  const newWork = { id: `n${Date.now()}`, name, icon, cls, x: 38 + Math.random() * 28, y: 45 + Math.random() * 22, status: 'Ready', type: 'progress', detail: '新しいWorkを追加しました', progress: 0 };
  nodes.push(newWork);
  saveProjectWorks();
  renderNodes();
  openFullWorkspace(newWork.id);
}

function revealAddWork() {
  if (!selectedProject) {
    alert('先从左侧选择一个 Project，再添加 Work。');
    return;
  }
  const library = document.querySelector('.agent-list');
  library.classList.remove('attention');
  requestAnimationFrame(() => library.classList.add('attention'));
  setTimeout(() => library.classList.remove('attention'), 1200);
}

function updateScriptNode(status, type, detail, progress) {
  const node = nodes.find(item => item.id === 'script');
  if (!node) return;
  Object.assign(node, { status, type, detail, progress });
  saveProjectWorks();
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
    const latestResearch = researchOutputs[selectedProject]?.at(-1) || null;
    const response = await fetch('/api/script', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, projectContext: buildProjectContext(), researchContext: latestResearch ? { marketInsight: latestResearch.marketInsight, strategy: latestResearch.strategy } : null }) });
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
$('workMenuButton').onclick = toggleWorkMenu;
$('renameWork').onclick = renameSelectedWork;
$('duplicateWork').onclick = duplicateSelectedWork;
$('deleteWork').onclick = deleteSelectedWork;
$('closeWorkspace').onclick = closeFullWorkspace;
$('closeWorkspaceX').onclick = closeFullWorkspace;
$('runWorkspaceAgent').onclick = runActiveWorkspaceAgent;
$('openWorkspaceBtn').onclick = () => selectedNode && openFullWorkspace(selectedNode);
$('addResearchRow').onclick = addResearchRow;
$('addResearchSection').onclick = addResearchSection;
$('googleAccountBtn').onclick = () => $('googleLoginDialog').showModal();
$('closeGoogleDialog').onclick = () => $('googleLoginDialog').close();
$('googleSigninPreview').onclick = () => alert('Google Workspace 認証は UI 定稿後に接続します。');
$('globalSearch').onfocus = event => renderProjectSearch(event.target.value);
$('globalSearch').oninput = event => renderProjectSearch(event.target.value);
$('globalSearch').onkeydown = event => { if (event.key === 'Escape') { closeProjectSearch(); event.target.blur(); } };
document.addEventListener('click', event => { if (!event.target.closest('.search')) $('searchResults').classList.add('hidden'); });
document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('globalSearch').focus(); } });
$('newProjectBtn').onclick = createProject;
$('quickAdd').onclick = revealAddWork;
document.querySelectorAll('[data-add-agent]').forEach(button => { button.onclick = () => addAgent(button.dataset.addAgent); });
document.querySelectorAll('#inspectorTabs button').forEach(button => { button.onclick = () => showTab(button.dataset.tab); });
$('chatForm').onsubmit = submitChat;
window.addEventListener('resize', drawConnections);
canvas.onclick = () => closeInspector();
renderProjects();
showWelcome();
