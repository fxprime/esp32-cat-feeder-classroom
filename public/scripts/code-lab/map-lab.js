import {mapValue} from './map-model.js';
import {highlightCode} from '../vendor/code-highlight.js';

const parameters=[['value','value · ค่าเข้า',2048],['inMin','in min',0],['inMax','in max',4095],['outMin','out min',0],['outMax','out max',255]];
export function mapDialogHTML(){return `<dialog class="cl-map-dialog" id="map-dialog" aria-labelledby="map-title"><header><hgroup><span class="cl-kicker">ลากหมุด · แก้ตัวเลข · ดูผล</span><h2 id="map-title">Input → สมการ Linear → Output</h2></hgroup><button type="button" data-map-close aria-label="ปิดหน้าต่าง map">✕</button></header><div class="cl-map-content"><p class="cl-map-intro">กดตัวเลขในคำสั่งเพื่อแก้ช่วง แล้วลากหมุด Input ดูค่า Output เปลี่ยนตาม</p><form id="map-settings" class="cl-map-call" aria-label="แก้ค่าที่ส่งให้ฟังก์ชัน map"><code>${highlightCode('map(')}</code>${parameters.map(([name,label,value],i)=>`<label><span>${label}</span><input type="number" name="${name}" value="${value}" min="-10000" max="10000" step="1" required aria-label="${label}"></label><code>${i===4?');':','}</code>`).join('')}</form><div class="cl-map-presets"><span>ลอง:</span><button type="button" data-map-preset="pwm">ADC → LED</button><button type="button" data-map-preset="servo">ADC → มุม Servo</button><button type="button" data-map-preset="reverse">กลับทิศค่าออก</button></div><p data-map-error role="alert" hidden></p><div class="cl-map-flow" aria-hidden="true"><span>Input</span><b>→</b><span>สมการ Linear</span><b>→</b><span>Output</span><i data-map-token></i></div><div class="cl-map-workspace"><section class="cl-map-block cl-map-input" data-map-block="input" aria-labelledby="map-input-title"><h3 id="map-input-title">1 · Input</h3><output class="cl-map-big" data-map-input-value>2048</output><div class="cl-map-plot"><div data-map-input-axis></div><input type="range" id="map-input-pin" min="0" max="4095" value="2048" step="1" aria-label="ลากหมุดเลือกค่า Input"></div><label for="map-input-pin" class="cl-map-pin-label">↔ ลากหมุดเพื่อเลือกค่า x</label><p data-map-input-caption></p></section><section class="cl-map-block cl-map-equation" data-map-block="equation" aria-labelledby="map-equation-title"><h3 id="map-equation-title">2 · สมการเส้นตรง</h3><div class="cl-map-symbolic"><span>y =</span><span class="cl-map-fraction"><span>(x − in min) × (out max − out min)</span><span>in max − in min</span></span><span>+ out min</span></div><div class="cl-map-substitution" data-map-equation></div><p class="cl-map-ratio" data-map-ratio></p><p class="cl-map-rounding" data-map-rounding></p></section><section class="cl-map-block cl-map-output" data-map-block="output" aria-labelledby="map-output-title"><h3 id="map-output-title">3 · Output</h3><output class="cl-map-big" data-map-result>127</output><div class="cl-map-plot" data-map-output-axis></div><p data-map-output-caption></p></section></div><p class="cl-map-outside" data-map-outside hidden></p><div class="cl-map-actions"><button type="button" class="cl-primary" data-map-play>▶ Animate map()</button><button type="button" data-map-pause disabled>พักภาพ</button><button type="button" data-map-step>ดูทีละขั้น →</button><button type="button" data-map-reset>↶ เริ่มภาพใหม่</button></div><p data-map-status role="status"></p><p class="cl-map-caveat">สมการแปลงช่วงแบบเส้นตรง แต่ map() คำนวณเป็นจำนวนเต็ม: ตัดเศษผลหารก่อนบวก out min · สลับ min/max เพื่อกลับทิศได้</p><p class="cl-footnotes">อ้างอิง <a href="https://github.com/espressif/arduino-esp32/blob/master/cores/esp32/WMath.cpp" target="_blank" rel="noopener">Arduino-ESP32 · map()</a></p></div></dialog>`;}

