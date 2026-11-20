import { FEEDER_LIMITS, FEEDER_PINS } from '../feeder/model.js';

export const waitMs = FEEDER_LIMITS.portionMs;
export const pulseMs = 240;
const spanMs = 1610;
const sampleEveryMs = 100;

export function feederTimingObservations(at) {
  const covered = time => at <= time && time < at + pulseMs;
  const polling = Array.from({ length: Math.floor(waitMs / sampleEveryMs) + 1 }, (_, index) => index * sampleEveryMs).find(covered);
  return { delay: covered(waitMs) ? waitMs : null, millis: polling ?? null };
}

function timeline(kind) {
  const isDelay = kind === 'delay';
  const readPositions = isDelay ? [waitMs] : Array.from({ length: Math.floor(waitMs / sampleEveryMs) + 1 }, (_, index) => index * sampleEveryMs);
  return `<article class="cl-feeder-clock-lane">
    <h3><code>${kind}()</code> · ${isDelay ? 'พักลูปก่อนอ่าน' : 'อ่านแล้วเช็กเวลา'}</h3>
    <div class="cl-feeder-clock-rail" aria-hidden="true">
      <div class="cl-feeder-duration" style="--duration:${100 * waitMs / spanMs}%"></div>
      <div class="cl-feeder-pulse" data-fo-clock-pulse></div>
      ${readPositions.map(time => `<i style="--point:${100 * time / spanMs}%"></i>`).join('')}
      <div class="cl-feeder-clock-now" data-fo-clock-now></div>
    </div>
    <p data-fo-clock-result="${kind}">ยังไม่ได้ทดลอง</p>
  </article>`;
}

export function feederTimingHTML() {
  return `<section class="cl-feeder-clock" aria-labelledby="cl-feeder-clock-title" data-fo-clock>
    <h3 id="cl-feeder-clock-title">ระหว่างรอปิดฝา ยังอ่าน IR ได้ไหม?</h3>
    <p>ลองบังลำแสง GPIO${FEEDER_PINS.infrared} ชั่วครู่ระหว่างที่ฝาเปิดค้าง ${waitMs} ms ขีดบนกราฟคือจังหวะอ่านค่า แถบสีม่วงคือช่วงที่ลำแสงถูกบัง</p>
    <label>เริ่มบังลำแสงที่ <output data-fo-clock-at>450 ms</output><input type="range" min="0" max="${waitMs}" step="50" value="450" data-fo-clock-input></label>
    <div class="cl-feeder-clock-actions"><button type="button" class="cl-primary" data-fo-clock-run>เดินเวลาหนึ่งรอบ</button><span>บังนาน ${pulseMs} ms</span></div>
    <div class="cl-feeder-clocks">${timeline('delay')}${timeline('millis')}</div>
    <p class="cl-feeder-clock-status" data-fo-clock-status role="status">ลองตั้งให้ลำแสงหายไปก่อนครบ ${waitMs} ms แล้วเทียบกัน</p>
    <details><summary>ดูสองคำสั่งเทียบกัน</summary>
      <p><code>delay(${waitMs}); digitalRead(${FEEDER_PINS.infrared});</code> จะกลับมาอ่านหลังรอครบ ส่วน <code>digitalRead(${FEEDER_PINS.infrared});</code> ตามด้วย <code>if (millis() - openedAt &gt;= ${waitMs})</code> อ่านได้ทุกลูปแล้วค่อยเช็กว่าจะปิดฝาหรือยัง</p>
    </details>
    <small>ภาพจำลองให้ลูปอ่านทุก ${sampleEveryMs} ms เพื่อเห็นจังหวะชัด ๆ การอ่าน IR ระหว่างนี้ใช้ดูสัญญาณ ส่วนการบันทึกว่ามีตัวมาที่ชามจะเกิดหลังจ่ายเสร็จ</small>
  </section>`;
}

export function setupFeederTiming(root) {
  const clock = root.querySelector('[data-fo-clock]');
  const slider = clock.querySelector('[data-fo-clock-input]');
  const value = clock.querySelector('[data-fo-clock-at]');
  const run = clock.querySelector('[data-fo-clock-run]');
  const status = clock.querySelector('[data-fo-clock-status]');
  const cursors = [...clock.querySelectorAll('[data-fo-clock-now]')];
  const pulses = [...clock.querySelectorAll('[data-fo-clock-pulse]')];
  const result = kind => clock.querySelector(`[data-fo-clock-result="${kind}"]`);
  let timer = 0;

  function stop() {
    cancelAnimationFrame(timer);
    timer = 0;
    slider.disabled = false;
    run.disabled = false;
  }

  function paintPulse() {
    const at = Number(slider.value);
    value.textContent = `${at} ms`;
    for (const pulse of pulses) {
      pulse.style.insetInlineStart = `${100 * at / spanMs}%`;
      pulse.style.inlineSize = `${100 * pulseMs / spanMs}%`;
    }
    for (const cursor of cursors) cursor.style.insetInlineStart = '0';
    for (const kind of ['delay', 'millis']) result(kind).textContent = 'ยังไม่ได้ทดลอง';
  }

  slider.addEventListener('input', paintPulse);
  run.addEventListener('click', () => {
    stop();
    run.disabled = true;
    slider.disabled = true;
    const observations = feederTimingObservations(Number(slider.value));
    status.textContent = 'กำลังเดินเวลา';
    for (const kind of ['delay', 'millis']) result(kind).textContent = 'กำลังรอจังหวะอ่าน';
    const start = performance.now();

    function draw(now) {
      const elapsed = Math.min(now - start, spanMs);
      for (const cursor of cursors) cursor.style.insetInlineStart = `${100 * elapsed / spanMs}%`;
      for (const kind of ['delay', 'millis']) {
        const sample = observations[kind];
        if (sample !== null && elapsed >= sample) result(kind).textContent = `อ่านได้ LOW ที่ ${sample} ms`;
        if (sample === null && elapsed >= waitMs) result(kind).textContent = 'จบช่วงทดลอง · ไม่อ่านเจอ LOW';
      }
      if (elapsed < spanMs) {
        timer = requestAnimationFrame(draw);
      } else {
        stop();
        status.textContent = observations.delay === null
          ? observations.millis === null
            ? 'ทั้งสองฝั่งไม่เจอ LOW · ลองเลื่อนให้ลำแสงถูกบังระหว่างฝาเปิด'
            : 'delay() พลาดช่วงถูกบัง · millis() ยังอ่านได้ระหว่างรอ'
          : 'ทั้งสองฝั่งอ่านพบ LOW เพราะลำแสงยังถูกบังตอนครบเวลารอ';
      }
    }

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) draw(start + spanMs);
    else timer = requestAnimationFrame(draw);
  });
  paintPulse();
  return () => { stop(); paintPulse(); status.textContent = 'พร้อมเดินเวลาอีกครั้ง'; };
}
