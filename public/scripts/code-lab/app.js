import {bindTactile} from './tactile.js';
import {initMapLab} from './map-lab.js';
import {examples} from './content.js';
import {LessonMachine,syntaxExample} from './model.js';
import {benchSVG} from './drawing.js';
import {TimingMachine} from './timing-machine.js';
import {catScene} from './cat-scene.js';
import {functionLessons} from './function-lessons.js';
import {timingLessons} from './timing-lessons.js';
import {initTimingLab} from './timing-lab.js';
import {setupFeederTiming} from './feeder-timing.js';
import {codeRows} from './render.js';
import {StepMotion, renderMemory} from './step-motion.js';
import {indexExecutionScopes} from './scope-view.js';
if(!Object.hasOwn(HTMLElement.prototype,'focusGroup')){await import('../vendor/focusgroup-polyfill.js');}
const tabs=[...document.querySelectorAll('[data-tab]')],panels=[...document.querySelectorAll('[data-example]')],controllers=new Map();
let active='blink';
const supportsHas=CSS.supports('selector(:has(*))');
function showAllCode(show){
 for(const button of document.querySelectorAll('[data-action="scope-view"]')){
  button.setAttribute('aria-pressed',String(show));
  if(!supportsHas)button.closest('.cl-code-card').toggleAttribute('data-show-all',show);
 }
}
class Controller{
 constructor(root,id,continuous=false){this.root=root;this.id=id;this.continuous=continuous;this.catExample=functionLessons.some(lesson=>lesson.id===id);this.compiled=continuous||id==='serial'||this.catExample;this.motion=new StepMotion(root);this.timer=null;this.playing=false;this.fault='none';this.options={delay:500};this.inputs={button:false,raw:2048,humidity:55};this.reset();
 root.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b){const a=b.dataset.action;if(a==='step'){this.pause();this.step();}if(a==='back')this.rewind();if(a==='scope-view')showAllCode(b.getAttribute('aria-pressed')!=='true');if(a==='play')this.playing?this.pause():this.play();if(a==='reset'){this.reset();this.paint();}if(a==='download')this.download();}const l=e.target.closest('[data-line]');if(l)this.explain(l.dataset.line);});
 root.querySelectorAll('[data-option]').forEach(el=>el.addEventListener('change',()=>{if(el.dataset.option==='fault')this.fault=el.value;else this.options[el.dataset.option]=Number(el.value);this.reset();this.paint();}));
 const speed=this.q('[data-speed]');
 this.motion.setSpeed(Number(speed.value));
 speed.addEventListener('change',()=>{
  this.motion.setSpeed(Number(speed.value));
  this.reschedule?.();
 });
 const button=root.querySelector('[data-button]');if(button)this.releaseButton=bindTactile(button,pressed=>{this.inputs.button=pressed;this.machine.setInputs(this.inputs);this.q('[data-input-label]').textContent=pressed?'กด · LOW':'ปล่อย · HIGH';this.q('[data-bench]').innerHTML=benchSVG(this.id,this.machine.state,this.inputs);});
 const humidity = root.querySelector('[data-humidity]');
 const missing = root.querySelector('[data-humidity-missing]');
 if (humidity && missing) {
  const changeHumidity = () => {
   humidity.disabled = missing.checked;
   this.inputs.humidity = missing.checked ? null : Number(humidity.value);
   this.machine.setInputs(this.inputs);
   root.querySelector('[data-humidity-value]').textContent = missing.checked ? 'อ่านไม่ได้' : humidity.value + '% RH';
   this.paint();
  };
  humidity.addEventListener('input', changeHumidity);
  missing.addEventListener('change', changeHumidity);
 }
 root.querySelector('[data-raw]')?.addEventListener('input',e=>{this.inputs.raw=Number(e.target.value);this.machine.setInputs(this.inputs);this.paint();});this.paint();}
 q(s){return this.root.querySelector(s);}
 reset(){this.pause();this.motion.reset();this.pending=null;this.machine=this.compiled?new TimingMachine(this.id):new LessonMachine(this.id,this.options,this.inputs);this.syntax=syntaxExample(this.machine.program,this.fault);this.scopes=indexExecutionScopes(this.machine.program.lines);this.q('.cl-code-list').innerHTML=codeRows(this.syntax.lines);this.explain(this.machine.program.lines[0].id);}
 pause(){this.playToken=null;this.motion.cancel();clearTimeout(this.timer);this.timer=null;this.reschedule=null;this.playing=false;const b=this.q('[data-action="play"]');if(b)b.textContent='▶ เล่นโค้ด';}
 step(){
  if(this.syntax.error){this.paint();return;}
  if(this.pending)return this.pending;
  this.motion.cancel();
  const machine=this.machine;
  const before=machine.snapshot();
  const token=this.playToken;
  const finish=after=>{
   if(this.machine!==machine)return;
   const visible=!this.root.closest('[hidden]')&&!document.hidden&&this.playToken===token;
   const motion=visible?this.motion.prepare(before,after):null;
   this.paint();
   this.explain(after.line);
   if(!visible)return;
   if(!this.continuous||!this.playing)this.revealStep();
   this.motion.play(before,after,motion);
   if(after.wait&&!this.playing)this.scheduleNext(()=>this.step());
  };
  if(!this.compiled){finish(machine.step());return;}
  const pending=machine.step().then(finish,error=>{
   if(this.machine!==machine)return;
   this.pause();
   const alert=this.q('.cl-error');
   alert.textContent='ตัวรัน C++ ขัดข้อง กดเล่นโค้ดเพื่อลองอีกครั้ง';
   alert.hidden=false;
   console.error(error);
  }).finally(()=>{
   if(this.pending===pending)this.pending=null;
  });
  this.pending=pending;
  return pending;
 }
 rewind(){
  this.pause();
  if(this.pending)return;
  this.motion.reset();
  const state=this.machine.rewind();
  if(state.wait)this.motion.prepare(state,state);
  this.paint();
  this.explain(state.line??this.machine.program.lines[0].id);
  this.revealStep();
 }
 revealStep(){
  const line=this.q('.cl-current');
  if(!line)return;
  const card=this.q('.cl-code-card');
  const memory=this.q('[data-memory]');
  const toolbar=this.q('.cl-toolbar');
  const viewBottom=window.innerHeight-12;
  const lineBox=line.getBoundingClientRect();
  if(lineBox.bottom>viewBottom||memory.getBoundingClientRect().top<toolbar.getBoundingClientRect().bottom){
   card.scrollIntoView({block:'start',behavior:'instant'});
  }
  const list=this.q('.cl-code-list');
  const bottom=Math.min(viewBottom,list.getBoundingClientRect().bottom);
  const excess=line.getBoundingClientRect().bottom-bottom;
  if(excess>0)list.scrollTop+=excess;
 }
 queueStep(tick,remaining){
  clearTimeout(this.timer);
  const rate=this.motion.rate, started=performance.now();
  const timer=setTimeout(async()=>{
   await this.motion.finished();
   if(this.timer===timer)tick();
  },remaining/rate);
  this.timer=timer;
  this.reschedule=()=>this.queueStep(tick,Math.max(0,remaining-(performance.now()-started)*rate));
 }
 scheduleNext(tick){
  const {wait}=this.machine.state;
  const dwell=this.motion.waitComplete?400:this.continuous?175:350;
  const interval=wait?(this.motion.startWait(wait)?0:wait):dwell;
  this.queueStep(tick,interval);
 }
 play(){
  if(this.syntax.error){this.paint();return;}
  const token=Symbol();
  this.playToken=token;
  this.playing=true;
  this.stopAfter=this.machine.state.loopCount+3;
  this.q('[data-action="play"]').textContent='Ⅱ พักภาพ';
  const tick=async()=>{
   await this.step();
   if(this.playToken!==token)return;
   if(!this.continuous&&this.machine.state.line==='loop-close'&&this.machine.state.loopCount>=this.stopAfter){
    this.pause();
    this.q('[data-live]').textContent+=' · พักภาพหลังดู 3 รอบ กดเล่นต่อได้';
    return;
   }
   this.scheduleNext(tick);
  };
  if(this.machine.state.wait)this.scheduleNext(tick);
  else tick();
 }
 explain(id){const l=this.machine.program.lines.find(l=>l.id===id);if(!l)return;this.q('[data-note-title]').textContent=l.title;this.q('[data-note-body]').textContent=l.explain;for(const b of this.root.querySelectorAll('[data-line]'))b.classList.toggle('cl-reading',b.dataset.line===id);}
 paint(){
 const s=this.machine.state,error=this.syntax.error;
 const scope=error?null:this.scopes.get(s.line);
 this.q('[data-execution-scope]').textContent=scope?.label??'กดบรรทัดเพื่ออ่านความหมาย';
this.q('.cl-error').hidden=!error;this.q('.cl-error').textContent=error?`${error.message} · ยังไม่เริ่มตัวอย่างนี้`:'';for(const b of this.root.querySelectorAll('[data-line]')){b.classList.toggle('cl-current',b.dataset.line===s.line);b.toggleAttribute('data-outside-scope',!!scope&&!scope.lines.has(b.dataset.line));b.classList.toggle('cl-code-error',b.dataset.line===error?.line);if(b.dataset.line===s.line)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}
 const bench=this.q('[data-bench]');if(bench)bench.innerHTML=benchSVG(this.id,s,this.inputs);
 this.q('[data-setup]').textContent=s.setupCount;this.q('[data-loops]').textContent=s.loopCount;this.q('[data-time]').textContent=s.time.toLocaleString('en-US');this.q('[data-live]').textContent=error?'แก้เครื่องหมายที่หายไปก่อน แล้วเริ่มใหม่ได้':s.message;this.q('[data-stack]').textContent=s.stack.length?s.stack.join(' → '):'ยังไม่อยู่ในฟังก์ชัน';renderMemory(this.q('[data-memory]'),s.vars);const raw=this.q('[data-raw-value]');if(raw)raw.textContent=this.inputs.raw;const button=this.q('[data-input-label]');if(button)button.textContent=this.inputs.button?'กด · LOW':'ปล่อย · HIGH';this.q('[data-action="step"]').disabled=!!error;this.q('[data-action="back"]').disabled=!!error||!this.machine.canRewind;this.q('[data-action="play"]').disabled=!!error;
 if(this.catExample)this.q('[data-cat-scene]').innerHTML=catScene(this.id,s);
 else this.paintSerial(s);
 const pins=this.catExample||this.id==='serial'?[]:this.id==='for'?[23,22,21]:[23];this.q('[data-dock]').innerHTML=pins.map(pin=>`<span data-dock-pin="${pin}" data-output-target="dock-${pin}"><svg viewBox="0 0 24 28" aria-hidden="true"><path d="M5 20V10a7 7 0 0 1 14 0v10Z" fill="${s.leds[pin]?'#d58f3e':'#cbd9cf'}" stroke="#91ad95"/><path d="M8 20v7m8-7v7" stroke="#91ad95"/></svg>${pin}: ${s.leds[pin]?s.leds[pin]===255?'ON':Math.round(s.leds[pin]/255*100)+'%':'OFF'}</span>`).join('')+`<span>บรรทัด ${s.line?this.machine.program.lines.findIndex(l=>l.id===s.line)+1:'–'} · loop ${s.loopCount}</span>`;
 const line=this.q('.cl-current'),list=this.q('.cl-code-list');if(line&&(line.offsetTop<list.scrollTop||line.offsetTop+line.offsetHeight>list.scrollTop+list.clientHeight))list.scrollTop=Math.max(0,line.offsetTop-list.clientHeight/2);

 }
 paintSerial(state){
  const {log,serialText,serialChunk}=state;
  const history=this.q('[data-log-history]');
  const latest=this.q('[data-output-target="serial-line"]');
  if(typeof serialText!=='string'){
   history.textContent=log.length>1?log.slice(0,-1).join('\n')+'\n':log.length?'':'ยังไม่มีข้อความ';
   latest.textContent=log.at(-1)??'';
   return;
  }
  const monitor=this.q('[data-log]');
  const tail=this.q('[data-log-tail]');
  const chunk=serialChunk.replace(/\n$/,'');
  const preceding=serialText.slice(0,serialText.length-serialChunk.length);
  const newline=serialChunk.slice(chunk.length);
  const previous=monitor.textContent;
  history.textContent=serialText?preceding:'ยังไม่มีข้อความ';
  latest.textContent=chunk;
  tail.textContent=newline;
  monitor.toggleAttribute('data-serial-active',!!serialText);
  if(previous!==monitor.textContent)monitor.scrollTop=monitor.scrollHeight;
 }
 download(){const content=this.syntax.lines.map(l=>l.code).join('\n')+'\n',a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));a.href=url;a.download=this.machine.program.meta.file;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
