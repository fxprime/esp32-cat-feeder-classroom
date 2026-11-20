import assert from "node:assert/strict";
import { createFeeder, estimateFood, FEEDER_LIMITS, FEEDER_PINS } from "../public/scripts/feeder/model.js";
import { classroomLabs } from "../src/classroom/labs.mjs";

const { beepMs, portionMs, watchMs } = FEEDER_LIMITS;
const sim = createFeeder();
assert.equal(estimateFood(6), 100);
assert.equal(estimateFood(24), 0);
assert.equal(estimateFood(null), null);
assert.equal(estimateFood(400), null);

assert(sim.requestMeal(1));
assert.equal(sim.getState().servoAngle, 0);
assert.equal(sim.getState().buzzer, true);
assert(!sim.requestMeal(1));
assert(!sim.requestMeal(2), "a new event cannot interrupt the current portion");
sim.advance(beepMs);
assert.equal(sim.getState().servoAngle, 90);
assert.equal(sim.getState().buzzer, false);
sim.advance(portionMs);
assert.equal(sim.getState().phase, "watching");
assert.equal(sim.getState().servoAngle, 0);
assert.equal(sim.getState().portions, 1);
sim.setInputs({ catAtBowl: true });
sim.setInputs({ catAtBowl: false });
sim.setInputs({ catAtBowl: true });
assert.equal(sim.getState().arrivals, 1);
assert(!sim.requestMeal(1), "a repeated meal stays blocked after arrival");
assert.equal(sim.getState().portions, 1);

sim.reset();
sim.setInputs({ humidity: 70, online: false });
assert(sim.requestMeal());
assert(!sim.requestMeal(1));
assert.equal(sim.getState().reason, "humid");
assert.equal(sim.getState().ledRed, true);
assert.equal(sim.getState().servoAngle, 0);
assert.equal(sim.getState().events.length, 1);
assert.equal(sim.getState().events[0].delivery, "queued");
sim.setInputs({ online: true });
assert.equal(sim.getState().events[0].delivery, "simulated");
assert.equal(sim.getState().events.length, 1);

sim.setInputs({ humidity: 55, distanceCm: 24 });
assert(sim.requestMeal());
assert.equal(sim.getState().reason, "empty");
sim.setInputs({ humidity: null, distanceCm: 10 });
assert(sim.requestMeal());
assert.equal(sim.getState().reason, "sensor");
sim.advance(watchMs);
assert.equal(sim.getState().portions, 0);

sim.reset();
sim.requestMeal();
sim.advance(beepMs - 1);
sim.setInputs({ humidity: 82 });
sim.advance(1);
assert.equal(sim.getState().phase, "blocked", "recheck the tank after the beep");
assert.equal(sim.getState().servoAngle, 0);
assert.equal(sim.getState().portions, 0);

const capstone = classroomLabs.lab3;
const { parts, connections } = JSON.parse(capstone.json);
const partIDs = new Set(parts.map(part => part.id));
assert.equal(partIDs.size, parts.length);
for (const [from, to] of connections) {
  assert(partIDs.has(from.split(":")[0]));
  assert(partIDs.has(to.split(":")[0]));
}
for (const [gpio, pinName, connector] of [
  [FEEDER_PINS.meal, "MEAL_PIN", "meal:1.l"],
  [FEEDER_PINS.infrared, "IR_PIN", "presence:2"],
  [FEEDER_PINS.servo, "SERVO_PIN", "flap:PWM"],
  [FEEDER_PINS.trigger, "TRIG_PIN", "stock:TRIG"],
  [FEEDER_PINS.echo, "ECHO_PIN", "echoTop:2"],
  [FEEDER_PINS.humiditySda, "SDA_PIN", "air:SDA"],
  [FEEDER_PINS.humidityScl, "SCL_PIN", "air:SCL"],
  [FEEDER_PINS.buzzer, "BUZZER_PIN", "beep:2"],
  [FEEDER_PINS.led, "RED_LED_PIN", "ledR:1"],
]) {
  const target = `esp:D${gpio}`;
  assert(capstone.ino.includes(`constexpr int ${pinName} = ${gpio};`));
  assert(connections.some(([a, b]) => (a === target && b === connector) || (b === target && a === connector)));
}
assert.deepEqual(capstone.libraries, ["ESP32Servo"]);
for (const lab of [classroomLabs.lab2, capstone]) {
  assert.equal(lab.customChip, "htu21d");
  const sensor = JSON.parse(lab.json).parts.find(part => part.id === "air");
  assert.equal(sensor.type, "chip-htu21d");
  assert(lab.ino.includes("HTU21D_MEASURE_RH = 0xF5"));
}
console.log("Cat feeder passed: beep/open/close, duplicate guard, IR arrival, humidity, empty and unreadable sensors, after-beep check, offline alert, pin consistency.");
