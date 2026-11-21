import assert from 'node:assert/strict';
import { recipes, pins } from '../public/scripts/pinout/data.js';
import { circuitSVG } from '../public/scripts/pinout/diagrams.js';
assert.equal(pins.length,38);
assert.equal(new Set(pins.map(p=>p.key)).size,38);
assert.deepEqual(pins.filter(p=>p.side===0).map(p=>p.id),['3V3','EN','36','39','34','35','32','33','25','26','27','14','12','GND','13','9','10','11','5V']);
assert.deepEqual(pins.filter(p=>p.side===1).map(p=>p.id),['GND','23','22','1','3','21','GND','19','18','5','17','16','4','0','2','15','8','7','6']);
assert.deepEqual(pins.filter(p=>p.risk==='flash').map(p=>p.label),['D2','D3','CMD','D1','D0','CLK']);
assert.equal(recipes.length,16);
assert.deepEqual(pins.filter(p=>p.inputOnly).map(p=>p.id).sort(),['34','35','36','39']);
assert.deepEqual(pins.filter(p=>p.caps.includes('dac')).map(p=>p.id).sort(),['25','26']);
const has=(r,from,to)=>r.wires.some(w=>(w.from===from&&w.to===to)||(w.from===to&&w.to===from));
for(const r of recipes){
 // Rendering resolves every terminal: a typo in wiring must fail the build.
 const svg=circuitSVG(r);assert(svg.includes('</svg>'));
 assert(!r.wires.some(w=>w.from==='esp.5V'||w.to==='esp.5V'),`${r.id}: USB + external positive must not join`);
 for(const w of r.wires){
  if(/^esp\.(\d+)$/.test(w.from))assert(Number(w.from.slice(4))<34,`${r.id}: input-only GPIO driving a signal`);
 }
 if(r.supply)assert(has(r,'esp.GND','rail.gnd'),`${r.id}: common reference missing`);
 assert(!r.code.includes('ledcSetup('),'core 2 LEDC API must not reappear');
 // Copper nets (component internals excluded) must not short any power rails.
 const adjacent=new Map();
 for(const w of r.wires){for(const [a,b] of [[w.from,w.to],[w.to,w.from]])adjacent.set(a,[...(adjacent.get(a)||[]),b]);}
 const walk=(start)=>{const seen=new Set(),pending=[start];while(pending.length){const at=pending.pop();if(seen.has(at))continue;seen.add(at);pending.push(...(adjacent.get(at)||[]));}return seen;};
 for(const net of ['rail.logic','rail.plus','supply.plus'])assert(!walk(net).has('rail.gnd'),`${r.id}: ${net} shorted to ground`);
 assert(!walk('rail.logic').has('supply.plus'),`${r.id}: external supply tied to ESP32 3V3`);
}
const recipe=id=>recipes.find(r=>r.id===id);
assert(has(recipe('servo'),'rail.plus','device.V+'));
assert(has(recipe('servo'),'esp.18','device.SIG'));
assert(!has(recipe('ultrasonic'),'device.ECHO','esp.27'));
assert(has(recipe('ultrasonic'),'device.ECHO','topR.A'));
assert(has(recipe('ultrasonic'),'topR.B','bottomR.A'));
assert(has(recipe('ultrasonic'),'bottomR.B','rail.gnd'));
assert(Math.abs(5*1800/(1000+1800)-3.214)<.001);
for(const id of ['dac','i2s']){
 assert(has(recipe(id),'device.OUT+','speaker.plus'));
 assert(has(recipe(id),'device.OUT−','speaker.minus'));
 assert(!recipe(id).wires.some(w=>w.from.startsWith('speaker.')&&w.to==='rail.gnd'));
}
assert(has(recipe('dc'),'supply.plus','device.VM'));
assert(has(recipe('esc'),'supply.plus','device.BAT+'));
for(const id of ['active','passive']){assert(has(recipe(id),'diode.K','rail.plus'));assert(has(recipe(id),'diode.A','transistor.C'));}
assert(has(recipe('uart'),'esp.17','device.RX16'));
assert(has(recipe('uart'),'device.TX17','esp.16'));
console.log('Pinout checks passed: 38 headers, 16 resolved circuits, power separation, input-only pins, Echo divider, BTL outputs and crossed UART.');
