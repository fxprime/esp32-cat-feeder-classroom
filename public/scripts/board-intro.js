import { pins, pinAdvice } from './pinout/data.js';
import { escapeHTML } from './pinout/diagrams.js';
import { FEEDER_PINS as feeder } from './feeder/model.js';

const byId = id => document.getElementById(id);
const zones = {
  overview: {
    theme: 'teal', badge: 'ภาพรวมบอร์ด', spec: '30-Pin DevKit V1',
    title: 'บอร์ด ESP32 DevKit V1 (30 ขา)',
    description: 'เลือกขาหรือชิ้นส่วน เช่น Micro-USB, Wi‑Fi, EN, BOOT และ LED เพื่อดูหน้าที่และจุดที่ต้องระวัง',
    chips: ['15 ขาซ้าย + 15 ขาขวา', 'ลอจิก 3.3 V', 'Wi‑Fi ในตัว'],
  },
  power: {
    theme: 'rose', color: '#f29a9a', badge: 'โซน 1 · Power & Control', spec: 'ไฟเลี้ยงและรีเซ็ต',
    title: 'ขาไฟเลี้ยงและควบคุม',
    description: '3V3 ใช้เลี้ยงเซนเซอร์แรงดัน 3.3 V, GND เป็นจุดอ้างอิงร่วม, VIN ใช้กับไฟ 5 V ตามวงจรของบอร์ด และ EN ใช้รีเซ็ต',
    chips: ['3V3 · 3.3 V', 'VIN · 5 V', 'GND · 0 V', 'EN · Reset'],
  },
  input_only: {
    theme: 'sky', color: '#a4d6f0', badge: 'โซน 2 · Input-Only', spec: 'รับสัญญาณอย่างเดียว',
    title: 'ขาที่ใช้รับค่าได้อย่างเดียว',
    description: 'GPIO 34, 35, 36 (VP) และ 39 (VN) รับสัญญาณ Digital หรือ Analog ผ่าน ADC1 ได้ เวลาใช้เซนเซอร์ให้เช็กแรงดันและต่อ pull-up ภายนอกเมื่อจำเป็น',
    chips: ['GPIO 34 · Piezo ผ่านวงจรปรับสัญญาณ', 'ADC1 · อ่านร่วมกับ Wi‑Fi ได้'],
  },
  safe: {
    theme: 'emerald', color: '#bbd8c9', badge: 'โซน 3 · Safe GPIO', spec: 'ขาสัญญาณอเนกประสงค์',
    title: 'ขาที่เหมาะกับการเริ่มต่อวงจร',
    description: 'ใช้รับ–ส่ง Digital หรือ PWM ได้ หลายขารองรับ ADC หรือ Touch ด้วย ให้เลือกขาตามสัญญาณที่ต้องการ เช่น GPIO21 และ GPIO22 ใช้ต่อ HTU21D ผ่าน I²C',
    chips: ['GPIO18 · Servo', 'GPIO21 / 22 · I²C', 'GPIO23 · LED', 'GPIO33 · IR'],
  },
  caution: {
    theme: 'amber', color: '#e9b884', badge: 'โซน 4 · Caution', spec: 'ขาบูตและ UART0',
    title: 'ขาที่ต้องระวังเวลาเลือกใช้',
    description: 'ระดับสัญญาณของ GPIO 2, 5, 12 และ 15 มีผลตอนบูต ส่วน TX0/RX0 ใช้สื่อสารกับคอมพิวเตอร์ผ่าน USB เลือกขาอื่นก่อนถ้ายังมีขาว่าง',
    chips: ['GPIO12 · หลีกเลี่ยง HIGH ตอนบูต', 'GPIO2 · LED บางรุ่น', 'TX0 / RX0 · USB Serial'],
  },
};

