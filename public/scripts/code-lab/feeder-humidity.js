import { FEEDER_LIMITS, FEEDER_PINS } from '../feeder/model.js';

const { led, humidity: humidityPin } = FEEDER_PINS;
const { humidity: cutoff } = FEEDER_LIMITS;

export const feederHumidityLesson = {
  id: 'feeder-humidity',
  label: 'ความชื้นในถัง',
  title: 'อ่านความชื้น แล้วสั่งไฟแดง',
  intro: 'ต่อยอดจากไฟแดงดวงเดิม ให้ DHT22 ส่งตัวเลข %RH มาเก็บในตัวแปร แล้วให้ ESP32 ตัดสินว่าจะเปิดไฟแดงไหม',
  challenge: 'ปรับแถบเป็น 65% แล้วกดจนถึงบรรทัดอ่าน humidityRH จากนั้นปรับเป็น 80% ก่อนกด if ดูว่ารอบนี้ใช้ค่าไหน และรอบหน้าจะเปลี่ยนเมื่อไหร่',
  wiring: `DHT22 DATA → GPIO${humidityPin} · LED แดง GPIO${led} → R 330Ω → LED → GND · ใช้ DHT sensor library ของ Adafruit`,
  file: 'feeder_humidity_alarm.ino',
};

export function feederHumidityProgram() {
  const lines = [
    ['dht-include', '#include <DHT.h>', 'เพิ่มไลบรารี DHT22', 'ใช้ฟังก์ชันอ่านความชื้นที่ไลบรารีเตรียมไว้'],
    ['led-pin', `const int LED_PIN = ${led};`, 'ขาไฟแดง', 'ชื่อ LED_PIN แทนหมายเลขขา ค่าคงที่นี้เก็บไว้ครั้งเดียว'],
    ['humidity-pin', `const int DHT_PIN = ${humidityPin};`, 'ขารับข้อมูล', 'DHT22 ส่งตัวเลขความชื้นที่ขา DATA'],
    ['humidity-limit', `const float RH_LIMIT = ${cutoff}.0f;`, 'เกณฑ์ในบททดลอง', 'ค่าขึ้นถึงเกณฑ์จะขึ้นไฟแดง นี่เป็นเกณฑ์เพื่อสาธิตการตัดสินใจ'],
    ['dht-device', 'DHT dht(DHT_PIN, DHT22);', 'ระบุชนิดเซนเซอร์', 'สร้างชื่อ dht ไว้เรียกตัวอ่านความชื้น'],
    ['setup-open', 'void setup() {', 'เข้า setup() ครั้งเดียว', 'เตรียมขารับส่งก่อนวนอ่านค่า'],
    ['setup-led', '  pinMode(LED_PIN, OUTPUT);', 'ตั้ง GPIO ให้ส่งออก', 'ดูสถานะขา LED บนภาพบอร์ดเปลี่ยนเป็น OUTPUT'],
    ['setup-dht', '  dht.begin();', 'เริ่มเซนเซอร์', 'เตรียมไลบรารีให้พร้อมอ่าน DHT22'],
    ['setup-close', '}', 'จบ setup()', 'หลังเปิดเครื่องจะไปทำงานใน loop()'],
    ['loop-open', 'void loop() {', 'เริ่มรอบอ่านใหม่', 'humidityRH เป็นค่าที่เก็บใหม่ในแต่ละรอบ'],
    ['read-humidity', '  float humidityRH = dht.readHumidity();', 'อ่านแล้วเก็บลงตัวแปร', 'เปลี่ยนแถบหลังบรรทัดนี้ ค่าที่เก็บอยู่ยังเป็นค่าเดิมจนกว่าจะอ่านใหม่'],
    ['humidity-if', '  if (isnan(humidityRH) || humidityRH >= RH_LIMIT) {', 'ดูทางที่ if จะเลือก', 'อ่านไม่ได้หรือความชื้นถึงเกณฑ์ เข้า if ใช้ || หมายถึงเป็นจริงอย่างใดอย่างหนึ่งก็พอ'],
    ['high', '    digitalWrite(LED_PIN, HIGH);', 'ขึ้นไฟแดง', 'ส่ง HIGH ให้ LED ติด เพื่อให้คนเห็นว่ามีเหตุให้ตรวจเครื่อง'],
    ['else', '  } else {', 'ทางที่อ่านได้และต่ำกว่าเกณฑ์', 'ทางนี้ทำงานเมื่อ if ให้ผลเท็จ'],
    ['low', '    digitalWrite(LED_PIN, LOW);', 'ปิดไฟแดง', 'รอบนี้ไม่พบปัญหาจากการอ่านความชื้น'],
    ['humidity-if-close', '  }', 'จบการเลือกทาง', 'มาถึงจุดเดียวกันหลังทำทางใดทางหนึ่ง'],
    ['wait', '  delay(2000);', 'เว้นก่อนอ่าน DHT22 รอบหน้า', 'ตัวอย่างนี้ฝึกอ่านความชื้นอย่างเดียว เวลาเอาไปรวมกับ IR และฝาถัง ให้ใช้ millis() เพื่ออ่านอินพุตอื่นระหว่างรอ'],
    ['loop-close', '}', 'วนรอบถัดไป', 'กลับไปอ่าน humidityRH ใหม่ โดยไม่ย้อนกลับเข้า setup()'],
  ].map(([id, code, title, explain]) => ({ id, code, title, explain }));
  return { id: feederHumidityLesson.id, lines, options: {}, meta: feederHumidityLesson };
}

