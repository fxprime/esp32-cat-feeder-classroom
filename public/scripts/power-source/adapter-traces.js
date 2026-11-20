const windowSeconds = 8;
const tickSeconds = 2;
const tailSeconds = 1.45;
const plotWidth = 600;
const plotHeight = 100;
const states = {
  limited: { label:'จำกัดกระแส', tone:'limit' },
  off: { label:'ตัดไฟ', tone:'off' },
  retry: { label:'ลองจ่ายใหม่', tone:'retry' }
};

function plot(name, title, units, marks) {
  return `<div class="adapter-trace" data-trace="${name}">
    <div class="adapter-trace-label"><strong>${title}</strong><span id="adapter-trace-${name}-now">${units}</span></div>
    <div class="adapter-trace-row">
      <div class="adapter-trace-scale" aria-hidden="true">
        ${marks.map(([value, percent]) => `<span style="top:${percent}%">${value}</span>`).join('')}
      </div>
      <svg viewBox="0 0 ${plotWidth} ${plotHeight}" preserveAspectRatio="none" aria-hidden="true">
        <g data-trace-bands></g>
        <path class="adapter-trace-grid" d="M150 0V100M300 0V100M450 0V100M0 54.55H600"/>
        <path class="adapter-trace-reference" d="M0 9.1H600"/>
        <g data-trace-events></g>
        <path data-trace-line></path>
        <path data-trace-head></path>
      </svg>
    </div>
  </div>`;
}

export const adapterTraces = `
  <section id="adapter-traces" class="adapter-traces" aria-labelledby="adapter-traces-title">
    <div class="adapter-traces-heading">
      <div>
        <h3 id="adapter-traces-title">กราฟเอาต์พุตตามเวลา</h3>
        <p>ลองเพิ่มโหลดเกิน 2 A แล้วลดลงมาดูจังหวะที่แรงดันกลับไป 5 V</p>
      </div>
      <div class="adapter-trace-actions">
        <button type="button" data-adapter-preset="2.6">เพิ่มเป็น 2.6 A</button>
        <button type="button" data-adapter-preset="0.6">ลดเหลือ 0.6 A</button>
        <button type="button" id="adapter-trace-reset">ล้างกราฟ</button>
      </div>
    </div>
    ${plot('volts','แรงดันที่โหลดได้','V',[['5 V',9.1],['2.5',54.55],['0',100]])}
    ${plot('amps','กระแสที่จ่ายจริง','A',[['2 A',9.1],['1',54.55],['0',100]])}
    <div class="adapter-trace-time" aria-hidden="true"></div>
    <p class="adapter-trace-x-label">เวลาในแบบจำลอง (วินาที)</p>
    <ul class="adapter-trace-key" aria-label="คำอธิบายสีของช่วงเวลา">
      <li data-tone="limit">จำกัดกระแส</li>
      <li data-tone="off">ตัดไฟ</li>
      <li data-tone="retry">ลองจ่าย</li>
      <li data-tone="restore">กลับมา 5 V</li>
    </ul>
    <p class="adapter-trace-caption">เส้นประคือระดับอ้างอิง 5 V และ 2 A ช่วงตัดและลองจ่ายเป็นเวลาตัวอย่างของฉาก</p>
    <ol id="adapter-trace-log" class="adapter-trace-log" aria-label="เหตุการณ์ล่าสุดในกราฟ"></ol>
  </section>`;

function eventAt(sample, previous) {
  if (!previous || sample.state === previous.state) return null;
  if (states[sample.state]) return states[sample.state];
  if (states[previous.state]) return { label:'กลับมา 5 V', tone:'restore' };
  return null;
}

export function traceWindow(samples, now) {
  const end = Math.max(windowSeconds, Math.ceil((now + .25) / tickSeconds) * tickSeconds);
  const begin = end - windowSeconds;
  const preceding = samples.findLastIndex(sample => sample.time <= begin);
  return { begin, end, samples: samples.slice(Math.max(0, preceding)) };
}

