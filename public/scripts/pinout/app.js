import { pins, filters, recipes, pinAdvice, docs } from './data.js';
import { boardSVG, circuitSVG, escapeHTML as esc } from './diagrams.js';
const $=s=>document.querySelector(s);
let filter='all',activePin=pins.find(p=>p.id==='18'),category='ทั้งหมด',recipe=null,step=0,selected=-1,powered=false,value=0,motion=false,armed=false,reverse=false,downloadURL;
let audioContext,oscillator;
function stopAudio(){if(oscillator){try{oscillator.stop();}catch{}oscillator=null;}if(audioContext?.state==='running')audioContext.suspend().catch(()=>{});}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function view(name){
 stopAudio();
 for(const [id,v] of [['pinout-view','pinout'],['projects-view','projects'],['workbench','bench']])$(`#${id}`).hidden=v!==name;
 $('#show-pinout').setAttribute('aria-pressed',name==='pinout');
 $('#show-projects').setAttribute('aria-pressed',name!=='pinout');
 if(name!=='bench'){motion=false;powered=false;applyMotion();}
}
function renderPins(){
 $('#filters').innerHTML=filters.map(([id,label])=>`<button data-filter="${id}" aria-pressed="${id===filter}">${esc(label)}</button>`).join('');
 $('#pin-select').innerHTML=pins.map(p=>`<option value="${p.key}" ${p.key===activePin.key?'selected':''}>${p.side?'ขวา':'ซ้าย'} · ${p.label}</option>`).join('');
 $('#board').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 550" role="group" aria-label="ผังพิน DevKit V1 30 พิน เสาอากาศอยู่ด้านบน USB อยู่ด้านล่าง" style="font-family:Arial,sans-serif">${boardSVG({x:125,y:25,interactive:true,active:activePin.key,filter})}</svg>`;
 const p=activePin;
 const related=recipes.filter(r=>r.pins.includes(p.id));
 const suggestions=p.caps.includes('adc1')?recipes.filter(r=>['pot','ldr'].includes(r.id)):p.caps.includes('pwm')?recipes.filter(r=>['servo','i2c','uart'].includes(r.id)):recipes.filter(r=>['servo','pot','uart'].includes(r.id));
 $('#pin-detail').innerHTML=`<span class="eyebrow">PIN EXPLORER / ${p.side?'RIGHT':'LEFT'} HEADER</span><div class="pin-number">${/^\d+$/.test(p.id)?'GPIO ':''}${esc(p.id)}</div><h2>${p.inputOnly?'Analog IN / รับเข้าเท่านั้น':p.risk==='strap'?'ใช้ได้ แต่ระวังตอนบูต':p.risk==='usb'?'Serial USB / UART0':p.caps.includes('power')?'ไฟเลี้ยง / ควบคุม':'Digital I/O · เลือกหน้าที่ผ่านโค้ด'}</h2><div class="cap-tags">${p.caps.map(id=>`<span>${esc(filters.find(f=>f[0]===id)?.[1]||id)}</span>`).join('')}</div><p>${esc(pinAdvice(p))}</p>${p.caps.includes('touch')?`<p class="small">Touch: ลองอ่าน <code>touchRead(${p.id})</code> แล้วเทียบค่าตอนสัมผัส/ไม่สัมผัส ตั้ง threshold จากค่าที่วัดจริง · เริ่มที่ GPIO32/33 เพื่อเลี่ยงขา boot</p>`:''}<h3>${related.length?'ลองใช้กับโปรเจกต์':'พื้นฐานที่เกี่ยวข้อง'}</h3><div class="pin-projects">${(related.length?related:suggestions).map(r=>`<button data-project="${r.id}">${esc(r.title)} <span>↗</span></button>`).join('')}</div>${!related.length?'<p class="small">วงจรด้านบนยังใช้พินตามตัวอย่าง ไม่ได้เปลี่ยนเป็นพินที่เลือกอัตโนมัติ หากจะเปลี่ยนพิน ให้แก้ทั้งสายและโค้ดตามทิศทางที่พินรองรับ</p>':''}<p class="small">${filter==='all'?'เลือกตัวกรองด้านบนเพื่อดูขาที่ทำหน้าที่เดียวกัน':`ตัวกรอง: ${esc(filters.find(f=>f[0]===filter)[1])} · ${pins.filter(p=>p.caps.includes(filter)).length} ตำแหน่ง`} · ฟังก์ชันหลายอย่างแชร์พิน ไม่ได้ใช้พร้อมกันทั้งหมด</p>`;
}
$('#filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;const suggested={adc1:'34',adc2:'25',dac:'25',pwm:'18',i2c:'21',spi:'18',uart:'17',i2s:'26',touch:'32',power:'3V3',digital:'23'}[filter];if(suggested)activePin=pins.find(p=>p.id===suggested);renderPins();$(`[data-filter="${filter}"]`).focus();}});
$('#pin-select').addEventListener('change',e=>{activePin=pins.find(p=>p.key===e.target.value);renderPins();$('#pin-select').focus();});
function pickPin(e){const target=e.target.closest('[data-pin]');if(!target)return;activePin=pins.find(p=>p.key===target.dataset.pin);renderPins();$(`[data-pin="${activePin.key}"]`).focus();}
$('#board').addEventListener('click',pickPin);
$('#board').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pickPin(e);}});
function catalog(){
 const q=$('#project-search').value.trim().toLowerCase();
 const shown=recipes.filter(r=>(category==='ทั้งหมด'||r.category===category)&&`${r.title} ${r.subtitle} ${r.part} ${r.parts.join(' ')} ${r.pins.join(' ')}`.toLowerCase().includes(q));
 $('#project-grid').innerHTML=shown.map(r=>`<button class="project-card" data-project="${r.id}"><img src="../assets/wiring/${r.id}.webp" width="600" height="405" loading="lazy" decoding="async" alt=""><span class="card-text"><span class="card-category">${esc(r.category)} / ${String(recipes.indexOf(r)+1).padStart(2,'0')}</span><strong>${esc(r.title)}</strong><p>${esc(r.subtitle)}</p><span class="card-pins">GPIO ${r.pins.join(' · ')}</span></span></button>`).join('');
 $('#no-projects').hidden=shown.length>0;
 $('#categories').innerHTML=['ทั้งหมด','ขยับ','เสียง','เซนเซอร์','สื่อสาร'].map(c=>`<button data-category="${c}" aria-pressed="${category===c}">${c}</button>`).join('');
}
$('#categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b){category=b.dataset.category;catalog();$(`[data-category="${category}"]`).focus();}});
$('#project-search').addEventListener('input',catalog);
$('#show-pinout').addEventListener('click',()=>view('pinout'));
$('#show-projects').addEventListener('click',()=>{view('projects');catalog();});
$('#back-catalog').addEventListener('click',()=>{view('projects');catalog();$('#project-search').focus();});
function openRecipe(id){
 recipe=recipes.find(r=>r.id===id);if(!recipe)return;
 step=recipe.wires.length;selected=-1;powered=false;value=recipe.control[3];motion=false;armed=false;reverse=false;
 $('#recipe-title').textContent=recipe.title;$('#recipe-subtitle').textContent=recipe.subtitle;
 $('#svg-download').href=`../assets/wiring/${recipe.id}.svg`;
 $('#webp-download').href=`../assets/wiring/${recipe.id}-full.webp`;
 $('#parts').innerHTML=recipe.parts.map(p=>`<li>${esc(p)}</li>`).join('');
 $('#recipe-notes').innerHTML=recipe.notes.map(p=>`<li>${esc(p)}</li>`).join('');
 $('#recipe-refs').innerHTML=recipe.refs.map(id=>`<a href="${docs[id]}" target="_blank" rel="noopener">${esc(id.toUpperCase())} · เอกสารผู้ผลิต ↗</a>`).join('');
 $('#recipe-code').textContent=recipe.code;
 $('#code-library').textContent=recipe.library?`ติดตั้งไลบรารี: ${recipe.library.split('\n').join(', ')}`:'ใช้ไลบรารีที่มากับ Arduino-ESP32 core 3.x';
 if(downloadURL)URL.revokeObjectURL(downloadURL);
 downloadURL=URL.createObjectURL(new Blob([recipe.code],{type:'text/plain'}));
 $('#code-download').href=downloadURL;$('#code-download').download=`esp32-${recipe.id}.ino`;
 $('#copy-code').textContent='คัดลอกโค้ด';
 const [label,min,max,initial,unit]=recipe.control;
 $('#value-label').textContent=label;
 Object.assign($('#sim-value'),{min,max,value:initial,step:1});
 $('#listen-audio').hidden=!['dac','i2s','active','passive'].includes(id);
 $('#sim-power').checked=false;$('#arm-esc').hidden=id!=='esc';$('#reverse-motor').hidden=id!=='dc';
 $('#zoom-diagram').setAttribute('aria-pressed','false');$('#diagram-scroll').classList.remove('zoomed');
 document.querySelector('.code-panel').open=false;
 view('bench');draw();
 $('#recipe-title').tabIndex=-1;$('#recipe-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-project]');if(b)openRecipe(b.dataset.project);});
