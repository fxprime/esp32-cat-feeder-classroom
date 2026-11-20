import {lessons,askAi} from './beginner-mistakes-data.js';
import {highlightLines} from './vendor/code-highlight.js';

const type = document.body.dataset.mistakes;
const examples = lessons[type];
const root = document.querySelector('[data-mistake-lab]');
root.innerHTML = `
  <nav class="dm-topics" aria-label="เลือกตัวอย่างข้อผิดพลาด"></nav>
  <section class="cl-panel-inner dm-panel" id="dm-case" aria-labelledby="dm-title">
    <header class="cl-example-heading">
      <span class="cl-kicker" data-phase></span>
      <h2 id="dm-title" data-title></h2>
      <p data-intro></p>
    </header>
    <div class="dm-columns">
      <section class="dm-card dm-editor" aria-labelledby="dm-file">
        <div class="dm-card-heading">
          <h3 id="dm-file" data-file></h3>
          <button type="button" data-locate></button>
        </div>
        <div class="dm-lines" data-lines tabindex="0" aria-label="โค้ดตัวอย่างพร้อมหมายเลขบรรทัด"></div>
      </section>
      <section class="dm-card dm-terminal" aria-labelledby="dm-output-title">
        <div class="dm-card-heading">
          <h3 id="dm-output-title" data-output-title></h3>
          <span class="dm-state" data-terminal-state></span>
        </div>
        <p class="dm-category" data-category></p>
        <pre tabindex="0" aria-label="ผลตัวอย่าง" data-output></pre>
      </section>
    </div>
    <div class="dm-findings" data-findings hidden></div>
    <form class="dm-form">
      <fieldset>
        <legend>เลือกวิธีแก้ แล้วดูผล</legend>
        <div class="dm-choices" data-choices></div>
      </fieldset>
      <div class="dm-actions">
        <button class="dm-primary" type="submit" disabled data-check>ตรวจวิธีแก้</button>
        <button type="button" data-reset>เริ่มตัวอย่างใหม่</button>
      </div>
      <p data-result class="dm-status" role="status"></p>
    </form>
    <a class="dm-source" data-forum target="_blank" rel="noopener noreferrer" hidden>ดูกรณีคล้ายกันบน Arduino Forum ↗</a>
  </section>
  <section class="cl-panel-inner dm-ai" data-ai aria-labelledby="dm-ai-title" hidden>
    <div class="cl-example-heading">
      <h2 id="dm-ai-title">เอา error ไปถาม AI</h2>
      <p>เรียงข้อมูลตามนี้ แล้วใช้คำถามจากตัวอย่างที่เลือกเป็นต้นแบบ</p>
    </div>
    <ol class="dm-ai-steps">
      <li><strong>ทำอะไรอยู่</strong><span>บอกว่าโปรเจกต์ทำอะไรและควรได้ผลแบบไหน</span></li>
      <li><strong>ใช้บอร์ดอะไร รันที่ไหน</strong><span>ระบุรุ่นบอร์ด บอร์ดจริงหรือ Wokwi แล้วบอก IDE ระบบปฏิบัติการ และเวอร์ชัน ESP32 Core หรือไลบรารีที่เกี่ยวข้อง</span></li>
      <li><strong>เกิดอะไรขึ้น ตอนไหน</strong><span>บอกว่ากด Verify, Upload หรือรันแล้วเจอปัญหา พร้อมสิ่งที่ลองไปแล้ว</span></li>
      <li><strong>แนบ Error กับโค้ด</strong><span>กด Copy error messages ใน Arduino IDE แล้วส่งเป็นข้อความพร้อมโค้ดที่ทำให้เกิดปัญหา</span></li>
      <li><strong>บอกว่าอยากให้ช่วยอะไร</strong><span>ขอให้ชี้ข้อความแรกที่เกี่ยวข้อง อธิบายสาเหตุ และบอกว่าจะแก้และทดสอบอย่างไร</span></li>
    </ol>
    <label for="dm-copy-text" data-prompt-label></label>
    <textarea id="dm-copy-text" data-copy-text rows="9" readonly></textarea>
    <div class="dm-actions">
      <button type="button" data-copy="error">คัดลอก Error</button>
      <button class="dm-primary" type="button" data-copy="prompt">คัดลอกคำถามพร้อมโค้ด</button>
    </div>
    <p class="dm-status" data-copy-status role="status"></p>
    <p class="dm-tip">ลบรหัสผ่าน Wi-Fi และ API key ก่อนส่ง พอได้คำตอบ ให้ลองแก้ทีละจุด ทดสอบซ้ำ แล้วส่ง error ใหม่กลับไปถ้ายังติด</p>
  </section>
`;

