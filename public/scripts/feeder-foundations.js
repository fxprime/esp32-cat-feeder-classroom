import { createFeeder, estimateFood, FEEDER_LIMITS } from './feeder/model.js';

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
    if (latest?.type === 'arrival') return ['บันทึกว่ามีตัวมาที่ชามแล้ว', 'IR ถูกบังในช่วงที่รออยู่ เครื่องจำเหตุการณ์นี้ไว้โดยไม่จ่ายซ้ำ'];
    if (state.phase === 'watching') return ['จ่ายหนึ่งมื้อแล้ว · ฝาปิด', 'ลองกด “แมวมาที่ชาม” เพื่อบังลำแสง IR'];
    if (latest?.type === 'no-arrival') return ['จบรอบสังเกตที่ชาม', 'เครื่องไม่พบว่าลำแสง IR ถูกบังในช่วงที่เฝ้าดู'];
    if (state.catAtBowl) return ['ลำแสง IR ถูกบัง · ฝายังปิด', 'เครื่องจะจ่ายเมื่อถึงมื้อ ลำแสงมีไว้สังเกตที่ชาม'];
    if (state.portions) return ['เครื่องพร้อมมื้อถัดไป', 'เปลี่ยนสภาพถังแล้วกด “ถึงมื้อ” เพื่อลองอีกครั้ง'];
    return ['รอถึงมื้อ · ฝาปิด', 'ลองกด “ถึงมื้อ” เพื่ออ่านค่าเซนเซอร์และตัดสินใจ'];
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

function mountFeederIpo(section) {
  const select = selector => section.querySelector(selector);
  const condition = select('[data-ipo-condition]');
  const run = select('[data-ipo-run]');
  const choices = [...section.querySelectorAll('[data-ipo-sensor]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 'humidity';
  let sequence = null;
  const topics = {
    humidity: {
      condition: 'จำลองความชื้นเกินเกณฑ์',
      reading: ['55% RH', '78% RH'],
      rules: [
        `ถึงมื้อแล้วเช็กว่าความชื้นต่ำกว่า ${FEEDER_LIMITS.humidity}% RH และมีอาหารพอ`,
        'ถึงมื้อแล้วพบ 78% RH เครื่องจึงเลือกงดจ่ายมื้อนี้',
      ],
      actions: ['บี๊บ → ฝาเปิดและปิด', 'ไฟแดง + แจ้งเตือนจำลอง'],
      details: ['ปล่อยอาหารหนึ่งรอบแล้วเฝ้าดูที่ชาม', 'บอกเจ้าของว่าถังชื้นเกินเกณฑ์ ฝายังคงปิด'],
    },
    distance: {
      condition: 'จำลองอาหารหมด',
      reading: [`10 ซม. · อาหารประมาณ ${estimateFood(10)}%`, `${FEEDER_LIMITS.emptyCm} ซม. · ถังหมด`],
      rules: [
        `เทียบระยะกับถังเต็ม ${FEEDER_LIMITS.fullCm} ซม. และถังหมด ${FEEDER_LIMITS.emptyCm} ซม. ค่ามากแปลว่าผิวอาหารอยู่ลึกลงไป`,
        `ถึงมื้อแล้วพบอาหารเหลือไม่เกิน ${FEEDER_LIMITS.emptyPercent}% เครื่องตัดสินใจงดจ่าย`,
      ],
      actions: ['จ่ายได้เมื่อเงื่อนไขอื่นผ่าน', 'ไฟแดง + แจ้งเตือนจำลอง'],
      details: ['ระยะถึงผิวอาหารใช้ประมาณระดับในถัง', 'บอกเจ้าของให้เติมอาหาร ฝายังคงปิด'],
    },
    arrival: {
      condition: 'จำลองแมวบังลำแสงหลังจ่ายแล้ว',
      reading: ['IR ไม่ถูกบัง · HIGH', 'IR ถูกบัง · LOW'],
      rules: [
        'เครื่องเฝ้าดูหลังจ่ายอาหาร ตอนนี้ยังไม่พบสิ่งที่บังลำแสง',
        'ลำแสงถูกบังขณะเฝ้าดู เครื่องบันทึกการมาถึงชามหนึ่งครั้ง',
      ],
      actions: ['รอสังเกตที่ชาม', 'บันทึกว่ามีตัวมาที่ชาม'],
      details: ['Servo คงฝาไว้ที่ตำแหน่งปิด', 'IR บอกว่ามีสิ่งมาบังลำแสง ส่วนฝายังคงปิด'],
    },
  };

  function paint() {
    const data = topics[selected];
    const index = Number(condition.checked);
    for (const button of choices) button.setAttribute('aria-pressed', String(selected === button.dataset.ipoSensor));
    setText(select('[data-ipo-condition-label]'), data.condition);
    setText(select('[data-ipo-reading]'), data.reading[index]);
    setText(select('[data-ipo-rule]'), data.rules[index]);
    setText(select('[data-ipo-output]'), data.actions[index]);
    setText(select('[data-ipo-output-detail]'), data.details[index]);
  }

  function resetWalk() {
    clearTimeout(sequence);
    sequence = null;
    delete section.dataset.walk;
    setText(select('[data-ipo-status]'), 'พร้อมเดินสัญญาณจากค่าที่เลือก');
  }

  for (const button of choices) {
    button.addEventListener('click', () => {
      selected = button.dataset.ipoSensor;
      condition.checked = false;
      resetWalk();
      paint();
    });
  }
  condition.addEventListener('change', () => {
    resetWalk();
    paint();
  });
  run.addEventListener('click', () => {
    resetWalk();
    const topic = topics[selected];
    const index = Number(condition.checked);
    const steps = [
      ['input', `รับเข้า · ${topic.reading[index]}`],
      ['process', `ESP32 ตัดสินใจ · ${topic.rules[index]}`],
      ['output', `ผลลัพธ์ · ${topic.actions[index]}`],
    ];
    const show = i => {
      const [step, message] = steps[i];
      section.dataset.walk = step;
      setText(select('[data-ipo-status]'), message);
      if (i + 1 < steps.length) sequence = setTimeout(() => show(i + 1), 600);
    };
    show(reducedMotion.matches ? 2 : 0);
  });
  paint();
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
const ipo = document.querySelector('[data-feeder-ipo]');
const power = document.querySelector('[data-feeder-power]');
if (demo) mountFeederDemo(demo);
if (ipo) mountFeederIpo(ipo);
if (power) mountPowerDemo(power);
