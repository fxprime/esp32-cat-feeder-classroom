import { createFeeder } from "./model.js";

const root = document.getElementById("feeder-final");
const $ = selector => root.querySelector(selector);
const sim = createFeeder();
const humidity = $("#final-rh");
const distance = $("#final-distance");
const beam = $("#final-beam");
const network = $("#final-wifi");
const clock = $("#final-clock");
const mealButton = $("#final-meal");
const duplicate = $("#final-duplicate");
const phases = {
  idle: "รอคำสั่งให้อาหาร · ฝาปิด",
  beeping: "เตือนก่อนจ่าย · ฝายังปิด",
  dispensing: "กำลังจ่าย · ฝาเปิด 90°",
  watching: "ปิดฝาแล้ว · กำลังดูว่ามีตัวมาที่ชามไหม",
  blocked: "งดจ่าย · ฝาปิดและไฟแดงติด",
};
const cases = {
  normal: { humidity: 55, distanceCm: 10 },
  humid: { humidity: 78, distanceCm: 10 },
  empty: { humidity: 55, distanceCm: 24 },
  failure: { humidity: null, distanceCm: 10 },
};
let frame = 0;
let previous = 0;
let lastLog = "";
let testMessage = "";

function showText(element, text) {
  if (element.textContent !== text) element.textContent = text;
}

function render() {
  const state = sim.getState();
  root.dataset.phase = state.phase;
  root.dataset.open = String(state.servoAngle === 90);
  root.dataset.red = String(state.ledRed);
  root.dataset.beep = String(state.buzzer);
  root.dataset.cat = String(state.catAtBowl);
  const foodHeight = 76 * (state.foodPercent ?? 0) / 100;
  const foodFill = $("[data-final-food-fill]");
  foodFill.setAttribute("y", 130 - foodHeight);
  foodFill.setAttribute("height", foodHeight);

  showText($("#final-rh-value"), state.humidity === null ? "อ่านไม่ได้" : `${state.humidity}% RH`);
  showText($("#final-distance-value"), `${state.distanceCm} ซม.`);
  showText($("#final-stock"), state.foodPercent === null ? "อ่านไม่ได้" : `ประมาณ ${state.foodPercent}%`);
  showText($("#final-status"), phases[state.phase]);
  showText($("#final-count"), `${state.portions} รอบ · พบที่ชาม ${state.arrivals} ครั้ง`);
  showText(clock, state.remainingMs > 0 ? `เหลือ ${(state.remainingMs / 1000).toFixed(1)} วิ` : "");
  mealButton.disabled = state.phase === "beeping" || state.phase === "dispensing";
  duplicate.disabled = state.lastMealId === 0;

  const visibleEvents = state.events.slice(-6);
  const logKey = JSON.stringify(visibleEvents);
  if (lastLog !== logKey) {
    lastLog = logKey;
    $("#final-events").replaceChildren(...visibleEvents.map(event => {
      const line = document.createElement("li");
      const delivery = { simulated: " · Telegram จำลอง", queued: " · รอเครือข่าย" }[event.delivery] ?? "";
      line.textContent = `มื้อ ${event.mealId} · ${event.message}${delivery}`;
      return line;
    }));
  }
  showText($("#final-note"), testMessage);
}

function animate(now) {
  const elapsed = previous ? now - previous : 0;
  previous = now;
  sim.advance(elapsed);
  render();
  if (sim.getState().remainingMs > 0) frame = requestAnimationFrame(animate);
  else {
    frame = 0;
    previous = 0;
  }
}

function applyCase(key) {
  const inputs = cases[key];
  sim.setInputs(inputs);
  if (inputs.humidity !== null) humidity.value = inputs.humidity;
  distance.value = inputs.distanceCm;
  for (const button of root.querySelectorAll("[data-final-case]")) {
    button.setAttribute("aria-pressed", String(button.dataset.finalCase === key));
  }
  testMessage = "";
  render();
}

