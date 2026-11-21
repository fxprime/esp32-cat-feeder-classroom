export const logicLesson = { id: 'logic', label: 'ตัวเปรียบเทียบ / Logic' };

const pubAge = 20;
const isOfAge = age => age >= pubAge;

export const logicRules = {
  equal: {
    symbol: '==', label: 'เท่ากันไหม',
    group: 'code',
    variables: ['roomCode'],
    checks: [['รหัสเท่ากับ 7', ({roomCode}) => roomCode === 7]],
    tip: 'roomCode = 7 คือเก็บค่า 7 ส่วน roomCode == 7 คือถามว่าค่าที่เก็บไว้เท่ากับ 7 ไหม',
    test: ({roomCode}) => roomCode === 7,
  },
  and: {
    symbol: '&&', label: 'และ',
    title: 'เช็กบัตรและอายุหน้าผับ',
    group: 'pub',
    variables: ['hasTicket', 'age'],
    checks: [['มีบัตรเข้า', ({hasTicket}) => hasTicket], [`อายุอย่างน้อย ${pubAge} ปี`, ({age}) => isOfAge(age)]],
    tip: `ลองเปลี่ยนอายุจาก ${pubAge-1} เป็น ${pubAge} ปี แล้วเอาบัตรออก ดูว่าประตูปิดอีกครั้งเมื่อเงื่อนไขข้อใดข้อหนึ่งเป็น false`,
    test: ({hasTicket, age}) => hasTicket && isOfAge(age),
  },
  or: {
    symbol: '||', label: 'หรือ',
    group: 'tickets',
    variables: ['hasCard', 'hasPass'],
    checks: [['มีบัตรสมาชิก', ({hasCard}) => hasCard], ['มีคูปอง', ({hasPass}) => hasPass]],
    tip: 'ลองติ๊กทั้งสองช่อง ผลยังเป็น true เพราะมีอย่างน้อยหนึ่งอย่าง',
    test: ({hasCard, hasPass}) => hasCard || hasPass,
  },
  not: {
    symbol: '!', label: 'กลับค่า',
    group: 'closed',
    variables: ['isClosed'],
    checks: [['ห้องปิดปรับปรุง', ({isClosed}) => isClosed]],
    tip: '! สลับจริงกับเท็จ เมื่อ “ห้องปิดปรับปรุง” เป็นเท็จ เงื่อนไข “ห้องไม่ได้ปิดปรับปรุง” จึงเป็นจริง',
    test: ({isClosed}) => !isClosed,
  },
};

