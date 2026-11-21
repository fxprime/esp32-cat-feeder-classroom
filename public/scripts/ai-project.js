import {setupTradeoff} from './project-tradeoff.js';
import { FEEDER_LIMITS } from './feeder/model.js';

const feederTests = {
  normal: {
    input: 'ความชื้น 55% RH · ระยะถึงผิวเม็ด 10 ซม. · กด “ให้อาหาร Manual” หนึ่งครั้ง',
    pass: 'Buzzer ดังหนึ่งครั้ง ฝาเปิดแล้วปิดหนึ่งรอบ ไฟแดงดับ',
  },
  humid: {
    input: `ตั้งความชื้น ${FEEDER_LIMITS.humidity}% RH · ระดับอาหารปกติ · กด “ให้อาหาร Manual”`,
    pass: 'ฝาปิดอยู่ ไฟแดงติดและแจ้งเหตุถังชื้นครั้งเดียว ทดสอบเทียบกับค่าต่ำกว่าเกณฑ์ 1% RH',
  },
  empty: {
    input: `ความชื้น 55% RH · ปรับระยะเป็น ${FEEDER_LIMITS.emptyCm} ซม. · กด “ให้อาหาร Manual”`,
    pass: 'หน้าเครื่องแสดงอาหารหมด ฝาปิดอยู่ และแจ้งเหตุว่าอาหารหมด',
  },
  repeat: {
    input: 'ค่าปกติ · ส่งมื้อ #1 รอฝาปิด แล้วส่งมื้อ #1 ซ้ำ',
    pass: 'โปรแกรมนับว่าจ่ายไปหนึ่งรอบ ฝาอยู่ปิดเมื่อรับเลขมื้อเดิมครั้งที่สอง',
  },
  arrival: {
    input: 'จ่ายหนึ่งรอบให้เสร็จ แล้วจำลองแมวเข้าระยะ IR ในช่วงรอตรวจ',
    pass: 'ขึ้นว่าพบตัวที่ชามหนึ่งครั้ง จำนวนรอบที่จ่ายยังเป็นหนึ่ง',
  },
};
let selectedFeederTest = 'normal';
let feederBrief = false;

const presets = {
  feeder: {
    idea: 'เครื่องให้อาหารแมวอัตโนมัติ',
    goal: 'เช็กความชื้นและอาหารในถังก่อนจ่ายหนึ่งรอบ แล้วดูว่ามีตัวมาที่ชามหรือยัง',
    budget: '',
    time: 'ช่วง Lab ตอนท้ายวัน',
    tools: 'ESP32 DevKit V1, HTU21D, Ultrasonic, IR สะท้อน Active LOW, Servo, buzzer, LED แดง, Breadboard และ Wokwi',
    limits: 'มีปุ่มให้อาหาร Manual ใช้เกณฑ์ความชื้นเพื่อสาธิต เปิดฝาทีละมื้อ และตรวจค่าที่เห็นจริงใน Lab',
  },
  plant: {
    idea: 'ระบบเตือนรดน้ำต้นไม้',
    goal: 'เมื่อดินแห้งให้ LED ติด เมื่อดินชื้นให้ LED ดับ และดูค่าเซนเซอร์ผ่าน Serial Monitor',
    budget: 350,
    time: '2 สัปดาห์ คาบละ 50 นาที รวม 3 คาบ',
    tools: 'มี ESP32 DevKit V1, breadboard, LED, ตัวต้านทาน, สายจัมเปอร์และสาย USB ใช้ Arduino IDE กับ Wokwi',
    limits: 'เพิ่งหัดเขียนโค้ด ใช้ไฟจาก USB ยังไม่มีเซนเซอร์วัดความชื้นดิน',
  },
  locker: {
    idea: 'ระบบเตือนตู้เก็บของเปิดค้าง',
    goal: 'เปิดประตูตู้เกิน 10 วินาทีแล้วให้มีเสียงเตือน พอปิดประตูเสียงหยุด',
    budget: 300,
    time: '3 คาบ คาบละ 50 นาที',
    tools: 'มี ESP32 DevKit V1, breadboard, สายจัมเปอร์และสาย USB ใช้ Arduino IDE กับบอร์ดจริง',
    limits: 'กลุ่มมี 3 คน ต้องใช้ตู้กระดาษสำหรับสาธิต ยังไม่มีตัวตรวจประตูหรือ buzzer',
  },
  desk: {
    idea: 'ไฟโต๊ะจำลองเปิดเองเมื่อห้องมืด',
    goal: 'เอามือบังเซนเซอร์แล้วไฟติด เอามือออกแล้วไฟดับ ลองซ้ำได้อย่างน้อย 3 ครั้ง',
    budget: 250,
    time: '1 สัปดาห์ รวม 2 คาบ',
    tools: 'มี ESP32 DevKit V1, breadboard, LED, ตัวต้านทาน และสาย USB ใช้ Arduino IDE กับ Wokwi',
    limits: 'ใช้ LED ดวงเล็กกับไฟ USB และทำบน breadboard',
  },
};

