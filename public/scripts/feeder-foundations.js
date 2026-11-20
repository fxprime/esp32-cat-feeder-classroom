function setText(node, value) {
  if (node.textContent !== value) node.textContent = value;
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

const power = document.querySelector('[data-feeder-power]');
if (power) mountPowerDemo(power);
