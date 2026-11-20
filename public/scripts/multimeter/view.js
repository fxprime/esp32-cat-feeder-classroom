import {getCase} from './model.js';
import {modeNames} from './cases.js';
import {parkedProbes,probeTail,parkedJacks,meterJacks,connectorPosition,jackTail} from './probes.js';
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const text=(x,y,label,extra='')=>`<text x="${x}" y="${y}" ${extra}>${esc(label)}</text>`;
const wire=(d,color='#64748b',width=4)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
function circuit(id,s,reading){
 const c=getCase(id);let out='';
 if(['board','short','rail'].includes(c.kind)){
  out='<rect x="370" y="105" width="480" height="230" rx="20" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>';
  if(c.kind==='board'){
   out+=wire('M420 180H645','#e2bd73',14)+wire('M650 260H835','#e2bd73',14);
   if(s.fault)out+='<rect x="525" y="169" width="22" height="22" fill="#fff"/>';
   for(const x of [445,489,532,576,620])out+=`<circle cx="${x}" cy="180" r="5" fill="#64748b"/>`;
   for(const x of [670,710,750,790,830])out+=`<circle cx="${x}" cy="260" r="5" fill="#64748b"/>`;
   out+=text(610,127,'แถบทองแดง 5 รูที่ต่อถึงกัน','text-anchor="middle"')+text(740,310,'อีกแถบหนึ่ง','text-anchor="middle"');
  }else{
   out+=wire(c.kind==='rail'&&s.fault?'M400 160H580M650 160H825':'M400 145H825','#ef4444',7)+wire('M400 275H825','#3b82f6',7);
   if(c.kind==='rail'){
    if(!s.fault)out=out.replace('M400 145H825','M400 160H825');
    out+=wire('M535 160V230','#ef4444',4);
    out+=text(620,220,s.fault?'รางแบ่งกลาง':'ต่อสะพานแล้ว','text-anchor="middle"');
   }
   if(c.kind==='short'&&s.fault)out+=wire('M540 145L740 275','#a16207',7)+text(650,200,'สายพาดสองราง','text-anchor="middle"');
  }
  out+=text(610,365,'ภาพขยายเส้นทางใต้ Breadboard','text-anchor="middle"');
 }
 if(c.kind==='ground'){
  out+='<rect x="375" y="130" width="190" height="130" rx="16" fill="#145e59"/><rect x="675" y="130" width="170" height="130" rx="16" fill="#334155"/>';
  out+=text(470,178,'ESP32','fill="#fff" text-anchor="middle"')+text(760,178,'Servo','fill="#fff" text-anchor="middle"')+text(760,210,'+ แหล่งจ่าย 5 V','fill="#fff" text-anchor="middle"');
  out+=wire('M465 240V265M755 240V265');
  out+=wire('M565 192H675','#0284c7',3)+text(620,175,'SIG 18','text-anchor="middle"');
  if(!s.fault)out+=wire('M465 265V310H755V265','#334155',5);
  out+=text(610,350,s.fault?'ยังไม่มี GND ร่วม':'มีเส้นทาง GND เชื่อมแล้ว','text-anchor="middle"');
 }
 if(['supply','polarity'].includes(c.kind)){
  out+='<rect x="375" y="125" width="155" height="175" rx="18" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="2"/>';
  out+=text(452,170,'DC SUPPLY','text-anchor="middle"')+text(452,210,'+','text-anchor="middle"')+text(452,270,'−','text-anchor="middle"');
  const px=c.points[0].x,ny=275;
  out+=wire(c.kind==='polarity'&&s.fault?`M505 200L${px} ${ny}M505 265L${px} 150`:`M505 200H555V150H${px}M505 265V275H${px}`,'#64748b');
  out+='<rect x="740" y="175" width="110" height="140" rx="14" fill="#f8fafc" stroke="#94a3b8" stroke-dasharray="6 5" stroke-width="2"/>';
  out+=text(795,220,'อุปกรณ์','text-anchor="middle"')+text(795,252,'3.3V','text-anchor="middle"')+text(795,285,'ยังไม่ต่อ','text-anchor="middle"');
 }
 if(c.kind==='resistor'){
  out+=wire('M485 210H560M700 210H775');out+='<rect x="560" y="185" width="140" height="50" rx="10" fill="#e7cc9b" stroke="#a16207" stroke-width="3"/>';
  for(const [x,color] of [[580,'#c2410c'],[602,'#c2410c'],[624,s.fault?'#ef4444':'#78350f']])out+=wire(`M${x} 188V232`,color,9);
  out+=text(630,295,'R แยกจากวงจรแล้ว','text-anchor="middle"');
 }
 if(c.kind==='led'){
  out+=wire('M490 210H575M680 210H775');
  out+=`<circle cx="625" cy="203" r="58" fill="#f87171" opacity="${reading?.display==='1.850'?.25:0}"/><path d="M580 230V190a45 45 0 0 1 90 0v40Z" fill="#fca5a5" stroke="#b91c1c" stroke-width="3"/><path d="M670 165V235" stroke="#b91c1c" stroke-width="5"/>`;
  out+=text(630,295,'LED แดง · ด้านแบนคือ K','text-anchor="middle"');
 }
 if(c.kind==='drop'){
  out+='<rect x="375" y="180" width="135" height="95" rx="14" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="2"/>';
  out+=text(442,220,'แหล่งจ่าย','text-anchor="middle"')+text(442,252,'5V','text-anchor="middle"');
  out+=wire('M465 180V130H560M650 130H775V185M775 280V310H465V275');
  out+=`<rect x="560" y="117" width="90" height="26" rx="6" fill="${s.fault?'#fdba74':'#cbd5e1'}" stroke="#64748b" stroke-width="2"/><rect x="710" y="185" width="135" height="95" rx="12" fill="#dbeafe" stroke="#60a5fa" stroke-width="2"/>`;
  out+=text(605,95,'สาย / จุดต่อ','text-anchor="middle"')+text(778,222,'Servo / โหลด','text-anchor="middle"')+text(778,254,s.load?'กำลังทำงาน':'หยุดพัก','text-anchor="middle"');
 }
 if(c.kind==='current'){
  out+='<rect x="365" y="180" width="130" height="95" rx="14" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="2"/>';
  out+=text(430,219,'แหล่งจ่าย','text-anchor="middle"')+text(430,252,'5V','text-anchor="middle"');
  out+=wire('M430 180V100H585M745 100H805V160M805 250V310H430V275');
  out+=`<rect x="792" y="160" width="26" height="90" rx="6" fill="#e7cc9b" stroke="#a16207" stroke-width="2"/>`;
  out+=text(825,210,'1kΩ')+text(665,160,s.gapOpen?'ช่องเปิด A–B':'ยังมีสายตรง A–B','text-anchor="middle"');
  out+=s.gapOpen?'<path d="M600 100H730" stroke="#94a3b8" stroke-width="3" stroke-dasharray="7 6"/>':wire('M585 100H745','#334155',5);
  if(reading?.flow){const sourcePoint=reading.sign>0?s.red:s.black;out+=`<path d="${sourcePoint==='A'?'M430 100H565':''}M765 100H805V145M805 265V310H500" fill="none" stroke="#15803d" stroke-width="5" marker-end="url(#meter-flow)"/>`;}
 }
 return out;
}
function meter(s,reading){
 const angles={off:0,dcv:-65,continuity:-115,ohm:65,diode:115,current:180};
 return `<rect x="25" y="18" width="230" height="355" rx="30" fill="#fbbf24" stroke="#92400e" stroke-width="3"/><rect x="40" y="32" width="200" height="326" rx="23" fill="#334155"/><rect x="54" y="56" width="172" height="70" rx="8" fill="#dce7d4"/>${text(140,96,reading?.display||'—','text-anchor="middle" class="meter-digits"')}${text(140,117,reading?.unit||modeNames[s.mode],'text-anchor="middle" class="meter-unit"')}<circle cx="140" cy="213" r="63" fill="#0f172a" stroke="#94a3b8" stroke-width="3"/><g transform="rotate(${angles[s.mode]} 140 213)"><path d="M140 174V252" stroke="#cbd5e1" stroke-width="16" stroke-linecap="round"/><path d="M140 155l-9 18h18Z" fill="#f8fafc"/></g>${text(140,144,'OFF','text-anchor="middle" class="meter-unit"')}${text(52,250,'บี๊บ','class="meter-unit" fill="#fff"')}${text(64,186,'V⎓','class="meter-unit" fill="#fff"')}${text(207,187,'Ω','class="meter-unit" fill="#fff"')}${text(140,291,'mA','class="meter-unit" fill="#fff"')}${text(198,259,'Diode','class="meter-unit" fill="#fff"')}${[['ma',70,'mA'],['com',130,'COM'],['v',195,'VΩ']].map(([id,x,label])=>`<circle cx="${x}" cy="330" r="15" fill="${id==='com'?'#0f172a':id===s.jack?'#dc2626':id===s.blackJack?'#0f172a':'#64748b'}" stroke="#e2e8f0" stroke-width="2"/>${text(x,309,label,'text-anchor="middle" class="meter-jack"')}`).join('')}`;
}
export const curve=(start,end,reverse=false)=>reverse?`M${end.x} ${end.y}C${end.x-80} 400 300 400 ${start.x} ${start.y}`:`M${start.x} ${start.y}C300 400 ${end.x-80} 400 ${end.x} ${end.y}`;
export function sceneHTML(id,s,reading,positions=parkedProbes(),connectors=parkedJacks()){
 const c=getCase(id),red=c.points.find(p=>p.id===s.red),black=c.points.find(p=>p.id===s.black),rStart=jackTail(connectorPosition(s,'red',connectors)),bStart=jackTail(connectorPosition(s,'black',connectors));
 const redPath=curve(rStart,probeTail('red',red||positions.red)),blackPath=curve(bStart,probeTail('black',black||positions.black));
 const flow=reading?.flow?`<path d="${curve(rStart,red,reading.sign>0)}" class="meter-current-path"/><path d="${curve(bStart,black,reading.sign<0)}" class="meter-current-path"/>${reading.sign>0?'<path d="M70 330V300H130V330" class="meter-current-path"/>':'<path d="M130 330V300H70V330" class="meter-current-path"/>'}`:'';
 return `<svg viewBox="0 0 900 410" role="img" aria-label="มัลติมิเตอร์และวงจร ${esc(c.title)}"><defs><marker id="meter-flow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0l10 5-10 5Z" fill="#15803d"/></marker></defs>${circuit(id,s,reading)}${meter(s,reading)}<g data-probe-wire="black">${wire(blackPath,'#1e293b',5)}</g><g data-probe-wire="red">${wire(redPath,'#dc2626',5)}</g>${flow}${text(860,28,s.power?'วงจรมีไฟ':'ถอดไฟแล้ว','text-anchor="end" class="meter-power"')}${c.points.map(point=>text(point.x,point.y-30,point.label,'text-anchor="middle" class="meter-point-label"')).join('')}</svg>${meterJacks.map(jack=>`<button type="button" class="mm-jack-target" data-jack-target="${jack.id}" style="left:${jack.x/9}%;top:${jack.y/4.1}%" aria-label="ช่อง ${jack.label}"></button>`).join('')}${['red','black'].map(color=>jackHTML(color,connectorPosition(s,color,connectors),s)).join('')}${['red','black'].map(color=>probeHTML(color,c.points.find(p=>p.id===s[color])||positions[color],s[color])).join('')}${c.points.map(point=>`<button type="button" class="meter-point ${s.red===point.id?'has-red':''} ${s.black===point.id?'has-black':''}" style="left:${point.x/9}%;top:${point.y/4.1}%" data-point="${point.id}" aria-label="จุด ${point.id}: ${esc(point.label)}" aria-pressed="${s.red===point.id||s.black===point.id}">${point.id}</button>`).join('')}`;
}

