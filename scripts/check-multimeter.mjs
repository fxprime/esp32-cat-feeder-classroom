import assert from 'node:assert/strict';
import {meterCases} from '../public/scripts/multimeter/cases.js';
import {initialState,guideState,measure} from '../public/scripts/multimeter/model.js';
import {parkedProbes,clampTip,nearestPoint,probeTail} from '../public/scripts/multimeter/probes.js';
import {guideSteps} from '../public/scripts/multimeter/guide.js';
import {meterJacks,connectorPosition,parkedJacks,jackTail} from '../public/scripts/multimeter/probes.js';
import {readFileSync} from 'node:fs';
import {sceneHTML} from '../public/scripts/multimeter/view.js';
import {LESSONS,PHASES} from '../src/classroom/data/lessons.js';
import {normalizeProgress} from '../src/classroom/data/progress.js';
const setup=(id,patch={})=>({...guideState(id,initialState(id)),...patch});
assert.equal(meterCases.length,10);
for(const c of meterCases){const s=setup(c.id);const r=measure(c.id,s);assert.notEqual(r.severity,'stop',c.id);assert(c.steps.length===3);assert(c.points.every(p=>p.x>=370&&p.x<=850));assert(sceneHTML(c.id,s,r).includes('data-point'));if(c.unpowered)assert.equal(measure(c.id,{...s,power:true}).severity,'stop');}
assert.equal(measure('continuity',setup('continuity')).beep,true);
assert.equal(measure('continuity',setup('continuity',{fault:true})).display,'OL');
assert.equal(measure('continuity',setup('continuity',{red:'C'})).beep,false);
assert.equal(measure('short',setup('short')).severity,'notice');
assert.equal(measure('short',setup('short',{fault:false})).beep,false);
assert.equal(measure('short',setup('short',{red:'P',black:'P'})).severity,'ok');
assert.equal(measure('broken',setup('broken')).display,'OL');assert.equal(measure('broken',setup('broken',{red:'C',black:'A'})).beep,true);
assert.equal(measure('ground',setup('ground')).beep,false);assert.equal(measure('ground',setup('ground',{fault:false})).beep,true);
assert.equal(measure('voltage',setup('voltage')).display,'5.00');assert.equal(measure('voltage',setup('voltage',{fault:false})).display,'3.30');assert.equal(measure('voltage',setup('voltage',{power:false})).display,'0.00');
assert.equal(measure('polarity',setup('polarity')).display,'-3.30');assert.equal(measure('polarity',setup('polarity',{red:'N',black:'P'})).display,'3.30');
assert.equal(measure('resistance',setup('resistance')).unit,'kΩ');assert.equal(measure('resistance',setup('resistance',{fault:false})).display,'330.0');
assert.equal(measure('diode',setup('diode')).display,'1.850');assert.equal(measure('diode',setup('diode',{red:'K',black:'A'})).display,'OL');assert.equal(measure('diode',setup('diode',{fault:true})).display,'OL');
assert.equal(measure('drop',setup('drop',{load:true})).display,'4.20');assert.equal(measure('drop',setup('drop',{load:true,red:'S',black:'L'})).display,'0.80');assert.equal(measure('drop',setup('drop',{load:true,red:'S',black:'G'})).display,'5.00');
assert.equal(measure('current',setup('current')).display,'0.00');assert.equal(measure('current',setup('current',{power:true})).display,'5.00');assert.equal(measure('current',setup('current',{power:true,red:'B',black:'A'})).display,'-5.00');assert.equal(measure('current',setup('current',{power:true,red:'P'})).display,'5.00');
assert.equal(measure('current',setup('current',{gapOpen:false})).severity,'stop');
for(const mode of ['current','dcv','off'])assert.equal(measure('current',setup('current',{power:true,mode,red:'P',black:'N'})).blowFuse,true);
assert.equal(measure('current',setup('current',{power:true,fuseBlown:true})).severity,'stop');
assert.equal(measure('current',setup('current',{power:true,jack:'v'})).severity,'stop');
assert.equal(measure('continuity',setup('continuity',{red:null})).severity,'stop');
assert.deepEqual(LESSONS.slice(3,12).map(lesson=>lesson.id),[4,14,18,5,6,11,7,13,8]);
assert.deepEqual(LESSONS.slice(12).map(lesson=>lesson.id),[9,12,15,16,17,10]);
assert.deepEqual(LESSONS.map(l=>l.slideNum),Array.from({length:18},(_,i)=>i+1));assert.deepEqual(PHASES.flatMap(p=>p.slides),LESSONS.map(l=>l.id));
assert.deepEqual(normalizeProgress([5,6,9,12,13]),[5,6,9,12,13]);
console.log('Multimeter passed: 10 cases, supply polarity, isolated components, voltage drop, series current, current-jack shorts even in V/OFF, power guards, stable lesson IDs and new placement.');

