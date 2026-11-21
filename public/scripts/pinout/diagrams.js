import { pins, pinY } from './data.js';
export const escapeHTML = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const text=(x,y,s,extra='')=>`<text x="${x}" y="${y}" ${extra}>${escapeHTML(s)}</text>`;
const colors={power:'#df4354',logic:'#aa428e',ground:'#3c5267',signal:'#087d80',audio:'#a65c14'};
export function boardTerminal(id, {x, y, width, height}, side) {
 const pin=pins.find(pin=>pin.id===String(id)&&(side===undefined||pin.side===side));
 if(!pin)throw new Error(`Unknown ESP32-DevKitC V4 terminal ${id}`);
 return [x+pin.side*width, y+pinY(pin.index)*height/480];
}
export function boardSVG({x=100,y=50,height=480,width=height*210/480,labels=true,interactive=false,active='',filter='all',used=[]}={}) {
 return `<g transform="translate(${x} ${y}) scale(${width/210} ${height/480})"><rect width="210" height="480" rx="18" fill="#30414b" stroke="#172c38" stroke-width="3"/>
 <rect x="42" y="16" width="126" height="100" rx="4" fill="#164339"/>
 <path d="M50 75V30h15v40h15V30h15v40h15V30h15v40h15V30h20v45" fill="none" stroke="#d8c187" stroke-width="4"/>
 <rect x="38" y="124" width="134" height="127" rx="7" fill="#b8c9c8" stroke="#edf6f4" stroke-width="2"/>
 ${text(105,164,'ESP32','text-anchor="middle" font-size="23" fill="#21433f" font-weight="bold"')}${text(105,190,'WROOM-32','text-anchor="middle" font-size="14" fill="#21433f"')}${text(105,215,'2.4 GHz · Wi-Fi / BT','text-anchor="middle" font-size="10" fill="#21433f"')}
 <rect x="77" y="299" width="56" height="61" rx="4" fill="#23343e"/><path d="M70 307h-8m8 12h-8m8 12h-8m8 12h-8m78-36h8m-8 12h8m-8 12h8m-8 12h8" stroke="#b7c8bd" stroke-width="3"/>
 <circle cx="44" cy="400" r="10" fill="#d0d7da"/><circle cx="166" cy="400" r="10" fill="#d0d7da"/>${text(44,422,'EN','text-anchor="middle" font-size="10" fill="white"')}${text(166,422,'BOOT','text-anchor="middle" font-size="10" fill="white"')}
 <rect x="76" y="445" width="58" height="40" rx="5" fill="#bac6cc" stroke="#536470" stroke-width="3"/><rect x="86" y="453" width="38" height="17" rx="3" fill="#334152"/>
 ${pins.map(p=>{const py=pinY(p.index),px=p.side?210:0;const selected=p.key===active||used.includes(p.id),dim=filter!=='all'&&!p.caps.includes(filter);const fill=selected?'#ffe074':p.caps.includes('power')?p.id==='GND'?'#adb8c1':p.id==='5V'?'#fb6070':'#f29a9a':p.risk==='flash'?'#c9b3df':p.risk==='strap'?'#e9b884':p.inputOnly?'#a4d6f0':'#bbd8c9';return `<g ${interactive?`data-pin="${p.key}" role="button" tabindex="0" aria-label="${escapeHTML(p.label)}: ${p.risk==='flash'?'สงวนให้ Flash':p.inputOnly?'รับเข้าเท่านั้น':p.caps.includes('power')?'ไฟเลี้ยง / ควบคุม':'GPIO'}" aria-pressed="${p.key===active}"`:''} class="pin ${selected?'chosen':''}" opacity="${dim?'.25':'1'}"><rect x="${px-27}" y="${py-11}" width="54" height="22" fill="transparent"/><rect class="pin-pad" x="${px-10}" y="${py-7}" width="20" height="14" rx="3" fill="${fill}" stroke="${selected?'#8c5814':'#263d43'}" stroke-width="${selected?3:1}"/>${labels?text(p.side?194:16,py+4,p.label,`text-anchor="${p.side?'end':'start'}" font-size="11" font-weight="bold" fill="#fff"`):''}</g>`}).join('')}
 </g>`;
}
function modulePart(r) {
 if(r.kind==='uart') {
  const board={x:805,y:217,width:123,height:290};
  const pts={'device.RX16':boardTerminal(16,board),'device.TX17':boardTerminal(17,board),'device.GND':boardTerminal('GND',board,0)};
  return {shape:text(805,198,'ESP32-DevKitC V4 · B','font-size="14" fill="#42616c" font-weight="bold"')+boardSVG({...board,used:['16','17','GND']}),pts};
 }
 const x=730,y=226,h=Math.max(132,r.ports.length*27+54),pts={};
 let shape=`<rect x="${x}" y="${y}" width="238" height="${h}" rx="15" fill="${r.kind==='servo'?'#427cd2':r.kind==='buzzer'?'#283a48':'#196966'}" stroke="#b0c8c7" stroke-width="2"/>`;
 shape+=text(x+119,y+25,r.part,`text-anchor="middle" fill="white" font-size="13" font-weight="bold"`);
 r.ports.forEach((p,i)=>{const py=y+50+i*27;pts[`device.${p}`]=[x,py];shape+=`<circle cx="${x}" cy="${py}" r="5" fill="#f2ce81" stroke="#172d3c"/>${text(x+12,py+5,p,'fill="white" font-size="13"')}`});
 const cx=x+168,cy=y+88;
 if(r.kind==='servo') shape+=`<circle cx="${cx}" cy="${cy}" r="25" fill="#c7dbed"/><g id="servo-arm" style="transform-origin:${cx}px ${cy}px"><rect x="${cx-5}" y="${cy-48}" width="10" height="65" rx="5" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="6" fill="#2c4259"/></g>`;
 else if(r.kind==='ultrasonic') shape+=`<circle cx="${cx-25}" cy="${cy}" r="23" fill="#c9d8df" stroke="#162e3a" stroke-width="5"/><circle cx="${cx+27}" cy="${cy}" r="23" fill="#c9d8df" stroke="#162e3a" stroke-width="5"/>`;
 else if(r.kind==='htu21d') shape+=`<rect x="${cx-20}" y="${cy-20}" width="40" height="40" rx="6" fill="#253d47"/><circle cx="${cx}" cy="${cy}" r="5" fill="#bcd6df"/>`;
 else if(['pot','ldr','button','buzzer'].includes(r.kind)) shape+=`<circle cx="${cx}" cy="${cy}" r="33" fill="${r.kind==='ldr'?'#d6ab78':'#c8d1d9'}" stroke="#344e60" stroke-width="4"/><path id="dial" d="M${cx} ${cy}v-27" stroke="#314a5a" stroke-width="5" style="transform-origin:${cx}px ${cy}px"/>`;
 else if(r.kind==='rfid') shape+=`<rect x="${cx-37}" y="${cy-28}" width="65" height="95" rx="15" fill="none" stroke="#8ad4d1" stroke-width="3"/><rect x="${cx-28}" y="${cy-19}" width="47" height="77" rx="12" fill="none" stroke="#8ad4d1" stroke-width="3"/>`;
 else shape+=`<rect x="${cx-30}" y="${cy-23}" width="60" height="63" rx="6" fill="#253d47"/>${text(cx,cy+10,r.kind==='esc'?'ESC':r.kind==='ds18'?'DS18':r.kind==='i2c'?'BME':'IC','text-anchor="middle" fill="#c9e4db" font-size="13"')}`;
 return {shape,pts};
}
export function circuitSVG(r,{step=r.wires.length,selected=-1,powered=false,value=r.control[3]}={}) {
 const points={};
 pins.forEach(p=>{if(!points[`esp.${p.id}`])points[`esp.${p.id}`]=[100+(p.side?210:0),50+pinY(p.index)]});
 Object.assign(points,{'rail.logic':[430,135],'rail.plus':[430,168],'rail.gnd':[430,535],'supply.plus':[772,140],'supply.minus':[907,140]});
 const device=modulePart(r);Object.assign(points,device.pts);
 let extras='';
 const resistor=(id,y,label)=>{points[`${id}.A`]=[525,y];points[`${id}.B`]=[625,y];extras+=`<path d="M525 ${y}h20m60 0h20" stroke="#5d6d73" stroke-width="3"/><rect x="545" y="${y-9}" width="60" height="18" rx="7" fill="#ecd4ae" stroke="#aa7843"/><path d="M555 ${y-8}v16m11-16v16m12-16v16" stroke="#9d442d" stroke-width="3"/>${text(575,y-17,label,'text-anchor="middle" font-size="13" fill="#263f50"')}`};
 if(r.extra==='pullup'||r.extra==='divider')resistor('resistor',315,r.extra==='pullup'?'4.7kΩ':'10kΩ');
 if(r.extra==='echo'){resistor('topR',280,'1kΩ');resistor('bottomR',365,'1.8kΩ');}
 if(r.id==='dac'){points['cap.A']=[510,315];points['cap.B']=[610,315];extras+=`<path d="M510 315h43m0-15v30m14-30v30m0-15h43" stroke="#24636a" stroke-width="4"/>${text(560,290,'1µF · AC coupling','text-anchor="middle" font-size="12" fill="#263f50"')}`;}
 if(r.extra==='transistor'){
 resistor('base',280,'1kΩ');resistor('pull',380,'10kΩ');
 points['diode.A']=[525,220];points['diode.K']=[625,220];
 extras+=`<path d="M525 220h35m20 0h45m-65-10 20 10-20 10zM580 207v26" stroke="#486474" fill="#dbe6e9" stroke-width="3"/>${text(575,196,'1N4148 · A → K stripe','text-anchor="middle" font-size="12" fill="#263f50"')}`;
 Object.assign(points,{'transistor.B':[550,450],'transistor.C':[620,420],'transistor.E':[620,480]});
 extras+=`<circle cx="600" cy="450" r="36" fill="#fff" stroke="#405c6b" stroke-width="2"/><path d="M550 450h40m0-25v50m0-18 30 23m-30-37 30-23m-13 50 13 10-3-15" fill="none" stroke="#405c6b" stroke-width="3"/>${text(550,442,'B','font-size="13"')}${text(625,420,'C','font-size="13"')}${text(625,485,'E','font-size="13"')}${text(582,508,'2N2222','text-anchor="middle" font-size="12"')}`;
 }
 if(['speaker','motor','brushless'].includes(r.extra)){
 const label=r.extra==='speaker'?'SPEAKER':r.extra==='motor'?'DC MOTOR':'BRUSHLESS';
 const names=r.extra==='brushless'?['U','V','W']:['plus','minus'];
 names.forEach((p,i)=>points[`${r.extra}.${p}`]= [760+i*80,565]);
 extras+=`<rect x="725" y="565" width="240" height="75" rx="16" fill="#d9e6ec" stroke="#617e8d"/>${text(740,585,label,'font-size="11" fill="#244352" font-weight="bold"')}${r.extra==='speaker'?'<g id="speaker-cone" style="transform-origin:906px 605px"><circle cx="906" cy="605" r="24" fill="#506b7e"/><circle cx="906" cy="605" r="16" fill="#92aabc"/><circle cx="906" cy="605" r="8" fill="#354f65"/></g>':'<circle cx="906" cy="605" r="24" fill="#6c8797"/><g id="rotor" style="transform-origin:906px 605px"><path d="M887 605h38m-19-19v38" stroke="#d9ebf1" stroke-width="5"/></g>'}${names.map((p,i)=>`<circle cx="${760+i*80}" cy="565" r="5" fill="#e5b96d"/>${text(760+i*80,622,p==='plus'?'+':p==='minus'?'−':p,'text-anchor="middle" font-size="12"')}`).join('')}`;
 }
 const wires=r.wires.map((wire,i)=>{
 const a=points[wire.from],b=points[wire.to];if(!a||!b)throw Error(`${r.id}: missing ${wire.from} / ${wire.to}`);
 const left=a[0]===100||b[0]===100;
 let route;
 if(r.kind==='uart' && [wire.from,wire.to].some(point=>/^device\.(RX16|TX17)$/.test(point))) {
  const [first,last]=wire.from.startsWith('esp.')?[a,b]:[b,a];
  const channel=344+i*10, outer=947+i*10, top=166+i*10;
  route=`M${first[0]} ${first[1]}H${channel}V${top}H${outer}V${last[1]}H${last[0]}`;
 }
 else if(left){const l=a[0]===100?a:b,other=a[0]===100?b:a;const lane=18+(i%4)*16,lower=560+(i%4)*18;route=`M${l[0]} ${l[1]}H${lane}V${lower}H${680+(i%3)*12}V${other[1]}H${other[0]}`;}
 else {const middle=a[0]>=730?650+(i%5)*12:a[0]<b[0]?a[0]+30+(i%5)*13:a[0]-30-(i%5)*13;route=`M${a[0]} ${a[1]}H${middle}V${b[1]}H${b[0]}`;}
 const visible=i<step,chosen=i===selected;
 return `<g class="circuit-wire ${chosen?'selected':''}" data-wire="${i}" style="opacity:${!visible?0:selected>=0&&!chosen?.2:1}"><title>${escapeHTML(wire.label)}</title><path d="${route}" stroke="white" stroke-width="8" fill="none"/><path class="wire-color" d="${route}" stroke="${colors[wire.color]}" stroke-width="${chosen?5:3}" fill="none" stroke-linejoin="round"/><circle cx="${a[0]}" cy="${a[1]}" r="4" fill="${colors[wire.color]}"/><circle cx="${b[0]}" cy="${b[1]}" r="4" fill="${colors[wire.color]}"/></g>`;
 }).join('');
 const holes=Array.from({length:14},(_,row)=>Array.from({length:13},(_,col)=>`<circle cx="${389+col*19}" cy="${215+row*19}" r="2.2" fill="#c2ced2"/>`).join('')).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 675" role="img" aria-labelledby="circuit-title circuit-desc" class="circuit" style="font-family:Arial,sans-serif" data-powered="${powered}"><title id="circuit-title">${escapeHTML(r.title)}</title><desc id="circuit-desc">${escapeHTML(r.wires.map(w=>w.label).join('; '))}</desc><rect width="1000" height="675" rx="18" fill="#f5f9fa"/>
 ${text(100,25,'ESP32-DevKitC V4 · USB','font-size="14" fill="#42616c" font-weight="bold"')}
 <rect x="365" y="80" width="285" height="475" rx="17" fill="#fff" stroke="#d0dde2" stroke-width="2"/>${text(388,107,'BREADBOARD · power rails','font-size="13" fill="#476470"')}${holes}<rect x="504" y="200" width="12" height="290" rx="6" fill="#ecf1f4"/>
 ${[['logic',135,'3V3','#aa428e'],['plus',168,r.supply?'EXT +':'EXT +','#df4354'],['gnd',535,'GND','#3c5267']].map(([id,y,label,color])=>`<path d="M387 ${y}H630" stroke="${color}" stroke-width="4"/>${text(390,y-7,id!=='gnd'&&!r.wires.some(w=>w.from===`rail.${id}`||w.to===`rail.${id}`)?`${label} (unused)`:label,`fill="${color}" font-size="12" font-weight="bold"`)}`).join('')}
 ${r.supply?`<rect x="722" y="40" width="242" height="101" rx="14" fill="#fff2e4" stroke="#c88d52" stroke-width="2"/>${text(843,65,'EXTERNAL SUPPLY','text-anchor="middle" fill="#77542f" font-size="13"')}${text(843,90,r.supply,'text-anchor="middle" fill="#77542f" font-size="15" font-weight="bold"')}${text(772,121,'+','text-anchor="middle" font-size="24" fill="#c83144"')}${text(907,121,'−','text-anchor="middle" font-size="24" fill="#3c5267"')}`:''}
 ${boardSVG({used:r.pins})}${wires}${device.shape}${extras}
 <circle cx="328" cy="34" r="6" fill="${powered?'#e89c15':'#a9bac4'}"/>${text(343,39,powered?'SIM ON':'SIM OFF','font-size="11" fill="#4b606c"')}
 ${text(370,662,'Logical wiring • match pin labels on your physical parts','font-size="12" fill="#55717e"')}
 </svg>`;
}
