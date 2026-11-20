import { readFileSync } from "node:fs";
import { FEEDER_LIMITS, FEEDER_PINS } from "../../public/scripts/feeder/model.js";

const pins = FEEDER_PINS;
const limits = FEEDER_LIMITS;
const firmware = name => readFileSync(new URL(`./feeder-firmware/${name}`, import.meta.url), "utf8");
const constants = {
  RED_LED_PIN: pins.led, SERVO_PIN: pins.servo, BUZZER_PIN: pins.buzzer,
  TRIG_PIN: pins.trigger, ECHO_PIN: pins.echo, DHT_PIN: pins.humidity,
  IR_PIN: pins.infrared, MEAL_PIN: pins.meal,
  MAX_RH: limits.humidity, FULL_CM: limits.fullCm, EMPTY_CM: limits.emptyCm,
  EMPTY_PERCENT: limits.emptyPercent, LOW_PERCENT: limits.lowPercent,
  BEEP_MS: limits.beepMs, PORTION_MS: limits.portionMs, WATCH_MS: limits.watchMs,
};
const pinNames = (...keys) => keys.map(key => `constexpr int ${key} = ${constants[key]};`).join("\n");
const actuatorNames = ["SERVO_PIN", "BUZZER_PIN", "MEAL_PIN", "BEEP_MS", "PORTION_MS"];
const sensorNames = ["TRIG_PIN", "ECHO_PIN", "DHT_PIN", "IR_PIN", "FULL_CM", "EMPTY_CM"];
const dhtLibrary = "DHT sensor library for ESPx";
const arduino = "#include <Arduino.h>";
const dht = `${arduino}\n#include <DHTesp.h>`;
const servo = "#include <ESP32Servo.h>";
const debounce = firmware("debounce.txt");
const readings = firmware("readings.txt");

const pin = gpio => `esp:D${gpio}`;
const ground = "esp:GND.1";
const wire = (from, to, color) => [from, to, color, []];

function diagram({ actuator, sensors, redLed = false }) {
  const parts = [{ type: "wokwi-esp32-devkit-v1", id: "esp", top: 100, left: 0, attrs: {} }];
  const connections = [];
  function put(type, id, top, left, attrs = {}, rotate) {
    parts.push({ type: `wokwi-${type}`, id, top, left, attrs, ...(rotate === undefined ? {} : { rotate }) });
  }
  function connect(from, to, color) {
    connections.push(wire(from, to, color));
  }

  if (actuator) {
    put("servo", "flap", 120, 355);
    put("buzzer", "beep", 255, 365, { volume: "0.15" });
    put("pushbutton", "meal", 290, 175, { color: "blue", label: "MEAL" });
    connect("flap:V+", "esp:VIN", "red");
    connect("flap:GND", ground, "black");
    connect("flap:PWM", pin(pins.servo), "orange");
    connect("beep:2", pin(pins.buzzer), "violet");
    connect("beep:1", ground, "black");
    connect("meal:1.l", pin(pins.meal), "blue");
    connect("meal:2.l", ground, "black");
  }

  if (sensors) {
    put("hc-sr04", "stock", -68, 245, { distance: "10" });
    put("resistor", "echoTop", 8, 305, { value: "1000" });
    put("resistor", "echoBottom", 10, 417, { value: "1800" }, 90);
    put("dht22", "air", -44, -200, { humidity: "55" });
    put("resistor", "dhtPull", 30, -152, { value: "10000" });
    put("slide-switch", "presence", 220, -164, { value: "1", bounce: "0" });
    put("text", "presenceLabel", 174, -160, { text: "Reflective IR: left = detected" });
    connect("stock:VCC", "esp:VIN", "red");
    connect("stock:GND", ground, "black");
    connect("stock:TRIG", pin(pins.trigger), "blue");
    connect("stock:ECHO", "echoTop:1", "green");
    connect("echoTop:2", "echoBottom:1", "green");
    connect("echoTop:2", pin(pins.echo), "green");
    connect("echoBottom:2", ground, "black");
    connect("air:VCC", "esp:3V3", "red");
    connect("air:GND", ground, "black");
    connect("air:SDA", pin(pins.humidity), "cyan");
    connect("dhtPull:1", "air:SDA", "cyan");
    connect("dhtPull:2", "esp:3V3", "red");
    connect("presence:2", pin(pins.infrared), "blue");
    connect("presence:1", ground, "black");
  }

  if (redLed) {
    put("led", "fault", 168, 216, { color: "red" });
    put("resistor", "ledR", 211, 217, { value: "330" });
    connect(pin(pins.led), "ledR:1", "purple");
    connect("ledR:2", "fault:A", "purple");
    connect("fault:C", ground, "black");
  }

  return JSON.stringify({
    version: 1, author: "ESP32 Classroom · Cat Feeder", editor: "wokwi",
    parts, connections, dependencies: {},
    serialMonitor: { display: "always", newline: "lf" },
  }, null, 2) + "\n";
}

