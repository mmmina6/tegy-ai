export function normalizeDuration(value,min,max,fallback=min){
  const parsed=Number.parseFloat(value);
  return Math.min(max,Math.max(min,Math.round(Number.isFinite(parsed)?parsed:fallback)));
}

export function durationControl({label,value=5,min=1,max=10,onChange=()=>{}}){
  const root=document.createElement('div');root.className='duration-control';
  const details=document.createElement('details');root.append(details);
  const summary=document.createElement('summary');summary.title=label;details.append(summary);
  const panel=document.createElement('div');panel.className='duration-panel';details.append(panel);
  const title=document.createElement('strong');title.textContent=label;panel.append(title);
  const controls=document.createElement('div');controls.className='duration-inputs';panel.append(controls);
  const slider=document.createElement('input');slider.type='range';slider.min=min;slider.max=max;slider.step=1;slider.setAttribute('aria-label',label+' スライダー');
  const numeric=document.createElement('input');numeric.type='number';numeric.min=min;numeric.max=max;numeric.step=1;numeric.setAttribute('aria-label',label+' 秒');
  const ticks=document.createElement('div');ticks.className='duration-ticks';for(const n of [min,Math.round((max+min)/2),max]){const span=document.createElement('span');span.textContent=n;ticks.append(span);}
  const track=document.createElement('div');track.append(slider,ticks);
  const numberBox=document.createElement('label');numberBox.className='duration-number';const unit=document.createElement('span');unit.textContent='s';numberBox.append(numeric,unit);controls.append(track,numberBox);
  let current;
  function set(next,notify=true){current=normalizeDuration(next,min,max,value);slider.value=String(current);numeric.value=String(current);summary.textContent=(max>10?'全体 ':'')+current+'s';summary.setAttribute('aria-label',label+' '+current+'秒');slider.style.setProperty('--duration-fill',((current-min)/(max-min)*100)+'%');if(notify)onChange(current);}
  slider.oninput=()=>set(slider.value);
  numeric.oninput=()=>{if(numeric.value!=='' && numeric.validity.valid)set(numeric.value);};
  numeric.onchange=()=>set(numeric.value);
  panel.onkeydown=event=>{if(event.key==='Escape'){details.open=false;summary.focus();}};
  set(value,false);
  return {element:root,get value(){return current+'秒';},set};
}
