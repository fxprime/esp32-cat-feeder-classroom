import { highlightLines } from './vendor/code-highlight.js';
import { buildScopeExample, feederScopeDetails, scopeDetails } from './block-types.js';
import { checkFeederInput, FEEDER_LIMITS, FEEDER_MESSAGES } from './feeder/model.js';

const editor = document.querySelector('#scope-code');
const fields = {
  label: document.querySelector('#scope-type'),
  input: document.querySelector('#scope-input'),
  output: document.querySelector('#scope-output'),
  example: document.querySelector('#scope-example'),
};
const controls = new Map();
const test = document.querySelector('#scope-feeder-controls');
const humidity = document.querySelector('#scope-rh');
const empty = document.querySelector('#scope-empty');
const unreadable = document.querySelector('#scope-unreadable');
const result = document.querySelector('#scope-result');
let activeScope, details, ranges, rows;

function selectScope(id) {
  if (id === activeScope) return;
  controls.get(activeScope)?.setAttribute('aria-pressed', 'false');
  controls.get(id).setAttribute('aria-pressed', 'true');
  activeScope = id;

  const { start, end } = ranges.get(id);
  for (const [index, row] of rows.entries()) {
    row.classList.toggle('is-scope-active', index >= start && index <= end);
    row.classList.toggle('is-scope-boundary', index === start || index === end);
  }
  for (const [name, field] of Object.entries(fields)) {
    field.textContent = details[id][name];
  }
}

function showExample(kind) {
  const feeder = kind === 'feeder';
  const built = buildScopeExample(kind);
  details = feeder ? feederScopeDetails : scopeDetails;
  ranges = built.ranges;
  activeScope = undefined;
  controls.clear();
  editor.setAttribute('aria-label', feeder ? 'โค้ดตัวอย่าง canDispense' : 'โค้ดตัวอย่าง updateGate');
  document.querySelector('#scope-code-title').textContent = feeder ? 'ตัดสินใจก่อนเปิดฝาถังอาหาร' : 'ฟังก์ชันไม้กั้นอัตโนมัติ';
  document.querySelector('#scope-footnote').textContent = feeder
    ? 'ฟังก์ชันนี้คืนผลให้ผู้เรียก เครื่องจะใช้ผลนี้ก่อนส่งเสียงหรือขยับฝาถัง'
    : 'ตัวอย่างแสดงเฉพาะฟังก์ชัน โดยตั้งขาไฟและเซอร์โวไว้แล้วใน setup()';
  test.hidden = !feeder;

  rows = highlightLines(built.lines.map(line => line.code).join('\n')).map((highlighted, index) => {
    const line = built.lines[index];
    const row = document.createElement('div');
    row.className = 'scope-row';
    row.dataset.scope = line.scope;
    if (line.edge) row.dataset.edge = line.edge;

    const number = document.createElement('span');
    number.className = 'scope-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = index + 1;
    row.append(number);

    const code = document.createElement('code');
    // The syntax highlighter escapes the fixed C++ source before styling it.
    code.innerHTML = highlighted;
    if (line.edge === 'open') {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'scope-line-trigger';
      button.setAttribute('aria-label', `สำรวจ ${details[line.scope].label} บรรทัด ${index + 1}`);
      button.setAttribute('aria-controls', 'scope-readout');
      button.setAttribute('aria-pressed', 'false');
      button.append(code);
      controls.set(line.scope, button);
      row.append(button);
    } else row.append(code);
    return row;
  });
  editor.replaceChildren(...rows);
  for (const button of document.querySelectorAll('[data-scope-kind]')) {
    button.setAttribute('aria-pressed', String(button.dataset.scopeKind === kind));
  }
  selectScope(feeder ? 'function' : 'if');
}

function selectFromRow(event) {
  const row = event.target.closest('.scope-row');
  if (row) selectScope(row.dataset.scope);
}
editor.addEventListener('pointerover', event => {
  if (event.pointerType === 'mouse') selectFromRow(event);
});
editor.addEventListener('focusin', selectFromRow);
editor.addEventListener('click', selectFromRow);
for (const button of document.querySelectorAll('[data-scope-kind]')) {
  button.addEventListener('click', () => showExample(button.dataset.scopeKind));
}
for (const control of [humidity, empty, unreadable]) {
  control.addEventListener('input', () => {
    humidity.disabled = unreadable.checked;
    document.querySelector('#scope-rh-value').textContent = unreadable.checked ? 'อ่านไม่ได้' : `${humidity.value}% RH`;
    result.textContent = 'ค่าเปลี่ยนแล้ว ลองเรียกฟังก์ชันอีกครั้ง';
  });
}
document.querySelector('#scope-run').addEventListener('click', () => {
  const issue = checkFeederInput(unreadable.checked ? null : Number(humidity.value), empty.checked ? FEEDER_LIMITS.emptyCm : 10);
  selectScope(issue ? 'if' : 'else');
  result.textContent = issue ? `return false · ${FEEDER_MESSAGES[issue]}` : 'return true · ไปขั้นส่งเสียงเตือนก่อนเปิดฝา';
});
showExample('feeder');
