import { esc } from './drawing.js';

const icons = {
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path data-lock-shackle d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>',
  key: '<circle cx="8" cy="9" r="4"/><path d="m11 12 8 8m-2-2 3-3m-6 0 2-2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path data-effect-hand d="M12 7v5l3 2"/>',
  gpio: '<rect x="3" y="7" width="8" height="10" rx="2"/><path d="M11 12h10m-4-4 4 4-4 4"/>',
  wave: '<path d="M3 16h4V7h5v9h5V7h4"/>',
  call: '<path d="M4 5v10a3 3 0 0 0 3 3h13m-4-4 4 4-4 4"/>',
  branch: '<path d="M4 12h6l6-6h4m-10 6 6 6h4"/>',
  serial: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="m7 8 2 2-2 2m5 0h4m-4 5v4m-4 0h8"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const isConst = variable => variable.scope.endsWith('/ const');
const format = ms => ms.toLocaleString('en-US');
const variableLabel = name => name === 'return' ? 'return ↩' : name;
const normalPlaybackRate = 0.35;
const mapDuration = 300;
const outputGlowHold = 1600;
const outputGlowFade = 1200;
const outputGlowRise = 110;

export function renderMemory(region, variables) {
  const entries = Object.entries(variables);
  region.innerHTML = entries.length ? entries.map(([name, variable]) => `
    <div class="cl-register" data-register="${esc(name)}" title="${esc(variable.scope)}">
      <code data-register-name>${esc(variableLabel(name))}${variable.reference?` <span class="cl-register-ref">↔ ${esc(variable.reference)}</span>`:''}</code>
      ${isConst(variable) ? `<span class="cl-register-lock" data-lock aria-label="const · แก้ค่าไม่ได้" role="img">${icon('lock')}</span>` : ''}
      <b data-register-value>${esc(variable.value)}</b>
    </div>`).join('') : '<span>ยังไม่มีคำสั่งกำหนดค่า</span>';
}

function describeEffect(before, after) {
  const {line, wait, vars, leds} = after;
  if (after.effect) {
    const effect = {...after.effect};
    if (effect.kind==='return') effect.label = `return ${vars.return.value}`;
    return effect;
  }
  const pinChange = Object.entries(after.pins).find(([pin, mode]) => before.pins[pin] !== mode);
  if (pinChange) {
    const [pin, mode] = pinChange;
    return {kind:'pin', symbol:line === 'setup-pwm' ? 'ledcAttach' : 'pinMode', icon:line === 'setup-pwm' ? 'wave' : 'gpio', pin, label:`GPIO${pin} · ${mode}`};
  }
  if (['high','low','write-duty','timing-write'].includes(line)) {
    const pin = vars.pins ? [23,22,21][vars.i.value] : 23;
    const duty = leds[pin];
    const label = line === 'write-duty' ? `PWM ${Math.round(duty / 255 * 100)}%` : duty ? 'HIGH' : 'LOW';
    return {kind:'write', symbol:line === 'write-duty' ? 'ledcWrite' : 'digitalWrite', icon:'wave', pin, label:`GPIO${pin} → LED · ${label}`, signal:label};
  }
  if (wait || before.wait) {
    return {kind:'wait', symbol:'delay', icon:wait ? 'clock' : 'check', wait, duration:wait || before.wait, label:wait ? `รอ ${format(wait)} ms` : `ครบ ${format(before.wait)} ms`};
  }
  const serial = line?.match(/^serial-(print|println|printf)-/);
  if (serial) {
    const symbol = serial[1];
    const signal = after.serialChunk.trimEnd();
    return {kind:'serial', symbol, icon:'serial', label:`Serial.${symbol}() → Serial Monitor`, signal};
  }
  switch (line) {
    case 'read-clock': return {kind:'clock', symbol:'millis', icon:'clock', label:`millis() → now = ${format(vars.now.value)} ms`};
    case 'timing-if': return {kind:'jump', symbol:'if', icon:'branch', label:`${format(vars.elapsed.value)} ≥ ${format(vars.intervalMs.value)} ms · ${vars.elapsed.value>=vars.intervalMs.value?'จริง':'เท็จ'}`, target:vars.elapsed.value>=vars.intervalMs.value?'stamp':'loop-close'};
    case 'read-humidity': return {kind:'read', symbol:'readHumidity', icon:'gpio', pin:21, label:'HTU21D → I²C → humidityRH'};
    case 'humidity-if': {
      const blocked = vars.humidityRH.value === 'NaN' || vars.humidityRH.value >= vars.RH_LIMIT.value;
      return {kind:'jump', symbol:'if', icon:'branch', label:blocked?'จริง → เข้า if':'เท็จ → ไป else', target:blocked?'high':'else'};
    }
    case 'read-raw': return {kind:'read', symbol:'analogRead', icon:'wave', pin:34, label:'ปุ่มหมุน → ADC → raw'};
    case 'read-button': return {kind:'read', symbol:'digitalRead', icon:'gpio', pin:18, label:'ปุ่มกด → GPIO18 → state'};
    case 'helper-return': return {kind:'map', symbol:'map', icon:'call', label:'map()', raw:vars.value.value, result:vars.return.value};
    case 'call-duty':
      if (before.vars.return) return {kind:'assign', symbol:'duty', icon:'call', label:'return → duty'};
      return {kind:'jump', symbol:'toDuty', icon:'call', label:'toDuty(raw)', target:'helper-open'};
    case 'helper-open': return {kind:'assign', icon:'call', label:after.stack.at(-1)};
    case 'setup-open':
    case 'loop-open': return {kind:'jump', icon:'call', label:after.stack[0]};
    case 'if': return {kind:'jump', symbol:'if', icon:'branch', label:vars.state.value === 'LOW' ? 'จริง → เข้า if' : 'เท็จ → ไป else', target:vars.state.value === 'LOW' ? 'high' : 'else'};
    case 'setup-serial': return {kind:'serial', symbol:'begin', icon:'serial', label:'Serial พร้อมที่ 115200 baud'};
    case 'print': return {kind:'serial', symbol:'println', icon:'serial', label:`${after.log.at(-1)} → Serial Monitor`, signal:after.log.at(-1)};
    default: return null;
  }
}

function midpoint(target) {
  if (!target) return null;
  const box = target.getBoundingClientRect();
  const element = target instanceof Range ? target.startContainer.parentElement : target;
  const list = element.closest('.cl-code-list')?.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  if (!box.width || !box.height || x < 0 || x > innerWidth || y < 0 || y > innerHeight) return null;
  if (list && (x < list.left || x > list.right || y < list.top || y > list.bottom)) return null;
  return {x, y};
}

function token(row, text) {
  const code = row?.querySelector('code');
  if (!text) return code;
  return [...(code?.querySelectorAll('span') ?? [])].find(el => el.textContent === text) ?? code;
}

function codeRange(code, offset, length) {
  const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (offset < node.length) {
      const range = document.createRange();
      range.setStart(node, offset);
      range.setEnd(node, offset + length);
      return range;
    }
    offset -= node.length;
  }
  return null;
}