const functionViews=[...document.querySelectorAll('[data-function-view]')];
const functionChoices=[...document.querySelectorAll('[data-function-choice]')];
let functionMode=functionLessons[0].id;
function selectFunction(id){
 if(functionMode!==id)controllers.get(functionMode)?.pause();
 functionMode=id;
 for(const button of functionChoices)button.setAttribute('aria-pressed',String(button.dataset.functionChoice===id));
 for(const view of functionViews)view.hidden=view.dataset.functionView===id?false:'until-found';
 if(!controllers.has(id))controllers.set(id,new Controller(functionViews.find(view=>view.dataset.functionView===id),id));
}
for(const button of functionChoices)button.addEventListener('click',()=>selectFunction(button.dataset.functionChoice));
for(const view of functionViews)view.addEventListener('beforematch',()=>selectFunction(view.dataset.functionView));
selectFunction(functionMode);
for(const e of examples.filter(e=>!['timing','function'].includes(e.id)))controllers.set(e.id,new Controller(document.querySelector(`[data-example="${e.id}"]`),e.id));
function select(id){if(active!==id){const previous=controllers.get(active==='function'?functionMode:active);previous?.pause();previous?.releaseButton?.();if(active==='timing')pauseTiming();}active=id;for(const t of tabs){const chosen=t.dataset.tab===id;t.setAttribute('aria-selected',String(chosen));t.toggleAttribute('focusgroupstart',chosen);}for(const p of panels)p.hidden=p.dataset.example===id?false:'until-found';const tab=tabs.find(t=>t.dataset.tab===id);tab.scrollIntoView({block:'nearest',inline:'nearest',container:'nearest'});}
tabs.forEach(t=>t.addEventListener('click',()=>select(t.dataset.tab)));
// Focusgroup handles arrows; native buttons activate selection with Enter/Space.
panels.forEach(p=>p.addEventListener('beforematch',()=>select(p.dataset.example)));
document.querySelector('.cl-lesson').addEventListener('keydown',e=>{if((e.target.closest('.cl-tabs,.cl-code-card,.cl-drive-trace-scroll,[data-log][tabindex]')||e.target.matches('input,select'))&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key))e.stopPropagation();});
const timingRoot=document.querySelector('[data-example="timing"]');
const pauseFeederClock=setupFeederTiming(timingRoot);
const timingViews=[...timingRoot.querySelectorAll('[data-timing-view]')];
const timingChoices=[...timingRoot.querySelectorAll('[data-timing-choice]')];
let mode=null;
let pauseRace;
function pauseTiming(){
 pauseFeederClock();
 if(mode==='comparison')pauseRace?.();
 else controllers.get(mode)?.pause();
}
for(const button of timingChoices){
 button.addEventListener('click',()=>{
  pauseTiming();
  const next=button.dataset.timingChoice;
  mode=mode===next?null:next;
  for(const choice of timingChoices)choice.setAttribute('aria-expanded',String(choice.dataset.timingChoice===mode));
  for(const view of timingViews)view.hidden=view.dataset.timingView!==mode;
  const view=timingViews.find(view=>view.dataset.timingView===mode);
  if(mode==='comparison')pauseRace??=initTimingLab(view);
  const lesson=timingLessons.find(lesson=>lesson.id===mode);
  if(lesson){
   if(!controllers.has(mode))controllers.set(mode,new Controller(view,mode,true));
   controllers.get(mode).play();
  }
 });
}
initMapLab(()=>{const controller=controllers.get('sensor');return controller.machine.state.vars.value?.value??controller.machine.state.vars.raw?.value??controller.inputs.raw;});
function pauseCode(){controllers.forEach(c=>{c.pause();c.releaseButton?.();});}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseCode();});
window.addEventListener('pagehide',()=>{pauseCode();pauseTiming();});

document.documentElement.dataset.codeLabReady='true';
