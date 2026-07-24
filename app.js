const projects=[
  {id:'azabu',name:'日本インプラント',sub:'Japan Implant',mark:'日'},
  {id:'imai',name:'明治安田生命',sub:'Meijiyasuda Seimei',mark:'明'},
  {id:'tegy',name:'TEGY',sub:'Internal Project',mark:'T'},
  {id:'demo',name:'Demo Project',sub:'Test & Explore',mark:'D'}
];
const baseNodes=[
  {id:'pm',name:'AI Project Manager',icon:'✦',cls:'pm',x:36,y:6,status:'Thinking...',type:'progress',detail:'プロジェクトを推進中です',progress:55},
  {id:'brand',name:'Brand Agent',icon:'◇',cls:'mint-bg',x:10,y:35,status:'Completed',type:'done',detail:'ブランド分析完了',progress:100},
  {id:'script',name:'Script Agent',icon:'✎',cls:'cyan-bg',x:40,y:34,status:'In Progress',type:'progress',detail:'YouTube用スクリプト生成中...',progress:65},
  {id:'animation',name:'Animation Agent',icon:'▷',cls:'pink-bg',x:69,y:35,status:'Waiting',type:'waiting',detail:'スクリプト完了後に開始',progress:0},
  {id:'shadow',name:'ShadowBan Agent',icon:'⬡',cls:'orange-bg',x:51,y:67,status:'Ready',type:'progress',detail:'YouTubeチャンネル分析準備完了',progress:0}
];
let selectedProject=null;let nodes=[];let selectedNode=null;
const app=document.getElementById('app'),sidebar=document.getElementById('sidebar'),welcome=document.getElementById('welcomeScreen'),canvas=document.getElementById('canvasScreen'),inspector=document.getElementById('inspector'),nodeLayer=document.getElementById('nodeLayer'),connections=document.getElementById('connections');
function renderProjects(){
  document.getElementById('projectList').innerHTML=projects.map(p=>`<button class="project-card ${selectedProject===p.id?'active':''}" data-project="${p.id}"><span class="project-icon">${p.mark}</span><span><strong>${p.name}</strong><small>${p.sub}</small></span><span>•••</span></button>`).join('');
  document.getElementById('collapsedProjects').innerHTML=projects.map(p=>`<button class="${selectedProject===p.id?'active':''}" data-project="${p.id}" title="${p.name}">${p.mark}</button>`).join('')+`<button id="collapsedAdd">＋</button>`;
  document.querySelectorAll('[data-project]').forEach(b=>b.onclick=()=>openProject(b.dataset.project));
  const ca=document.getElementById('collapsedAdd');if(ca)ca.onclick=createProject;
}
function openProject(id){
  selectedProject=id;
  nodes=structuredClone(baseNodes);
  app.classList.remove('sidebar-hidden');
  welcome.classList.add('hidden');
  canvas.classList.remove('hidden');
  renderProjects();
  const p=projects.find(x=>x.id===id);
  document.getElementById('breadcrumbs').innerHTML=`<strong>${p.name}</strong><span class="active-project-pill">● Active Project</span><span class="project-subline">› YouTube Organic 広告制作プロジェクト　✎</span>`;
  document.getElementById('chatTitle').textContent='AIに指示を出すか、質問してください...';
  document.getElementById('chatSubtitle').textContent='このプロジェクトで次に行うことを伝えてください。';
  renderNodes();
  requestAnimationFrame(()=>selectNode('script'));
}
function showWelcome(){
  selectedProject=null;
  app.classList.add('sidebar-hidden');
  welcome.classList.remove('hidden');
  canvas.classList.add('hidden');
  closeInspector();
  document.getElementById('breadcrumbs').innerHTML='';
  document.getElementById('chatTitle').textContent='こんにちは、Minaさん 👋';
  document.getElementById('chatSubtitle').textContent='今日は何を創りましょうか？';
  renderProjects();
}
function renderNodes(){nodeLayer.innerHTML='';nodes.forEach(n=>{const el=document.createElement('article');el.className='node'+(selectedNode===n.id?' selected':'');el.dataset.id=n.id;el.style.left=n.x+'%';el.style.top=n.y+'%';el.innerHTML=`<div class="node-head"><div class="node-icon ${n.cls}">${n.icon}</div><div><h3>${n.name}</h3><span class="node-status ${n.type}">● ${n.status}</span></div></div><p>${n.detail}</p>${n.progress?`<div class="node-progress"><span style="width:${n.progress}%"></span></div>`:''}`;el.onclick=e=>{e.stopPropagation();selectNode(n.id)};enableDrag(el,n);nodeLayer.appendChild(el)});requestAnimationFrame(drawConnections)}
function enableDrag(el,n){let down=false,sx=0,sy=0,ox=0,oy=0;el.onpointerdown=e=>{if(e.button!==0)return;down=true;sx=e.clientX;sy=e.clientY;ox=el.offsetLeft;oy=el.offsetTop;el.setPointerCapture(e.pointerId)};el.onpointermove=e=>{if(!down)return;const maxX=nodeLayer.clientWidth-el.offsetWidth,maxY=nodeLayer.clientHeight-el.offsetHeight;const x=Math.max(0,Math.min(maxX,ox+e.clientX-sx)),y=Math.max(0,Math.min(maxY,oy+e.clientY-sy));el.style.left=x+'px';el.style.top=y+'px';n.x=x/nodeLayer.clientWidth*100;n.y=y/nodeLayer.clientHeight*100;drawConnections()};el.onpointerup=()=>down=false}
function drawConnections(){connections.innerHTML='';const pairs=[['pm','brand','#56d9aa'],['pm','script','#4f83ff'],['pm','animation','#f34eb4'],['brand','script','#4bcdb2'],['script','animation','#f15fb7'],['script','shadow','#ff8b36']];const cRect=canvas.getBoundingClientRect();pairs.forEach(([a,b,color])=>{const A=nodeLayer.querySelector(`[data-id="${a}"]`),B=nodeLayer.querySelector(`[data-id="${b}"]`);if(!A||!B)return;const ar=A.getBoundingClientRect(),br=B.getBoundingClientRect();const x1=ar.left+ar.width/2-cRect.left,y1=ar.top+ar.height/2-cRect.top,x2=br.left+br.width/2-cRect.left,y2=br.top+br.height/2-cRect.top;const dx=Math.max(60,Math.abs(x2-x1)*.48);connections.insertAdjacentHTML('beforeend',`<path d="M${x1} ${y1} C${x1+dx} ${y1},${x2-dx} ${y2},${x2} ${y2}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>`)})}
function selectNode(id){selectedNode=id;const n=nodes.find(x=>x.id===id);app.classList.add('inspector-open');inspector.classList.remove('hidden');document.getElementById('inspectorTitle').textContent=n.name;document.getElementById('inspectorAgentName').textContent=n.name;document.getElementById('progressText').textContent=(n.progress||0)+'%';document.getElementById('progressBar').style.width=(n.progress||0)+'%';renderNodes()}
function closeInspector(){selectedNode=null;app.classList.remove('inspector-open');inspector.classList.add('hidden');if(nodes.length)renderNodes()}
function createProject(){const name=prompt('新しいプロジェクト名を入力してください');if(!name)return;const id='p'+Date.now();projects.push({id,name,sub:'New Project',mark:name.trim().charAt(0)||'＋'});renderProjects();openProject(id)}
function addAgent(name){if(!selectedProject)return;const map={'Brand Agent':['◇','mint-bg'],'Script Agent':['✎','cyan-bg'],'Animation Agent':['▷','pink-bg'],'ShadowBan Agent':['⬡','orange-bg'],'Image Agent':['▧','violet']};const [icon,cls]=map[name]||['✦','cyan-bg'];nodes.push({id:'n'+Date.now(),name,icon,cls:cls==='violet'?'pink-bg':cls,x:38+Math.random()*28,y:45+Math.random()*22,status:'Ready',type:'progress',detail:'新しいAgentを追加しました',progress:0});renderNodes()}
document.getElementById('menuButton').onclick=()=>app.classList.toggle('sidebar-hidden');document.getElementById('closeInspector').onclick=closeInspector;document.getElementById('newProjectBtn').onclick=createProject;document.getElementById('quickAdd').onclick=()=>selectedProject?addAgent('Image Agent'):createProject();document.getElementById('floatingAdd').onclick=()=>addAgent('Image Agent');document.querySelectorAll('[data-add-agent]').forEach(b=>b.onclick=()=>addAgent(b.dataset.addAgent));document.getElementById('chatForm').onsubmit=e=>{e.preventDefault();const input=document.getElementById('chatInput');if(!input.value.trim())return;if(!selectedProject)openProject('azabu');else addAgent(input.value.includes('アニメ')?'Animation Agent':input.value.includes('シャド')?'ShadowBan Agent':'Script Agent');input.value=''};window.addEventListener('resize',drawConnections);canvas.onclick=()=>{selectedNode=null;closeInspector()};renderProjects();showWelcome();
