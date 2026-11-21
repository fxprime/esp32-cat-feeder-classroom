import {highlightLines} from '../vendor/code-highlight.js';
import {tactileControl} from './tactile.js';
import {mapDialogHTML} from './map-lab.js';
import {examples,buildProgram} from './content.js';
import {catScene} from './cat-scene.js';
import {functionLessons} from './function-lessons.js';
import {timingLessons,timingProgram,timingSampleStep} from './timing-lessons.js';
import {logicHTML,logicLesson} from './logic-lesson.js';
import {feederTimingHTML} from './feeder-timing.js';
import {driveCode} from './drive-code.js';
import {driveCourse} from './drive-model.js';
import {esc,benchSVG} from './drawing.js';
const zero={time:0,wait:0,setupCount:0,loopCount:0,leds:{23:0,22:0,21:0},pins:{},vars:{},stack:[],log:[]};
export function codeRows(lines){const highlighted=highlightLines(lines.map(l=>l.code).join('\n'));return lines.map((l,i)=>`<button type="button" class="cl-code-line" data-line="${esc(l.id)}"><span class="cl-line-no" aria-hidden="true">${i+1}</span><code class="hljs language-arduino">${highlighted[i]}</code></button>`).join('');}
function controls(id){return `<div class="cl-settings">${['blink','for'].includes(id)?'<label>เวลาที่ใช้รอ<select data-option="delay"><option value="250">250 ms</option><option value="500" selected>500 ms</option><option value="1000">1000 ms</option><option value="1500">1500 ms</option></select></label>':''}${id==='blink'?'<label>ทดลองไวยากรณ์<select data-option="fault"><option value="none">โค้ดครบ</option><option value="semicolon">ลบ ; หลัง digitalWrite</option><option value="brace">ลบปีกกาปิด loop()</option></select></label>':''}</div>`;}
export function renderPanel(example){
 const {id,title,intro,challenge,wiring,file}=example;
 if(id===logicLesson.id)return logicHTML();
 if(id==='timing')return renderTimingChooser(example);
 if(id==='function')return renderFunctionChooser();
 const isTiming=timingLessons.some(lesson=>lesson.id===id);
 const program=isTiming?timingProgram(id):buildProgram(id),first=program.lines[0];
 const isSerial=id==='serial';
 const isFunctionSketch=functionLessons.some(lesson=>lesson.id===id);
 const hasMonitor=isSerial;
 const monitor=`<div class="cl-serial cl-output-receiver${isSerial?' cl-serial-expanded':''}"><span data-output-target="serial-header">Serial Monitor · 115200</span><pre data-log${hasMonitor?' tabindex="0" aria-label="ข้อความใน Serial Monitor"':''}><span data-log-history>ยังไม่มีข้อความ</span><span data-output-target="serial-line"></span>${hasMonitor?'<span data-log-tail></span><i class="cl-serial-cursor" aria-hidden="true"></i>':''}</pre></div>`;
 const bench=`<div class="cl-bench-receiver cl-output-receiver"><div data-bench>${hasMonitor?'':benchSVG(id,zero,{button:false,raw:2048})}</div></div>`;
 const art=isFunctionSketch?`<div class="cl-cat-scene cl-output-receiver"><div data-cat-scene>${catScene(id,zero)}</div></div>`:bench;
 const settings=isSerial ? 'ดูแถบสีฟ้าว่าคำสั่งเพิ่งส่งข้อความส่วนไหน และดูเคอร์เซอร์ว่าค่าถัดไปจะมาตรงไหน'
  : isFunctionSketch ? 'เดินทีละคำสั่งแล้วดูว่าเกิดอะไรขึ้นกับโมจิ'
  : isTiming
  ? (id==='timing-millis' ? `ตัวอย่างนี้ขยับนาฬิกาจำลองทีละ ${timingSampleStep} ms ต่อรอบ เพื่อให้เห็นการเก็บค่า now` : 'ดูเวลาจำลองและค่า samples ระหว่างรอ')
  : 'ปรับเวลารอแล้วเริ่มตัวอย่างใหม่ · ความเร็วแอนิเมชันใช้ดูขั้นตอน เวลาในโค้ดยังเท่าเดิม';
 return `<div class="cl-panel-inner${isSerial?' cl-serial-lesson':''}"><div class="cl-example-heading">${isFunctionSketch?'':'<span class="cl-kicker">อ่านโค้ด แล้วดูอุปกรณ์ทำงาน</span>'}<h2>${esc(title)}</h2><p>${esc(intro)}</p></div>${isTiming||isSerial||isFunctionSketch?'':controls(id)}${id==='sensor'?'<button type="button" class="cl-map-open" data-map-open>ลอง map(): แปลงช่วงตัวเลข ↗</button>':''}<p class="cl-setting-note">${settings}</p><div class="cl-toolbar"><div><button type="button" data-action="back" aria-label="ย้อนหนึ่งคำสั่ง" disabled>← ย้อน</button><button type="button" data-action="step" class="cl-primary">เดินทีละคำสั่ง →</button><button type="button" data-action="play">▶ เล่นโค้ด</button><button type="button" data-action="reset">↶ เริ่มใหม่</button></div><button type="button" data-action="download">ดาวน์โหลด .ino</button><label class="cl-speed-control">ความเร็วแอนิเมชัน <select data-speed><option value="0.5">ช้า 0.5×</option><option value="1" selected>ปกติ 1×</option><option value="2">เร็ว 2×</option></select></label><div class="cl-dock cl-output-receiver"><div data-dock></div></div></div><div class="cl-error" role="alert" hidden></div><div class="cl-experiment"><div class="cl-code-card"><div class="cl-code-heading"><div class="cl-code-meta"><span>${esc(file)}</span><small data-execution-scope>กดบรรทัดเพื่ออ่านความหมาย</small></div><button type="button" class="cl-scope-toggle" data-action="scope-view" aria-controls="code-${id}" aria-pressed="false">แสดงโค้ดทั้งหมด</button></div><div class="cl-memory"><h3>ค่าที่เก็บอยู่ตอนนี้</h3><div class="cl-registers" data-memory><span>ยังไม่มีคำสั่งกำหนดค่า</span></div></div><div class="cl-effect-slot"><div class="cl-effect" data-step-effect hidden></div></div><div class="cl-code-list" id="code-${id}">${codeRows(program.lines)}</div><div class="cl-code-note"><strong data-note-title>${esc(first.title)}</strong><p data-note-body>${esc(first.explain)}</p></div></div><div class="cl-stage"><div class="cl-visual"><div class="cl-meter-row"><span>setup <b data-setup>0</b> ครั้ง</span><span>loop รอบ <b data-loops>0</b></span><span>เวลาจำลอง <b data-time>0</b> ms</span></div>${isSerial?monitor:art}${id==='condition'?tactileControl('data-button'):''}${id==='sensor'?'<div class="cl-sensor"><label>ค่าเซนเซอร์ที่กำลังส่ง <output data-raw-value>2048</output><input type="range" min="0" max="4095" step="1" value="2048" aria-label="ค่า ADC จำลอง 0 ถึง 4095" data-raw></label><p>ค่าบนแถบเปลี่ยนได้ทันที แต่ raw จะเปลี่ยนเมื่อ analogRead() ทำงาน</p></div>':''}<p class="cl-live" role="status" data-live>กดเดินทีละคำสั่งเพื่อเริ่ม</p><div class="cl-stack"><span>ตอนนี้อยู่ที่</span><strong data-stack>ยังไม่เริ่ม</strong></div></div>${isSerial||isFunctionSketch?'':monitor}</div></div>${wiring?`<p class="cl-wiring"><b>ต่ออุปกรณ์:</b> ${esc(wiring)}</p>`:''}<div class="cl-predict"><span>ลองสังเกต</span><p>${esc(challenge)}</p></div></div>`;
}
function renderFunctionChooser(){
 const choices=functionLessons;
 return `<section class="cl-panel-inner cl-timing-menu" aria-labelledby="function-menu-title">
  <div class="cl-example-heading"><h2 id="function-menu-title">ลองเรียกฟังก์ชันกับโมจิ</h2></div>
  <div class="cl-timing-choices" role="group" aria-label="รูปแบบฟังก์ชัน">
   ${choices.map(({id,label},index)=>`<button type="button" data-function-choice="${id}" aria-pressed="${index===0}" aria-controls="function-view-${id}">${esc(label)}</button>`).join('')}
  </div>
 </section>
 ${choices.map((lesson,index)=>`<section id="function-view-${lesson.id}" data-function-view="${lesson.id}" ${index?'hidden="until-found"':''}>${renderPanel(lesson)}</section>`).join('')}`;
}
function renderTimingChooser(example){
 const choices=[...timingLessons,{id:'comparison',label:'Comparison'}];
 return `<section class="cl-panel-inner cl-timing-menu" aria-labelledby="timing-menu-title">
  <div class="cl-example-heading"><h2 id="timing-menu-title">ทดลองจับเวลาใน loop()</h2></div>
  ${feederTimingHTML()}
  <p class="cl-setting-note">ตัวอย่างต่อยอด · เดินคำสั่งจับเวลา หรือเทียบกับสนามรถ</p>
  <div class="cl-timing-choices">
   ${choices.map(({id,label})=>`<button type="button" id="choose-${id}" data-timing-choice="${id}" aria-expanded="false" aria-controls="timing-view-${id}">${label}</button>`).join('')}
  </div>
 </section>
 ${choices.map(({id})=>`<div id="timing-view-${id}" data-timing-view="${id}" hidden>${id==='comparison'?renderTiming(example):renderPanel(timingLessons.find(lesson=>lesson.id===id))}</div>`).join('')}`;
}
function renderTiming({title,intro}){
 const {turnDuration,minTurnDuration,maxTurnDuration,dodgeRightMs,dodgeLeftMs,pollEvery}=driveCourse;
 return `<div class="cl-panel-inner cl-drive-lab">
  <div class="cl-example-heading">
   <span class="cl-kicker">delay() / millis()</span>
   <h2>${esc(title)}</h2>
   <p>${esc(intro)}</p>
  </div>
  <div class="cl-drive-controls">
   <button type="button" data-drive-play>▶ เริ่มวิ่ง</button>
   <button type="button" data-drive-drop disabled>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 7 8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4m-8 4v10M8 5l8 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>ปล่อยกล่อง
   </button>
   <button type="button" data-drive-reset>↶ ตั้งต้น</button>
   <label class="cl-drive-delay">เวลาเลี้ยวโค้ง <output data-drive-turn-value aria-live="off">${turnDuration.toLocaleString('en-US')} ms</output>
    <input data-drive-turn type="range" min="${minTurnDuration}" max="${maxTurnDuration}" step="${pollEvery}" value="${turnDuration}" aria-label="เวลาเลี้ยวโค้งเป็นมิลลิวินาที" aria-describedby="drive-turn-note">
   </label>
   <span class="cl-drive-clock">เวลาจำลอง <b data-drive-time>0.00 วิ</b></span>
  </div>
  <p class="cl-drive-code-note" id="drive-turn-note">เวลาที่ปรับจะใช้ตอนเข้าโค้งถัดไป ส่วนจังหวะหลบใช้เวลาที่จูนไว้แล้ว <b>ขวา ${dodgeRightMs} ms → ซ้าย ${dodgeLeftMs} ms → ขวา ${dodgeRightMs} ms</b></p>
  <div class="cl-drive-stage">
   <div class="cl-drive-views">
    <svg class="cl-drive-map" viewBox="-28 -16 56 32" role="img" aria-label="ผังลู่วงรีสองทางตรงสองโค้งรอบสนามฟุตบอล">
    <rect x="-27.8" y="-15.9" width="55.6" height="31.8" rx="3" fill="#a8c4a4"/>
    <path d="M-12-11H12a11 11 0 0 1 0 22H-12a11 11 0 0 1 0-22Z" fill="none" stroke="#3b4b58" stroke-width="8.8"/>
    <path d="M-12-11H12a11 11 0 0 1 0 22H-12a11 11 0 0 1 0-22Z" fill="none" stroke="#cfdae0" stroke-width=".3"/>
    <rect x="-12" y="-5.65" width="24" height="11.3" rx=".2" fill="#6eaa6a" stroke="#dcefd8" stroke-width=".28"/>
    <path d="M0-5.65V5.65m-12-3h2.5v-6H-12m24 0H9.5v6H12" fill="none" stroke="#dcefd8" stroke-width=".28"/>
    <circle r="1.45" fill="none" stroke="#dcefd8" stroke-width=".28"/>
    <path d="M-8.2 6.6v8.8" stroke="#fff" stroke-dasharray=".65 .65" stroke-width=".55"/>
    <circle data-drive-map="delay" cx="-8.2" cy="7.7" r="1.22" fill="#f9b453" stroke="#172a3c" stroke-width=".35"/>
    <circle data-drive-map="millis" cx="-8.2" cy="12.1" r="1.22" fill="#56e2ed" stroke="#172a3c" stroke-width=".35"/>
    </svg>
    ${['delay','millis'].map(kind=>`<section class="cl-drive-view">
     <div class="cl-drive-driver" data-drive-kind="${kind}">
      <code>${kind}()</code><span class="cl-drive-lap" data-drive-lap>รอบ 1</span><span data-drive-state>พร้อมวิ่ง</span><small data-drive-read></small>
      <div class="cl-drive-pwm">
       <strong>PWM</strong>
       ${['left','right'].map((side,index)=>`<label>${index===0?'ซ้าย':'ขวา'} <b data-pwm-value="${side}">0</b><meter data-pwm="${side}" aria-label="PWM ล้อ${index===0?'ซ้าย':'ขวา'}" min="0" max="255" value="0"></meter></label>`).join('')}
      </div>
     </div>
     <canvas data-drive-canvas="${kind}" role="img" aria-label="กล้องติดตามรถ ${kind} บนลู่วิ่งวงรี">สนามทดลองรถ ${kind}</canvas>
    </section>`).join('')}
   </div>
  </div>
  <p class="cl-drive-result" data-drive-result role="status">กดเริ่มวิ่ง รถจะวิ่งวน ผ่านเส้นเดิมได้หลายรอบ</p>
  <div class="cl-drive-code-switch" aria-label="เลือกโค้ดที่ติดตาม">
   <button type="button" data-drive-task="loop" aria-pressed="true">โค้ดตัดสินใจ</button>
   <button type="button" data-drive-task="motor" aria-pressed="false">โค้ดมอเตอร์ PWM</button>
  </div>
  ${['loop','motor'].map(task=>`<div class="cl-drive-traces" data-drive-traces="${task}" ${task==='motor'?'hidden':''}>
   ${['delay','millis'].map(kind=>{
     const source=driveCode[task==='motor'?'motor':kind];
     return `<section class="cl-drive-trace" data-drive-trace="${kind}">
      <header><code>${kind}()</code><span data-drive-trace-status>พร้อมรันโค้ด</span></header>
      <div class="cl-drive-trace-scroll" role="region" tabindex="0" aria-label="โค้ด ${task==='motor'?'มอเตอร์':'ตัดสินใจ'} ของรถ ${kind}">
       <code class="hljs language-arduino">${highlightLines(source).map((markup,index)=>`<span class="cl-drive-code-line" data-drive-code-line="${index+1}"><span aria-hidden="true">${index+1}</span><span>${markup||' '}</span></span>`).join('')}</code>
      </div>
     </section>`;
   }).join('')}
  </div>`).join('')}
  <p class="cl-drive-code-note">งานคุมล้อแยกรันทุก ${pollEvery} ms รถฝั่ง <code>delay()</code> พักลูปตอนค้างเลี้ยวและหักหลบ รถฝั่ง <code>millis()</code> เช็กเวลาไปพร้อมกับอ่านเซนเซอร์ทั้งสองช่วง</p>
 </div>`;
}
export function lessonHTML(){return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>บท 9 · อ่านโค้ด ESP32 แล้วทดลองดูผล</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Prompt:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="../styles/slide-support.css"><link rel="stylesheet" href="../styles/code-lab.css"><link rel="stylesheet" href="../styles/syntax-dracula.css"><link rel="stylesheet" href="../styles/code-lab-interactions.css"></head><body><main class="cl-lesson"><div class="cl-hero"><span class="cl-kicker">ESP32 ม.4 · เดินโค้ดทีละคำสั่ง</span><h1>โค้ดบรรทัดนี้ ทำให้อะไรเปลี่ยน?</h1><p>เดิน setup() กับ loop() ของไฟแดง แล้วลองเปลี่ยนค่าในเงื่อนไขเพื่อดูว่า if เลือกทางไหน</p><div class="cl-reading-key"><span><i></i> แถบฟ้า = คำสั่งที่เพิ่งทำ</span><span>กดบรรทัด = อ่านคำอธิบาย</span><span>รีเซ็ต = เริ่ม setup() ใหม่</span></div></div><div class="cl-tab-wrap"><div class="cl-tabs" role="tablist" focusgroup="tablist nomemory" aria-label="เลือกโครงสร้างโค้ด">${examples.map((e,i)=>`<button type="button" role="tab" id="code-tab-${e.id}" data-tab="${e.id}" aria-selected="${i===0}" ${i===0?'focusgroupstart':''}><span>${i+1}</span>${esc(e.label)}</button>`).join('')}</div><span class="cl-tab-hint">เลื่อนแถวเพื่อดูหัวข้อถัดไป →</span></div><div class="cl-panels">${examples.map((e,i)=>`<section role="tabpanel" id="code-panel-${e.id}" aria-labelledby="code-tab-${e.id}" data-example="${e.id}" ${i?'hidden="until-found"':''}>${renderPanel(e)}</section>`).join('')}</div><div class="cl-footnotes"><details><summary>ขอบเขตของการทดลอง</summary><p>ตัวอย่างพื้นฐานเดินคำสั่งด้วยแบบจำลอง ตัวอย่างฟังก์ชันโมจิ รวมถึง delay / millis และ Serial print รันโค้ด C++ ที่คอมไพล์เป็น WebAssembly ตัวอย่าง LED ใช้เวลาจำลอง ส่วนสนามรถเชื่อมกับเซนเซอร์และมอเตอร์จำลอง</p></details><p>อ้างอิง <a href="https://docs.arduino.cc/language-reference/" target="_blank" rel="noopener">Arduino Language Reference</a> · <a href="https://docs.espressif.com/projects/arduino-esp32/en/latest/api/gpio.html" target="_blank" rel="noopener">Espressif GPIO</a> · <a href="https://docs.espressif.com/projects/arduino-esp32/en/latest/api/ledc.html" target="_blank" rel="noopener">Espressif LEDC</a></p></div>${mapDialogHTML()}</main><script src="../scripts/slide-support.js"></script><script type="module" src="../scripts/code-lab/app.js"></script></body></html>`;}
