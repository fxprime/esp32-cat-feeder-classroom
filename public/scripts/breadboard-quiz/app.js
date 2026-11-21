import {challenges, createLayout, connectionError, validateCircuit} from './model.js';
import {drawBench, wirePath, esc} from './drawing.js';
import {analyzeCircuit} from './analysis.js';
import {flowSVG,measurementHTML,mA} from './current-view.js';
import {sceneLayout,componentSVG,componentIds,leadIds,holePair,placementError,insertedWires,nearestPlacement,validPlacedState,ROWS} from './placement.js';
const $=s=>document.querySelector(s), root=$('#breadboard-quiz');
const storageKey='esp32-breadboard-quiz-v2';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const drafts=new Map();
let electrical=null,faultSignature='',flowPaused=false,flowOnScreen=true,flowObserver;
let poses={},selectedPart=null,partDrag=null;
let completed=[],current=0,wires=[],history=[],selected=null,pending=null,drag=null,serial=1,attempts=0,solved=false,review=false,nextTimer=null,svg,surface,layout,byId,quizVisible=false;
let splitRails=true;
try{
 const saved=JSON.parse(localStorage.getItem(storageKey));
 if([2,3].includes(saved?.version)&&Array.isArray(saved.completed)){
  for(const [index,challenge] of challenges.entries()){
   const item=saved.completed[index];
   const usedSplitRails=saved.version===3&&item?.splitRails!==false;
   if(item?.id!==challenge.id||!validateCircuit(item.wires,challenge.count,usedSplitRails)||!validPlacedState(item.poses,item.wires,challenge.count))break;
   completed.push({...item,splitRails:usedSplitRails});
  }
 }
}catch{}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({version:3,completed}));}catch{const note=$('#quiz-storage-note');if(note)note.textContent='เบราว์เซอร์นี้เก็บความคืบหน้าไม่ได้ ทำต่อในหน้านี้ได้ตามปกติ';}}
function say(message){$('#quiz-status').textContent=message;}
function clearTimer(){clearTimeout(nextTimer);nextTimer=null;}
function saveDraft(){
 if(!solved&&svg)drafts.set(current,{...stateCopy(),attempts,history});
}
function openCard(index){
 const offset=index<current?-24:24;
 current=index;
 review=Boolean(completed[index]);
 renderCard(offset);
}
function showMode(quiz){
 const wasQuizVisible=quizVisible;
 if(wasQuizVisible)saveDraft();
 quizVisible=quiz;root.hidden=!quiz;$('#breadboard-learn').classList.toggle('bb-mode-hidden',quiz);$('#breadboardLearnTools').classList.toggle('bb-mode-hidden',quiz);
 $('#breadboard-learn-tab').setAttribute('aria-pressed',String(!quiz));$('#breadboard-quiz-tab').setAttribute('aria-pressed',String(quiz));
 if(quiz){if(completed.length===challenges.length)showSummary();else openCard(completed.length);}
 else{clearTimer();cancelPointer();updateFlowMotion();if(wasQuizVisible)$('#breadboard-learn-tab').scrollIntoView({block:'start',behavior:'instant'});}
}
$('#breadboard-learn-tab').addEventListener('click',()=>showMode(false));
$('#breadboard-quiz-tab').addEventListener('click',()=>showMode(true));
$('#begin-breadboard-quiz').addEventListener('click',()=>{showMode(true);root.scrollIntoView({block:'start',behavior:'instant'});});
root.addEventListener('click',e=>{
 if(e.target.closest('[data-return-learn]'))showMode(false);
 const cardLink=e.target.closest('[data-open-quiz-card]');
 if(cardLink){saveDraft();openCard(Number(cardLink.dataset.openQuizCard));}
});
function backToLearn(){return '<button type="button" class="q-return-learn" data-return-learn>← กลับไปสำรวจ Breadboard</button>';}
function progress(){
 let quizLink='';
 if(current>0){
  quizLink=`<button type="button" class="q-return-learn" data-open-quiz-card="${current-1}">← ย้อนดู Quiz ${current}</button>`;
 }else if(review&&completed.length<challenges.length){
  quizLink=`<button type="button" class="q-return-learn" data-open-quiz-card="${completed.length}">กลับไปทำ Quiz ${completed.length+1} →</button>`;
 }
 const steps=challenges.map((_,i)=>`<span class="${completed[i]?'done':i===current?'current':''}" ${i===current?'aria-current="step"':''}>${completed[i]?'✓':i+1} <span>${i===0?'LED 1 ดวง':'LED หลายดวง'}</span></span>`).join('<i aria-hidden="true"></i>');
 return `<div class="q-quiz-nav"><div class="q-quiz-nav-actions">${backToLearn()}${quizLink}</div><div class="q-progress" role="group" aria-label="ความคืบหน้าแบบฝึกหัด">${steps}</div></div>`;
}
function renderCard(offset){
 clearTimer();cancelPointer(false);flowObserver?.disconnect();electrical=null;faultSignature='';const challenge=challenges[current];
 const saved=review?completed[current]:drafts.get(current);
 const canReturnToQuiz=completed.length<challenges.length;
 splitRails=!review||saved.splitRails!==false;
 wires=(saved?.wires||[]).map(w=>({...w}));
 poses=structuredClone(saved?.poses||{});
 history=review?[]:saved?.history||[];
 attempts=saved?.attempts||(review?1:0);
 selectedPart=null;partDrag=null;serial=1;selected=null;pending=null;solved=review;
 layout=sceneLayout(challenge.count,poses,null,splitRails);byId=new Map(layout.points.map(p=>[p.id,p]));
 root.innerHTML=`${progress()}<article class="q-card ${review?'q-solved':''}" id="quiz-card" aria-labelledby="quiz-card-title">
 <div class="q-card-head"><div><span class="q-eyebrow">WIRING CHALLENGE / CARD ${String(current+1).padStart(2,'0')}</span><h2 id="quiz-card-title" tabindex="-1">${esc(challenge.title)}</h2><p>${splitRails ? esc(challenge.prompt) : 'คำตอบที่บันทึกบนบอร์ดรุ่นเดิม ใช้รางไฟต่อเนื่องตลอดแถว'}</p></div><span class="q-parts-badge">${esc(challenge.parts)}</span></div>
 <div class="q-tools"><div><button id="quiz-part-rotate" disabled>หมุนอุปกรณ์ 90° · R</button><button id="quiz-part-unplug" disabled>ถอนกลับถาด</button><button id="quiz-undo">↶ ย้อนกลับ</button><button id="quiz-remove" disabled>ลบสายที่เลือก</button><button id="quiz-clear">เริ่มต่อข้อนี้ใหม่</button></div><div><label for="quiz-wire-color">สีสาย</label><select id="quiz-wire-color"><option value="#0b8b83">เขียว</option><option value="#da4f5f">แดง</option><option value="#416c9b">น้ำเงิน</option><option value="#bb812b">เหลือง</option><option value="#68717d">เทา</option></select><button id="quiz-fit" aria-pressed="false">พอดีจอ</button></div></div>
 <p class="q-instructions">ลากที่ตัว LED / ตัวต้านทาน แล้วปักขาทั้งสองลงรู · เลือกตัวแล้วกด R หรือปุ่มหมุน · สายจัมเปอร์ลากจากรูหนึ่งไปรูหนึ่ง <button id="quiz-help" aria-expanded="false">วิธีใช้คีย์บอร์ด</button></p>
 <p id="quiz-help-text" class="q-help" hidden>เลือกตัวอุปกรณ์แล้วกด R หมุน 90° ใช้ลูกศรเลื่อนอุปกรณ์ที่ปักแล้วทีละรู กด Delete ถอนอุปกรณ์ หรือใช้เมนูปักอุปกรณ์ด้านล่างโดยไม่ต้องลาก สายจัมเปอร์คลิกสองรูหรือเลือกจากช่องชื่อรูได้ Escape ยกเลิกการลาก</p>
 <section class="q-electrical" aria-label="ผลคำนวณวงจรที่คุณต่อ"><div class="q-electrical-head"><div><strong>ไฟจำลองเปิด · ดูกระแสจากสายที่คุณต่อ</strong><p>ลูกศรแสดงกระแสตามแบบแผน + → − · ภาพเคลื่อนไหวไม่ใช่ความเร็วอิเล็กตรอนจริง</p></div><button id="quiz-flow-toggle">หยุดภาพการไหล</button></div><div id="quiz-fault" role="alert" hidden></div><div id="quiz-readings"></div><details class="q-model-notes"><summary>ค่าคำนวณนี้มาจากอะไร?</summary><p>คำนวณ DC ด้วยกฎกระแสของ Kirchhoff: แหล่งจ่ายจำลอง 3.3V, R ภายใน 0.5Ω, จำกัดกระแส 100mA; สายแต่ละเส้น 0.1Ω; R 330Ω; LED สีแดงใช้แบบจำลอง Vf 2.0V + ความต้านทานไดนามิก 10Ω; แถบโลหะถือเป็นตัวนำอุดมคติ</p><p>เมื่อวงจรลัด แหล่งจ่ายจำลองจะลดแรงดันเพื่อรักษากระแสไม่เกิน 100mA ค่านี้เป็นสมมติฐานการสอน ไม่ใช่พิกัดป้องกันลัดวงจรของ ESP32 หรือค่าที่วัดจากอุปกรณ์จริง</p><p>LED จริงมี Vf ต่างกันตามรุ่น กระแส และอุณหภูมิ ดู <a href="https://learn.adafruit.com/all-about-leds?view=all" target="_blank" rel="noopener">หลักการคำนวณ LED / Ohm</a> และ <a href="https://www.rohde-schwarz.com/sg/products/test-and-measurement/essentials-test-equipment/dc-power-supplies/understanding-benchtop-power-supplies_256011.html" target="_blank" rel="noopener">แหล่งจ่าย CV / CC</a></p></details></section>
 <div id="quiz-scroll" class="q-stage-scroll">${drawBench(challenge.count,poses,splitRails)}</div>
 <details class="q-placement-menu"><summary>ปัก / หมุนอุปกรณ์โดยไม่ต้องลาก</summary><div class="q-select-connect"><label>อุปกรณ์<select id="quiz-part-pick"></select></label><label>รูสำหรับขาแรก<select id="quiz-part-anchor"></select></label><label>ทิศขาทั้งสอง<select id="quiz-part-angle"><option value="0">0° → ขวา</option><option value="90">90° ↓ ลง</option><option value="180">180° ← ซ้าย</option><option value="270">270° ↑ ขึ้น</option></select></label><button id="quiz-part-insert">ปักอุปกรณ์</button></div><p class="q-small">LED: ขาแรกคือ A+ · ตัวต้านทาน: ขาแรกคือขา 1 · ภาพเป็นแผนผังย่อ ไม่ใช่สเกลระยะจริง</p></details><details class="q-keyboard"><summary>ต่อสายจัมเปอร์ด้วยชื่อรู</summary><div class="q-select-connect"><label for="quiz-from">ต้นทาง<select id="quiz-from"></select></label><label for="quiz-to">ปลายทาง<select id="quiz-to"></select></label><button id="quiz-connect">ต่อสาย</button></div></details>
 <div class="q-card-bottom"><div><p id="quiz-status" role="status" aria-live="polite" aria-atomic="true">${review?'นี่คือวงจรที่คุณต่อผ่านแล้ว':'มีไฟที่รางบน + / − แล้ว เริ่มลาก LED / ตัวต้านทานมาปัก แล้วต่อสายจัมเปอร์ได้เลย'}</p><span id="quiz-wire-count" class="q-small"></span><span id="quiz-attempts" class="q-small"></span></div><button id="quiz-check" class="q-primary">${review?(canReturnToQuiz?`กลับไปทำ Quiz ${completed.length+1}`:'กลับผล Quiz'):'ตรวจวงจรที่ต่อ'}</button></div>
 <p class="q-small q-disclaimer">ค่ากระแสคำนวณจากแบบจำลอง · ${splitRails ? 'รางไฟแต่ละเส้นแยกซ้าย–ขวาที่รอยตัดกลาง' : 'รางไฟแต่ละเส้นต่อเนื่องตลอดแถว'} · รางบนกับรางล่างแยกกัน</p>
 </article><p id="quiz-storage-note" class="q-small">บันทึกเฉพาะข้อที่ผ่านบนอุปกรณ์นี้ · ไม่มีปุ่มเฉลยระหว่างทำ</p>`;
 svg=$('#quiz-bench-svg');surface=$('.q-bench-surface');
 const options=`<option value="">เลือกชื่อรู</option><optgroup label="รู breadboard">${layout.points.filter(p=>p.type==='hole'&&!p.locked).map(p=>`<option value="${p.id}">${esc(p.label)}</option>`).join('')}</optgroup>`;
 $('#quiz-from').innerHTML=options;$('#quiz-to').innerHTML=options;
 $('#quiz-part-pick').innerHTML=componentIds(challenge.count).map(id=>`<option value="${id}">${id.startsWith('L')?'LED':'R'} ${id.slice(1)}</option>`).join('');$('#quiz-part-anchor').innerHTML=options;
 $('#quiz-part-insert').addEventListener('click',()=>placePart($('#quiz-part-pick').value,$('#quiz-part-anchor').value,Number($('#quiz-part-angle').value)));
 $('#quiz-part-rotate').addEventListener('click',()=>rotatePart());$('#quiz-part-unplug').addEventListener('click',()=>unplugPart());
 $('#quiz-undo').addEventListener('click',()=>{if(history.length&&!solved){const previous=history.pop();wires=previous.wires;poses=previous.poses;selected=null;pending=null;paint();say('ย้อนการแก้ไขล่าสุดแล้ว');}});
 $('#quiz-remove').addEventListener('click',removeSelected);
 $('#quiz-clear').addEventListener('click',()=>{if(!solved&&(wires.length||Object.keys(poses).length)){remember();wires=[];poses={};selectedPart=null;selected=null;pending=null;paint();say('ล้างเฉพาะสายที่ต่อในข้อนี้แล้ว ไฟที่รางยังอยู่');}});
 $('#quiz-fit').addEventListener('click',()=>{const fit=$('#quiz-scroll').classList.toggle('q-fit');$('#quiz-fit').setAttribute('aria-pressed',String(fit));$('#quiz-fit').textContent=fit?'ขยายเพื่อต่อสาย':'พอดีจอ';});
 $('#quiz-help').addEventListener('click',()=>{const shown=$('#quiz-help-text').hidden;$('#quiz-help-text').hidden=!shown;$('#quiz-help').setAttribute('aria-expanded',String(shown));});
 $('#quiz-connect').addEventListener('click',()=>connect($('#quiz-from').value,$('#quiz-to').value));
 $('#quiz-check').addEventListener('click',()=>{
  if(!review)check();
  else if(canReturnToQuiz)openCard(completed.length);
  else showSummary();
 });
 $('#quiz-flow-toggle').addEventListener('click',()=>{flowPaused=!flowPaused;updateFlowMotion();});
 surface.addEventListener('pointerdown',pointerDown);surface.addEventListener('pointermove',pointerMove);surface.addEventListener('pointerup',pointerUp);surface.addEventListener('pointercancel',cancelPointer);surface.addEventListener('lostpointercapture',()=>{if(drag||partDrag)cancelPointer();});
 surface.addEventListener('keydown',keyboard);
 surface.addEventListener('click',e=>{const part=e.target.closest('[data-part]');if(part&&e.detail===0)selectPart(part.dataset.part);const node=e.target.closest('[data-node]');if(node&&e.detail===0)activate(node.dataset.node);});
 $('#quiz-wires').addEventListener('click',e=>{const el=e.target.closest('[data-wire]');if(el&&!solved){pending=null;selected=el.dataset.wire;paint();say('เลือกสายแล้ว กดลบสายที่เลือกหรือ Delete เพื่อลบ');}});
 paint();flowObserver=new IntersectionObserver(entries=>{flowOnScreen=entries[0]?.isIntersecting??true;updateFlowMotion();});flowObserver.observe($('#quiz-scroll'));root.scrollIntoView({block:'start',behavior:'instant'});$('#quiz-card-title').focus({preventScroll:true});
 if(!reduced.matches)$('#quiz-card').animate([{opacity:0,transform:`translateX(${offset}px)`},{opacity:1,transform:'translateX(0)'}],{duration:300,easing:'ease-out'});
}
function stateCopy(){return {wires:wires.map(w=>({...w})),poses:structuredClone(poses)};}
function remember(previous=stateCopy()){history.push(previous);if(history.length>100)history.shift();}
function color(){return $('#quiz-wire-color')?.value||'#0b8b83';}
function connect(from,to,existingId=null){
 if(solved)return false;
 if(byId.get(from)?.type==='leg'||byId.get(to)?.type==='leg'){say('ลากทั้งตัวอุปกรณ์เพื่อปักขาลงรู สายจัมเปอร์ใช้รูต่อรู');return false;}
 const error=connectionError(wires,from,to,challenges[current].count,existingId);
 if(error){say(error);return false;}
 remember();if(existingId){const wire=wires.find(w=>w.id===existingId);if(!wire)return false;wire.from=from;wire.to=to;selected=wire.id;}
 else {const id=`wire-${Date.now()}-${serial++}`;wires.push({id,from,to,color:color()});selected=id;}
 pending=null;selectedPart=null;paint();say(`ต่อ ${byId.get(from).label} กับ ${byId.get(to).label} แล้ว`);return true;
}
function paint(){
 const wireLayer=$('#quiz-wires');if(!wireLayer)return;syncScene();
 wireLayer.innerHTML=wires.filter(w=>!w.placement).map(w=>{const a=byId.get(w.from),b=byId.get(w.to),d=wirePath(a,b);return `<g data-wire="${esc(w.id)}" class="q-wire ${selected===w.id?'q-selected':''}"><title>${esc(a.label)} ↔ ${esc(b.label)}</title><path d="${d}" stroke="transparent" stroke-width="18" fill="none" class="q-wire-hit"/><path d="${d}" stroke="#fff" stroke-width="7" fill="none" pointer-events="none"/><path d="${d}" stroke="${/^#[0-9a-f]{6}$/i.test(w.color)?w.color:'#0b8b83'}" stroke-width="4" fill="none" pointer-events="none"/></g>`}).join('');
 for(const node of surface.querySelectorAll('[data-node]')){const id=node.dataset.node;node.classList.toggle('q-occupied',wires.some(w=>w.from===id||w.to===id));node.classList.toggle('q-pending',pending===id);node.setAttribute('aria-pressed',String(pending===id));const socket=svg.querySelector(`[data-socket="${id}"]`);socket.classList.toggle('q-occupied',node.classList.contains('q-occupied'));socket.classList.toggle('q-pending',pending===id);}
 $('#quiz-remove').disabled=!selected||solved;$('#quiz-undo').disabled=!history.length||solved;$('#quiz-clear').disabled=(!wires.length&&!Object.keys(poses).length)||solved;
 $('#quiz-wire-count').textContent=`${wires.filter(w=>!w.placement).length} สายจัมเปอร์ · ปัก ${Object.values(poses).filter(p=>p.anchor).length}/${challenges[current].count*2} อุปกรณ์`;$('#quiz-attempts').textContent=attempts?` · ตรวจแล้ว ${attempts} ครั้ง`:'';
 $('#quiz-part-rotate').disabled=!selectedPart||solved;$('#quiz-part-unplug').disabled=!selectedPart||!poses[selectedPart]?.anchor||solved;
 for(const id of ['quiz-from','quiz-to','quiz-connect','quiz-wire-color','quiz-part-pick','quiz-part-anchor','quiz-part-angle','quiz-part-insert'])$(`#${id}`).disabled=solved;
 $('#quiz-check').disabled=solved&&!review;
 const ghost=$('#quiz-ghost');if(ghost&&!drag)ghost.setAttribute('hidden','');
 updateElectrical();
}
function removeSelected(){if(!selected||solved)return;remember();wires=wires.filter(w=>w.id!==selected);selected=null;pending=null;paint();say('ลบสายที่เลือกแล้ว');}
function activate(id){
 if(solved)return;const p=byId.get(id);if(!p||p.locked){say('ช่องนี้มีสายไฟเลี้ยงเสียบอยู่แล้ว เลือกช่องอื่นในราง');return;}
 if(pending===id){pending=null;paint();say('ยกเลิกต้นทางแล้ว');return;}
 if(pending){const from=pending;if(!connect(from,id))paint();return;}
 const existing=wires.find(w=>w.from===id||w.to===id);
 if(existing?.placement){selectPart(existing.owner);say('รูนี้มีขาอุปกรณ์ปักอยู่ เลือกตัวอุปกรณ์เพื่อย้าย หรือใช้รูว่างบนแถบทองแดงเดียวกันต่อสาย');}
 else if(existing){selected=existing.id;paint();say('จุดนี้มีสายแล้ว ลากปลายสายเพื่อย้าย หรือกดลบสายที่เลือก');}
 else{pending=id;selected=null;paint();say(`เลือก ${p.label} แล้ว เลือกปลายทางที่จะต่อ`);}
}
function localPoint(e){const matrix=svg.getScreenCTM();if(!matrix)return null;return new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());}
function nearest(e){const pt=localPoint(e);if(!pt)return null;let best=null,min=19;for(const p of layout.points){const distance=Math.hypot(pt.x-p.x,pt.y-p.y);if(distance<min){best=p;min=distance;}}return best;}
function focusNode(id){for(const node of surface.querySelectorAll('[data-node]'))node.tabIndex=node.dataset.node===id?0:-1;surface.querySelector(`[data-node="${id}"]`)?.focus({preventScroll:true});}
function pointerDown(e){
 if(solved||e.button!==0||!e.isPrimary)return;const part=e.target.closest('[data-part]');if(part){startPartDrag(e,part);return;}const node=e.target.closest('[data-node]');if(!node)return;
 const id=node.dataset.node,p=byId.get(id);if(p.locked){activate(id);return;}
 e.preventDefault();focusNode(id);
 const existing=wires.find(w=>w.from===id||w.to===id);
 if(existing?.placement){activate(id);return;}
 drag={id,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false,existingId:existing?.id,from:existing?(byId.get(existing.from).type==='leg'?existing.from:byId.get(existing.to).type==='leg'?existing.to:existing.from===id?existing.to:existing.from):id,capture:node};
 drag.capture.setPointerCapture(e.pointerId);
}
function pointerMove(e){
 if(partDrag){movePartDrag(e);return;}
 if(!drag||e.pointerId!==drag.pointerId)return;
 if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>4)drag.moved=true;
 if(!drag.moved)return;
 const pt=localPoint(e);if(!pt)return;
 const snap=nearest(e),ghost=$('#quiz-ghost');ghost.removeAttribute('hidden');ghost.setAttribute('d',wirePath(byId.get(drag.from),snap||pt));ghost.setAttribute('stroke',color());
 svg.classList.add('q-dragging');surface.querySelectorAll('.q-drop-target').forEach(el=>el.classList.remove('q-drop-target'));
 if(snap&&!snap.locked)surface.querySelector(`[data-node="${snap.id}"]`)?.classList.add('q-drop-target');
 if(drag.existingId){const wire=[...$('#quiz-wires').children].find(el=>el.dataset.wire===drag.existingId);if(wire)wire.style.opacity='.2';}
}
function pointerUp(e){
 if(partDrag){endPartDrag(e);return;}
 if(!drag||e.pointerId!==drag.pointerId)return;const state=drag,target=nearest(e);drag=null;
 if(state.capture.hasPointerCapture(e.pointerId))state.capture.releasePointerCapture(e.pointerId);
 if(state.moved){pending=null;if(target)connect(state.from,target.id,state.existingId);else say('ยังไม่ได้เสียบปลายสาย เลือกรูแล้วลองใหม่');}
 else activate(state.id);
 cleanGhost();paint();
}
function cleanGhost(){if(!svg)return;svg.classList.remove('q-dragging');surface.querySelectorAll('.q-drop-target').forEach(el=>el.classList.remove('q-drop-target'));const ghost=$('#quiz-ghost');if(ghost)ghost.setAttribute('hidden','');}
function cancelPointer(repaint=true){if(partDrag)cancelPartDrag(false);const state=drag;drag=null;if(state?.capture.hasPointerCapture(state.pointerId))state.capture.releasePointerCapture(state.pointerId);cleanGhost();if(repaint!==false&&svg&&root.contains(svg))paint();}
function keyboard(e){
 const partHandle=e.target.closest('[data-part]');if(partHandle){partKeys(e,partHandle.dataset.part);return;}
 if(e.target.closest('input,select')||e.target.closest('button:not([data-node])'))return;
 const node=e.target.closest('[data-node]');
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();pending=null;selected=null;cancelPointer();paint();say('ยกเลิกการเลือกแล้ว');return;}
 if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeSelected();return;}
 if(!node)return;
 if(e.key==='Enter'||e.key===' ')return;
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
 e.preventDefault();e.stopPropagation();const at=byId.get(node.dataset.node),horizontal=e.key.includes('Left')||e.key.includes('Right'),positive=e.key.includes('Right')||e.key.includes('Down');
 const options=layout.points.filter(p=>p.type==='hole'&&!p.locked&&p.id!==at.id).map(p=>({p,along:horizontal?p.x-at.x:p.y-at.y,cross:horizontal?Math.abs(p.y-at.y):Math.abs(p.x-at.x)})).filter(v=>positive?v.along>1:v.along<-1).sort((a,b)=>(Math.abs(a.along)+a.cross*4)-(Math.abs(b.along)+b.cross*4));
 if(options.length)focusNode(options[0].p.id);
}