const explainFormats = {
  analogy: 'เปรียบกับของใกล้ตัวหนึ่งอย่าง แล้วบอกว่าของแต่ละชิ้นในตัวอย่างแทนส่วนไหนของโปรเจกต์',
  story: 'เล่า 3 ฉากตามลำดับ ตั้งแต่สิ่งที่เซนเซอร์รับรู้ สิ่งที่ ESP32 ตัดสินใจ จนถึงสิ่งที่เราเห็นหรือได้ยิน',
  table: 'สรุปในตาราง 3 คอลัมน์ ได้แก่ ส่วนประกอบ ทำอะไร และจะสังเกตอะไรตอนทดสอบ',
};

const requests = {
  assess: [
    '1. ประเมินว่าทำทันในงบและเวลานี้ไหม บอกเหตุผล จุดที่ยาก และเวอร์ชันเล็กสุดที่สาธิตได้',
    '2. ทำตาราง BOM เป็นเงินบาท มีชื่อและรุ่นอุปกรณ์ จำนวน ช่วงราคาต่อชิ้น และราคารวม แยกของที่มีแล้ว ของที่ต้องซื้อ และของที่เพิ่มทีหลัง รวมค่าส่งในงบ ถ้าเกินงบให้เสนอทางลดราคา',
    '3. ถ้าเช็กราคาจากร้านไทยได้ ให้ใส่ลิงก์กับวันที่ตรวจ ถ้ายังเช็กไม่ได้ให้ติดป้ายว่าเป็นประมาณการและบอกว่ารายการไหนต้องเช็กราคาจริง',
    '4. เสนอการทดลอง POC แรกหนึ่งอย่างพร้อมเกณฑ์ผ่านที่วัดได้ แล้วอธิบายศัพท์ยากที่ใช้ด้วยคำง่าย ๆ',
    'ถ้าข้อมูลสำคัญยังขาด ให้แยกสิ่งที่สมมติไว้และถามฉันต่อไม่เกิน 2 ข้อ',
  ].join('\n'),
  poc: [
    'ช่วยออกแบบ POC (Proof of Concept) สำหรับโปรเจกต์นี้ เลือกพิสูจน์เรื่องที่เสี่ยงที่สุดเพียงเรื่องเดียวก่อน',
    'บอกว่าจะพิสูจน์อะไร ต้องใช้อุปกรณ์อะไร ขั้นตอนสั้น ๆ ที่ทำได้ในหนึ่งคาบ วัดหรือสังเกตอะไร และผลแบบไหนนับว่าผ่าน',
    'แยกสิ่งที่ลองใน Wokwi ได้กับสิ่งที่ต้องทดสอบกับบอร์ดหรือเซนเซอร์จริง ถ้าผลยังไม่ผ่าน ให้แนะนำสิ่งที่จะลองปรับทีละอย่าง',
  ].join('\n'),
  diagram: [
    'วาด block diagram ของโปรเจกต์นี้ เริ่มด้วยแผนภาพตัวอักษรและลูกศรที่อ่านได้ในแชตธรรมดา',
    'แยก Input → Process → Output เขียนชื่ออุปกรณ์จริง และกำกับที่ลูกศรว่าส่งข้อมูลอะไร จากอะไรไปหาอะไร',
    'ช่วยเล่าการทำงานตามภาพด้วยตัวอย่างหนึ่งเหตุการณ์ ถ้าจะให้ผังต่อสาย ให้บอกก่อนว่าต้องรู้รุ่นบอร์ดและอุปกรณ์อะไรเพิ่ม',
  ].join('\n'),
  explain: 'อธิบายว่าโปรเจกต์นี้ทำงานอย่างไรด้วยคำง่าย ๆ ขยายคำย่อครั้งแรกและยกตัวอย่างจากโปรเจกต์นี้',
};

