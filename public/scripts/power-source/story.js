import { POWER_EXAMPLE, calcNominalPack, estimateRunHours, getWireExample } from './teaching-model.js';

const lesson = document.querySelector('.power-story');
const get = (selector) => lesson.querySelector(selector);
const all = (selector) => [...lesson.querySelectorAll(selector)];
const set = (selector, value) => { get(selector).textContent = value; };
const milliamps = (value) => `${value.toLocaleString('en-US')} mA`;

function select(attribute, value) {
  all(`[${attribute}]`).forEach((button) => {
    button.setAttribute('aria-pressed', String(button.getAttribute(attribute) === value));
  });
}

function onChoice(attribute, action) {
  all(`[${attribute}]`).forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.getAttribute(attribute);
      select(attribute, value);
      action(value);
    });
  });
}

function showResult(selector, message, tone = 'info') {
  const result = get(selector);
  result.textContent = message;
  result.dataset.tone = tone;
}

const stages = all('[data-power-step]');
const stageButtons = all('[data-power-jump]');
const back = get('[data-power-back]');
const next = get('[data-power-next]');
let stage = 0;

function openStage(index) {
  if (index === stage || index < 0 || index >= stages.length) return;
  stage = index;
  stages.forEach((panel, i) => { panel.hidden = i !== stage; });
  stageButtons.forEach((button, i) => {
    if (i === stage) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  back.disabled = stage === 0;
  next.disabled = stage === stages.length - 1;
  set('[data-power-position]', `${stage + 1} / ${stages.length}`);
  stages[stage].querySelector('h2').focus({ preventScroll: true });
}

stageButtons.forEach((button, index) => button.addEventListener('click', () => openStage(index)));
back.addEventListener('click', () => openStage(stage - 1));
next.addEventListener('click', () => openStage(stage + 1));

let source = 'usb';
let load = 'board';

function renderWire() {
  const { limitMa, peakMa, spareMa, overBudget } = getWireExample(source, load);
  set('[data-wire-source-label]', source === 'usb' ? 'USB จากคอม' : 'Adapter');
  set('[data-wire-limit]', milliamps(limitMa));
  set('[data-wire-peak]', milliamps(peakMa));
  get('[data-wire-limit-bar]').style.setProperty('--ratio', limitMa / POWER_EXAMPLE.adapterLimit);
  get('[data-wire-peak-bar]').style.setProperty('--ratio', peakMa / POWER_EXAMPLE.adapterLimit);
  get('.power-wire-visual').dataset.overBudget = String(overBudget);
  const gate = load === 'board' ? 'idle' : overBudget ? 'low' : 'open';
  const gateLabel = {
    idle: 'ESP32 ติด · ยังไม่สั่งเปิดฝา',
    low: 'ฝาอาจค้างตอนออกแรง',
    open: 'กระแสพอสำหรับเปิดฝาในฉากนี้',
  };
  get('.power-wire-demo').dataset.gate = gate;
  set('[data-wire-demo-label]', gateLabel[gate]);
  if (overBudget) {
    showResult('[data-wire-result]', `โหลดต้องการเกินพิกัด ${milliamps(Math.abs(spareMa))} ตอน Servo ออกแรง ไฟอาจตกจนฝาเปิดไม่ขึ้น`, 'warn');
  } else {
    const situation = load === 'board' ? 'ESP32 อย่างเดียวอยู่ในพิกัด' : 'ESP32 + Servo อยู่ในพิกัดตัวอย่าง';
    showResult('[data-wire-result]', `${situation} เหลือกระแสเผื่อ ${milliamps(spareMa)}`, 'good');
  }
}

onChoice('data-wire-source', (choice) => { source = choice; renderWire(); });
onChoice('data-wire-load', (choice) => { load = choice; renderWire(); });
renderWire();

onChoice('data-story-aa', (kind) => {
  const rechargeable = kind === 'nimh';
  const cells = 4;
  const cellVolts = rechargeable ? 1.2 : 1.5;
  const { voltage } = calcNominalPack({ cells, cellVolts });
  get('.power-cells').dataset.chemistry = kind;
  all('.power-cells > div > span').forEach((label) => { label.textContent = `${cellVolts} V`; });
  set('[data-aa-pack]', `${voltage.toFixed(1)} V`);
  set('[data-aa-summary]', `${rechargeable ? 'ชาร์จซ้ำได้' : 'ใช้ครั้งเดียว'} · ${cellVolts} V ต่อก้อน`);
  set('[data-aa-note]', rechargeable
    ? 'ใช้กับอุปกรณ์ที่รองรับ NiMH เช่น ไฟฉายที่ใช้บ่อย ชาร์จด้วยเครื่องชาร์จ NiMH'
    : 'พบในงานโหลดเบา เช่น รีโมต ความจุใช้งานจริงขึ้นกับรุ่นและกระแสที่ดึง');
  const reminder = rechargeable ? 'ถ้าหนึ่งก้อนมี 1.9 Ah ทั้งรังยังมี 1.9 Ah' : 'เช็กช่วงแรงดันของอุปกรณ์ก่อนต่อ';
  showResult('[data-aa-story-result]', `${cells} × ${cellVolts} V = ${voltage.toFixed(1)} V ตามป้าย · ${reminder}`);
});

const lithium = {
  lipo: { label: 'LiPo แบบแบน', form: 'pouch', cellVolts: 3.7, capacityAh: 2.0 },
  ion: { label: 'Li-ion 18650', form: 'cylinder', cellVolts: 3.6, capacityAh: 2.8 },
};
let pack = 'lipo';
let charge = 'nominal';

function renderPack() {
  const battery = lithium[pack];
  const { energyWh } = calcNominalPack({ cells: 1, ...battery });
  const full = charge === 'full';
  set('[data-cell-voltage]', `${full ? '4.2' : battery.cellVolts} V`);
  set('[data-cell-label]', battery.label);
  get('.power-lithium-cell').dataset.cellForm = battery.form;
  set('[data-pack-energy]', `≈ ${energyWh.toFixed(1)} Wh`);
  set('[data-pack-equation]', `${battery.cellVolts} V × ${battery.capacityAh.toFixed(1)} Ah ตามป้าย`);
  const idealHours = estimateRunHours(energyWh, 1).toFixed(1);
  const message = full
    ? 'ชาร์จเต็มได้ 4.2 V ในแบตตัวอย่างทั้งสองรุ่น ต้องผ่านตัวแปลงเมื่อต้องการจ่าย 5 V'
    : `โหลด 5 V × 0.2 A ใช้ 1 W จึงอยู่ได้ราว ${idealHours} ชม. ก่อนคิดการสูญเสีย`;
  showResult('[data-pack-result]', message);
}

onChoice('data-story-pack', (choice) => { pack = choice; renderPack(); });
onChoice('data-pack-charge', (choice) => { charge = choice; renderPack(); });
renderPack();

const cases = {
  desk: {
    prompt: 'มีคอมอยู่ข้าง ๆ ต้องอัปโหลดโค้ดและอ่าน Serial จาก ESP32',
    source: 'usb',
    good: 'สาย USB แบบส่งข้อมูลได้ ใช้ทั้งเลี้ยงบอร์ดและคุยกับคอมผ่านสายเดียว',
    retry: 'โจทย์นี้ต้องมีทางส่งข้อมูลกับคอมด้วย ลองเลือกสายที่ทำได้ทั้งสองอย่าง',
  },
  feeder: {
    prompt: 'เครื่องให้อาหารตั้งข้างปลั๊ก ต้องพร้อมทำงานทุกวัน และ Servo ดึงกระแสเพิ่มตอนเปิดฝา',
    source: 'adapter',
    good: 'เลือก Adapter 5 V ที่เผื่อกระแสช่วง Servo ออกแรง ต่อให้ครบเหมือนฉากถัดไป',
    retry: 'เครื่องมีปลั๊กอยู่ใกล้ ๆ และต้องรับกระแสช่วงเปิดฝา ลองหาแหล่งไฟต่อเนื่องที่รับโหลดช่วงนั้นไหว',
  },
  remote: {
    prompt: 'รีโมตใช้เป็นครั้งคราว คู่มือระบุให้ใส่ถ่าน AA อัลคาไลน์ 1.5 V',
    source: 'alkaline',
    good: 'ถ่าน AA อัลคาไลน์ตรงทั้งขนาด ชนิด และแรงดันที่คู่มือระบุ',
    retry: 'ดูคู่มือรีโมตอีกครั้งว่าให้ใช้ถ่านขนาด ชนิด และแรงดันเท่าไร',
  },
  portable: {
    prompt: 'เครื่องพกพากล่องแบน ไม่มีปลั๊ก ต้องชาร์จซ้ำได้และจ่ายให้วงจร 5 V',
    source: 'lipo',
    good: 'ใช้แพ็ก LiPo แบบแบนที่มีวงจรป้องกัน พร้อมเครื่องชาร์จตรงรุ่นและตัวแปลง 5 V ที่จ่ายกระแสพอ',
    retry: 'งานนี้ไม่มีปลั๊กและต้องชาร์จซ้ำได้ ลองหาแบตที่พอดีกับกล่องและมีทางจ่ายไฟ 5 V',
  },
};
const answers = new Map();
let scenario = 'desk';

function renderCase() {
  const { prompt, source: expected, good, retry } = cases[scenario];
  const answer = answers.get(scenario);
  set('[data-power-case-prompt]', prompt);
  select('data-power-answer', answer);
  if (!answer) showResult('[data-power-case-result]', 'ลองเลือกจากสิ่งที่งานต้องใช้');
  else if (answer === expected) showResult('[data-power-case-result]', `เหมาะกับงาน · ${good}`, 'good');
  else showResult('[data-power-case-result]', `ลองอีกครั้ง · ${retry}`, 'warn');
}

onChoice('data-power-case', (choice) => { scenario = choice; renderCase(); });
onChoice('data-power-answer', (choice) => { answers.set(scenario, choice); renderCase(); });
document.documentElement.dataset.powerStoryReady = 'true';
