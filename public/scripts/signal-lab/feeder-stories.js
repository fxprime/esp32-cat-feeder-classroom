import { FEEDER_LIMITS, estimateFood } from "../feeder/model.js";

const rail = (name, points) => ({ name, points });
const inputRoute = (from, to, payload, when) => ({ from, to, payload, when });
const pulse = (start, stop) => [[0, 0], [start, 0], [start, 1], [stop, 1], [stop, 0], [1, 0]];
const irDetected = time => time >= .26 && time <= .66;

const infrared = {
  id: "feeder-ir", family: "Digital", tag: "IR สะท้อน",
  title: "มีตัวอยู่หน้าชามหรือยัง?",
  summary: "แสงสะท้อนกลับมาที่หัวเดียวกัน · อ่าน GPIO33",
  wires: "IR OUT → GPIO33", device: "หัว IR สะท้อนที่ชาม", range: "1 เหตุการณ์",
  tracks: [rail("IR OUT", [[0, 1], [.26, 1], [.26, 0], [.66, 0], [.66, 1], [1, 1]])],
  labels: [[.12, "ไม่พบ"], [.46, "ตรวจพบ"], [.83, "ไม่พบ"]],
  message: "เมื่อแสงสะท้อนจากตัวแมวกลับมามากพอ เซนเซอร์ส่ง LOW ให้ ESP32 รู้ว่ามีตัวอยู่ในระยะ",
  note: "ตัวส่งกับตัวรับอยู่ในหัวเดียวกัน เลือกรุ่น Active LOW ที่ OUT ใช้ลอจิก 3.3 V หรือลดระดับสัญญาณก่อนเข้า ESP32 รุ่นตัวอย่าง SEN0019 ใช้ไฟ 5 V และ OUT ตอน HIGH ประมาณ 4 V",
  source: { label: "สเปก IR สะท้อน Active LOW · DFRobot", url: "https://wiki.dfrobot.com/sen0019/" },
  useCase: {
    title: "บันทึกเวลาที่แมวมาที่ชาม", when: "เมื่อมีตัวเข้ามาในระยะที่แสงสะท้อนถึงตัวรับ",
    routes: [inputRoute("OUT ของหัว IR สะท้อน", "ESP32 GPIO33", "LOW (0) เมื่อตรวจพบ · HIGH (1) เมื่อไม่พบ")],
    result: "ESP32 บันทึกว่ามีตัวมาที่ชามเมื่ออ่าน LOW ในรอบที่กำลังเฝ้าดู",
  },
  read: time => ({ on: irDetected(time), value: irDetected(time) ? "0 / LOW · ตรวจพบจากแสงสะท้อน" : "1 / HIGH · ยังตรวจไม่พบ" }),
};

const stockBase = {
  id: "feeder-stock", family: "Digital", both: true, tag: "HC-SR04",
  title: "ในถังเหลืออาหารแค่ไหน?",
  summary: "ส่ง TRIG แล้วจับความยาวพัลส์ ECHO ที่สะท้อนจากผิวอาหาร",
  wires: "TRIG 26 ⇄ ECHO 27", device: "เซนเซอร์ที่ปากถัง", range: "2 ms",
  message: "ผิวอาหารต่ำลง ระยะจากเซนเซอร์ยาวขึ้น พัลส์ ECHO ที่ขารับก็กว้างขึ้น",
  note: "วัดระยะจากด้านบนของถัง ระยะ 6 ซม. แทนเต็มและ 24 ซม. แทนหมด ตัวเลขเป็นการประมาณระดับ ไม่ได้ชั่งน้ำหนัก ลดระดับ ECHO 5 V ก่อนเข้า GPIO27",
  source: { label: "การวัดพัลส์ HC-SR04 · Wokwi", url: "https://docs.wokwi.com/parts/wokwi-hc-sr04" },
  useCase: {
    title: "ตรวจระดับอาหารก่อนเปิดฝา", when: "เมื่อถึงมื้อและ ESP32 ต้องตรวจอาหารในถัง",
    routes: [
      inputRoute("ESP32 GPIO26", "HC-SR04", "พัลส์ TRIG 10 µs", "เริ่มวัด"),
      inputRoute("HC-SR04", "ESP32 GPIO27", "ความกว้าง ECHO ผ่านตัวแบ่งแรงดัน", "อ่านระยะ"),
    ],
    result: "ESP32 แปลงเวลาของเสียงที่เดินทางไปกลับเป็นระยะ แล้วประมาณปริมาณที่เหลือ",
  },
  control: { label: "ระยะจากเซนเซอร์ถึงผิวอาหาร", min: FEEDER_LIMITS.fullCm, max: FEEDER_LIMITS.emptyCm, step: 1, initial: 14, unit: "ซม." },
};