function collectReads(root, before, after) {
  // Finishing delay and receiving a function result do not read the original arguments again.
  if (before.wait || after.effect?.resumed || (after.line === 'call-duty' && before.vars.return)) return [];
  const line = after.line === 'for-close' ? 'for-init' : after.line;
  const code = root.querySelector(`[data-line="${line}"] code`);
  if (!code) return [];
  const reads = new Map();
  const references = new Map(Object.entries(before.vars).filter(([,value])=>value.reference).map(([name,value])=>[value.reference,name]));
  for (const match of code.textContent.matchAll(/\b[A-Za-z_]\w*\b/g)) {
    const symbol = match[0];
    const name = references.get(symbol) ?? symbol;
    if (after.effect?.kind==='reference' && symbol===after.effect.symbol && match.index===code.textContent.indexOf(symbol)) continue;
    if (!Object.hasOwn(before.vars, name) || (reads.has(name) && name !== 'i')) continue;
    const variable = before.vars[name];
    reads.set(name, {name, value:variable.value, target:codeRange(code, match.index, name.length)});
  }
  return [...reads.values()];
}

export class StepMotion {
  constructor(root) {
    this.root = root;
    this.strip = root.querySelector('[data-step-effect]');
    this.memory = root.querySelector('[data-memory]');
    this.active = new Set();
    this.actors = new Set();
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    this.rate = normalPlaybackRate;
  }

  setSpeed(speed) {
    this.rate = normalPlaybackRate * speed;
    for (const animation of this.active) {
      if (animation.updatePlaybackRate) animation.updatePlaybackRate(this.rate);
      else animation.playbackRate = this.rate;
    }
  }

  get waitComplete() { return this.strip.dataset.waitState === 'complete'; }

