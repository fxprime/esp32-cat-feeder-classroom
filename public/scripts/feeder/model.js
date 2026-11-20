export const FEEDER_PINS = Object.freeze({
  led: 23, servo: 18, buzzer: 25, trigger: 26, echo: 27,
  humidity: 32, infrared: 33, meal: 19, piezo: 34,
});

export const FEEDER_LIMITS = Object.freeze({
  humidity: 70,
  fullCm: 6,
  emptyCm: 24,
  lowPercent: 20,
  emptyPercent: 5,
  beepMs: 600,
  portionMs: 1100,
  watchMs: 8000,
});

export const FEEDER_MESSAGES = Object.freeze({
  humid: "งดจ่ายมื้อนี้ เพราะในถังชื้นเกินเกณฑ์",
  empty: "งดจ่ายมื้อนี้ เพราะอาหารในถังหมด",
  sensor: "งดจ่ายมื้อนี้ เพราะอ่านเซนเซอร์ไม่ได้",
});

const initialInputs = { humidity: 55, distanceCm: 10, catAtBowl: false, online: true };

export function estimateFood(distanceCm) {
  if (!Number.isFinite(distanceCm) || distanceCm < 2 || distanceCm > 60) return null;
  const { fullCm, emptyCm } = FEEDER_LIMITS;
  return Math.round(Math.max(0, Math.min(100, 100 * (emptyCm - distanceCm) / (emptyCm - fullCm))));
}

export function checkFeederInput(humidity, distanceCm) {
  const foodPercent = estimateFood(distanceCm);
  if (!Number.isFinite(humidity) || humidity < 0 || humidity > 100 || foodPercent === null) return "sensor";
  if (humidity >= FEEDER_LIMITS.humidity) return "humid";
  if (foodPercent <= FEEDER_LIMITS.emptyPercent) return "empty";
  return null;
}

export function createFeeder() {
  let inputs, phase, reason, remainingMs, portions, arrivals, lastMealId, events;

  function reset() {
    inputs = { ...initialInputs };
    phase = "idle";
    reason = null;
    remainingMs = portions = arrivals = lastMealId = 0;
    events = [];
  }

  function publish(type, message, { alert = false, eventReason = null } = {}) {
    events.push({
      type, message, mealId: lastMealId, reason: eventReason,
      delivery: alert ? (inputs.online ? "simulated" : "queued") : null,
    });
    if (events.length > 40) events.shift();
  }

  function begin(nextPhase, duration = 0) {
    phase = nextPhase;
    remainingMs = duration;
  }

  function recordArrival() {
    if (phase !== "watching" || !inputs.catAtBowl) return;
    arrivals += 1;
    publish("arrival", "พบว่ามีตัวมาที่ชามแล้ว");
    begin("idle");
  }

  function setInputs(patch) {
    const wasOnline = inputs.online;
    for (const key of Object.keys(initialInputs)) {
      if (Object.hasOwn(patch, key)) inputs[key] = patch[key];
    }
    if (!wasOnline && inputs.online) {
      for (const event of events) {
        if (event.delivery === "queued") event.delivery = "simulated";
      }
    }
    recordArrival();
  }

  function blockMeal(issue) {
    reason = issue;
    begin("blocked");
    publish("blocked", FEEDER_MESSAGES[issue], { alert: true, eventReason: issue });
  }

  function requestMeal(mealId = lastMealId + 1) {
    if (!Number.isSafeInteger(mealId) || mealId <= lastMealId) return false;
    if (phase === "beeping" || phase === "dispensing") return false;
    lastMealId = mealId;
    reason = checkFeederInput(inputs.humidity, inputs.distanceCm);
    if (reason) blockMeal(reason);
    else {
      if (estimateFood(inputs.distanceCm) <= FEEDER_LIMITS.lowPercent) {
        publish("low-stock", "อาหารในถังใกล้หมด", { alert: true });
      }
      begin("beeping", FEEDER_LIMITS.beepMs);
    }
    return true;
  }

  function advance(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    let elapsed = ms;
    while (remainingMs > 0 && elapsed >= remainingMs) {
      elapsed -= remainingMs;
      if (phase === "beeping") {
        // Check again at the point where the flap could open.
        const issue = checkFeederInput(inputs.humidity, inputs.distanceCm);
        if (issue) blockMeal(issue);
        else begin("dispensing", FEEDER_LIMITS.portionMs);
      } else if (phase === "dispensing") {
        portions += 1;
        publish("dispensed", "ปิดฝาแล้ว · จ่าย 1 รอบ");
        begin("watching", FEEDER_LIMITS.watchMs);
        recordArrival();
      } else {
        publish("no-arrival", "ยังไม่พบว่ามีตัวมาที่ชามในรอบนี้");
        begin("idle");
      }
    }
    if (remainingMs > 0) remainingMs -= elapsed;
  }

  function getState() {
    return {
      ...inputs, phase, reason, remainingMs, portions, arrivals, lastMealId,
      servoAngle: phase === "dispensing" ? 90 : 0,
      buzzer: phase === "beeping",
      ledRed: phase === "blocked",
      foodPercent: estimateFood(inputs.distanceCm),
      events: events.map(event => ({ ...event })),
    };
  }

  reset();
  return { reset, setInputs, requestMeal, advance, getState };
}
