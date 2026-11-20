const milestones = {
  works: [
    { budget: 0, hours: 0, title: 'เริ่มจากไอเดีย', reason: 'กำหนดก่อนว่าไฟควรติดเมื่อไร' },
    { budget: 0, hours: 1, title: 'ลองโค้ดใน Wokwi', reason: 'มีเวลาลองใช้ค่าจำลองสั่งเปิด–ปิด LED' },
    { budget: 50, hours: 2, title: 'อ่านเซนเซอร์จริง', reason: 'มีงบซื้อเซนเซอร์และเวลาต่อวงจรเพื่ออ่านค่าดิน' },
    { budget: 50, hours: 3, title: 'เตือนเมื่อดินแห้ง', reason: 'มีเวลาเทียบดินแห้งกับดินชื้น แล้วเลือกค่าให้ไฟเริ่มเตือน' },
  ],
  durability: [
    { budget: 0, hours: 0, title: 'เตรียมวงจร', reason: 'เริ่มจากแบบจำลองก่อนประกอบชิ้นงาน' },
    { budget: 50, hours: 2, title: 'วางเดโมบนโต๊ะ', reason: 'มีเวลาต่อสายบน Breadboard สายจึงยังถอดออกได้ง่าย' },
    { budget: 150, hours: 4, title: 'ยึดกับฐานแล้ว', reason: 'ซื้อฐานกับตัวรัดสายได้ และมีเวลาจัดสายก่อนย้ายโต๊ะ' },
    { budget: 275, hours: 6, title: 'พร้อมประกอบลงกล่อง', reason: 'มีแผ่นบัดกรี กล่อง และจุดรับแรงดึงสาย เผื่อเวลาฝึกบัดกรีกับครู' },
  ],
  evidence: [
    { budget: 0, hours: 0, title: 'เตรียมวิธีทดสอบ', reason: 'จดว่าดินแบบไหนควรทำให้ไฟติดหรือดับ' },
    { budget: 50, hours: 3, title: 'ลองดินแห้งกับดินชื้น', reason: 'มีเวลาลองทั้งสองกรณีแล้วจดค่าที่อ่านได้' },
    { budget: 50, hours: 5, title: 'ทดสอบซ้ำหลายรอบ', reason: 'ใช้ชุดเดิมแล้วเพิ่มเวลาลองอย่างละ 3 รอบ จดครั้งที่เตือนผิดและลองใหม่' },
    { budget: 275, hours: 8, title: 'วางแผนติดตามในที่ใช้จริง', reason: 'มีเวลาลองถอด–เสียบ USB และวางแผนสังเกตในอาคารอีก 7 วัน' },
  ],
  reuse: [
    { budget: 0, hours: 0, title: 'แยกชิ้นส่วนไว้ก่อน', reason: 'วางแผนว่าจะเก็บบอร์ดและอุปกรณ์ชิ้นไหนไว้ใช้ต่อ' },
    { budget: 0, hours: 1, title: 'ใช้ชุดเดิมจากห้องเรียน', reason: 'ESP32 กับ Breadboard ที่มีอยู่เอาไปใช้กับโจทย์อื่นได้' },
    { budget: 50, hours: 2, title: 'ถอดบอร์ดและเซนเซอร์ได้', reason: 'หัวเสียบแยกชิ้นหลักได้ เดโมบน Breadboard ก็ได้แต้มนี้' },
    { budget: 300, hours: 7, title: 'ซ่อมเป็นชิ้นได้', reason: 'เพิ่มซ็อกเก็ตและขั้วถอดได้ จึงเปลี่ยนบอร์ดหรือเซนเซอร์ทีละชิ้นได้' },
  ],
};

const builds = [
  { id: 'virtual', title: 'ลองในโปรแกรมจำลอง', note: 'ใช้ค่าจำลองทดสอบเงื่อนไขก่อนซื้อของเพิ่ม', goal: 'ทำแบบจำลองใน Wokwi ด้วยอุปกรณ์ที่มี แล้ววางแผนว่าจะวัดอะไรบนบอร์ดจริง' },
  { id: 'demo', title: 'เดโมบน Breadboard', note: 'ตัวเดโมเสียบสายบน Breadboard ลองกดถอดแล้วดูว่าชิ้นไหนเอาไปใช้ต่อได้', goal: 'พิสูจน์ฟังก์ชันหลักบน Breadboard แบบตั้งโต๊ะ แล้วถอดบอร์ดและเซนเซอร์ไปใช้ซ้ำได้' },
  { id: 'mounted', title: 'ต้นแบบยึดกับฐาน', note: 'ยึด Breadboard และสายกับฐานเพื่อยกไปสาธิตซ้ำ', goal: 'ยึดฐานและเก็บสายให้ย้ายโต๊ะได้ ทดสอบเปิดใหม่หลายรอบ และเก็บบอร์ดกับเซนเซอร์ให้ถอดได้' },
  { id: 'enclosed', title: 'พร้อมประกอบลงกล่อง', note: 'กล่องช่วยกันวงจรถูกแตะ จุดยึดช่วยรับแรงเมื่อสายถูกดึง', goal: 'เตรียมต้นแบบในกล่องสำหรับใช้ในอาคาร ทำสายให้รับการใช้งานซ้ำ และวางแผนติดตามผลจริง' },
];
const number = new Intl.NumberFormat('th-TH');

