import {servoState} from './model.js';
import {createServoFeedback} from './servo-feedback-model.js';

const icons={
  decoder:'<rect x="13" y="8" width="38" height="34" rx="6" fill="#e0f2fe"/><path d="M5 17h8m-8 16h8m38-16h8m-8 16h8M22 3v5m18-5v5M22 42v5m18-5v5" stroke="#7ea2bc" stroke-width="3"/><path d="M20 30h6V18h11v12h8" fill="none" stroke="#0284c7" stroke-width="2.6"/>',
  compare:'<circle cx="32" cy="25" r="20" fill="#eef2ff" stroke="#b7c6ed" stroke-width="2"/><path d="M19 18h10m-5-5v10m14 11h10" stroke="#6366b9" stroke-width="2.8"/><path d="m29 28 6-6" stroke="#6366b9" stroke-width="2"/>',
  control:'<rect x="9" y="7" width="46" height="36" rx="7" fill="#e8e6ff"/><path d="M14 33h8l7-19 10 25 7-13h5" fill="none" stroke="#7964c2" stroke-width="2.8" stroke-linejoin="round"/>',
  driver:'<rect x="9" y="6" width="46" height="38" rx="7" fill="#fff1d9"/><path d="M22 15v22m20-22v22M22 25h20m-20-10-6-5m26 5 6-5" stroke="#b77924" stroke-width="2.4"/><circle cx="32" cy="25" r="5" fill="#fff1d9" stroke="#b77924" stroke-width="2"/>',
  motor:'<path d="M4 25h9m38 0h10" stroke="#67798e" stroke-width="4"/><rect x="13" y="9" width="38" height="32" rx="12" fill="#d0dce7" stroke="#8ca1b6" stroke-width="2"/><path d="M22 18h19m-19 14h19" stroke="#8ca1b6" stroke-width="2"/><circle cx="32" cy="25" r="5" fill="#ecf3f8"/>',
  sensor:'<path d="M6 30h8l5-8 8 16 8-16 8 16 5-8h10M40 5 28 23m0 0 2-8m-2 8 8-3" fill="none" stroke="#8b67b6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
};
const icon=name=>`<svg viewBox="0 0 64 50" aria-hidden="true">${icons[name]}</svg>`;
const signed=value=>`${value>0?'+':''}${value.toFixed(1)}`;
const arrow=(a,b,feedback=false)=>`<path data-flow="${feedback?'feedback':'forward'}" d="${a}" marker-end="url(#${b})"/>`;

