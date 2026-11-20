import { adapterTraces, mountAdapterTraces } from './adapter-traces.js';

const outputVolts = 5;
const limitAmps = 2;

export function adapterOutput(requested, mode, phase) {
  const overload = requested > limitAmps;
  if (!overload) {
    return {
      state: requested >= 1.7 ? 'near' : 'normal',
      volts: outputVolts,
      amps: requested
    };
  }
  if (mode === 'hiccup' && phase !== 'retry') {
    return { state:'off', volts:0, amps:0 };
  }
  return {
    state: mode === 'hiccup' ? 'retry' : 'limited',
    volts: outputVolts * limitAmps / requested,
    amps: limitAmps
  };
}

const art = `<svg viewBox="0 0 390 206" aria-hidden="true">
  <defs>
    <pattern id="adapter-grid" width="15" height="15" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#c2d7ec"/>
    </pattern>
  </defs>
  <rect width="390" height="206" fill="url(#adapter-grid)"/>
  <path d="M15 151h360" stroke="#c9dcf1" stroke-width="2"/>
  <g>
    <rect x="22" y="56" width="70" height="85" rx="13" fill="#fff" stroke="#9fb7d1" stroke-width="2"/>
    <path d="M44 92v18m23-18v18" stroke="#627994" stroke-width="7" stroke-linecap="round"/>
    <circle cx="56" cy="122" r="4" fill="#8b9eb3"/>
    <path d="M83 84h22m-22 34h22" stroke="#788da5" stroke-width="6" stroke-linecap="round"/>
    <rect x="99" y="68" width="99" height="66" rx="13" fill="#213957" stroke="#142f4c" stroke-width="2"/>
    <path d="M107 76h81M107 124h81" stroke="#526c8b" stroke-width="2"/>
    <text x="148" y="107" text-anchor="middle" class="adapter-paper">5V 2A</text>
    <circle cx="183" cy="117" r="4" class="adapter-indicator"/>
  </g>
  <path class="adapter-cable" d="M199 98h65q18 0 18-18V67h34M316 133h-39q-13 0-13-13H198"/>
  <path class="adapter-flow" d="M200 98h64q18 0 18-18V67h34M316 133h-39q-13 0-13-13H199"/>
  <path class="adapter-arrows" d="m236 94 6 4-6 4m57-39 6 4-6 4m-53 49-6 4 6 4"/>
  <g>
    <rect x="301" y="43" width="68" height="101" rx="15" fill="#e5edf8" stroke="#8aaac8" stroke-width="2"/>
    <circle cx="335" cy="94" r="32" class="adapter-glow"/>
    <circle cx="335" cy="94" r="24" class="adapter-bulb" stroke-width="2"/>
    <path d="M327 97l8-11 8 11m-8 0v10" fill="none" stroke="#644322" stroke-width="2.7" stroke-linecap="round"/>
    <circle cx="316" cy="67" r="3" fill="#64748b"/><circle cx="316" cy="133" r="3" fill="#64748b"/>
  </g>
  <text x="55" y="176" text-anchor="middle" class="adapter-label">ไฟบ้าน AC</text>
  <text x="148" y="176" text-anchor="middle" class="adapter-label">Adapter</text>
  <text x="335" y="176" text-anchor="middle" class="adapter-label">โหลดทดสอบ</text>
</svg>`;

export const adapterLab = `
  <div class="adapter-lab" id="adapter-lab">
    <div class="source-layout">
      <figure class="source-art adapter-scene" aria-describedby="adapter-scene-label">
        ${art}
        <figcaption id="adapter-scene-label"></figcaption>
      </figure>
      <div class="source-activity">
        <h3>โหลดขอเท่านี้ แล้ว Adapter จ่ายได้เท่าไร?</h3>
        <label for="adapter-load">กระแสที่โหลดขอถ้าได้ 5 V <output id="adapter-current" for="adapter-load">0.60 A</output></label>
        <input id="adapter-load" type="range" min="0" max="2.6" step="0.1" value="0.6">
        <div class="range-labels adapter-range-labels" aria-hidden="true"><span>0 A</span><span>พิกัด 2 A</span><span>2.6 A</span></div>
        <label for="adapter-mode">ลองรูปแบบการป้องกัน</label>
        <select id="adapter-mode">
          <option value="limit">จำกัดกระแส · แรงดันตก</option>
          <option value="hiccup">ตัดแล้วลองจ่ายใหม่ · Hiccup</option>
        </select>
        <dl class="adapter-readings">
          <div><dt>แรงดันที่โหลดได้</dt><dd id="adapter-volts"></dd></div>
          <div><dt>กระแสที่จ่าย</dt><dd id="adapter-amps"></dd></div>
          <div><dt>กำลังที่โหลดได้</dt><dd id="adapter-watts"></dd></div>
        </dl>
        <div class="source-result" id="adapter-result">
          <strong id="adapter-state" role="status"></strong>
          <p id="adapter-message"></p>
          <button type="button" class="power-action" id="adapter-replay" hidden>เล่นซ้ำ</button>
        </div>
      </div>
    </div>
    ${adapterTraces}
    <p class="adapter-note">ตัวเลขเป็นแบบจำลองโหลดชนิดความต้านทาน เกณฑ์เริ่มป้องกันจริงขึ้นกับรุ่น ถ้าเจอควันหรือกลิ่นไหม้ ให้หยุดใช้และตัดไฟเมื่อทำได้อย่างปลอดภัย</p>
  </div>`;