function stockStory(distanceCm) {
  const echoUs = Math.round(distanceCm * 58);
  const level = estimateFood(distanceCm);
  const echoEnd = .18 + echoUs / 2000;
  return {
    ...stockBase,
    tracks: [rail("TRIG", pulse(.04, .045)), rail("ECHO", pulse(.18, echoEnd))],
    read: time => ({
      level: level / 100, on: time >= echoEnd,
      value: time < .18 ? "ส่งพัลส์ TRIG" : time < echoEnd ? "กำลังจับเวลา ECHO" : `ECHO ${echoUs} µs · ${distanceCm} ซม. · เหลือประมาณ ${level}%`,
    }),
  };
}

const humidityBase = {
  id: "feeder-rh", family: "Digital", both: true, tag: "HTU21D · I²C",
  title: "ความชื้นหลายระดับ ส่งเป็น 0 กับ 1 ได้ยังไง?",
  summary: "HTU21D วัดความชื้นอากาศแล้วส่งค่าเป็นไบต์ผ่าน I²C",
  wires: "SDA 21 ⇄ · SCL 22 →", device: "HTU21D · ความชื้นอากาศในถัง",
  message: "ESP32 ส่งจังหวะบน SCL ส่วน SDA ใช้ส่งคำสั่งและรับตัวเลขกลับมา",
  note: "ซูมช่วงอ่านกลับจาก address 0x40 ที่ 100 kHz เห็น address อ่าน 0x81, ค่าดิบ 2 ไบต์ และ CRC โดย ESP32 ส่ง NACK หลังไบต์สุดท้าย",
  source: { label: "HTU21D · TE Connectivity", url: "https://www.te.com/en/product-CAT-HSC0004.html" },
  useCase: {
    title: "เช็กความชื้นก่อนจ่ายอาหาร", when: "ESP32 อ่านเซนเซอร์ในถังตามรอบที่ตั้งไว้",
    routes: [
      inputRoute("ESP32", "HTU21D ที่ 0x40", "ส่งคำสั่งเริ่มวัด 0xF5 ผ่าน I²C", "เริ่มวัด"),
      inputRoute("HTU21D", "ESP32", "ส่งค่าดิบความชื้น 2 ไบต์และ CRC บน SDA ตามจังหวะ SCL", "อ่านกลับ"),
    ],
    result: "ESP32 แปลงค่าดิบเป็น %RH ถ้าถึง 70% ในแบบจำลอง ให้ฝาปิดไว้และแจ้งเหตุที่งดจ่าย",
  },
  control: { label: "ความชื้นอากาศในถัง", min: 35, max: 90, step: 1, initial: 55, unit: "% RH" },
};

function humidityStory(percent) {
  const raw = (Math.ceil((percent + 6) * 16384 / 125) << 2) | 2;
  const dataBytes = [raw >> 8, raw & 0xff];
  let crc = 0;
  for (const byte of dataBytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = ((crc << 1) ^ (crc & 0x80 ? 0x31 : 0)) & 0xff;
  }
  const bytes = [0x81, ...dataBytes, crc];
  const bits = bytes.flatMap((byte, index) => [
    ...Array.from({ length: 8 }, (_, bit) => (byte >> (7 - bit)) & 1),
    index === bytes.length - 1 ? 1 : 0,
  ]);
  const units = 4 * bits.length + 6;
  const scl = [[0, 1]], sda = [[0, 1], [1, 1], [1, 0]];
  let data = 0;
  for (const [index, bit] of bits.entries()) {
    const start = 2 + index * 4;
    scl.push([start, 1], [start, 0], [start + 2, 0], [start + 2, 1]);
    sda.push([start + 1, data], [start + 1, bit]);
    data = bit;
  }
  scl.push([units - 4, 1], [units - 4, 0], [units - 2, 0], [units - 2, 1], [units, 1]);
  sda.push([units - 3, data], [units - 3, 0], [units - 1, 0], [units - 1, 1], [units, 1]);
  const track = points => points.map(([time, level]) => [time / units, level]);
  const blocked = percent >= FEEDER_LIMITS.humidity;
  return {
    ...humidityBase,
    range: "36 จังหวะ · 100 kHz",
    tracks: [rail("SCL", track(scl)), rail("SDA", track(sda))],
    labels: [[.126, "Address · Read"], [.36, "RH MSB"], [.6, "RH LSB"], [.84, "CRC"]],
    read: time => ({
      on: blocked && time >= 1,
      value: time < 1 ? "ESP32 กำลังอ่านข้อมูลผ่าน I²C" : `${percent}% RH · ${blocked ? "ถึงเกณฑ์งดจ่าย" : "ยังไม่ถึงเกณฑ์งดจ่าย"}`,
    }),
  };
}

