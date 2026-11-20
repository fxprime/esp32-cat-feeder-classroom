import { createFeeder } from './feeder/model.js';

function setText(node, value) {
  if (node.textContent !== value) node.textContent = value;
}

function mountFeederDemo(section) {
  const select = selector => section.querySelector(selector);
  const sim = createFeeder();
  const cases = {
    normal: { humidity: 55, distanceCm: 10 },
    humid: { humidity: 78, distanceCm: 10 },
    empty: { humidity: 55, distanceCm: 24 },
  };
  const caseButtons = [...section.querySelectorAll('[data-feeder-case]')];
  const mealButton = select('[data-feeder-meal]');
  const catButton = select('[data-feeder-cat]');
  const repeatButton = select('[data-feeder-repeat]');
  const humidity = select('[data-feeder-humidity]');
  const food = select('[data-feeder-food]');
  const portions = select('[data-feeder-portions]');
  const result = select('[data-feeder-result]');
  const detail = select('[data-feeder-detail]');
  const tankLevel = select('#ff-tank-level');
  let selectedCase = 'normal';
  let frame = null;
  let lastTime = 0;
  let repeatNotice = false;

  function messageFor(state) {
    const latest = state.events.at(-1);
    if (repeatNotice) return ['มื้อเดิมผ่านการตัดสินใจแล้ว', 'ไม่นับมื้อเดิมเพิ่ม และจะไม่เริ่มจ่ายอีกจากเหตุการณ์นี้'];
    if (state.phase === 'blocked') {
      const message = {
        humid: 'ความชื้นในถังสูงกว่าหรือเท่ากับเกณฑ์',
        empty: 'ระดับอาหารต่ำถึงเกณฑ์ถังหมด',
        sensor: 'เครื่องอ่านค่าเซนเซอร์ที่ใช้ตัดสินใจไม่ได้',
      }[state.reason] ?? 'ตรวจพบเงื่อนไขที่ต้องงดจ่าย';
      return ['งดจ่าย · ฝายังปิด', `${message} ไฟแดงติด และสร้างข้อความแจ้งเตือนจำลอง`];
    }
    if (state.phase === 'beeping') return ['บี๊บเตือนก่อนจ่าย', 'ตรวจสภาพถังผ่านแล้ว ฝาจะเปิดเมื่อเสียงเตือนจบ'];
    if (state.phase === 'dispensing') return ['เปิดฝา · เม็ดอาหารกำลังตก', 'Servo พาฝากลับมาปิดเมื่อจบช่วงจ่าย'];
    if (latest?.type === 'arrival') return ['บันทึกว่ามีตัวมาที่ชามแล้ว', 'IR ตรวจพบแสงสะท้อนในช่วงที่รออยู่ เครื่องจำเหตุการณ์นี้ไว้โดยไม่จ่ายซ้ำ'];
    if (state.phase === 'watching') return ['จ่ายหนึ่งมื้อแล้ว · ฝาปิด', 'ลองกด “แมวมาที่ชาม” เพื่อให้ IR ตรวจพบ'];
    if (latest?.type === 'no-arrival') return ['จบรอบสังเกตที่ชาม', 'IR ยังตรวจไม่พบว่ามีตัวมาที่ชามในช่วงที่เฝ้าดู'];
    if (state.catAtBowl) return ['IR ตรวจพบที่ชาม · ฝายังปิด', 'กด “ให้อาหาร Manual” เพื่อสั่งจ่าย ส่วน IR ใช้สังเกตที่ชาม'];
    if (state.portions) return ['เครื่องพร้อมมื้อถัดไป', 'เปลี่ยนสภาพถังแล้วกด “ให้อาหาร Manual” เพื่อลองอีกครั้ง'];
    return ['รอคำสั่งให้อาหาร · ฝาปิด', 'ลองกด “ให้อาหาร Manual” เพื่ออ่านค่าเซนเซอร์และตัดสินใจ'];
  }

  function render() {
    const state = sim.getState();
    const busy = state.phase === 'beeping' || state.phase === 'dispensing';
    section.dataset.phase = state.phase;
    section.dataset.beeping = String(state.buzzer);
    section.dataset.fault = String(state.ledRed);
    section.dataset.foodInBowl = String(state.portions > 0);
    section.dataset.catAtBowl = String(state.catAtBowl);
    setText(humidity, state.humidity == null ? 'อ่านไม่ได้' : `${state.humidity}% RH`);
    setText(food, state.foodPercent == null ? 'อ่านไม่ได้' : `${state.foodPercent}%`);
    setText(portions, `${state.portions} มื้อ`);
    const level = 164 * (state.foodPercent ?? 0) / 100;
    tankLevel.setAttribute('y', String(259 - level));
    tankLevel.setAttribute('height', String(level));
    mealButton.disabled = busy;
    repeatButton.disabled = state.lastMealId == null || state.lastMealId <= 0;
    catButton.setAttribute('aria-pressed', String(state.catAtBowl));
    for (const button of caseButtons) {
      button.disabled = busy;
      button.setAttribute('aria-pressed', String(button.dataset.feederCase === selectedCase));
    }
    const [heading, explanation] = messageFor(state);
    setText(result, heading);
    setText(detail, explanation);
    return state.phase === 'beeping' || state.phase === 'dispensing' || state.phase === 'watching';
  }

  function tick(now) {
    const elapsed = Math.max(0, now - lastTime);
    lastTime = now;
    sim.advance(elapsed);
    frame = render() ? requestAnimationFrame(tick) : null;
  }

  function update() {
    if (render() && frame === null) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  for (const button of caseButtons) {
    button.addEventListener('click', () => {
      selectedCase = button.dataset.feederCase;
      repeatNotice = false;
      sim.setInputs(cases[selectedCase]);
      update();
    });
  }
  mealButton.addEventListener('click', () => {
    repeatNotice = false;
    sim.requestMeal();
    update();
  });
  catButton.addEventListener('click', () => {
    repeatNotice = false;
    sim.setInputs({ catAtBowl: !sim.getState().catAtBowl });
    update();
  });
  repeatButton.addEventListener('click', () => {
    const { lastMealId } = sim.getState();
    sim.requestMeal(lastMealId);
    repeatNotice = true;
    update();
  });
  select('[data-feeder-reset]').addEventListener('click', () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    selectedCase = 'normal';
    repeatNotice = false;
    sim.reset();
    sim.setInputs(cases.normal);
    update();
  });
  sim.setInputs(cases.normal);
  update();
}