const projectPins = {
  [feeder.servo]: ['Servo ฝาอาหาร', 'ส่งพัลส์ควบคุมมุมให้ Servo เปิด–ปิดฝา ใช้แหล่งจ่าย 5 V ที่เหมาะกับ Servo และต่อ GND ร่วม'],
  [feeder.meal]: ['ปุ่มให้อาหาร Manual', 'ตั้ง INPUT_PULLUP เพื่ออ่าน HIGH ตอนปล่อย และ LOW ตอนกดปุ่มลง GND'],
  [feeder.humiditySda]: ['HTU21D · SDA', 'ส่งคำสั่งและรับค่าความชื้นจาก HTU21D ผ่านสาย SDA ต่อคู่กับ SCL ที่ GPIO22'],
  [feeder.humidityScl]: ['HTU21D · SCL', 'ส่งจังหวะนาฬิกา I²C ให้ HTU21D ต่อคู่กับ SDA ที่ GPIO21'],
  [feeder.led]: ['LED แดงแจ้งเตือน', 'สั่งไฟแดงผ่านตัวต้านทาน 330 Ω เมื่อเครื่องงดจ่ายอาหาร'],
  [feeder.buzzer]: ['Passive buzzer', 'ส่งพัลส์ให้บัซเซอร์ส่งเสียงเรียกก่อนเปิดฝา'],
  [feeder.trigger]: ['HC-SR04 · TRIG', 'ส่งพัลส์เริ่มวัดระยะจากปากถังถึงผิวอาหาร'],
  [feeder.echo]: ['HC-SR04 · ECHO', 'อ่านความยาวพัลส์เพื่อหาระยะ ลดแรงดัน ECHO จาก 5 V ด้วยตัวแบ่ง 1 kΩ และ 1.8 kΩ ก่อนเข้าขา ESP32'],
  [feeder.infrared]: ['IR สะท้อนที่ชาม', 'อ่านระดับสัญญาณจาก OUT ของเซนเซอร์ Active LOW เพื่อสังเกตว่ามีตัวเข้าใกล้ชาม ใช้สัญญาณลอจิก 3.3 V'],
  [feeder.piezo]: ['Piezo นับเม็ด', 'อ่านสัญญาณจาก Piezo ตอนเม็ดตกกระทบท่อผ่าน ADC1 ต่อวงจรปรับและป้องกันแรงดันก่อนเข้าขา ESP32'],
};

const hardwareParts = {
  wifi: {
    theme: 'teal', badge: 'สื่อสารไร้สาย', spec: 'Wi‑Fi 2.4 GHz และ Bluetooth',
    title: 'เสาอากาศ Wi‑Fi และโมดูล ESP32-WROOM-32',
    description: 'ใช้อ่านเซนเซอร์ สั่งอุปกรณ์ และต่อ Wi‑Fi 2.4 GHz เพื่อส่งข้อความถึงมือถือผ่านอินเทอร์เน็ต',
    chips: ['Wi‑Fi 2.4 GHz', 'Bluetooth / BLE', 'Telegram ในโครงงาน'],
  },
  leds: {
    theme: 'sky', badge: 'ไฟสถานะบนบอร์ด', spec: 'PWR และ IO2',
    title: 'ไฟ LED บนบอร์ด',
    description: 'ไฟ PWR ติดเมื่อบอร์ดได้รับไฟ บอร์ดตัวอย่างมีไฟ IO2 สำหรับลองโปรแกรม Blink สีและการต่อ LED อาจต่างกันตามรุ่น',
    chips: ['PWR · ไฟเข้าบอร์ด', 'IO2 · ไฟทดสอบ'],
  },
  btn_en: {
    theme: 'rose', badge: 'ปุ่มบนบอร์ด', spec: 'Reset · Active LOW',
    title: 'ปุ่ม EN',
    description: 'กดเพื่อรีสตาร์ตให้โปรแกรมเริ่มจาก setup() โค้ดที่แฟลชไว้ยังอยู่',
    chips: ['เริ่มโปรแกรมใหม่'],
  },
  btn_boot: {
    theme: 'amber', badge: 'ปุ่มบนบอร์ด', spec: 'GPIO0',
    title: 'ปุ่ม BOOT',
    description: 'ค้างปุ่ม BOOT ขณะรีเซ็ตเพื่อเข้าโหมดอัปโหลด หากบอร์ดเข้าโหมดแฟลชอัตโนมัติไม่ได้',
    chips: ['โหมดอัปโหลดโค้ด'],
  },
  usb: {
    theme: 'slate', badge: 'พอร์ตเชื่อมต่อหลัก', spec: 'ไฟ 5 V และข้อมูล USB',
    title: 'พอร์ต Micro-USB',
    description: 'เสียบสาย USB แบบส่งข้อมูลเพื่อจ่ายไฟ อัปโหลดโค้ด และดูค่าบน Serial Monitor',
    chips: ['อัปโหลดจากคอม', 'Serial Monitor', 'ไฟเลี้ยงบอร์ด'],
  },
};
const partTraceStarts = {
  wifi: [365, 118], leds: [353, 419], btn_en: [265, 444], btn_boot: [359, 444], usb: [329, 500],
};
const examples = {
  EN: ['ปุ่มรีเซ็ตภายนอก'], VIN: ['แหล่งจ่าย 5 V ตามวงจรบอร์ด'],
  GND: ['GND ร่วมกับเซนเซอร์และแหล่งจ่าย Servo'], '3V3': ['เลี้ยง HTU21D'],
  '16': ['UART2 RX · รับข้อมูล'], '17': ['UART2 TX · ส่งข้อมูล'],
};