const piezo = {
  id: "feeder-piezo", family: "Analog", tag: "Piezo / ADC1",
  title: "เม็ดอาหารกระทบแผ่น แรงดันเปลี่ยนเท่าไร?",
  summary: "แผ่น Piezo → วงจรปรับและป้องกันสัญญาณ → GPIO34",
  wires: "แรงดัน → ADC1", device: "Piezo ที่แผ่นรับแรงกระแทก", range: "40 ms",
  tracks: [rail("ADC1", Array.from({ length: 145 }, (_, index) => {
    const time = index / 144;
    const shock = Math.max(0, time - .2);
    return [time, .5 + .43 * Math.exp(-shock * 4.5) * Math.sin(shock * 65)];
  }))],
  message: "แต่ละเม็ดทำให้เกิดยอดคลื่นหลายช่วง ลองเทียบกราฟกับเกณฑ์ เพื่อรวมคลื่นที่สั่นต่อเนื่องเป็นเหตุการณ์เดียว",
  note: "กราฟอ้างระดับกึ่งกลาง 1.65 V หลังปรับสัญญาณ ขา ESP32 รับแรงดันได้ตามช่วงที่กำหนด จึงต้องผ่านวงจรปรับและป้องกันแรงดันก่อนใช้งานจริง",
  useCase: {
    title: "ตรวจว่าเม็ดไหลออกจริง", when: "เมื่อเปิดฝาและเม็ดตกผ่านแผ่นรับแรง",
    routes: [inputRoute("Piezo ผ่านวงจรปรับสัญญาณ", "ESP32 GPIO34", "แรงดันที่เปลี่ยนตามแรงสั่น")],
    result: "ESP32 ตีความช่วงการสั่นเป็นเหตุการณ์กลุ่มเดียว ตัวนับเม็ดเป็นโจทย์ทดลองแยกจากการจ่ายตามเวลา",
  },
  read: time => ({ on: time > .2 && time < .8, value: time < .2 ? "รอเม็ดตก" : time < .8 ? "แรงดันสั่นแล้วค่อย ๆ ลดลง" : "กลับสู่ระดับพัก" }),
};

const alert = {
  id: "feeder-alert", family: "Digital", tag: "LED / GPIO23",
  title: "ไฟแดงขึ้นเมื่อเครื่องงดจ่าย",
  summary: "ESP32 ส่ง HIGH ที่ GPIO23 ผ่านตัวต้านทานไปยัง LED แดง",
  wires: "GPIO23 → LED", device: "ไฟแดงแจ้งเหตุ", range: "3 วินาที",
  tracks: [rail("LED", [[0, 0], [.3, 0], [.3, 1], [1, 1]])],
  message: "โปรแกรมอ่านค่าแล้วตัดสินว่าต้องงดจ่าย จากนั้นจึงส่ง HIGH ให้ไฟแดงติด",
  note: "ต่อ LED อนุกรมกับตัวต้านทานแล้วกลับ GND เสียงก่อนจ่ายใช้ buzzer ที่ GPIO25 ส่วน Servo รับพัลส์ที่ GPIO18",
  useCase: {
    title: "ไฟแดงแจ้งเมื่อความชื้นถึงเกณฑ์", when: "เมื่อวัดได้ 70% RH ขึ้นไปในแบบจำลอง",
    routes: [inputRoute("ESP32 GPIO23", "LED แดงผ่านตัวต้านทาน", "HIGH (1) ให้ไฟติด")],
    result: "มองเห็นว่าเครื่องงดจ่ายแม้ยังไม่ได้เปิดอ่านข้อความ",
  },
  read: time => ({ on: time >= .3, glow: Number(time >= .3), value: time >= .3 ? "HIGH (1) · ไฟแดงติด" : "LOW (0) · ไฟแดงดับ" }),
};

export const feederSensorStories = [infrared, stockStory(stockBase.control.initial), humidityStory(humidityBase.control.initial), piezo, alert];
export function feederStoryAt(story, value) {
  if (story.id === "feeder-stock") return stockStory(value);
  if (story.id === "feeder-rh") return humidityStory(value);
  return story;
}
