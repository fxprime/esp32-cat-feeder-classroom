export const parkedProbes=()=>({red:{x:305,y:120},black:{x:305,y:265}});
export const meterJacks=[{id:'ma',label:'mA · ฟิวส์ 200mA',x:70,y:330},{id:'com',label:'COM · จุดอ้างอิง',x:130,y:330},{id:'v',label:'VΩ · แรงดัน / Ω / Diode',x:195,y:330}];
export const parkedJacks=()=>({red:{x:270,y:340},black:{x:320,y:340}});
export const jackFor=(s,color)=>color==='red'?s.jack:s.blackJack;
export const connectorPosition=(s,color,positions)=>meterJacks.find(p=>p.id===jackFor(s,color))||positions[color];
export const clampTip=({x,y})=>({x:Math.max(45,Math.min(855,x)),y:Math.max(15,Math.min(325,y))});
export const clampJack=({x,y})=>({x:Math.max(28,Math.min(855,x)),y:Math.max(20,Math.min(365,y))});
export function nearestPoint(tip,points,radius=24){return points.reduce((best,p)=>{const distance=Math.hypot(tip.x-p.x,tip.y-p.y);return distance<=radius&&(!best||distance<best.distance)?{...p,distance}:best;},null);}
export function probeTail(color,tip){const angle=(color==='red'?22:-22)*Math.PI/180;return {x:tip.x-Math.sin(angle)*75,y:tip.y+Math.cos(angle)*75};}
export const jackTail=tip=>({x:tip.x,y:tip.y+30});
// The scene owns capture because its SVG and handles can be rebuilt on contact.
export function bindProbeDrag(scene,{position,points,canMove,select,move,restore,settled}){
 let drag=null,suppressClick=false;
 const local=e=>new DOMPoint(e.clientX,e.clientY).matrixTransform(scene.querySelector(':scope > svg').getScreenCTM().inverse());
 const radius=(e,kind)=>{const m=scene.querySelector(':scope > svg').getScreenCTM();return (kind==='jack'?18:e.pointerType==='touch'?27:22)/Math.hypot(m.a,m.b);};
 const clamp=(kind,tip)=>kind==='jack'?clampJack(tip):clampTip(tip);
 function update(e){
  if(!drag||e.pointerId!==drag.id)return;
  const p=local(e),tip=clamp(drag.kind,{x:p.x-drag.offset.x,y:p.y-drag.offset.y});
  drag.moved ||= Math.hypot(e.clientX-drag.start.x,e.clientY-drag.start.y)>3;
  if(!drag.moved)return;
  scene.dataset.dragging=`${drag.kind}-${drag.color}`;
  move(drag.kind,drag.color,tip,nearestPoint(tip,points(drag.kind),radius(e,drag.kind)));e.preventDefault();
 }
 scene.addEventListener('pointerdown',e=>{
  suppressClick=false;const handle=e.target.closest('[data-lead-end]');
  if(!handle||e.button!==0||!e.isPrimary||drag)return;
  const {leadEnd:kind,color}=handle.dataset;if(!canMove(kind,color))return;
  const p=local(e),tip={...position(kind,color)};select(kind,color);
  drag={id:e.pointerId,kind,color,tip,start:{x:e.clientX,y:e.clientY},offset:{x:p.x-tip.x,y:p.y-tip.y},moved:false};
  scene.setPointerCapture(e.pointerId);handle.focus({preventScroll:true});
 });
 scene.addEventListener('pointermove',update);
 function end(e,cancel=false){
  if(!drag||e.pointerId!==drag.id)return;const previous=drag;if(!cancel)update(e);
  drag=null;delete scene.dataset.dragging;
  if(previous.moved){suppressClick=!cancel;if(cancel)restore(previous.kind,previous.color,previous.tip);}
  if(scene.hasPointerCapture(e.pointerId))scene.releasePointerCapture(e.pointerId);settled?.();
 }
 scene.addEventListener('pointerup',e=>end(e));scene.addEventListener('pointercancel',e=>end(e,true));scene.addEventListener('lostpointercapture',e=>end(e,true));
 scene.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
 scene.addEventListener('keydown',e=>{
  const handle=e.target.closest('[data-lead-end]'),delta={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[e.key];
  if(!handle||!delta)return;e.preventDefault();e.stopPropagation();
  const {leadEnd:kind,color}=handle.dataset;if(!canMove(kind,color))return;
  const tip=position(kind,color),step=e.shiftKey?3:1,next=clamp(kind,{x:tip.x+delta[0]*step,y:tip.y+delta[1]*step});
  select(kind,color);move(kind,color,next,nearestPoint(next,points(kind),6));
  scene.querySelector(`[data-lead-end="${kind}"][data-color="${color}"]`)?.focus({preventScroll:true});settled?.();
 });
 return {cancel(){if(drag)end({pointerId:drag.id},true);}};
}