function syncScene(){
 layout=sceneLayout(challenges[current].count,poses,partDrag?.moved?partDrag.preview:null,splitRails);byId=new Map(layout.points.map(p=>[p.id,p]));
 for(const part of layout.parts){
  const old=svg.querySelector(`[data-physical="${part.id}"]`);
  if(!partDrag?.moved||partDrag.id===part.id){if(old)old.outerHTML=componentSVG(part);}
  const handle=surface.querySelector(`[data-part="${part.id}"]`);if(handle){handle.style.left=`${part.handle.x/11}%`;handle.style.top=`${part.handle.y/8.2}%`;handle.classList.toggle('q-part-selected',selectedPart===part.id);handle.setAttribute('aria-pressed',String(selectedPart===part.id));handle.disabled=solved;}
 }
 for(const p of layout.points.filter(p=>p.type==='leg')){const socket=svg.querySelector(`[data-socket="${p.id}"] .q-socket`);if(socket){socket.setAttribute('cx',p.x);socket.setAttribute('cy',p.y);}}
 surface.querySelectorAll('.q-fit-target,.q-fit-error').forEach(el=>el.classList.remove('q-fit-target','q-fit-error'));
 if(partDrag?.candidate?.pair)for(const point of partDrag.candidate.pair)surface.querySelector(`[data-node="${point.id}"]`)?.classList.add(partDrag.candidate.error?'q-fit-error':'q-fit-target');
}
function selectPart(id){if(solved)return;selectedPart=id;selected=null;pending=null;$('#quiz-part-pick').value=id;$('#quiz-part-angle').value=String(poses[id]?.rotation||0);paint();say(`เลือก ${id} แล้ว ลากตัวอุปกรณ์ หรือกด R / ปุ่มหมุน 90°`);}
function commitPart(id,anchor,rotation,previous=null){
 const error=placementError(id,anchor,rotation,challenges[current].count,wires);if(error){say(error);return false;}
 remember(previous||stateCopy());wires=wires.filter(w=>w.owner!==id);wires.push(...insertedWires(id,anchor,rotation,challenges[current].count));poses[id]={anchor,rotation};$('#quiz-part-pick').value=id;$('#quiz-part-angle').value=String(rotation);$('#quiz-part-anchor').value=anchor;selectedPart=id;selected=null;pending=null;paint();say(`ปัก ${id} ที่ ${holePair(id,anchor,rotation,challenges[current].count).map(p=>p.id).join(' / ')} แล้ว`);return true;
}
function placePart(id,anchor,rotation){if(!solved)commitPart(id,anchor,rotation);}
function rotatePart(id=selectedPart){
 if(!id||solved)return;
 if(partDrag){partDrag.rotation=(partDrag.rotation+90)%360;movePartDrag(partDrag.lastEvent);return;}
 const rotation=((poses[id]?.rotation||0)+90)%360;
 if(poses[id]?.anchor){commitPart(id,poses[id].anchor,rotation);}
 else{remember();poses[id]={rotation};selectedPart=id;$('#quiz-part-angle').value=String(rotation);paint();say(`หมุน ${id} เป็น ${rotation}° แล้ว ลากไปปักบนบอร์ดได้`);}
}
function unplugPart(id=selectedPart){if(!id||solved)return;remember();wires=wires.filter(w=>w.owner!==id);poses[id]={rotation:poses[id]?.rotation||0};selectedPart=id;paint();say(`ถอน ${id} กลับถาดแล้ว สายจัมเปอร์เดิมยังอยู่`);}
function startPartDrag(e,handle){
 e.preventDefault();selectedPart=handle.dataset.part;selected=null;pending=null;const part=layout.parts.find(p=>p.id===selectedPart),pt=localPoint(e);
 handle.focus({preventScroll:true});partDrag={id:selectedPart,pointerId:e.pointerId,capture:handle,startX:e.clientX,startY:e.clientY,offset:{x:pt.x-part.a.x,y:pt.y-part.a.y},rotation:part.rotation,previous:stateCopy(),moved:false,lastEvent:e};handle.setPointerCapture(e.pointerId);
 $('#quiz-part-pick').value=selectedPart;$('#quiz-part-rotate').disabled=false;$('#quiz-part-unplug').disabled=!poses[selectedPart]?.anchor;
}
function movePartDrag(e){
 const d=partDrag;if(!d||!e||e.pointerId!==d.pointerId)return;d.lastEvent=e;
 if(!d.moved&&Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<4)return;
 const pt=localPoint(e),a={x:Math.max(20,Math.min(1080,pt.x-d.offset.x)),y:Math.max(80,Math.min(795,pt.y-d.offset.y))};
 if(!d.moved){d.moved=true;wires=wires.filter(w=>w.owner!==d.id);poses[d.id]={rotation:d.rotation};}
 d.candidate=nearestPlacement(d.id,a,d.rotation,challenges[current].count,wires);
 let b;const vertical=d.rotation===90||d.rotation===270,sign=d.rotation===180||d.rotation===270?-1:1,span=d.id.startsWith('L')?1:3;
 if(d.candidate?.pair&&!d.candidate.error){d.preview={id:d.id,rotation:d.rotation,a:d.candidate.pair[0],b:d.candidate.pair[1]};}
 else{b={x:a.x+(vertical?0:44*span*sign),y:a.y+(vertical?24*span*sign:0)};d.preview={id:d.id,rotation:d.rotation,a,b};}
 surface.classList.add('q-moving-part');syncScene();
 // Only the first lift changes electrical topology; pointer moves just draw.
 if(!d.electricalDetached){d.electricalDetached=true;paint();}
}
function endPartDrag(e){
 const d=partDrag;if(!d||e.pointerId!==d.pointerId)return;partDrag=null;if(d.capture.hasPointerCapture(e.pointerId))d.capture.releasePointerCapture(e.pointerId);surface.classList.remove('q-moving-part');
 if(!d.moved){selectPart(d.id);return;}
 if(d.candidate&&!d.candidate.error&&commitPart(d.id,d.candidate.anchor,d.rotation,d.previous))return;
 wires=d.previous.wires;poses=d.previous.poses;paint();say(d.candidate?.error||'ขาทั้งสองยังไม่ตรงรู คืนตำแหน่งเดิมแล้ว ลองลากใหม่');
}
function cancelPartDrag(repaint=true){const d=partDrag;if(!d)return;partDrag=null;if(d.capture.hasPointerCapture(d.pointerId))d.capture.releasePointerCapture(d.pointerId);wires=d.previous.wires;poses=d.previous.poses;surface?.classList.remove('q-moving-part');if(repaint&&root.contains(svg))paint();}
function partKeys(e,id){
 if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();selectPart(id);return;}
 if(e.key.toLowerCase()==='r'){e.preventDefault();e.stopPropagation();rotatePart(id);return;}
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancelPartDrag();return;}
 if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();unplugPart(id);return;}
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||!poses[id]?.anchor)return;
 e.preventDefault();e.stopPropagation();const match=/^(BP|BN|[PNA-J])(\d+)$/.exec(poses[id].anchor),row=ROWS.indexOf(match[1]),col=Number(match[2]);
 const nextRow=row+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0),nextCol=col+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0);
 if(ROWS[nextRow]&&nextCol>=1&&nextCol<=18)commitPart(id,`${ROWS[nextRow]}${nextCol}`,poses[id].rotation);
}

