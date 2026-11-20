import { adcSample, servoState } from "./model.js";
import { tftImage } from "./tft-image.js";

function stepped(changes, end = 1) {
  const points = [changes[0]];
  for (const [index, [time, level]] of changes.entries()) {
    if (index === 0) continue;
    points.push([time, changes[index - 1][1]], [time, level]);
  }
  points.push([end, changes.at(-1)[1]]);
  return points;
}

export function byteBits(byte, leastSignificantFirst = false) {
  return Array.from({ length: 8 }, (_, index) => (byte >> (leastSignificantFirst ? index : 7 - index)) & 1);
}

export function uartFrame(byte) {
  return [0, ...byteBits(byte, true), 1];
}

export const uartText = "hello";
const uartBaud = 9600;
const uartBytes = Array.from(uartText, char => char.charCodeAt(0));
const uartLevels = [1, ...uartBytes.flatMap(uartFrame), 1];
const uartCell = 1 / uartLevels.length;
const uartGuides = Array.from({ length: uartBytes.length + 1 }, (_, i) => (1 + 10 * i) * uartCell);
const wired = (name, points) => ({ name, points });
const samples = (count, fn) => Array.from({ length: count + 1 }, (_, i) => [i / count, fn(i / count)]);
const between = (time, start, length) => Math.min(1, Math.max(0, (time - start) / length));
const easing = t => t * t * (3 - 2 * t);

const toggles = [[0, 0], [.24, 1], [.51, 0], [.77, 1]];
const levelAt = (time, changes) => changes.findLast(([at]) => time >= at)[1];

function pulseTrain(widths) {
  const period = 1 / widths.length;
  return stepped(widths.flatMap((width, index) => [
    [index * period, 1], [(index + width) * period, 0],
  ]));
}

const pwmScope = { cycles: 3, periodMs: 1, sweepMs: 245 };
const servoScope = { ...pwmScope, periodMs: 20 };
const pwmDuties = [20, 45, 75, 35, 60];
export function scopeTrace(scope, highMs) {
  return pulseTrain(Array(scope.cycles).fill(highMs / scope.periodMs));
}

const servoStops = Array.from({ length: 7 }, (_, index) => {
  const { pulseUs, angle, periodUs } = servoState(1000 + index * 1000 / 6);
  const degrees = Math.round(angle);
  return {
    pulseUs, periodUs, angle: degrees,
    value: `${Math.round(pulseUs) / 1000} ms → ${degrees}°`,
  };
});

export const i2cReadAddress = (0x44 << 1) | 1;
const i2cBits = [...byteBits(i2cReadAddress), 0];
const i2cCycle = .9 / i2cBits.length;
const i2cStart = .075;
const i2cClock = [[0, 1]];
const i2cData = [[0, 1], [.04, 0]];
for (const [i, bit] of i2cBits.entries()) {
  const at = i2cStart + i * i2cCycle;
  i2cClock.push([at, 0], [at + .3 * i2cCycle, 1], [at + .74 * i2cCycle, 0]);
  i2cData.push([at + .1 * i2cCycle, bit]);
}

export const tftMemoryWrite = 0x2C;
const [firstColor] = tftImage.colors;
const spiBytes = [tftMemoryWrite, firstColor >> 8, firstColor & 0xFF];
const spiTx = spiBytes.flatMap(byte => byteBits(byte));
const spiStart = .10;
const spiCycle = .8 / spiTx.length;
const spiClock = stepped([[0, 0], ...spiTx.flatMap((_, i) => [
  [spiStart + (i + .4) * spiCycle, 1], [spiStart + (i + .9) * spiCycle, 0],
])]);
const spiMosi = stepped([[0, 0], ...spiTx.map((value, i) => [spiStart + i * spiCycle, value])]);
const spiDataStart = spiStart + 8 * spiCycle;
const spiMode = stepped([[0, 1], [.05, 0], [spiDataStart, 1]]);
const tftPlotPart = .52;
const tftFirstPixelTime = .90 * tftPlotPart;
const analogLevel = time => .20 + .60 * easing(between(time, .10, .76));
export const toneFrequency = 440;
const toneWindowSeconds = .012;
const toneWave = time => .5 + (.08 + .17 * time) * Math.sin(2 * Math.PI * toneFrequency * time * toneWindowSeconds);