const q = selector => root.querySelector(selector);
const put = (selector,text) => { q(selector).textContent = text; };
const topics = q('.dm-topics');
let example;
let repaired = false;
let located = false;

for (const [index,info] of examples.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.topic = info.id;
  button.textContent = `${(type === 'read' ? 1 : lessons.read.length + 1) + index}. ${info.label}`;
  button.setAttribute('aria-controls','dm-case');
  button.addEventListener('click',()=>{ if (example !== info) select(info); });
  topics.append(button);
}

function renderCode() {
  const fixed = repaired && example.fixed;
  const lines = highlightLines(fixed || example.broken,'cpp');
  const body = q('[data-lines]');
  body.innerHTML = lines.map((html,index)=>{
    const line = index + 1;
    const focus = located && !repaired && line === example.line;
    const scope = located && !repaired && example.scope?.includes(line);
    const changed = fixed && (example.fixedLines ?? [example.line]).includes(line);
    return `<div class="dm-line" data-line="${line}"${focus?' data-focus':''}${scope?' data-scope':''}${changed?' data-changed':''}>
      <span aria-hidden="true">${line}</span><code class="hljs language-arduino">${html || ' '}</code></div>`;
  }).join('');
}

function renderOutput() {
  const compileError = example.phase === 'คอมไพล์' && !repaired;
  const upload = example.phase === 'อัปโหลด';
  const terminal = upload ? 'Output · Upload' : compileError ? 'Output · Verify' : (example.expectedTitle ?? 'Serial Monitor · ผลตัวอย่าง');
  put('[data-output-title]',terminal);
  put('[data-terminal-state]',repaired ? 'หลังแก้' : 'ก่อนแก้');
  const output = q('[data-output]');
  output.textContent = repaired ? example.expected : example.output;
  q('.dm-terminal').dataset.repaired = String(repaired);
  q('.dm-terminal').dataset.compileError = String(compileError);
  q('.dm-terminal').dataset.uploadError = String(upload && !repaired);
  annotationResize.disconnect();
  q('.dm-annotation')?.remove();
  const diagnostic = compileError && example.output.match(/^([^:\n]+)(:\d+)(:\d+)(?=: )/);
  if (!diagnostic) return;
  output.textContent = example.output.slice(diagnostic[0].length + 2);
  const annotation = document.createElement('figure');
  annotation.className = 'dm-annotation';
  annotation.innerHTML = `
    <code class="dm-coordinate"><span></span><span></span><span></span></code>
    <svg class="dm-leaders" aria-hidden="true"><path/><path/><path/></svg>
    <figcaption class="dm-callouts">
      <span><strong>ชื่อไฟล์</strong><small>เปิดไฟล์นี้</small></span>
      <span><strong>บรรทัด</strong><small></small></span>
      <span><strong>คอลัมน์</strong><small></small></span>
    </figcaption>
  `;
  const parts = [...annotation.querySelector('.dm-coordinate').children];
  diagnostic.slice(1).forEach((value,index)=>{ parts[index].textContent = value; });
  const labels = [...annotation.querySelector('.dm-callouts').children];
  labels[1].lastElementChild.textContent = `ไปบรรทัด ${diagnostic[2].slice(1)}`;
  labels[2].lastElementChild.textContent = `ตำแหน่งที่ ${diagnostic[3].slice(1)} ในบรรทัด`;
  output.before(annotation);
  annotationResize.observe(annotation);
  annotationResize.observe(annotation.querySelector('.dm-coordinate'));
  drawLeaders(annotation);
}

function drawLeaders(annotation) {
  const bounds = annotation.getBoundingClientRect();
  const origins = [...annotation.querySelector('.dm-coordinate').children].map(part=>part.getBoundingClientRect());
  const targets = [...annotation.querySelector('.dm-callouts').children].map(label=>label.getBoundingClientRect());
  annotation.querySelectorAll('path').forEach((path,index)=>{
    const origin = origins[index];
    const target = targets[index];
    const x1 = origin.left + origin.width / 2 - bounds.left;
    const y1 = origin.bottom - bounds.top + 3;
    const x2 = target.left + target.width / 2 - bounds.left;
    const y2 = target.top - bounds.top;
    const middle = (y1 + y2) / 2;
    path.setAttribute('d',`M ${x1} ${y1} C ${x1} ${middle} ${x2} ${middle} ${x2} ${y2}`);
  });
}

const annotationResize = new ResizeObserver(()=>{
  const annotation = q('.dm-annotation');
  if (annotation) drawLeaders(annotation);
});