  finished() {
    return Promise.allSettled([...this.active].map(animation => animation.finished));
  }

  cancel() {
    for (const animation of this.active) animation.cancel();
    for (const actor of this.actors) actor.remove();
    this.active.clear();
    this.waitAnimation = null;
    this.actors.clear();
    this.source?.classList.remove('cl-const-source');
    this.source = null;
  }

  reset() {
    this.cancel();
    for (const layer of this.root.querySelectorAll('[data-output-glow]')) {
      layer.getAnimations?.().forEach(animation => animation.cancel());
      layer.remove();
    }
    this.strip.hidden = true;
    delete this.strip.dataset.waitState;
    this.strip.replaceChildren();
  }

  prepare(before, after) {
    const effect = describeEffect(before, after);
    const reads = this.reduced.matches ? [] : collectReads(this.root, before, after);
    if (effect?.kind === 'assign' && !this.reduced.matches) {
      const previous = effect.source ?? (after.line === 'call-duty' ? 'return' : before.vars.raw ? 'raw' : null);
      const source = previous
        ? this.root.querySelector(`[data-register="${previous}"] [data-register-value]`)
        : token(this.root.querySelector('.cl-current'), String(after.vars.times?.value));
      const point = midpoint(source);
      if (point) {
        const memory = this.memory.getBoundingClientRect();
        effect.start = {x:point.x - memory.left, y:point.y - memory.top};
      }
    }
    this.strip.hidden = !effect;
    if (effect?.kind !== 'wait') delete this.strip.dataset.waitState;
    if (!effect) {
      this.strip.replaceChildren();
      return {effect, reads};
    }

    this.strip.dataset.kind = effect.kind;
    const progress = this.strip.querySelector('progress');
    if (effect.kind === 'wait' && !effect.wait && progress) {
      this.strip.dataset.waitState = 'complete';
      progress.value = progress.max;
      this.strip.querySelector('[data-effect-label]').textContent = effect.label;
      this.strip.querySelector('svg').outerHTML = icon(effect.icon);
      return {effect, reads};
    }

    this.strip.innerHTML = `${icon(effect.icon)}<strong data-effect-label>${esc(effect.label)}</strong>`;
    if (effect.kind === 'wait') {
      this.strip.dataset.waitState = effect.wait ? 'waiting' : 'complete';
      this.strip.insertAdjacentHTML('beforeend',
        `<progress class="cl-effect-track" aria-label="ความคืบหน้าของ delay()" max="${effect.duration}" value="${effect.wait ? 0 : effect.duration}"></progress>`,
      );
    }
    if (effect.kind === 'map') {
      this.strip.insertAdjacentHTML('beforeend', `
        <span class="cl-effect-map">
          <span>${effect.raw} / 4095<i style="--ratio:${effect.raw / 4095}"></i></span>
          <span aria-hidden="true">→</span>
          <span>${effect.result} / 255<i data-effect-fill style="--ratio:${effect.result / 255}"></i></span>
        </span>`);
    }
    if (effect.kind === 'write') {
      effect.previousFill = this.root.querySelector(`[data-led-pin="${effect.pin}"]`)?.getAttribute('fill');
    }
    return {effect, reads};
  }

  animate(element, frames, duration, delay = 0, fill = 'none') {
    if (!element?.animate) return null;
    const animation = element.animate(frames, {duration, delay, fill, easing:'ease-in-out'});
    animation.playbackRate = this.rate;
    this.active.add(animation);
    animation.finished.then(() => this.active.delete(animation), () => this.active.delete(animation));
    return animation;
  }

