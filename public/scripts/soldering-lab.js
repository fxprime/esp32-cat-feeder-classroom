const lesson = document.querySelector('[data-soldering-lab]');
const sectionButtons = [...lesson.querySelectorAll('[data-solder-section]')];
const panels = [...lesson.querySelectorAll('[data-solder-panel]')];
const rules = [...lesson.querySelectorAll('[data-solder-rule]')];
const ruleCount = lesson.querySelector('[data-solder-rule-count]');
const nextButton = lesson.querySelector('[data-solder-next]');
const previousButton = lesson.querySelector('[data-solder-prev]');
const demoButtons = [...lesson.querySelectorAll('[data-solder-motion]')];
const playButton = lesson.querySelector('[data-solder-play]');
const art = lesson.querySelector('[data-solder-art]');
const demoName = lesson.querySelector('[data-solder-demo-name]');
const demoDetail = lesson.querySelector('[data-solder-demo-detail]');
const jointButtons = [...lesson.querySelectorAll('[data-solder-joint]')];
const jointFrame = lesson.querySelector('[data-solder-joint-selection]');
const jointName = lesson.querySelector('[data-solder-joint-name]');
const jointDetail = lesson.querySelector('[data-solder-joint-detail]');

const demonstration = [
  { key: 'clean', title: 'เตรียมปลายหัวแร้ง', detail: 'เช็ดปลายในฝอยทองเหลือง แล้วเคลือบปลายด้วยลวดบัดกรีบาง ๆ เพื่อช่วยถ่ายความร้อน', hold: 2300 },
  { key: 'heat', title: '1. จี้ขากับแพด', detail: 'แตะขาอุปกรณ์และแผ่นทองแดงพร้อมกัน อุ่นสั้น ๆ ประมาณ 1–2 วินาทีในตัวอย่าง', hold: 2600 },
  { key: 'feed', title: '2. ป้อนลวดที่รอยต่อ', detail: 'ป้อนลวดจากอีกด้านให้แตะรอยต่อที่ร้อน ตะกั่วบัดกรีไหลแนบขาและแพด', hold: 2800 },
  { key: 'remove', title: '3. ถอนลวด แล้วถอนหัวแร้ง', detail: 'ดึงลวดออกก่อน ยกหัวแร้งตาม คืนแท่น แล้วปล่อยชิ้นงานนิ่งจนรอยแข็งตัว', hold: 2800 },
];
const joints = {
  good: ['รอยดี · ทรงภูเขาไฟ', 'ลวดบัดกรีไหลแนบขากับแพด ขอบโค้งเว้า และเห็นรูปขาชัด ลวดไร้ตะกั่วอาจมีผิวด้านได้'],
  cold: ['รอยบัดกรีเย็น · เป็นก้อน', 'ลวดบัดกรีจับเป็นก้อน ขอบไม่แนบกับแพดหรือขา รอยอาจหลวมและนำไฟไม่สม่ำเสมอ'],
  bridge: ['สะพานตะกั่ว · ขาสองขาเชื่อมถึงกัน', 'โลหะพาดข้ามช่องที่ควรแยกกันและอาจทำให้ลัดวงจร ให้ครูช่วยเอาส่วนเกินออกก่อนจ่ายไฟ'],
};
const nextLabels = ['ไปที่สาธิต', 'ตรวจรอยบัดกรี', 'ดูแผนลงมือทำ'];
let sectionIndex = 0;
let revealedRules = 1;
let timer = 0;

function stopDemo() {
  window.clearTimeout(timer);
  timer = 0;
  playButton.textContent = 'เล่นตั้งแต่ต้น';
}

function showDemoFrame(frame) {
  if (art.dataset.solderStage === frame.key) {
    delete art.dataset.solderStage;
    void art.offsetWidth;
  }
  art.dataset.solderStage = frame.key;
  demoName.textContent = frame.title;
  demoDetail.textContent = frame.detail;
  for (const button of demoButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.solderMotion === frame.key));
  }
}

function playDemoFrame(index) {
  const frame = demonstration[index];
  showDemoFrame(frame);
  timer = window.setTimeout(() => {
    if (index + 1 < demonstration.length) playDemoFrame(index + 1);
    else stopDemo();
  }, frame.hold);
}

function render() {
  const current = panels[sectionIndex];
  const final = sectionIndex === panels.length - 1;
  const nextHasFocus = document.activeElement === nextButton;
  for (const [index, panel] of panels.entries()) {
    panel.hidden = index !== sectionIndex;
    if (index === sectionIndex) sectionButtons[index].setAttribute('aria-current', 'step');
    else sectionButtons[index].removeAttribute('aria-current');
  }
  lesson.dataset.solderStep = current.dataset.solderPanel;

  for (const [index, card] of rules.entries()) {
    const revealed = index < revealedRules;
    card.toggleAttribute('data-revealed', revealed);
    card.querySelector('[data-solder-rule-copy]').hidden = !revealed;
  }
  ruleCount.textContent = `เปิดแล้ว ${revealedRules} จาก ${rules.length} ข้อ`;
  previousButton.disabled = sectionIndex === 0 && revealedRules === 1;
  nextButton.hidden = final;
  if (!final) {
    nextButton.textContent = sectionIndex === 0 && revealedRules < rules.length
      ? 'เปิดกฎข้อถัดไป'
      : nextLabels[sectionIndex];
  } else if (nextHasFocus) {
    current.querySelector('h2').focus({ preventScroll: true });
  }
}

function showSection(index) {
  if (index === sectionIndex) return;
  stopDemo();
  sectionIndex = index;
  render();
  panels[index].scrollIntoView({ block: 'nearest' });
}

for (const [index, button] of sectionButtons.entries()) {
  button.addEventListener('click', () => showSection(index));
}
nextButton.addEventListener('click', () => {
  if (sectionIndex === 0 && revealedRules < rules.length) {
    revealedRules += 1;
    render();
    rules[revealedRules - 1].scrollIntoView({ block: 'nearest' });
  } else if (sectionIndex + 1 < panels.length) {
    showSection(sectionIndex + 1);
  }
});
previousButton.addEventListener('click', () => {
  if (sectionIndex > 0) showSection(sectionIndex - 1);
  else if (revealedRules > 1) {
    revealedRules -= 1;
    render();
    if (previousButton.disabled) nextButton.focus({ preventScroll: true });
  }
});
for (const [index, button] of demoButtons.entries()) {
  button.addEventListener('click', () => {
    stopDemo();
    showDemoFrame(demonstration[index]);
  });
}
playButton.addEventListener('click', () => {
  if (timer) { stopDemo(); return; }
  playButton.textContent = 'หยุดเล่น';
  playDemoFrame(0);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopDemo(); });

for (const button of jointButtons) {
  button.addEventListener('click', () => {
    const key = button.dataset.solderJoint;
    jointFrame.dataset.solderJointSelection = key;
    [jointName.textContent, jointDetail.textContent] = joints[key];
    for (const option of jointButtons) option.setAttribute('aria-pressed', String(option === button));
  });
}

render();