function axis(min,max,ratio=null,result=null){
 const value=n=>Number.isInteger(n)?String(n):Number(n.toFixed(1)).toLocaleString('en-US');
 return `<svg viewBox="0 0 320 92" role="img" aria-label="ช่วง ${min} ถึง ${max}${result===null?'':` ค่าออก ${result}`}">${[...new Set([min,Math.round((min+max)/2),max])].map((tick,i,all)=>{const x=min===max?160:14+(tick-min)/(max-min)*292;return `<path d="M${x} 10V49" stroke="#cbd5e1" stroke-dasharray="3 3"/><text x="${x}" y="72" text-anchor="${i===0?'start':i===all.length-1?'end':'middle'}">${value(tick)}</text>`;}).join('')}${ratio===null?'':`<path d="M14 38H306" stroke="#7c3aed" stroke-width="7" stroke-linecap="round"/><g transform="translate(${14+292*Math.max(0,Math.min(1,ratio))} 38)"><path d="M0 -22V-14" stroke="#7c3aed" stroke-width="3"/><circle r="11" fill="#7c3aed" stroke="#fff" stroke-width="3"/></g>`}</svg>`;
}

export function initMapLab(getRaw){
 const dialog=document.querySelector('#map-dialog'),form=dialog.querySelector('form'),q=s=>dialog.querySelector(s),pin=q('#map-input-pin'),motion=matchMedia('(prefers-reduced-motion: reduce)');
 let sample=null,progress=1,frame=null,started=0,running=false,opener=null;
 const duration=6000;
 function stop(){cancelAnimationFrame(frame);frame=null;running=false;q('[data-map-pause]').disabled=true;}
 function draw(p){
  progress=p;if(!sample)return;
  const stage=p<1/3?0:p<2/3?1:2;
  dialog.dataset.mapStage=String(stage);
  q('[data-map-token]').style.transform=`translateX(${p*Math.max(0,q('.cl-map-flow').clientWidth-14)}px)`;
  q('[data-map-token]').style.opacity=p>0&&p<1?'1':'0';
  q('[data-map-status]').textContent=p===1?`map() คืนค่า ${sample.result}`:[`รับค่า Input: x = ${sample.value}`,'แทนค่าในสมการ แล้วปรับสัดส่วนไปยังช่วงใหม่',`ส่งค่า Output: ${sample.result}`][stage];
 }
 function update(final=true){
  stop();try{
   sample=mapValue(Object.fromEntries(parameters.map(([name])=>[name,form.elements[name].value===''?NaN:Number(form.elements[name].value)])));
   q('[data-map-error]').hidden=true;pin.disabled=false;
   pin.min=Math.min(sample.inMin,sample.inMax);pin.max=Math.max(sample.inMin,sample.inMax);pin.dir=sample.inMax<sample.inMin?'rtl':'ltr';pin.value=sample.value;
   pin.setAttribute('aria-valuetext',`ค่าเข้า x เท่ากับ ${sample.value}`);
   q('[data-map-input-axis]').innerHTML=axis(sample.inMin,sample.inMax);
   q('[data-map-output-axis]').innerHTML=axis(sample.outMin,sample.outMax,sample.rise===0?.5:(sample.result-sample.outMin)/sample.rise,sample.result);
   q('[data-map-input-value]').textContent=sample.value;q('[data-map-result]').textContent=sample.result;
   q('[data-map-input-caption]').textContent=`ช่วงขาเข้า ${sample.inMin} → ${sample.inMax}`;
   q('[data-map-output-caption]').textContent=sample.rise===0?`ช่วงขาออกคงที่ ${sample.outMin}`:`ช่วงขาออก ${sample.outMin} → ${sample.outMax}`;
   q('[data-map-equation]').innerHTML=`<span>y =</span><span class="cl-map-fraction"><span>(${sample.value} − (${sample.inMin})) × (${sample.outMax} − (${sample.outMin}))</span><span>${sample.inMax} − (${sample.inMin})</span></span><span>+ (${sample.outMin})</span>`;
   q('[data-map-ratio]').textContent=`ค่าเข้าอยู่ที่ ${(sample.ratio*100).toFixed(1)}% ของช่วง → ใช้สัดส่วนเดียวกันกับช่วงขาออก`;
   const ideal=sample.delta*sample.rise/sample.run+sample.outMin;
   q('[data-map-rounding]').textContent=`สมการได้ ${Number(ideal.toFixed(3)).toLocaleString('en-US')} → map() คืนจำนวนเต็ม ${sample.result}`;
   const outside=sample.ratio<0||sample.ratio>1;q('[data-map-outside]').hidden=!outside;q('[data-map-outside]').textContent=`x = ${sample.value} อยู่นอกช่วงขาเข้า หมุดแสดงที่ขอบกราฟ แต่ map() ยังแปลงต่อได้เป็น ${sample.result} โดยไม่บีบค่าให้อยู่ในช่วง`;
   for(const b of dialog.querySelectorAll('[data-map-play],[data-map-step],[data-map-reset]'))b.disabled=false;
   draw(final?1:0);return true;
  }catch(error){sample=null;pin.disabled=true;q('[data-map-error]').hidden=false;q('[data-map-error]').textContent=error.message;q('[data-map-result]').textContent='—';q('[data-map-input-value]').textContent='—';q('[data-map-equation]').textContent='กำหนดช่วงขาเข้าที่ min กับ max ต่างกัน';q('[data-map-ratio]').textContent='';q('[data-map-rounding]').textContent='';q('[data-map-outside]').hidden=true;q('[data-map-status]').textContent='แก้ตัวเลขในฟังก์ชันก่อนเริ่ม';for(const b of dialog.querySelectorAll('[data-map-play],[data-map-step],[data-map-reset]'))b.disabled=true;return false;}
 }
 function tick(time){if(!running)return;draw(Math.max(0,Math.min(1,(time-started)/duration)));if(progress<1)frame=requestAnimationFrame(tick);else stop();}
 function play(){if(!sample)return;if(motion.matches){stop();draw(1);return;}if(progress===1)draw(0);running=true;started=performance.now()-progress*duration;q('[data-map-pause]').disabled=false;frame=requestAnimationFrame(tick);}
 document.addEventListener('click',e=>{const button=e.target.closest('[data-map-open]');if(!button)return;opener=button;form.elements.value.value=getRaw();update();dialog.showModal();});
 q('[data-map-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{stop();opener?.focus();});
 form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',()=>update());
 pin.addEventListener('input',()=>{form.elements.value.value=pin.value;update();});
 q('[data-map-play]').addEventListener('click',()=>{stop();play();});
 q('[data-map-pause]').addEventListener('click',()=>{stop();q('[data-map-status]').textContent='พักภาพ · กด Animate map() เพื่อเล่นต่อ';});
 q('[data-map-step]').addEventListener('click',()=>{stop();draw(progress>=1?0:Math.min(1,(Math.floor(progress*3+0.001)+1)/3));});
 q('[data-map-reset]').addEventListener('click',()=>{stop();draw(0);});
 dialog.querySelectorAll('[data-map-preset]').forEach(button=>button.addEventListener('click',()=>{const values={pwm:[2048,0,4095,0,255],servo:[2048,0,4095,0,180],reverse:[2048,0,4095,255,0]}[button.dataset.mapPreset];parameters.forEach(([key],i)=>form.elements[key].value=values[i]);update();}));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 motion.addEventListener('change',()=>{if(motion.matches&&sample){stop();draw(1);}});
 update();return stop;
}
