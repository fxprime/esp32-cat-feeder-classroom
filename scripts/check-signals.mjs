import {createServoFeedback} from '../public/scripts/signal-lab/servo-feedback-model.js';
import assert from 'node:assert/strict';
import {ioCategories,digitalInputStories} from '../public/scripts/signal-lab/io-categories.js';
import {feederSensorStories,feederStoryAt} from '../public/scripts/signal-lab/feeder-stories.js';
import {storyArt} from '../public/scripts/signal-lab/story-art.js';
import {adcSample,quantizeVoltage,sarTrace,pwmState,servoState,servoLoopFrame,fastPlaygroundLoop,squarePoints,invariantAnswer} from '../public/scripts/signal-lab/model.js';
import {stories, uartText, uartFrame, i2cReadAddress, tftMemoryWrite, scopeTrace} from '../public/scripts/signal-lab/stories.js';
import {tftImage, tftRevealPath} from '../public/scripts/signal-lab/tft-image.js';
import {useCaseArt} from '../public/scripts/signal-lab/use-case-art.js';
assert.equal(adcSample(0).code,0);assert.equal(adcSample(3.3).code,4095);assert.equal(adcSample(1.65).code,2048);assert.equal(adcSample(-1).code,0);assert.equal(adcSample(5).code,4095);
const step=3.3/4096;assert.equal(adcSample(step*.999).code,0);assert.equal(adcSample(step*1.001).code,1);
for(let i=0;i<4096;i++){const a=adcSample((i+.5)*step);assert.equal(a.code,i);assert.equal(a.binary.length,12);assert.equal(parseInt(a.binary,2),i);assert(a.voltage>=a.lower&&a.voltage<=a.upper);}
// The coarse ruler and the ESP32 ruler use the same voltage range and convention.
assert.equal(quantizeVoltage(1,3).code,2);assert.equal(quantizeVoltage(1.2,3).code,2);assert.equal(quantizeVoltage(1.3,3).code,3);
assert.equal(quantizeVoltage(1,12).code,1241);assert.equal(quantizeVoltage(1.0004,12).code,1241);assert.equal(quantizeVoltage(1.001,12).code,1242);
for(let i=0;i<8;i++){const a=quantizeVoltage((i+.5)*3.3/8,3);assert.equal(a.code,i);assert.equal(a.levels,8);assert.equal(a.binary.length,3);}
assert.equal(quantizeVoltage(0,3).code,0);assert.equal(quantizeVoltage(3.3,3).code,7);
assert.equal(quantizeVoltage(1,3).lsb/quantizeVoltage(1,12).lsb,512);
assert.throws(()=>quantizeVoltage(1,0),RangeError);
const trace=sarTrace(1,3);[1.65,.825,1.2375].forEach((v,i)=>assert(Math.abs(trace.steps[i].trialVoltage-v)<1e-12));assert.deepEqual(trace.steps.map(s=>s.keep),[false,true,false]);assert.equal(trace.code,2);assert.equal(trace.steps.at(-1).decided,'010');
for(const bits of [3,12])for(const v of [0,.1,1,1.2,1.2375,1.65,2.8,3.3])assert.equal(sarTrace(v,bits).code,quantizeVoltage(v,bits).code);
const captured=adcSample(1.65);adcSample(2.8);assert.equal(captured.code,2048,'sample is independent of subsequent input');
for(const d of [0,10,50,90,100]){const p=pwmState(d);assert.equal(p.frequency,5000);assert.equal(p.periodUs,200);assert.equal(p.highV,3.3);assert.equal(p.lowV,0);assert.equal(p.onUs,2*d);}
assert.equal(servoState(1000).angle,0);assert.equal(servoState(1500).angle,90);assert.equal(servoState(2000).angle,180);assert.equal(servoState(1500).duty,7.5);assert.equal(servoState(1500).periodUs,20000);
assert.deepEqual(servoLoopFrame(90, 30, 0), {actual:30,error:60,phase:'reading'});
assert.equal(servoLoopFrame(90, 30, .5).phase, 'driving');
assert(servoLoopFrame(90, 30, .5).error > 0 && servoLoopFrame(90, 30, .5).error < 60);
assert(servoLoopFrame(20, 80, .5).error < 0);
assert.deepEqual(servoLoopFrame(90, 30, 1), {actual:90,error:0,phase:'settled'});
assert.equal(fastPlaygroundLoop([{type:'led_on'}]).duty, 1);
assert.equal(fastPlaygroundLoop([{type:'led_off'}]).duty, 0);
assert.deepEqual(fastPlaygroundLoop([{type:'led_on'}, {type:'led_off'}]).slots, [1,0]);
assert.deepEqual(fastPlaygroundLoop([{type:'servo',val:30}, {type:'led_off'}, {type:'led_on'}]).slots, [1,0,1]);
assert.equal(squarePoints(200,0,1000),'0,94 520,94');assert.equal(squarePoints(200,200,1000),'0,22 520,22');assert.equal(squarePoints(200,100,20000).split(' ').length,401);
assert(invariantAnswer(['levels','timing']));assert(!invariantAnswer(['timing']));assert(!invariantAnswer(['levels','timing','on']));
assert.deepEqual(stories.filter(story => story.family === 'Digital').map(story => story.id), ['gpio','pwm','servo','uart','i2c','spi','rs485','can']);
assert.deepEqual(stories.filter(story => story.family === 'Analog').map(story => story.id), ['adc','audio','battery','ac']);
assert.deepEqual(ioCategories.map(category => category.id), ['digital-input','analog-input','analog-output','digital-output']);
assert.deepEqual(ioCategories[0].stories.map(story => story.id), ['feeder-ir','feeder-stock','feeder-rh']);
assert.deepEqual(ioCategories[1].extra.map(story => story.id), ['adc','battery','ac']);
assert.deepEqual(ioCategories[2].extra.map(story => story.id), ['audio']);
assert(ioCategories[3].extra.some(story => story.id === 'pwm'));
for (const category of ioCategories) {
  const examples = [...category.stories, ...category.extra];
  assert(examples.length && category.route && category.note);
  assert(examples.every(story => story && storyArt[story.id]));
}
assert.equal(digitalInputStories[0].read(.4).value, 'GPIO19 = LOW · กดปุ่ม');
assert.equal(digitalInputStories[0].read(.8).on, false);
assert.equal(digitalInputStories[1].read(.4).on, true);
for (const story of [...stories, ...digitalInputStories, ...feederSensorStories]) {
  const {title, when, routes, result} = story.useCase;
  assert(story.tag && title && when && result);
  assert.equal(routes.length, story.both ? 2 : 1);
  assert(routes.every(route => route.from && route.to && route.payload));
  const scene = useCaseArt[story.id];
  if (story.network) {
    assert.equal(scene.nodes.length, 4);
    assert(scene.nodes.every(node => node.name && node.detail && node.illustration.startsWith("<svg")));
  } else {
    assert(scene.left.illustration.startsWith("<svg") && scene.right.illustration.startsWith("<svg"));
    assert.equal(scene.signals.length, routes.length);
  }
  for (const {points} of story.tracks) {
    assert(points.every(([time, level], i) =>
      time >= (points[i - 1]?.[0] ?? 0) && time <= 1 && level >= 0 && level <= 1));
  }
}
const [feederIR, feederStock, feederRH] = feederSensorStories;
assert.equal(feederIR.read(.4).on, true);
assert.equal(feederIR.read(.9).on, false);
assert.match(feederIR.read(.4).value, /LOW/);
const fullTank = feederStoryAt(feederStock, 6);
const emptyTank = feederStoryAt(feederStock, 24);
assert.equal(fullTank.read(1).level, 1);
assert.equal(emptyTank.read(1).level, 0);
const width = story => story.tracks[1].points.findLast(([, level]) => level === 1)[0] - story.tracks[1].points.find(([, level]) => level === 1)[0];
assert.equal(Math.round(2000 * width(emptyTank)), 4 * Math.round(2000 * width(fullTank)));
assert.equal(feederStoryAt(feederRH, 69).read(1).on, false);
assert.equal(feederStoryAt(feederRH, 70).read(1).on, true);
assert.notDeepEqual(feederStoryAt(feederRH, 69).tracks, feederStoryAt(feederRH, 70).tracks);
const [, pwm, servo, uart, i2c, spi, voltage] = stories;
assert.deepEqual([.1,.3,.5,.7,.9].map(time => pwm.read(time).glow), [.20,.45,.75,.35,.60]);
for(const duty of [20, 45, 75, 35, 60]) {
  const points = scopeTrace(pwm.scope, duty / 100);
  const ends = points.filter(([, level], i) => !level && points[i - 1]?.[1] === 1);
  assert.equal(ends.length, 3);
  assert(ends.every(([time], step) => Math.abs((time * 3 - step) * 100 - duty) < 1e-8));
}
const servoFrames = Array.from({length: 7}, (_, i) => servo.read((i + .5) / 7));
assert.deepEqual(servoFrames.map(stop => stop.angle), [0, 30, 60, 90, 120, 150, 180]);
assert.deepEqual(servoFrames.map(stop => Math.round(stop.pulseUs)), [1000, 1167, 1333, 1500, 1667, 1833, 2000]);
assert.equal(servo.read(1 / 7).angle, 0, "the new angle takes effect after reading the pulse width");
assert.deepEqual(uartFrame(0x68), [0, 0, 0, 0, 1, 0, 1, 1, 0, 1]);
assert.equal(uart.read(.2).received, "");
assert.equal(uart.read(.5).received, "he");
assert.equal(uart.read(1).received, uartText);
const clockRises = ({points}) => points.filter(([, level], i) => level === 1 && points[i - 1]?.[1] === 0);
assert.equal(servo.scope.periodMs, 20);
for (const {pulseUs} of servoFrames) {
  const points = scopeTrace(servo.scope, pulseUs / 1000);
  const starts = [0, ...clockRises({points}).map(([time]) => time)];
  const ends = points.filter(([, level], i) => level === 0 && points[i - 1]?.[1] === 1);
  assert.equal(starts.length, 3);
  assert.deepEqual(ends.map(([time], i) => Math.round((time - starts[i]) * 60000)), Array(3).fill(Math.round(pulseUs)));
}
const levelAt = ({points}, time) => points.findLast(([x]) => x <= time)[1];
const receivedUart = Array.from({length: 5}, (_, index) => {
  const frame = Array.from({length: 10}, (_, bit) => levelAt(uart.tracks[0], (1.5 + index * 10 + bit) / 52));
  assert.equal(frame[0], 0);
  assert.equal(frame[9], 1);
  return String.fromCharCode(frame.slice(1, 9).reduce((byte, bit, i) => byte | (bit << i), 0));
}).join("");
assert.equal(receivedUart, "hello");
const bitsToByte = bits => bits.reduce((byte, bit) => (byte << 1) | bit, 0);
const i2cRises = clockRises(i2c.tracks[0]);
assert.equal(i2cRises.length, 9);
const i2cData = i2cRises.map(([t]) => levelAt(i2c.tracks[1], t));
assert.equal(bitsToByte(i2cData.slice(0, 8)), i2cReadAddress);
assert.equal(i2cData[8], 0, "I²C ACK pulls SDA low at the ninth clock");
const spiRises = clockRises(spi.tracks[1]);
assert.equal(spiRises.length, 24);
assert(spiRises.every(([t]) => levelAt(spi.tracks[0], t) === 0), "CS stays asserted across the command and both color bytes");
const tftBits = spiRises.map(([t]) => levelAt(spi.tracks[2], t));
assert.equal(bitsToByte(tftBits.slice(0, 8)), tftMemoryWrite);
assert.equal(bitsToByte(tftBits.slice(8)), tftImage.colors[0]);
assert(spiRises.every(([t], index) => levelAt(spi.tracks[3], t) === Number(index >= 8)), "D/C separates the write command from the pixel");
assert.equal(spi.read(.2).painted, 0);
assert(spi.read(.8).painted > 0 && spi.read(.8).painted < tftImage.colors.length);
assert.equal(spi.read(1).painted, tftImage.width * tftImage.height);
assert(new Set(tftImage.colors).size >= 6);
assert.equal(tftRevealPath(19), "M0 0h16v1H0Z M0 1h3v1H0Z");
assert(stories.filter(story => story.rates).map(story => story.id).join() === "uart,i2c,spi,rs485,can");
const battery = stories.find(story => story.id === 'battery');
const ac = stories.find(story => story.id === 'ac');
assert.match(battery.read(0).value, /4.20 V → ADC 2.10 V/);
assert.match(battery.read(1).value, /3.60 V → ADC 1.80 V/);
assert.match(ac.read(1).value, /0.46 V/);
assert.match(voltage.read(1).value, /2.64 V → ADC 3276/);
console.log("Signal stories passed: feeder IR, calibrated ECHO and RH threshold, original bus framing and analog examples.");
console.log('Signals passed: coarse/fine ruler, same-bin/boundary examples, 4096 ADC bins/binary/bounds/sample hold, fixed PWM quantities, servo pulse/angle/duty and waveform endpoints.');

for (const pulse of [1000, 1167, 1333, 1500, 1667, 1833, 2000]) {
 const loop=createServoFeedback();
 loop.command(pulse);
 let frame;
 for (let step=0;step<1200;step++) {
  frame=loop.step(.01);
  assert(Number.isFinite(frame.actual));
  assert(frame.actual>=0 && frame.actual<=180);
  assert(Math.abs(frame.output)<=1);
 }
 assert(frame.settled && Math.abs(frame.error)<.3);
 assert.equal(frame.output,0);
 loop.disturb();
 assert(!loop.frame().settled);
 for (let step=0;step<1200;step++) frame=loop.step(.01);
 assert(frame.settled && Math.abs(frame.error)<.3);
}
const reversal=createServoFeedback();
reversal.command(2000);
for (let step=0;step<30;step++)reversal.step(.01);
assert(reversal.frame().actual>90);
reversal.command(1000);
for (let step=0;step<1200;step++)reversal.step(.01);
assert(reversal.frame().settled && reversal.frame().actual<.3);