export function* executeFeederHumidity(machine) {
  const keep = (name, value, scope = 'global / const') => state => { state.vars[name] = { value, scope }; };
  yield* machine.e('dht-include', 'โหลดส่วนที่ใช้เรียก DHT22');
  yield* machine.e('led-pin', `เก็บ GPIO${led} ไว้ใน LED_PIN`, keep('LED_PIN', led));
  yield* machine.e('humidity-pin', `เก็บ GPIO${humidityPin} ไว้ใน DHT_PIN`, keep('DHT_PIN', humidityPin));
  yield* machine.e('humidity-limit', `เก็บ ${cutoff}% RH เป็นเกณฑ์`, keep('RH_LIMIT', cutoff));
  yield* machine.e('dht-device', 'ประกาศเซนเซอร์ที่ใช้ขา DHT_PIN');
  yield* machine.e('setup-open', 'เข้า setup() ครั้งเดียว', state => {
    state.setupCount++;
    state.phase = 'setup';
    state.stack = ['setup()'];
  });
  yield* machine.e('setup-led', `ตั้ง GPIO${led} เป็น OUTPUT`, state => { state.pins[led] = 'OUTPUT'; });
  yield* machine.e('setup-dht', 'เรียก dht.begin() เตรียมอ่านความชื้น');
  yield* machine.e('setup-close', 'จบ setup() ต่อไปจะเข้า loop()', state => { state.stack = []; });

  while (true) {
    yield* machine.e('loop-open', 'เริ่มรอบอ่านความชื้นใหม่', state => {
      state.loopCount++;
      state.phase = 'loop';
      state.stack = ['loop()'];
      delete state.vars.humidityRH;
    });
    yield* machine.e('read-humidity', 'อ่าน DHT22 แล้วเก็บค่าที่อ่านใน humidityRH', (state, input) => {
      const value = Number.isFinite(input.humidity) && input.humidity >= 0 && input.humidity <= 100 ? input.humidity : 'NaN';
      keep('humidityRH', value, 'loop / local')(state);
    });
    const value = machine.state.vars.humidityRH.value;
    const blocked = value === 'NaN' || value >= cutoff;
    yield* machine.e('humidity-if', `อ่านได้ ${value} · ${blocked ? 'เข้า if แล้วสั่งไฟแดง' : 'ไป else แล้วปิดไฟแดง'}`);
    if (blocked) yield* machine.write('high', led, 255);
    else {
      yield* machine.e('else', 'เข้า else เพราะอ่านได้และต่ำกว่าเกณฑ์');
      yield* machine.write('low', led, 0);
    }
    yield* machine.e('humidity-if-close', 'จบทางเลือกของความชื้น');
    yield* machine.delay('wait', 2000);
    yield* machine.e('loop-close', 'จบรอบนี้ กลับไปอ่านใหม่', state => {
      state.stack = [];
      delete state.vars.humidityRH;
    });
  }
}