for (const button of root.querySelectorAll("[data-final-case]")) {
  button.addEventListener("click", () => applyCase(button.dataset.finalCase));
}
for (const [control, update] of [
  [humidity, () => ({ humidity: Number(humidity.value) })],
  [distance, () => ({ distanceCm: Number(distance.value) })],
  [beam, () => ({ catAtBowl: beam.checked })],
  [network, () => ({ online: network.checked })],
]) {
  control.addEventListener("input", () => {
    sim.setInputs(update());
    if (control === humidity || control === distance) {
      for (const button of root.querySelectorAll("[data-final-case]")) button.setAttribute("aria-pressed", "false");
    }
    render();
  });
}
mealButton.addEventListener("click", () => {
  testMessage = "";
  if (sim.requestMeal() && !frame && sim.getState().remainingMs > 0) frame = requestAnimationFrame(animate);
  render();
});
duplicate.addEventListener("click", () => {
  const { lastMealId } = sim.getState();
  if (!sim.requestMeal(lastMealId)) testMessage = `รับมื้อ ${lastMealId} ไปแล้ว · ข้ามคำสั่งซ้ำ`;
  render();
});
$("#final-reset").addEventListener("click", () => {
  cancelAnimationFrame(frame);
  frame = previous = 0;
  sim.reset();
  beam.checked = false;
  network.checked = true;
  applyCase("normal");
});

// Simulate the conditioned voltage from 10 impacts on a plate.
// A strike can ring above threshold more than once, especially at low thresholds.
const threshold = $("#piezo-threshold");
const quietTime = $("#piezo-quiet");
const shortChute = $("#piezo-overlap");
const scope = $("#piezo-scope");
const rawGrainTimes = Array.from({ length: 10 }, (_, index) => 80 + index * 180);
function piezoSamples() {
  const grains = shortChute.checked ? rawGrainTimes.map((time, i) => i % 2 ? time - 150 : time) : rawGrainTimes;
  return Array.from({ length: 501 }, (_, i) => {
    const time = i * 4;
    return [time, Math.min(3.3, grains.reduce((voltage, impact, n) => {
      const dt = time - impact;
      if (dt < 0 || dt > 115) return voltage;
      return voltage + (2.3 - (n % 3) * .27) * Math.exp(-dt / 30) * Math.max(0, Math.sin(dt * .28));
    }, .14 + .042 * Math.sin(time * .077)))];
  });
}

function renderPiezo() {
  const limit = Number(threshold.value);
  const deadMs = Number(quietTime.value);
  const samples = piezoSamples();
  const x = t => 22 + t / 2000 * 578;
  const y = v => 122 - v / 3.3 * 108;
  const events = [];
  let lastCount = -Infinity;
  samples.forEach(([t, voltage], index) => {
    const wasBelow = index === 0 || samples[index - 1][1] < limit;
    if (wasBelow && voltage >= limit && t - lastCount >= deadMs) {
      lastCount = t;
      events.push([t, voltage]);
    }
  });
  scope.querySelector("[data-samples]").setAttribute("points", samples.map(([t, v]) => `${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(" "));
  const points = scope.querySelector("[data-events]");
  points.replaceChildren(...events.map(([t, v]) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x(t));
    dot.setAttribute("cy", y(v));
    dot.setAttribute("r", "3.5");
    return dot;
  }));
  const guide = scope.querySelector("[data-threshold]");
  guide.setAttribute("y1", y(limit));
  guide.setAttribute("y2", y(limit));
  const caption = scope.querySelector("[data-threshold-label]");
  caption.setAttribute("y", Math.max(11, y(limit) - 5));
  caption.textContent = `${limit.toFixed(1)} V`;
  showText($("#piezo-threshold-value"), `${limit.toFixed(1)} V`);
  showText($("#piezo-quiet-value"), `${deadMs} ms`);
  showText($("#piezo-result"), `ตกจริง 10 เม็ด · ตัวนับอ่าน ${events.length} · ${events.length === 10 ? "นับตรงรอบนี้" : events.length > 10 ? "นับเกิน" : "นับขาด"}`);
}

for (const control of [threshold, quietTime, shortChute]) control.addEventListener("input", renderPiezo);
renderPiezo();
render();