const requestKeywords = {
  assess: ['งบและเวลา', 'ตาราง BOM', 'POC'],
  poc: ['POC', 'เสี่ยงที่สุด', 'Wokwi'],
  diagram: ['block diagram', 'Input → Process → Output'],
  explain: ['คำง่าย ๆ'],
};

const form = document.querySelector('#project-form');
const aiResultDialog = document.querySelector('#ap-ai-result');
const aiResultButton = document.querySelector('#ap-show-ai-result');
const output = document.querySelector('#ap-output');
const outputText = document.querySelector('#ap-output-text');
const typingText = document.querySelector('#ap-typing-text');
const typingOption = document.querySelector('#ap-animate');
const status = document.querySelector('#ap-status');
const idea = form.elements.namedItem('idea');
const presetButtons = [...form.querySelectorAll('[data-preset]')];
const fields = ['idea', 'goal', 'budget', 'time', 'tools', 'limits'];
const target = document.querySelector('#pt-prompt-target');
const playedTopics = new Set();
const motion = matchMedia('(prefers-reduced-motion: no-preference)');
const graphemes = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null;
const typingPreferenceKey = 'feeder-ai-prompt-typing';
const promptIntro = 'ฉันเป็นนักเรียน ม.4 เพิ่งเริ่มทำโปรเจกต์ ESP32 ช่วยตอบเป็นภาษาไทยที่อ่านง่าย\n\n';
const characterMs = 8;
const linePauseMs = 155;
let typingFrame = 0;
let typingEnabled = true;
let buildPlan;

function markRequestKeywords(request, keywords) {
  const parts = [];
  let offset = 0;
  for (const keyword of keywords) {
    const start = request.indexOf(keyword, offset);
    if (start < 0) continue;
    parts.push({ text: request.slice(offset, start) }, { text: keyword, highlighted: true });
    offset = start + keyword.length;
  }
  parts.push({ text: request.slice(offset) });
  return parts;
}

function promptField(label, value) {
  return [{ text: '\n' }, { text: label, highlighted: true }, { text: `: ${value}` }];
}

function mountPromptParts(container, parts) {
  const fragment = document.createDocumentFragment();
  const mounted = parts.map(({ text, highlighted }) => {
    const node = new Text();
    if (highlighted) {
      const mark = document.createElement('mark');
      mark.className = 'ap-marker';
      mark.append(node);
      fragment.append(mark);
    } else {
      fragment.append(node);
    }
    return { text, node };
  });
  container.replaceChildren(fragment);
  return mounted;
}

function revealPromptParts(parts, remaining = Infinity) {
  for (const { text, node } of parts) {
    if (remaining <= 0) break;
    const visible = text.slice(0, remaining);
    if (node.data !== visible) node.data = visible;
    remaining -= text.length;
  }
}

