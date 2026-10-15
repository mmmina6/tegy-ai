import {scriptScenes} from './anime-canvas.js';
import {durationControl} from './duration-control.js';

// A focused production window, deliberately separate from Anime's free canvas.
export function mountVideoStudio(root,{projectId,workId,projectName,scripts=[]}){
  const key=`tegy-video-studio-preview:${projectId}:${workId}`;
  const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
  const button=(text,action,cls='')=>{const node=el('button',cls,text);node.type='button';node.onclick=action;return node;};
  let draft={mode:'画像から動画',style:'素材の画風を維持',template:'自然な動き',ratio:'9:16',duration:'5秒',prompt:''};
  try{draft={...draft,...JSON.parse(localStorage.getItem(key)||'{}')};}catch{}
  let url='',fileName='',endUrl='',uploadRole='start';const references=[];
  root.replaceChildren();root.classList.add('video-studio-host');
  const studio=el('section','video-studio');root.append(studio);
  const heading=el('header','video-studio-heading');heading.append(el('small','','VIDEO STUDIO'),el('h1','','素材から、次の映像へ。'),el('p','',`${projectName || 'Project'} · 素材と演出をひとつのウィンドウで設定します。`));studio.append(heading);
  const form=el('form','video-studio-window');studio.append(form);
  const tabs=el('div','video-studio-modes');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','動画の制作方法');form.append(tabs);
  const modes=[];for(const value of ['画像から動画','テキストから動画','動画を参考に']){const node=button(value,()=>{draft.mode=value;renderMode();saveDraft();});modes.push(node);tabs.append(node);}
  const content=el('div','video-studio-content');form.append(content);
  const mediaColumn=el('div','video-studio-input');content.append(mediaColumn);
  const preview=el('div','video-studio-material');mediaColumn.append(preview);
  const input=el('input');input.type='file';input.hidden=true;input.accept='image/*';form.append(input);
  const frameLink=el('span','video-studio-frame-link','⇄');frameLink.setAttribute('aria-hidden','true');mediaColumn.append(frameLink);
  const endFrame=button('',()=>{uploadRole='end';input.accept='image/*';input.multiple=false;input.click();},'video-studio-end-frame');endFrame.setAttribute('aria-label','終了フレームを選択（任意）');mediaColumn.append(endFrame);
  const referenceList=el('div','video-studio-references');mediaColumn.append(referenceList);
  const materialNote=el('small','video-studio-material-note','画像は動画の開始画面として使用します。');mediaColumn.append(materialNote);
  const body=el('div','video-studio-description');content.append(body);
  const scriptTools=el('div','video-studio-script');scriptTools.append(el('span','','ProjectのScriptから取り込む'));
  const source=el('select');source.setAttribute('aria-label','取り込む脚本');source.append(el('option','','Scriptを選択…'));
  scripts.forEach((item,index)=>{const option=el('option','',item.script?.title || `Script ${index+1}`);option.value=String(index);source.append(option);});
  source.firstChild.value='';source.disabled=!scripts.length;scriptTools.append(source);body.append(scriptTools);
  const scene=el('select');scene.hidden=true;scene.setAttribute('aria-label','取り込むシーン');body.append(scene);
  const promptLabel=el('label','video-studio-label','動き・カメラ・演出');const prompt=el('textarea');prompt.rows=1;prompt.value=draft.prompt;prompt.placeholder='作りたい映像を入力、または参考素材を追加…';prompt.setAttribute('aria-label','動画の動き・カメラ・演出');promptLabel.append(prompt);body.append(promptLabel);
  const scriptMenu=el('details','video-studio-script-menu');scriptMenu.append(el('summary','','Scriptを取り込む'),scriptTools,scene);body.prepend(scriptMenu);
  const options=el('div','video-studio-options');form.append(options);
  function select(label,key,values){const wrapper=el('label','',label);const field=el('select');field.setAttribute('aria-label',label);for(const value of values)field.append(el('option','',value));field.value=values.includes(draft[key])?draft[key]:values[0];draft[key]=field.value;field.onchange=()=>{draft[key]=field.value;saveDraft();};wrapper.append(field);options.append(wrapper);return field;}
  select('モデル','model',['自動・低コスト優先（未接続）','Wan（接続予定）','Seedance（接続予定）']);
  const ratio=select('サイズ','ratio',['9:16','16:9','1:1']);
  select('解像度','resolution',['480P','720P','1080P']);
  const duration=durationControl({label:'動画の長さ（最大10秒）',value:parseFloat(draft.duration) || 5,max:10,onChange:value=>{draft.duration=value+'秒';saveDraft();}});
  options.append(duration.element);draft.duration=duration.value;
  const modeSelect=el('select');modeSelect.setAttribute('aria-label','動画の制作方法');for(const value of ['画像から動画','テキストから動画','動画を参考に']){const option=el('option','',value);modeSelect.append(option);}modeSelect.value=draft.mode;modeSelect.onchange=()=>{draft.mode=modeSelect.value;renderMode();saveDraft();};tabs.replaceChildren(modeSelect);options.prepend(tabs);
  const footer=el('footer','video-studio-footer');const saved=el('span','','UIプレビュー · 自動生成なし');const submit=el('button','primary','↑');submit.type='submit';submit.title='制作プランを保存（生成なし）';submit.setAttribute('aria-label',submit.title);footer.append(options,saved,submit);form.append(footer);
  const result=el('section','video-studio-result');result.hidden=true;studio.append(result);
  const status=el('p','video-studio-status','UI確認用：素材・設定は本機プレビューのみ。生成／共有保存は未接続です。');status.setAttribute('role','status');studio.append(status);
  function resizePrompt(){prompt.style.height='0px';const cap=Math.max(64,Math.min(180,root.clientHeight*.28 || 180));prompt.style.height=`${Math.min(Math.max(36,prompt.scrollHeight),cap)}px`;prompt.style.overflowY=prompt.scrollHeight>cap?'auto':'hidden';}
  prompt.oninput=()=>{resizePrompt();draft.prompt=prompt.value;saveDraft();};
  function saveDraft(){try{localStorage.setItem(key,JSON.stringify(draft));saved.textContent='本機に下書き保存済み';}catch{saved.textContent='下書きを保存できません';}}
  function drawMaterial(){
    preview.replaceChildren();
    const start=button('',()=>{uploadRole='start';input.multiple=false;input.accept=draft.mode==='動画を参考に'?'video/*':'image/*';input.click();},'video-studio-start-frame');
    start.setAttribute('aria-label',draft.mode==='動画を参考に'?'参照動画を選択':'開始フレームを選択');
    if(url){const asset=el(draft.mode==='動画を参考に'?'video':'img');asset.src=url;if(asset.tagName==='VIDEO')asset.preload='metadata';else asset.alt=fileName;start.append(asset);}else start.append(el('b','','＋'));
    start.append(el('span','',draft.mode==='動画を参考に'?'参考動画':'開始'));preview.append(start);
    endFrame.replaceChildren();if(endUrl){const img=el('img');img.src=endUrl;img.alt='終了フレーム';endFrame.append(img);}else endFrame.append(el('b','','＋'));endFrame.append(el('span','','終了'));
    preview.hidden=draft.mode==='テキストから動画';endFrame.hidden=draft.mode!=='画像から動画';frameLink.hidden=endFrame.hidden;
  }
  function renderMode(){for(const node of modes){const selected=node.textContent===draft.mode;node.classList.toggle('active',selected);node.setAttribute('aria-pressed',String(selected));}if(url){URL.revokeObjectURL(url);url='';fileName='';}input.accept=draft.mode==='動画を参考に'?'video/*':'image/*';drawMaterial();}
  ratio.addEventListener('change',drawMaterial);
  input.onchange=()=>{for(const file of input.files){const allowed=uploadRole==='reference'?/^(image|video)\//.test(file.type):file.type.startsWith(uploadRole==='end'?'image/':draft.mode==='動画を参考に'?'video/':'image/');if(!allowed||file.size>100*1024*1024){status.textContent='画像・動画は100MB以下で選択してください。';continue;}const assetUrl=URL.createObjectURL(file);if(uploadRole==='reference')references.push({name:file.name,url:assetUrl});else if(uploadRole==='end'){if(endUrl)URL.revokeObjectURL(endUrl);endUrl=assetUrl;}else{if(url)URL.revokeObjectURL(url);url=assetUrl;fileName=file.name;}}drawMaterial();status.textContent='素材を選択しました。説明と下の設定を確認してください。本機プレビューのみです。';input.value='';};
  source.onchange=()=>{scene.replaceChildren();const rows=scriptScenes(scripts[Number(source.value)]);scene.hidden=source.value==='' || !rows.length;rows.forEach((item,index)=>{const option=el('option','',item.title);option.value=String(index);scene.append(option);});scene.onchange=()=>{const item=rows[Number(scene.value)];if(item){prompt.value=[item.visual,item.narration].filter(Boolean).join('\n');draft.prompt=prompt.value;resizePrompt();saveDraft();}};if(!scene.hidden)scene.onchange();};
  form.onsubmit=event=>{event.preventDefault();if(!prompt.value.trim()){status.textContent='動きや演出を入力してください。';prompt.focus();return;}if(draft.mode!=='テキストから動画'&&!url){status.textContent='先に参照素材を選択してください。';return;}draft.prompt=prompt.value;saveDraft();result.replaceChildren();result.append(el('small','','PRODUCTION PLAN · 未生成'),el('h2','','制作プランを確認'),el('p','',`${draft.mode} · ${draft.style} · ${draft.ratio} · ${draft.duration}`),el('p','',draft.prompt),el('small','','これは動画生成結果ではありません。生成APIへの接続後に実行できます。'));result.hidden=false;status.textContent='制作プランを本機に保存しました。生成は実行していません。';};
  renderMode();resizePrompt();return ()=>{if(url)URL.revokeObjectURL(url);if(endUrl)URL.revokeObjectURL(endUrl);for(const ref of references)URL.revokeObjectURL(ref.url);root.classList.remove('video-studio-host');root.replaceChildren();};
}
