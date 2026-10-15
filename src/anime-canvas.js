export function scriptScenes(result) {
  const scenes=result?.script?.scenes || result?.scenes || [];
  return scenes.map((scene,index)=>({title:scene.title || `Scene ${index+1}`,visual:scene.visual || scene.description || '',narration:scene.narration || scene.dialogue || '',seconds:String(scene.seconds || scene.duration || '')}));
}

// Interaction preview: scoped by Project AND Work. It never calls a model API.
export function mountAnimeCanvas(root,{projectId,workId,projectName,scripts=[],onVoice=()=>{}}) {
  const key=`tegy-anime-canvas-preview:${projectId}:${workId}`;
  let state;
  try{state=JSON.parse(localStorage.getItem(key) || 'null');}catch{}
  state=state && Array.isArray(state.cards) ? state : {cards:[],notes:[],view:{x:40,y:36,zoom:1}};
  let active=null,uploadTarget=null,drag=null,operation=null;
  const urls=new Set();
  const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
  const button=(text,action,cls='')=>{const node=el('button',cls,text);node.type='button';node.onclick=action;return node;};
  root.replaceChildren();root.classList.add('anime-canvas-host');
  const shell=el('section','anime-canvas-shell');root.append(shell);
  const toolbar=el('header','anime-canvas-toolbar');shell.append(toolbar);
  const title=el('div');title.append(el('small','','ANIME · CREATIVE CANVAS'),el('strong','',projectName || 'Anime Studio'));toolbar.append(title);
  const tools=el('div','anime-canvas-tools');toolbar.append(tools);
  const stage=el('div','anime-canvas-stage');stage.tabIndex=0;stage.setAttribute('aria-label','制作画布。背景をドラッグして移動、CtrlまたはCommandとホイールで拡大縮小');shell.append(stage);
  const plane=el('div','anime-canvas-plane');stage.append(plane);
  const empty=el('div','anime-canvas-empty');empty.append(el('span','','✦'),el('h2','','ここから、作品をつなげる。'),el('p','','ProjectのScriptを取り込み、シーンごとに画像と動画を並べます。'),el('small','','素材の持ち込みからも始められます。'));stage.append(empty);
  const saveLabel=el('span','anime-canvas-save','');
  const status=el('p','anime-canvas-status','UIプレビュー · 生成APIの呼び出しなし／保存はこのブラウザのみ');status.setAttribute('role','status');shell.append(status);
  const dock=el('section','anime-canvas-dock');shell.append(dock);
  dock.hidden=true;
  const contextHeading=el('div','anime-canvas-context-heading');dock.append(contextHeading);
  const actions=el('div','anime-canvas-actions');empty.append(actions);
  const contextActions=el('div','anime-canvas-context-actions');dock.append(contextActions);
  const file=el('input');file.type='file';file.hidden=true;file.multiple=true;file.accept='image/*,video/*';shell.append(file);
  function upload(kind,card=null){uploadTarget=card;file.accept=kind==='image'?'image/*':kind==='video'?'video/*':'image/*,video/*';file.click();}
  tools.append(button('＋ 追加',()=>{active=null;dock.hidden=true;empty.hidden=!empty.hidden;}),button('整列',arrange),saveLabel);
  actions.append(button('Scriptを取り込む',chooseScript),button('↑ 素材をアップロード',()=>upload('all')),button('▧ 画像を生成',()=>{active=null;openSettings('image');}),button('▷ 動画を生成',()=>{active=null;openSettings('video');}));
  const composer=el('form','anime-canvas-composer');composer.hidden=true;
  const prompt=el('textarea');prompt.rows=2;prompt.setAttribute('aria-label','選択した素材への演出指示');
  const settings=el('div','anime-canvas-settings');composer.append(settings);
  function selectField(label,options){const wrapper=el('label','',label);const select=el('select');select.setAttribute('aria-label',label);for(const value of options)select.append(el('option','',value));wrapper.append(select);settings.append(wrapper);return select;}
  const style=selectField('画風',['元の画風を保つ','2D Anime','Japanese Line Manga','Cinematic 3D','Chibi / SD']);
  const template=selectField('演出テンプレート',['自然な動き','ゆっくりズーム','横にパン','表情の変化','自由に指定']);
  const ratio=selectField('サイズ',['元の比率','9:16','16:9','1:1']);
  const seconds=selectField('長さ',['5秒','8秒','10秒']);
  const entry=el('div','anime-canvas-prompt-entry');entry.append(prompt,button('🎙',()=>onVoice(prompt),'voice'));composer.append(entry);
  const submit=Object.assign(el('button','primary','制作プランを画布に追加 →'),{type:'submit'});composer.append(el('small','anime-canvas-preview-only','UI確認用：生成は実行せず、設定した制作プランを追加します。'),submit);dock.append(composer);
  function selectCard(card){active=card;operation=null;composer.hidden=true;dock.hidden=false;refreshSelection();renderContext();}
  function refreshSelection(){for(const node of plane.querySelectorAll('[data-card-id]'))node.classList.toggle('selected',node.dataset.cardId===active?.id);}
  function renderContext(){contextHeading.replaceChildren();contextActions.replaceChildren();
    contextHeading.append(el('strong','',active ? `${active.fileName || active.title} を選択中` : '新しい制作'),button('×',()=>{active=null;operation=null;dock.hidden=true;refreshSelection();}));
    if(!active)return;
    if(active.type==='image'){
      contextActions.append(el('span','',active.url?'次に、この画像をどう使いますか？':'画像を生成するか、既存素材を選択してください。'),button('▷ この画像を動画に',()=>openSettings('image-to-video'),'primary'),button('画像を編集',()=>openSettings('edit-image')),button('キャラクター参照',()=>setReference('キャラクター')),button('画風参照',()=>setReference('画風')));
    }else if(active.type==='video'){
      contextActions.append(el('span','','次に、この動画をどう使いますか？'),button('動画の演出を変更',()=>openSettings('edit-video')),button('参照動画にする',()=>setReference('動画')));
    }else{
      contextActions.append(el('span','','このシーンから制作を進めます。'),button('▧ このシーンの画像を作る',()=>openSettings('scene-image'),'primary'));
    }
  }
  function setReference(role){active.referenceRole=role;save();render();renderContext();status.textContent=`${role}参照として指定しました。次の制作プランで参照できます（生成連携は未接続）。`;}
  function openSettings(action){operation=action;dock.hidden=false;composer.hidden=false;renderContext();const needsImage=action==='image-to-video' || action==='edit-image';const needsVideo=action==='edit-video';
    const missing=(needsImage || needsVideo) && !active?.url;
    submit.disabled=missing;
    prompt.value=active?.plan?.prompt || '';
    prompt.placeholder=action==='image-to-video'?'例：人物がゆっくり顔を上げる。カメラは固定。':action==='scene-image'?'Scriptの内容を補足する演出・構図を指定…':'作りたい画面や変更したい点を指定…';
    seconds.parentElement.hidden=!action.includes('video');
    if(missing)contextActions.append(el('small','anime-canvas-missing','先に参照素材を選択してください。'),button('素材を選ぶ',()=>upload(needsVideo?'video':'image',active)));
    status.textContent=missing?'参照ファイルが必要です。素材を選ぶと設定を進められます。':'画風・テンプレート・サイズを確認して、制作プランを追加できます。';
  }
  composer.onsubmit=event=>{event.preventDefault();if(!operation || submit.disabled)return;const source=active;const type=operation.includes('video')?'video':'image';const plan={operation,sourceId:source?.id || null,prompt:prompt.value.trim(),style:style.value,template:template.value,ratio:ratio.value,seconds:type==='video'?seconds.value:null,referenceIds:state.cards.filter(card=>card.referenceRole).map(card=>card.id)};const card=addCard(type,{title:type==='video'?'動画制作プラン':'画像制作プラン',sourceId:source?.id,planned:true,plan,x:source?source.x+340:40,y:source?source.y:40});active=card;composer.hidden=true;render();renderContext();centerCard(card);status.textContent='制作プランを追加しました。これは生成結果ではありません。API接続後に生成する設定です。';};
  function centerCard(card){state.view.zoom=.9;state.view.x=stage.clientWidth/2-(card.x+140)*.9;state.view.y=90-card.y*.9;transform();save();}
  const zoom=el('div','anime-canvas-zoom');shell.append(zoom);const zoomLabel=el('span');
  zoom.append(button('−',()=>setZoom(state.view.zoom-.1)),zoomLabel,button('＋',()=>setZoom(state.view.zoom+.1)),button('全体',fit));
  function save(){try{const snapshot={...state,cards:state.cards.map(({url,...card})=>card)};localStorage.setItem(key,JSON.stringify(snapshot));saveLabel.textContent='本機プレビュー保存済み';}catch{saveLabel.textContent='保存できません・画面を閉じる前に確認';}}
  function transform(){plane.style.transform=`translate(${state.view.x}px,${state.view.y}px) scale(${state.view.zoom})`;zoomLabel.textContent=`${Math.round(state.view.zoom*100)}%`;}
  function setZoom(value){const old=state.view.zoom,next=Math.min(1.6,Math.max(.25,value));const cx=stage.clientWidth/2,cy=stage.clientHeight/2;state.view.x=cx-(cx-state.view.x)*next/old;state.view.y=cy-(cy-state.view.y)*next/old;state.view.zoom=next;transform();save();}
  function fit(){if(!state.cards.length){state.view={x:40,y:36,zoom:1};}else{const minX=Math.min(...state.cards.map(c=>c.x)),minY=Math.min(...state.cards.map(c=>c.y)),maxX=Math.max(...state.cards.map(c=>c.x+280)),maxY=Math.max(...state.cards.map(c=>c.y+300));const z=Math.max(.25,Math.min(1,(stage.clientWidth-64)/(maxX-minX),(stage.clientHeight-64)/(maxY-minY)));state.view={zoom:z,x:32-minX*z,y:32-minY*z};}transform();save();}
  function addCard(type,extra={}){const card={id:crypto.randomUUID(),type,title:type==='image'?'画像':type==='video'?'動画':'制作メモ',x:(120-state.view.x)/state.view.zoom,y:(100-state.view.y)/state.view.zoom,...extra};state.cards.push(card);render();save();return card;}
  function arrange(){const rows=new Map();let row=0;for(const card of state.cards){const group=card.scene || card.id;if(!rows.has(group))rows.set(group,row++);card.x=({script:0,image:1,video:2,note:3}[card.type] || 0)*340;card.y=rows.get(group)*340;}render();fit();}
  function chooseScript(){
    const dialog=el('dialog','anime-canvas-dialog');dialog.append(el('h2','','このProjectのScriptを取り込む'),el('p','','現在のProjectだけを参照します。画像・動画は自動生成されません。'));
    const select=el('select');select.setAttribute('aria-label','取り込むScript');
    scripts.forEach((item,index)=>{const option=el('option','',item.script?.title || `Script ${index+1}`);option.value=String(index);select.append(option);});
    dialog.append(select);
    const manual=el('textarea');manual.placeholder='脚本が未作成の場合は、1行1シーンで貼り付けることもできます。';manual.rows=5;manual.setAttribute('aria-label','脚本を手動で貼り付け');dialog.append(manual);
    if(!scripts.length){select.hidden=true;dialog.append(el('p','','このProjectには生成済みScriptがありません。手動で貼り付けて試せます。'));}
    dialog.append(button('取り込む',()=>{
      const scenes=manual.value.trim()?manual.value.trim().split(/\n+/).map((visual,index)=>({title:`Scene ${index+1}`,visual})):scriptScenes(scripts[Number(select.value)]);
      if(!scenes.length){status.textContent='取り込めるシーンがありません。Scriptまたは手動入力を確認してください。';return;}
      const batch=crypto.randomUUID(),offset=state.cards.length?Math.max(...state.cards.map(c=>c.y))+340:0;
      scenes.forEach((scene,index)=>{const sceneId=`${batch}:${index}`;['script','image','video'].forEach((type,col)=>state.cards.push({id:crypto.randomUUID(),scene:sceneId,type,title:`${scene.title} · ${{script:'Script',image:'画像',video:'動画'}[type]}`,text:type==='script'?`${scene.visual}\n${scene.narration || ''}`.trim():'',seconds:scene.seconds,x:col*340,y:offset+index*340}));});
      dialog.close();dialog.remove();render();fit();selectCard(state.cards.find(card=>card.scene===`${batch}:0` && card.type==='script'));status.textContent=`${scenes.length}シーンを取り込みました。最初のシーンを選択しています。「このシーンの画像を作る」から進めます。`;
    },'primary'),button('キャンセル',()=>{dialog.close();dialog.remove();}));
    dialog.oncancel=()=>dialog.remove();shell.append(dialog);dialog.showModal();
  }
  file.onchange=()=>{let last=null;for(const asset of file.files){if(!/^(image|video)\//.test(asset.type)){status.textContent='画像・動画を選択してください。';continue;}if(asset.size>100*1024*1024){status.textContent='プレビュー用素材は100MB以下を選択してください。';continue;}const type=asset.type.startsWith('video/')?'video':'image';const url=URL.createObjectURL(asset);urls.add(url);const target=uploadTarget?.type===type?uploadTarget:addCard(type,{x:last?last.x+340:40,y:last?last.y:40});if(target.url){URL.revokeObjectURL(target.url);urls.delete(target.url);}Object.assign(target,{url,fileName:asset.name});uploadTarget=null;last=target;}file.value='';render();save();if(last){selectCard(last);centerCard(last);status.textContent='素材を選択しました。下の操作から次に進めます。実ファイルは本機プレビューのみで、再読込時は再選択が必要です。';}};
  function render(){
    plane.replaceChildren();empty.hidden=state.cards.length>0;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('anime-canvas-links');plane.append(svg);
    for(const card of state.cards){const previous=card.sourceId?state.cards.find(c=>c.id===card.sourceId):card.scene && card.type!=='script'?state.cards.find(c=>c.scene===card.scene && c.type===(card.type==='image'?'script':'image')):null;if(previous){const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M ${previous.x+280} ${previous.y+140} C ${previous.x+310} ${previous.y+140}, ${card.x-30} ${card.y+140}, ${card.x} ${card.y+140}`);svg.append(path);}}
    for(const card of state.cards){const node=el('article',`anime-canvas-card ${card.type}`);node.style.left=`${card.x}px`;node.style.top=`${card.y}px`;node.dataset.cardId=card.id;
      node.classList.toggle('selected',active?.id===card.id);node.tabIndex=0;node.setAttribute('aria-label',card.title);node.onclick=event=>{if(!event.target.closest('button,textarea,video,select'))selectCard(card);};node.onkeydown=event=>{if(event.target===node && (event.key==='Enter' || event.key===' ')){event.preventDefault();selectCard(card);}};
      const head=el('header');head.append(el('strong','',card.title),button('×',()=>{if(card.url){URL.revokeObjectURL(card.url);urls.delete(card.url);}if(active?.id===card.id){active=null;dock.hidden=true;}state.cards=state.cards.filter(c=>c.id!==card.id);render();save();}));node.append(head);
      head.onpointerdown=event=>{if(event.target.closest('button'))return;event.preventDefault();head.setPointerCapture(event.pointerId);drag={card,startX:event.clientX,startY:event.clientY,x:card.x,y:card.y};};
      head.onpointermove=event=>{if(drag?.card!==card)return;card.x=drag.x+(event.clientX-drag.startX)/state.view.zoom;card.y=drag.y+(event.clientY-drag.startY)/state.view.zoom;node.style.left=`${card.x}px`;node.style.top=`${card.y}px`;};
      head.onpointerup=()=>{if(drag?.card===card){drag=null;render();save();}};
      if(['script','note'].includes(card.type)){const text=el('textarea');text.value=card.text || '';text.placeholder='内容を編集…';text.setAttribute('aria-label',card.title);text.oninput=()=>{card.text=text.value;save();};node.append(text);}
      else{const media=el('div','anime-canvas-media');if(card.url){const asset=el(card.type==='image'?'img':'video');asset.src=card.url;if(card.type==='video'){asset.controls=true;asset.preload='metadata';}else asset.alt=card.fileName || card.title;media.append(asset);}else{media.append(el('span','',card.type==='image'?'▧':'▷'),el('p','',card.planned?'制作プラン · 未生成':card.fileName?'素材を再選択してください':card.type==='image'?'画像を生成、または素材を選択':'動画を生成、または素材を選択'));}node.append(media);if(card.plan)node.append(el('p','anime-canvas-plan-summary',`${card.plan.style} · ${card.plan.ratio}${card.plan.seconds?' · '+card.plan.seconds:''}`));const footer=el('footer');footer.append(button(card.url?'素材を差し替え':'素材を選ぶ',()=>upload(card.type,card)),button('次の操作 →',()=>selectCard(card)));node.append(footer);}
      if(card.referenceRole)node.append(el('span','anime-canvas-reference',`${card.referenceRole}参照`));
      node.append(el('small','',card.type==='script'?'元のScriptは変更しません':card.type==='note'?'作品への指示・検討メモ':card.url?'持ち込み素材 · 本機のみ':'生成接続は次の段階'));plane.append(node);
    }transform();
  }
  stage.onpointerdown=event=>{if(event.target.closest('article,button,input,textarea,select,form'))return;active=null;dock.hidden=true;refreshSelection();stage.setPointerCapture(event.pointerId);drag={startX:event.clientX,startY:event.clientY,x:state.view.x,y:state.view.y};};
  stage.onpointermove=event=>{if(!drag || drag.card)return;state.view.x=drag.x+event.clientX-drag.startX;state.view.y=drag.y+event.clientY-drag.startY;transform();};
  stage.onpointerup=()=>{if(drag && !drag.card){drag=null;save();}};
  stage.onwheel=event=>{event.preventDefault();if(event.ctrlKey || event.metaKey)setZoom(state.view.zoom-event.deltaY*.002);else{state.view.x-=event.deltaX;state.view.y-=event.deltaY;transform();}};
  render();save();
  return ()=>{for(const url of urls)URL.revokeObjectURL(url);root.classList.remove('anime-canvas-host');root.replaceChildren();};
}
