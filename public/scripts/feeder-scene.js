import { createFeeder, estimateFood, FEEDER_LIMITS } from './feeder/model.js';

const WIDTH = 600;
const FULL_Y = 188;
const EMPTY_Y = 313;
const INITIAL_FOOD = 78;
const DRY_RH = 55;
const REFILL_MS = 1250;
const CHECK_MS = 520;
const DAY_MINUTES = 24 * 60;
const MORNING_MEAL = 8 * 60;
const EVENING_MEAL = 18 * 60;
const CLOCK_CENTER = [79, 236];
const CLOCK_SNAP_MINUTES = 7;
const CHEW_MS = 470;
const BITE_POSE_MS = 170;
const FIRST_DROP_MS = 125;
const FALL_MS = 280;
const BOWL_SPOTS = [
  [349, 413], [329, 417], [311, 414], [338, 408], [319, 408], [294, 413],
  [359, 410], [341, 418], [301, 407], [320, 418], [330, 411], [303, 418],
  [281, 412], [289, 408], [347, 409], [318, 413], [355, 416], [297, 417],
];
const PELLET_COLORS = ['#a96137', '#ce8a46', '#b77039'];

const HOME = {
  cat: [77, 410],
  cloud: [105, 69],
  box: [520, 119],
  old: [305, 263],
};
const BOWL_X = 237;
const CLOUD_X = 320;
const SPOUT = [348, 114];
const BIN = [513, 397];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const surfaceY = food => EMPTY_Y - (EMPTY_Y - FULL_Y) * food / 100;
const distanceAt = food => FEEDER_LIMITS.emptyCm -
  (FEEDER_LIMITS.emptyCm - FEEDER_LIMITS.fullCm) * food / 100;
const clockAngle = minute => minute % (12 * 60) / 2;
const angleDelta = (from, to) => ((to - from + 540) % 360) - 180;

function formatTime(minute) {
  const time = minute % DAY_MINUTES;
  return [Math.floor(time / 60), time % 60].map(value => String(value).padStart(2, '0')).join(':');
}

