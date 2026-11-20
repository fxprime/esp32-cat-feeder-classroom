import { FEEDER_LIMITS, estimateFood } from "../feeder/model.js";

const rail = (name, points) => ({ name, points });
const inputRoute = (from, to, payload, when) => ({ from, to, payload, when });
const pulse = (start, stop) => [[0, 0], [start, 0], [start, 1], [stop, 1], [stop, 0], [1, 0]];
const irBlocked = time => time >= .26 && time <= .66;

const infrared = {
  id: "feeder-ir", family: "Digital", tag: "IR break beam",
  title: "มีตัวอยู่หน้าชามหรือยัง?",
  summary: "ลำแสง IR · มองที่สถานะของตัวรับ · GPIO33",
  wires: "IR OUT → GPIO33", device: "ลำแสงที่ชาม", range: "1 เหตุการณ์",
  tracks: [rail("IR OUT", [[0, 1], [.26, 1], [.26, 0], [.66, 0], [.66, 1], [1, 1]])],
  labels: [[.12, "โล่ง"], [.46, "บังลำแสง"], [.83, "โล่ง"]],
  message: "เมื่อแมวบังลำแสง ตัวรับแบบนี้ส่ง LOW ให้บอร์ด ESP32 บันทึกว่าแมวมาที่ชาม",
  note: "ตัวรับ OUT แบบ open collector ใช้ pull-up ไป 3.3 V และ GND ร่วมกัน สถานะนี้บอกว่าลำแสงถูกบัง จังหวะเริ่มจ่ายอาหารมาจากปุ่มถึงมื้อ GPIO19",
  source: { label: "การต่อ IR break beam · Adafruit", url: "https://learn.adafruit.com/ir-breakbeam-sensors/arduino" },
  useCase: {
    title: "บันทึกเวลาที่แมวมาที่ชาม", when: "เมื่อมีตัวเดินผ่านหน้าชามและบังลำแสง",
    routes: [inputRoute("ตัวรับ IR", "ESP32 GPIO33", "LOW (0) เมื่อถูกบัง · HIGH (1) เมื่อโล่ง")],
    result: "ESP32 บันทึกการมาที่ชามเมื่อเห็นการบังลำแสงในรอบที่กำลังเฝ้าดู",
  },
  read: time => ({ on: irBlocked(time), value: irBlocked(time) ? "0 / LOW · บังลำแสง" : "1 / HIGH · ลำแสงโล่ง" }),
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
  id: "feeder-rh", family: "Digital", both: true, tag: "DHT22",
  title: "ความชื้นหลายระดับ ส่งเป็น 0 กับ 1 ได้ยังไง?",
  summary: "DHT22 วัดความชื้นอากาศ แล้วส่งข้อมูลดิจิทัลบนสาย DATA ที่ GPIO32",
  wires: "DATA ↔ GPIO32", device: "DHT22 · ความชื้นอากาศในถัง", range: "ช่วงตอบข้อมูล",
  message: "ความชื้นเปลี่ยนได้หลายระดับ แต่ DHT22 แปลงให้เป็นตัวเลขในเซนเซอร์ก่อน แล้วส่งตัวเลขด้วยพัลส์สองระดับ",
  note: "กราฟซูมเฉพาะข้อมูลความชื้น 16 บิตแรก DHT22 ส่งอุณหภูมิและ checksum ต่อจากนี้ เกณฑ์งดจ่าย 70% RH ใช้ทดลองกับความชื้นของอากาศในถัง",
  source: { label: "เซนเซอร์ DHT22 ในแบบจำลอง · Wokwi", url: "https://docs.wokwi.com/parts/wokwi-dht22" },
  useCase: {
    title: "เช็กความชื้นก่อนจ่ายอาหาร", when: "เมื่อโปรแกรมอ่านค่าเซนเซอร์ที่ติดในถัง",
    routes: [
      inputRoute("ESP32 GPIO32", "DHT22", "สัญญาณเริ่มการอ่านบนสาย DATA", "ขอข้อมูล"),
      inputRoute("DHT22", "ESP32 GPIO32", "ความชื้น อุณหภูมิ และ checksum", "ตอบกลับ"),
    ],
    result: "ESP32 แกะบิตกลับเป็น %RH ถ้าค่าถึง 70% ในแบบจำลอง ให้ปิดฝาและส่งเหตุที่งดจ่าย",
  },
  control: { label: "ความชื้นอากาศในถัง", min: 35, max: 90, step: 1, initial: 55, unit: "% RH" },
};

function humidityStory(percent) {
  const bits = (percent * 10).toString(2).padStart(16, "0");
  let elapsed = 0;
  const microseconds = [[0, 0]];
  for (const bit of bits) {
    elapsed += 50;
    microseconds.push([elapsed, 0], [elapsed, 1]);
    elapsed += bit === "1" ? 70 : 27;
    microseconds.push([elapsed, 1], [elapsed, 0]);
  }
  const blocked = percent >= FEEDER_LIMITS.humidity;
  return {
    ...humidityBase,
    range: `${elapsed} µs · 16 บิต`,
    tracks: [rail("DATA", microseconds.map(([time, level]) => [time / elapsed, level]))],
    read: time => ({
      on: blocked && time >= 1,
      value: time < 1 ? "DHT22 กำลังส่งบิต" : `${percent}% RH · ${blocked ? "ถึงเกณฑ์งดจ่าย" : "ยังไม่ถึงเกณฑ์งดจ่าย"}`,
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
