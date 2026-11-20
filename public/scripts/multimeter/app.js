import {meterCases,modeNames} from './cases.js';
import {initialState,getCase,measure} from './model.js';
import {sceneHTML,esc,curve} from './view.js';
import {parkedProbes,probeTail,bindProbeDrag,nearestPoint,meterJacks,parkedJacks,jackFor,connectorPosition,jackTail} from './probes.js';
import {createMeterGuide} from './guide.js';
const $=s=>document.querySelector(s),scene=$('#mm-scene');
let active='drop',state=initialState(active),reading=null,selected={kind:'probe',color:'red'},sound=false,audio,positions=parkedProbes(),connectors=parkedJacks();
$('#mm-cases').innerHTML=meterCases.map(c=>`<li><button type="button" data-case="${c.id}" aria-pressed="false">${esc(c.title)}</button></li>`).join('');
$('#mm-case-select').innerHTML=meterCases.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('');
$('#mm-modes').insertAdjacentHTML('beforeend',Object.entries(modeNames).map(([key,value])=>`<label><input type="radio" name="mode" value="${key}"><span>${value}</span></label>`).join(''));
const guide=createMeterGuide({getState:()=>state,getReading:()=>reading,getId:()=>active});
function beep(){if(!sound)return;try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;audio??=new Ctx();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=2000;gain.gain.setValueAtTime(.05,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.13);}catch{}}
function feedback(message,severity='ready'){$('#mm-feedback').textContent=message;$('#mm-feedback').dataset.severity=severity;$('#mm-display').dataset.severity=severity;}
function showReading(result){const changed=JSON.stringify(reading)!==JSON.stringify(result);reading=result;if(result.blowFuse)state.fuseBlown=true;feedback(result.message,result.severity);if(changed&&result.beep)beep();if(changed&&['stop','fuse'].includes(result.severity)){$('#mm-display').classList.remove('mm-shake');void $('#mm-display').offsetWidth;$('#mm-display').classList.add('mm-shake');}}
const portLabel=id=>id==='ma'?'mA':id==='v'?'VΩ':id==='com'?'COM':'ยังไม่เสียบ';
function render(){
 const c=getCase(active),focused=document.activeElement?.dataset;
 $('#mm-case-select').value=active;document.querySelectorAll('[data-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===active)));
 document.querySelectorAll('input[name=mode]').forEach(el=>el.checked=el.value===state.mode);
 $('#mm-fuse-status').hidden=!state.fuseBlown;$('#mm-power').checked=state.power;$('#mm-power-label').textContent=state.power?'เปิด':'ปิด';$('#mm-fault-control').hidden=!c.faultLabel;$('#mm-fault').checked=state.fault;$('#mm-fault-label').textContent=c.faultLabel||'';
 $('#mm-load-control').hidden=active!=='drop';$('#mm-load').checked=state.load;$('#mm-gap-control').hidden=active!=='current';$('#mm-gap').checked=state.gapOpen;
 $('#mm-probe-status').textContent=`แดง: ${portLabel(state.jack)} / ${state.red||'ยกหัววัดอยู่'} · ดำ: ${portLabel(state.blackJack)} / ${state.black||'ยกหัววัดอยู่'}`;
 $('#mm-value').textContent=reading?.display||'—';$('#mm-unit').textContent=reading?.unit||modeNames[state.mode];scene.innerHTML=sceneHTML(active,state,reading,positions,connectors);
 if(focused?.point)scene.querySelector(`[data-point="${focused.point}"]`)?.focus({preventScroll:true});
 if(focused?.leadEnd)scene.querySelector(`[data-lead-end="${focused.leadEnd}"][data-color="${focused.color}"]`)?.focus({preventScroll:true});
 if(focused?.jackTarget)scene.querySelector(`[data-jack-target="${focused.jackTarget}"]`)?.focus({preventScroll:true});
 scene.querySelectorAll('[data-lead-end]').forEach(h=>h.setAttribute('aria-pressed',String(h.dataset.leadEnd===selected.kind&&h.dataset.color===selected.color)));
 document.documentElement.dataset.meterCase=active;guide.refresh();
}
function invalidate({advance=true}={}){
 const complete=state.red&&state.black&&state.jack&&state.blackJack;
 if(complete)showReading(measure(active,state));
 else {const open=['continuity','ohm','diode'].includes(state.mode),missingJack=!state.jack||!state.blackJack;showReading({display:open?'OL':'—',unit:open?(state.mode==='diode'?'Diode':'Ω'):modeNames[state.mode],message:missingJack?'ปลั๊ก Banana ยังไม่เสียบครบ วงจรวัดจึงเปิดอยู่ ลากปลั๊กเข้าช่องมิเตอร์':state.mode==='off'?'เลือกโหมด แล้วลากปลายหัววัดแดง–ดำไปแตะจุดวัด':`หัววัด${!state.red&&!state.black?'ทั้งสอง':!state.red?'แดง':'ดำ'}ยังไม่แตะจุดวัด ค่าจะเปลี่ยนทันทีเมื่อแตะครบสองจุด`,severity:'ready',beep:false});}
 render();guide.refresh({advance:advance&&!scene.dataset.dragging});
}
function choose(kind,color){selected={kind,color};scene.querySelectorAll('[data-lead-end]').forEach(h=>h.setAttribute('aria-pressed',String(h.dataset.leadEnd===kind&&h.dataset.color===color)));}
function canMove(kind){if(state.power&&(kind==='jack'||state.jack==='ma'||state.blackJack==='ma')){feedback(kind==='jack'?'ตัดไฟก่อนถอดหรือย้ายปลั๊ก Banana ระหว่างช่องมิเตอร์':'ตัดไฟก่อนย้ายหัววัดในวงจรกระแส แล้วตรวจการต่อใหม่ก่อนเปิดไฟ','stop');return false;}return true;}
function pointList(kind){return kind==='jack'?meterJacks:getCase(active).points;}
function leadPosition(kind,color){return kind==='jack'?connectorPosition(state,color,connectors):positions[color];}
function updateCable(color){const start=jackTail(connectorPosition(state,color,connectors)),end=probeTail(color,positions[color]);scene.querySelector(`[data-probe-wire="${color}"] path`).setAttribute('d',curve(start,end));}
function moveLead(kind,color,tip,point){
 let occupied=false;
 if(kind==='jack'&&point&&jackFor(state,color==='red'?'black':'red')===point.id){point=null;occupied=true;}
 const location=point?{x:point.x,y:point.y}:tip,key=kind==='probe'?color:color==='red'?'jack':'blackJack',contact=point?.id||null;
 (kind==='probe'?positions:connectors)[color]=location;
 if(state[key]!==contact){state[key]=contact;invalidate();}
 else {const h=scene.querySelector(`[data-lead-end="${kind}"][data-color="${color}"]`);h.style.left=`${location.x/9}%`;h.style.top=`${location.y/4.1}%`;updateCable(color);guide.refresh();}
 if(occupied)feedback('ช่องนี้มีปลั๊กอีกเส้นเสียบอยู่ หนึ่งช่องรับได้หนึ่งปลั๊ก เลือกช่องว่างก่อน','notice');
}
const dragControl=bindProbeDrag(scene,{position:leadPosition,points:pointList,canMove,select:choose,move:moveLead,restore:(kind,color,tip)=>moveLead(kind,color,tip,nearestPoint(tip,pointList(kind),1)),settled:()=>guide.refresh({advance:true})});
function select(id){dragControl.cancel();guide.close({focus:false});positions=parkedProbes();connectors=parkedJacks();active=id;state=initialState(id);reading=null;selected={kind:'probe',color:'red'};const c=getCase(id);$('#mm-case-title').textContent=c.title;$('#mm-case-tag').textContent=c.tag;$('#mm-symptom').textContent=c.symptom;$('#mm-question').textContent=c.question;$('#mm-steps').innerHTML=c.steps.map(s=>`<li>${esc(s)}</li>`).join('');$('#mm-meaning').textContent=c.meaning;invalidate();}
for (const group of [$('#mm-cases'), $('.mm-feeder-path')]) {
 group.addEventListener('click', event => {
  const button = event.target.closest('[data-case]');
  if (button) select(button.dataset.case);
 });
}
$('#mm-case-select').addEventListener('change',e=>select(e.target.value));
$('#mm-modes').addEventListener('change',e=>{if(e.target.name!=='mode')return;if(state.power&&(e.target.value==='current'||state.mode==='current')){feedback('ตัดไฟก่อนสลับเข้า/ออกโหมดกระแส แล้วตรวจช่องสายแดงให้ถูกต้อง','stop');render();return;}state.mode=e.target.value;invalidate();});
$('#mm-power').addEventListener('change',e=>{state.power=e.target.checked;invalidate();});
$('#mm-fault').addEventListener('change',e=>{if(state.power){feedback('ตัดไฟก่อนเปลี่ยนการเดินสายหรืออุปกรณ์ในวงจร','stop');render();return;}state.fault=e.target.checked;invalidate();});
$('#mm-load').addEventListener('change',e=>{state.load=e.target.checked;invalidate();});
$('#mm-gap').addEventListener('change',e=>{if(state.power){feedback('ตัดไฟก่อนเปิด/ปิดช่องวงจร A–B','stop');render();return;}state.gapOpen=e.target.checked;invalidate();});
scene.addEventListener('click',e=>{const handle=e.target.closest('[data-lead-end]');if(handle){choose(handle.dataset.leadEnd,handle.dataset.color);return;}const kind=e.target.closest('[data-jack-target]')?'jack':e.target.closest('[data-point]')?'probe':null;if(!kind||kind!==selected.kind||!canMove(kind))return;const id=kind==='jack'?e.target.closest('[data-jack-target]').dataset.jackTarget:e.target.closest('[data-point]').dataset.point;const point=pointList(kind).find(p=>p.id===id);moveLead(kind,selected.color,point,point);});
$('#mm-guide').addEventListener('click',()=>guide.start());
$('#mm-clear').addEventListener('click',()=>{if(!canMove('probe'))return;state.red=null;state.black=null;positions=parkedProbes();invalidate({advance:false});});
$('#mm-reset').addEventListener('click',()=>{if(state.power){feedback('ตัดไฟก่อนเริ่มภาพใหม่ โดยเฉพาะเมื่อฟิวส์ช่องกระแสขาด','stop');return;}select(active);});
$('#mm-sound').addEventListener('change',e=>sound=e.target.checked);
window.addEventListener('pagehide',()=>audio?.close().catch(()=>{}));select(active);document.documentElement.dataset.multimeterReady='true';
