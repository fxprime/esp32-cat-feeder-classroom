import { LOADS, sourceSpec, tryPower } from './workbench-model.js';

const bench = document.querySelector('[data-workbench]');
const get = (query) => bench.querySelector(query);
const buttons = (key) => [...bench.querySelectorAll(`[${key}]`)];
const view = get('[data-workbench-visual]');
const pack = get('[data-pack-settings]');
const aa = get('[data-aa-battery]');
const lithium = get('[data-li-battery]');
const regulator = get('[data-regulated]');
const reset = get('[data-workbench-reset]');
const controls = [...buttons('data-supply'), ...buttons('data-bench-load'), ...buttons('data-location'), aa, lithium, regulator, get('[data-project]')];
const status = get('[data-workbench-status]');
const title = get('[data-trial-title]');
const text = get('[data-trial-text]');
let load = 'servo';
let location = 'desk';
let source;
let result;
let model;
let currentTrial = 0;
let damageLocked = false;
const ma = (value) => `${value.toLocaleString('en-US')} mA`;

function select(key, picked) {
  buttons(key).forEach((button) => button.setAttribute('aria-pressed', String(button.getAttribute(key) === picked)));
}

function lockChoices(locked) {
  damageLocked = locked;
  controls.forEach((element) => { element.disabled = locked; });
}

function report(state, heading, message) {
  status.dataset.state = state;
  title.textContent = heading;
  text.textContent = message;
}

function updatePack() {
  pack.hidden = source !== 'aa' && source !== 'lithium';
  aa.hidden = source !== 'aa';
  lithium.hidden = source !== 'lithium';
  if (pack.hidden) return;
  const spec = sourceSpec(source, source === 'aa' ? aa.value : lithium.value, regulator.value === 'yes');
  get('[data-raw-voltage]').textContent = spec.raw;
}

function complete(trial) {
  const { state, reason, spec, peakMa } = trial;
  view.dataset.outcome = state;
  const messages = {
    matched: ['ทำงานได้', `${spec.name} จ่าย 5 V ได้ถึง ${ma(spec.limitMa ?? 0)} ในฉากนี้ โหลดต้องการพีก ${ma(peakMa)}`],
    current: ['ทำงานไม่ได้ · กระแสไม่พอ', `ได้ 5 V ตามที่ต้องการ แต่โหลดขอพีก ${ma(peakMa)} แหล่งนี้รองรับ ${ma(spec.limitMa ?? 0)} ในฉากนี้`],
    portable: ['ทำงานไม่ได้ · ไม่มีแหล่งไฟที่หน้างาน', 'โจทย์พกพานี้ไม่มีคอมและปลั๊ก ลองรังถ่านหรือแพ็กแบตที่แปลงเป็น 5 V และจ่ายกระแสพอ'],
    unregulated: ['ทำงานไม่ได้ · แรงดันยังไม่นิ่งที่ 5 V', `แพ็กให้ ${spec.voltage} V ตามป้ายและเปลี่ยนตามประจุ ลองใช้ตัวแปลงให้ได้ราง 5 V`],
    overvoltage: ['บอร์ดเสีย · แรงดันเกิน', `${spec.voltage} V ตามป้ายเกินพิกัดอินพุต 5 V ของชุดทดลองนี้ ใช้ตัวแปลงให้ตรงกับโหลด`],
    mains: ['บอร์ดไหม้ · ไฟบ้านเข้าอินพุต 5 V', '220 V AC ทำให้วงจรแรงดันต่ำเสียหายและเสี่ยงไฟไหม้ ใช้ Adapter สำเร็จรูปเพื่อจ่าย 5 V DC'],
  };
  report(state, ...messages[reason]);
  reset.disabled = false;
  reset.textContent = state === 'damage' ? 'เปลี่ยนบอร์ด' : 'ถอดแหล่งจ่าย';
}

function run(picked) {
  if (damageLocked) return;
  source = picked;
  select('data-supply', source);
  updatePack();
  reset.textContent = 'ถอดแหล่งจ่าย';
  const trial = tryPower({ source, load, portable: location === 'portable', battery: source === 'aa' ? aa.value : lithium.value, regulated: regulator.value === 'yes' });
  lockChoices(trial.state === 'damage');
  reset.disabled = damageLocked;
  result = trial;
  view.dataset.outcome = 'testing';
  const token = ++currentTrial;
  const finished = () => { if (token === currentTrial) complete(trial); };
  if (model) {
    report('testing', `กำลังทดสอบ ${trial.spec.name}`, `${LOADS[load].name} ต้องการ 5 V DC และกระแสพีก ${ma(trial.peakMa)}`);
    model.trial(picked, trial, finished);
  } else {
    finished();
  }
}

function disconnect() {
  currentTrial += 1;
  source = undefined;
  result = undefined;
  select('data-supply', null);
  updatePack();
  view.dataset.outcome = 'idle';
  view.dataset.load = load;
  reset.disabled = true;
  reset.textContent = 'ถอดแหล่งจ่าย';
  lockChoices(false);
  const context = location === 'desk' ? 'มีคอมและปลั๊กอยู่ใกล้' : 'หน้างานไม่มีคอมหรือปลั๊ก';
  report('idle', 'วงจรรอรับไฟ 5 V DC', `${LOADS[load].name} ต้องการพีก ${ma(LOADS[load].peakMa)} · ${context}`);
  model?.reset(load);
}

function focusCurrentLoad() {
  get(`[data-bench-load="${load}"]`).focus();
}

buttons('data-supply').forEach((button) => button.addEventListener('click', () => run(button.dataset.supply)));
buttons('data-bench-load').forEach((button) => button.addEventListener('click', () => {
  load = button.dataset.benchLoad;
  select('data-bench-load', load);
  disconnect();
}));
buttons('data-location').forEach((button) => button.addEventListener('click', () => {
  location = button.dataset.location;
  select('data-location', location);
  disconnect();
}));
[aa, lithium, regulator].forEach((input) => input.addEventListener('change', () => { if (source) run(source); }));
reset.addEventListener('click', () => {
  const damaged = status.dataset.state === 'damage';
  disconnect();
  if (damaged) focusCurrentLoad();
});
get('[data-project]').addEventListener('click', focusCurrentLoad);
bench.dataset.ready = 'true';
view.dataset.load = load;

if ('WebGL2RenderingContext' in window) {
  try {
    const { setupWorkbench } = await import('./workbench-scene.js');
    model = setupWorkbench(view, {
      selectSource: run,
      selectProject: focusCurrentLoad,
      isLocked: () => damageLocked,
    });
    model.reset(load);
    if (source && result) model.show(source, result);
  } catch {
    view.dataset.renderer = 'flat';
  }
}
