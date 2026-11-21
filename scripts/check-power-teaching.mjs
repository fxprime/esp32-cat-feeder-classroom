import assert from "node:assert/strict";
import {
  calcNominalPack,
  estimateRunHours,
  getWireExample,
  POWER_EXAMPLE,
} from "../public/scripts/power-source/teaching-model.js";

import { tryPower } from "../public/scripts/power-source/workbench-model.js";

assert(Object.isFrozen(POWER_EXAMPLE));
assert(Object.isFrozen(POWER_EXAMPLE.board));
assert(Object.isFrozen(POWER_EXAMPLE.servo));

assert.deepEqual(getWireExample("usb", "board"), {
  limitMa: 500, runMa: 150, peakMa: 250, spareMa: 250, overBudget: false,
});
assert.deepEqual(getWireExample("usb", "servo"), {
  limitMa: 500, runMa: 330, peakMa: 650, spareMa: -150, overBudget: true,
});
assert.deepEqual(getWireExample("adapter", "servo"), {
  limitMa: 2000, runMa: 330, peakMa: 650, spareMa: 1350, overBudget: false,
});

const alkaline = calcNominalPack({ cells: 4, cellVolts: 1.5 });
assert.deepEqual(alkaline, { voltage: 6, energyWh: null });

const nimh = calcNominalPack({ cells: 4, cellVolts: 1.2, capacityAh: 1.9 });
assert.equal(nimh.voltage, 4.8);
assert(Math.abs(nimh.energyWh - 9.12) < 1e-12);

const lipo = calcNominalPack({ cells: 1, cellVolts: 3.7, capacityAh: 2 });
assert.deepEqual(lipo, { voltage: 3.7, energyWh: 7.4 });
assert.equal(estimateRunHours(lipo.energyWh, 2), 3.7);
assert.equal(estimateRunHours(alkaline.energyWh, 2), null);
assert.equal(estimateRunHours(lipo.energyWh, 0), null);

const bench = (choice) => tryPower({ source: "usb", load: "servo", portable: false, regulated: true, ...choice });
assert.equal(bench({ load: "board" }).state, "works");
for (const [load, expectedPeakMa] of [["servo", 650], ["motor", 900]]) {
  const { state, reason, spec, peakMa } = bench({ load });
  assert.equal(state, "damage");
  assert.equal(reason, "usb-port");
  assert.equal(spec.limitMa, 500);
  assert.equal(peakMa, expectedPeakMa);
}
assert.equal(bench({ portable: true }).reason, "portable");
assert.equal(bench({ source: "adapter" }).state, "works");
assert.equal(bench({ source: "adapter", load: "motor" }).state, "works");
assert.equal(bench({ source: "adapter", portable: true }).reason, "portable");
assert.equal(bench({ source: "aa", load: "board", battery: "aaa-nimh" }).state, "works");
assert.equal(bench({ source: "aa", battery: "aa-alkaline" }).reason, "current");
assert.equal(bench({ source: "aa", battery: "aa-alkaline", regulated: false }).state, "damage");
assert.equal(bench({ source: "aa", battery: "aa-nimh", regulated: false }).reason, "unregulated");
assert.equal(bench({ source: "lithium", battery: "ion", portable: true }).state, "works");
assert.equal(bench({ source: "lithium", battery: "lipo", load: "motor" }).reason, "current");
assert.equal(bench({ source: "lithium", battery: "lipo", regulated: false }).reason, "unregulated");
assert.equal(bench({ source: "mains", portable: true }).state, "damage");

console.log("Power teaching checks passed: peak current, USB port damage, source limits, series packs, and ideal runtime.");