  startWait(duration, delay = 0) {
    const progress = this.strip.querySelector('progress');
    if (!progress?.animate) return false;
    if (this.active.has(this.waitAnimation) || progress.value >= duration) return true;

    const start = progress.value;
    const hand = this.strip.querySelector('[data-effect-hand]');
    const rotation = 360 * start / duration;
    const animation = this.reduced.matches
      ? this.animate(progress, [{opacity:1}, {opacity:1}], duration - start, delay)
      : this.animate(hand, [{transform:`rotate(${rotation}deg)`}, {transform:'rotate(360deg)'}], duration - start, delay, 'both');
    this.waitAnimation = animation;
    if (!animation) return false;

    const update = () => {
      if (animation.playState === 'idle') return;
      progress.value = Math.min(duration, start + Math.max(0, (animation.currentTime ?? 0) - delay));
      if (animation.playState !== 'finished') requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
    return true;
  }

  glowOutput(name) {
    const target = this.root.querySelector(`[data-output-target="${name}"]`);
    const receiver = target?.closest('.cl-output-receiver');
    if (!receiver) return;
    const bounds = target.getBoundingClientRect();
    const area = receiver.getBoundingClientRect();
    if (!bounds.width || !bounds.height || !area.width || !area.height) return;

    const old = receiver.querySelector(`[data-output-glow="${name}"]`);
    old?.getAnimations().forEach(animation => animation.cancel());
    old?.remove();

    // The receiver stays in place when the simulation redraws the SVG and the log.
    const layer = document.createElement('span');
    layer.dataset.outputGlow = name;
    layer.setAttribute('aria-hidden', 'true');
    layer.style.setProperty('--cl-glow-x', `${(bounds.left - area.left) / area.width * 100}%`);
    layer.style.setProperty('--cl-glow-y', `${(bounds.top - area.top) / area.height * 100}%`);
    layer.style.setProperty('--cl-glow-width', `${bounds.width / area.width * 100}%`);
    layer.style.setProperty('--cl-glow-height', `${bounds.height / area.height * 100}%`);
    receiver.append(layer);

    const duration = outputGlowRise + outputGlowHold + outputGlowFade;
    const animation = this.reduced.matches
      ? layer.animate([{opacity:1}, {opacity:1}], {duration:outputGlowHold})
      : layer.animate([
        {opacity:0, easing:'ease-out'},
        {opacity:1, offset:outputGlowRise / duration},
        {opacity:1, offset:(outputGlowRise + outputGlowHold) / duration, easing:'ease-in-out'},
        {opacity:0},
      ], {duration});
    const remove = () => layer.remove();
    animation.finished.then(remove, remove);
  }

  fly(from, to, {label, type, variable, delay = 0, duration = 345, onArrival} = {}) {
    const start = from instanceof Element ? midpoint(from) : from;
    const end = midpoint(to);
    if (!start || !end) {
      onArrival?.();
      return delay;
    }
    const actor = document.createElement('span');
    actor.className = 'cl-step-actor';
    actor.dataset.flight = type;
    if (variable) actor.dataset.variable = variable;
    actor.setAttribute('aria-hidden', 'true');
    if (type === 'key') actor.innerHTML = icon('key');
    else if (type === 'pulse') actor.innerHTML = icon('wave');
    else actor.textContent = label;
    actor.style.left = `${start.x}px`;
    actor.style.top = `${start.y}px`;
    document.body.append(actor);
    this.actors.add(actor);
    const dx = end.x - start.x, dy = end.y - start.y;
    const animation = this.animate(actor, [
      {transform:'translate(-50%, -50%) scale(.8)', opacity:0},
      {transform:'translate(-50%, -50%) scale(1)', opacity:1, offset:.17},
      {transform:`translate(-50%, -50%) translate(${dx}px, ${dy}px)`, opacity:1, offset:.9},
      {transform:`translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(.82) rotate(${type === 'key' ? 45 : 0}deg)`, opacity:0},
    ], duration, delay);
    const remove = () => { actor.remove(); this.actors.delete(actor); };
    const arrive = () => { remove(); onArrival?.(); };
    if (animation) animation.finished.then(arrive, remove);
    else arrive();
    return animation ? delay + duration : delay;
  }

  play(before, after, {effect, reads}) {
    const q = selector => this.root.querySelector(selector);
    const ledChanged = effect?.kind === 'write' && before.leds[effect.pin] !== after.leds[effect.pin];
    const outputName = effect?.destination ?? (effect?.kind === 'pin' ? `gpio-${effect.pin}`
      : ledChanged ? `led-${effect.pin}`
      : effect?.kind === 'serial' ? (effect.symbol === 'begin' ? 'serial-header' : 'serial-line')
      : null);
    const glow = () => { if (outputName) this.glowOutput(outputName); };
    const glowDock = () => this.glowOutput(`dock-${effect.pin}`);
    if (!Element.prototype.animate) return;
    if (this.reduced.matches) {
      glow();
      if (ledChanged && !midpoint(q(`[data-led-pin="${effect.pin}"]`))) glowDock();
      return;
    }
    const line = q('.cl-current');
    const origin = token(line, effect?.symbol);
    let readyAt = 0;
    for (const [index, read] of reads.entries()) {
      const destination = midpoint(read.target) ? read.target : origin;
      const source = q(`[data-register="${read.name}"] [data-register-value]`);
      const at = this.fly(source, destination, {
        label:read.value, type:'read', variable:read.name, delay:index * 45, duration:245,
      });
      readyAt = Math.max(readyAt, at);
    }
    for (const [name, variable] of Object.entries(after.vars)) {
      const previous = before.vars[name];
      if (previous?.value === variable.value && previous.scope === variable.scope) continue;
      const register = q(`[data-register="${name}"]`);
      let source = token(line, String(variable.value));
      if (effect?.start) {
        const memory = this.memory.getBoundingClientRect();
        source = {x:memory.left + effect.start.x, y:memory.top + effect.start.y};
      }
      if (effect?.kind === 'read') {
        const input = q(`[data-input-point="${effect.pin}"]`);
        source = midpoint(input) ? input : origin;
      }
      if (after.line === 'helper-return') source = this.strip.querySelector('[data-effect-fill]') ?? origin;
      const at = this.fly(source, register.querySelector('[data-register-value]'), {
        type:'value', label:variable.value, delay:readyAt + (effect?.kind === 'map' ? mapDuration : 0),
      });
      const nameTag = register.querySelector('[data-register-name]');
      if (!previous) this.animate(nameTag, [{opacity:0, transform:'translateX(-5px)'}, {opacity:1, transform:'translateX(0)'}], 180, 0, 'backwards');
      this.animate(register.querySelector('[data-register-value]'), [{opacity:0, transform:'scale(.7)'}, {opacity:1, transform:'scale(1)'}], 140, at, 'backwards');

      if (isConst(variable)) {
        const keyword = token(line, 'const');
        if (keyword) {
          this.source = keyword;
          keyword.classList.add('cl-const-source');
        }
        const lock = register.querySelector('[data-lock]');
        const clickAt = this.fly(keyword, lock, {type:'key', delay:80, duration:420});
        this.animate(lock.querySelector('[data-lock-shackle]'), [
          {transform:'translateY(-3px) rotate(-19deg)'},
          {transform:'translateY(0) rotate(0)'},
        ], 120, clickAt, 'backwards');
      }
    }
    if (!effect) return;

    const label = this.strip.querySelector('[data-effect-label]');
    const badge = this.strip.querySelector('svg');
    if (effect.kind === 'pin' || effect.kind === 'write') {
      const gpio = q(`[data-gpio-pin="${effect.pin}"], [data-input-point="${effect.pin}"]`);
      const led = q(`[data-led-pin="${effect.pin}"]`);
      const dock = q(`[data-dock-pin="${effect.pin}"] svg`);
      const destination = midpoint(gpio) ? gpio : label;
      const at = this.fly(origin, destination, {
        type:'value', label:effect.kind === 'write' ? effect.signal : `GPIO${effect.pin}`, duration:250, delay:readyAt,
        onArrival:effect.kind === 'pin' ? glow : undefined,
      });
      if (effect.kind === 'write') {
        const target = midpoint(led) ? led : dock;
        const arrival = this.fly(destination, target, {
          type:'pulse', delay:at, duration:225,
          onArrival:() => {
            glow();
            if (ledChanged && target === dock) glowDock();
          },
        });
        if (effect.previousFill && led) {
          this.animate(led, [{fill:effect.previousFill}, {fill:led.getAttribute('fill')}], 170, arrival, 'backwards');
        }
        this.animate(q(`[data-led-glow="${effect.pin}"]`), [
          {transform:'scale(.75)'}, {transform:'scale(1.2)'}, {transform:'scale(1)'},
        ], 210, arrival);
      }
      this.animate(badge, [{opacity:.4, transform:'translateX(-4px)'}, {opacity:1, transform:'translateX(0)'}], 190, readyAt);
    } else if (effect.kind === 'wait') {
      if (effect.wait) this.startWait(effect.wait, readyAt);
    } else if (effect.kind === 'map') {
      this.animate(this.strip.querySelector('[data-effect-fill]'), [{transform:'scaleX(0)'}, {transform:`scaleX(${effect.result / 255})`}], mapDuration, readyAt, 'backwards');
    } else if (effect.kind === 'jump' || outputName) {
      const target = effect.target ? q(`[data-line="${effect.target}"] code`) : outputName ? q(`[data-output-target="${outputName}"]`) : null;
      this.fly(origin, midpoint(target) ? target : label, {
        type:'value', label:effect.signal ?? effect.label, delay:readyAt,
        onArrival:outputName ? glow : undefined,
      });
    }
  }
}