const messages = {
  normal: ['จ่ายได้ตามที่โหลดขอ','Adapter คงแรงดันที่ 5 V โหลดทำงานได้ตามกำลังที่ขอ'],
  near: ['ใกล้เต็มพิกัด','ยังจ่ายได้ 5 V แต่เหลือที่เผื่อกระแสช่วงเปิดเครื่องหรือกระชากน้อย'],
  limited: ['จำกัดกระแส · แรงดันตก','วงจรคุมกระแสไว้ที่ 2 A ในฉากนี้ แรงดันจึงลดลง โหลดได้กำลังน้อยลงและไฟหรี่ อุปกรณ์บางชนิดอาจรีเซตหากแรงดันต่ำเกินไป'],
  off: ['ตัดไฟชั่วคราว','โหลดเกินจนวงจรป้องกันหยุดจ่าย โหลดดับ ถ้ายังเกินอยู่ เมื่อวงจรลองจ่ายอีกครั้งก็จะตัดซ้ำ'],
  retry: ['กำลังลองจ่ายใหม่','ไฟกลับมาชั่วครู่และชนเพดานกระแสอีกครั้ง ถ้าโหลดกลับมาอยู่ในพิกัด Adapter จะกลับมาจ่าย 5 V']
};

export function mountAdapterLab(root) {
  const find = id => root.querySelector('#' + id);
  const load = find('adapter-load');
  const mode = find('adapter-mode');
  const replay = find('adapter-replay');
  const status = find('adapter-state');
  const caption = find('adapter-scene-label');
  const message = find('adapter-message');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lifecycle = new AbortController();
  const traces = mountAdapterTraces(find('adapter-traces'), reduced);
  let timer;
  let phase = 'off';
  let attempts = 0;
  let cycling = false;

  const hiccup = () => Number(load.value) > limitAmps && mode.value === 'hiccup';

  function stop() {
    clearTimeout(timer);
    timer = undefined;
    cycling = false;
  }

  function render() {
    const requested = Number(load.value);
    const output = adapterOutput(requested, mode.value, phase);
    const {state, volts, amps} = output;
    traces.record(output);
    const watts = volts * amps;
    const [title, detail] = requested === 0
      ? ['ยังไม่ได้เพิ่มโหลด', 'ที่ขั้วออกยังมี 5 V แต่ไม่มีกระแสไหลไปโหลด']
      : messages[state];
    root.dataset.state = state;
    root.dataset.powered = String(amps > 0);
    root.style.setProperty('--adapter-brightness', volts === 0 || requested === 0 ? 0 : (volts / outputVolts) ** 2);
    find('adapter-current').textContent = `${requested.toFixed(2)} A`;
    find('adapter-volts').textContent = `${volts.toFixed(2)} V`;
    find('adapter-amps').textContent = `${amps.toFixed(2)} A`;
    find('adapter-watts').textContent = `${watts.toFixed(2)} W`;
    find('adapter-result').dataset.zone = state === 'off' ? 'danger' : state === 'normal' ? 'safe' : 'warning';
    if (status.textContent !== title) status.textContent = title;
    caption.textContent = amps === 0 ? 'กระแสไม่ไหล · โหลดดับ' : `DC ${volts.toFixed(2)} V ไปยังโหลด`;
    message.textContent = `ถ้าคง 5 V โหลดจะขอ ${(requested * outputVolts).toFixed(2)} W · ${detail}`;
    replay.hidden = !hiccup();
    replay.textContent = reduced.matches ? (phase === 'off' ? 'ดูจังหวะลองจ่าย' : 'ดูจังหวะตัดไฟ') :
      cycling ? 'หยุดการจำลอง' : 'เล่นรอบตัด–ลองจ่ายอีกครั้ง';
  }

  function nextPhase() {
    if (phase === 'off') {
      phase = 'retry';
      attempts++;
      timer = setTimeout(nextPhase, 500);
    } else {
      phase = 'off';
      if (attempts < 3) timer = setTimeout(nextPhase, 850);
      else stop();
    }
    render();
  }

  function start() {
    stop();
    phase = 'off';
    attempts = 0;
    if (!reduced.matches) {
      cycling = true;
      timer = setTimeout(nextPhase, 850);
    }
    render();
  }

  let priorHiccup = false;
  function update() {
    const showingHiccup = hiccup();
    if (showingHiccup && !priorHiccup) start();
    else {
      if (!showingHiccup) {
        stop();
        phase = 'off';
      }
      render();
    }
    priorHiccup = showingHiccup;
  }

  load.addEventListener('input', update);
  root.querySelectorAll('[data-adapter-preset]').forEach(button => {
    button.addEventListener('click', () => {
      load.value = button.dataset.adapterPreset;
      update();
    });
  });
  mode.addEventListener('change', update);
  replay.addEventListener('click', () => {
    if (reduced.matches) {
      phase = phase === 'off' ? 'retry' : 'off';
      render();
    } else if (cycling) {
      stop();
      render();
    } else {
      start();
    }
  });
  const pause = () => {
    stop();
    render();
  };
  reduced.addEventListener('change', pause, {signal:lifecycle.signal});
  window.addEventListener('pagehide', pause, {signal:lifecycle.signal});
  update();

  return () => {
    stop();
    traces.dispose();
    lifecycle.abort();
  };
}