const actuatorWiring = [
  { from: "MEAL · หน้าสัมผัส 1 / 2", to: "GPIO19 / GND · INPUT_PULLUP" },
  { from: "Servo · SIG", to: "GPIO18 · 0° ปิด / 90° เปิด" },
  { from: "Servo · V+ / GND", to: "VIN ใน Wokwi · บอร์ดจริงใช้แหล่งจ่าย 5 V ที่เหมาะกับ Servo และต่อ GND ร่วม" },
  { from: "Passive buzzer · + / −", to: "GPIO25 / GND" },
];
const sensorWiring = [
  { from: "HC-SR04 · VCC / GND", to: "VIN 5 V ใน Wokwi / GND" },
  { from: "HC-SR04 · TRIG / ECHO", to: "GPIO26 / GPIO27 ผ่านจุดกึ่งกลางตัวแบ่ง 1 kΩ และ 1.8 kΩ ลง GND" },
  { from: "DHT22 · DATA (SDA ใน Wokwi)", to: "GPIO32 · pull-up 10 kΩ ไป 3V3, VCC ไป 3V3, GND ร่วม" },
  { from: "Wokwi · สวิตช์แทน OUT ของ IR สะท้อน", to: "ขากลาง → GPIO33, ขาซ้าย → GND · INPUT_PULLUP · ซ้าย = ตรวจพบ (LOW)" },
  { from: "บอร์ดจริง · IR สะท้อน Active LOW", to: "OUT → GPIO33 ที่ระดับลอจิก 3.3 V และ GND ร่วม · รุ่น SEN0019 ใช้ไฟ 5 V และต้องลดระดับ OUT ก่อนเข้าบอร์ด" },
];
const mission = (title, desc) => ({ title, desc });
function lab({ libraries, ...data }) {
  return { ...data, libraries, libraryRequired: Boolean(libraries.length), libraryName: libraries.join("\n") };
}

