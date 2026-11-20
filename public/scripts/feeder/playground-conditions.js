import { createFeeder, FEEDER_LIMITS } from './model.js';

const sim = createFeeder();
const root = document.querySelector('[data-feeder-conditions]');
const humidity = root.querySelector('#meal-humidity');
const distance = root.querySelector('#meal-distance');
const sensorError = root.querySelector('#meal-sensor-error');
const presence = root.querySelector('#meal-ir');
const online = root.querySelector('#meal-online');
const request = root.querySelector('#meal-start');
const repeat = root.querySelector('#meal-repeat');
const announcement = root.querySelector('#meal-result');
const log = root.querySelector('#meal-events');
const simulated = root.querySelector('#meal-simulated');
const flags = Object.freeze({
  idle: 'รอมื้อต่อไป',
  beeping: 'ส่งเสียงเตือน · ฝายังปิด',
  dispensing: 'เปิดฝา · จ่ายอาหาร',
  watching: 'ปิดฝา · ดูว่ามีตัวมาที่ชามหรือยัง',
  blocked: 'งดจ่ายมื้อนี้ · ไฟแดงติด',
});
let frame = 0;
let previousTime;
let previousLog = '';
let transient = '';

function paint() {
  const state = sim.getState();
  root.dataset.phase = state.phase;
  root.dataset.red = String(state.ledRed);
  root.dataset.presence = String(state.catAtBowl);
  root.querySelector('#meal-humidity-value').textContent = state.humidity === null ? 'อ่านไม่ได้' : `${state.humidity}% RH`;
  root.querySelector('#meal-distance-value').textContent = `${state.distanceCm} ซม. · เหลือประมาณ ${state.foodPercent}%`;
  root.querySelector('#meal-ir-value').textContent = state.catAtBowl ? 'LOW · มีบางอย่างบังลำแสง' : 'HIGH · ลำแสงผ่านถึงตัวรับ';
  root.querySelector('#meal-count').textContent = String(state.portions);
  root.querySelector('#meal-arrivals').textContent = String(state.arrivals);
  root.querySelector('#meal-number').textContent = state.lastMealId ? `มื้อ #${state.lastMealId}` : 'ยังไม่เริ่มมื้อ';
  const signal = transient || flags[state.phase];
  if (announcement.textContent !== signal) announcement.textContent = signal;
  request.disabled = ['beeping', 'dispensing'].includes(state.phase);
  repeat.disabled = !state.lastMealId;

  const durations = { beeping: FEEDER_LIMITS.beepMs, dispensing: FEEDER_LIMITS.portionMs, watching: FEEDER_LIMITS.watchMs };
  const duration = durations[state.phase];
  simulated.hidden = !duration;
  if (duration) simulated.value = 1 - state.remainingMs / duration;

  const events = state.events.slice(-5).reverse();
  const key = JSON.stringify(events);
  if (previousLog !== key) {
    previousLog = key;
    log.replaceChildren(...events.map(event => {
      const row = document.createElement('li');
      const description = document.createElement('span');
      description.textContent = `มื้อ #${event.mealId} · ${event.message}`;
      row.append(description);
      if (event.delivery) {
        const delivery = document.createElement('strong');
        delivery.textContent = event.delivery === 'queued' ? 'รอเครือข่าย' : 'แจ้งเตือนจำลอง';
        row.append(delivery);
      }
      return row;
    }));
    if (!events.length) {
      const row = document.createElement('li');
      row.textContent = 'เหตุการณ์ของมื้อจะขึ้นที่นี่';
      log.append(row);
    }
  }
}

function tick(now) {
  frame = 0;
  if (previousTime !== undefined) {
    const phase = sim.getState().phase;
    sim.advance(now - previousTime);
    if (phase !== sim.getState().phase) transient = '';
  }
  previousTime = now;
  paint();
  if (sim.getState().remainingMs > 0) frame = requestAnimationFrame(tick);
  else previousTime = undefined;
}

function updateInputs() {
  transient = '';
  sim.setInputs({
    humidity: sensorError.checked ? null : Number(humidity.value),
    distanceCm: Number(distance.value),
    catAtBowl: presence.checked,
    online: online.checked,
  });
  humidity.disabled = sensorError.checked;
  paint();
}

for (const input of [humidity, distance, sensorError, presence, online]) input.addEventListener('input', updateInputs);

request.addEventListener('click', () => {
  transient = '';
  if (!sim.requestMeal()) return;
  paint();
  if (!frame && sim.getState().remainingMs > 0) frame = requestAnimationFrame(tick);
});

repeat.addEventListener('click', () => {
  const { lastMealId } = sim.getState();
  if (lastMealId && !sim.requestMeal(lastMealId)) {
    transient = `มื้อ #${lastMealId} เคยถูกตรวจแล้ว · รอคำขอมื้อใหม่`;
    paint();
  }
});

root.querySelector('#meal-reset').addEventListener('click', () => {
  cancelAnimationFrame(frame);
  frame = 0;
  previousTime = undefined;
  transient = '';
  sim.reset();
  const state = sim.getState();
  humidity.value = state.humidity;
  distance.value = state.distanceCm;
  sensorError.checked = false;
  presence.checked = state.catAtBowl;
  online.checked = state.online;
  updateInputs();
});

paint();
