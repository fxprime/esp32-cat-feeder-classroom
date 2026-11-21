import { highlightLines } from '../vendor/code-highlight.js';

export const logicLesson = { id: 'logic', label: 'ตัวเปรียบเทียบ / Logic' };

const ticketVariables = [
  ['bool', 'hasCard', 'บัตรสมาชิก'],
  ['bool', 'hasPass', 'คูปอง'],
];

export const logicRules = {
  equal: {
    symbol: '==', label: 'เท่ากันไหม',
    condition: 'roomCode == 7', group: 'code',
    variables: [['int', 'roomCode', 'รหัสที่ใส่']],
    rule: 'เข้าได้เมื่อรหัสเป็นเลข 7 พอดี',
    tip: 'roomCode = 7 คือเก็บค่า 7 ส่วน roomCode == 7 คือถามว่าค่าที่เก็บไว้เท่ากับ 7 ไหม',
    test: ({roomCode}) => roomCode === 7,
  },
  and: {
    symbol: '&&', label: 'และ',
    condition: 'hasCard && hasPass', group: 'tickets', variables: ticketVariables,
    rule: 'กติกานี้ต้องมีทั้งบัตรสมาชิกและคูปอง',
    tip: 'ลองติ๊กทีละช่อง เปิดประตูได้เมื่อทั้งสองค่าเป็น true พร้อมกัน',
    test: ({hasCard, hasPass}) => hasCard && hasPass,
  },
  or: {
    symbol: '||', label: 'หรือ',
    condition: 'hasCard || hasPass', group: 'tickets', variables: ticketVariables,
    rule: 'กติกานี้ใช้บัตรสมาชิกหรือคูปองอย่างใดอย่างหนึ่งก็เข้าได้',
    tip: 'ลองติ๊กทั้งสองช่อง ผลยังเป็น true เพราะมีอย่างน้อยหนึ่งอย่าง',
    test: ({hasCard, hasPass}) => hasCard || hasPass,
  },
  not: {
    symbol: '!', label: 'กลับค่า',
    condition: '!isClosed', group: 'closed',
    variables: [['bool', 'isClosed', 'ปิดปรับปรุง']],
    rule: 'เข้าได้เมื่อห้องเปิดตามปกติ',
    tip: '! กลับค่าที่อยู่ด้านหลัง เมื่อ isClosed เป็น false นิพจน์ !isClosed จึงเป็น true',
    test: ({isClosed}) => !isClosed,
  },
};

export function logicHTML() {
  return `<div class="cl-panel-inner cl-logic" data-logic>
    <div class="cl-example-heading">
      <h2>เช็กเงื่อนไขที่ประตูห้องเกม</h2>
      <p>เลือกกติกา แล้วเปลี่ยนค่าด้านล่าง ดูว่าเงื่อนไขใน <code>if</code> ได้ <code>true</code> หรือ <code>false</code> และโปรแกรมทำบรรทัดไหนต่อ</p>
    </div>
    <div class="cl-logic-switch" role="group" aria-label="เลือกตัวดำเนินการ">${Object.entries(logicRules).map(([id, rule]) =>
      `<button type="button" data-logic-rule="${id}" aria-pressed="${id==='equal'}"><code>${rule.symbol.replaceAll('&','&amp;')}</code> ${rule.label}</button>`).join('')}</div>
    <div class="cl-logic-grid">
      <div class="cl-logic-inputs">
        <fieldset>
          <legend>ค่าที่โปรแกรมได้รับ</legend>
          <label data-logic-group="code">รหัสหน้าประตู
            <select data-logic-input="roomCode"><option>6</option><option>7</option><option>8</option></select>
          </label>
          <div data-logic-group="tickets" hidden>
            <label><input type="checkbox" data-logic-input="hasCard" checked> มีบัตรสมาชิก</label>
            <label><input type="checkbox" data-logic-input="hasPass"> มีคูปอง</label>
          </div>
          <label data-logic-group="closed" hidden><input type="checkbox" data-logic-input="isClosed"> ห้องกำลังปิดปรับปรุง</label>
        </fieldset>
        <p data-logic-rule-text></p>
        <div class="cl-logic-values" data-logic-values></div>
      </div>
      <div class="cl-logic-code">
        <div class="cl-logic-code-head"><span>เงื่อนไขใน C++ / Arduino</span><samp data-logic-bool>false</samp></div>
        <pre aria-label="ตัวอย่าง if และ else"><code class="hljs language-arduino" data-logic-code></code></pre>
      </div>
      <div class="cl-logic-output">
        <svg viewBox="0 0 240 136" aria-hidden="true">
          <rect width="240" height="136" rx="13" fill="#dbeafe"/>
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
        <div class="cl-logic-result" role="status" data-logic-result></div>
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
  let active = 'equal';

  function paint() {
    const rule = logicRules[active];
    const accepted = rule.test(values);
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.logicRule === active));
    for (const group of groups) group.hidden = group.dataset.logicGroup !== rule.group;
    root.dataset.logicOpen = String(accepted);
    root.querySelector('[data-logic-rule-text]').textContent = rule.rule;
    root.querySelector('[data-logic-tip]').textContent = rule.tip;
    root.querySelector('[data-logic-bool]').textContent = String(accepted);
    root.querySelector('[data-logic-result]').textContent = accepted
      ? 'true → เข้า if · ประตูเปิด'
      : 'false → เข้า else · ประตูปิด';
    root.querySelector('[data-logic-values]').innerHTML = rule.variables.map(([,name,label]) =>
      `<span>${label} <code>${name} = ${values[name]}</code></span>`).join('');

    const declarations = rule.variables.map(([type, name]) => `${type} ${name} = ${values[name]};`);
    const code = [...declarations, '', `if (${rule.condition}) {`,
      '  Serial.println("Access granted");', '} else {', '  Serial.println("Access denied");', '}'];
    const executing = declarations.length + (accepted ? 2 : 4);
    root.querySelector('[data-logic-code]').innerHTML = highlightLines(code.join('\n')).map((line,index) =>
      `<span${index===executing ? ' class="cl-logic-executed"' : ''}>${line || ' '}</span>`).join('');
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