function finishTyping() {
  cancelAnimationFrame(typingFrame);
  typingFrame = 0;
  output.removeAttribute('data-typing');
  typingText.replaceChildren();
}

function typePrompt(prompt, parts) {
  finishTyping();
  const typingParts = mountPromptParts(typingText, parts);
  const characters = [...graphemes.segment(prompt)];
  let characterIndex = 0;
  let nextAt;
  output.setAttribute('data-typing', '');

  function reveal(now) {
    nextAt ??= now;
    let endOffset = 0;
    while (characterIndex < characters.length && now >= nextAt) {
      const { segment, index } = characters[characterIndex++];
      endOffset = index + segment.length;
      nextAt += segment === '\n' ? linePauseMs : characterMs;
    }
    if (characterIndex === characters.length) {
      finishTyping();
      return;
    }
    if (endOffset) revealPromptParts(typingParts, endOffset);
    typingFrame = requestAnimationFrame(reveal);
  }

  typingFrame = requestAnimationFrame(reveal);
}

function syncTypingPreference() {
  typingOption.disabled = !motion.matches || !graphemes;
  typingOption.checked = !typingOption.disabled && typingEnabled;
  if (!typingOption.checked) finishTyping();
}

try {
  typingEnabled = sessionStorage.getItem(typingPreferenceKey) !== 'off';
} catch {
  // The control still works in this slide when browser storage is unavailable.
}
syncTypingPreference();
motion.addEventListener('change', syncTypingPreference);
typingOption.addEventListener('change', () => {
  typingEnabled = typingOption.checked;
  syncTypingPreference();
  try {
    sessionStorage.setItem(typingPreferenceKey, typingEnabled ? 'on' : 'off');
  } catch {
    // Keep the current setting in memory.
  }
});

aiResultButton.addEventListener('click', () => {
  finishTyping();
  aiResultDialog.showModal();
  aiResultDialog.querySelector('.ap-ai-result-body').scrollTop = 0;
});
aiResultDialog.addEventListener('keydown', event => event.stopPropagation());

function renderPrompt({ topicSelected = false } = {}) {
  const values = new FormData(form);
  const read = name => String(values.get(name) ?? '').trim();
  const mode = read('mode');
  const explaining = mode === 'explain';
  document.querySelector('#ap-format-field').hidden = !explaining;
  const request = explaining ? `${requests.explain}\n${explainFormats[read('format')]}` : requests[mode];
  const test = feederBrief ? feederTests[selectedFeederTest] : null;
  const parts = [
    { text: promptIntro },
    ...markRequestKeywords(request, requestKeywords[mode]),
    { text: '\n' },
    ...promptField('ไอเดีย', read('idea') || 'ยังไม่ได้ระบุ'),
    ...promptField('ผลที่อยากให้เห็นตอนสาธิต', read('goal') || 'ช่วยเสนอผลที่วัดได้'),
    ...promptField('งบสูงสุด', read('budget') ? `${read('budget')} บาท` : 'ยังไม่กำหนด'),
    ...promptField('เวลาที่มี', read('time') || 'ยังไม่กำหนด'),
    ...promptField('บอร์ด อุปกรณ์ และเครื่องมือที่มี', read('tools') || 'ยังไม่ได้ระบุ'),
    ...promptField('ข้อจำกัดเพิ่มเติม', read('limits') || 'ยังไม่ได้ระบุ'),
    ...(buildPlan ? promptField('เป้าหมายความพร้อม', `${buildPlan.goal} ช่วยประเมินงบและเวลาของโปรเจกต์ฉันตามเป้าหมายนี้`) : []),
    ...(test ? [
      { text: '\n' },
      ...promptField('กรณีทดสอบที่เลือก', test.input),
      ...promptField('ผลที่คาดไว้', test.pass),
      ...(mode === 'poc' ? [{ text: '\nช่วยวางขั้นตอนทดลองให้ทำซ้ำได้ ระบุว่าจะดูค่าไหนบน Serial หรือหน้าเครื่อง และเสนอกรณีใกล้ขอบเงื่อนไขอีกหนึ่งกรณี' }] : []),
    ] : []),
  ];
  const prompt = parts.map(part => part.text).join('');
  const firstSelection = topicSelected && !playedTopics.has(mode);
  const promptChanged = prompt !== outputText.textContent;
  if (firstSelection) playedTopics.add(mode);
  if (promptChanged) revealPromptParts(mountPromptParts(outputText, parts));
  if (firstSelection && typingOption.checked) typePrompt(prompt, parts);
  else if (promptChanged) finishTyping();
  const matchesSample = mode === 'poc' && test === feederTests.normal && !buildPlan
    && fields.every(field => read(field) === presets.feeder[field]);
  aiResultButton.hidden = !matchesSample;
  status.textContent = '';
}

