import { usbScene } from './usb-scene.js';
import { showSourcePanel } from './source-panels.js';
import { POWER_EXAMPLE } from './teaching-model.js';

const limits = { usb: POWER_EXAMPLE.usbLimit, chart: 1300 };
const board = POWER_EXAMPLE.board;
const loads = {
  board: {label:'ESP32 อย่างเดียว', run:0, peak:0, zone:'safe', title:'เขียว · พิกัดจ่ายพอในฉากนี้', message:'บอร์ดต้องการกระแสแม้ยังไม่ต่ออุปกรณ์เพิ่ม ช่วงที่บอร์ดทำงานหนักขึ้นจะต้องการมากขึ้น'},
  led: {label:'LED + R', run:5, peak:5, zone:'safe', title:'เขียว · พิกัดจ่ายพอในฉากนี้', message:'LED ผ่านตัวต้านทานต้องการกระแสเพิ่มเพียง 5 mA ในฉากนี้ รวมกับบอร์ดแล้วยังต่ำกว่าพิกัดตัวอย่าง'},
  servo: {label:'Servo', ...POWER_EXAMPLE.servo, zone:'warning', title:'เหลือง · พิกัดจ่ายไม่พอช่วงพีก', message:'เมื่อ Servo ออกแรง ความต้องการรวมเกินพิกัดพอร์ตในฉากนี้ บอร์ดอาจรีเซตหรือแขนสั่น ใช้ไฟเลี้ยง Servo แยกตามพิกัดและต่อ GND อ้างอิงร่วม'},
  motor: {label:'DC Motor + Driver', run:230, peak:650, zone:'danger', title:'แดง · พิกัดจ่ายไม่พอช่วงเริ่มหมุน', message:'มอเตอร์ต้องการกระแสเพิ่มตอนเริ่มหมุนจนเกินพิกัดตัวอย่าง พอร์ตอาจตัด ฉากควันแสดงกรณีเสียหาย ใช้แหล่งจ่ายมอเตอร์แยกตามพิกัดและวงจรขับที่จัดการไฟย้อน'},
  stall: {label:'Motor · ล้อติด', run:950, peak:950, zone:'danger', title:'แดง · ล้อติด โหลดต้องการกระแสสูงต่อเนื่อง', message:'เมื่อล้อหยุดขณะยังสั่งให้หมุน แรงดันที่มอเตอร์สร้างตามความเร็วจะลดลง มอเตอร์จึงต้องการกระแสสูงต่อเนื่อง พิกัดพอร์ตในฉากนี้รองรับไม่พอ'},
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
  meter.style.setProperty('--running',percent(linked&&!reverse ? running : 0));
  meter.style.setProperty('--peak',percent(linked&&!reverse ? peak : 0));
  meter.style.setProperty('--usb-limit',percent(limits.usb));
  const scale = $('current-scale');
  const total = $('power-total');
  const parts = $('power-current-parts');
  scale.hidden = reverse;
  scale.setAttribute('aria-label', linked && !reverse
    ? `กราฟกระแสที่โหลดต้องการ ช่วงทำงาน ${running} มิลลิแอมป์ ช่วงพีก ${peak} มิลลิแอมป์ พิกัดจ่ายตัวอย่าง ${limits.usb} มิลลิแอมป์`
    : 'กราฟกระแสที่โหลดต้องการ ยังไม่ได้เสียบสาย USB');
  if (!linked) {
    total.textContent = 'รอเสียบสาย USB';
    parts.textContent = 'กดเสียบสาย USB เพื่อเริ่ม';
  } else if (reverse) {
    total.textContent = brakeFinished ? 'จบฉาก · ตัวอย่างเมื่อพอร์ตเสียหาย' : 'พลังงานย้อน ↑ VBUS';
    parts.textContent = brakeFinished
      ? 'ล้อหยุดแล้ว เครื่องหมายที่พอร์ตแสดงผลเสียหายสมมติ'
      : 'Motor → Driver → รางไฟร่วม → USB (เฉพาะวงจรที่เปิดทางให้ไฟย้อน)';
  } else {
    total.textContent = `โหลดต้องการ ${running} mA · พีก ${peak} mA`;
    const breakdown = load === 'board'
      ? 'ตัวอย่างสำหรับ ESP32 อย่างเดียว'
      : `ช่วงทำงาน ESP32 ${board.run} mA + ${active.label} ${active.run} mA · ช่วงพีก ESP32 ${board.peak} mA + โหลด ${active.peak} mA`;
    parts.textContent = `พิกัดจ่ายตัวอย่าง ${limits.usb} mA · ${breakdown}`;
  }
  $('power-message').textContent = linked ? active.message : 'เลือกอุปกรณ์ แล้วเสียบสายเพื่อเทียบความต้องการของโหลดกับพิกัดจ่ายตัวอย่าง';
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