function shakeCircuit(){
 if(reduced.matches||!surface||!quizVisible)return;
 surface.getAnimations().forEach(a=>a.cancel());
 surface.animate([{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}],{duration:420,iterations:2,easing:'ease-in-out'});
}
function updateFlowMotion(){
 if(!surface)return;
 const running=quizVisible&&!flowPaused&&!reduced.matches&&!document.hidden&&flowOnScreen;
 surface.classList.toggle('q-flow-running',running);
 const button=$('#quiz-flow-toggle');if(button){button.disabled=reduced.matches;button.textContent=reduced.matches?'ลดการเคลื่อนไหวตามระบบ':flowPaused?'เล่นภาพการไหล':'หยุดภาพการไหล';}
}
function updateElectrical(){
 if(!$('#quiz-readings')||!svg)return;
 try{electrical=analyzeCircuit(wires,challenges[current].count,splitRails);}catch{$('#quiz-readings').textContent='ไม่สามารถคำนวณวงจรนี้ได้ กรุณาปรับการต่อแล้วลองใหม่';return;}
 $('#quiz-readings').innerHTML=measurementHTML(electrical);
 $('#quiz-source-i').textContent=`${mA(electrical.totalCurrent)} mA`;$('#quiz-source-v').textContent=`${electrical.railVoltage.toFixed(2)} V`;
 $('#quiz-current-paths').innerHTML=flowSVG(electrical,challenges[current].count,poses,splitRails);
 const shortIds=new Set(electrical.shortWireIds);
 for(const wire of $('#quiz-wires').children)wire.classList.toggle('q-fault',shortIds.has(wire.dataset.wire));
 $('#quiz-card').classList.toggle('q-shorted',electrical.shortCircuit);
 $('#quiz-card').classList.toggle('q-led-overcurrent',electrical.overcurrent.length>0);
 const banner=$('#quiz-fault');
 const message=electrical.shortCircuit?`ลัดวงจร! พบสายเชื่อมราง + กับ GND โดยไม่ผ่านโหลด · กระแส ${mA(electrical.totalCurrent)} mA · แหล่งจ่ายจำลองกำลังจำกัดกระแส แรงดันรางเหลือ ${electrical.railVoltage.toFixed(2)} V`:electrical.overcurrent.length?`ระวัง ${electrical.overcurrent.join(', ')} มีกระแสเกิน 20mA ในแบบจำลอง ตรวจการจำกัดกระแสก่อนทดลองจริง`:'';
 banner.hidden=!message;if(banner.textContent!==message)banner.textContent=message;
 const signature=electrical.shortCircuit?electrical.shortWireIds.slice().sort().join('|'):'';
 if(signature&&signature!==faultSignature)shakeCircuit();faultSignature=signature;
 for(const led of electrical.leds){const group=svg.querySelector(`[data-led="${led.id.slice(1)}"]`);if(!group)continue;const lit=led.current>0.0001;group.querySelector('.q-led-dome').setAttribute('fill',lit?'#fb5b58':'#d8b6b6');group.querySelector('.q-led-halo').setAttribute('opacity',lit?String(Math.min(.35,.08+led.current*30)):'0');}
 updateFlowMotion();
}
function check(){
 if(solved)return;attempts++;
 if(!validPlacedState(poses,wires,challenges[current].count)||!validateCircuit(wires,challenges[current].count)){selected=null;paint();if(electrical?.shortCircuit)shakeCircuit();say(electrical?.shortCircuit?'ยังไม่ผ่าน: วงจรที่ต่อมีเส้นทางลัดวงจรสีแดง ลองแก้การต่อแล้วตรวจใหม่':'ยังไม่ผ่าน ลองปรับวงจรแล้วตรวจอีกครั้งได้ ภาพกระแสแสดงเฉพาะวงจรที่คุณต่อ ไม่ใช่วงจรเฉลย');$('#quiz-card').classList.add('q-tried');return;}
 solved=true;pending=null;selected=null;cancelPointer();paint();$('#quiz-card').classList.add('q-solved');
 drafts.delete(current);completed[current]={id:challenges[current].id,wires:wires.map(w=>({...w})),poses:structuredClone(poses),attempts};persist();
 say(`ถูกต้อง! ${challenges[current].success} ${current+1<challenges.length?'กำลังเลื่อนไปการ์ดถัดไป…':'ทำครบแล้ว กำลังสรุปผล…'}`);
 $('#quiz-check').textContent='ผ่านแล้ว ✓';
 const advance=()=>{if(!quizVisible)return;if(current+1<challenges.length)openCard(current+1);else showSummary();};
 nextTimer=setTimeout(advance,2000);
}
function showSummary(){
 clearTimer();cancelPointer(false);flowObserver?.disconnect();review=false;solved=true;
 root.innerHTML=`${backToLearn()}<section class="q-summary"><span class="q-eyebrow">BREADBOARD QUIZ / COMPLETED</span><div class="q-complete-icon" aria-hidden="true">✓</div><h2 id="quiz-summary-title" tabindex="-1">ต่อวงจรผ่านครบ 2 การ์ดแล้ว</h2><p>คุณต่อ LED ดวงเดียวและ LED หลายดวงจากไฟ 3.3V ได้แล้ว</p><div class="q-summary-cards">${challenges.map((c,i)=>`<button data-review="${i}"><span>✓ การ์ด ${i+1}</span><strong>${esc(c.title)}</strong><small>ดูวงจรที่ฉันต่อผ่านแล้ว ↗</small></button>`).join('')}</div><button id="quiz-restart" class="q-primary">เริ่มทำ Quiz ใหม่</button><p class="q-small">ดูเส้นทางและค่ากระแสที่คำนวณของวงจรที่คุณต่อได้ในแต่ละการ์ด ค่านี้ขึ้นกับสมมติฐานของแบบจำลอง</p></section>`;
 root.querySelectorAll('[data-review]').forEach(b=>b.addEventListener('click',()=>openCard(Number(b.dataset.review))));
 $('#quiz-restart').addEventListener('click',()=>{completed=[];drafts.clear();persist();openCard(0);});
 root.scrollIntoView({block:'start',behavior:'instant'});$('#quiz-summary-title').focus({preventScroll:true});
}
window.addEventListener('pagehide',()=>{clearTimer();cancelPointer();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelPointer();updateFlowMotion();});
reduced.addEventListener('change',()=>{if(reduced.matches)surface?.getAnimations().forEach(a=>a.cancel());updateFlowMotion();});
// Start with the breadboard lesson, including when an old link has ?quiz=1.
showMode(false);