function nextRequirement(step,budget,hours) {
  const needs = [];
  if (step.budget > budget) needs.push(`งบเพิ่ม ${number.format(step.budget-budget)} บาท`);
  if (step.hours > hours) needs.push(`เวลาลงมือเพิ่ม ${number.format(step.hours-hours)} ชม.`);
  return `ขั้นถัดไป · ${needs.join(' และ ')}`;
}

export function setupTradeoff(apply) {
  const panel = document.querySelector('#project-tradeoff');
  const q = selector => panel.querySelector(selector);
  const budget = q('#pt-budget');
  const time = q('#pt-time');
  const item = q('#pt-item');
  const detach = q('#pt-detach');
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const duration = Number.parseFloat(getComputedStyle(panel).getPropertyValue('--pt-level-glow'));
  const rows = [...panel.querySelectorAll('[data-stat]')].map(row => {
    const parts = [...row.querySelectorAll('.pt-meter i')].map(segment => {
      segment.append(document.createElement('span'));
      return segment;
    });
    return { row, parts, level: null };
  });
  let build = builds[0];
  let detached = false;

  function renderItem() {
    item.dataset.stage = build.id;
    item.dataset.detached = String(detached);
    q('#pt-stage').textContent = build.title;
    q('#pt-item-note').textContent = detached
      ? 'ESP32 กับเซนเซอร์ถอดแยกได้ เก็บสายและ Breadboard ไว้ประกอบงานอื่น'
      : build.note;
    detach.hidden = build.id !== 'demo';
    detach.textContent = detached ? 'ประกอบกลับ' : 'ลองถอดชิ้นส่วน';
  }

  function render() {
    const money = budget.valueAsNumber;
    const hours = time.valueAsNumber;
    const budgetLabel = `${number.format(money)} บาท`;
    const timeLabel = `${number.format(hours)} ชม.`;
    q('#pt-budget-value').value = budgetLabel;
    q('#pt-time-value').value = timeLabel;
    budget.setAttribute('aria-valuetext',budgetLabel);
    time.setAttribute('aria-valuetext',`${number.format(hours)} ชั่วโมง`);

    const increases = [];
    for (const stat of rows) {
      const {row,parts} = stat;
      const steps = milestones[row.dataset.stat];
      const level = steps.findLastIndex(step => step.budget <= money && step.hours <= hours);
      const next = row.querySelector('[data-next]');
      next.hidden = level === steps.length - 1;
      if (!next.hidden) next.textContent = nextRequirement(steps[level+1],money,hours);
      if (level === stat.level) continue;

      const previous = stat.level;
      const gain = previous === null ? 0 : Math.max(0,level-previous);
      stat.level = level;
      row.dataset.currentLevel = level;
      row.querySelector('[data-level]').textContent = `${level} / 3`;
      row.querySelector('[data-milestone]').textContent = steps[level].title;
      row.querySelector('[data-reason]').textContent = steps[level].reason;
      const increase = row.querySelector('[data-gain]');
      increase.hidden = !gain;
      increase.textContent = gain ? `+${gain}` : '';

      parts.forEach((part,index) => {
        const light = part.firstElementChild;
        light.getAnimations().forEach(animation => animation.cancel());
        part.dataset.filled = String(index < level);
        if (gain && index >= previous && index < level && motion.matches) {
          light.animate([{opacity: 1},{opacity: .78,offset: .38},{opacity: 0}],{duration,easing:'ease-in-out'});
        }
      });
      if (gain) increases.push(`${row.querySelector('h3').textContent} เพิ่ม ${gain} ขั้น ${steps[level].reason}`);
    }
    if (increases.length) q('#pt-status').textContent = increases.join(' · ');
    const levelFor = key => Number(q(`[data-stat="${key}"]`).dataset.currentLevel);
    const nextBuild = builds[levelFor('durability')];
    if (build !== nextBuild) detached = false;
    build = nextBuild;
    item.dataset.working = String(levelFor('works') === 3);
    item.dataset.socket = String(levelFor('reuse') === 3);
    renderItem();
  }

  for (const input of [budget,time]) input.addEventListener('input',render);
  detach.addEventListener('click',()=>{
    detached = !detached;
    renderItem();
  });
  q('#pt-apply').addEventListener('click',()=>apply(build));
  render();
}
