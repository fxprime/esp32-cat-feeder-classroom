export const cutoffStep = 68;
export const warningStep = 48;
export const ionLimits = {
  full: 4.2,
  cutoff: 3,
  dischargeEnd: 2.5,
  inhibit: 2,
  sceneEnd: 1.45
};
export const ionMilestones = [cutoffStep, 80, 91, 100];

const voltageCurve = [
  [0, ionLimits.full],
  [24, 3.85],
  [warningStep, 3.15],
  [cutoffStep, ionLimits.cutoff],
  [100, ionLimits.sceneEnd]
];
const loadResistance = 18;

export function ionHealth(voltage, frame) {
  if (frame === 100) return 'damage';
  if (voltage < ionLimits.inhibit) return 'blocked';
  if (voltage < ionLimits.dischargeEnd) return 'wear';
  return frame >= cutoffStep ? 'limit' : 'normal';
}

function voltageAt(frame) {
  const index = voltageCurve.findIndex(([time]) => frame <= time);
  if (index === 0) return ionLimits.full;
  const [start, startVoltage] = voltageCurve[index - 1];
  const [end, endVoltage] = voltageCurve[index];
  return startVoltage + (endVoltage - startVoltage) * ((frame - start) / (end - start));
}

export function dischargeModel(frame) {
  const cursor = Math.max(0, Math.min(100, frame));
  const voltage = voltageAt(cursor);
  const protectedOpen = cursor >= cutoffStep;
  const directCurrent = voltage / loadResistance * 1000;
  return {
    voltage,
    protectedOpen,
    protectedVoltage: protectedOpen ? ionLimits.cutoff : voltage,
    protectedCurrent: protectedOpen ? 0 : directCurrent,
    directCurrent
  };
}
