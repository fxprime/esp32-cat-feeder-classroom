import {getCase} from './model.js';
import {modeNames} from './cases.js';
export function guideSteps(id){
 const c=getCase(id),port=c.mode==='current'?'ma':'v',label=port==='ma'?'mA':'VΩ';
 const steps=[
  {id:'power-off',target:'#mm-power',title:'ปิดไฟก่อนจัดสาย',message:'ปิดสวิตช์ไฟวงจร ในงานจริงต้องถอด USB และแหล่งจ่ายทุกทางก่อนย้ายช่องเสียบหรือเปิดทางวงจร',done:s=>!s.power},
  {id:'black-jack',source:'[data-banana-handle="black"]',target:'[data-jack-target="com"]',title:'สายดำเสียบ COM',message:'ปลั๊ก Banana คือปลายสายฝั่งมิเตอร์ ลากปลั๊กดำเข้าช่อง COM เพื่อใช้เป็นจุดอ้างอิง ถ้าอยู่ช่องนี้แล้วให้ไปขั้นถัดไป',done:s=>s.blackJack==='com'},
  {id:'red-jack',source:'[data-banana-handle="red"]',target:`[data-jack-target="${port}"]`,title:`สายแดงเสียบ ${label}`,message:port==='ma'?'ลากปลั๊กแดงจาก VΩ ไป mA ตัวอย่างนี้ใช้โหลด 5mA ที่ทราบพิกัด และช่อง mA ในภาพมีฟิวส์ 200mA':'ลากปลั๊กแดงเข้าช่อง VΩ ช่องนี้ใช้วัดแรงดัน ความต้านทาน Continuity และ Diode',done:s=>s.jack===port},
  {id:'mode',target:`input[name="mode"][value="${c.mode}"]`,title:`เลือกโหมด ${modeNames[c.mode]}`,message:`กดเลือก ${modeNames[c.mode]} ที่แผงโหมดวัด ช่องเสียบอย่างเดียวไม่ได้กำหนดว่าจะวัดอะไร`,done:s=>s.mode===c.mode}
 ];
 if(id==='current')steps.push({id:'gap',target:'#mm-gap',title:'เปิดทางให้กระแสผ่านมิเตอร์',message:'ขณะปิดไฟ ให้เปิดช่อง A–B เพื่อแทรกมิเตอร์อนุกรม กระแสที่เข้าโหลดต้องไหลผ่านมิเตอร์ด้วย',done:s=>s.gapOpen});
 for(const [color,point] of [['black',c.pair[1]],['red',c.pair[0]]])steps.push({id:`${color}-tip`,source:`[data-probe-handle="${color}"]`,target:`[data-point="${point}"]`,title:`หัววัด${color==='red'?'แดง':'ดำ'}แตะ ${point}`,message:`ลากด้ามหัววัด${color==='red'?'แดง':'ดำ'}ให้ปลายโลหะแตะจุด ${point} (${c.points.find(p=>p.id===point).label}) จุดสัมผัสจะขึ้นสีเขียว สายอีกด้านต้องยังเสียบมิเตอร์อยู่`,done:s=>s[color]===point});
 if(!c.unpowered)steps.push({id:'power-on',target:'#mm-power',title:'ตรวจสายแล้วเปิดไฟ',message:id==='current'?'แดงอยู่ A ดำอยู่ B และมีช่องเปิด A–B แล้ว จึงเปิดไฟ อ่านประมาณ 5mA ห้ามย้ายหัววัดหรือปลั๊กขณะมีไฟ':'หัววัดแตะสองจุดแล้ว เปิดไฟวงจรเพื่ออ่านความต่างศักย์ ค่าจะขึ้นทันทีโดยไม่ต้องกดปุ่มวัด',done:s=>s.power});
 if(id==='drop')steps.push({id:'load',target:'#mm-load',title:'ให้โหลดเริ่มทำงาน',message:'ดูค่าที่ปลายสายก่อน แล้วเปิดให้โหลดทำงาน ถ้าค่าลดลง ให้เทียบกับต้นสายเพื่อไล่หาจุดที่แรงดันตก',done:s=>s.load});
 steps.push({id:'read',target:'#mm-display',title:'อ่านค่าและหน่วย',message:`${c.meaning}${id==='current'?' เมื่อวัดเสร็จให้ปิดไฟ แล้วย้ายปลั๊กแดงกลับ VΩ':''}`,done:(s,r)=>['ok','notice'].includes(r?.severity)&&s.jack===port&&s.blackJack==='com'&&s.red===c.pair[0]&&s.black===c.pair[1]&&(id!=='drop'||s.load)});
 return steps;
}
export function createMeterGuide({getState,getReading,getId}){
 const balloon=document.querySelector('#mm-tour'),title=document.querySelector('#mm-tour-title'),message=document.querySelector('#mm-tour-message'),status=document.querySelector('#mm-tour-status'),count=document.querySelector('#mm-tour-count'),next=document.querySelector('#mm-tour-next'),back=document.querySelector('#mm-tour-back'),trigger=document.querySelector('#mm-guide');
 const native='popover' in HTMLElement.prototype;
 if(!native)balloon.removeAttribute('popover');
 let active=false,index=0,target=null,steps=[],frame=0;
 function position(){
  if(!active||!target?.isConnected)return;
  const r=target.getBoundingClientRect(),w=balloon.offsetWidth,h=balloon.offsetHeight,gap=16,pad=12,vw=document.documentElement.clientWidth,vh=window.innerHeight;
  const source=document.querySelector(steps[index].source||'__no_source__');
  const avoid=[r,...(source?[source.getBoundingClientRect()]:[])];
  if(steps[index].id.endsWith('-jack'))avoid.push(...[...document.querySelectorAll('[data-banana-handle],[data-jack-target]')].map(el=>el.getBoundingClientRect()));
  const candidates=[{side:'right',left:r.right+gap,top:r.top},{side:'left',left:r.left-gap-w,top:r.top},{side:'top',left:r.left+r.width/2-w/2,top:r.top-gap-h},{side:'bottom',left:r.left+r.width/2-w/2,top:r.bottom+gap}].map((p,order)=>{
   const left=Math.max(pad,Math.min(vw-w-pad,p.left)),top=Math.max(pad,Math.min(vh-h-pad,p.top));
   const overlap=avoid.reduce((sum,a)=>sum+Math.max(0,Math.min(left+w,a.right+8)-Math.max(left,a.left-8))*Math.max(0,Math.min(top+h,a.bottom+8)-Math.max(top,a.top-8)),0);
   return {...p,left,top,score:overlap*100+Math.abs(left-p.left)+Math.abs(top-p.top)+order};
  });
  const {side,left,top}=candidates.sort((a,b)=>a.score-b.score)[0];
  balloon.dataset.side=side;balloon.dataset.nativeAnchor=String((side==='right'&&left===r.right+gap||side==='left'&&left===r.left-gap-w)&&top===Math.max(pad,Math.min(vh-h-pad,r.top)));
  balloon.style.setProperty('--guide-left',`${left}px`);balloon.style.setProperty('--guide-top',`${top}px`);
  balloon.style.setProperty('--guide-width',`${w}px`);balloon.style.setProperty('--guide-height',`${h}px`);
  balloon.style.setProperty('--guide-tip',`${side==='right'||side==='left'?Math.max(20,Math.min(h-20,r.top+r.height/2-top)):Math.max(20,Math.min(w-20,r.left+r.width/2-left))}px`);
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(position);}
 function paint({scroll=false}={}){
  if(!active)return;
  target?.removeAttribute('data-guide-target');const step=steps[index];target=document.querySelector(step.target);target?.setAttribute('data-guide-target','true');
  const done=step.done(getState(),getReading());
  title.textContent=step.title;message.textContent=step.message;count.textContent=`Guide · ขั้น ${index+1} / ${steps.length}`;
  status.textContent=done?'ทำขั้นนี้แล้ว':index===steps.length-1?'ตรวจโหมด ช่องเสียบ และตำแหน่งหัววัดอีกครั้ง':'ลองทำตามที่ชี้ คำแนะนำจะไปขั้นถัดไปเมื่อทำสำเร็จ';
  next.disabled=!done;next.textContent=index===steps.length-1?'จบ Guide':'ถัดไป';back.disabled=index===0;
  if(scroll)target?.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
  position();schedule();
 }
 function close({focus=true}={}){if(!active)return;active=false;target?.removeAttribute('data-guide-target');target=null;if(native&&balloon.matches(':popover-open'))balloon.hidePopover();balloon.hidden=true;trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus({preventScroll:true});cancelAnimationFrame(frame);}
 function start(){if(active){close();return;}steps=guideSteps(getId());index=0;active=true;balloon.hidden=false;if(native)balloon.showPopover();trigger.setAttribute('aria-expanded','true');paint({scroll:true});document.querySelector('#mm-tour-close').focus({preventScroll:true});}
 function refresh({advance=false}={}){if(!active)return;if(advance&&index<steps.length-1&&steps[index].done(getState(),getReading())){index++;paint({scroll:true});}else paint();}
 next.addEventListener('click',()=>{if(next.disabled)return;if(index===steps.length-1){close();return;}index++;paint({scroll:true});});
 back.addEventListener('click',()=>{if(index>0){index--;paint({scroll:true});}});
 document.querySelector('#mm-tour-close').addEventListener('click',()=>close());
 document.addEventListener('keydown',e=>{if(active&&e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}},true);
 document.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);
 // Native CSS anchors are an enhancement; the rectangle placement above tethers older engines.
 new ResizeObserver(schedule).observe(balloon);
 return {start,close,refresh};
}
