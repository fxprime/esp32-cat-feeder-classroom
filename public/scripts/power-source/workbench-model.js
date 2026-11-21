import { POWER_EXAMPLE } from './teaching-model.js';

const { board, servo, adapterLimit, usbLimit } = POWER_EXAMPLE;
export const LOADS = {
  board: { name: 'ESP32 + LED', peakMa: board.peak + 5 },
  servo: { name: 'ESP32 + Servo', peakMa: board.peak + servo.peak },
  motor: { name: 'ESP32 + มอเตอร์ DC', peakMa: board.peak + 650 },
};

const sources = {
  usb: { name: 'USB จากคอม', voltage: 5, limitMa: usbLimit },
  adapter: { name: 'Adapter 5 V', voltage: 5, limitMa: adapterLimit },
  aa: { name: 'รังถ่าน 4 ก้อน', voltage: 5, limitMa: 450 },
  lithium: { name: 'แพ็กลิเธียม 1 เซลล์', voltage: 5, limitMa: 800 },
  mains: { name: 'ไฟบ้าน', voltage: 220, ac: true },
};

const batteries = {
  aa: {
    'aa-alkaline': { name: 'AA อัลคาไลน์', raw: '4 × 1.5 V = 6.0 V', voltage: 6 },
    'aa-nimh': { name: 'AA NiMH', raw: '4 × 1.2 V = 4.8 V', voltage: 4.8 },
    'aaa-alkaline': { name: 'AAA อัลคาไลน์', raw: '4 × 1.5 V = 6.0 V', voltage: 6 },
    'aaa-nimh': { name: 'AAA NiMH', raw: '4 × 1.2 V = 4.8 V', voltage: 4.8 },
  },
  lithium: {
    lipo: { name: 'LiPo แบบแบน', raw: '3.7 V ตามป้าย · เต็ม 4.2 V', voltage: 3.7 },
    ion: { name: 'Li-ion 18650', raw: '3.6 V ตามป้าย · เต็ม 4.2 V', voltage: 3.6 },
  },
};

export function sourceSpec(source, battery, regulated) {
  const supply = sources[source];
  const pack = batteries[source]?.[battery];
  if (!pack) return supply;
  return { ...supply, name: pack.name, raw: pack.raw, voltage: regulated ? 5 : pack.voltage, limitMa: regulated ? supply.limitMa : null };
}

export function tryPower({ source, load, portable, battery, regulated }) {
  const spec = sourceSpec(source, battery, regulated);
  const { peakMa } = LOADS[load];
  if (spec.ac) return { state: 'damage', reason: 'mains', spec, peakMa };
  if (spec.raw && !regulated) {
    const tooHigh = spec.voltage > 5.5;
    return { state: tooHigh ? 'damage' : 'blocked', reason: tooHigh ? 'overvoltage' : 'unregulated', spec, peakMa };
  }
  if (portable && (source === 'usb' || source === 'adapter')) return { state: 'blocked', reason: 'portable', spec, peakMa };
  if (peakMa > spec.limitMa) return { state: 'blocked', reason: 'current', spec, peakMa };
  return { state: 'works', reason: 'matched', spec, peakMa };
}
