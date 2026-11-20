import { createFeeder, estimateFood, FEEDER_LIMITS } from './feeder/model.js';

const WIDTH = 600;
const FULL_Y = 188;
const EMPTY_Y = 313;
const INITIAL_FOOD = 78;
const DRY_RH = 55;
const REFILL_MS = 1250;
const CHECK_MS = 520;

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
  const rainArt = scene.querySelector('[data-rain-art]');
  const alert = scene.querySelector('[data-scene-alert]');
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
  let check = null;
  let refill = 0;
  let closing = 0;
  let hit = 0;
  let frame = 0;
  let lastTime = 0;
  let scale = 1;
  let portionStart = INITIAL_FOOD;
  let keyboardCheck = null;

  const atBowl = () => positions.cat[0] >= 220;
  const raining = () => positions.cloud[0] >= 270;
  const busy = state => state.phase === 'beeping' || state.phase === 'dispensing';
  const nearBin = ([x, y]) => Math.abs(x - BIN[0]) <= 68 && Math.abs(y - BIN[1]) <= 60;
  const nearSpout = ([x, y]) => Math.abs(x - SPOUT[0]) <= 87 && y >= 63 && y <= 201;

  function stage() {
    if (refill > 0) return 'refilling';
    if (wetFood) {
      if (check?.reason === 'humid') return 'checking-humidity';
      if (raining()) return 'rain-off';
      return discarded ? 'refill' : 'discard';
    }
    return raining() ? 'raining' : 'ready';
  }

  function available(name) {
    if (name === 'level') return stage() === 'ready' && !busy(sim.getState()) && !check;
    if (name === 'old') return stage() === 'discard';
    if (name === 'box') return stage() === 'refill';
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
    sim.setInputs({ distanceCm: distanceAt(food), humidity, catAtBowl: atBowl() });
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

  function scheduleCheck(reason) {
    check = { reason, remaining: CHECK_MS };
  }

  function placeCat(x, settle) {
    const wasAtBowl = atBowl();
    moveActor('cat', clamp(x, HOME.cat[0], BOWL_X), HOME.cat[1], settle);
    if (wasAtBowl !== atBowl()) {
      hit = 700;
      input = 'cat';
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

  function getCopy(state, current) {
    const latest = state.events.at(-1);
    if (current === 'refilling') return ['กำลังเติมอาหารใหม่', 'ดูผิวอาหารสูงขึ้น ระยะที่วัดได้จะสั้นลง'];
    if (current === 'discard') return ['เอาอาหารชื้นออกจากถัง', 'จับกองอาหารชื้นในถังแล้วลากไปลงถังทิ้งทางขวา'];
    if (current === 'refill') return ['เติมอาหารใหม่', 'ลากกล่องอาหารใหม่ไปวางที่ปากถัง แล้วเครื่องจะเริ่มรอบใหม่'];
    if (current === 'checking-humidity') return ['พบว่าถังชื้นถึงเกณฑ์', 'ESP32 กำลังตรวจถังและเตรียมแจ้งเตือน'];
    if (current === 'rain-off') return ['แจ้งเตือนแล้ว · เลื่อนเมฆออกก่อน', 'ลากเมฆกลับไปทางซ้าย อาหารในถังยังชื้นอยู่'];
    if (current === 'raining') return ['ความชื้นกำลังสะสมในถัง', `ดูละอองน้ำและค่า RH ที่ขึ้นเรื่อย ๆ พอถึง ${FEEDER_LIMITS.humidity}% เครื่องจะงดจ่าย`];
    if (recovered) return ['ถังพร้อมสำหรับมื้อใหม่', 'เติมอาหารใหม่แล้ว ไฟแดงดับ ลองลากเส้นระดับเพื่อเริ่มอีกมื้อ'];
    if (drag?.name === 'level') return ['ปรับระดับอาหารในถัง', 'ดูเม็ดอาหารขยับตามเส้น ยิ่งอาหารสูง ระยะที่วัดได้ยิ่งสั้น'];
    if (check) return ['จำลองถึงมื้อแล้ว', 'ตามสัญญาณจากค่าที่อ่านได้ไปที่ ESP32'];
    if (state.phase === 'beeping') return ['ส่งเสียงเตือนก่อนจ่าย', 'จากนั้นดูคำสั่ง Servo และฝาในภาพ'];
    if (state.phase === 'dispensing') return ['เปิดฝาให้เม็ดอาหารตก', 'สังเกตว่าอาหารในถังลดลงก่อนฝาหมุนกลับมาปิด'];
    if (state.reason === 'empty') return ['อาหารหมด · ฝายังปิด', 'ลากเส้นระดับอาหารให้สูงขึ้นแล้วปล่อยเพื่อลองมื้อใหม่'];
    if (latest?.type === 'arrival') return ['IR บันทึกว่ามีตัวมาที่ชามแล้ว', 'ลองลากแมวถอยออกเพื่อดูลำแสงกลับมา หรือลากเมฆเพื่อทดสอบถังชื้น'];
    if (atBowl()) return ['แมวบังลำแสง · IR อ่าน LOW', 'เมื่อถึงมื้อจึงจ่ายอาหาร ลากเส้นระดับเพื่อจำลองถึงมื้อ'];
    if (latest?.type === 'no-arrival') return ['รอบเฝ้าดูชามจบแล้ว', 'ลองเริ่มมื้อใหม่แล้วลากแมวมาที่ชามหลังฝาปิด'];
    if (state.portions) return ['จ่ายอาหารหนึ่งรอบแล้ว', 'ลองลากแมวเข้าไปที่ชามเพื่อบังลำแสง IR'];
    return ['ลองให้อาหารหนึ่งมื้อ', 'ลากเส้นสีฟ้าบนถังให้มีอาหาร แล้วปล่อยเส้นเพื่อจำลองถึงมื้อ'];
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

    data('stage', current);
    data('phase', state.phase);
    data('raining', raining());
    data('catAtBowl', state.catAtBowl);
    data('wet', wetFood);
    data('discarded', discarded);
    data('fault', state.ledRed);
    data('served', state.portions > 0 || (angle > 0 && FEEDER_LIMITS.portionMs - state.remainingMs > 600));
    data('servo', servoMode);
    data('input', input);
    data('hit', hit > 0);
    data('flow', check ? (check.remaining > CHECK_MS / 2 ? 'input' : 'process') :
      state.ledRed || busy(state) || closing || state.portions > 0 ? 'output' : input ? 'input' : '');

    scene.style.setProperty('--fs-mist', String(clamp((humidity - DRY_RH) / 25, wetFood && !discarded ? .39 : 0, .92)));
    attr(mask, 'y', y);
    attr(mask, 'height', shownFood > 0 ? 332 - y : 0);
    attr(levelArt, 'transform', `translate(0 ${y})`);
    attr(distanceLine, 'd', `M321 182V${y - 3}`);
    attr(rainArt, 'transform', `translate(${(positions.cloud[0] - CLOUD_X) * .7} 0)`);
    alert.hidden = !state.ledRed || state.reason !== 'humid';
    actors.old.hidden = current !== 'discard';
    attr(actors.cat, 'aria-pressed', state.catAtBowl);
    attr(actors.cloud, 'aria-pressed', raining());
    attr(actors.cloud, 'aria-disabled', !available('cloud'));
    attr(actors.box, 'aria-disabled', current !== 'refill');
    attr(actors.level, 'aria-disabled', !available('level') && drag?.name !== 'level');
    attr(actors.level, 'aria-valuenow', shownPercent);
    const distance = shownDistance.toFixed(1);
    attr(actors.level, 'aria-valuetext', `${shownPercent} เปอร์เซ็นต์ ระยะ ${distance} เซนติเมตร`);

    text(fields.ir, state.catAtBowl ? 'LOW · ถูกบัง' : 'HIGH');
    text(fields.food, `${shownPercent}%`);
    text(fields.distance, `${distance} ซม.`);
    text(fields.humidity, `${rh}% RH`);
    text(artFood, `${distance} ซม. · ${shownPercent}%`);
    text(artHumidity, `${rh}% RH`);
    text(servo, angle ? 'ฝาเปิด · 90°' : closing ? 'กำลังปิดฝา · 0°' : 'ฝาปิด · 0°');
    text(command, `servo.write(${angle});`);
    text(process, check ? `อ่าน ${rh}% RH และอาหาร ${state.foodPercent}% แล้วเทียบเกณฑ์` :
      wetFood ? `พบความชื้นถึงเกณฑ์ ${FEEDER_LIMITS.humidity}% RH · รอเปลี่ยนอาหาร` :
      state.reason === 'empty' ? `อาหารเหลือถึงเกณฑ์ถังหมด ${FEEDER_LIMITS.emptyPercent}%` :
      busy(state) ? 'ความชื้นกับระดับอาหารผ่าน · จ่ายได้หนึ่งรอบ' :
      atBowl() ? 'IR อ่าน LOW เมื่อมีตัวมาที่ชาม' : 'เช็กความชื้นกับระดับอาหารก่อนจ่าย');
    text(output, state.ledRed ? (wetFood ? 'ไฟแดงติด · แจ้งเจ้าของผ่าน Telegram (จำลอง)' : 'ไฟแดงติด · แจ้งว่าอาหารหมด') :
      state.buzzer ? 'Buzzer เตือนก่อนเปิดฝา' :
      angle ? 'Servo หมุนเพื่อเปิดทางให้อาหารตก' :
      closing ? 'Servo หมุนกลับเพื่อหยุดจ่าย' :
      state.portions ? 'จ่ายหนึ่งรอบ · IR เฝ้าดูที่ชาม' : 'รอคำสั่งจ่ายอาหาร');
    const [heading, instruction] = getCopy(state, current);
    text(taskTitle, heading);
    text(taskDetail, instruction);
  }

  function step(elapsed) {
    const before = sim.getState();
    closing = Math.max(0, closing - elapsed);
    hit = Math.max(0, hit - elapsed);

    if (refill > 0) {
      updateRefill(elapsed);
    } else if (raining()) {
      humidity = Math.min(87, humidity + elapsed * .0085);
      if (humidity >= FEEDER_LIMITS.humidity && !wetFood) {
        wetFood = true;
        scheduleCheck('humid');
      }
    } else {
      const floor = wetFood && !discarded ? 61 : DRY_RH;
      humidity = Math.max(floor, humidity - elapsed * .009);
    }

    applyInputs();
    // Draw each phase once, even if the browser delays the next frame.
    sim.advance(Math.min(elapsed, before.remainingMs || elapsed));
    const after = sim.getState();
    if (after.phase === 'dispensing') {
      if (before.phase !== 'dispensing') portionStart = food;
      const poured = 1 - after.remainingMs / FEEDER_LIMITS.portionMs;
      food = Math.max(0, portionStart - 11 * poured);
    } else if (before.phase === 'dispensing') {
      food = Math.max(0, portionStart - 11);
      closing = 520;
    }
    applyInputs();

    if (check) {
      check.remaining = Math.max(0, check.remaining - elapsed);
      if (!check.remaining && !busy(after)) {
        // Keep the demo's warning latched even when the cloud moves away mid-check.
        if (check.reason === 'humid') sim.setInputs({ humidity: Math.max(humidity, FEEDER_LIMITS.humidity) });
        if (after.reason !== 'humid' || check.reason !== 'humid') sim.requestMeal();
        applyInputs();
        check = null;
      }
    }
  }

  function needsFrame() {
    const state = sim.getState();
    const changingHumidity = raining() ? humidity < 87 :
      humidity > (wetFood && !discarded ? 61 : DRY_RH);
    return changingHumidity || check || refill || closing || hit || busy(state) || state.phase === 'watching';
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

  for (const [name, actor] of Object.entries(actors)) {
    let suppressClick = false;

    actor.addEventListener('pointerdown', event => {
      if (event.button !== 0 || drag || !available(name)) return;
      clearTimeout(keyboardCheck);
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
      if (name === 'level' && stage() === 'ready') {
        if (cancelled) adjustFood(previousFood);
        else scheduleCheck('meal');
      }
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
      if (name === 'level' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(key)) {
        event.preventDefault();
        event.stopPropagation();
        if (!available(name)) return;
        clearTimeout(keyboardCheck);
        if (key === 'Enter' || key === ' ') scheduleCheck('meal');
        else {
          const delta = ['ArrowUp', 'ArrowRight'].includes(key) ? 5 : -5;
          adjustFood(key === 'Home' ? 0 : key === 'End' ? 100 : Math.round(food) + delta);
          keyboardCheck = setTimeout(() => {
            if (available(name) && !drag) scheduleCheck('meal');
            refresh();
          }, 500);
        }
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