function markPreset(name) {
  for (const button of presetButtons) button.setAttribute('aria-pressed',String(button.dataset.preset === name));
}

function loadPreset(name) {
  feederBrief = name === 'feeder';
  const preset = presets[name];
  for (const name of fields) form.elements.namedItem(name).value = preset?.[name] ?? '';
  markPreset(name);
  if (name === 'feeder') document.querySelector('#ap-poc').checked = true;
  idea.setCustomValidity('');
  renderPrompt();
  if (name === 'custom') idea.focus();
}

for (const button of presetButtons) {
  button.addEventListener('click',()=>loadPreset(button.dataset.preset));
}
form.addEventListener('submit', event => event.preventDefault());
for (const topic of form.querySelectorAll('input[name="mode"]')) {
  topic.addEventListener('click', () => renderPrompt({ topicSelected: true }));
}
form.addEventListener('input', event => {
  if (event.target === typingOption) return;
  if (event.target.name === 'mode') {
    renderPrompt({ topicSelected: true });
    return;
  }
  idea.setCustomValidity('');
  if (fields.includes(event.target.name)) markPreset('custom');
  renderPrompt();
});

document.querySelector('#ap-copy').addEventListener('click',async () => {
  idea.setCustomValidity(idea.value.trim() ? '' : 'ใส่ไอเดียที่อยากให้ AI ช่วยดู');
  if (!form.reportValidity()) return;
  finishTyping();
  const text = outputText.textContent;
  try {
    await navigator.clipboard.writeText(text);
    if (text === outputText.textContent) status.textContent = 'คัดลอกแล้ว วางคำถามในแชต AI ที่ใช้ได้เลย';
  } catch {
    if (text !== outputText.textContent) return;
    finishTyping();
    output.focus({ preventScroll: true });
    window.getSelection()?.selectAllChildren(outputText);
    status.textContent = 'เลือกข้อความให้แล้ว กด Ctrl+C หรือ ⌘C เพื่อคัดลอก';
  }
});

function testFeeder(name) {
  selectedFeederTest = name;
  const test = feederTests[name];
  document.querySelector('#ap-feeder-input').textContent = test.input;
  document.querySelector('#ap-feeder-pass').textContent = test.pass;
  for (const button of document.querySelectorAll('[data-feeder-test]')) {
    button.setAttribute('aria-pressed', String(button.dataset.feederTest === name));
  }
  if (feederBrief) renderPrompt();
  else loadPreset('feeder');
}

for (const button of document.querySelectorAll('[data-feeder-test]')) {
  button.addEventListener('click', () => testFeeder(button.dataset.feederTest));
}
testFeeder('normal');
setupTradeoff(plan => {
  buildPlan = plan;
  target.hidden = false;
  target.querySelector('#pt-target-text').textContent = `เป้าหมาย · ${plan.title}`;
  renderPrompt();
  output.focus();
});
target.querySelector('#pt-clear').addEventListener('click',()=>{
  buildPlan = undefined;
  target.hidden = true;
  renderPrompt();
  output.focus();
});
document.documentElement.dataset.aiProjectReady = 'true';
