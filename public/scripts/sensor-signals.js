import { ioCategories } from "./signal-lab/io-categories.js";
import { feederStoryAt } from "./signal-lab/feeder-stories.js";
import { toneFrequency, scopeTrace } from "./signal-lab/stories.js";
import { storyArt } from "./signal-lab/story-art.js";
import { useCaseArt } from "./signal-lab/use-case-art.js";
import { tftRevealPath } from "./signal-lab/tft-image.js";
import { renderBusCase } from "./signal-lab/bus-case.js";

const panel = document.querySelector(".signal-workbench");
const chooser = document.querySelector("#story-family-selector");
const heading = document.querySelector("#story-title");
const source = document.querySelector("#story-source");
const plot = document.querySelector("#story-plot");
const signal = document.querySelector("#story-signal");
const art = document.querySelector("#story-art");
const device = document.querySelector("#story-device");
const result = document.querySelector("#story-result");
const next = document.querySelector("#story-next");
const previous = document.querySelector("#story-previous");
const useCase = document.querySelector("#story-use-case");
const caseDialog = document.querySelector("#story-case-dialog");
const exchangeTemplate = document.querySelector("#story-case-exchange");
const announce = document.querySelector("#story-announcement");
const rates = document.querySelector("#story-rates");
const sensorControl = document.querySelector("#story-sensor-control");
const sensorSlider = document.querySelector("#story-sensor-value");
const sensorOutput = document.querySelector("#story-sensor-output");
const fields = {
  "#story-title": "title",
  "#story-summary": "summary",
  "#story-wires": "wires",
  "#story-device-name": "device",
  "#story-message": "message",
  "#story-note": "note",
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const defaultDuration = 3500;
let index = 0;
let sequence = [];
let chosenButton;
let selectedCategory;
let progress = 0;
let frame = 0;
let revision = 0;
let chart;
let tftClip;
let uartDisplay;
let batteryFill;
let plotWidth = 0;
let audioContext;
let activeTone;

function tracePoints(points, left, area, high, low) {
  return points.map(([time, level]) => `${(left + time * area).toFixed(2)},${(low - (low - high) * level).toFixed(2)}`).join(" ");
}

function sizeChart(story) {
  const width = Math.max(245, Math.floor(plot.clientWidth));
  const lanes = story.tracks.length;
  const left = 53;
  const right = width - 12;
  const area = right - left;
  const top = 31;
  const step = lanes === 1 ? 115 : 44;
  const bottom = top + step * lanes;
  const zoomHigh = bottom + 52;
  const zoomLow = zoomHigh + 23;
  const height = story.pulseZoomUs ? zoomLow + 21 : bottom + 27;
  const endX = time => (left + time * area).toFixed(2);
  const segments = (story.labels ?? []).map(([time, label]) => {
    const x = Math.min(right - 16, Math.max(left + 17, Number(endX(time))));
    return `<text class="story-segment" x="${x}" y="14" text-anchor="middle">${label}</text>`;
  }).join("");
  const guides = story.guides ?? Array.from({ length: 9 }, (_, i) => i / 8);
  const grid = guides.map(time => {
    const x = endX(time);
    return `<path d="M${x} ${top}V${bottom}"/>`;
  }).join("");
  const rails = story.tracks.map((track, i) => {
    const high = top + i * step + 4;
    const low = top + (i + 1) * step - 8;
    const volts = lanes === 1
      ? `<text class="story-axis" x="1" y="${high + 4}">3.3 V</text><text class="story-axis" x="1" y="${low + 4}">0 V</text>`
      : "";
    return `
      <path class="story-rail" d="M${left} ${high}H${right}M${left} ${low}H${right}"/>
      ${volts}<text class="story-lane" x="1" y="${(high + low) / 2 + 4}">${track.name}</text>`;
  }).join("");
  const traces = story.tracks.map((track, i) => {
    const high = top + i * step + 4;
    const low = top + (i + 1) * step - 8;
    const points = tracePoints(track.points, left, area, high, low);
    return `<polyline class="story-trace story-trace-${i}" points="${points}"/>`;
  }).join("");
  const id = "story-reveal";
  const referenceY = story.reference
    ? (bottom - 8 - (bottom - 8 - top - 4) * story.reference.level).toFixed(2)
    : null;
  const reference = story.reference ? `
    <path class="story-cursor" d="M${left} ${referenceY}H${right}"/>
    <text class="story-axis" x="1" y="${Number(referenceY) - 8}">${story.reference.label}</text>` : "";
  const pulseZoom = story.pulseZoomUs ? `
    <text class="story-segment" x="${left}" y="${zoomHigh - 9}">ซูมพัลส์ที่กำลังสั่งมุม</text>
    <path class="story-rail" d="M${left} ${zoomHigh}H${right}M${left} ${zoomLow}H${right}"/>
    <path class="story-trace" data-pulse-zoom/>
    <path class="story-scope-markers" data-pulse-markers/>
    <text class="story-axis" x="${left}" y="${zoomLow + 15}">0</text>
    <text class="story-axis" x="${right}" y="${zoomLow + 15}" text-anchor="end">${story.pulseZoomUs / 1000} ms</text>`
    : "";
  const scopeMeasure = story.scope ? `
    <g class="story-scope-measure">
      <path data-scope-markers class="story-scope-markers"/>
      <path data-scope-bracket class="story-scope-bracket"/>
      <text data-scope-duty class="story-scope-duty" x="${left + 4}" y="12"/>
    </g>` : "";
  plot.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="กราฟแรงดันเทียบเวลา ${story.tracks.map(track => track.name).join(", ")} ช่วง ${story.range}">
      <defs><clipPath id="${id}"><rect data-trace-clip x="${left - 2}" y="${top - 2}" width="0" height="${bottom - top + 4}"/></clipPath></defs>
      <g class="story-grid">${grid}</g>
      ${segments}${rails}${reference}
      <g clip-path="url(#${id})">${traces}</g>
      ${scopeMeasure}
      <path data-trace-cursor class="story-cursor" d="M0 ${top}V${bottom}"/>
      <text x="${left}" y="${bottom + 16}" class="story-axis">0</text>
      <text x="${right}" y="${bottom + 16}" text-anchor="end" class="story-axis">${story.range}</text>
      ${pulseZoom}
    </svg>`;
  plotWidth = width;
  chart = {
    left,
    area,
    clip: plot.querySelector("[data-trace-clip]"),
    cursor: plot.querySelector("[data-trace-cursor]"),
    pulse: plot.querySelector("[data-pulse-zoom]"),
    pulseMarkers: plot.querySelector("[data-pulse-markers]"),
    zoomHigh, zoomLow,
    scope: story.scope ? {
      top, bottom,
      trace: plot.querySelector(".story-trace"),
      markers: plot.querySelector("[data-scope-markers]"),
      bracket: plot.querySelector("[data-scope-bracket]"),
      label: plot.querySelector("[data-scope-duty]"),
    } : null,
  };
}

function showScopeMeasurement(scope, state) {
  const measure = chart.scope;
  const highMs = state.pulseUs === undefined ? scope.periodMs * state.duty / 100 : state.pulseUs / 1000;
  if (measure.highMs === highMs) return;
  measure.highMs = highMs;
  const start = chart.left;
  const end = (start + chart.area * highMs / scope.periodMs / scope.cycles).toFixed(2);
  measure.trace.setAttribute("points", tracePoints(scopeTrace(scope, highMs), start, chart.area, measure.top + 4, measure.bottom - 8));
  measure.markers.setAttribute("d", `M${start} 23V${measure.bottom}M${end} 23V${measure.bottom}`);
  measure.bracket.setAttribute("d", `M${start} 20v6M${start} 23H${end}m0-3v6`);
  const result = state.angle === undefined ? `· Duty ${state.duty}%` : `→ ${state.angle}°`;
  measure.label.textContent = `HIGH ${highMs.toFixed(state.angle === undefined ? 2 : 3)} ms ${result}`;
  if (chart.pulse) {
    const zoomEnd = (start + chart.area * state.pulseUs / sequence[index].pulseZoomUs).toFixed(2);
    chart.pulse.setAttribute("d", `M${start} ${chart.zoomLow}V${chart.zoomHigh}H${zoomEnd}V${chart.zoomLow}H${start + chart.area}`);
    chart.pulseMarkers.setAttribute("d", `M${start} ${chart.zoomHigh - 4}V${chart.zoomLow + 4}M${zoomEnd} ${chart.zoomHigh - 4}V${chart.zoomLow + 4}`);
  }
}

function showProgress(time) {
  progress = time;
  const story = sequence[index];
  const graphTime = story.scope ? 1 : Math.min(1, time / (story.plotPart ?? 1));
  const cursorTime = story.scope ? (time * story.durationMs / story.scope.sweepMs) % 1 : graphTime;
  chart.clip.setAttribute("width", (chart.area * graphTime + (graphTime === 1 ? 4 : 1)).toFixed(2));
  chart.cursor.setAttribute("transform", `translate(${(chart.left + chart.area * cursorTime).toFixed(2)} 0)`);
  chart.cursor.setAttribute("opacity", (story.scope ? time : graphTime) < 1 ? "1" : "0");

  const moving = time > 0 && time < 1;
  const travel = story.both
    ? (time < .66 ? time / .66 : (1 - time) / .34)
    : (time * 3) % 1;
  signal.style.setProperty("--story-travel", `${(68 * travel).toFixed(2)}px`);
  signal.dataset.moving = String(moving);

  const state = story.read(time);
  if (story.scope) showScopeMeasurement(story.scope, state);
  if (batteryFill) batteryFill.setAttribute("width", (114 * state.level).toFixed(1));
  if (uartDisplay) {
    const message = state.received || "…";
    if (uartDisplay.textContent !== message) uartDisplay.textContent = message;
  }
  if (tftClip) tftClip.setAttribute("d", tftRevealPath(state.painted));
  device.dataset.on = String(Boolean(state.on));
  if (story.id === "feeder-stock") device.style.setProperty("--story-stock", state.level);
  device.style.setProperty("--story-glow", state.glow ?? 0);
  if (state.angle !== undefined) {
    const angle = story.id === "servo" ? state.angle - 90 : state.angle;
    device.style.setProperty("--story-angle", `${angle}deg`);
  }
  if (result.textContent !== state.value) result.textContent = state.value;
}

function stopTone() {
  activeTone?.stop();
  activeTone = undefined;
}

function playTone(activeRevision) {
  const Context = window.AudioContext ?? window.webkitAudioContext;
  if (!Context) return;
  try {
    audioContext ??= new Context();
    audioContext.resume().then(() => {
      if (activeRevision !== revision) return;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = audioContext.currentTime + .45;
      oscillator.type = "sine";
      oscillator.frequency.value = toneFrequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.045, start + .72);
      gain.gain.linearRampToValueAtTime(0, start + 1);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.addEventListener("ended", () => {
        oscillator.disconnect();
        gain.disconnect();
        if (activeTone === oscillator) activeTone = undefined;
      }, { once: true });
      activeTone = oscillator;
      oscillator.start(start);
      oscillator.stop(start + 1);
    }).catch(() => {});
  } catch {
    // The graph and speaker animation also work when Web Audio is unavailable.
  }
}

function stopPlayback() {
  revision += 1;
  cancelAnimationFrame(frame);
  stopTone();
}

function playStory(userAction = false) {
  stopPlayback();
  const story = sequence[index];
  sensorControl.hidden = !story.control;
  if (story.control) {
    const { label, min, max, initial, step, unit } = story.control;
    const value = story.selectedValue ?? initial;
    document.querySelector("#story-sensor-label").textContent = label;
    Object.assign(sensorSlider, { min, max, step, value });
    sensorOutput.textContent = `${value} ${unit}`;
  }
  panel.dataset.family = story.family.toLowerCase();
  panel.dataset.story = story.id;
  panel.dataset.scope = String(Boolean(story.scope));
  for (const [selector, field] of Object.entries(fields)) {
    panel.querySelector(selector).textContent = story[field];
  }
  panel.querySelector("#signal-family").textContent = selectedCategory.label;
  panel.querySelector("#story-io-route").textContent = selectedCategory.route;
  panel.querySelector("#story-io-note").textContent = selectedCategory.note;
  rates.hidden = !story.rates;
  rates.querySelector("span").textContent = story.rates ?? "";
  panel.querySelector("#story-graph-mode").textContent = story.scope ? `Trigger ขาขึ้น · ${story.scope.periodMs} ms/ช่อง` : "เล่นช้าลง";
  source.hidden = !story.source;
  if (story.source) {
    source.href = story.source.url;
    source.textContent = story.source.label;
  }
  panel.querySelector("#story-number").textContent = `${index + 1} / ${sequence.length}`;
  previous.querySelector("#story-previous-label").textContent = index === 0 ? "เลือกหัวข้อ" : "ย้อนกลับ";
  signal.dataset.both = String(Boolean(story.both));
  art.innerHTML = storyArt[story.id];
  tftClip = art.querySelector("[data-tft-reveal]");
  uartDisplay = art.querySelector("[data-uart-text]");
  batteryFill = art.querySelector("[data-battery-fill]");
  sizeChart(story);

  const following = sequence[index + 1];
  const nextSuffix = !following ? " กลับไปเลือกหัวข้อ" : following.id === "audio" ? " ตัวอย่างถัดไปมีเสียงสั้น ๆ" : "";
  next.setAttribute("aria-label", `ถัดไป${nextSuffix}`);
  next.querySelector("#story-next-icon").textContent = following?.id === "audio" ? "♪" : "→";
  next.title = nextSuffix.trim();
  announce.textContent = `ตัวอย่าง ${index + 1} จาก ${sequence.length} ${story.title} ${story.message}${nextSuffix}`;

  if (story.id === "audio" && userAction) playTone(revision);
  if (reducedMotion.matches) {
    showProgress(1);
    return;
  }
  showProgress(0);
  const duration = story.durationMs ?? defaultDuration;
  const maxFrameAdvance = story.scope || story.id === "servo" || story.id === "uart" ? 100 : Infinity;
  let lastFrame = performance.now();
  let elapsed = 0;
  function update(now) {
    // Keep visible checkpoints when the browser delays a frame.
    elapsed += Math.max(0, Math.min(now - lastFrame, maxFrameAdvance));
    lastFrame = now;
    const time = Math.min(1, elapsed / duration);
    showProgress(time);
    if (time < 1) frame = requestAnimationFrame(update);
  }
  frame = requestAnimationFrame(update);
}

chooser.addEventListener("click", event => {
  const button = event.target.closest("[data-story-io]");
  if (!button) return;
  chosenButton = button;
  selectedCategory = ioCategories.find(category => category.id === button.dataset.storyIo);
  const examples = button.dataset.storyExtra || !selectedCategory.stories.length ? selectedCategory.extra : selectedCategory.stories;
  sequence = [...examples];
  index = 0;
  chooser.hidden = true;
  panel.hidden = false;
  playStory(true);
  heading.focus({ preventScroll: true });
});

sensorSlider.addEventListener("input", () => {
  const story = sequence[index];
  if (!story?.control) return;
  const value = Number(sensorSlider.value);
  const revised = feederStoryAt(story, value);
  sequence[index] = { ...revised, selectedValue: value };
  sensorOutput.textContent = `${value} ${story.control.unit}`;
  stopPlayback();
  sizeChart(revised);
  showProgress(1);
});

function returnToChooser() {
  stopPlayback();
  sequence = [];
  panel.hidden = true;
  chooser.dataset.returning = "true";
  chooser.hidden = false;
  chosenButton.focus({ preventScroll: true });
}

next.addEventListener("click", () => {
  if (index === sequence.length - 1) returnToChooser();
  else {
    index += 1;
    playStory(true);
  }
});

previous.addEventListener("click", () => {
  if (index === 0) returnToChooser();
  else {
    index -= 1;
    playStory(true);
  }
});

useCase.addEventListener("click", () => {
  const story = sequence[index];
  const { title, when, routes, result } = story.useCase;
  const scene = useCaseArt[story.id];
  caseDialog.querySelector("#story-case-mode").textContent = `การใช้งานจริง · ${story.tag}`;
  caseDialog.querySelector("#story-case-title").textContent = title;
  caseDialog.querySelector("#story-case-when").textContent = when;
  caseDialog.querySelector("#story-case-result").textContent = result;
  const pairDiagram = caseDialog.querySelector(".story-case-diagram");
  const networkDiagram = caseDialog.querySelector("#story-case-network");
  pairDiagram.hidden = Boolean(story.network);
  networkDiagram.hidden = !story.network;
  caseDialog.dataset.network = String(Boolean(story.network));
  if (story.network) {
    renderBusCase(networkDiagram, story.network, scene);
    caseDialog.showModal();
    return;
  }
  for (const side of ["left", "right"]) {
    const endpoint = caseDialog.querySelector(`[data-side="${side}"]`);
    endpoint.querySelector("div").innerHTML = scene[side].illustration;
    endpoint.querySelector("strong").textContent = scene[side].name;
  }
  caseDialog.querySelector("#story-case-lanes").replaceChildren(...routes.map((route, index) => {
    const fragment = exchangeTemplate.content.cloneNode(true);
    const lane = fragment.firstElementChild;
    lane.dataset.reply = String(index > 0);
    lane.querySelector(".story-case-signal").textContent = scene.signals[index];
    if (route.when) {
      const phase = lane.querySelector(".story-case-phase");
      phase.textContent = `${index + 1} · ${route.when}`;
      phase.hidden = false;
    }
    return fragment;
  }));
  caseDialog.querySelector("#story-case-routes").replaceChildren(...routes.map(route => {
    const item = document.createElement("li");
    const phase = route.when ? `${route.when} ` : "";
    item.textContent = `${phase}${route.from} ส่ง ${route.payload} ให้ ${route.to}`;
    return item;
  }));
  caseDialog.showModal();
});

// Keep the classroom's slide shortcuts out of the open dialog.
caseDialog.addEventListener("keydown", event => event.stopPropagation());

new ResizeObserver(() => {
  if (!sequence.length) return;
  const width = Math.max(245, Math.floor(plot.clientWidth));
  if (width === plotWidth) return;
  sizeChart(sequence[index]);
  showProgress(progress);
}).observe(plot);

reducedMotion.addEventListener("change", event => {
  if (event.matches && sequence.length) {
    cancelAnimationFrame(frame);
    showProgress(1);
  }
});

const diagram = document.querySelector(".story-io-diagram");
const connections = diagram.querySelector(".story-io-connections");
function layoutConnections() {
  if (chooser.hidden) return;
  const bounds = diagram.getBoundingClientRect();
  const stacked = matchMedia("(max-width: 600px)").matches;
  connections.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
  for (const category of ioCategories) {
    const node = diagram.querySelector(`[data-story-io="${category.id}"]`).getBoundingClientRect();
    const port = diagram.querySelector(`[data-io-port="${category.id}"]`).getBoundingClientRect();
    const input = category.id.endsWith("input");
    const x = stacked ? node.x + node.width / 2 : input ? node.right : node.left;
    const y = stacked ? input ? node.bottom : node.top : node.y + node.height / 2;
    const start = input ? [x - bounds.x, y - bounds.y] : [port.x + port.width / 2 - bounds.x, port.y + port.height / 2 - bounds.y];
    const end = input ? [port.x + port.width / 2 - bounds.x, port.y + port.height / 2 - bounds.y] : [x - bounds.x, y - bounds.y];
    const middle = (start[stacked ? 1 : 0] + end[stacked ? 1 : 0]) / 2;
    const path = stacked ? `M${start} C${start[0]},${middle} ${end[0]},${middle} ${end}` : `M${start} C${middle},${start[1]} ${middle},${end[1]} ${end}`;
    diagram.querySelectorAll(`[data-io-link="${category.id}"]`).forEach(line => line.setAttribute("d", path));
  }
}
new ResizeObserver(layoutConnections).observe(diagram);