function renderFindings() {
  const findings = q('[data-findings]');
  if (!located || repaired) {
    findings.hidden = true;
    return;
  }
  findings.hidden = false;
  if (example.id === 'read-error') {
    findings.textContent = 'เครื่องหมาย ^ ชี้ตำแหน่งชื่อ snacks ที่ compiler หาไม่เจอ ส่วน exit status 1 อยู่ท้าย Output และสรุปว่าคอมไพล์ไม่ผ่าน ให้เริ่มจาก error แรกที่อยู่ด้านบน';
    return;
  }
  findings.textContent = example.scope
    ? 'แถบสีฟ้าคือบล็อก if ตั้งแต่ { ถึง } ส่วนบรรทัดพิมพ์อยู่ด้านนอก ชื่อ treats ที่ประกาศข้างในจึงใช้ตรงนี้ไม่ได้'
    : `แถบที่ไฮไลต์คือบรรทัด ${example.line} ลองเทียบโค้ดกับผลตัวอย่างก่อนเลือกวิธีแก้`;
}

function select(info) {
  example = info;
  repaired = false;
  located = false;
  for (const button of topics.children) button.setAttribute('aria-pressed',String(button.dataset.topic === example.id));
  put('[data-phase]',example.phase);
  put('[data-category]',`ประเภท · ${example.category}`);
  put('[data-title]',example.title);
  put('[data-intro]',example.intro);
  put('[data-file]',example.file);
  const locate = q('[data-locate]');
  locate.textContent = example.scope ? 'ส่องคู่ปีกกา { }' : `ดูบรรทัด ${example.line}`;
  locate.hidden = !example.line;
  locate.disabled = false;
  const options = example.choices.map((label,index)=>{
    const option = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'fix';
    input.value = String(index);
    option.append(input,label);
    return option;
  });
  q('[data-choices]').replaceChildren(...options);
  q('[data-check]').disabled = true;
  put('[data-result]','');
  delete q('[data-result]').dataset.tone;
  const forum = q('[data-forum]');
  forum.hidden = !example.forum;
  if (example.forum) forum.href = example.forum;
  q('[data-ai]').hidden = type !== 'read';
  put('[data-copy-status]','');
  if (type === 'read') {
    put('[data-prompt-label]',`คำถามตัวอย่าง · ${example.label}`);
    q('[data-copy-text]').value = askAi(example);
    q('[data-copy-text]').scrollTop = 0;
  }
  renderCode();
  q('[data-lines]').scrollTop = 0;
  renderOutput();
  renderFindings();
}

q('[data-locate]').addEventListener('click',()=>{
  located = true;
  renderCode();
  renderFindings();
  q('[data-lines]').scrollTop = Math.max(0,q(`[data-line="${example.line}"]`).offsetTop - 92);
});
q('.dm-form').addEventListener('change',()=>{
  q('[data-check]').disabled = false;
  if (repaired) {
    repaired = false;
    q('[data-locate]').disabled = false;
    renderCode();
    renderOutput();
    renderFindings();
  }
  put('[data-result]','');
});
q('.dm-form').addEventListener('submit',event=>{
  event.preventDefault();
  const chosen = new FormData(event.currentTarget).get('fix');
  if (chosen === null) return;
  repaired = Number(chosen) === example.answer;
  put('[data-result]',repaired ? example.solved : example.hint);
  q('[data-result]').dataset.tone = repaired ? 'success' : 'hint';
  q('[data-locate]').disabled = repaired;
  renderCode();
  renderOutput();
  renderFindings();
});
q('[data-reset]').addEventListener('click',()=>select(example));

root.addEventListener('click',async event=>{
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  const current = example;
  const text = button.dataset.copy === 'error' ? current.output : askAi(current);
  const field = q('[data-copy-text]');
  try {
    await navigator.clipboard.writeText(text);
    if (current === example) put('[data-copy-status]',button.dataset.copy === 'error' ? 'คัดลอก Error แล้ว' : 'คัดลอกคำถามพร้อมโค้ดแล้ว');
  } catch {
    if (current !== example) return;
    field.value = text;
    field.focus();
    field.select();
    put('[data-copy-status]','เลือกข้อความให้แล้ว กด Ctrl+C หรือ ⌘C เพื่อคัดลอก');
  }
});

root.addEventListener('keydown',event=>{
  if (event.target.closest('[data-lines], [data-output], [data-copy-text]') && ['ArrowLeft','ArrowRight'].includes(event.key)) event.stopPropagation();
});
select(examples[0]);
document.documentElement.dataset.mistakeLabReady = 'true';
