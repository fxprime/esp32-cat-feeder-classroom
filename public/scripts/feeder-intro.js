const project = document.querySelector('[data-project-stage]');
const select = selector => project.querySelector(selector);
const title = select('#fi-project-title');
const progress = select('[data-project-progress]');
const context = select('[data-project-context]');
const next = select('[data-project-next]');
const back = select('[data-project-back]');
const reveal = select('[data-project-reveal]');
const status = select('[data-project-status]');
const featurePanel = select('#fi-features');
const features = [...featurePanel.querySelectorAll('li')];
const legends = [...project.querySelectorAll('[data-project-parts]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const stages = [
  {
    id: 'features', name: 'ฟีเจอร์', title: 'อยากให้เครื่องทำอะไรได้บ้าง?',
    next: 'การจะทำสิ่งนี้ได้ต้องรู้อะไรบ้าง?',
    art: 'ภาพด้านนอกของตู้ให้อาหาร มีชาม แมว และสัญลักษณ์ Wi-Fi',
  },
  {
    id: 'questions', name: 'สิ่งที่ต้องรู้และสั่ง', title: 'การจะทำสิ่งนี้ได้ต้องรู้อะไรบ้าง?',
    context: 'ลองมองทะลุฝาครอบ แต่ละกล่อง ? คือสิ่งที่เครื่องต้องวัดหรือสั่งได้',
    next: 'ดูอุปกรณ์ที่เราจะใช้',
    art: 'ภาพตัดให้เห็นตำแหน่งในถังและรอบชาม กล่องเครื่องหมายคำถามแทนอุปกรณ์ที่ยังไม่เปิดชื่อ',
    caption: 'ตรงกลางต้องมีอะไรอ่านค่าทั้งหมด เช็กว่าให้จ่ายได้ไหม แล้วสั่งให้อุปกรณ์ทำงาน?',
  },
  {
    id: 'devices', name: 'อุปกรณ์ที่เลือก', title: 'เราจะออกแบบด้วยอุปกรณ์เหล่านี้',
    context: 'ESP32 อ่านค่าจากเซนเซอร์ ตัดสินใจตามโค้ดได้รวดเร็ว สั่งงานอุปกรณ์ และสื่อสารผ่านอินเทอร์เน็ตด้วย Wi-Fi',
    art: 'ภาพตัดที่เปิดกล่องแล้ว เห็นบอร์ด ESP32 และอุปกรณ์รอบถังและชาม ตรงกับเลขในรายการ',
    caption: 'พอถึงมื้อ ESP32 จะเช็กอาหารและความชื้นก่อนสั่งฝา ส่วน IR ใช้สังเกตที่ชามหลังจ่าย',
  },
];
const parts = [
  [
    [1, 'วัดว่าอาหารเหลือเท่าไร', 'วัดระยะจากปากถังถึงผิวอาหาร', 'Ultrasonic · HC-SR04'],
    [2, 'วัดว่าถังชื้นแค่ไหน', 'อ่านความชื้นของอากาศในถัง', 'HTU21D'],
    [3, 'ตรวจว่ามีตัวมาที่ชามไหม', 'สังเกตว่ามีตัวเข้ามาใกล้ชาม', 'IR สะท้อน'],
    [8, 'จับแรงสั่นที่ท่อ', 'นับเม็ดที่ตกผ่านท่อ · โจทย์เสริม', 'Piezo'],
  ],
  [
    [4, 'ส่งข้อความถึงเจ้าของ', 'ส่งเหตุที่งดจ่ายไปที่มือถือ', 'Wi-Fi · Telegram'],
    [5, 'เปิดไฟเมื่อมีปัญหา', 'ให้คนเห็นว่าเครื่องงดจ่าย', 'LED แดง'],
    [6, 'ส่งเสียงก่อนปล่อยอาหาร', 'บอกว่าอาหารกำลังมา', 'Buzzer'],
    [7, 'ขยับฝาถัง', 'เปิด–ปิดทางให้อาหารไหลลงชาม', 'Servo'],
  ],
];

let stageIndex = 0;
let shown = 0;
let revealInProgress = false;

function render(nextStage, focus = false) {
  stageIndex = nextStage;
  const stage = stages[stageIndex];
  const exterior = stageIndex === 0;
  project.dataset.projectStage = stage.id;
  progress.textContent = `${stageIndex + 1} / ${stages.length} · ${stage.name}`;
  title.textContent = stage.title;
  context.textContent = stage.context ?? '';
  context.hidden = !stage.context;
  select('#fi-art-desc').textContent = stage.art;
  back.hidden = exterior;
  reveal.hidden = !exterior || shown === features.length;
  next.hidden = !stage.next || (exterior && shown < features.length);
  next.textContent = stage.next ?? '';
  featurePanel.hidden = !exterior || (!revealInProgress && shown === 0);
  for (const [index, legend] of legends.entries()) {
    legend.hidden = exterior;
    if (exterior) continue;
    legend.querySelector('h3').textContent = stage.id === 'questions'
      ? ['สิ่งที่ต้องรู้', 'สิ่งที่ต้องสั่ง'][index]
      : ['เซนเซอร์ส่งค่าเข้า', 'ESP32 สั่งงานและส่งข้อมูล'][index];
    const rows = parts[index].map(([number, question, purpose, device]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const key = document.createElement('span');
      key.className = 'fi-key';
      key.textContent = number;
      term.append(key, stage.id === 'questions' ? question : device);
      const detail = document.createElement('dd');
      detail.textContent = purpose;
      row.append(term, detail);
      return row;
    });
    legend.querySelector('dl').replaceChildren(...rows);
  }
  const caption = select('[data-project-caption]');
  caption.textContent = stage.caption ?? '';
  caption.hidden = !stage.caption;
  if (focus) {
    status.textContent = '';
    title.focus({ preventScroll: true });
  }
}

function showFeature() {
  features[shown].hidden = false;
  shown += 1;
  if (shown < features.length) {
    setTimeout(showFeature, reducedMotion.matches ? 0 : 165);
    return;
  }
  revealInProgress = false;
  const keepFocus = document.activeElement === reveal;
  render(stageIndex);
  status.textContent = 'เปิดฟีเจอร์ครบแล้ว';
  if (keepFocus) next.focus();
}

reveal.addEventListener('click', () => {
  if (revealInProgress || shown === features.length) return;
  revealInProgress = true;
  reveal.setAttribute('aria-expanded', 'true');
  reveal.setAttribute('aria-disabled', 'true');
  featurePanel.hidden = false;
  project.dataset.featuresShown = 'true';
  if (reducedMotion.matches) {
    for (const feature of features.slice(0, -1)) feature.hidden = false;
    shown = features.length - 1;
  }
  showFeature();
});
next.addEventListener('click', () => render(stageIndex + 1, true));
back.addEventListener('click', () => render(stageIndex - 1, true));
project.dataset.projectReady = 'true';