function mountPowerDemo(section) {
  const buttons = [...section.querySelectorAll('[data-feeder-wire]')];
  const status = section.querySelector('[data-feeder-power-status]');
  let resetArm;
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const key = button.dataset.feederWire;
      const connected = section.dataset[key] !== 'true';
      section.dataset[key] = String(connected);
      button.setAttribute('aria-pressed', String(connected));
      setText(button.querySelector('small'), connected ? 'ต่อแล้ว' : 'ยังไม่ต่อ');
      section.dataset.moving = 'false';
      clearTimeout(resetArm);
      setText(status, 'กดทดสอบแล้วดูว่าจุดไหนทำให้ฝาขยับได้');
    });
  }
  section.querySelector('[data-power-test]').addEventListener('click', () => {
    const { usb, adapter, ground } = section.dataset;
    clearTimeout(resetArm);
    section.dataset.moving = 'false';
    if (usb !== 'true') return setText(status, 'ESP32 ยังไม่รับไฟจาก USB จึงส่งคำสั่งไม่ได้');
    if (adapter !== 'true') return setText(status, 'ESP32 ส่งคำสั่งแล้ว แต่ Servo ยังไม่รับไฟเลี้ยงจากแหล่งจ่าย');
    if (ground !== 'true') return setText(status, 'ทั้งสองฝั่งมีไฟแล้ว ลองต่อ GND ร่วมเพื่อให้สัญญาณมีจุดอ้างอิงเดียวกัน');
    section.dataset.moving = 'true';
    setText(status, 'ฝาขยับแล้ว สาย GPIO18 ส่งคำสั่ง แหล่งจ่าย 5 V จ่ายไฟ และทั้งสองฝั่งใช้ GND ร่วมกัน');
    resetArm = setTimeout(() => { section.dataset.moving = 'false'; }, 1300);
  });
}

const demo = document.querySelector('[data-feeder-demo]');
const power = document.querySelector('[data-feeder-power]');
if (demo) mountFeederDemo(demo);
if (power) mountPowerDemo(power);