export function initServoFeedback() {
  const dialog=document.querySelector('#servo-loop-dialog');
  const q=selector=>dialog.querySelector(selector);
  const all=selector=>dialog.querySelectorAll(selector);
  const mainPulse=document.querySelector('#servo-pulse');
  const model=createServoFeedback(Number(mainPulse.value));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let full=false, paused=false, request=0, lastTime=0, accumulated=0;
  let frame=model.frame();

  q('[data-servo-nodes]').innerHTML=`
   <article class="sf-node sf-decoder" data-node="decode">${icon('decoder')}<h3>ชิปอ่านพัลส์</h3><p>แปลงความกว้างเป็นมุม</p><strong data-sf-target>90.0°</strong><small>ค่าอ้างอิงของชิป</small></article>
   <article class="sf-node sf-error" data-node="compare">${icon('compare')}<h3>เทียบมุม</h3><p>เป้าหมาย − มุมจริง</p><strong data-sf-error>0.0°</strong><small>ค่าคลาดเคลื่อน e</small></article>
   <article class="sf-node sf-control" data-node="control">${icon('control')}<h3>ตัวควบคุมตำแหน่ง</h3><p>รวม P + I + D</p><strong data-sf-command>0%</strong><small>ใช้ PID ในแบบจำลองนี้</small></article>
   <article class="sf-node sf-driver" data-node="driver">${icon('driver')}<h3>ไดรเวอร์มอเตอร์</h3><p>H-bridge จ่ายไฟให้มอเตอร์</p><strong data-sf-direction>รักษามุม</strong><div class="sf-drive-meter" aria-hidden="true"><i data-sf-drive></i></div><small>PWM ขับมอเตอร์ + ทิศทาง</small></article>
   <article class="sf-node sf-motor" data-node="motor">${icon('motor')}<h3>มอเตอร์ + เฟือง</h3><p>ส่งแรงหมุนไปยังเพลา</p><strong data-sf-motion>หยุดหมุน</strong><small>มอเตอร์ DC ภายในเซอร์โว</small></article>
   <article class="sf-node sf-shaft" data-node="shaft"><svg viewBox="0 0 64 50" aria-hidden="true"><rect x="12" y="18" width="40" height="28" rx="6" fill="#b4daf4" stroke="#6ba2c4" stroke-width="2"/><circle cx="32" cy="20" r="10" fill="#f0f8ff" stroke="#6ba2c4" stroke-width="2"/><path d="M32 20V5" stroke="#0284c7" stroke-width="6" stroke-linecap="round"/><circle cx="32" cy="20" r="3" fill="#64748b"/></svg><h3>มุมจริงที่เพลา</h3><strong data-sf-actual>90.0°</strong><small>ดูแขนเซอร์โวในภาพขยายด้านล่าง</small></article>
   <article class="sf-sensor" data-node="sensor">${icon('sensor')}<div><h3>ตัววัดมุมที่เพลา</h3><p>โพเทนชิโอมิเตอร์ส่งค่าแทนมุมจริงกลับให้ชิป</p></div><strong data-sf-feedback>90.0°</strong></article>`;

  function render() {
    const pulse=Number(mainPulse.value);
    const state=servoState(pulse);
    const exact=state.angle;
    q('[data-sf-pulse-input]').value=String(pulse);
    q('[data-sf-pulse-value]').textContent=`${pulse.toLocaleString('en-US')} µs`;
    q('[data-sf-angle-input]').value=String(Math.round(exact));
    q('[data-sf-angle-value]').textContent=`${Math.round(exact)}°`;
    q('[data-sf-code]').textContent=`servo.write(${Math.round(exact)});`;
    q('[data-sf-formula]').textContent=`1,000 + ${exact.toFixed(0)} × 1,000 ÷ 180 ≈ ${pulse.toLocaleString('en-US')} µs`;
    const high=40+pulse/4000*500;
    q('[data-sf-wave]').setAttribute('d',`M24 63H40V22H${high}V63H524`);
    q('[data-sf-width]').setAttribute('x2',String(high));
    q('[data-sf-width-end]').setAttribute('x1',String(high));
    q('[data-sf-width-end]').setAttribute('x2',String(high));
    q('[data-sf-width-label]').setAttribute('x',String((40+high)/2));
    q('[data-sf-width-label]').textContent=`${(pulse/1000).toFixed(2)} ms`;
    all('[data-sf-target]').forEach(el=>el.textContent=`${frame.target.toFixed(1)}°`);
    q('[data-sf-error]').textContent=`${signed(frame.error)}°`;
    q('[data-sf-command]').textContent=`${Math.abs(frame.output*100).toFixed(0)}%`;
    const direction=frame.output>.015?'เพิ่มมุม':frame.output<-.015?'ลดมุม':'รักษามุม';
    q('[data-sf-direction]').textContent=direction;
    q('[data-sf-motion]').textContent=frame.settled?'หยุดหมุน':Math.abs(frame.velocity)<.3?'เริ่มหมุน':frame.velocity>0?'หมุนเพิ่มมุม':'หมุนลดมุม';
    q('[data-sf-drive]').style.transform=`scaleX(${Math.abs(frame.output)})`;
    all('[data-sf-actual]').forEach(el=>el.textContent=`${frame.actual.toFixed(1)}°`);
    q('[data-sf-feedback]').textContent=`${frame.actual.toFixed(1)}°`;
    q('[data-sf-arm]').setAttribute('transform',`rotate(${frame.actual-90})`);
    q('[data-sf-target-arm]').setAttribute('transform',`rotate(${frame.target-90})`);
    for(const term of ['p','i','d']) q(`[data-sf-${term}]`).textContent=signed(frame[term]*100)+'%';
    dialog.dataset.phase=frame.settled?'settled':'driving';
    dialog.dataset.direction=direction;
    dialog.dataset.paused=String(paused);
    q('[data-sf-pause]').textContent=paused?'เล่นต่อ':'พักภาพ';
    const status=paused?'พักภาพไว้ ลากแถบเพื่อตั้งคำสั่งใหม่ แล้วกดเล่นต่อ'
      :frame.settled?'มุมจริงใกล้เป้าหมายแล้ว จึงลดการขับมอเตอร์ลง และคอยวัดมุมต่อ'
       :`มุมจริงยังห่างจากเป้าหมาย → ตัวควบคุมสั่ง${direction} → วัดมุมใหม่วนกลับไปเทียบ`;
    if(q('[data-sf-status]').textContent!==status) q('[data-sf-status]').textContent=status;
  }

  function tick(now) {
    const elapsed=Math.min(80,Math.max(0,now-lastTime));
    lastTime=now;
    accumulated+=elapsed*.0007;
    while(accumulated>=.01) {
      frame=model.step(.01);
      accumulated-=.01;
    }
    render();
    if(dialog.open&&!paused&&!document.hidden&&!frame.settled)request=requestAnimationFrame(tick);
    else request=0;
  }
  function run() {
    if(request||!dialog.open||paused||document.hidden||frame.settled)return;
    lastTime=performance.now();
    request=requestAnimationFrame(tick);
  }
  function command(pulse) {
    mainPulse.value=String(pulse);
    mainPulse.dispatchEvent(new Event('input',{bubbles:true}));
    frame=model.command(Number(mainPulse.value));
    render();
    run();
  }
  function drawConnections() {
    const host=q('[data-sf-map]');
    const bounds=host.getBoundingClientRect();
    if(!bounds.width||!dialog.open)return;
    const svg=q('[data-sf-paths]');
    svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
    const r=name=>{
      const box=q(`[data-node="${name}"]`).getBoundingClientRect();
      return {x:box.left-bounds.left,y:box.top-bounds.top,w:box.width,h:box.height};
    };
    const names=['decode','compare','control','driver','motor','shaft'];
    const paths=[];
    for(let index=0;index<names.length-1;index++) {
      const a=r(names[index]),b=r(names[index+1]);
      let path;
      if(Math.abs(a.y-b.y)<8) {
        const right=b.x>a.x;
        path=`M${right?a.x+a.w:a.x} ${a.y+a.h/2}H${right?b.x-5:b.x+b.w+5}`;
      } else {
        const x=a.x+a.w/2;
        path=`M${x} ${a.y+a.h}V${b.y-5}`;
      }
      paths.push(arrow(path,'sf-forward-head'));
    }
    const shaft=r('shaft'),sensor=r('sensor'),compare=r('compare');
    const x=shaft.x+shaft.w/2;
    const sensorX=sensor.x+sensor.w*.75;
    const y=sensor.y-13;
    paths.push(arrow(`M${x} ${shaft.y+shaft.h}V${y}H${sensorX}V${sensor.y-5}`,'sf-feedback-head',true));
    const isMobile=matchMedia('(max-width: 680px)').matches;
    const cx=compare.x+compare.w*(isMobile ? .23 : .5);
    const returnPath=isMobile
      ?`M${sensor.x} ${sensor.y+sensor.h/2}H5V${compare.y+compare.h+12}H${cx}V${compare.y+compare.h+5}`
      :`M${sensor.x} ${sensor.y+sensor.h/2}H${cx}V${compare.y+compare.h+5}`;
    paths.push(arrow(returnPath,'sf-feedback-head',true));
    q('[data-sf-connectors]').innerHTML=paths.join('');
  }

  document.querySelector('#servo-why').addEventListener('click',()=>{
    frame=model.command(Number(mainPulse.value));
    paused=false;
    render();
    dialog.showModal();
    drawConnections();
    run();
  });
  q('[data-sf-pulse-input]').addEventListener('input',event=>command(Number(event.target.value)));
  q('[data-sf-angle-input]').addEventListener('input',event=>command(Math.round(1000+Number(event.target.value)/180*1000)));
  for(const button of all('[data-sf-view]'))button.addEventListener('click',()=>{
    full=button.dataset.sfView==='full';
    for(const option of all('[data-sf-view]'))option.setAttribute('aria-pressed',String((option.dataset.sfView==='full')===full));
    q('[data-sf-upstream]').hidden=!full;
    render();
    drawConnections();
  });
  q('[data-sf-pause]').addEventListener('click',()=>{
    paused=!paused;
    if(paused){cancelAnimationFrame(request);request=0;}
    render();run();
  });
  q('[data-sf-disturb]').addEventListener('click',()=>{
    frame=model.disturb();
    render();run();
  });
  q('[data-sf-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{cancelAnimationFrame(request);request=0;});
  dialog.addEventListener('keydown',event=>event.stopPropagation());
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(request);request=0;}else run();
  });
  new ResizeObserver(drawConnections).observe(q('[data-sf-map]'));
  reduced.addEventListener('change',()=>render());
}