// Probe contact must clear outside the target; wires attach to the moving grip.
const points=[{id:'A',x:445,y:180},{id:'B',x:620,y:180}];
assert.equal(nearestPoint({x:446,y:183},points,22).id,'A');
assert.equal(nearestPoint({x:480,y:180},points,22),null);
assert.equal(nearestPoint({x:620,y:180},points,1).id,'B');
assert.deepEqual(clampTip({x:-100,y:900}),{x:45,y:325});
const parked=parkedProbes();parked.red.x=10;assert.equal(parkedProbes().red.x,305);
assert(probeTail('red',{x:500,y:100}).x<500);assert(probeTail('black',{x:500,y:100}).x>500);
assert.equal((sceneHTML('voltage',setup('voltage'),measure('voltage',setup('voltage'))).match(/data-probe-handle=/g)||[]).length,2);
assert(!readFileSync(new URL('../public/slides/lesson-multimeter.html',import.meta.url),'utf8').includes('id="mm-measure"'));
console.log('Probe checks passed: contact radius, lifting, clamping, independent reset positions, grip cable endpoints, two accessible handles and automatic measurement UI.');

// A physically disconnected or misplaced banana lead cannot produce a valid reading.
for(const id of ['voltage','current','continuity','drop']){
 const s=setup(id,{power:false});
 assert.equal(measure(id,{...s,jack:null}).severity,'stop');
 assert.equal(measure(id,{...s,blackJack:null}).severity,'stop');
 assert.equal(measure(id,{...s,blackJack:'v'}).severity,'stop');
 const steps=guideSteps(id);assert.equal(steps[0].id,'power-off');
 assert(steps.some(step=>step.id==='black-jack'));assert(steps.some(step=>step.id==='red-jack'));
 assert(steps.some(step=>step.id==='red-tip'));assert(steps.some(step=>step.id==='black-tip'));
 assert(steps.every(step=>step.target&&step.message&&typeof step.done==='function'));
 const ready=setup(id,id==='drop'?{load:true}:{});for(const step of steps)if(!['power-off','power-on'].includes(step.id))assert(step.done(ready,measure(id,ready)),`${id}: ${step.id}`);
 const redStep=steps.find(step=>step.id==='red-jack');assert.equal(redStep.done({...s,jack:null}),false);
 const blackStep=steps.find(step=>step.id==='black-jack');assert.equal(blackStep.done({...s,blackJack:'v'}),false);
}
assert.equal(measure('voltage',setup('voltage',{jack:'com',blackJack:'ma'})).blowFuse,true);
assert.equal(measure('voltage',setup('voltage',{jack:'v',blackJack:'ma'})).blowFuse,undefined);
assert.equal(meterJacks.length,3);assert.equal(connectorPosition(setup('current'),'red',parkedJacks()).id,'ma');
assert.deepEqual(connectorPosition(setup('current',{jack:null}),'red',parkedJacks()),{x:270,y:340});
assert.deepEqual(jackTail({x:70,y:330}),{x:70,y:360});
const slide=readFileSync(new URL('../public/slides/lesson-multimeter.html',import.meta.url),'utf8');
assert(!slide.includes('name="probe"'));assert(!slide.includes('name="jack"'));assert(slide.includes('popover="manual"'));
const svg=sceneHTML('current',setup('current'),measure('current',setup('current')));
assert.equal((svg.match(/data-banana-handle=/g)||[]).length,2);assert.equal((svg.match(/data-jack-target=/g)||[]).length,3);
console.log('Banana + Guide passed: unplugged/wrong/reference leads, swapped current-jack fuse, three sockets, both cable ends, per-case action gates and removal of sidebar selectors.');
