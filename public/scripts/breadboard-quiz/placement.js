import {createLayout} from './model.js';
export const ROWS=['P','N',...'ABCDEFGHIJ','BP','BN'];
export function componentIds(count){return Array.from({length:count},(_,i)=>[`L${i+1}`,`R${i+1}`]).flat();}
export function leadIds(id){return id.startsWith('L')?[`${id}.A`,`${id}.K`]:[`${id}.1`,`${id}.2`];}
export function holePair(id,anchor,rotation,count){
 const match=/^(BP|BN|[PNA-J])(\d+)$/.exec(anchor||'');if(!match||![0,90,180,270].includes(rotation))return null;
 const row=ROWS.indexOf(match[1]),col=Number(match[2]),span=id.startsWith('L')?1:3;
 const nr=row+(rotation===90?span:rotation===270?-span:0),nc=col+(rotation===0?span:rotation===180?-span:0);
 if(nr<0||nr>=ROWS.length||nc<1||nc>18)return null;
 const points=createLayout(count).points,first=points.find(p=>p.id===anchor),second=points.find(p=>p.id===`${ROWS[nr]}${nc}`);
 return first&&second?[first,second]:null;
}
export function placementError(id,anchor,rotation,count,wires){
 if(!componentIds(count).includes(id))return 'เลือกอุปกรณ์ก่อน';
 const pair=holePair(id,anchor,rotation,count);if(!pair)return 'ปลายขาทั้งสองต้องลงรูที่อยู่บนบอร์ด';
 if(pair.some(p=>p.locked))return 'ช่องนี้มีสายไฟเลี้ยงเสียบอยู่แล้ว';
 const others=wires.filter(w=>w.owner!==id);
 if(pair.some(p=>others.some(w=>w.from===p.id||w.to===p.id)))return 'มีขาหรือสายอื่นอยู่ในรูนี้ เลื่อนหาช่องว่างสำหรับขาทั้งสอง';
 return null;
}
export function insertedWires(id,anchor,rotation,count){
 const pair=holePair(id,anchor,rotation,count);if(!pair)return [];
 return leadIds(id).map((from,i)=>({id:`pin-${id}-${i}`,from,to:pair[i].id,owner:id,placement:true,color:'#77857e'}));
}
export function partsFor(count,poses={},preview=null){
 const base=createLayout(count);
 return componentIds(count).map(id=>{
  const index=Number(id.slice(1)),pair=base.pairs[index-1],pose=poses[id]||{},rotation=preview?.id===id?preview.rotation:pose.rotation||0;
  const snapped=pose.anchor?holePair(id,pose.anchor,rotation,count):null;
  let a,b;
  if(preview?.id===id){a=preview.a;b=preview.b;}
  else if(snapped){[a,b]=snapped;}
  else {
   const span=id.startsWith('L')?44:132;
   a={x:id.startsWith('L')?pair.ledX-22:pair.rX-66,y:id.startsWith('L')?221:195};
   const vertical=rotation===90||rotation===270,dir=rotation===180||rotation===270?-1:1;
   b={x:a.x+(vertical?0:span*dir),y:a.y+(vertical?(id.startsWith('L')?24:72)*dir:0)};
  }
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
  const handle=id.startsWith('L')?{x:cx+dy/length*40,y:cy-dx/length*40}:{x:cx,y:cy};
  return {id,type:id[0],index,rotation,a,b,cx,cy,angle,length,handle,placed:!!snapped,preview:preview?.id===id};
 });
}
export function sceneLayout(count,poses={},preview=null,splitRails=true){
 const base=createLayout(count,splitRails),parts=partsFor(count,poses,preview),locations=new Map();
 for(const part of parts){const ids=leadIds(part.id);locations.set(ids[0],part.a);locations.set(ids[1],part.b);}
 return {...base,parts,points:base.points.map(p=>locations.has(p.id)?{...p,x:locations.get(p.id).x,y:locations.get(p.id).y}:p)};
}
export function nearestPlacement(id,point,rotation,count,wires){
 const holes=createLayout(count).points.filter(p=>p.type==='hole');
 const nearest=holes.map(p=>({p,d:Math.hypot(p.x-point.x,p.y-point.y)})).sort((a,b)=>a.d-b.d)[0];
 if(!nearest||nearest.d>24)return null;
 const pair=holePair(id,nearest.p.id,rotation,count);
 return {anchor:nearest.p.id,pair,error:placementError(id,nearest.p.id,rotation,count,wires)};
}
export function validPlacedState(poses,wires,count){
 for(const id of componentIds(count)){
  const pose=poses?.[id];if(!pose?.anchor||placementError(id,pose.anchor,pose.rotation,count,wires))return false;
  const required=insertedWires(id,pose.anchor,pose.rotation,count);
  if(!required.every(pin=>wires.some(w=>w.placement&&w.owner===id&&w.from===pin.from&&w.to===pin.to)))return false;
 }
 return true;
}
export function componentCurrentPoints(part){
 const toWorld=(x,y)=>{const angle=part.angle*Math.PI/180;return {x:part.cx+x*Math.cos(angle)-y*Math.sin(angle),y:part.cy+x*Math.sin(angle)+y*Math.cos(angle)};};
 return part.type==='L'?[part.a,toWorld(-10,-22),toWorld(0,-48),toWorld(10,-22),part.b]:[part.a,part.b];
}
export function componentSVG(part){
 const name=part.type==='L'?`LED ${part.index}`:`R ${part.index} · 330Ω`;
 const core=part.type==='L'?`<circle class="q-led-halo" cx="0" cy="-42" r="35" fill="#ff7970" opacity="0"/><path d="M${-part.length/2} 0L-10 -22M10 -22L${part.length/2} 0" stroke="#78868b" stroke-width="4" fill="none"/><path class="q-led-dome" d="M-18 -22V-42a18 18 0 0 1 36 0v20Z" fill="#d8b6b6" stroke="#b87777" stroke-width="2"/><rect x="-22" y="-25" width="44" height="7" rx="3" fill="#ba7f7c"/>`:`<path d="M${-part.length/2} 0H${part.length/2}" stroke="#78868b" stroke-width="4"/><rect x="-25" y="-11" width="50" height="22" rx="7" fill="#ecd3a8" stroke="#ad8a56" stroke-width="2"/><path d="M-16 -10v20M-6 -10v20" stroke="#dc702c" stroke-width="5"/><path d="M6 -10v20" stroke="#71422b" stroke-width="5"/><path d="M18 -10v20" stroke="#b9a055" stroke-width="3"/>`;
 return `<g id="part-${part.id}" class="q-physical-part ${part.type==='L'?'quiz-led':''}" ${part.type==='L'?`data-led="${part.index}"`:''} data-physical="${part.id}"><g transform="translate(${part.cx} ${part.cy}) rotate(${part.angle})">${core}</g><text x="${part.handle.x}" y="${part.handle.y-38}" text-anchor="middle" class="q-part-name">${name}</text><text x="${part.a.x-9}" y="${part.a.y+17}" class="q-leg-label">${part.type==='L'?'A+':'1'}</text><text x="${part.b.x+4}" y="${part.b.y+17}" class="q-leg-label">${part.type==='L'?'K−':'2'}</text></g>`;
}