const themes = {
  teal: ['border-teal-300 bg-white/95', 'bg-teal-100 text-teal-800'],
  rose: ['border-rose-400 bg-rose-50/60', 'bg-rose-100 text-rose-800'],
  sky: ['border-sky-400 bg-sky-50/60', 'bg-sky-100 text-sky-800'],
  emerald: ['border-emerald-400 bg-emerald-50/60', 'bg-emerald-100 text-emerald-800'],
  amber: ['border-amber-400 bg-amber-50/60', 'bg-amber-100 text-amber-900'],
  slate: ['border-slate-400 bg-slate-50', 'bg-slate-200 text-slate-800'],
};
const normalize = p => {
  const key = p.id === 'GND' ? (p.side ? 'gnd_r' : 'gnd_l') : p.id.toLowerCase();
  const zone = p.inputOnly ? 'input_only' : p.risk === 'strap' || p.risk === 'usb'
    ? 'caution' : p.caps.includes('power') ? 'power' : 'safe';
  return { ...p, key, zone, cx: p.side ? 210 : 0, cy: 25 + p.index * 29 };
};
const boardPins = pins.map(normalize);
const pinMap = new Map(boardPins.map(pin => [pin.key, pin]));
const count = boardPins.filter(pin => projectPins[pin.id]).length;
const stage = byId('boardStage');
const art = stage.querySelector('svg');
const picker = byId('boardPartPicker');
const feederButton = byId('feederHighlightBtn');
const zoneButtons = [...document.querySelectorAll('[data-zone].zone-btn')];
const overviewOption = new Option('ภาพรวมทั้งบอร์ด', '');
const gpioLabel = pin => /^\d+$/.test(pin.id) ? (pin.label === pin.id ? `GPIO${pin.id}` : pin.label) : pin.label;

function pinMarkup(pin) {
  const { key, zone, cx, cy, side } = pin;
  const projectName = projectPins[pin.id]?.[0];
  const x = side ? 226 : -144;
  const labelPosition = side ? 194 : 16;
  const projectTag = projectName ? `<g class="feeder-tag">
    <path d="M${side ? 220 : -10} ${cy}h${side ? 6 : -6}" stroke="#f59e0b" stroke-width="2"/>
    <rect x="${x}" y="${cy - 10}" width="128" height="20" rx="6" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="${x + 64}" y="${cy + 3.5}" text-anchor="middle" font-size="10" font-weight="800" fill="#92400e">${escapeHTML(projectName)}</text>
  </g>` : '';
  return `<g class="pin-node" data-pin="${key}" data-zone="${zone}"${projectName ? ' data-feeder="1"' : ''}>
    <rect x="${side ? 180 : -24}" y="${cy - 14}" width="56" height="28" fill="transparent"/>
    <rect class="pin-pad" x="${cx - 10}" y="${cy - 7}" width="20" height="14" rx="3" fill="${zones[zone].color}" stroke="#263d43" stroke-width="1.2"/>
    <text x="${labelPosition}" y="${cy + 4}" text-anchor="${side ? 'end' : 'start'}" font-size="11" font-weight="700" fill="#fff">${escapeHTML(pin.label)}</text>
    ${projectTag}
  </g>`;
}