export const classroomLabs = {
  lab1: lab({
    title: "Lab 1 · ได้เวลาแล้ว ส่งเสียงและเปิดฝา",
    badge: "Servo · buzzer · ปุ่ม MEAL",
    goal: "กดปุ่ม MEAL ให้บอร์ดส่งเสียงก่อน แล้วเปิดฝาหนึ่งรอบตามเวลา ใช้มุม 0° และ 90° เป็นค่าตัวอย่างสำหรับฝาจำลอง",
    wiring: actuatorWiring,
    libraries: ["ESP32Servo"],
    ino: [arduino, servo, pinNames(...actuatorNames), debounce, firmware("actuators.ino")].join("\n\n"),
    json: diagram({ actuator: true }),
    missions: [
      mission("ได้ยินเสียงก่อนฝาขยับ", "กด MEAL หนึ่งครั้ง มองฝาในช่วง BEEP แล้วดูให้ Servo ไปที่ 90° หลังเสียงจบ"),
      mission("ปิดฝาได้เอง", "รอประมาณ 1.1 วินาทีหลังฝาเปิด ดูว่ามุมกลับเป็น 0° และ Serial ขึ้น FLAP CLOSED"),
      mission("กดค้างได้เพียงหนึ่งรอบ", "กด MEAL ค้างผ่านช่วงเปิด–ปิด ตรวจว่าไม่เริ่มรอบใหม่จนกว่าจะปล่อยแล้วกดใหม่"),
    ],
  }),
  lab2: lab({
    title: "Lab 2 · เครื่องรู้ได้อย่างไรว่าอาหารพร้อม",
    badge: "Ultrasonic · DHT22 · IR สะท้อน",
    goal: "เปิด Serial Monitor ที่ 115200 แล้วเปลี่ยนระยะถึงผิวอาหาร ความชื้นอากาศในถัง และสถานะ IR สะท้อนที่ชามทีละอย่าง ค่าเปอร์เซ็นต์อาหารเป็นการประมาณหลังตั้งจุดเต็มและจุดหมด",
    wiring: sensorWiring,
    libraries: [dhtLibrary],
    ino: [dht, pinNames(...sensorNames), debounce, readings, firmware("sensors.ino")].join("\n\n"),
    json: diagram({ sensors: true }),
    missions: [
      mission("เทียบถังเต็มกับถังหมด", "คลิก HC-SR04 ลองระยะ 6 ซม. แล้วเปลี่ยนเป็น 24 ซม. ดูค่าประมาณ 100% และ 0%"),
      mission("ถังชื้น", "กด DHT22 แล้วเลื่อนจาก 55% ไป 78% RH รอรอบอ่านถัดไปประมาณสองวินาที ค่าที่เปลี่ยนคือความชื้นอากาศในถัง"),
      mission("มีตัวมาที่ชาม", "เลื่อนสวิตช์ไปซ้ายแทนตอน IR รับแสงสะท้อนกลับ ดู Serial ขึ้น ARRIVAL และ LOW เลื่อนไปขวาเพื่อกลับเป็น HIGH"),
    ],
  }),
  lab3: lab({
    title: "Lab 3 · เครื่องให้อาหารแมวอัตโนมัติ",
    badge: "รวมวงจร · ทดสอบครบมื้อ",
    goal: "รวมฝา เสียง เซนเซอร์และไฟแดงด้วยพินเดิม กด MEAL หรือพิมพ์ m เพื่อจำลองมื้อ เมื่อ RH ตั้งแต่ 70% หรืออาหารเหลือประมาณไม่เกิน 5% ให้ฝาปิดและแจ้งเหตุ IR สะท้อนใช้ตรวจว่ามีตัวมาที่ชามหลังจ่าย",
    wiring: [
      ...actuatorWiring, ...sensorWiring,
      { from: "LED แดง · A / K", to: "GPIO23 ผ่าน 330 Ω / GND" },
    ],
    libraries: ["ESP32Servo", dhtLibrary],
    ino: [
      dht, servo,
      pinNames("RED_LED_PIN", ...actuatorNames, ...sensorNames, "MAX_RH", "EMPTY_PERCENT", "LOW_PERCENT", "WATCH_MS"),
      debounce, readings, firmware("telegram.txt"), firmware("capstone.ino"),
    ].join("\n\n"),
    json: diagram({ actuator: true, sensors: true, redLed: true }),
    missions: [
      mission("มื้อปกติจ่ายหนึ่งรอบ", "รอ DHT22 อ่านได้ ตั้ง 55% RH กับระยะ 10 ซม. กด MEAL ดู BEEP → FLAP_OPEN → DISPENSED พิมพ์ r ใน Serial เพื่อลองส่งมื้อเดิมซ้ำ"),
      mission("ชื้นหรืออาหารหมดให้หยุด", "ตั้ง RH 78% รอรอบอ่าน แล้วกด MEAL ไฟแดงต้องติด ฝาต้องปิด และ Serial ขึ้น BLOCK_HUMIDITY ลองซ้ำที่ 55% กับระยะ 24 ซม. เพื่อหา BLOCK_EMPTY"),
      mission("มาถึงชามแล้ว", "กลับไปที่ 55% และ 10 ซม. จ่ายหนึ่งรอบ หลังฝาปิดเลื่อนสวิตช์ IR สะท้อนไปซ้ายใน 8 วินาที ต้องเห็น CAT_AT_BOWL โดย Servo ยังปิด"),
    ],
  }),
};
