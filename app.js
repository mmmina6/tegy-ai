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
  closeInspector();
  fullWorkspace.classList.remove('hidden');
  $('chatPanel').classList.add('hidden');
  $('fullWorkspaceTitle').textContent = `${node.name} Workspace`;
  $('fullWorkspaceIcon').textContent = node.icon;
  $('fullWorkspaceIcon').className = `workspace-agent-icon ${node.cls}`;
  const workspaceKey = getWorkspaceKey(node);
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
}

function deliveryCenterMarkup(type) {
  if (type === 'animation') return `<div class="animation-director"><div class="director-toolbar"><button class="active">All Assets</button><button>Characters</button><button>Scenes</button><button>References</button><button class="create-asset">＋ Create Asset</button></div><div class="animation-hero"><div><small>DIRECTOR'S BOARD</small><h2>Good afternoon, director!</h2><p>まず世界観とキャラクターを固定して、シーンとショットを組み立てます。</p></div><div class="play-orb">▷</div></div><h3>Style & Character Assets</h3><div class="asset-grid"><article class="asset-card character"><div><span>CHARACTER</span><b>Hero Character</b></div></article><article class="asset-card style"><div><span>STYLE</span><b>Soft 3D / Warm light</b></div></article><article class="asset-card scene"><div><span>SCENE</span><b>Morning Interior</b></div></article></div><div class="shot-board"><div><h3>Scene 01 · Opening</h3><span>3 shots · 8 sec</span></div><div class="shot-strip"><article><b>01</b><p>Establishing shot</p><span>00:00–00:02</span></article><article><b>02</b><p>Character close-up</p><span>00:02–00:05</span></article><article><b>03</b><p>Product reveal</p><span>00:05–00:08</span></article><button>＋</button></div></div></div>`;
  if (type === 'script') return `<div class="persona-board"><section><small>CAMPAIGN INPUT</small><h3>Target & Requirement</h3><div class="editable-box">30〜40代の働く女性。安心感があり、押しつけない30秒広告。</div></section><section class="persona-results"><small>CAMPAIGN PERSONA</small><div><article><span>Persona A · Selected</span><h3>忙しい比較検討層</h3><p>情報は欲しいが、営業的な表現を避けたい。</p><dl><dt>Pain</dt><dd>判断材料が多く、信頼できる違いが見えない</dd><dt>Trigger</dt><dd>具体例と透明な説明</dd></dl></article><article><span>Persona B</span><h3>慎重な初回検討層</h3><p>失敗への不安が大きく、まず安心材料を探す。</p><dl><dt>Pain</dt><dd>自分に合うか分からない</dd><dt>Trigger</dt><dd>第三者視点と利用の流れ</dd></dl></article></div></section><section class="script-editor"><small>HOOK & SCRIPT</small><blockquote>「ちゃんと選びたい。でも、何を信じればいい？」</blockquote><p contenteditable="true">Scene 1 — 日常の迷いを提示<br>Scene 2 — 商品が解決する具体的な理由<br>Scene 3 — 信頼材料と自然な CTA</p></section></div>`;
  if (type === 'shadow') return `<div class="audit-board"><div class="health-score"><div><strong>78</strong><span>/ 100</span></div><section><small>CHANNEL HEALTH</small><h3>Generally healthy</h3><p>重大な制限シグナルはありません。検索流入と投稿頻度に改善余地があります。</p></section></div><div class="signal-grid"><article><span class="good">● Healthy</span><h3>Recommendation reach</h3><b>+12.4%</b></article><article><span class="warn">● Review</span><h3>Search visibility</h3><b>-8.1%</b></article><article><span class="good">● Healthy</span><h3>Audience retention</h3><b>42.6%</b></article></div><table class="action-table"><thead><tr><th>Priority</th><th>Finding</th><th>Recommended action</th><th>Owner</th></tr></thead><tbody><tr><td>P1</td><td>検索キーワードとの不一致</td><td>Title と Description を再設計</td><td>SEO</td></tr><tr><td>P2</td><td>投稿間隔が不安定</td><td>週次公開スロットを固定</td><td>Operations</td></tr></tbody></table></div>`;
  if (type === 'video') return `<div class="video-board"><div class="video-preview"><button>▷</button><span>00:00 / 00:30</span></div><div class="video-meta"><section><small>REFERENCE ANALYSIS</small><h3>Hook → Proof → CTA</h3><p>最初の3秒、画面変化、字幕密度、CTA の構造を参考動画から抽出。</p></section><section><small>REVIEW STATUS</small><h3>Rough Cut v03</h3><p>2 comments waiting · Mina Rho</p></section></div><div class="timeline"><b>V1</b><i></i><i></i><i></i><b>A1</b><i></i><i></i></div></div>`;
  if (type === 'operations') return `<div class="operations-board"><div class="calendar-head"><button>←</button><h2>August 2026</h2><button>→</button><span>＋ New Post</span></div><div class="content-calendar">${['MON 3','TUE 4','WED 5','THU 6','FRI 7'].map((day,index)=>`<article><b>${day}</b>${index===1?'<div class="post youtube">YouTube<br><span>How-to video · 18:00</span></div>':''}${index===3?'<div class="post instagram">Instagram<br><span>Reels · Approved</span></div>':''}</article>`).join('')}</div><div class="performance-row"><article><small>VIEWS</small><b>128.4K</b><span>↑ 18%</span></article><article><small>ENGAGEMENT</small><b>6.8%</b><span>↑ 1.2%</span></article><article><small>LEADS</small><b>342</b><span>↑ 24%</span></article></div></div>`;
  if (type === 'brand') return `<div class="brand-board"><div class="brand-hero"><span>BRAND ESSENCE</span><h2>Trust that feels human.</h2><p>専門性を、生活者が理解できる言葉と温度で届ける。</p></div><div class="brand-grid"><article><small>POSITIONING</small><h3>Clear expertise</h3><p>複雑な情報を透明で分かりやすく。</p></article><article><small>TONE OF VOICE</small><h3>Calm · Honest · Warm</h3><p>強く売り込まず、判断を助ける。</p></article><article><small>DO</small><h3>Evidence first</h3><p>具体例、根拠、利用者視点。</p></article><article><small>DON'T</small><h3>Fear or pressure</h3><p>過度な断定と不安訴求を避ける。</p></article></div></div>`;
  return `<div class="manager-board"><div class="manager-summary"><article><small>WORK</small><b>6</b><span>2 in progress</span></article><article><small>REVIEWS</small><b>3</b><span>Client decision</span></article><article><small>DEADLINE</small><b>28 Aug</b><span>27 days left</span></article></div><div class="dependency-map"><div>Research</div><i>→</i><div>AI Script</div><i>→</i><div>Video</div><i>→</i><div>Operations</div></div></div>`;
}

function closeFullWorkspace() {
  fullWorkspace.classList.add('hidden');
  $('chatPanel').classList.remove('hidden');
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
$('workMenuButton').onclick = toggleWorkMenu;
$('renameWork').onclick = renameSelectedWork;
$('duplicateWork').onclick = duplicateSelectedWork;
$('deleteWork').onclick = deleteSelectedWork;
$('closeWorkspace').onclick = closeFullWorkspace;
$('closeWorkspaceX').onclick = closeFullWorkspace;
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
