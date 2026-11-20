import {adcMapSVG} from './adc-view.js';
import {sourceCircuitSVG,potentiometerTrackSVG} from './origin-view.js';
import {adcSample,quantizeVoltage,sarTrace} from './model.js';
const $=s=>document.querySelector(s),dialog=$('#adc-dialog');
// Keep native invoker behavior; load the compatibility bundle only when needed.
if(!('commandForElement' in HTMLButtonElement.prototype)){
 try{await import('../vendor/invoker-polyfill.js');}
 catch{document.querySelectorAll('[commandfor="adc-dialog"]').forEach(button=>button.addEventListener('click',()=>button.getAttribute('command')==='close'?dialog.close():dialog.showModal()));}
}
let bits=3,captured=null,previousPause=false,activeConversion=false,lastSample=null;
function voltage(){return Number($('#adc-voltage').value);}
function renderADC(message=null){
 const sample=quantizeVoltage(voltage(),bits),formatV=v=>v.toLocaleString('en-US',{minimumFractionDigits:bits===3?2:4,maximumFractionDigits:4}),previous=lastSample;
 $('#adc-live-v').textContent=`${formatV(sample.voltage)} V`;
 $('#adc-voltage').setAttribute('aria-valuetext',`${formatV(sample.voltage)} โวลต์ อ่านเป็นเลข ${sample.code} จาก ${sample.levels} ระดับ`);
 $('#adc-map-title').textContent=`แบ่งช่วงวัดเป็น ${sample.levels.toLocaleString('en-US')} ระดับ`;
 $('#adc-map-badge').textContent=`เลข 0–${sample.levels-1}`;
 $('#adc-map').innerHTML=adcMapSVG(sample);$('#adc-live-code').textContent=sample.code;
 $('#adc-code-meaning').textContent=`ช่วงที่ให้เลข ${sample.code}`;
 $('#adc-map-description').textContent=`${formatV(sample.voltage)} V อยู่ในช่วงที่ให้เลข ${sample.code} → ADC ส่งเลข ${sample.code}`;
 $('#adc-selected-range').innerHTML=`<span>ขอบของช่วงที่ให้เลข ${sample.code}</span><strong>${sample.lower.toFixed(bits===3?4:6)} V ถึง${sample.code===sample.levels-1?'':'ก่อน'} ${sample.upper.toFixed(bits===3?4:6)} V</strong><p>${bits===3?'ทุกแรงดันในช่วงนี้อ่านได้เลข ': 'ช่วงหนึ่งกว้างประมาณ 0.806 mV → อ่านได้เลข '}<b>${sample.code}</b></p>`;
 if(message)$('#adc-change-note').textContent=message;
 else if(previous?.bits===bits&&previous.voltage!==sample.voltage)$('#adc-change-note').textContent=previous.code===sample.code?`แรงดันเปลี่ยนแล้ว แต่ยังอยู่ช่วงเดิม จึงยังได้เลข ${sample.code}`:`ข้ามขอบช่วงแรงดันแล้ว เลขเปลี่ยนจาก ${previous.code} เป็น ${sample.code}`;
 $('#adc-resolution-bridge').hidden=bits!==3;$('#adc-esp32-section').hidden=bits!==12;
 $('#adc-binary-note').textContent=`${bits} บิตเก็บได้ 2 ยกกำลัง ${bits} = ${sample.levels} ค่า เลข ${sample.code} เขียนเป็นฐานสองได้ ${sample.binary} ความกว้างหนึ่งช่วง = 3.3 ÷ ${sample.levels} ≈ ${(sample.lsb*1000).toFixed(3)} mV`;
 lastSample=sample;renderOrigin();
}
function examples(){
 const values=bits===3?[1,1.2,1.3]:[1,1.0004,1.001];
 $('#adc-examples').innerHTML=values.map((v,i)=>`<button type="button" data-adc-v="${v}"><span>${i+1}</span> ลอง ${v.toFixed(bits===3?2:4)} V</button>`).join('');
}
function setResolution(next){
 const before=quantizeVoltage(voltage(),bits);bits=next;captured=null;$('#adc-snapshot').hidden=true;
 document.querySelectorAll('[name="adc-resolution"]').forEach(r=>r.checked=Number(r.value)===bits);examples();
 renderADC(bits===12?`แรงดันเดิม ${before.voltage.toFixed(4)} V แบ่งละเอียดขึ้นจาก 8 เป็น 4096 ระดับ`:'ลอง 1.00 V → 1.20 V → 1.30 V แล้วสังเกตเลขที่ได้');
}
function begin(){sarRound=0;sarCaptured=null;bits=3;captured=null;lastSample=null;$('#adc-voltage').value='1';$('#adc-snapshot').hidden=true;document.querySelectorAll('.adc-extra,.adc-sar-details').forEach(d=>d.open=false);setResolution(3);dialog.scrollTop=0;}
function observeOpen(){
 if(dialog.open&&!activeConversion){activeConversion=true;previousPause=!!window.esp32PauseGraphs;window.esp32PauseGraphs=true;begin();syncInsets();}
 else if(!dialog.open&&activeConversion){window.esp32PauseGraphs=previousPause;activeConversion=false;}
}
function syncInsets(){
 if(!dialog.open)return;
 const head=dialog.querySelector('.adc-head'),control=dialog.querySelector('.adc-voltage-control');
 dialog.style.setProperty('--adc-head-height',`${head.getBoundingClientRect().height}px`);
 dialog.style.setProperty('--adc-sticky-control-height',getComputedStyle(control).position==='sticky'?`${control.getBoundingClientRect().height}px`:'0px');
}
const controlSizer=new ResizeObserver(syncInsets);
controlSizer.observe(dialog.querySelector('.adc-head'));
controlSizer.observe(dialog.querySelector('.adc-voltage-control'));
new MutationObserver(observeOpen).observe(dialog,{attributes:true,attributeFilter:['open']});
dialog.addEventListener('close',()=>{if(!dialog.open)observeOpen();});
dialog.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','f','F'].includes(e.key))e.stopPropagation();});
$('#adc-voltage').addEventListener('input',()=>renderADC());
document.querySelectorAll('[name="adc-resolution"]').forEach(r=>r.addEventListener('change',()=>setResolution(Number(r.value))));
$('#adc-examples').addEventListener('click',e=>{const b=e.target.closest('[data-adc-v]');if(b){$('#adc-voltage').value=b.dataset.adcV;renderADC();}});
$('#adc-use-esp32').addEventListener('click',()=>{setResolution(12);$('#adc-map-title').scrollIntoView({block:'center',behavior:'instant'});});
$('#adc-restart').addEventListener('click',begin);
$('#adc-read').addEventListener('click',()=>{
 if(bits!==12)return;captured=adcSample(voltage());$('#adc-snapshot').hidden=false;$('#adc-snapshot-code').textContent=captured.code;
 $('#adc-snapshot-note').textContent=`อ่านที่ ${captured.voltage.toFixed(4)} V · เลื่อนแถบต่อได้ ค่านี้จะไม่เปลี่ยนจนกดอ่านใหม่`;
});
$('#adc-apply').addEventListener('click',()=>{
 if (!captured) return;
 const extras = $('#feeder-signal-extras');
 if (extras) extras.open = true;
 const slider = $('#analogSlider');
 slider.value = captured.code;
 slider.dispatchEvent(new Event('input',{bubbles:true}));
 dialog.close();
 slider.focus();
});
let sarRound=0,sarCaptured=null,sarLastVoltage=null;
function renderOrigin(){
 const v=voltage(),demo=quantizeVoltage(v,3);
 $('#adc-source-circuit').innerHTML=sourceCircuitSVG(v);
 $('#adc-pot-track').innerHTML=potentiometerTrackSVG(v);
 $('#adc-source-position').value=(v/3.3*100).toFixed(1);
 $('#adc-source-position').setAttribute('aria-valuetext',`ขากลาง ${v.toFixed(4)} โวลต์ เทียบ GND`);
 $('#adc-source-voltage').textContent=`${v.toFixed(4)} V ที่ขากลาง`;
 $('#adc-origin-range').textContent=`ตอนนี้ขากลาง ${v.toFixed(4)} V อยู่ระหว่าง ${demo.lower.toFixed(4)} V ถึง${demo.code===7?'':'ก่อน'} ${demo.upper.toFixed(4)} V จึงแทนด้วยเลข ${demo.code} ในตัวอย่าง 3 บิต`;
 $('#adc-origin-codes').innerHTML=Array.from({length:8},(_,i)=>`<span class="${i===demo.code?'active':''}"><code>${i.toString(2).padStart(3,'0')}</code><small>เลข ${i}</small></span>`).join('');
 if(sarLastVoltage!==v){sarRound=0;sarCaptured=null;sarLastVoltage=v;}
 renderSAR();
}
function renderSAR(){
 const trace=sarCaptured||sarTrace(voltage(),3),last=trace.steps[sarRound-1];
 $('#adc-sar-input').textContent=`${trace.sample.voltage.toFixed(4)} V`;
 $('#adc-sar-trial').textContent=last?`${last.trialVoltage.toFixed(4)} V`:'รอเริ่ม';
 $('#adc-sar-bits').textContent=(last?last.decided.padEnd(3,'_'):'___').split('').join(' ');
 $('#adc-sar-next').disabled=sarRound===3;
 $('#adc-sar-next').textContent=sarRound===3?'ครบ 3 บิตแล้ว ✓':sarRound===0?'เก็บตัวอย่างและเทียบครั้งที่ 1':`เทียบครั้งที่ ${sarRound+1}`;
 $('#adc-sar-history').innerHTML=trace.steps.slice(0,sarRound).map((step,i)=>`<li><b>ครั้งที่ ${i+1}</b> Comparator เทียบ ${trace.sample.voltage.toFixed(4)} V ${step.keep?'≥':'&lt;'} ${step.trialVoltage.toFixed(4)} V → ตัดสินบิตนี้เป็น <strong>${step.keep?1:0}</strong></li>`).join('');
 $('#adc-sar-explanation').textContent=sarRound===3?`ได้ ${last.decided} ฐานสอง = เลข ${trace.code} ช่วงที่ให้เลขนี้เริ่ม ${trace.sample.lower.toFixed(4)} V ถึง${trace.code===7?'':'ก่อน'} ${trace.sample.upper.toFixed(4)} V นี่คือที่มาของแถบช่วงแรงดันในภาพ`:'กดเทียบ แล้วดู DAC สร้างแรงดันลองเทียบ Comparator ตอบสูงกว่า/ต่ำกว่า และ SAR เก็บคำตอบเป็นบิต';
}
$('#adc-source-position').addEventListener('input',e=>{$('#adc-voltage').value=(Number(e.target.value)*3.3/100).toFixed(4);renderADC();});
$('#adc-sar-next').addEventListener('click',()=>{if(sarRound>=3)return;if(sarRound===0)sarCaptured=sarTrace(voltage(),3);sarRound++;renderSAR();});
$('#adc-sar-reset').addEventListener('click',()=>{sarRound=0;sarCaptured=null;renderSAR();});
examples();renderADC();
