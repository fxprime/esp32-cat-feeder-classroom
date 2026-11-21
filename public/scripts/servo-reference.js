const slide = document.querySelector('[data-servo-reference]');
const part = (name) => slide.querySelector(`[data-${name}]`);

const steps = [
  {
    title: 'มีไฟสองแหล่ง จะส่งคำสั่งถึงกันไหม?',
    description: 'ESP32 รับไฟจาก USB ส่วน Servo ใช้แหล่งจ่าย 5 V ของตัวเอง ลองต่อสายไปทีละขั้น',
    wiring: 'ยังไม่ได้ต่อสาย',
    scope: 'ยังไม่มีพัลส์จาก ESP32',
    action: 'ต่อสายสัญญาณ',
  },
  {
    title: 'ต่อ GPIO18 เข้าขา SIG',
    description: 'สายนี้ส่งพัลส์บอกมุมที่ต้องการ Servo และ ESP32 ยังปิดไฟอยู่',
    wiring: 'ต่อสายสัญญาณแล้ว',
    scope: 'ยังไม่มีพัลส์จาก ESP32',
    action: 'ต่อไฟและเปิด 5 V',
  },
  {
    title: 'ต่อ +5 V และสาย GND ของ Servo',
    description: 'Servo มีไฟเลี้ยงครบวงจรแล้ว แต่ GND ฝั่ง Servo ยังแยกจาก GND ของ ESP32',
    wiring: 'วงจรไฟเลี้ยง Servo ครบ',
    scope: 'ESP32 ยังไม่ส่งพัลส์',
    action: 'เสียบ USB',
  },
  {
    title: 'ในฉากนี้ Servo สั่นแรง',
    description: 'ESP32 ส่งพัลส์เทียบกับ GND ของตัวเอง แต่ Servo วัดด้วย GND อีกฝั่ง จึงอาจอ่านพัลส์ผิด',
    wiring: 'กราวด์ของทั้งสองฝั่งยังแยกกัน',
    scope: 'ตัวรับอาจจับความกว้างพัลส์ผิด',
    action: 'ถอด USB และปิด 5 V',
  },
  {
    title: 'หยุดวงจรก่อนเพิ่มสาย',
    description: 'ถอด USB และปิดแหล่งจ่าย 5 V แล้ว ดูที่ GND ของ ESP32 และขั้วลบของแหล่งจ่าย Servo',
    wiring: 'หยุดทั้งสองฝั่งแล้ว',
    scope: 'ไม่มีพัลส์ขณะปิดไฟ',
    action: 'เชื่อม GND ร่วม',
  },
  {
    title: 'ใช้ GND เดียวกันเป็นจุดอ้างอิง',
    description: 'เชื่อม GND ของ ESP32 เข้าขั้วลบของแหล่งจ่าย Servo สายไฟบวกของสองแหล่งยังแยกกัน',
    wiring: 'ต่อ GND ร่วมแล้ว',
    scope: 'GND ร่วมแล้ว รอเปิดไฟ',
    action: 'เปิด 5 V และเสียบ USB',
  },
  {
    title: 'Servo ขยับแล้วหยุดนิ่งที่มุมที่สั่ง',
    description: 'เมื่อทั้งสองฝั่งอ้างอิง GND เดียวกัน Servo ที่รองรับสัญญาณ 3.3 V จึงอ่านความกว้างพัลส์ได้ในฉากนี้',
    wiring: 'สัญญาณมีจุดอ้างอิงร่วม',
    scope: 'อ่านความกว้างพัลส์ได้ (ตัวอย่าง 1.5 ms)',
    action: 'เริ่มใหม่',
  },
];

const wires = Object.fromEntries(
  [...slide.querySelectorAll('[data-wire]')].map((wire) => [wire.dataset.wire, wire]),
);
const back = part('back');
const next = part('next');
const replay = part('replay');
const arm = slide.querySelector('.sr-servo-arm');
let current = 0;

function render(index, playMotion) {
  const step = steps[index];
  const usb = index === 3 || index === 6;
  const externalPower = index === 2 || usb;
  const commonGround = index >= 5;
  const outcome = index === 3 ? 'jitter' : index === 6 ? 'stable' : 'off';
  const connections = {
    usb,
    signal: index >= 1,
    positive: index >= 2,
    return: index >= 2,
    common: commonGround,
  };

  slide.dataset.step = index;
  slide.dataset.outcome = outcome;
  slide.dataset.usb = usb ? 'on' : 'off';
  slide.dataset.power = externalPower ? 'on' : 'off';
  delete slide.dataset.motion;
  for (const [name, wire] of Object.entries(wires)) {
    const connected = connections[name];
    const wasConnected = wire.hasAttribute('data-connected');
    wire.toggleAttribute('data-connected', connected);
    wire.toggleAttribute('data-entering', playMotion && connected && !wasConnected);
    wire.toggleAttribute('data-leaving', playMotion && !connected && wasConnected);
  }

  if (playMotion && outcome !== 'off') {
    // Recalculate only on a requested replay so the arm can start the same animation again.
    if (index === current) arm.getBoundingClientRect();
    slide.dataset.motion = outcome;
  }
  const wiringStatus = part('wiring-status');
  const powerStatus = part('power-status');
  part('step-heading').textContent = step.title;
  part('step-description').textContent = step.description;
  part('step-number').textContent = index + 1;
  wiringStatus.textContent = step.wiring;
  powerStatus.textContent = `USB ${usb ? 'ต่อแล้ว' : 'ถอดอยู่'} · 5 V ${externalPower ? 'เปิด' : 'ปิด'}`;
  part('svg-supply').textContent = externalPower ? 'เปิดไฟ' : 'ปิดไฟ';
  part('scope-status').textContent = step.scope;
  part('trace-title').textContent = step.scope;
  next.textContent = step.action;
  back.disabled = index === 0;
  replay.hidden = index < 3;
  replay.textContent = index === 3 ? 'เล่นฉากสั่นอีกครั้ง' : 'ย้อนดูอาการสั่น';
  current = index;
}

next.addEventListener('click', () => render((current + 1) % steps.length, true));
back.addEventListener('click', () => {
  if (current === 0) return;
  render(current - 1, false);
  if (current === 0) next.focus();
});
replay.addEventListener('click', () => render(3, true));

const dialog = part('differential');
const shift = part('shift');
part('open-differential').addEventListener('click', () => dialog.showModal());
shift.addEventListener('click', () => {
  const shifted = dialog.toggleAttribute('data-shifted');
  const high = shifted ? '4.5' : '3.5';
  const low = shifted ? '2.5' : '1.5';
  part('pair-high').textContent = `${high} V`;
  part('pair-low').textContent = `${low} V`;
  part('pair-result').textContent = `${high} − ${low} = 2.0 V`;
  shift.textContent = shifted ? 'ลดทั้งคู่ 1 V' : 'เพิ่มทั้งคู่ 1 V';
});

render(0, false);
