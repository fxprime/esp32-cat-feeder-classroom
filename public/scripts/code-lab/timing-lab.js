import {loadDriveControllers} from './drive-controller.js';
import {carPose, createDriveRace, driveKinds, initialDriveFrame} from './drive-model.js';
import {createDriveScene} from './drive-scene.js';

const screenRate=.62;
const reducedStep=200;
const seconds=time=>(time/1000).toFixed(2);

function setText(element,text) {
  if (element.textContent!==text) element.textContent=text;
}

const dodgeLabels=['','หักขวาออกจากเลน','หักซ้ายกลับเข้าหาเลนเดิม','หักขวาให้รถตรงกับเลน'];

function carLabel(car,time) {
  if (car.mode==='idle') return 'พร้อมวิ่ง';
  if (car.mode==='collision') return car.hitWhileWaiting ? 'ชนตอนโค้ดรออยู่' : 'ชนกล่อง';
  if (car.mode==='turning') return `เลี้ยวซ้าย ${seconds(time-car.curveStartedAt)} / ${seconds(car.curveDuration)} วิ`;
  if (car.mode==='dodging') return dodgeLabels[car.dodgePhase];
  if (car.mode==='off-track') return 'ออกนอกลู่';
  if (car.mode==='braking') return 'เลนข้างมีสิ่งกีดขวาง · กำลังเบรก';
  if (car.mode==='stopped') return 'หยุดก่อนชน';
  return `วิ่งเลน ${car.lane+1}`;
}

function explainResult(frame,phase) {
  if (phase==='loading') return 'กำลังโหลดโค้ด C++ ของรถทั้งสองคัน…';
  if (phase==='error') return 'ตัวรัน C++ ขัดข้อง กดเริ่มวิ่งเพื่อลองอีกครั้ง';
  if (phase==='ready') return 'กดเริ่มวิ่ง รถจะวิ่งวน ผ่านเส้นเดิมได้หลายรอบ';
  const {delay,millis,lastDrop,drops,time}=frame;
  if (lastDrop===null) return 'กดปล่อยกล่องได้ทุกช่วง ลองกดอีกครั้งหลังตั้งต้น แล้วเทียบทางตรงกับตอนค้างเลี้ยว';
  if (time-lastDrop<540) return `ครั้งที่ ${drops} · กล่องกำลังตกในเลนข้างหน้ารถ`;
  const dodgedSinceDrop=car=>car.lastDodgeAt!==null && car.lastDodgeAt>=lastDrop;
  if (delay.hitWhileWaiting && delay.hitAt>=lastDrop && dodgedSinceDrop(millis) && millis.hitAt===null) return `รถ delay() ชนระหว่างรอที่ ${seconds(delay.hitAt)} วิ ส่วนรถ millis() อ่านเจอกล่องและสั่งหลบ`;
  if ([delay,millis].every(car=>dodgedSinceDrop(car) && !car.dodgePhase && car.hitAt===null && !car.offTrack)) return 'ทั้งสองคันอ่านเจอกล่องและหลบกลับมาได้';
  return `ปล่อยกล่องแล้ว ${drops} ครั้ง จังหวะอ่านและพื้นที่ในเลนข้างมีผลต่อการหลบ`;
}

function paintTrace(display,car,time,task) {
  const waiting=task==='loop'&&car.waitingUntil!=null;
  const sourceLine=task==='loop'?car.traceLine:car.motorLine;
  const visits=task==='loop'?car.lineVisits:car.motorVisits;
  display.trace.dataset.waiting=String(waiting);
  for (const [line,row] of display.rows) {
    const recent=time-(visits.get(line)??-Infinity)<=110;
    row.toggleAttribute('data-recent',recent);
  }
  const visitedAt=visits.get(sourceLine);
  const status=waiting?'รอที่บรรทัด':'ล่าสุดบรรทัด';
  setText(display.traceStatus,visitedAt===undefined ? 'พร้อมรันโค้ด' : `${status} ${sourceLine} · ${seconds(visitedAt)} วิ`);
  if (display.activeLine===sourceLine && display.waiting===waiting) return;
  display.rows.get(display.activeLine)?.removeAttribute('aria-current');
  display.activeLine=sourceLine;
  display.waiting=waiting;
  const row=display.rows.get(sourceLine);
  row?.setAttribute('aria-current','step');
  if (!row) {
    display.scroll.scrollTop=0;
    return;
  }
  const view=display.scroll.getBoundingClientRect();
  const lineBox=row.getBoundingClientRect();
  if (lineBox.top<view.top || lineBox.bottom>view.bottom) {
    display.scroll.scrollTop+=lineBox.top-view.top-view.height*.45;
  }
}

