const circuit = document.getElementById('voltage-circuit');
const lowButton = circuit.querySelector('button[data-voltage="3.3"]');
const highButton = circuit.querySelector('button[data-voltage="5"]');
const resetButton = circuit.querySelector('[data-replace-board]');
const number = circuit.querySelector('[data-voltage-number]');
const reading = circuit.querySelector('[data-voltage-reading]');
const status = circuit.querySelector('[data-voltage-status]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let voltage = '3.3';
let state = 'normal';
let timer;

function render() {
  circuit.dataset.voltage = voltage;
  circuit.dataset.state = state;
  const awaitingDamage = state === 'surge';
  const damaged = state === 'damaged';
  lowButton.disabled = awaitingDamage;
  highButton.disabled = state !== 'normal';
  resetButton.disabled = state === 'normal';
  lowButton.setAttribute('aria-pressed', String(voltage === '3.3'));
  highButton.setAttribute('aria-pressed', String(voltage === '5'));
  number.textContent = `${voltage} V`;
  reading.textContent = damaged ? 'GPIO 33 เสีย' : awaitingDamage ? 'แรงดันเกินสเปก' : 'GPIO 33 HIGH';
  status.textContent = damaged
    ? voltage === '5'
      ? 'กรณีจำลอง ขา GPIO33 เสียและไฟแสดงผลดับ ลองลดสัญญาณกลับไปที่ 3.3 V'
      : 'ลดสัญญาณเป็น 3.3 V แล้ว แต่ขาที่เสียยังอ่านค่าไม่ได้ กดเปลี่ยนบอร์ดจำลองเพื่อลองใหม่'
    : awaitingDamage
      ? 'สัญญาณ 5 V มาถึง GPIO33 สูงกว่าระดับอินพุตที่กำหนด'
      : 'ที่ลอจิก 3.3 V ขา GPIO อ่าน HIGH ได้ตามปกติ';
}

lowButton.addEventListener('click', () => {
  voltage = '3.3';
  render();
});
highButton.addEventListener('click', () => {
  voltage = '5';
  const damage = () => { state = 'damaged'; render(); };
  if (reducedMotion.matches) {
    damage();
    return;
  }
  state = 'surge';
  render();
  timer = setTimeout(damage, 700);
});
resetButton.addEventListener('click', () => {
  clearTimeout(timer);
  voltage = '3.3';
  state = 'normal';
  render();
  lowButton.focus();
});
