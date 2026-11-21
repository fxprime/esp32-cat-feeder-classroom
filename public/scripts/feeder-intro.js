const project = document.querySelector('[data-project-stage]');
const select = selector => project.querySelector(selector);
const title = select('#fi-project-title');
const progress = select('[data-project-progress]');
const context = select('[data-project-context]');
const next = select('[data-project-next]');
const back = select('[data-project-back]');
const proof = select('[data-project-proof]');
const reveal = select('[data-project-reveal]');
const status = select('[data-project-status]');
const featurePanel = select('#fi-features');
const features = [...featurePanel.querySelectorAll('li')];
const art = select('.fi-art');
const diagram = select('.fi-diagram');
const leaderLayer = select('[data-feature-leaders]');
const links = features.map(card => {
  const group = document.createElementNS(art.namespaceURI, 'g');
  const path = document.createElementNS(art.namespaceURI, 'path');
  const dot = document.createElementNS(art.namespaceURI, 'circle');
  const anchor = card.dataset.anchor.split(' ').map(Number);
  group.dataset.featureLink = card.dataset.feature;
  path.setAttribute('pathLength', '1');
  dot.setAttribute('r', '4');
  group.append(path, dot);
  leaderLayer.append(group);
  return { card, group, path, dot, anchor };
});
const legends = [...project.querySelectorAll('[data-project-parts]')];
const stages = [
  {
    id: 'features', name: 'ฟีเจอร์', title: 'ให้อาหารตามเวลา แม้คุณไม่อยู่บ้าน',
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
let showAll = false;
let leaderFrame = 0;

function layoutLeaders() {
  if (leaderLayer.hasAttribute('hidden')) return;
  const projector = art.getScreenCTM();
  if (!projector) return;
  const frame = leaderLayer.getBoundingClientRect();
  const artBox = art.getBoundingClientRect();
  const horizontal = getComputedStyle(diagram).getPropertyValue('--fi-leader-axis').trim() === 'horizontal';
  leaderLayer.setAttribute('viewBox', `0 0 ${frame.width} ${frame.height}`);
  for (const [index, { card, path, dot, anchor }] of links.entries()) {
    if (index >= shown) continue;
    const point = new DOMPoint(...anchor).matrixTransform(projector);
    const x = point.x - frame.left;
    const y = point.y - frame.top;
    const box = card.getBoundingClientRect();
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', y);
    if (horizontal) {
      const left = card.dataset.dock === 'left';
      const edge = (left ? box.right : box.left) - frame.left;
      const artEdge = (left ? artBox.left : artBox.right) - frame.left;
      const endY = box.top + box.height / 2 - frame.top;
      const bend = edge + (artEdge - edge) * (.25 + (index % 4) * .15);
      path.setAttribute('d', `M ${x} ${y} H ${bend} V ${endY} H ${edge}`);
    } else {
      const endX = box.left + box.width / 2 - frame.left;
      const endY = box.top - frame.top;
      const bend = (artBox.bottom - frame.top + endY) / 2;
      path.setAttribute('d', `M ${x} ${y} V ${bend} H ${endX} V ${endY}`);
    }
  }
}

function queueLeaderLayout() {
  if (leaderFrame) return;
  leaderFrame = requestAnimationFrame(() => {
    leaderFrame = 0;
    layoutLeaders();
  });
}

function renderFeatures() {
  project.dataset.featureView = showAll ? 'all' : shown ? 'focus' : 'idle';
  project.dataset.activeFeature = showAll ? '' : features[shown - 1]?.dataset.feature ?? '';
  reveal.setAttribute('aria-expanded', String(shown > 0));
  reveal.textContent = shown === features.length ? 'ดูฟีเจอร์ทั้งหมด' : shown ? `ดูฟีเจอร์ถัดไป (${shown + 1} / ${features.length})` : 'ดูฟีเจอร์';
  for (const [index, { card, group }] of links.entries()) {
    const state = showAll ? 'all' : index >= shown ? 'queued' : index === shown - 1 ? 'focus' : 'past';
    card.dataset.featureState = state;
    group.dataset.featureState = state;
    card.setAttribute('aria-hidden', String(state === 'queued'));
  }
  queueLeaderLayout();
}

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
  reveal.hidden = !exterior || showAll;
  next.hidden = !stage.next || (exterior && !showAll);
  next.textContent = stage.next ?? '';
  proof.hidden = stage.id !== 'devices';
  featurePanel.hidden = !exterior;
  leaderLayer.toggleAttribute('hidden', !exterior || shown === 0);
  if (exterior) renderFeatures();
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

reveal.addEventListener('click', () => {
  if (showAll) return;
  if (shown === features.length) {
    const keepFocus = document.activeElement === reveal;
    showAll = true;
    render(stageIndex);
    status.textContent = 'เปิดครบทุกฟีเจอร์แล้ว';
    if (keepFocus) next.focus({ preventScroll: true });
    return;
  }
  shown += 1;
  render(stageIndex);
  const feature = features[shown - 1].querySelector('strong').textContent;
  status.textContent = `ฟีเจอร์ ${shown} จาก ${features.length} · ${feature}`;
});
next.addEventListener('click', () => render(stageIndex + 1, true));
back.addEventListener('click', () => render(stageIndex - 1, true));
proof.addEventListener('click', () => {
  if (parent === window) location.assign('../#slide-17');
  else parent.postMessage({ type: 'SLIDE_NAV_KEY', key: 'ArrowRight' }, location.origin);
});
const resizeLeaders = new ResizeObserver(queueLeaderLayout);
resizeLeaders.observe(diagram);
resizeLeaders.observe(art);
render(0);
project.dataset.projectReady = 'true';
