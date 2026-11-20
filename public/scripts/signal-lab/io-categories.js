import { stories } from "./stories.js";
import { feederSensorStories } from "./feeder-stories.js";

const buttonLevel = time => time < .24 || time >= .68 ? 1 : 0;
const motionLevel = time => time >= .24 && time < .76 ? 1 : 0;
export const digitalInputStories = [
  {
    id: "button", family: "Digital", tag: "GPIO input", title: "กดปุ่ม แล้ว ESP32 อ่านว่า 0 หรือ 1",
    summary: "Digital input · ปุ่มต่อ GPIO19 กับ GND · ใช้ INPUT_PULLUP",
    source: { label: "อ้างอิง GPIO input และ pull-up · Espressif", url: "https://docs.espressif.com/projects/arduino-esp32/en/latest/api/gpio.html" },
    wires: "ปุ่ม → GPIO19", device: "ESP32 · อ่านปุ่มกด", range: "1 รอบการกด",
    tracks: [{ name: "GPIO19", points: [[0,1],[.24,1],[.24,0],[.68,0],[.68,1],[1,1]] }],
    labels: [[.12,"ปล่อย"],[.46,"กด"],[.84,"ปล่อย"]],
    message: "ปุ่มเป็นฝั่งส่งสถานะ ส่วน ESP32 เป็นฝั่งรับ กดแล้วขาถูกต่อกับ GND จึงอ่านได้ LOW",
    note: "เมื่อปล่อยปุ่ม ตัวต้านทาน pull-up ภายในดึงขาเป็น HIGH ตัวอย่างนี้ LOW หมายถึงกดปุ่ม ไม่ได้หมายถึงไม่มีเหตุการณ์",
    useCase: { title: "กริ่งหน้าประตู", when: "เมื่อแขกกดปุ่มหน้าบ้าน",
      routes: [{ from: "ปุ่มกริ่ง", to: "GPIO19 ของ ESP32", payload: "LOW (0) ระหว่างกด · HIGH (1) เมื่อปล่อย" }],
      result: "ESP32 อ่านพบว่ามีคนกด แล้วสั่งลำโพงดังเป็นอีกขั้นหนึ่ง" },
    read: time => ({ on: !buttonLevel(time), glow: !buttonLevel(time), value: `GPIO19 = ${buttonLevel(time) ? "HIGH · ปล่อยปุ่ม" : "LOW · กดปุ่ม"}` }),
  },
  {
    id: "pir", family: "Digital", tag: "GPIO input", title: "เซนเซอร์ส่งสถานะว่ามีคนเคลื่อนไหว",
    summary: "Digital input · ขา OUT ของ PIR → ขา GPIO ที่ตั้งเป็น INPUT",
    wires: "PIR OUT → GPIO26", device: "ESP32 · รับสถานะจาก PIR", range: "1 เหตุการณ์",
    tracks: [{ name: "OUT", points: [[0,0],[.24,0],[.24,1],[.76,1],[.76,0],[1,0]] }],
    labels: [[.12,"เงียบ"],[.5,"ตรวจพบ"],[.88,"เงียบ"]],
    message: "PIR ประมวลผลการตรวจจับในโมดูล แล้วส่งเพียง LOW / HIGH ให้ ESP32 ไม่ได้ส่งภาพคนมา",
    note: "ตัวอย่างโมดูลที่ OUT เป็น HIGH เมื่อตรวจพบ ใช้ระดับสัญญาณที่เข้ากับ GPIO 3.3 V ของ ESP32 และต่อ GND ร่วมกัน ระยะเวลาค้าง HIGH ขึ้นกับการตั้งค่าโมดูล",
    useCase: { title: "ไฟทางเดินติดเมื่อมีคน", when: "เมื่อมีคนเดินผ่านเซนเซอร์",
      routes: [{ from: "โมดูล PIR ที่ทางเดิน", to: "GPIO26 ของ ESP32", payload: "HIGH (1) = ตรวจพบการเคลื่อนไหว" }],
      result: "ESP32 รับสถานะแล้วจึงสั่งเปิดไฟทางเดินผ่าน Digital output" },
    read: time => ({ on: Boolean(motionLevel(time)), glow: motionLevel(time), value: `GPIO26 = ${motionLevel(time) ? "HIGH · ตรวจพบคน" : "LOW · ไม่พบการเคลื่อนไหว"}` }),
  },
];

const byId = new Map([...stories, ...digitalInputStories, ...feederSensorStories].map(story => [story.id, story]));
const category = (id, label, route, note, primary, extra = []) => ({
  id, label, route, note, stories: primary.map(key => byId.get(key)), extra: extra.map(key => byId.get(key)),
});
export const ioCategories = [
  category("digital-input", "Digital input", "เซนเซอร์ → ESP32", "สิ่งที่วัดอาจเปลี่ยนได้หลายระดับ ขาที่รับข้อมูลนี้ยังอ่านพัลส์ HIGH / LOW", ["feeder-ir", "feeder-stock", "feeder-rh"], ["button", "pir", "i2c", "uart", "rs485", "can"]),
  category("analog-input", "Analog input", "แรงดันจากอุปกรณ์ → ADC ใน ESP32", "ADC แปลงแรงดันที่วัดเป็นตัวเลข เพื่อนำไปใช้ในโค้ด", ["feeder-piezo"], ["adc", "battery", "ac"]),
  category("analog-output", "Analog output", "DAC ใน ESP32 → อุปกรณ์", "DAC สร้างแรงดันตามค่าที่สั่ง · ทดลองวงจร DAC แยกจากเครื่องให้อาหาร ซึ่งใช้ GPIO25 สำหรับ buzzer", [], ["audio"]),
  category("digital-output", "Digital output", "ESP32 → ไฟแดง / Servo", "ส่ง HIGH / LOW เป็นสถานะ หรือส่งความกว้างพัลส์เป็นคำสั่งมุม", ["feeder-alert", "servo"], ["gpio", "pwm", "uart", "i2c", "spi", "rs485", "can"]),
];
