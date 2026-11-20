import { usbScene } from './usb-scene.js';
import { showSourcePanel } from './source-panels.js';

const limits = {usb:500, chart:1300};
const board = {run:150, peak:250};
const loads = {
  board: {label:'ESP32 อย่างเดียว', run:0, peak:0, zone:'safe', title:'เขียว · มีที่เผื่อ', message:'ESP32 ใช้กระแสอยู่แล้ว แม้ยังไม่ต่ออุปกรณ์ ยอดในฉากนี้มาจากช่วงบอร์ดทำงานหนักขึ้น'},
  led: {label:'LED + R', run:5, peak:5, zone:'safe', title:'เขียว · ใช้ได้ในฉากนี้', message:'LED มี R จำกัดกระแส เพิ่มเพียง 5mA ในภาพ เมื่อรวมกับบอร์ดแล้วยังเหลือจากเพดานพอร์ต'},
  servo: {label:'Servo', run:180, peak:400, zone:'warning', title:'เหลือง · เสี่ยงไฟตก', message:'กระแสขณะขยับดูพอ แต่ยอดตอนออกแรงเกินงบ 500mA บอร์ดอาจรีเซตหรือแขนสั่น ใช้ไฟเลี้ยง Servo แยกตามพิกัดและต่อ GND อ้างอิงร่วม'},
  motor: {label:'DC Motor + Driver', run:230, peak:650, zone:'danger', title:'แดง · เกินพิกัดช่วงกระชาก', message:'ขณะหมุนดูเหมือนอยู่ในงบ แต่ตอนเริ่มหมุนโหลดขอถึง 900mA พอร์ตอาจตัดหรืออุปกรณ์เสียหาย ฉากควันแสดงกรณีเสียหาย ใช้แหล่งจ่ายมอเตอร์แยกที่รองรับกระแสพุ่งและวงจรขับที่จัดการไฟย้อน'},
  stall: {label:'Motor · ล้อติด', run:950, peak:950, zone:'danger', title:'แดง · ล้อติด กระแสค้างสูง', message:'เมื่อมือหยุดล้อขณะยังสั่งให้หมุน ความเร็วเป็นศูนย์ แรงดันที่มอเตอร์สร้างตามความเร็วลดลงเกือบเป็นศูนย์ กระแสจากพอร์ตจึงสูงและค้างจนกว่าจะตัดไฟหรือปล่อยโหลด'},
  brake: {label:'Motor · ช่วงเบรก', run:0, peak:0, zone:'danger', title:'แดง · พลังงานย้อนเข้ารางไฟ', message:'ขณะล้อยังหมุน มอเตอร์สร้างแรงดันจากการหมุน เรียกว่า Back EMF ถ้าไดรเวอร์คืนพลังงานเข้ารางและมีทางย้อนถึง VBUS แรงดันอาจพุ่งจนพอร์ตเสียหายได้ เมื่อหยุดสนิทแรงดันจากการหมุนก็หมดไป'}
};

const $ = id => document.getElementById(id);
const scene = $('usb-scene');
const connect = $('usb-connect');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let linked = false;
let load = 'board';
let motor = 'run';
let sequence = 0;
let timer;
scene.innerHTML = usbScene;

function clearSequence() {
  sequence += 1;
  clearTimeout(timer);
  scene.removeAttribute('data-fault');
}

function after(ms, callback) {
  const id = sequence;
  if (reduced.matches) {
    callback();
    return;
  }
  timer = setTimeout(() => {
    if (id === sequence) callback();
  }, ms);
}