function draw(){
 if(!recipe)return;
 if(step!==recipe.wires.length){powered=false;armed=false;motion=false;stopAudio();$('#sim-power').checked=false;}
 $('#diagram').innerHTML=circuitSVG(recipe,{step,selected,powered,value});
 $('#wire-list').innerHTML=recipe.wires.map((wire,i)=>`<li><button data-wire-index="${i}" class="${i>=step?'pending':''}" aria-pressed="${selected===i}">${esc(wire.label)}${i>=step?' · ยังไม่ต่อ':''}</button></li>`).join('');
 $('#wire-progress').textContent=`ต่อแล้ว ${step} / ${recipe.wires.length} สาย`;
 $('#wire-prev').disabled=step===0;$('#wire-next').disabled=step===recipe.wires.length;
 $('#sim-power').disabled=step!==recipe.wires.length;
 if(step!==recipe.wires.length){powered=false;armed=false;motion=false;$('#sim-power').checked=false;}
 $('#power-hint').textContent=step!==recipe.wires.length?'ต่อสายให้ครบก่อนเปิดไฟจำลอง':recipe.supply?`ESP32 รับไฟ USB · อุปกรณ์รับไฟ ${recipe.supply} ตามภาพ`:'อุปกรณ์ใช้สัญญาณ 3.3V และ GND ร่วมตามภาพ';
 simulate();
}
$('#wire-list').addEventListener('click',e=>{const b=e.target.closest('[data-wire-index]');if(!b)return;selected=Number(b.dataset.wireIndex);if(selected>=step)step=selected+1;draw();$(`[data-wire-index="${selected}"]`).focus({preventScroll:true});});
$('#clear-wire').addEventListener('click',()=>{selected=-1;draw();});
$('#wire-start').addEventListener('click',()=>{step=0;selected=-1;draw();});
$('#wire-prev').addEventListener('click',()=>{step=Math.max(0,step-1);selected=step?step-1:-1;draw();});
$('#wire-next').addEventListener('click',()=>{step=Math.min(recipe.wires.length,step+1);selected=step-1;draw();});
$('#wire-all').addEventListener('click',()=>{step=recipe.wires.length;selected=-1;draw();});
$('#zoom-diagram').addEventListener('click',()=>{const zoomed=$('#diagram-scroll').classList.toggle('zoomed');$('#zoom-diagram').setAttribute('aria-pressed',zoomed);$('#zoom-diagram').textContent=zoomed?'ย่อให้พอดีหน้าจอ':'ขยายภาพ / เลื่อนดู';});
$('#sim-power').addEventListener('change',e=>{powered=e.target.checked;if(!powered){armed=false;motion=false;stopAudio();}draw();});
$('#sim-value').addEventListener('input',e=>{value=Number(e.target.value);simulate();});
$('#arm-esc').addEventListener('click',()=>{if(armed){armed=false;value=0;$('#sim-value').value=0;}else if(powered&&value===0)armed=true;simulate();});
$('#reverse-motor').addEventListener('click',()=>{if(value===0)reverse=!reverse;simulate();});
function simulate(){
 if(!recipe)return;
 $('#sim-value').disabled=!powered;
 $('#listen-audio').disabled=!powered||(recipe.id==='active'&&value===0);
 $('#sim-output').textContent=`${value}${recipe.control[4]}`;
 $('#arm-esc').disabled=!powered||(!armed&&value!==0);
 $('#arm-esc').textContent=armed?'Disarm จำลอง / หยุด':'Arm จำลอง (Throttle ต้อง 0)';
 $('#reverse-motor').disabled=!powered||value!==0;
 $('#reverse-motor').textContent=`ทิศ: ${reverse?'ย้อนกลับ':'เดินหน้า'} · เปลี่ยนเมื่อ Duty 0`;
 let result='ปิดไฟอยู่ · ต่อสายให้ครบ แล้วเปิดไฟจำลอง';
 if(powered)switch(recipe.id){
 case 'servo': result=`PWM 50 Hz → มุมเป้าหมาย ${value}° · ไฟเลี้ยง Servo มาจาก 5V ภายนอก`;break;
 case 'dac':result=`ค่า DAC ${value}/255 → แรงดันในแบบจำลอง ≈ ${(value/255*3.3).toFixed(2)}V · เสียงต้องเป็นคลื่นที่เปลี่ยนตามเวลา`;break;
 case 'i2s':result=`PCM stereo 16-bit · 16 kHz · โทนตัวอย่าง ${value}Hz → MAX98357A → ลำโพง`;break;
 case 'dc':result=`PWM ${value}% · ${reverse?'ทิศย้อนกลับ':'ทิศเดินหน้า'} · ความเร็วจริงขึ้นกับโหลดและแรงดัน ไม่ได้เป็นเส้นตรงตาม %`;break;
 case 'esc':result=armed?`ARM จำลอง · throttle ${value}% · มอเตอร์${value?'รับคำสั่งหมุน':'ยังหยุด'} (ช่วง µs ตาม ESC)`:'ยังไม่ arm · ตั้ง throttle เป็น 0 ก่อน กด Arm จำลอง';break;
 case 'active':result=value?'HIGH → จ่ายไฟให้ buzzer → ดังที่ความถี่ในตัว':'LOW → buzzer เงียบ';break;
 case 'passive':result=`PWM ${value}Hz → passive piezo สั่นตามความถี่`;break;
 case 'button':result=value?'กดปุ่ม → GPIO27 = LOW (0)':'ปล่อยปุ่ม → pull-up ภายใน → HIGH (1)';break;
 case 'pot':result=`ตำแหน่ง ${value}% → ≈ ${(value/100*3.3).toFixed(2)}V → raw เชิงอุดมคติ ${Math.round(value/100*4095)} / 4095 (ADC จริงอาจอิ่มตัว/ไม่เป็นเส้นตรง)`;break;
 case 'ldr':result=`แสง ${value}% → ค่าอ่านตัวอย่าง ${Math.round(value/100*4095)} · มากแปลว่าสว่างในวงจรตัวอย่าง ไม่ใช่ค่า lux`;break;
 case 'htu21d':result=`ความชื้นตัวอย่าง ${value}% RH · รับผ่าน SDA ตามจังหวะ SCL`;break;
 case 'ds18':case 'i2c':result=`ข้อมูลตัวอย่าง ${value}°C ${recipe.id==='i2c'?'ผ่าน I²C (ไม่ใช่ค่าที่ได้จากการสแกน address)':'จากเซนเซอร์'} · รอการอ่านตามช่วงเวลาของอุปกรณ์`;break;
 case 'ultrasonic':result=`ระยะ ${value}cm → Echo ประมาณ ${Math.round(value*2/.0343)}µs · divider ลด HIGH จาก 5V เหลือ ≈ 3.21V`;break;
 case 'spi':result=value?'พบแท็กตัวอย่าง → CS27 เลือก MFRC522 → อ่าน UID ผ่าน MISO19':'ยังไม่มีแท็กใกล้เสาอากาศ · SPI พร้อมรับส่ง';break;
 case 'uart':result=`A: Serial2.println(${value}) → TX17 → B: RX16 → ได้ "${value}\\r\\n" · B ส่งกลับทาง TX17 → A RX16 ได้เช่นกัน`;break;
 }
 $('#sim-result').textContent=result;
 const servo=$('#servo-arm');if(servo)servo.style.transform=`rotate(${powered?value-90:0}deg)`;
 const dial=$('#dial');if(dial)dial.style.transform=`rotate(${powered?value*2-90:0}deg)`;
 applyMotion();
}
function canMove(){return recipe&&powered&&(['dc','esc','passive','active','i2s','dac'].includes(recipe.id))&&(recipe.id!=='esc'||armed)&&( !['dc','esc','active'].includes(recipe.id)||value>0);}
function applyMotion(){
 if(!recipe)return;
 const enabled=motion&&canMove()&&!reduced.matches&&!document.hidden;
 $('#diagram').classList.toggle('running',enabled);
 const rotor=$('#rotor');if(rotor)rotor.style.animationDirection=reverse?'reverse':'normal';
 $('#motion-toggle').disabled=!canMove()||reduced.matches;
 $('#motion-toggle').textContent=reduced.matches?'ลดการเคลื่อนไหวตามตั้งค่าระบบ':enabled?'หยุดการเคลื่อนไหว':'เล่นการเคลื่อนไหว';
}
$('#motion-toggle').addEventListener('click',()=>{motion=!motion;applyMotion();});
reduced.addEventListener('change',()=>{if(reduced.matches)motion=false;applyMotion();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){motion=false;stopAudio();}applyMotion();});
$('#copy-code').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(recipe.code);$('#copy-code').textContent='คัดลอกแล้ว ✓';}
 catch{const range=document.createRange();range.selectNodeContents($('#recipe-code'));getSelection().removeAllRanges();getSelection().addRange(range);$('#copy-code').textContent='เลือกโค้ดแล้ว · กด Ctrl/Cmd+C';}
});
renderPins();catalog();
const initial=new URLSearchParams(location.search).get('project');if(recipes.some(r=>r.id===initial))openRecipe(initial);

$('#listen-audio').addEventListener('click',async()=>{
 if(!powered)return;
 try{
  stopAudio();audioContext ??= new (window.AudioContext||window.webkitAudioContext)();
  await audioContext.resume();
  if(!powered||document.hidden){stopAudio();return;}
  const tone=audioContext.createOscillator(),gain=audioContext.createGain();
  oscillator=tone;tone.type='sine';tone.frequency.value=['i2s','passive'].includes(recipe.id)?value:recipe.id==='active'?2000:440;
  const now=audioContext.currentTime;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.025,now+.03);gain.gain.setValueAtTime(.025,now+.9);gain.gain.linearRampToValueAtTime(0,now+1);
  tone.connect(gain).connect(audioContext.destination);tone.start(now);tone.stop(now+1.02);
  tone.onended=()=>{tone.disconnect();gain.disconnect();if(oscillator===tone){oscillator=null;audioContext.suspend().catch(()=>{});}};
 }catch{$('#sim-result').textContent='เบราว์เซอร์นี้ยังเล่นเสียงไม่ได้ ดูความถี่จากผลจำลองแทนได้';}
});
