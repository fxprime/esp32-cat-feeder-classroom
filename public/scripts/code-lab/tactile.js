export function tactileSVG(pressed=false, attributes='') {
  return `<svg viewBox="0 0 150 150" ${attributes} aria-hidden="true" style="--press-offset:${pressed?7:0}px"><g stroke="#94a3b8" stroke-width="7" stroke-linecap="round"><path d="M36 45H19V35M114 45h17V35M36 105H19v10M114 105h17v10"/></g><rect x="28" y="28" width="94" height="94" rx="10" fill="#242b35" stroke="#0f172a" stroke-width="3"/><rect x="32" y="30" width="86" height="84" rx="9" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/><path d="M35 49v-13h14m52 0h13v13M35 95v13h14m52 0h13V95" fill="none" stroke="#f8fafc" stroke-width="4"/><circle cx="75" cy="78" r="31" fill="#111827"/><g class="cl-tactile-cap"><circle cx="75" cy="70" r="30" fill="#374151" stroke="#111827" stroke-width="3"/><ellipse cx="70" cy="60" rx="18" ry="13" fill="#4b5563"/><circle cx="75" cy="70" r="21" fill="none" stroke="#64748b" stroke-width="1"/></g><path d="M30 135h90m-90-5v10m90-10v10" fill="none" stroke="#64748b"/><text x="75" y="148" text-anchor="middle" fill="#475569" font-size="11">12 × 12 mm</text></svg>`;
}

export function tactileControl(attribute) {
  return `<div class="cl-tactile-control"><button type="button" class="cl-tactile" ${attribute} aria-label="กดสวิตช์ GPIO18 ค้างไว้" aria-pressed="false">${tactileSVG()}</button><div><strong>Tactile switch · GPIO18</strong><p>กดค้างแล้วปล่อย · เมาส์ / สัมผัส / Space</p><output data-input-label>ปล่อย · HIGH</output></div></div>`;
}

export function bindTactile(button, onChange) {
  let pressed=false;
  const set=value=>{if(pressed===value)return;pressed=value;button.setAttribute('aria-pressed',String(value));onChange(value);};
  const release=()=>set(false);
  button.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;button.setPointerCapture(e.pointerId);set(true);});
  for(const event of ['pointerup','pointercancel','lostpointercapture','blur'])button.addEventListener(event,release);
  button.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();set(true);}});
  button.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();release();}});
  window.addEventListener('blur',release);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
  return release;
}