function plotData(samples, begin, now, key, maximum) {
  const x = time => (time - begin) / windowSeconds * plotWidth;
  const y = value => plotHeight - value / maximum * plotHeight;
  const left = sample => Math.max(0, x(sample.time));
  const last = samples.at(-1);
  let line = `M${left(samples[0])} ${y(samples[0][key])}`;
  const marks = [];
  const bands = [];
  samples.forEach((sample, i) => {
    const start = left(sample);
    const stop = x(samples[i + 1]?.time ?? now);
    if (i) line += `H${start}V${y(sample[key])}`;
    const state = states[sample.state];
    if (state && stop > start) {
      bands.push(`<rect x="${start}" width="${stop - start}" height="100" data-tone="${state.tone}"/>`);
    }
    if (sample.event && sample.time >= begin) {
      marks.push(`<path d="M${start} 0V100" data-tone="${sample.event.tone}"/>`);
    }
  });
  const endpoint = x(now);
  const height = y(last[key]);
  return {
    line:`${line}H${endpoint}`,
    head:`M${Math.max(0, endpoint - .5)} ${height}h1`,
    bands:bands.join(''),
    marks:marks.join('')
  };
}

export function mountAdapterTraces(root, reduced) {
  const logs = root.querySelector('#adapter-trace-log');
  const timeLabels = root.querySelector('.adapter-trace-time');
  const plots = [
    { key:'volts', max:5.5, unit:'V' },
    { key:'amps', max:2.2, unit:'A' }
  ].map(plot => {
    const row = root.querySelector(`[data-trace="${plot.key}"]`);
    return {
      ...plot,
      line:row.querySelector('[data-trace-line]'),
      head:row.querySelector('[data-trace-head]'),
      bands:row.querySelector('[data-trace-bands]'),
      marks:row.querySelector('[data-trace-events]'),
      now:row.querySelector('.adapter-trace-label span')
    };
  });
  let origin = performance.now() - .85 * 1000;
  let samples = [];
  let events = [];
  let pending;
  let previousAxis;
  const elapsed = () => (performance.now() - origin) / 1000;

  function paint(now) {
    const { begin, samples: visible } = traceWindow(samples, now);
    // Retain the last state before the visible window so a steady output has a baseline.
    samples = visible;
    const current = samples.at(-1);
    plots.forEach(plot => {
      const {line, head, bands, marks} = plotData(samples, begin, now, plot.key, plot.max);
      plot.line.setAttribute('d', line);
      plot.head.setAttribute('d', head);
      plot.bands.innerHTML = bands;
      plot.marks.innerHTML = marks;
      plot.now.textContent = `${current[plot.key].toFixed(2)} ${plot.unit}`;
    });
    if (previousAxis !== begin) {
      previousAxis = begin;
      timeLabels.innerHTML = Array.from({length:5}, (_, i) => `<span>${begin + i * tickSeconds}</span>`).join('');
    }
  }

  function record(output) {
    const previous = samples.at(-1);
    if (previous && previous.state === output.state &&
        previous.volts === output.volts && previous.amps === output.amps) return;
    const now = elapsed();
    const event = eventAt(output, previous);
    samples.push({ ...output, time:previous ? now : 0, event });
    if (event) {
      events = [{ ...event, time:now, volts:output.volts, amps:output.amps }, ...events].slice(0, 6);
    }
    logs.innerHTML = events.map(item => `<li data-tone="${item.tone}">
      <time>${item.time.toFixed(2)} s</time><strong>${item.label}</strong>
      <span>${item.volts.toFixed(2)} V · ${item.amps.toFixed(2)} A</span>
    </li>`).join('');
    paint(now);
    clearTimeout(pending);
    if (reduced.matches) return;
    const until = now + tailSeconds;
    function extend() {
      const t = Math.min(until, elapsed());
      paint(t);
      if (t < until && !reduced.matches) pending = setTimeout(extend, 85);
    }
    pending = setTimeout(extend, 85);
  }

  root.querySelector('#adapter-trace-reset').addEventListener('click', () => {
    const {state, volts, amps} = samples.at(-1);
    samples = [];
    events = [];
    origin = performance.now() - .85 * 1000;
    record({state, volts, amps});
  });

  return { record, dispose: () => clearTimeout(pending) };
}
