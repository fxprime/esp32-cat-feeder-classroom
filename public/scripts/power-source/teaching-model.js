export const POWER_EXAMPLE = Object.freeze({
  board: Object.freeze({ run: 150, peak: 250 }),
  servo: Object.freeze({ run: 180, peak: 400 }),
  usbLimit: 500,
  adapterLimit: 2000,
});

export function getWireExample(source, load) {
  if (source !== "usb" && source !== "adapter") throw new RangeError("Unknown teaching power source");
  if (load !== "board" && load !== "servo") throw new RangeError("Unknown teaching load");

  const { board, servo, usbLimit, adapterLimit } = POWER_EXAMPLE;
  const limitMa = source === "usb" ? usbLimit : adapterLimit;
  const runMa = board.run + (load === "servo" ? servo.run : 0);
  const peakMa = board.peak + (load === "servo" ? servo.peak : 0);
  const spareMa = limitMa - peakMa;
  return { limitMa, runMa, peakMa, spareMa, overBudget: spareMa < 0 };
}

export function calcNominalPack({ cells, cellVolts, capacityAh = null }) {
  const voltage = cells * cellVolts;
  // Matching cells in series add voltage and retain the Ah rating of one cell.
  const energyWh = capacityAh === null ? null : voltage * capacityAh;
  return { voltage, energyWh };
}

export function estimateRunHours(energyWh, powerWatts) {
  if (!Number.isFinite(energyWh) || energyWh < 0 || !Number.isFinite(powerWatts) || powerWatts <= 0) {
    return null;
  }
  return energyWh / powerWatts;
}
