import {feederTimingObservations} from '../public/scripts/code-lab/feeder-timing.js';
import assert from 'node:assert/strict';
import {TimingMachine} from '../public/scripts/code-lab/timing-machine.js';
import {LessonMachine,syntaxExample} from '../public/scripts/code-lab/model.js';
import {readFile} from 'node:fs/promises';
import firmware from '../public/scripts/code-lab/drive-firmware.mjs';
import {driveCode} from '../public/scripts/code-lab/drive-code.js';
import {createDriveController} from '../public/scripts/code-lab/drive-controller.js';
import {carPose, createDriveRace, driveCourse, driveKinds, driveTrack, heightAt, laneOffset, lapLength, trackPoint} from '../public/scripts/code-lab/drive-model.js';
import {checkDriveFirmwareSource} from './build-drive-firmware.mjs';
import {buildProgram,examples} from '../public/scripts/code-lab/content.js';
import {lessonHTML} from '../public/scripts/code-lab/render.js';
import {logicLesson,logicRules} from '../public/scripts/code-lab/logic-lesson.js';
import {highlightCode,highlightLines} from '../public/scripts/vendor/code-highlight.js';
import {mapValue} from '../public/scripts/code-lab/map-model.js';
import {indexExecutionScopes} from '../public/scripts/code-lab/scope-view.js';
function until(m,test,max=500){for(let i=0;i<max;i++){const s=m.step();if(test(s))return s;}throw new Error('Expected execution state was not reached');}
const b=new LessonMachine('blink');let s=until(b,s=>s.line==='wait-on'&&s.wait>0);assert.equal(s.leds[23],255);assert.equal(s.time,0);s=b.step();assert.equal(s.time,500);assert.equal(s.leds[23],255);s=b.step();assert.equal(s.leds[23],0);s=until(b,s=>s.loopCount===3);assert.equal(s.setupCount,1);assert.equal(s.time,2000);
const c=new LessonMachine('condition');until(c,s=>s.line==='read-button');c.setInputs({button:true});s=until(c,s=>s.line==='low');assert.equal(s.vars.state.value,'HIGH');assert.equal(s.leds[23],0);s=until(c,s=>s.line==='high');assert.equal(s.vars.state.value,'LOW');assert.equal(s.leds[23],255);
const a=new LessonMachine('sensor',{}, {raw:2048});until(a,s=>s.line==='read-raw');a.setInputs({raw:4095});s=until(a,s=>s.line==='write-duty');assert.equal(s.vars.raw.value,2048);assert.equal(s.vars.duty.value,127);assert.equal(s.leds[23],127);assert.deepEqual(s.log,[]);assert.deepEqual(s.stack,['loop()']);s=a.step();assert.deepEqual(s.log,['2048']);s=until(a,s=>s.line==='write-duty'&&s.loopCount===2);assert.equal(s.vars.raw.value,4095);assert.equal(s.leds[23],255);
const f=new LessonMachine('for',{delay:250}),pins=[];for(let i=0;i<100;i++){s=f.step();if(s.line==='high')pins.push(Object.entries(s.leds).find(([,v])=>v)?.[0]);if(s.line==='loop-close')break;}assert.deepEqual(pins,['23','22','21']);assert.equal(s.time,750);assert(Object.values(s.leds).every(v=>v===0));assert.deepEqual(s.pins,{21:'OUTPUT',22:'OUTPUT',23:'OUTPUT'});
for(const id of examples.filter(e=>!['timing','serial','function',logicLesson.id].includes(e.id)).map(e=>e.id)){
 const p=buildProgram(id);assert.equal(syntaxExample(p).error,null);assert(p.lines.some(l=>l.id==='setup-open'));assert(p.lines.some(l=>l.id==='loop-open'));
 const machine=new LessonMachine(id), history=[machine.snapshot()];
 for(let i=0;i<50;i++){
  machine.setInputs({raw:i*81,button:i%3===0});
  history.push(machine.step());
 }
 while(history.length>1){
  history.pop();
  assert.deepEqual(machine.rewind(),history.at(-1),`${id} restores recorded state`);
 }
 assert.equal(machine.canRewind,false);
}
assert.equal(logicRules.equal.test({roomCode:7}),true);
assert.equal(logicRules.equal.test({roomCode:6}),false);
for(const [hasCard,hasPass,and,or] of [
 [false,false,false,false],[false,true,false,true],[true,false,false,true],[true,true,true,true],
]){
 const tickets={hasCard,hasPass};
 assert.equal(logicRules.and.test(tickets),and);
 assert.equal(logicRules.or.test(tickets),or);
}
assert.equal(logicRules.not.test({isClosed:true}),false);
assert.equal(logicRules.not.test({isClosed:false}),true);
assert.deepEqual(feederTimingObservations(450), {delay:null,millis:500});
assert.deepEqual(feederTimingObservations(1050), {delay:1100,millis:1100});
const branch=new LessonMachine('sensor');
until(branch,s=>s.line==='read-raw');
branch.setInputs({raw:4095});
branch.rewind();
assert.equal(branch.step().vars.raw.value,4095);
assert.equal(until(branch,s=>s.line==='write-duty').leds[23],255);
assert(syntaxExample(buildProgram('blink'),'semicolon').error);assert(syntaxExample(buildProgram('blink'),'brace').error);
const scopesFor=id=>indexExecutionScopes(buildProgram(id).lines);
const conditionalScopes=scopesFor('condition');
assert.equal(conditionalScopes.get('if').label,'loop()');
assert.equal(conditionalScopes.get('high').label,'loop() › if');
assert.deepEqual([...conditionalScopes.get('high').lines],['if','high','else']);
assert.equal(conditionalScopes.get('low').label,'loop() › else');
assert.deepEqual([...conditionalScopes.get('low').lines],['else','low','if-close']);
assert.equal(conditionalScopes.get('if-close').label,'loop()');
const arrayScopes=scopesFor('for');
assert.deepEqual([...arrayScopes.get('pins').lines],['pins']);
assert.equal(arrayScopes.get('setup-pin').label,'setup() › for');
assert.equal(scopesFor('function-void').get('cat-feed-add').label,'giveTreats()');
assert.equal(scopesFor('sensor').get('helper-return').label,'toDuty()');
const html=lessonHTML();assert.equal((html.match(/role="tabpanel"/g)||[]).length,8);assert.equal((html.match(/hidden="until-found"/g)||[]).length,9);assert(html.includes('focusgroup="tablist nomemory"'));
// The library parses fresh arbitrary source, including tokens spanning rows.
const source='/* a comment\ncontinues */\nlong result = map(123, 0, 4095, 0, 255);\nSerial.println("<unsafe>");';
const highlighted=highlightCode(source);assert(highlighted.includes('hljs-comment'));assert(highlighted.includes('hljs-built_in'));assert(highlighted.includes('&lt;unsafe&gt;'));assert(!highlighted.includes('<unsafe>'));
for(const row of highlightLines(source))assert.equal((row.match(/<span\b/g)||[]).length,(row.match(/<\/span>/g)||[]).length);
const mapping=(value,inMin=0,inMax=4095,outMin=0,outMax=255)=>mapValue({value,inMin,inMax,outMin,outMax}).result;
assert.equal(mapping(0),0);assert.equal(mapping(4095),255);assert.equal(mapping(2048),127);
assert.equal(mapping(2048,0,4095,255,0),128); // Truncate the quotient before adding outMin.
assert.equal(mapping(75,100,0,0,200),50);assert.equal(mapping(15,0,10,0,100),150);
assert.equal(mapping(-1,0,10,0,3),0);assert.equal(mapping(7,0,10,42,42),42);
assert.throws(()=>mapping(5,5,5),/ต่างกัน/);assert.throws(()=>mapping(NaN),/จำนวนเต็ม/);
assert(html.includes('id="map-dialog"'));assert(html.includes('data-map-open'));assert.equal((html.match(/class="cl-tactile"/g)||[]).length,1);
assert(html.includes('data-drive-canvas'));
assert.deepEqual([...html.matchAll(/data-timing-choice="([^"]+)" aria-expanded="false"/g)].map(match=>match[1]),['timing-delay','timing-millis','comparison']);
assert.equal((html.match(/data-timing-view="[^"]+" hidden/g)||[]).length,3);
assert(html.includes('data-drive-drop disabled'));
const startPose=trackPoint(driveTrack.start);
const finishPose=trackPoint(driveTrack.start+lapLength);
assert(Math.hypot(startPose.x-finishPose.x,startPose.z-finishPose.z)<1e-7);
assert(trackPoint(driveTrack.straight+3).yaw<0);
assert(trackPoint(lapLength-3).yaw<-Math.PI);
assert.doesNotMatch(driveCode.millis,/\bdelay\s*\(/);
checkDriveFirmwareSource();
const bytes=await readFile(new URL('../public/scripts/code-lab/drive-firmware.wasm',import.meta.url));
const loadTiming=async()=>[firmware,bytes];
async function timingUntil(machine,test){
 for(let i=0;i<120;i++){
  const state=await machine.step();
  if(test(state))return state;
 }
 throw new Error('Expected timing sketch state was not reached');
}

const serial=new TimingMachine('serial',loadTiming);
assert.equal(serial.program.meta.file,'07_serial_print.ino');
const printLabel=await timingUntil(serial,state=>state.line==='serial-print-label');
assert.deepEqual(Object.fromEntries(Object.entries(printLabel.vars).map(([name,{value}])=>[name,value])),{raw:2056,volts:1.657,status:'OK'});
assert.equal(printLabel.serialText,'ADC = ');
const printRaw=await serial.step();
assert.equal(printRaw.serialText,'ADC = 2056');
assert.equal(printRaw.serialChunk,'2056');
const printVolts=await timingUntil(serial,state=>state.line==='serial-println-volts');
assert.equal(printVolts.serialText,'ADC = 2056 | V = 1.66\n');
const printStatus=await timingUntil(serial,state=>state.line==='serial-println-status');
assert.equal(printStatus.serialText,'ADC = 2056 | V = 1.66\nStatus = OK\n');
const formatted=await serial.step();
assert.equal(formatted.serialChunk,'ADC=2056 | V=1.66 | OK\n');
assert.equal(formatted.serialText,printStatus.serialText+formatted.serialChunk);
assert.deepEqual(serial.rewind(),printStatus);
assert.deepEqual(await serial.step(),formatted);
assert(html.includes('data-tab="serial"'));
assert(html.includes('cl-serial-expanded'));

assert.deepEqual([...html.matchAll(/data-function-choice="([^"]+)"/g)].map(match=>match[1]),['function-void','function-return','function-reference']);
assert(!html.includes('void blink('));
const feeding=new TimingMachine('function-void',loadTiming);
const firstTreats=await timingUntil(feeding,s=>s.line==='cat-feed-add');
assert.deepEqual(firstTreats.stack,['loop()','giveTreats()']);
assert.equal(firstTreats.vars.amount.value,2);
assert.equal(firstTreats.vars.bowl.value,2);
assert.equal(firstTreats.vars.return,undefined);
const moreTreats=await timingUntil(feeding,s=>s.line==='cat-feed-add');
assert.equal(moreTreats.vars.amount.value,1);
assert.equal(moreTreats.vars.bowl.value,3);
assert.equal((await timingUntil(feeding,s=>s.line==='loop-close')).vars.bowl.value,3);

const checking=new TimingMachine('function-return',loadTiming);
const voiceResult=await timingUntil(checking,s=>s.line==='cat-voice-return');
assert.equal(voiceResult.vars.return.value,'Meaw');
assert.equal(voiceResult.vars.voice,undefined);
const heard=await checking.step();
assert.equal(heard.vars.voice.value,'Meaw');
assert.equal(heard.vars.return,undefined);
assert.deepEqual(checking.rewind(),voiceResult);
assert.deepEqual(await checking.step(),heard);
const matching=await timingUntil(checking,s=>s.line==='cat-check-enter');
assert.equal(matching.vars.sound.value,'Meaw');
assert.equal(matching.vars.paws.value,4);
const catResult=await checking.step();
assert.equal(catResult.vars.return.value,'true');
assert.equal(catResult.vars.isCat,undefined);
const catAnswer=await checking.step();
assert.equal(catAnswer.vars.isCat.value,'true');
const duckInput=await timingUntil(checking,s=>s.line==='cat-check-enter');
assert.equal(duckInput.vars.sound.value,'Quack');
assert.equal(duckInput.vars.paws.value,2);
const duckResult=await checking.step();
assert.equal(duckResult.vars.return.value,'false');
const duckAnswer=await checking.step();
assert.equal(duckAnswer.vars.isDuckCat.value,'false');
assert.deepEqual(duckAnswer.stack,['loop()']);

const packing=new TimingMachine('function-reference',loadTiming);
const bound=await timingUntil(packing,s=>s.line==='cat-pack-enter');
assert.deepEqual(bound.stack,['loop()','packSnack()']);
assert.deepEqual(bound.vars.snack,{value:'Empty',scope:'loop',reference:'snackOut'});
assert.deepEqual(bound.vars.pieces,{value:0,scope:'loop',reference:'piecesOut'});
const addSnack=await packing.step();
assert.equal(addSnack.vars.snack.value,'Tuna');
assert.equal(addSnack.vars.pieces.value,0);
assert.deepEqual(addSnack.stack,['loop()','packSnack()']);
const countSnack=await packing.step();
assert.equal(countSnack.vars.pieces.value,2);
assert.equal(countSnack.vars.return,undefined);
const resumePack=await timingUntil(packing,s=>s.line==='cat-call-pack');
assert.deepEqual(resumePack.vars.snack,{value:'Tuna',scope:'loop'});
assert.deepEqual(resumePack.vars.pieces,{value:2,scope:'loop'});
assert.deepEqual(resumePack.stack,['loop()']);

const blockingLesson=new TimingMachine('timing-delay',loadTiming);
const blocked=await timingUntil(blockingLesson,state=>state.wait>0);
assert.equal(blocked.line,'wait-on');
assert.equal(blocked.time,0);
assert.equal(blocked.wait,1000);
assert.equal(blocked.vars.samples.value,1);
assert.equal(blocked.leds[23],0);
const ended=await blockingLesson.step();
assert.equal(ended.time,1000);
assert.equal(ended.line,blocked.line);
assert.equal(ended.vars.samples.value,blocked.vars.samples.value);
assert.equal(ended.leds[23],blocked.leds[23]);
assert.deepEqual(blockingLesson.rewind(),blocked);
assert.deepEqual(await blockingLesson.step(),ended);
const lit=await timingUntil(blockingLesson,state=>state.line==='timing-write');
assert.equal(lit.leds[23],255);
assert.equal((await timingUntil(blockingLesson,state=>state.line==='print')).vars.samples.value,2);

const pollingLesson=new TimingMachine('timing-millis',loadTiming);
const seen=[];
const firstHigh=await timingUntil(pollingLesson,state=>{
 assert.equal(state.wait,0);
 if(state.line==='elapsed'){
  seen.push([state.vars.now.value,state.vars.elapsed.value,state.vars.samples.value]);
  assert.equal(state.vars.lastToggle.value,0);
  assert.equal(state.leds[23],0);
 }
 return state.line==='timing-write';
});
assert.deepEqual(seen,[[0,0,1],[250,250,2],[500,500,3],[750,750,4],[1000,1000,5]]);
assert.equal(firstHigh.vars.lastToggle.value,1000);
assert.equal(firstHigh.log.length,5);
assert.equal(firstHigh.leds[23],255);
const secondLow=await timingUntil(pollingLesson,state=>state.line==='timing-write');
assert.equal(secondLow.vars.lastToggle.value,2000);
assert.equal(secondLow.setupCount,1);
assert.equal(secondLow.leds[23],0);

const newRace=turnMs=>createDriveRace((kind,io)=>createDriveController(firmware,bytes,kind,io),turnMs);
const {turnDuration,dodgeRightMs,dodgeLeftMs,pollEvery}=driveCourse;
const lineNumber=(kind,source)=>driveCode[kind].split('\n').findIndex(line=>line.trim()===source)+1;
const currentSource=(kind,frame)=>driveCode[kind].split('\n')[frame[kind].traceLine-1].trim();

const clear=await newRace();
await clear.advanceTo(1000);
for (const kind of driveKinds) {
 const straight=clear.frame()[kind];
 assert.equal(straight.waitingUntil,null);
 assert.equal(straight.lastReadAt,1000);
 assert.equal(straight.leftPwm,straight.rightPwm);
 assert(straight.leftPwm>0);
}
await clear.advanceTo(4000);
const original=clear.frame();
assert.equal(currentSource('delay',original),'delay(hold);');
assert.equal(original.delay.waitingUntil,original.delay.curveStartedAt+turnDuration);
assert.equal(original.delay.waitDuration,turnDuration);
assert.equal(original.millis.waitingUntil,null);
assert.equal(original.millis.lastReadAt,4000);
assert.equal(original.millis.lineVisits.get(lineNumber('millis','if (turning && now - turnStarted >= turnHold) {')),4000);
for (const kind of driveKinds) {
 const car=original[kind];
 assert.equal(car.mode,'turning');
 assert(car.leftPwm<car.rightPwm);
 assert.equal(car.motorLine,lineNumber('motor','ledcWrite(RIGHT_PWM, right);'));
 assert.equal(car.motorVisits.get(car.motorLine),4000);
}
await clear.advanceTo(4240);
for (const kind of driveKinds) assert(carPose(clear.frame()[kind]).yaw<carPose(original[kind]).yaw);
await clear.advanceTo(original.delay.waitingUntil);
assert.equal(clear.frame().delay.motor,'follow');
assert.equal(clear.frame().millis.motor,'follow');
await clear.advanceTo(52000);
for (const kind of driveKinds) {
 const car=clear.frame()[kind];
 assert.equal(car.lap,3);
 assert(car.speed>0 && !car.offTrack);
}

let duration=turnDuration;
const adjustable=await newRace(()=>duration);
await adjustable.advanceTo(4200);
const oldTurns=adjustable.frame();
duration=1400;
await adjustable.advanceTo(5600);
for (const kind of driveKinds) {
 const car=adjustable.frame()[kind];
 assert.equal(car.curveStartedAt,oldTurns[kind].curveStartedAt);
 assert.equal(car.curveDuration,turnDuration);
}
assert.equal(adjustable.frame().delay.waitingUntil,oldTurns.delay.waitingUntil);
for (const kind of driveKinds) {
 while (adjustable.frame()[kind].curveStartedAt===oldTurns[kind].curveStartedAt && adjustable.time<20000) {
  await adjustable.advanceTo(adjustable.time+pollEvery);
 }
 const next=adjustable.frame()[kind];
 assert.equal(next.mode,'turning');
 assert.equal(next.curveDuration,duration);
}

for (const turnTime of [turnDuration,1400]) {
 const dodging=await newRace(()=>turnTime);
 await dodging.advanceTo(1000);
 dodging.drop();
 for (const kind of driveKinds) {
  const car=dodging.frame()[kind];
  const box=car.boxes[0];
  assert(box.station>car.station);
  assert.equal(box.lane,car.lane);
  assert(heightAt(box,1000)>heightAt(box,1300));
 }
 await dodging.advanceTo(1360);
 const start=dodging.frame().delay.detectedAt;
 assert.equal(start,dodging.time);
 const stages=[
  [start,1,dodgeRightMs,'delay(RIGHT_MS);'],
  [start+dodgeRightMs,2,dodgeLeftMs,'delay(LEFT_MS);'],
  [start+dodgeRightMs+dodgeLeftMs,3,dodgeRightMs,'delay(RIGHT_MS);'],
 ];
 for (const [at,phase,hold,source] of stages) {
  await dodging.advanceTo(at);
  const frame=dodging.frame();
  assert.equal(frame.delay.waitDuration,hold);
  assert.equal(frame.delay.waitingUntil,at+hold);
  assert.equal(currentSource('delay',frame),source);
  for (const kind of driveKinds) {
   const car=frame[kind];
   assert.equal(car.dodgePhase,phase);
   assert(phase===2 ? car.leftPwm<car.rightPwm : car.leftPwm>car.rightPwm);
  }
  for (let t=at;t<at+hold;t+=pollEvery) {
   await dodging.advanceTo(t);
   const {millis}=dodging.frame();
   assert.equal(millis.waitingUntil,null,'The millis sketch must never block during avoidance');
   assert.equal(millis.lastReadAt,t,'The millis sketch reads the sensor during every avoidance phase');
   assert.equal(millis.dodgePhase,phase);
  }
 }
 await dodging.advanceTo(start+2*dodgeRightMs+dodgeLeftMs+400);
 for (const kind of driveKinds) {
  const car=dodging.frame()[kind];
  assert.equal(car.hitAt,null);
  assert.equal(car.laneChanges,1);
  assert.equal(car.dodgePhase,0);
  assert(Math.abs(car.offset-laneOffset(car.lane))<.2);
 }
}

const onCurve=await newRace();
await onCurve.advanceTo(5000);
onCurve.drop();
await onCurve.advanceTo(8000);
const corner=onCurve.frame();
assert(corner.delay.hitWhileWaiting);
assert.equal(corner.delay.detectedAt,null);
assert.equal(currentSource('delay',corner),'delay(hold);');
assert.equal(corner.delay.leftPwm,0);
assert.equal(corner.millis.hitAt,null);
assert.equal(corner.millis.lastReadAt,8000);
assert.equal(corner.millis.waitingUntil,null);
assert(corner.millis.detectedAt>5000 && corner.millis.detectedAt<corner.delay.hitAt);
assert.equal(corner.millis.laneChanges,1);
assert.equal(corner.millis.dodgePhase,0);
await onCurve.advanceTo(10000);
assert(Math.abs(onCurve.frame().millis.offset-laneOffset(onCurve.frame().millis.lane))<.15);

const lateDrop=await newRace();
await lateDrop.advanceTo(9330);
assert(lateDrop.frame().delay.waitingUntil>lateDrop.time);
lateDrop.drop();
await lateDrop.advanceTo(13000);
for (const kind of driveKinds) {
 const car=lateDrop.frame()[kind];
 assert.equal(car.hitAt,null);
 assert.equal(car.laneChanges,1);
 assert(Math.abs(car.offset-laneOffset(car.lane))<.15);
}
lateDrop.drop();
assert.equal(lateDrop.frame().drops,2);
assert(lateDrop.frame().millis.boxes[1].station>lateDrop.frame().millis.boxes[0].station);

console.log('Code lessons passed: setup/loop, timing, input, function stack, syntax, live WASM traces, differential PWM, adjustable turns and fixed three-step avoidance.');