function probeHTML(color,tip,contact){
 const name=color==='red'?'แดง':'ดำ',ink=color==='red'?'#dc2626':'#1e293b';
 return `<button type="button" class="mm-probe-handle" data-lead-end="probe" data-color="${color}" data-probe-handle="${color}" data-contact="${contact||''}" style="left:${tip.x/9}%;top:${tip.y/4.1}%;--probe-angle:${color==='red'?22:-22}deg" aria-label="หัววัด${name} ลากหรือใช้ปุ่มลูกศรเพื่อขยับ" aria-describedby="mm-drag-help"><svg viewBox="0 0 64 90" aria-hidden="true"><path d="M32 6V31" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/><path d="M32 7V13" stroke="#e2e8f0" stroke-width="3"/><rect x="21" y="29" width="22" height="47" rx="8" fill="${ink}" stroke="#fff" stroke-width="2"/><path d="M18 30H46M26 43H38M26 50H38M26 57H38M32 76V81" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="6" r="5" fill="${contact?'#22c55e':'#f8fafc'}" stroke="${ink}" stroke-width="2"/></svg></button>`;
}

function jackHTML(color,tip,s){
 const name=color==='red'?'แดง':'ดำ',ink=color==='red'?'#dc2626':'#1e293b',port=color==='red'?s.jack:s.blackJack;
 return `<button type="button" class="mm-banana-handle" data-lead-end="jack" data-color="${color}" data-banana-handle="${color}" data-port="${port||''}" style="left:${tip.x/9}%;top:${tip.y/4.1}%" aria-label="ปลั๊ก Banana ${name} ${port?'เสียบ '+(port==='v'?'VΩ':port==='ma'?'mA':'COM'):'ยังไม่เสียบ'} ลากหรือใช้ลูกศรเพื่อย้าย" aria-describedby="mm-drag-help"><svg viewBox="0 0 48 64" aria-hidden="true"><path d="M24 12V27" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round"/><rect x="13" y="25" width="22" height="25" rx="7" fill="${ink}" stroke="#fff" stroke-width="2"/><path d="M24 49V57M17 35H31M17 42H31" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="17" r="4" fill="${port?'#22c55e':'#e2e8f0'}"/></svg></button>`;
}
