import { bindIonCondition } from './ion-condition.js';
import { cutoffStep, dischargeModel, ionMilestones, warningStep } from './protection-model.js';

export function mountProtectionLab(root) {
  const play = root.querySelector('#lp-ion-play');
  const reset = root.querySelector('#lp-ion-reset');
  const scrub = root.querySelector('#lp-ion-scrub');
  const jumps = [...root.querySelectorAll('[data-lp-jump]')];
  const showIonCondition = bindIonCondition(root);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lifecycle = new AbortController();
  let cursor = 0;
  let timer = null;
  let finishAt = 100;

  function render() {
    root.dataset.playing = String(timer !== null);
    scrub.value = cursor;
    const timeText = cursor === 0 ? 'เริ่มใช้' : cursor < cutoffStep ? 'ก่อนถึงจุดตัด' :
      cursor === cutoffStep ? 'ถึงจุดตัด' : 'ใช้เลยจุดตัด';
    scrub.setAttribute('aria-valuetext', `${timeText} · จังหวะ ${cursor} จาก 100`);
    jumps.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.lpJump) === cursor)));
    play.textContent = timer !== null ? 'หยุดชั่วคราว' : cursor === 100 ? 'เล่นอีกครั้ง' :
      reduced.matches ? 'จังหวะถัดไป' : cursor === 0 ? 'เล่นแอนิเมชัน' : 'เล่นต่อ';
    showIonCondition(dischargeModel(cursor), cursor);
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
  }

  function seek(frame) {
    stop();
    cursor = frame;
    render();
  }

  function tick() {
    cursor = Math.min(finishAt, cursor + 1);
    const interval = ionMilestones.includes(cursor) ? 900 : 68;
    timer = cursor === finishAt ? null : setTimeout(tick, interval);
    render();
  }

  function run(from, to) {
    stop();
    cursor = from;
    finishAt = to;
    timer = setTimeout(tick, 68);
    render();
  }

  play.addEventListener('click', () => {
    if (timer !== null) {
      seek(cursor);
    } else if (reduced.matches) {
      seek(ionMilestones.find(frame => frame > cursor) ?? 0);
    } else {
      run(cursor === 100 ? 0 : cursor, 100);
    }
  });
  reset.addEventListener('click', () => seek(0));
  scrub.addEventListener('input', () => seek(Number(scrub.value)));
  jumps.forEach((button, i) => button.addEventListener('click', () => {
    const frame = Number(button.dataset.lpJump);
    if (reduced.matches) seek(frame);
    else run(ionMilestones[i - 1] ?? warningStep, frame);
  }));

  const pause = () => seek(cursor);
  reduced.addEventListener('change', pause, {signal:lifecycle.signal});
  window.addEventListener('pagehide', pause, {signal:lifecycle.signal});
  render();

  return () => {
    stop();
    lifecycle.abort();
  };
}