function showCurrent() {
  const active = loads[motor === 'run' ? load : motor];
  const reverse = motor === 'brake';
  const brakeFinished = reverse && scene.hasAttribute('data-fault');
  const running = board.run + active.run;
  const peak = board.peak + active.peak;
  const percent = value => `${value/limits.chart*100}%`;
  const meter = $('power-live');
  meter.dataset.zone = linked ? active.zone : 'off';
  $('power-zone').textContent = linked ? active.title : 'ยังไม่ได้เสียบสาย';
  $('power-total').textContent = !linked ? '0mA' : reverse ? (brakeFinished ? 'จบฉาก · พอร์ตเสียหาย' : 'พลังงานย้อน ↑ VBUS') : motor === 'stall' ? `${running}mA ต่อเนื่อง` : `${running}mA · ยอด ${peak}mA`;
  meter.style.setProperty('--running',percent(linked&&!reverse ? running : 0));
  meter.style.setProperty('--peak',percent(linked&&!reverse ? peak : 0));
  meter.style.setProperty('--usb-limit',percent(limits.usb));
  $('current-scale').hidden = reverse;
  $('current-scale').setAttribute('aria-label', linked&&!reverse ? `กระแสปกติ ${running} มิลลิแอมป์ ยอด ${peak} มิลลิแอมป์ พิกัดพอร์ต 500 มิลลิแอมป์` : 'กระแสจาก USB เป็นศูนย์');
  $('power-current-parts').textContent = !linked ? 'กดเสียบสาย USB เพื่อเริ่ม' : reverse ? (brakeFinished ? 'ล้อหยุดแล้ว · เครื่องหมายที่พอร์ตแสดงผลเสียหายสมมติ' : 'Motor → Driver → รางไฟร่วม → USB (เฉพาะวงจรที่เปิดทางให้ไฟย้อน)') :
    `ขณะทำงาน ESP32 ${board.run}mA + ${active.label} ${active.run}mA · ช่วงพุ่ง ESP32 ${board.peak}mA + โหลด ${active.peak}mA`;
  if (linked && load === 'board') $('power-current-parts').textContent = 'ESP32 150mA ขณะทำงาน · ยอด 250mA ในภาพจำลอง';
  $('power-message').textContent = linked ? active.message : 'เลือกอุปกรณ์ไว้ก่อนก็ได้ กระแสจะเริ่มวิ่งเมื่อหัวสายทั้งสองด้านเสียบครบ';
}

function render() {
  scene.dataset.linked = String(linked);
  scene.dataset.motor = motor;
  scene.querySelector('.usb-device-slot').dataset.state = load;
  scene.querySelector('#usb-scene-title').textContent = `โน้ตบุ๊กและ ESP32 · ${loads[load].label} · ${linked?'เสียบสายแล้ว':'ถอดสายอยู่'}`;
  $('motor-actions').hidden = load !== 'motor';
  $('motor-stall').disabled = !linked || motor !== 'run';
  $('motor-brake').disabled = !linked || motor !== 'run';
  $('motor-reset').disabled = !linked || motor === 'run';
  connect.textContent = linked ? 'ถอดสาย USB' : 'เสียบสาย USB';
  document.querySelectorAll('[data-load]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.load === load)));
  showCurrent();
}

function overload() {
  if (linked && load === 'motor') {
    after(motor === 'brake' ? 1550 : 900, () => {
      scene.dataset.fault = 'true';
      if (motor === 'brake') showCurrent();
    });
  }
}

connect.addEventListener('click', () => {
  clearSequence();
  scene.removeAttribute('data-plugging');
  if (linked || connect.dataset.busy) {
    linked = false;
    motor = 'run';
    delete connect.dataset.busy;
    render();
    return;
  }
  connect.dataset.busy = 'true';
  connect.textContent = 'ยกเลิกการเสียบ';
  scene.dataset.plugging = 'true';
  after(1050, () => {
    linked = true;
    delete connect.dataset.busy;
    scene.removeAttribute('data-plugging');
    render();
    overload();
  });
});

document.querySelectorAll('[data-load]').forEach(button => button.addEventListener('click', () => {
  load = button.dataset.load;
  motor = 'run';
  if (!connect.dataset.busy) clearSequence();
  render();
  if (connect.dataset.busy) connect.textContent = 'ยกเลิกการเสียบ';
  overload();
}));

for (const state of ['stall','brake','reset']) {
  $('motor-'+state).addEventListener('click', () => {
    clearSequence();
    motor = state === 'reset' ? 'run' : state;
    render();
    overload();
  });
}

let disposeSource;
document.querySelectorAll('[data-source]').forEach(button => button.addEventListener('click', () => {
  if (button.getAttribute('aria-pressed') === 'true') return;
  disposeSource?.();
  const source = button.dataset.source;
  document.querySelectorAll('[data-source]').forEach(option => option.setAttribute('aria-pressed',String(option === button)));
  $('usb-panel').hidden = source !== 'usb';
  const panel = $('other-panel');
  panel.hidden = source === 'usb';
  if (source === 'usb') {
    panel.replaceChildren();
    disposeSource = undefined;
  } else {
    disposeSource = showSourcePanel(panel, source);
  }
}));

render();
document.documentElement.dataset.powerSourceReady = 'true';
