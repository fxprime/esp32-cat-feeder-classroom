const steps = [
  {
    key: 'principle',
    title: 'จากข้อมูลไปสู่การกระทำ',
    input: ['clock', 'ข้อมูล', 'เวลาหรือค่าที่เซนเซอร์อ่านได้'],
    process: ['esp32', 'การตัดสินใจ', 'ESP32 ใช้ข้อมูลเทียบเงื่อนไขในโค้ด'],
    output: ['buzzer', 'การกระทำ', 'สั่งอุปกรณ์ให้ทำงาน'],
    feedback: ['ir', 'การติดตามผลของการกระทำ', 'อ่านสิ่งที่เกิดขึ้น แล้วส่งข้อมูลกลับมาที่ ESP32'],
  },
  {
    key: 'meal',
    title: 'ให้อาหารตามเวลา',
    input: ['clock', 'นาฬิกาบอก 08:00 น.', 'อ่านเวลาปัจจุบัน'],
    process: ['esp32', 'ถึงเวลาให้อาหารแล้วหรือยัง?', 'ถึงมื้อและถังพร้อม → จ่าย'],
    output: ['feeder', 'ให้อาหารหนึ่งมื้อ', 'ส่งเสียง แล้วใช้ Servo เปิด–ปิดฝา'],
    feedback: ['cat', 'มากินแล้ว?', 'IR สะท้อนตรวจว่ามีตัวเข้าใกล้ชามหลังจ่าย'],
  },
  {
    key: 'humidity',
    title: 'หยุดจ่ายเมื่อถังชื้น',
    input: ['humidity', 'HTU21D วัดได้ 70% RH', 'อ่านความชื้นอากาศในถัง'],
    process: ['esp32', 'ความชื้นถึงเกณฑ์ไหม?', 'ตั้งไว้ที่ 70% RH ในแบบจำลอง'],
    output: ['closed', 'คงฝาปิด เปิดไฟแดง', 'แจ้งเจ้าของว่าถังชื้น'],
    feedback: ['humidity', 'วัดใหม่หลังเปลี่ยนอาหาร', 'ส่งค่าความชื้นกลับไปเช็กว่าถังพร้อมแล้วหรือยัง'],
  },
  {
    key: 'level',
    title: 'เตือนเมื่ออาหารใกล้หมด',
    input: ['distance', 'Ultrasonic วัดระยะ', 'วัดจากเซนเซอร์ถึงผิวอาหาร'],
    process: ['esp32', 'อาหารเหลือเท่าไร?', 'ประมาณจากระยะ เช่น เหลือ 15%'],
    output: ['phone', 'แจ้งให้เติมอาหาร', 'เจ้าของเห็นข้อความเตือน'],
    feedback: ['refill', 'เติมแล้ววัดซ้ำ', 'ระยะถึงผิวอาหารสั้นลง ค่าที่ประมาณเพิ่มขึ้น'],
  },
  {
    key: 'arrival',
    title: 'ติดตามว่ามีตัวมาที่ชามไหม',
    input: ['ir', 'IR อ่านแสงสะท้อน', 'เริ่มเฝ้าดูชามหลังจ่ายอาหาร'],
    process: ['esp32', 'มีตัวเข้าใกล้ชามใน 8 วินาทีไหม?', 'อ่านสัญญาณจาก IR'],
    output: ['counter', 'บันทึกว่าพบตัวที่ชาม', 'ดูเหตุการณ์บน Serial'],
    feedback: ['cat', 'เทียบกับสิ่งที่เห็นที่ชาม', 'ลองให้แมวเข้าและออกจากระยะตรวจจับ'],
  },
  {
    key: 'pellets',
    title: 'ต่อยอดด้วยการนับเม็ดอาหาร',
    input: ['piezo', 'เม็ดกระทบแผ่น Piezo', 'แรงกระแทกทำให้เกิดสัญญาณไฟฟ้า'],
    process: ['esp32', 'สัญญาณนี้มาจากเม็ดใหม่ไหม?', 'แยกการกระทบออกจากการสั่นซ้ำ'],
    output: ['counter', 'เพิ่มตัวนับ 1 เม็ด', 'แสดงจำนวนที่นับได้'],
    feedback: ['feeder', 'เทียบกับจำนวนเม็ดที่ตกจริง', 'ใช้ผลที่เห็นปรับเกณฑ์การนับ'],
  },
];

const lesson = document.querySelector('[data-flow-lesson]');
const map = lesson.querySelector('.flow-map');
const next = lesson.querySelector('[data-flow-next]');
const previous = lesson.querySelector('[data-flow-prev]');
const replay = lesson.querySelector('[data-flow-replay]');
const practice = document.querySelector('#feeder-practice');
const summary = document.querySelector('[data-flow-summary]');
const motion = matchMedia('(prefers-reduced-motion: no-preference)');
const nodes = {
  input: lesson.querySelector('[data-flow-node="input"]'),
  process: lesson.querySelector('[data-flow-node="process"]'),
  output: lesson.querySelector('[data-flow-node="output"]'),
  feedback: lesson.querySelector('[data-flow-feedback]'),
};
let current = 0;

function playReveal() {
  map.classList.remove('is-revealing');
  if (!motion.matches) return;
  void map.offsetWidth;
  map.classList.add('is-revealing');
}

function renderStep() {
  const step = steps[current];
  lesson.dataset.flowStep = step.key;
  lesson.querySelector('[data-flow-title]').textContent = step.title;
  lesson.querySelector('[data-flow-count]').textContent = `${current + 1} / ${steps.length}`;

  for (const [key, node] of Object.entries(nodes)) {
    const [icon, title, detail] = step[key];
    node.querySelector('use').setAttribute('href', `../assets/feeder-flow.svg#${icon}`);
    node.querySelector('[data-flow-text]').textContent = title;
    node.querySelector('[data-flow-detail]').textContent = detail;
  }

  if (current === 0 && document.activeElement === previous) next.focus();
  previous.disabled = current === 0;
  next.textContent = current === steps.length - 1 ? 'ลองกับเครื่อง' : 'ถัดไป';
  summary.hidden = current !== 0;
  playReveal();
}

previous.addEventListener('click', () => {
  if (current === 0) return;
  current -= 1;
  renderStep();
});
next.addEventListener('click', () => {
  if (current === steps.length - 1) {
    practice.open = true;
    practice.querySelector('summary').focus({ preventScroll: true });
    practice.scrollIntoView({ block: 'start' });
    return;
  }
  current += 1;
  renderStep();
});
replay.addEventListener('click', playReveal);
renderStep();