export function logicHTML() {
  return `<div class="cl-panel-inner cl-logic" data-logic>
    <div class="cl-example-heading">
      <h2 data-logic-heading>เช็กเงื่อนไขที่ประตูห้องเกม</h2>
      <p>เปลี่ยนค่าตัวแปร แล้วดูทีละข้อว่าเงื่อนไขไหนจริง (true) หรือเท็จ (false) และสุดท้ายประตูจะเปิดไหม</p>
    </div>
    <div class="cl-logic-switch" role="group" aria-label="เลือกตัวดำเนินการ">${Object.entries(logicRules).map(([id, rule]) =>
      `<button type="button" data-logic-rule="${id}" aria-pressed="${id==='equal'}"><span class="cl-logic-symbol">${rule.symbol.replaceAll('&','&amp;')}</span> ${rule.label}</button>`).join('')}</div>
    <div class="cl-logic-grid">
      <div class="cl-logic-inputs">
        <fieldset>
          <legend>ค่าที่โปรแกรมได้รับ</legend>
          <label data-logic-group="code">รหัสหน้าประตู
            <select data-logic-input="roomCode"><option>6</option><option>7</option><option>8</option></select>
          </label>
          <div data-logic-group="pub" hidden>
            <label for="logic-ticket"><input id="logic-ticket" type="checkbox" data-logic-input="hasTicket" checked> มีบัตรเข้า</label>
            <label for="logic-age">อายุ (ปี)
              <select id="logic-age" data-logic-input="age"><option>${pubAge-1}</option><option>${pubAge}</option><option>${pubAge+1}</option></select>
            </label>
          </div>
          <div data-logic-group="tickets" hidden>
            <label><input type="checkbox" data-logic-input="hasCard" checked> มีบัตรสมาชิก</label>
            <label><input type="checkbox" data-logic-input="hasPass"> มีคูปอง</label>
          </div>
          <label data-logic-group="closed" hidden><input type="checkbox" data-logic-input="isClosed"> ห้องกำลังปิดปรับปรุง</label>
        </fieldset>
      </div>
      <div class="cl-logic-flow">
        <div class="cl-logic-row">
          <span class="cl-logic-step">ตัวแปร</span>
          <div class="cl-logic-chips" data-logic-values></div>
        </div>
        <div class="cl-logic-row">
          <span class="cl-logic-step">ถ้า</span>
          <div class="cl-logic-chips" data-logic-conditions></div>
        </div>
        <div class="cl-logic-row">
          <span class="cl-logic-step">แล้ว</span>
          <div class="cl-logic-chips">
            <span data-logic-bool class="cl-logic-verdict"></span>
            <span aria-hidden="true" class="cl-logic-arrow">→</span>
            <span class="cl-logic-result" role="status" data-logic-result></span>
          </div>
        </div>
      </div>
      <div class="cl-logic-output">
        <svg viewBox="0 0 240 136" aria-hidden="true">
          <rect width="240" height="136" rx="13" fill="#dbeafe"/>
          <text x="120" y="18" fill="#314c69" text-anchor="middle" font-size="10" font-weight="700" data-logic-venue>GAME ROOM</text>
          <path d="M27 119h186" stroke="#8ab2db" stroke-width="3" stroke-linecap="round"/>
          <path d="M59 118V48a10 10 0 0 1 10-10h102a10 10 0 0 1 10 10v70Z" fill="#314c69"/>
          <path d="M71 118V51h98v67Z" fill="#152a4b"/>
          <path d="M91 75h59v43H91Z" fill="#deb4fa" opacity=".23"/>
          <clipPath id="logic-gate-opening"><rect x="71" y="51" width="98" height="67"/></clipPath>
          <g clip-path="url(#logic-gate-opening)">
            <path data-logic-door="left" d="M71 51h48v67H71Z" fill="#92b7da"/>
            <path data-logic-door="right" d="M121 51h48v67h-48Z" fill="#abc9e6"/>
          </g>
          <rect x="101" y="24" width="38" height="12" rx="6" fill="#29415c"/>
          <circle class="cl-logic-lamp" cx="120" cy="30" r="4"/>
          <path d="M184 83h17v25h-17Z" fill="#4a6684"/>
          <path d="M189 89h7m-7 5h7m-7 5h7" stroke="#d7e9fc" stroke-width="1.5"/>
        </svg>
      </div>
    </div>
    <p class="cl-setting-note" data-logic-tip></p>
  </div>`;
}

export function initLogicLesson(root) {
  const buttons = [...root.querySelectorAll('[data-logic-rule]')];
  const groups = [...root.querySelectorAll('[data-logic-group]')];
  const inputs = [...root.querySelectorAll('[data-logic-input]')];
  const inputValue = input => input.type === 'checkbox' ? input.checked : Number(input.value);
  const values = Object.fromEntries(inputs.map(input => [input.dataset.logicInput, inputValue(input)]));
  const heading = root.querySelector('[data-logic-heading]');
  const gameTitle = heading.textContent;
  const venue = root.querySelector('[data-logic-venue]');
  const result = root.querySelector('[data-logic-result]');
  let active = 'equal';

  function paint() {
    const rule = logicRules[active];
    const accepted = rule.test(values);
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.logicRule === active));
    for (const group of groups) group.hidden = group.dataset.logicGroup !== rule.group;
    root.dataset.logicOpen = String(accepted);
    heading.textContent = rule.title ?? gameTitle;
    venue.textContent = active === 'and' ? 'PUB' : 'GAME ROOM';
    root.querySelector('[data-logic-tip]').textContent = rule.tip;
    root.querySelector('[data-logic-bool]').textContent = accepted ? 'จริง · true' : 'เท็จ · false';
    const verdict = accepted ? 'เข้าได้' : 'เข้าไม่ได้';
    if (result.textContent !== verdict) result.textContent = verdict;
    root.querySelector('[data-logic-values]').innerHTML = rule.variables.map(name =>
      `<span class="cl-logic-variable">${name} = <b>${values[name]}</b></span>`).join('');

    const operator = `<span class="cl-logic-operator"><span class="cl-logic-symbol">${rule.symbol.replaceAll('&','&amp;')}</span> ${rule.label}</span>`;
    const checks = rule.checks.map(([label, check]) => {
      const passed = check(values);
      return `<span class="cl-logic-check"><span>${label}</span> <b data-passed="${passed}">${passed ? 'true' : 'false'}</b></span>`;
    });
    root.querySelector('[data-logic-conditions]').innerHTML = active === 'not' ? operator + checks[0] : checks.join(operator);
  }

  for (const button of buttons) button.addEventListener('click', () => {
    active = button.dataset.logicRule;
    paint();
  });
  for (const input of inputs) input.addEventListener('change', () => {
    values[input.dataset.logicInput] = inputValue(input);
    paint();
  });
  paint();
}