byId('pinsLayer').innerHTML = boardPins.map(pinMarkup).join('');
const pinElements = [...stage.querySelectorAll('.pin-node')];
const partElements = [...stage.querySelectorAll('.hw-node')];
byId('feederPinCount').textContent = `(${count} ขา)`;
picker.append(overviewOption);
for (const side of [0, 1]) {
  const group = document.createElement('optgroup');
  group.label = side ? 'ขาฝั่งขวา' : 'ขาฝั่งซ้าย';
  group.append(...boardPins.filter(pin => pin.side === side).map(pin => new Option(gpioLabel(pin), pin.key)));
  picker.append(group);
}
const components = document.createElement('optgroup');
components.label = 'ชิ้นส่วนบนบอร์ด';
components.append(...Object.entries(hardwareParts).map(([key, part]) => new Option(part.title, key)));
picker.append(components);

let activeZone = '';
let selected = '';
let projectMode = false;
let compact = false;

function pinInfo(pin) {
  const [projectName, description] = projectPins[pin.id] ?? [];
  const advice = pinAdvice(pin);
  const capabilities = ['adc1', 'adc2', 'dac', 'touch'].filter(cap => pin.caps.includes(cap)).map(cap => cap.toUpperCase());
  const spec = pin.inputOnly ? 'Input-Only · ADC1' : ({
    EN: 'Reset · Active LOW', GND: 'Ground · 0 V', VIN: 'ไฟ 5 V', '3V3': 'ไฟ 3.3 V',
  })[pin.id] || (pin.risk === 'usb' ? 'UART0 · USB Serial' : pin.risk === 'strap'
    ? 'Strapping pin' : ['21', '22'].includes(pin.id) ? 'GPIO · I²C' : ['Digital I/O', ...capabilities].join(' · '));
  const chips = projectName ? [projectName] : examples[pin.id] ?? (
    pin.risk === 'usb' ? ['Serial Monitor', 'อัปโหลดโค้ด'] :
    pin.risk === 'strap' ? ['ตรวจระดับสัญญาณตอนเปิดเครื่อง'] :
    pin.inputOnly ? ['Potentiometer', 'เซนเซอร์ Analog'] : ['ปุ่มกด', 'LED ผ่านตัวต้านทาน']);
  return {
    ...zones[pin.zone],
    title: `ขา ${gpioLabel(pin)}`,
    spec,
    description: description ? `${description} · ${advice}` : advice,
    projectName,
    chips,
  };
}

function inspectorInfo() {
  if (pinMap.has(selected)) return pinInfo(pinMap.get(selected));
  if (selected) return hardwareParts[selected];
  if (!projectMode) return zones[activeZone || 'overview'];
  return {
    theme: 'amber', badge: 'โปรเจกต์เครื่องให้อาหารแมว', spec: `${count} ขา GPIO`,
    title: `${count} ขาที่ใช้ในเครื่องให้อาหารแมว`,
    description: 'แตะขาที่เรืองสีทองเพื่อดูว่าต่อกับชิ้นส่วนไหน ขา 34 สำหรับ Piezo เป็นส่วนเสริมของโครงงาน',
    chips: boardPins.filter(pin => projectPins[pin.id]).map(pin => `${pin.id} · ${projectPins[pin.id][0]}`),
  };
}