function mountFeederScene(lab) {
  const scene = lab.querySelector('[data-scene]');
  const actors = Object.fromEntries([...scene.querySelectorAll('[data-actor]')]
    .map(node => [node.dataset.actor, node]));
  const positions = { ...HOME };
  const fields = Object.fromEntries([...lab.querySelectorAll('[data-value]')]
    .map(node => [node.dataset.value, node]));
  const mask = scene.querySelector('[data-food-mask]');
  const levelArt = scene.querySelector('[data-level-art]');
  const distanceLine = scene.querySelector('[data-distance-line]');
  const artFood = scene.querySelector('[data-art-food]');
  const artHumidity = scene.querySelector('[data-art-humidity]');
  const artCommand = scene.querySelector('[data-art-command]');
  const bowlArt = scene.querySelector('[data-bowl-art]');
  const bowlLabel = scene.querySelector('[data-bowl-label]');
  const bowlCount = lab.querySelector('[data-bowl-count]');
  const stream = [...scene.querySelectorAll('[data-pellet-stream] ellipse')];
  const dropInterval = (FEEDER_LIMITS.portionMs - FIRST_DROP_MS - FALL_MS) / stream.length;
  const bowlPellets = [];
  const rainArt = scene.querySelector('[data-rain-art]');
  const alert = scene.querySelector('[data-scene-alert]');
  const clockControl = scene.querySelector('[data-clock-control]');
  const clockHand = scene.querySelector('[data-clock-hand]');
  const clockMarker = scene.querySelector('[data-clock-marker]');
  const clockReadout = scene.querySelector('[data-clock-time]');
  const clockDue = scene.querySelector('[data-clock-due]');
  const taskTitle = lab.querySelector('[data-task-title]');
  const taskDetail = lab.querySelector('[data-task-detail]');
  const process = lab.querySelector('[data-process]');
  const output = lab.querySelector('[data-output]');
  const command = lab.querySelector('[data-command]');
  const servo = lab.querySelector('[data-servo-state]');
  const sim = createFeeder();

  let food = INITIAL_FOOD;
  let humidity = DRY_RH;
  let wetFood = false;
  let discarded = false;
  let recovered = false;
  let input = '';
  let drag = null;
  let clockDrag = null;
  let check = null;
  let refill = 0;
  let closing = 0;
  let hit = 0;
  let frame = 0;
  let lastTime = 0;
  let scale = 1;
  let portionStart = INITIAL_FOOD;
  let bowlPieces = 0;
  let drawnPieces = 0;
  let landedInPortion = 0;
  let chewRemaining = CHEW_MS;
  let bitePose = 0;
  let finishedEating = false;
  let clockTime = 7 * 60;
  let earliest = 6 * 60;
  let nextMeal = MORNING_MEAL;

  const atBowl = () => positions.cat[0] >= 220;
  const eating = () => atBowl() && bowlPieces > 0;
  const raining = () => positions.cloud[0] >= 270;
  const busy = state => state.phase === 'beeping' || state.phase === 'dispensing';
  const nearBin = ([x, y]) => Math.abs(x - BIN[0]) <= 68 && Math.abs(y - BIN[1]) <= 60;
  const nearSpout = ([x, y]) => Math.abs(x - SPOUT[0]) <= 87 && y >= 63 && y <= 201;
  const clockAvailable = () => !check && !refill && !closing && !busy(sim.getState());
  const dueLabel = () => `${formatTime(nextMeal)} น.${Math.floor(nextMeal / DAY_MINUTES) > Math.floor(clockTime / DAY_MINUTES) ? ' พรุ่งนี้' : ''}`;
  const nearMeal = () => nextMeal - clockTime <= CLOCK_SNAP_MINUTES;

  function stage() {
    if (refill > 0) return 'refilling';
    if (wetFood) {
      if (raining()) return 'rain-off';
      return discarded ? 'refill' : 'discard';
    }
    return raining() ? 'raining' : 'ready';
  }

  function available(name) {
    if (name === 'level') return stage() === 'ready' && !busy(sim.getState()) && !check;
    if (name === 'old') return stage() === 'discard' && clockAvailable();
    if (name === 'box') return stage() === 'refill' && clockAvailable();
    if (name === 'cloud') return refill === 0;
    return true;
  }

  function text(node, value) {
    if (node.textContent !== value) node.textContent = value;
  }

  function attr(node, key, value) {
    const string = String(value);
    if (node.getAttribute(key) !== string) node.setAttribute(key, string);
  }

  function data(key, value) {
    const string = String(value);
    if (lab.dataset[key] !== string) lab.dataset[key] = string;
  }

  function applyInputs() {
    sim.setInputs({
      distanceCm: distanceAt(food),
      humidity: wetFood ? Math.max(humidity, FEEDER_LIMITS.humidity) : humidity,
      catAtBowl: atBowl(),
    });
  }

  function moveActor(name, x, y, settle = false) {
    const actor = actors[name];
    actor.toggleAttribute('data-settling', settle);
    positions[name] = [x, y];
    actor.style.translate = `${x * scale}px ${y * scale}px`;
  }

  function sizeScene() {
    scale = scene.getBoundingClientRect().width / WIDTH;
    for (const [name, [x, y]] of Object.entries(positions)) {
      moveActor(name, x, y);
    }
  }

  function setClock(minute) {
    clockTime = Math.round(clamp(minute, earliest, nextMeal));
    input = 'clock';
    recovered = false;
  }

  function releaseClock() {
    if (!clockAvailable() || !nearMeal()) return;
    const slot = nextMeal;
    clockTime = earliest = slot;
    nextMeal += slot % DAY_MINUTES === MORNING_MEAL
      ? EVENING_MEAL - MORNING_MEAL
      : DAY_MINUTES - EVENING_MEAL + MORNING_MEAL;
    check = { slot, remaining: CHECK_MS };
  }

  function placeCat(x, settle) {
    const wasAtBowl = atBowl();
    moveActor('cat', clamp(x, HOME.cat[0], BOWL_X), HOME.cat[1], settle);
    if (wasAtBowl !== atBowl()) {
      hit = 700;
      input = 'cat';
      if (!atBowl()) {
        bitePose = 0;
        finishedEating = false;
      }
      applyInputs();
    }
  }

  function placeCloud(x, settle) {
    moveActor('cloud', clamp(x, HOME.cloud[0], CLOUD_X), HOME.cloud[1], settle);
    input = 'cloud';
    recovered = false;
  }

  function adjustFood(amount) {
    input = 'level';
    food = clamp(amount, 0, 100);
    recovered = false;
    applyInputs();
  }

  function discardFood() {
    discarded = true;
    food = 0;
    applyInputs();
    if (document.activeElement === actors.old) actors.box.focus();
  }

  function startRefill() {
    refill = REFILL_MS;
    input = 'level';
    moveActor('box', ...SPOUT, true);
    actors.box.classList.add('fs-pouring');
  }

  function updateRefill(elapsed) {
    refill = Math.max(0, refill - elapsed);
    const progress = 1 - refill / REFILL_MS;
    food = INITIAL_FOOD * Math.min(1, progress * 1.12);
    if (refill === 0) {
      wetFood = false;
      discarded = false;
      recovered = true;
      humidity = DRY_RH;
      check = null;
      sim.reset();
      actors.box.classList.remove('fs-pouring');
      moveActor('box', ...HOME.box, true);
    }
  }

  function serveIntoBowl(pourElapsed) {
    const completed = Math.floor((pourElapsed - FIRST_DROP_MS - FALL_MS) / dropInterval) + 1;
    const landed = clamp(completed, 0, stream.length);
    if (landed <= landedInPortion) return;
    if (bowlPieces === 0) chewRemaining = CHEW_MS;
    bowlPieces += landed - landedInPortion;
    landedInPortion = landed;
    finishedEating = false;
  }

  function chew(elapsed) {
    bitePose = Math.max(0, bitePose - elapsed);
    if (!eating()) return;
    chewRemaining -= elapsed;
    if (chewRemaining > 0) return;
    bowlPieces -= 1;
    chewRemaining = CHEW_MS;
    bitePose = BITE_POSE_MS;
    finishedEating = bowlPieces === 0;
  }

  function drawBowl() {
    if (drawnPieces === bowlPieces) return;
    while (bowlPellets.length < bowlPieces) {
      const i = bowlPellets.length;
      const [cx, cy] = BOWL_SPOTS[i % BOWL_SPOTS.length];
      const layer = Math.floor(i / BOWL_SPOTS.length);
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      attr(node, 'cx', cx + (layer % 5) - (layer % 2));
      attr(node, 'cy', cy - layer % 4);
      attr(node, 'rx', 6.2 + (i % 3) * .35);
      attr(node, 'ry', 3.4 + (i % 2) * .4);
      attr(node, 'fill', PELLET_COLORS[i % PELLET_COLORS.length]);
      attr(node, 'stroke', '#92552e');
      attr(node, 'stroke-width', '.6');
      bowlArt.appendChild(node);
      bowlPellets.push(node);
    }
    const first = Math.min(drawnPieces, bowlPieces);
    const last = Math.max(drawnPieces, bowlPieces);
    for (let i = first; i < last; i++) bowlPellets[i].toggleAttribute('data-present', i < bowlPieces);
    drawnPieces = bowlPieces;
    text(bowlCount, String(bowlPieces));
    text(bowlLabel, bowlPieces ? `${bowlPieces} เม็ด` : 'ชามว่าง');
  }

  function drawFallingFood(state) {
    const pourElapsed = FEEDER_LIMITS.portionMs - state.remainingMs;
    for (const [i, node] of stream.entries()) {
      const progress = (pourElapsed - FIRST_DROP_MS - i * dropInterval) / FALL_MS;
      const falling = state.phase === 'dispensing' && progress >= 0 && progress < 1;
      node.toggleAttribute('data-airborne', falling);
      if (falling) node.style.setProperty('--fs-fall-offset', `${62 * progress ** 1.65}px`);
    }
  }

  function getCopy(state, current) {
    const latest = state.events.at(-1);
    if (current === 'refilling') return ['กำลังเติมอาหารใหม่', 'ดูผิวอาหารสูงขึ้น ระยะที่วัดได้จะสั้นลง'];
    if (check) return [`ถึงมื้อ ${formatTime(check.slot)} น.`, 'หยุดรอดู ESP32 อ่านระดับอาหารกับความชื้นก่อนสั่ง Servo'];
    if (current === 'discard') return ['เอาอาหารชื้นออกจากถัง', 'จับกองอาหารชื้นในถังแล้วลากไปลงถังทิ้งทางขวา'];
    if (current === 'refill') return ['เติมอาหารใหม่', 'ลากกล่องอาหารใหม่ไปวางที่ปากถัง เพื่อให้เครื่องพร้อมมื้อถัดไป'];
    if (current === 'rain-off') return ['แจ้งเตือนแล้ว · เลื่อนเมฆออกก่อน', 'ลากเมฆกลับไปทางซ้าย อาหารในถังยังชื้นอยู่'];
    if (state.phase === 'beeping') return ['ส่งเสียงเตือนก่อนจ่าย', 'จากนั้นดูคำสั่ง Servo และฝาในภาพ'];
    if (state.phase === 'dispensing') return ['เปิดฝาให้เม็ดอาหารตก', 'สังเกตว่าอาหารในถังลดลงก่อนฝาหมุนกลับมาปิด'];
    if (closing) return ['ครบหนึ่งรอบ · ฝาหมุนกลับมาปิด', 'ลากแมวมาที่ชาม แล้วดูว่า IR อ่านค่าอะไรตอนแมวมากิน'];
    if (current === 'raining') return ['ความชื้นกำลังสะสมในถัง', `เมื่อถึง ${FEEDER_LIMITS.humidity}% RH เครื่องจะแจ้งเตือนและงดจ่ายจนกว่าจะเปลี่ยนอาหาร`];
    if (clockDrag || input === 'clock' && nearMeal()) return [nearMeal() ? 'ปล่อยเข็มแล้วรอดูเครื่องทำงาน' : `หมุนเข็มไปที่มื้อ ${dueLabel()}`,
      'ขีดสีส้มบอกเวลาให้อาหาร'];
    if (recovered) return ['ถังพร้อมสำหรับมื้อใหม่', `เติมอาหารใหม่แล้ว ไฟแดงดับ ลองหมุนเข็มไปรอที่มื้อ ${dueLabel()}`];
    if (drag?.name === 'level') return ['ปรับระดับอาหารในถัง', 'ดูเม็ดอาหารขยับตามเส้น ยิ่งอาหารสูง ระยะที่วัดได้ยิ่งสั้น'];
    if (eating()) return ['แมวกำลังกิน', 'IR อ่าน LOW และเม็ดอาหารในชามค่อย ๆ ลดลง'];
    if (finishedEating) return ['กินหมดชามแล้ว', `ฝาปิดอยู่ เครื่องรอมื้อ ${dueLabel()}`];
    if (state.reason === 'empty') return ['มื้อก่อนงดจ่ายเพราะอาหารหมด', `เพิ่มระดับอาหารก่อน แล้วหมุนเข็มไปที่มื้อ ${dueLabel()}`];
    if (latest?.type === 'arrival') return ['IR บันทึกว่ามีตัวมาที่ชามแล้ว', 'ลองลากแมวถอยออกเพื่อดูลำแสงกลับมา หรือลากเมฆเพื่อทดสอบถังชื้น'];
    if (atBowl()) return ['แมวบังลำแสง · IR อ่าน LOW', `เครื่องใช้เวลานัดจ่ายอาหาร มื้อถัดไป ${dueLabel()}`];
    if (bowlPieces > 0) return ['มีอาหารอยู่ในชาม', 'ลากแมวมาที่ชามเพื่อให้กินทีละเม็ด'];
    if (latest?.type === 'no-arrival') return ['รอบเฝ้าดูชามจบแล้ว', `หมุนเข็มไปที่มื้อ ${dueLabel()} แล้วลองลากแมวมาที่ชามหลังฝาปิด`];
    return [`มื้อถัดไป ${dueLabel()}`, 'หมุนเข็มไปที่ขีดสีส้มแล้วปล่อย เส้นสีฟ้าใช้ลองปรับระดับอาหาร'];
  }

  function render() {
    const state = sim.getState();
    const current = stage();
    const removing = drag?.name === 'old' && drag.moved;
    const shownFood = removing ? food * (1 - clamp((positions.old[0] - HOME.old[0]) / 178, 0, 1)) : food;
    const shownDistance = distanceAt(shownFood);
    const shownPercent = estimateFood(shownDistance);
    const y = surfaceY(shownFood);
    const rh = Math.floor(humidity);
    const angle = state.servoAngle;
    const servoMode = angle ? 'open' : closing ? 'closing' : 'closed';
    const fault = wetFood || state.ledRed;

    data('stage', current);
    data('phase', state.phase);
    data('raining', raining());
    data('catAtBowl', state.catAtBowl);
    data('wet', wetFood);
    data('discarded', discarded);
    data('fault', fault);
    data('clockDue', Boolean(check) || nearMeal());
    data('biting', bitePose > 0);
    data('servo', servoMode);
    data('input', input);
    data('hit', hit > 0);
    data('flow', check ? (check.remaining > CHECK_MS / 2 ? 'input' : 'process') :
      fault || busy(state) || closing || state.phase === 'watching' ? 'output' : input ? 'input' : '');

    scene.style.setProperty('--fs-mist', String(clamp((humidity - DRY_RH) / 25, wetFood && !discarded ? .39 : 0, .92)));
    attr(mask, 'y', y);
    attr(mask, 'height', shownFood > 0 ? 332 - y : 0);
    attr(levelArt, 'transform', `translate(0 ${y})`);
    attr(distanceLine, 'd', `M321 182V${y - 3}`);
    attr(rainArt, 'transform', `translate(${(positions.cloud[0] - CLOUD_X) * .7} 0)`);
    drawBowl();
    drawFallingFood(state);
    alert.hidden = !wetFood;
    actors.old.hidden = current !== 'discard';
    attr(actors.cat, 'aria-pressed', state.catAtBowl);
    attr(actors.cloud, 'aria-pressed', raining());
    attr(actors.cloud, 'aria-disabled', !available('cloud'));
    attr(actors.box, 'aria-disabled', !available('box'));
    attr(actors.old, 'aria-disabled', !available('old'));
    attr(actors.level, 'aria-disabled', !available('level') && drag?.name !== 'level');
    attr(actors.level, 'aria-valuenow', shownPercent);
    attr(clockControl, 'aria-disabled', !clockAvailable());
    attr(clockControl, 'aria-valuemin', earliest);
    attr(clockControl, 'aria-valuemax', nextMeal);
    attr(clockControl, 'aria-valuenow', clockTime);
    attr(clockControl, 'aria-valuetext', `${formatTime(clockTime)} น. มื้อถัดไป ${dueLabel()}`);
    attr(clockHand, 'transform', `rotate(${clockAngle(clockTime)} ${CLOCK_CENTER.join(' ')})`);
    attr(clockMarker, 'transform', `rotate(${clockAngle(nextMeal)} ${CLOCK_CENTER.join(' ')})`);
    text(clockReadout, formatTime(clockTime));
    text(clockDue, `มื้อ ${formatTime(nextMeal)}`);
    text(fields.clock, `${formatTime(clockTime)} น.`);
    const distance = shownDistance.toFixed(1);
    attr(actors.level, 'aria-valuetext', `${shownPercent} เปอร์เซ็นต์ ระยะ ${distance} เซนติเมตร`);

    text(fields.ir, state.catAtBowl ? 'LOW · ถูกบัง' : 'HIGH');
    text(fields.food, `${shownPercent}%`);
    text(fields.distance, `${distance} ซม.`);
    text(fields.humidity, `${rh}% RH`);
    text(artFood, `${distance} ซม. · ${shownPercent}%`);
    text(artHumidity, `${rh}% RH`);
    text(servo, angle ? 'ฝาเปิด · 90°' : closing ? 'กำลังปิดฝา · 0°' : 'ฝาปิด · 0°');
    const statement = `servo.write(${angle});`;
    text(command, statement);
    text(artCommand, statement);
    text(process, check ? `ถึงมื้อแล้ว · อ่าน ${rh}% RH และอาหาร ${state.foodPercent}%` :
      wetFood ? `พบความชื้นถึงเกณฑ์ ${FEEDER_LIMITS.humidity}% RH · รอเปลี่ยนอาหาร` :
      state.reason === 'empty' ? `มื้อก่อนพบอาหารเหลือไม่เกิน ${FEEDER_LIMITS.emptyPercent}%` :
      busy(state) ? 'ความชื้นกับระดับอาหารผ่าน · จ่ายได้หนึ่งรอบ' :
      atBowl() ? 'IR อ่าน LOW เมื่อมีตัวมาที่ชาม' : `รอมื้อ ${dueLabel()} แล้วตรวจความชื้นกับระดับอาหาร`);
    text(output, angle ? 'Servo หมุนเพื่อเปิดทางให้อาหารตก' :
      closing ? 'Servo หมุนกลับเพื่อหยุดจ่าย' :
      wetFood ? 'ไฟแดงติด · แจ้งเจ้าของผ่าน Telegram (จำลอง)' :
      state.ledRed ? 'ไฟแดงติด · แจ้งว่าอาหารหมด' :
      state.buzzer ? 'Buzzer เตือนก่อนเปิดฝา' :
      state.phase === 'watching' ? 'จ่ายแล้ว · IR เฝ้าดูที่ชาม' :
      state.portions ? 'จ่ายรอบล่าสุดเสร็จแล้ว' : 'รอคำสั่งจ่ายอาหาร');
    const [heading, instruction] = getCopy(state, current);
    text(taskTitle, heading);
    text(taskDetail, instruction);
  }

  function step(elapsed) {
    const before = sim.getState();
    closing = Math.max(0, closing - elapsed);
    hit = Math.max(0, hit - elapsed);
    chew(elapsed);

    if (refill > 0) {
      updateRefill(elapsed);
    } else if (raining()) {
      humidity = Math.min(87, humidity + elapsed * .0085);
      if (humidity >= FEEDER_LIMITS.humidity) wetFood = true;
    } else {
      const floor = wetFood && !discarded ? 61 : DRY_RH;
      humidity = Math.max(floor, humidity - elapsed * .009);
    }

    applyInputs();
    // Draw each phase once, even if the browser delays the next frame.
    sim.advance(Math.min(elapsed, before.remainingMs || elapsed));
    const after = sim.getState();
    if (after.phase === 'dispensing') {
      if (before.phase !== 'dispensing') {
        portionStart = food;
        landedInPortion = 0;
      }
      const pourElapsed = FEEDER_LIMITS.portionMs - after.remainingMs;
      const poured = pourElapsed / FEEDER_LIMITS.portionMs;
      food = Math.max(0, portionStart - 11 * poured);
      serveIntoBowl(pourElapsed);
    } else if (before.phase === 'dispensing') {
      food = Math.max(0, portionStart - 11);
      serveIntoBowl(FEEDER_LIMITS.portionMs);
      closing = 520;
    }
    applyInputs();

    if (check) {
      check.remaining = Math.max(0, check.remaining - elapsed);
      if (!check.remaining && !busy(after)) {
        sim.requestMeal(check.slot);
        check = null;
      }
    }
  }

  function needsFrame() {
    const state = sim.getState();
    const changingHumidity = raining() ? humidity < 87 :
      humidity > (wetFood && !discarded ? 61 : DRY_RH);
    return changingHumidity || check || refill || closing || hit || bitePose || eating() || busy(state) || state.phase === 'watching';
  }

  function animate(now) {
    const elapsed = clamp(now - lastTime, 0, 500);
    lastTime = now;
    step(elapsed);
    render();
    frame = needsFrame() ? requestAnimationFrame(animate) : 0;
  }

  function refresh() {
    render();
    if (!frame && needsFrame()) {
      lastTime = performance.now();
      frame = requestAnimationFrame(animate);
    }
  }

  function perform(name) {
    if (!available(name)) return;
    if (name === 'cat') placeCat(atBowl() ? HOME.cat[0] : BOWL_X, true);
    if (name === 'cloud') placeCloud(raining() ? HOME.cloud[0] : CLOUD_X, true);
    if (name === 'box') startRefill();
    if (name === 'old') discardFood();
    refresh();
  }

  function setLevelAt(y) {
    const percent = Math.round(100 * (EMPTY_Y - y) / (EMPTY_Y - FULL_Y));
    adjustFood(percent);
  }

  function pointerAngle(event, bounds) {
    const scale = WIDTH / bounds.width;
    const x = (event.clientX - bounds.left) * scale - CLOCK_CENTER[0];
    const y = (event.clientY - bounds.top) * scale - CLOCK_CENTER[1];
    return Math.hypot(x, y) >= 8 ? Math.atan2(y, x) * 180 / Math.PI + 90 : null;
  }

  clockControl.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag || clockDrag || !clockAvailable()) return;
    const bounds = scene.getBoundingClientRect();
    clockDrag = {
      id: event.pointerId, x: event.clientX, y: event.clientY, bounds,
      angle: pointerAngle(event, bounds), start: clockTime, minute: clockTime, moved: false,
    };
    clockControl.setPointerCapture(event.pointerId);
    clockControl.focus({ preventScroll: true });
  });

  function moveClock(event) {
    if (!clockDrag || clockDrag.id !== event.pointerId) return;
    const angle = pointerAngle(event, clockDrag.bounds);
    if (angle === null) return;
    if (!clockDrag.moved && Math.hypot(event.clientX - clockDrag.x, event.clientY - clockDrag.y) < 4) return;
    clockDrag.moved = true;
    clockControl.toggleAttribute('data-dragging', true);
    if (clockDrag.angle !== null) {
      clockDrag.minute = clamp(clockDrag.minute + angleDelta(clockDrag.angle, angle) * 2, earliest, nextMeal);
      setClock(clockDrag.minute);
    }
    clockDrag.angle = angle;
    refresh();
  }

  function finishClock(event, cancelled) {
    if (!clockDrag || clockDrag.id !== event.pointerId) return;
    if (!cancelled) moveClock(event);
    const { moved, start, angle } = clockDrag;
    clockDrag = null;
    clockControl.removeAttribute('data-dragging');
    if (cancelled) {
      setClock(start);
    } else {
      if (!moved && angle !== null) {
        const onMealMark = Math.abs(angleDelta(angle, clockAngle(nextMeal))) <= 11;
        setClock(onMealMark ? nextMeal : clockTime + angleDelta(clockAngle(clockTime), angle) * 2);
      }
      releaseClock();
    }
    refresh();
  }

  clockControl.addEventListener('pointermove', moveClock);
  clockControl.addEventListener('pointerup', event => finishClock(event, false));
  clockControl.addEventListener('pointercancel', event => finishClock(event, true));
  clockControl.addEventListener('lostpointercapture', event => finishClock(event, true));

  const clockKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '];
  function clockKey(event) {
    if (event.altKey || event.metaKey || event.ctrlKey || !clockKeys.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (!clockAvailable() || clockDrag || drag) return;
    if (event.type === 'keyup') releaseClock();
    else if (event.key !== 'Enter' && event.key !== ' ') {
      const delta = ['ArrowUp', 'ArrowRight'].includes(event.key) ? 15 : -15;
      setClock(event.key === 'Home' ? earliest : event.key === 'End' ? nextMeal : clockTime + delta);
    }
    refresh();
  }
  clockControl.addEventListener('keydown', clockKey);
  clockControl.addEventListener('keyup', clockKey);

  for (const [name, actor] of Object.entries(actors)) {
    let suppressClick = false;

    actor.addEventListener('pointerdown', event => {
      if (event.button !== 0 || drag || clockDrag || !available(name)) return;
      suppressClick = false;
      const rect = scene.getBoundingClientRect();
      const sceneScale = WIDTH / rect.width;
      const grip = actor.getBoundingClientRect();
      const x = (grip.left + grip.width / 2 - rect.left) * sceneScale;
      const y = name === 'level' ? surfaceY(food) : (grip.top + grip.height / 2 - rect.top) * sceneScale;
      const sceneY = (event.clientY - rect.top) * sceneScale;
      const tapLevel = name === 'level' && Math.abs(sceneY - y) > 18;
      drag = {
        name, id: event.pointerId, scale: sceneScale, x, y: tapLevel ? sceneY : y,
        startX: event.clientX, startY: event.clientY, moved: false,
        previousFood: food,
      };
      actor.setPointerCapture(event.pointerId);
      if (name === 'level') {
        actor.focus({ preventScroll: true });
        setLevelAt(drag.y);
        refresh();
      } else {
        moveActor(name, x, y);
      }
    });

    function move(event) {
      if (!drag || drag.id !== event.pointerId || drag.name !== name) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      const x = drag.x + dx * drag.scale;
      const y = drag.y + dy * drag.scale;
      actor.toggleAttribute('data-dragging', true);
      if (name === 'cat') placeCat(x, false);
      if (name === 'cloud') placeCloud(x, false);
      if (name === 'level' && stage() === 'ready') setLevelAt(y);
      if (name === 'box' || name === 'old') moveActor(name, clamp(x, 50, 552), clamp(y, 55, 413));
      refresh();
    }

    function finish(event, cancelled) {
      if (!drag || drag.id !== event.pointerId || drag.name !== name) return;
      if (!cancelled) move(event);
      const { moved, previousFood } = drag;
      drag = null;
      actor.removeAttribute('data-dragging');
      suppressClick = moved || cancelled;
      if (name === 'level' && cancelled && stage() === 'ready') adjustFood(previousFood);
      if (name === 'old') {
        if (moved && !cancelled && available(name) && nearBin(positions.old)) discardFood();
        moveActor('old', ...HOME.old, true);
      }
      if (name === 'box' && moved) {
        if (!cancelled && available(name) && nearSpout(positions.box)) startRefill();
        else moveActor('box', ...HOME.box, true);
      }
      refresh();
    }

    actor.addEventListener('pointermove', move);
    actor.addEventListener('pointerup', event => finish(event, false));
    actor.addEventListener('pointercancel', event => finish(event, true));
    actor.addEventListener('lostpointercapture', event => finish(event, true));
    actor.addEventListener('click', event => {
      if (name !== 'level' && (!suppressClick || event.detail === 0)) perform(name);
      suppressClick = false;
    });

    actor.addEventListener('keydown', event => {
      if (event.altKey || event.metaKey || event.ctrlKey) return;
      const key = event.key;
      if (name === 'level' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
        event.preventDefault();
        event.stopPropagation();
        if (!available(name)) return;
        const delta = ['ArrowUp', 'ArrowRight'].includes(key) ? 5 : -5;
        adjustFood(key === 'Home' ? 0 : key === 'End' ? 100 : Math.round(food) + delta);
      } else if ((name === 'cat' || name === 'cloud') && ['ArrowLeft', 'ArrowRight'].includes(key)) {
        event.preventDefault();
        event.stopPropagation();
        if (!available(name)) return;
        const x = positions[name][0] + (key === 'ArrowRight' ? 42 : -42);
        if (name === 'cat') placeCat(x, true);
        else placeCloud(x, true);
      } else {
        return;
      }
      refresh();
    });
  }

  sizeScene();
  new ResizeObserver(sizeScene).observe(scene);
  scene.dataset.ready = 'true';
  applyInputs();
  refresh();
}

const lab = document.querySelector('[data-feeder-scene]');
if (lab) mountFeederScene(lab);
