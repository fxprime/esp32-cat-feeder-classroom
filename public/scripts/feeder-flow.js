const steps = [
  {
    key: 'principle',
    title: 'จากข้อมูลไปสู่การกระทำ',
    input: ['data', 'ข้อมูล', 'รับจากผู้ใช้หรือจากสิ่งรอบตัว'],
    process: ['decision', 'การตัดสินใจ', 'ใช้ข้อมูลกับกติกาเพื่อเลือกว่าจะทำอะไร'],
    output: ['action', 'การกระทำ', 'ลงมือทำตามที่ตัดสินใจ'],
    feedback: ['observe', 'การติดตามผลของการกระทำ', 'ดูผลที่เกิดขึ้น แล้วส่งข้อมูลกลับไปช่วยตัดสินใจรอบต่อไป'],
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
    output: ['closed', 'คงสถานะปิดฝาไว้ ไม่เทขนม', 'แจ้งเจ้าของให้มาเปลี่ยนอาหาร'],
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
    title: 'ติดตามว่าแมวกินเวลาไหนนานแค่ไหน',
    input: ['ir', 'IR ตรวจแมวที่ชาม', 'จับสัญญาณตอนมาถึงและออกจากชาม'],
    process: ['esp32', 'จับเวลาอยู่หน้าชาม', 'ใช้ช่วงที่อยู่หน้าชามประมาณเวลากิน'],
    output: ['phone', 'ส่งรายงานผ่าน Wi-Fi', 'เก็บเวลาที่แมวมาถึงและระยะเวลาที่อยู่หน้าชาม'],
    feedback: ['buzzer', 'เจ้าของสั่งเรียกซ้ำได้', 'ถ้ารายงานว่าแมวยังไม่มา เจ้าของส่งคำสั่งผ่าน Wi-Fi ให้ Buzzer ส่งเสียงเรียกว่าอาหารพร้อมอีกครั้ง'],
  },
  {
    key: 'manual',
    title: 'ให้อาหารด้วยปุ่ม Manual',
    input: ['manual-switch', 'Manual Feed Switch', 'กดปุ่มเพื่อขอให้อาหารทันที'],
    process: ['esp32', 'อาหารพร้อมจ่ายไหม?', 'เช็กความชื้นและอาหารในถัง'],
    output: ['feeder', 'เปิดฝาให้อาหาร', 'เมื่อถังพร้อม เซอร์โวเปิดฝา'],
    feedback: ['piezo', 'Piezo เช็กว่ามีเม็ดอาหารตกไหม', 'ถ้าเปิดฝาแล้วไม่พบแรงกระแทกที่ราง อาหารอาจติดขัด ให้แจ้งเจ้าของทาง Telegram'],
  },
];

const lesson = document.querySelector('[data-flow-lesson]');
const map = lesson.querySelector('.flow-map');
const chapter = document.querySelector('[data-flow-chapter]');
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
const inputArt = nodes.input.querySelector('.flow-art');
const processArt = nodes.process.querySelector('.flow-art');
const outputArt = nodes.output.querySelector('.flow-art');
const processBalloon = nodes.process.querySelector('.flow-balloon');
const links = map.querySelector('.flow-links');
const inputWire = links.querySelector('.flow-link-input');
const outputWire = links.querySelector('.flow-link-output');
const feedbackWire = links.querySelector('.flow-link-feedback');
const inputPort = links.querySelector('.flow-input-port');
const feedbackPort = links.querySelector('.flow-feedback-port');
const outputBranch = links.querySelector('.flow-output-branch');
let current = 0;

function layoutPosition(block) {
  let x = 0;
  let y = 0;
  for (let parent = block; parent && parent !== map; parent = parent.offsetParent) {
    x += parent.offsetLeft;
    y += parent.offsetTop;
  }
  return { x, y };
}

function placePort(port, x, y) {
  port.setAttribute('cx', x);
  port.setAttribute('cy', y);
}

function drawWires() {
  const processLeft = layoutPosition(nodes.process).x;
  const processRight = processLeft + nodes.process.offsetWidth;
  const inputEnd = layoutPosition(nodes.input).x + nodes.input.offsetWidth;
  const outputStart = layoutPosition(nodes.output).x;
  const upperY = layoutPosition(processArt).y + processArt.offsetHeight / 2;
  const lowerY = layoutPosition(processBalloon).y + processBalloon.offsetHeight / 2;
  const loopY = layoutPosition(nodes.feedback).y - 8;
  const branchX = (processRight + outputStart) / 2;
  const returnX = (inputEnd + processLeft) / 2;
  const inletX = processLeft - 3.5;
  const arrowhead = 'l-5 -4 5 4 -5 4';

  inputWire.setAttribute('d', `M${layoutPosition(inputArt).x + inputArt.offsetWidth} ${upperY} H${inletX} ${arrowhead}`);
  outputWire.setAttribute('d', `M${processRight} ${upperY} H${layoutPosition(outputArt).x} ${arrowhead}`);
  feedbackWire.setAttribute('d', `M${branchX} ${upperY} V${loopY} H${returnX} V${lowerY} H${inletX} ${arrowhead}`);
  placePort(inputPort, processLeft, upperY);
  placePort(feedbackPort, processLeft, lowerY);
  placePort(outputBranch, branchX, upperY);
}

function playReveal() {
  map.classList.remove('is-revealing');
  if (!motion.matches) return;
  void map.offsetWidth;
  map.classList.add('is-revealing');
}

function renderStep() {
  const step = steps[current];
  const principle = current === 0;
  chapter.textContent = principle ? 'หลักการทำงานของระบบ' : 'หลักการทำงานของเครื่องให้อาหารแมว';
  lesson.dataset.flowStep = step.key;
  lesson.querySelector('[data-flow-title]').textContent = step.title;
  lesson.querySelector('[data-flow-count]').textContent = `${current + 1} / ${steps.length}`;

  for (const [key, node] of Object.entries(nodes)) {
    const [icon, title, detail] = step[key];
    node.querySelector('use').setAttribute('href', `../assets/feeder-flow.svg?v=devkitc-v4#${icon}`);
    node.querySelector('[data-flow-text]').textContent = title;
    node.querySelector('[data-flow-detail]').textContent = detail;
  }

  if (principle && document.activeElement === previous) next.focus();
  previous.disabled = principle;
  next.textContent = current === steps.length - 1 ? 'ลองกับเครื่อง' : 'ถัดไป';
  summary.hidden = !principle;
  practice.hidden = principle;
  if (principle) practice.open = false;
  drawWires();
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
const routeObserver = new ResizeObserver(drawWires);
for (const element of [map, nodes.process, processArt, processBalloon, nodes.feedback]) routeObserver.observe(element);
renderStep();