function renderInspector() {
  const info = inspectorInfo();
  const [cardTheme, badgeTheme] = themes[info.theme];
  byId('inspectorCard').className = `l3-inspector-card ${cardTheme}`;
  byId('inspZoneBadge').className = `px-3 py-1 rounded-full text-xs font-extrabold ${badgeTheme}`;
  byId('inspZoneBadge').textContent = info.badge;
  byId('inspElecBadge').textContent = info.spec;
  byId('inspTitle').textContent = info.title;
  byId('inspDesc').textContent = info.description;
  const projectBanner = byId('inspFeederBanner');
  projectBanner.classList.toggle('hidden', !info.projectName);
  projectBanner.classList.toggle('flex', Boolean(info.projectName));
  byId('inspFeederText').textContent = info.projectName ? `ใช้ในเครื่องให้อาหารแมว · ${info.projectName}` : '';
  const chips = byId('inspChips');
  chips.parentElement.hidden = !info.chips.length;
  chips.replaceChildren(...info.chips.map(label => {
    const element = document.createElement('span');
    element.className = 'l3-chip';
    element.textContent = label;
    return element;
  }));
}

function renderTrace() {
  const pin = pinMap.get(selected);
  const start = partTraceStarts[selected];
  const ring = byId('pinPulseRing');
  const trace = byId('inspectorTrace');
  ring.classList.toggle('is-visible', Boolean(pin));
  trace.classList.toggle('is-visible', Boolean(pin || start));
  const edge = compact ? 468 : 596;
  if (start) trace.setAttribute('d', `M${start[0]} ${start[1]}H${edge}`);
  if (!pin) return;
  const { cx, cy, side } = pin;
  ring.setAttribute('cx', cx);
  ring.setAttribute('cy', cy);
  const y = 38 + cy;
  trace.setAttribute('d', side
    ? `M425 ${y}H${edge}`
    : `M183 ${y}H160V525H${edge - 16}V${y}H${edge}`);
}

function render() {
  stage.classList.toggle('is-feeder-mode', projectMode);
  feederButton.setAttribute('aria-pressed', String(projectMode));
  byId('feederModeBadge').textContent = projectMode ? 'เปิดอยู่ ✓' : 'ปิดอยู่';
  byId('zoneBanner').classList.toggle('is-visible', Boolean(projectMode || activeZone));
  byId('zoneBannerText').textContent = projectMode ? `ไฮไลต์ ${count} ขาของเครื่องให้อาหารแมว` : zones[activeZone || 'overview'].badge;
  for (const button of zoneButtons) {
    const active = button.dataset.zone === activeZone;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  for (const element of [...pinElements, ...partElements]) {
    const { pin, zone, feeder: used } = element.dataset;
    const active = pin === selected;
    const dim = projectMode ? !used : activeZone && activeZone !== zone;
    element.classList.toggle('is-selected', active);
    element.classList.toggle('is-dimmed', Boolean(dim && !active));
    element.classList.toggle('is-feeder-lit', Boolean(projectMode && used));
    element.classList.toggle('is-zone-lit', Boolean(zone && zone === activeZone));
  }
  picker.value = selected;
  overviewOption.textContent = projectMode ? 'ขาของเครื่องให้อาหารแมว' : zones[activeZone || 'overview'].badge;
  renderTrace();
  renderInspector();
}

function selectPin(key) {
  selected = key;
  if (!pinMap.has(key) && key) {
    projectMode = false;
    activeZone = '';
  } else if (!projectMode) {
    activeZone = pinMap.get(key)?.zone ?? '';
  }
  render();
}

stage.addEventListener('click', event => {
  const part = event.target.closest('[data-pin]');
  if (part) selectPin(part.dataset.pin === selected ? '' : part.dataset.pin);
});
picker.addEventListener('change', () => selectPin(picker.value));
for (const button of zoneButtons) {
  button.addEventListener('click', () => {
    activeZone = button.dataset.zone === activeZone ? '' : button.dataset.zone;
    projectMode = false;
    selected = '';
    render();
  });
}
feederButton.addEventListener('click', () => {
  projectMode = !projectMode;
  selected = '';
  activeZone = '';
  render();
});
byId('resetBoardBtn').addEventListener('click', () => {
  projectMode = false;
  selected = '';
  activeZone = '';
  render();
});
new ResizeObserver(([entry]) => {
  const next = entry.contentRect.width < 450;
  if (next === compact) return;
  compact = next;
  stage.dataset.boardCompact = String(compact);
  art.setAttribute('viewBox', compact ? '127 0 346 540' : '0 0 600 540');
  renderTrace();
}).observe(stage);
render();
stage.dataset.boardReady = 'true';
