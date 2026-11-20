import { ionHealth, ionLimits, ionMilestones } from './protection-model.js';

const art = `<svg class="lp-ion-art" viewBox="0 0 450 170" aria-hidden="true">
  <defs>
    <pattern id="ion-grid" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1" fill="#416487"/>
    </pattern>
  </defs>
  <rect width="450" height="170" rx="15" fill="url(#ion-grid)"/>
  <path d="M36 139h372" stroke="#426182" stroke-width="1.5"/>
  <rect x="36" y="44" width="220" height="70" rx="22" class="ion-shell"/>
  <rect x="47" y="52" width="195" height="54" rx="14" fill="#142d47"/>
  <path d="M245 61h12q9 0 9 9v17q0 9-9 9h-12Z" fill="#9eb0c9"/>
  <path d="M58 64h170M58 79h170M58 94h170" class="ion-electrode"/>
  <path d="M58 64h170M58 79h170M58 94h170" class="ion-carriers"/>
  <path d="M58 71h170M58 86h170" stroke="#a9bdd9" stroke-width="2" stroke-dasharray="3 4"/>
  <g class="ion-wear">
    <ellipse cx="102" cy="64" rx="13" ry="5"/><ellipse cx="146" cy="79" rx="18" ry="4"/>
    <ellipse cx="193" cy="94" rx="14" ry="5"/><ellipse cx="212" cy="64" rx="9" ry="4"/>
    <circle cx="80" cy="82" r="4"/><circle cx="171" cy="64" r="4"/>
  </g>
  <g class="ion-damage">
    <path d="M114 64l13 10-10 8 16 12m29-15 11-8 12 6 9-12" stroke="#fda4af" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="126" cy="79" r="19" fill="#ef4444" opacity=".26"/>
    <circle cx="177" cy="72" r="17" fill="#ef4444" opacity=".22"/>
  </g>
  <path d="M268 79h63" stroke="#819ab8" stroke-width="4" stroke-dasharray="4 6" stroke-linecap="round"/>
  <rect x="333" y="48" width="79" height="62" rx="12" fill="#24415f" stroke="#547699" stroke-width="2"/>
  <rect x="349" y="63" width="47" height="22" rx="4" fill="#152d48"/>
  <circle cx="372.5" cy="74" r="4.5" class="ion-charge-led"/>
  <path d="M349 96h47" stroke="#6c89a9" stroke-width="2" stroke-linecap="round"/>
  <g class="ion-warning" fill="none" stroke="#f43f5e">
    <rect x="28" y="36" width="236" height="86" rx="30" stroke-width="8" opacity=".35"/>
    <rect x="35" y="43" width="222" height="72" rx="23" stroke-width="2"/>
  </g>
  <path class="ion-charge-scan" d="M308 79h20" fill="none" stroke="#fb7185" stroke-width="4" stroke-linecap="round"/>
  <g class="ion-block">
    <circle cx="301" cy="79" r="20" fill="#861b39" stroke="#fda4af" stroke-width="2"/>
    <path d="M295 78v-4a6 6 0 0 1 12 0v4m-14 0h16v11h-16Z" fill="none" stroke="#fff1f2" stroke-width="2" stroke-linejoin="round"/>
  </g>
  <text x="146" y="155" text-anchor="middle">เซลล์ 18650</text>
  <text x="369" y="155" text-anchor="middle">BQ25308</text>
</svg>`;

const stages = {
  normal: 'กำลังจ่ายไฟ',
  limit: 'ผ่านจุดตัด',
  wear: 'เสี่ยงเสื่อม',
  blocked: 'ระงับชาร์จ',
  damage: 'เสี่ยงเสียหายถาวร'
};