const busBits = [1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1];
const busBit = time => busBits[Math.min(busBits.length - 1, Math.floor(time * busBits.length))];
function busTrack(name, zero, one, scale) {
  return wired(name, stepped(busBits.map((bit, i) => [
    i / busBits.length, (bit ? one : zero) / scale,
  ])));
}
const batteryVoltage = time => 4.2 - .6 * easing(time);
const acAmplitude = .65;
const acBias = 1.65;
const acSample = time => acBias + acAmplitude * Math.sin(6 * Math.PI * time);

export const stories = [
  {
    id: "gpio", family: "Digital", tag: "GPIO", title: "สลับ 0 / 1 เพื่อเปิด–ปิด",
    summary: "ทิ้งสถานะไว้ที่ 0 หรือ 1 ได้นานเท่าที่ต้องการ",
    wires: "GPIO → IN", device: "รีเลย์ควบคุมโคมไฟ",
    range: "3 วินาที", tracks: [wired("GPIO", stepped(toggles))],
    message: "สั่ง 1 ให้หน้าสัมผัสรีเลย์ปิดวงจรแล้วไฟติด สั่ง 0 ให้หน้าสัมผัสเปิดวงจรแล้วไฟดับ",
    note: "ใช้หลักเดียวกันกับการสั่งเปิดพัดลมหรือโซลินอยด์ผ่านวงจรขับ ตัวอย่างนี้ใช้โมดูลรีเลย์แบบสั่งติดด้วย HIGH",
    useCase: {
      title: "ตั้งเวลารดน้ำต้นไม้",
      when: "เมื่อถึงเวลารดน้ำที่ตั้งไว้",
      routes: [
        { from: "ESP32 ตัวตั้งเวลา", to: "โมดูลรีเลย์ของปั๊มน้ำ", payload: "HIGH เพื่อเริ่มรดน้ำ แล้วส่ง LOW เมื่อครบเวลา" },
      ],
      result: "รีเลย์เปิด–ปิดวงจรไฟของปั๊ม ต้นไม้จึงได้รับน้ำตามเวลาที่ตั้งไว้",
    },
    read: time => {
      const on = levelAt(time, toggles);
      return { on, value: on ? "1 · โคมไฟติด" : "0 · โคมไฟดับ" };
    },
  },
  {
    id: "pwm", family: "Digital", tag: "PWM", title: "เปิด–ปิดเร็วเพื่อหรี่ LED",
    summary: "PWM · 1 kHz · คาบ 1 ms",
    wires: "PWM → LED", device: "ระดับความสว่าง LED",
    range: "3 ms", durationMs: 4500, scope: pwmScope,
    tracks: [wired("GPIO", scopeTrace(pwmScope, pwmScope.periodMs * pwmDuties[0] / 100))],
    guides: [0, 1 / 3, 2 / 3, 1],
    message: "ระหว่างเส้นประคือเวลาที่ LED เปิดในหนึ่งคาบ พอช่วง HIGH กว้างขึ้น LED ก็สว่างขึ้น",
    note: "สโคปจำลองจับขอบขาขึ้นให้รูปคลื่นอยู่กับที่ ตัวชี้สแกนแสดงช้าพอให้มองตามได้ คาบยังเป็น 1 ms และระดับแรงดันยังเป็น 0 / 3.3 V",
    useCase: {
      title: "หรี่ไฟใต้ตู้ครัว",
      when: "เมื่อคนกดลดความสว่างของไฟใต้ตู้",
      routes: [
        { from: "ESP32 ในตัวหรี่ไฟ", to: "วงจรขับแถบ LED", payload: "พัลส์ PWM ที่ลดสัดส่วนเวลาเปิดลง" },
      ],
      result: "แถบ LED เปิดสั้นลงในแต่ละรอบ คนในครัวจึงเห็นไฟหรี่ลง",
    },
    read: time => {
      const position = time * pwmDuties.length;
      const step = Math.min(pwmDuties.length - 1, Math.floor(position));
      const start = pwmDuties[Math.max(0, step - 1)];
      const duty = Math.round(start + (pwmDuties[step] - start) * easing(between(position - step, 0, .27)));
      return { duty, glow: duty / 100, value: `Duty ${duty}% · ${duty < 30 ? "แสงน้อย" : duty < 60 ? "แสงปานกลาง" : "แสงมาก"}` };
    },
  },
  {
    id: "servo", family: "Digital", tag: "Servo", title: "ส่งพัลส์กว้างต่างกันเพื่อสั่งมุม",
    summary: "GPIO18 · Servo รับพัลส์คำสั่งทุก 20 ms",
    wires: "SIG → Servo", device: "แขนเซอร์โว",
    range: "60 ms", durationMs: 4200, scope: servoScope, pulseZoomUs: 2500,
    tracks: [wired("SIG", scopeTrace(servoScope, servoStops[0].pulseUs / 1000))],
    guides: [0, 1 / 3, 2 / 3, 1],
    message: "ดูระหว่างเส้นประในกราฟซูม พอพัลส์ HIGH กว้างขึ้น แขนเซอร์โวก็เปลี่ยนมุม พัลส์ยังมาทุก 20 ms",
    note: "ฝาโครงงานปิดที่ 0° และเปิดที่ 90° ภาพคลื่นแสดงช่วงตัวอย่าง 0–180° เพื่อเทียบพัลส์ ส่วนไฟเลี้ยง Servo แยกและใช้ GND ร่วมกับ ESP32",
    useCase: {
      title: "เครื่องให้อาหารสัตว์ตามเวลา",
      when: "เมื่อถึงมื้ออาหาร",
      routes: [
        { from: "ESP32 ในเครื่องให้อาหาร", to: "เซอร์โวที่ช่องจ่ายอาหาร", payload: "พัลส์สั่งมุมเปิดช่อง แล้วเปลี่ยนความกว้างพัลส์เพื่อสั่งปิด" },
      ],
      result: "เซอร์โวหมุนฝาช่องให้อาหารตกลงในชาม แล้วปิดช่องอีกครั้ง",
    },
    read: time => {
      const position = time * servoStops.length;
      const frame = Math.min(servoStops.length - 1, Math.floor(position));
      const stop = servoStops[frame];
      // The pulse width is known after its falling edge.
      return frame > 0 && position - frame < stop.pulseUs / stop.periodUs ? servoStops[frame - 1] : stop;
    },
  },
  {
    id: "uart", family: "Digital", tag: "UART", title: "ส่ง hello ระหว่าง ESP32 สองบอร์ด",
    summary: "UART · TX ของบอร์ด A → RX ของบอร์ด B · 9,600 baud · 8N1",
    rates: "9,600 baud (GPS) · 115,200 baud (Serial Monitor)",
    wires: "TX → RX", device: "ESP32 บอร์ด B · ฝั่งรับ",
    range: `${(uartLevels.length / uartBaud * 1000).toFixed(3)} ms`,
    tracks: [wired("TX", stepped(uartLevels.map((bit, i) => [i * uartCell, bit])))],
    guides: uartGuides,
    labels: Array.from(uartText, (char, i) => [uartGuides[i] + 5 * uartCell, char]),
    message: "กราฟจำลองสัญญาณของ hello ครบ 5 เฟรม ตัวรับอ่านทีละเฟรม แล้วต่ออักขระเป็นข้อความ",
    note: "แต่ละเฟรมมี START = 0, ข้อมูล 8 บิตจากบิตต่ำสุดก่อน และ STOP = 1 กราฟรวมช่วงว่างก่อนและหลังข้อความ ทั้งสองบอร์ดตั้ง 9,600 baud / 8N1 และต่อ GND ร่วม",
    useCase: {
      title: "ส่งข้อความไปป้ายต้อนรับ",
      when: "เมื่อกดปุ่มทักทายที่หน้าประตู",
      routes: [
        { from: "ขา TX ของ ESP32 บอร์ด A ที่หน้าประตู", to: "ขา RX ของ ESP32 บอร์ด B ที่ป้ายต้อนรับ", payload: "ข้อความ hello ผ่าน UART ทั้งสองบอร์ดต่อ GND ร่วม" },
      ],
      result: "บอร์ด B รับข้อความครบแล้วแสดง hello บนป้ายต้อนรับ",
    },
    read: time => {
      const received = uartText.slice(0, Math.max(0, Math.floor((time * uartLevels.length - 1) / 10)));
      return { received, value: received ? `รับแล้ว ${received.length}/${uartText.length} ตัว` : "รอรับข้อความ UART" };
    },
  },
  {
    id: "i2c", family: "Digital", tag: "I²C", title: "เพิ่มสาย Clock แล้วคุยด้วย I²C",
    summary: "I²C · SDA กับ SCL ที่ 400 kHz ในตัวอย่างนี้",
    rates: "100 kHz (Standard) · 400 kHz (Fast)",
    wires: "SDA ไป–กลับ", both: true, device: "เซนเซอร์ SHT31",
    range: "25 µs", tracks: [wired("SCL", stepped(i2cClock)), wired("SDA", stepped(i2cData))],
    labels: [[.065, "START"], [.49, "0x44 + อ่าน"], [.925, "ACK"]],
    message: "ESP32 ให้จังหวะบน SCL และส่งที่อยู่บน SDA เซนเซอร์ตอบ ACK ด้วย SDA เส้นเดียวกัน แล้วส่งค่าอุณหภูมิและความชื้นกลับมา",
    note: "กราฟซูมช่วงขออ่านและรับ ACK หลังสั่งวัด ค่าในภาพเป็นตัวอย่างข้อมูลที่บอร์ดได้รับในช่วงถัดไป หลายอุปกรณ์แชร์สองสายนี้ได้เมื่อใช้ที่อยู่ที่เหมาะสม",
    useCase: {
      title: "วัดอากาศในโรงเรือน",
      when: "ทุกนาที ระบบเก็บอุณหภูมิและความชื้นในโรงเรือน",
      routes: [
        { when: "เริ่มรอบวัด", from: "ESP32", to: "เซนเซอร์ SHT31", payload: "คำสั่งให้วัดอุณหภูมิและความชื้น" },
        { when: "เมื่อวัดเสร็จและ ESP32 ขออ่าน", from: "เซนเซอร์ SHT31", to: "ESP32", payload: "ค่าอุณหภูมิและความชื้น ผ่าน SDA เส้นเดิม" },
      ],
      result: "คนดูแลโรงเรือนเปิดดูประวัติและรู้ว่าร้อนหรือชื้นเกินไปช่วงไหน",
    },
    read: time => time > .98
      ? { on: 1, value: "25.0 °C · 58% RH" }
      : { on: 0, value: "ส่งที่อยู่เพื่อขออ่าน" },
  },
  {
    id: "spi", family: "Digital", tag: "SPI", title: "ส่งภาพสี RGB ไปจอ TFT",
    summary: "ILI9341 + TFT_eSPI · SPI 27 MHz",
    rates: "27 MHz ใน User_Setup ของ TFT_eSPI · 40 MHz ใช้ได้เมื่อจอและสายรองรับ",
    wires: "MOSI → TFT", device: "หน้าจอ TFT",
    range: "1.11 µs · ต้นเฟรม", plotPart: tftPlotPart,
    tracks: [wired("CS", stepped([[0, 1], [.07, 0], [.93, 1]])), wired("SCK", spiClock), wired("MOSI", spiMosi), wired("D/C", spiMode)],
    labels: [[.22, "คำสั่ง 0x2C"], [.65, "สี RGB565"]],
    message: "ESP32 ส่งคำสั่งเขียนจอ แล้วส่งสี RGB565 เรียงจากซ้ายไปขวาทีละบรรทัด จอค่อย ๆ ประกอบเป็นภาพ",
    note: "กราฟซูมเฉพาะคำสั่งและสีแรกของภาพหลังตั้งตำแหน่งไว้แล้ว D/C = 0 คือคำสั่ง และ D/C = 1 คือข้อมูลสีที่ส่งผ่าน MOSI",
    useCase: {
      title: "กรอบรูปดิจิทัลขนาดเล็ก",
      when: "เมื่อเปลี่ยนไปแสดงภาพถัดไป",
      routes: [
        { from: "ESP32 ในกรอบรูป", to: "จอ TFT ILI9341", payload: "คำสั่งเขียนจอ ตามด้วยสี RGB565 ของรูปภาพทีละบรรทัด ผ่าน MOSI" },
      ],
      result: "จอรับสีตามลำดับ แล้ววาดต่อกันจนเห็นเป็นภาพเต็ม",
    },
    read: time => {
      const total = tftImage.colors.length;
      if (time >= 1) return { on: 1, painted: total, value: "ภาพ RGB พร้อมแสดง" };
      if (time >= tftFirstPixelTime) {
        const painted = 1 + Math.floor((total - 1) * between(time, tftFirstPixelTime, 1 - tftFirstPixelTime));
        return { painted, value: "กำลังวาดภาพทีละบรรทัด" };
      }
      if (time >= spiDataStart * tftPlotPart) return { painted: 0, value: "D/C = 1 · เริ่มส่งข้อมูลสี" };
      if (time >= .07 * tftPlotPart) return { painted: 0, value: "D/C = 0 · ส่งคำสั่งเขียนจอ" };
      return { painted: 0, value: "รอเขียนจอ" };
    },
  },
  {
    id: "adc", family: "Analog", tag: "ADC", title: "ใช้แรงดันแทนตำแหน่งของลูกบิด",
    summary: "ลูกบิด → แรงดันต่อเนื่อง → ADC",
    wires: "VOUT → ADC", device: "ESP32 อ่านตำแหน่ง",
    range: "2 วินาที", tracks: [wired("VOUT", samples(80, analogLevel))],
    message: "พอหมุนลูกบิด แรงดันขากลางค่อย ๆ เปลี่ยน ESP32 ใช้ ADC อ่านให้เป็นตัวเลขแล้วนำไปใช้ต่อ",
    note: "ตัวอย่างการใช้งาน เช่น จอยสติ๊กหรือปรับความเร็วพัดลม ใช้แบบจำลอง ADC 12 บิตในช่วง 0–3.3 V",
    useCase: {
      title: "เร่งรถบังคับด้วยคันโยก",
      when: "เมื่อผู้เล่นดันคันโยกไปข้างหน้า",
      routes: [
        { from: "ขากลางของตัวต้านทานปรับค่าในคันโยก", to: "ขา ADC ของ ESP32 ในรีโมต", payload: "แรงดันที่เปลี่ยนตามระยะที่ดันคันโยก" },
      ],
      result: "ESP32 อ่านแรงดันแล้วแปลงเป็นระดับความเร็ว เพื่อส่งคำสั่งเร่งให้รถ",
    },
    read: time => {
      const position = analogLevel(time);
      const voltage = position * 3.3;
      return { angle: -125 + position * 250, value: `${voltage.toFixed(2)} V → ADC ${adcSample(voltage).code}` };
    },
  },
  {
    id: "audio", family: "Analog", tag: "DAC", title: "เปลี่ยนแรงดันเป็นคลื่นเพื่อสร้างเสียง",
    summary: "DAC → แอมป์ → ลำโพง",
    wires: "คลื่นแรงดัน", device: "ลำโพง",
    range: "12 ms", tracks: [wired("DAC", samples(144, toneWave))],
    message: "DAC สร้างแรงดันที่ขึ้นลงตามรูปคลื่น แอมป์ขับลำโพงให้กรวยขยับและเกิดเสียง คลื่นนี้เป็นโน้ต 440 Hz",
    note: "เสียง 440 Hz คือแรงสั่น 440 รอบต่อวินาที ในเสียงตัวอย่างจะค่อย ๆ ดังขึ้นตามแอมพลิจูด กราฟซูมให้เห็นคลื่นประมาณ 5 รอบ",
    useCase: {
      title: "นาฬิกาครัวส่งเสียงเมื่อหมดเวลา",
      when: "เมื่อเวลานับถอยหลังเหลือศูนย์",
      routes: [
        { from: "ขา DAC ของ ESP32 ในนาฬิกา", to: "แอมป์ที่ต่อกับลำโพง", payload: "คลื่นแรงดันรูปเสียงเตือน" },
      ],
      result: "แอมป์ขับลำโพงให้ดัง คนทำอาหารจึงรู้ว่าครบเวลาแล้วแม้อยู่ไกลจากหน้าจอ",
    },
    read: time => ({ on: 1, glow: .35 + .65 * time, value: "440 Hz · เสียงโน้ต A" }),
  },
  {
    id: "rs485", family: "Digital", tag: "RS‑485", title: "อ่านผลต่างแรงดันเพื่อคุยบนบัส RS‑485",
    summary: "หลายอุปกรณ์ต่อขนานกับสายคู่เส้นเดียวกัน",
    rates: "9,600 หรือ 19,200 baud ในงาน Modbus RTU ทั่วไป",
    wires: "D+ / D−", both: true, device: "ตัวรับ RS‑485",
    range: "1.25 ms · 9,600 baud",
    tracks: [busTrack("D+", .9, 2.4, 3.3), busTrack("D−", 2.4, .9, 3.3)],
    message: "ตัวรับดูว่าสายไหนแรงดันสูงกว่า ถ้าสัญญาณรบกวนกระทบทั้งคู่พอ ๆ กัน ผลต่างจะเปลี่ยนน้อยลง",
    note: "กราฟจำลองช่วงบิต ESP32 ใช้ชิปขับและรับ RS‑485 แยก ส่วน Modbus RTU กำหนดที่อยู่และกติกาถาม–ตอบ ในโมดูลจริงให้เทียบชื่อ A/B หรือ D+/D− จากคู่มือ",
    network: "rs485",
    useCase: {
      title: "Smart home ใช้สายคู่เดียวอ่านหลายห้อง",
      when: "ESP32 เรียกวัดทีละที่อยู่ผ่าน Modbus RTU",
      routes: [
        { from: "ESP32 เกตเวย์", to: "เซนเซอร์ CO₂ ที่อยู่ 2", payload: "คำขออ่าน CO₂" },
        { from: "เซนเซอร์ CO₂ ที่อยู่ 2", to: "ESP32 เกตเวย์", payload: "ค่า CO₂ ที่อ่านได้" },
      ],
      result: "ESP32 ใช้ข้อมูลจากหลายห้องตัดสินใจเปิดระบายอากาศ แจ้งเตือน หรือปรับไฟได้จากบัสเดียว",
    },
    read: time => ({
      on: true,
      value: busBit(time) ? "D+ สูงกว่า D− → 1" : "D+ ต่ำกว่า D− → 0",
    }),
  },
  {
    id: "can", family: "Digital", tag: "CAN", title: "กล่องในรถส่งข้อมูลถึงกันบน CAN Bus",
    summary: "CAN_H กับ CAN_L ใช้ผลต่างแทนบิต",
    rates: "250 หรือ 500 kbit/s พบได้ในงาน Classic CAN",
    wires: "CAN_H / CAN_L", device: "ตัวรับ CAN",
    range: "24 µs · 500 kbit/s",
    tracks: [busTrack("CAN_H", 3.5, 2.5, 5), busTrack("CAN_L", 1.5, 2.5, 5)],
    message: "ตอนส่ง 0 สาย CAN_H สูงขึ้นและ CAN_L ต่ำลง ส่วนตอนส่ง 1 แรงดันสองเส้นใกล้กัน ทุกกล่องบนบัสรับข้อความชุดเดียวกันได้",
    note: "กราฟซูมช่วงบิตและใช้ระดับแรงดันโดยประมาณ CAN ใช้ ID ของข้อความเพื่อเลือกข้อมูลและลำดับความสำคัญ ESP32 ต้องมีชิป CAN transceiver ต่อกับ TWAI",
    network: "can",
    useCase: {
      title: "เซนเซอร์รถส่งค่าผ่านกล่องควบคุม",
      when: "กล่อง ABS อ่านเซนเซอร์ล้อ แล้วกระจายข้อมูลบน CAN",
      routes: [
        { from: "กล่อง ABS", to: "หน้าปัดและกล่องอื่นบน CAN", payload: "ข้อความความเร็วล้อ" },
      ],
      result: "หน้าปัดใช้ข้อมูลความเร็ว ส่วน ECU กระจายข้อมูลอุณหภูมิเครื่องยนต์ได้บนคู่สายเดียวกัน",
    },
    read: time => ({
      on: true,
      value: busBit(time) ? "1 · CAN_H ≈ CAN_L" : "0 · ผลต่างประมาณ 2 V",
    }),
  },
  {
    id: "battery", family: "Analog", tag: "Battery", title: "วัดแรงดันแบตเตอรี่ด้วย ADC",
    summary: "แบตเตอรี่ 1 เซลล์ → วงจรแบ่งแรงดัน → ESP32",
    wires: "แรงดัน ÷ 2", device: "ตัวอ่านแรงดันแบตเตอรี่",
    range: "ช่วงจำลอง 2 วินาที",
    tracks: [wired("ADC", samples(80, time => batteryVoltage(time) / 2 / 3.3))],
    message: "วงจรแบ่งแรงดัน 1:2 ทำให้ ESP32 อ่านแรงดันครึ่งหนึ่งของแบตเตอรี่ เช่น 4.20 V เหลือ 2.10 V ที่ ADC",
    note: "การอ่านแบตเตอรี่จริงต้องเลือกช่วงและคาลิเบรต ADC แรงดันบอกระดับแบตเตอรี่ได้คร่าว ๆ และขึ้นกับชนิดแบตเตอรี่กับโหลด",
    useCase: {
      title: "สถานีวัดอากาศแจ้งเมื่อแรงดันแบตลด",
      when: "ESP32 ตื่นขึ้นมาวัดเซนเซอร์และเช็กแบตเตอรี่",
      routes: [
        { from: "แบตเตอรี่ผ่านวงจรแบ่งแรงดัน", to: "ขา ADC ของ ESP32", payload: "แรงดันครึ่งหนึ่งของแบตเตอรี่" },
      ],
      result: "ESP32 คูณกลับเป็นแรงดันแบตเตอรี่ แล้วใช้เงื่อนไขของอุปกรณ์แจ้งเตือนเมื่อแรงดันต่ำ",
    },
    read: time => {
      const volts = batteryVoltage(time);
      return { level: (volts - 3.4) / .8, value: `${volts.toFixed(2)} V → ADC ${(volts / 2).toFixed(2)} V` };
    },
  },
  {
    id: "ac", family: "Analog", tag: "ZMPT101B", title: "อ่านคลื่นแรงดัน AC ด้วย ZMPT101B",
    summary: "หม้อแปลงวัดแรงดัน → ปรับระดับสัญญาณ → ADC",
    wires: "คลื่นฝั่ง ADC", device: "ESP32 อ่านรูปคลื่น",
    range: "60 ms · 50 Hz", reference: { level: .5, label: "1.65 V" },
    tracks: [wired("ADC", samples(144, time => acSample(time) / 3.3))],
    message: "ESP32 เก็บหลายจุดตลอดคลื่น ลบค่าออฟเซ็ตออก แล้วคำนวณ RMS เพื่อประเมินแรงดัน AC",
    note: "กราฟจำลองสัญญาณหลังจัดให้อยู่ในช่วง ADC โดยคลื่นแกว่งรอบ 1.65 V ต้องคาลิเบรตจึงจะแปลงกลับเป็นแรงดันต้นทาง บทนี้แสดงเฉพาะการวัดฝั่งสัญญาณต่ำ",
    source: {
      label: "ดูโมดูล ZMPT101B ที่ใช้เป็นตัวอย่าง",
      url: "https://www.modulemore.com/product/1356/เซ็นเซอร์วัดแรงดัน-ac-zmpt101b-voltage-transformer-module-single-phase-ac-active-output-voltage-sens",
    },
    useCase: {
      title: "อ่านแรงดัน AC แบบต่อเนื่อง",
      when: "ESP32 เก็บตัวอย่างตลอดหลายรอบคลื่น",
      routes: [
        { from: "โมดูล ZMPT101B ผ่านวงจรปรับระดับ", to: "ขา ADC ของ ESP32", payload: "รูปคลื่นแรงดันฝั่งวัด" },
      ],
      result: "เครื่องบันทึกประวัติ RMS และสังเกตได้ว่าแรงดันต้นทางเปลี่ยนไปช่วงไหนหลังคาลิเบรต",
    },
    read: time => ({
      on: true,
      value: time === 1
        ? `RMS ฝั่ง ADC ≈ ${(acAmplitude / Math.sqrt(2)).toFixed(2)} V`
        : `ADC อ่าน ${acSample(time).toFixed(2)} V`,
    }),
  },
];