export function initTimingLab(root) {
  const q=selector=>root.querySelector(selector);
  const playButton=q('[data-drive-play]');
  const dropButton=q('[data-drive-drop]');
  const resetButton=q('[data-drive-reset]');
  const clock=q('[data-drive-time]');
  const result=q('[data-drive-result]');
  const turnInput=q('[data-drive-turn]');
  const turnValue=q('[data-drive-turn-value]');
  const getTurnMs=()=>Number(turnInput.value);
  const tasks=['loop','motor'];
  let activeTask='loop';
  const panels=Object.fromEntries(driveKinds.map(kind=>{
    const panel=q(`[data-drive-kind=${kind}]`);
    const traces=Object.fromEntries(tasks.map(task=>{
      const trace=q(`[data-drive-traces=${task}] [data-drive-trace=${kind}]`);
      return [task,{
        trace,traceStatus:trace.querySelector('[data-drive-trace-status]'),scroll:trace.querySelector('.cl-drive-trace-scroll'),
        rows:new Map([...trace.querySelectorAll('[data-drive-code-line]')].map(row=>[Number(row.dataset.driveCodeLine),row])),
      }];
    }));
    return [kind,{
      panel,state:panel.querySelector('[data-drive-state]'),read:panel.querySelector('[data-drive-read]'),
      lap:panel.querySelector('[data-drive-lap]'),
      dot:q(`[data-drive-map=${kind}]`),
      scene:createDriveScene(q(`[data-drive-canvas=${kind}]`),kind),
      traces,pwm:['left','right'].map(side=>({
        meter:panel.querySelector(`[data-pwm=${side}]`),
        text:panel.querySelector(`[data-pwm-value=${side}]`),
      })),
    }];
  }));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let phase='ready',race=null,firmware;
  let revision=0,request=0,lastFrame=0,effectTime=0;
  let advancing=Promise.resolve();

  function draw() {
    const frame=race?.frame() ?? initialDriveFrame();
    const {time}=frame;
    setText(clock,`${seconds(time)} วิ`);
    dropButton.disabled=!race||phase==='loading'||phase==='error';
    resetButton.disabled=phase==='ready';
    playButton.disabled=phase==='loading';
    root.dataset.drops=String(frame.drops);
    setText(result,explainResult(frame,phase));
    for (const [kind,display] of Object.entries(panels)) {
      const car=frame[kind];
      const pose=carPose(car);
      display.scene({...frame,markers:true,animate:!reduced.matches});
      display.dot.setAttribute('cx',pose.z.toFixed(3));
      display.dot.setAttribute('cy',pose.x.toFixed(3));
      display.panel.dataset.mode=car.mode;
      display.panel.dataset.lane=String(car.lane+1);
      display.panel.dataset.waiting=String(car.waitingUntil!=null);
      setText(display.state,carLabel(car,time));
      setText(display.lap,`รอบ ${car.lap}`);
      const read=car.hitWhileWaiting ? `ชนขณะรอ delay(${car.waitDuration})`
        : car.waitingUntil!=null ? `delay(${car.waitDuration}) · ถึง ${seconds(car.waitingUntil)} วิ`
        : car.lastReadAt!=null ? `อ่านล่าสุด ${seconds(car.lastReadAt)} วิ` : '—';
      setText(display.read,read);
      [car.leftPwm,car.rightPwm].forEach((duty,index)=>{
        const {meter,text}=display.pwm[index];
        if (meter.value!==duty) meter.value=duty;
        setText(text,String(duty));
      });
      paintTrace(display.traces[activeTask],car,time,activeTask);
    }
    setText(playButton,phase==='loading'?'กำลังโหลด…':phase==='running'?'Ⅱ พักภาพ'
      : phase==='paused' ? (reduced.matches?'เดินเวลา +0.2 วิ':'▶ วิ่งต่อ') : '▶ เริ่มวิ่ง');
  }

  function pause() {
    cancelAnimationFrame(request);
    if (phase==='running') {
      phase='paused';
      draw();
    }
  }

  function advance(target) {
    const current=race;
    advancing=advancing.then(async()=>{
      if (!current || current!==race) return;
      await current.advanceTo(target);
      if (current!==race) return;
      draw();
    }).catch(error=>{
      if (current!==race) return;
      phase='error';
      draw();
      console.error(error);
    });
    return advancing;
  }

  async function tick(now) {
    const elapsed=Math.max(0,Math.min(65,now-lastFrame));
    lastFrame=now;
    if (!document.hidden) {
      effectTime+=elapsed*screenRate;
      await advance(effectTime);
    }
    if (phase==='running') request=requestAnimationFrame(tick);
  }

  function start() {
    phase='running';
    effectTime=race.time;
    lastFrame=performance.now();
    draw();
    request=requestAnimationFrame(tick);
  }

  async function newRace() {
    const token=++revision;
    race=null;
    phase='loading';
    draw();
    try {
      firmware??=loadDriveControllers();
      const next=await createDriveRace(await firmware,getTurnMs);
      if (token!==revision) return;
      race=next;
      effectTime=0;
      phase='paused';
      if (reduced.matches || root.closest('[hidden]') || document.hidden) draw();
      else start();
    } catch (error) {
      firmware=null;
      if (token!==revision) return;
      phase='error';
      draw();
      console.error(error);
    }
  }

  playButton.addEventListener('click',()=>{
    if (phase==='running') pause();
    else if (phase!=='paused') void newRace();
    else if (reduced.matches) {
      effectTime=Math.max(effectTime,race.time)+reducedStep;
      void advance(effectTime);
    } else start();
  });
  dropButton.addEventListener('click',()=>{
    if (!race) return;
    race.drop();
    draw();
  });
  turnInput.addEventListener('input',()=>setText(turnValue,`${getTurnMs().toLocaleString('en-US')} ms`));
  for (const task of tasks) {
    q(`[data-drive-task=${task}]`).addEventListener('click',()=>{
      activeTask=task;
      for (const option of tasks) {
        q(`[data-drive-task=${option}]`).setAttribute('aria-pressed',String(option===task));
        q(`[data-drive-traces=${option}]`).hidden=option!==task;
      }
      draw();
    });
  }
  resetButton.addEventListener('click',()=>{
    revision+=1;
    cancelAnimationFrame(request);
    phase='ready';
    race=null;
    draw();
  });
  reduced.addEventListener('change',()=>{
    if (reduced.matches) pause();
    draw();
  });
  document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();});
  draw();
  return pause;
}
