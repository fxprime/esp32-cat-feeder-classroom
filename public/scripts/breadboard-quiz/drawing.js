import {sceneLayout,componentSVG} from './placement.js';
import {railSplitAfter} from './model.js';
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function wirePath(a,b){
 const lift=Math.min(125,Math.max(35,Math.abs(a.x-b.x)*.2+Math.abs(a.y-b.y)*.12));
 return `M${a.x} ${a.y} C${a.x} ${a.y-lift} ${b.x} ${b.y-lift} ${b.x} ${b.y}`;
}
export function drawBench(count,poses={},splitRails=true){
 const layout=sceneLayout(count,poses,null,splitRails);
 const components=layout.parts.map(componentSVG).join('');
 const nodes=layout.points.slice().sort((a,b)=>(a.type==='leg')-(b.type==='leg')).map(p=>`<g class="q-terminal" data-socket="${p.id}"><circle class="q-socket" cx="${p.x}" cy="${p.y}" r="${p.type==='leg'?7:4.5}" fill="${p.type==='leg'?'#f1bb59':'#758a95'}" stroke="${p.type==='leg'?'#6c5429':'#d6e0e2'}" stroke-width="2"/></g>`).join('');
 const handles=layout.points.filter(p=>p.type==='hole').map((p,i)=>`<button type="button" class="q-node ${p.type==='leg'?'q-leg':'q-hole'} ${p.locked?'q-locked':''}" data-node="${p.id}" tabindex="${i===0?0:-1}" style="left:${p.x/11}%;top:${p.y/8.2}%" aria-label="${esc(p.label)}${p.locked?' มีสายไฟเลี้ยงเสียบอยู่แล้ว':''}" aria-disabled="${!!p.locked}"></button>`).join('');
 const partHandles=layout.parts.map(p=>`<button type="button" class="q-part-handle" data-part="${p.id}" style="left:${p.handle.x/11}%;top:${p.handle.y/8.2}%" aria-label="${p.id} ลากทั้งตัวเพื่อปักขา ใช้ R หมุนและลูกศรเลื่อนเมื่อปักแล้ว" aria-pressed="false"></button>`).join('');
 const colLabels=Array.from({length:18},(_,i)=>`<text x="${180+i*44}" y="399" text-anchor="middle" class="q-coord">${i+1}</text>`).join('');
 const rowLabels='ABCDEFGHIJ'.split('').map((r,i)=>`<text x="144" y="${(i<5?423+i*24:583+(i-5)*24)+4}" text-anchor="middle" class="q-coord">${r}</text>`).join('');
 const splitX = 180 + (railSplitAfter - .5) * 44;
 const railLine = y => splitRails ? `M164 ${y}H${splitX - 10}M${splitX + 10} ${y}H958` : `M164 ${y}H958`;
 return `<div class="q-bench-surface"><svg id="quiz-bench-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 820" role="group" aria-label="แผงต่อสายแบบฝึกหัด ใช้ลากสายหรือคลิกสองจุด ใช้ลูกศรเลื่อนจุดต่อ Enter เลือก และ Escape ยกเลิก">
 <rect width="1100" height="820" rx="22" fill="#f4f8f7"/>
 <text x="550" y="57" text-anchor="middle" class="q-stage-title">ลากตัว LED / ตัวต้านทาน มาปักบนบอร์ด</text>
 <text x="550" y="83" text-anchor="middle" class="q-stage-note">เลือกอุปกรณ์แล้วกด R หรือปุ่มหมุน 90° · ขาทั้งสองปักพร้อมกัน</text>
 <rect x="115" y="294" width="895" height="500" rx="23" fill="#fff" stroke="#cddbdc" stroke-width="3"/>
 <path d="${railLine(310)} ${railLine(719)}" stroke="#de5a64" stroke-width="3"/><path d="${railLine(378)} ${railLine(785)}" stroke="#5c91bd" stroke-width="3"/>
 ${splitRails? `<path d="M${splitX} 307v76m0 330v77" stroke="#8ea4af" stroke-width="1.5" stroke-dasharray="4 4"/>` : ''}
 <text x="${splitX}" y="284" text-anchor="middle" class="q-stage-note">${splitRails ? 'รางไฟตัดกลาง · ไฟเข้ารางบนฝั่งซ้าย' : 'คำตอบเดิม · รางไฟต่อเนื่องตลอดแถว'}</text>
 <text x="145" y="331" text-anchor="middle" class="q-rail-plus">+</text><text x="145" y="365" text-anchor="middle" class="q-rail-minus">−</text><text x="145" y="739" text-anchor="middle" class="q-rail-plus">+</text><text x="145" y="773" text-anchor="middle" class="q-rail-minus">−</text>
 <rect x="137" y="539" width="849" height="24" rx="6" fill="#e7eeee"/><text x="561" y="555" text-anchor="middle" class="q-stage-note">ร่องกลาง · A–E กับ F–J ไม่เชื่อมถึงกัน</text>
 <rect id="quiz-source-body" x="13" y="310" width="84" height="150" rx="13" fill="#164f48"/>
 <text x="55" y="336" text-anchor="middle" fill="white" font-size="14" font-weight="700">แหล่งจ่าย</text><text x="55" y="360" text-anchor="middle" fill="#ffd1ca" font-size="13">3V3</text><text x="55" y="390" text-anchor="middle" fill="#d4e4e9" font-size="13">GND</text>
 <text id="quiz-source-i" x="55" y="430" text-anchor="middle" fill="white" font-size="11" font-weight="700">0.00 mA</text><text id="quiz-source-v" x="55" y="449" text-anchor="middle" fill="#d4e4e9" font-size="11">3.30 V</text>
 <path d="M97 353H111V326H180" stroke="#d74956" stroke-width="5" fill="none"/><path d="M97 383H106V360H180" stroke="#354e62" stroke-width="5" fill="none"/>
 ${colLabels}${rowLabels}<g id="quiz-components">${components}</g><g id="quiz-wires"></g><g id="quiz-current-paths" pointer-events="none" aria-hidden="true"></g><path id="quiz-ghost" d="" fill="none" stroke="#099a8a" stroke-width="4" stroke-dasharray="8 5" pointer-events="none" hidden/>
 <g id="quiz-nodes">${nodes}</g></svg><div class="q-handles">${handles}${partHandles}</div></div>`;
}
