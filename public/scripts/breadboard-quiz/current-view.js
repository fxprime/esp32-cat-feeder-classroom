import {sceneLayout,componentCurrentPoints} from './placement.js';
import {wirePath,esc} from './drawing.js';
const normal='#078878',danger='#da354b',warning='#ba791a';
const line=points=>'M'+points.map(p=>`${p.x} ${p.y}`).join(' L');
export const mA=value=>(Math.abs(value)*1000).toFixed(2);
export function flowSVG(report,count,poses={}){
 const layout=sceneLayout(count,poses),points=new Map(layout.points.map(p=>[p.id,p]));
 const shortIds=new Set(report.shortWireIds), paths=[];
 function add(d,current,label,color=normal){
  if(Math.abs(current)<report.model.visibleCurrent)return;
  const marker=color===danger?'fault':color===warning?'warning':'normal';
  paths.push(`<g class="q-current-path"><title>${esc(label)} · ${mA(current)} mA</title><path d="${d}" class="q-current-track" stroke="${color}" marker-end="url(#q-arrow-${marker})"/><path d="${d}" class="q-current-motion" stroke="${color}"/></g>`);
 }
 for(const w of report.wires.filter(w=>!w.placement)){const a=points.get(w.current>=0?w.from:w.to),b=points.get(w.current>=0?w.to:w.from);add(wirePath(a,b),w.current,`${points.get(w.from).label} ↔ ${points.get(w.to).label}`,shortIds.has(w.id)?danger:normal);}
 for(const c of report.copper){const pair=c.current>=0?[c.from,c.to]:[c.to,c.from];add(line(pair),c.current,'กระแสในแถบโลหะ breadboard',report.shortCircuit?danger:normal);}
 for(const part of layout.parts){
  const edge=(part.type==='L'?report.leds:report.resistors).find(e=>e.id===part.id);
  let coords=componentCurrentPoints(part);if(edge.current<0)coords.reverse();
  add(line(coords),edge.current,part.id,report.overcurrent.includes(part.id)?warning:normal);
 }

 add('M97 353H111V326H180',report.totalCurrent,'ไฟบวกจากแหล่งจ่าย',report.shortCircuit?danger:normal);
 add('M180 360H106V383H97',report.totalCurrent,'กระแสกลับแหล่งจ่ายผ่าน GND',report.shortCircuit?danger:normal);
 return `<defs>${[['normal',normal],['fault',danger],['warning',warning]].map(([name,color])=>`<marker id="q-arrow-${name}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${color}"/></marker>`).join('')}</defs>${paths.join('')}`;
}
export function measurementHTML(report){
 return `<div class="q-meters"><div><span>กระแสรวมจากแหล่งจ่าย</span><strong id="quiz-total-current">${mA(report.totalCurrent)} <small>mA</small></strong></div><div><span>แรงดันราง + เทียบ GND</span><strong id="quiz-rail-voltage">${report.railVoltage.toFixed(2)} <small>V</small></strong></div><div><span>โหมดแหล่งจ่ายจำลอง</span><strong class="q-source-mode">${report.mode==='CC'?'จำกัดกระแส':'แรงดันคงที่'}</strong></div></div>
 <div class="q-component-readings">${report.leds.map(l=>`<span class="${report.overcurrent.includes(l.id)?'q-reading-danger':''}">${esc(l.id.replace('L','LED '))}: <b>${mA(l.current)} mA</b> · ${l.inserted?`ΔV ${l.voltage.toFixed(2)} V`:'ขาอุปกรณ์ยังต่อไม่ครบ'}</span>`).join('')}${report.resistors.map(r=>`<span>${esc(r.id)} 330Ω: <b>${mA(r.current)} mA</b> · ${r.inserted?`ΔV ${Math.abs(r.voltage).toFixed(2)} V · ${(r.power*1000).toFixed(2)} mW`:'ขาอุปกรณ์ยังต่อไม่ครบ'}</span>`).join('')}</div>`;
}