export const ionCondition = `
  <section class="lp-ion" id="lp-ion" aria-labelledby="lp-ion-title" tabindex="-1">
    <div class="lp-ion-top">
      <h3 id="lp-ion-title">18650 · ฉากจำลอง</h3>
      <div class="lp-ion-transport">
        <button type="button" class="power-action" id="lp-ion-play">เล่นแอนิเมชัน</button>
        <button type="button" id="lp-ion-reset">เริ่มใหม่</button>
      </div>
    </div>
    <div class="lp-ion-screen">
      <div class="lp-ion-meters">
        <div><span>แรงดันเซลล์</span><strong id="lp-ion-volts">4.20 V</strong></div>
        <div class="lp-ion-state"><span id="lp-ion-status" role="status"></span><strong id="lp-ion-charge"></strong></div>
      </div>
      <div class="lp-ion-picture">${art}</div>
    </div>
    <div class="lp-ion-outputs">
      <div class="lp-ion-protected"><span>มีวงจรป้องกัน</span><strong id="lp-ion-protected"></strong></div>
      <div><span>ต่อโหลดตรง</span><strong id="lp-ion-direct"></strong></div>
    </div>
    <div class="lp-ion-range" aria-hidden="true">
      <div class="lp-ion-track"><div class="lp-ion-cursor"></div></div>
      <div class="lp-ion-scale"><span>4.20 V</span><span>1.45 V</span></div>
    </div>
    <input id="lp-ion-scrub" type="range" min="0" max="100" step="1" value="0" aria-label="ย้อนหรือเลื่อนจังหวะแอนิเมชัน 18650">
    <div class="lp-ion-jumps" role="group" aria-label="เล่นแต่ละช่วง">
      ${ionMilestones.map((frame, i) => `
        <button type="button" data-lp-jump="${frame}" data-ion-stage="${i}" aria-pressed="false">
          <strong>${['3.00 V','< 2.50 V','< 2.00 V','ฝืนใช้ต่อ'][i]}</strong>
          <span>${['ตัดไฟ','เสี่ยงเสื่อม','ล็อกชาร์จ','เสี่ยงเสียหาย'][i]}</span>
        </button>`).join('')}
    </div>
    <details class="lp-ion-references">
      <summary>ที่มาของเกณฑ์</summary>
      <p>3.00 V เป็นจุดตัดในฉาก · 2.50 V เป็นจุดสิ้นสุดการคายประจุของ P28A · 2.00 V เป็นเกณฑ์ขาลงโดยทั่วไปของ BQ25308 · ภายในเซลล์เป็นภาพจำลองความเสี่ยง</p>
      <p class="lp-ion-sources">
        <a href="https://www.molicel.com/wp-content/uploads/INR18650P28A-V2-80093.pdf" target="_blank" rel="noopener">Molicel P28A</a>
        <a href="https://www.ti.com/lit/ds/symlink/bq25308.pdf" target="_blank" rel="noopener">TI BQ25308</a>
        <a href="https://www.nature.com/articles/srep30248" target="_blank" rel="noopener">งานวิจัยคายประจุเกิน</a>
      </p>
    </details>
  </section>`;

export function bindIonCondition(root) {
  const voltage = root.querySelector('#lp-ion-volts');
  const protectedOutput = root.querySelector('#lp-ion-protected');
  const directOutput = root.querySelector('#lp-ion-direct');
  const status = root.querySelector('#lp-ion-status');
  const chargeStatus = root.querySelector('#lp-ion-charge');
  return (model, frame) => {
    const reading = model.voltage;
    const state = ionHealth(reading, frame);
    const label = stages[state];
    const position = (ionLimits.full - reading) / (ionLimits.full - ionLimits.sceneEnd);
    root.dataset.ionHealth = state;
    root.dataset.ionCut = String(model.protectedOpen);
    protectedOutput.textContent = `${model.protectedVoltage.toFixed(2)} V · ${Math.round(model.protectedCurrent)} mA`;
    directOutput.textContent = `${reading.toFixed(2)} V · ${Math.round(model.directCurrent)} mA`;
    root.style.setProperty('--ion-wear-level', Math.min(1, Math.max(0, (ionLimits.dischargeEnd - reading) * 1.8)));
    root.style.setProperty('--ion-position', `${position * 100}%`);
    voltage.textContent = `${reading.toFixed(2)} V`;
    if (status.textContent !== label) {
      status.textContent = label;
      chargeStatus.textContent = reading < ionLimits.inhibit
        ? '0 mA · ชาร์จ'
        : '';
    }
  };
}
