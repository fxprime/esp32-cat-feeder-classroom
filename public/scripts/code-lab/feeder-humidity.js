import { FEEDER_LIMITS, FEEDER_PINS } from '../feeder/model.js';

const { led, humiditySda, humidityScl } = FEEDER_PINS;
const { humidity: cutoff } = FEEDER_LIMITS;

export const feederHumidityLesson = {
  id: 'feeder-humidity',
  label: 'ความชื้นในถัง',
  title: 'อ่านความชื้น แล้วสั่งไฟแดง',
  intro: 'ต่อยอดจากไฟแดงดวงเดิม ให้ HTU21D ส่งตัวเลข %RH มาเก็บในตัวแปร แล้วให้ ESP32 ตัดสินว่าจะเปิดไฟแดงไหม',
  challenge: 'ปรับแถบเป็น 65% แล้วกดจนถึงบรรทัดอ่าน humidityRH จากนั้นปรับเป็น 80% ก่อนกด if ดูว่ารอบนี้ใช้ค่าไหน และรอบหน้าจะเปลี่ยนเมื่อไหร่',
  wiring: `HTU21D SDA → GPIO${humiditySda} · SCL → GPIO${humidityScl} · VCC → 3V3 · GND ร่วม · LED แดง GPIO${led} → R 330Ω → LED → GND · ใช้ Adafruit HTU21DF`,
  file: 'feeder_humidity_alarm.ino',
};

export function feederHumidityProgram() {
  const lines = [
    ['wire-include', '#include <Wire.h>', 'เปิดใช้ I²C', 'Wire คุยกับเซนเซอร์ด้วยสาย SDA และ SCL'],
    ['htu-include', '#include <Adafruit_HTU21DF.h>', 'เพิ่มไลบรารี HTU21D', 'ไลบรารีเตรียมฟังก์ชันอ่านความชื้นไว้ให้'],
    ['led-pin', `const int LED_PIN = ${led};`, 'ขาไฟแดง', 'ชื่อ LED_PIN แทนหมายเลขขา ค่าคงที่นี้เก็บไว้ครั้งเดียว'],
    ['humidity-sda', `const int SDA_PIN = ${humiditySda};`, 'ขา SDA', 'สายข้อมูล I²C ใช้รับและส่ง'],
    ['humidity-scl', `const int SCL_PIN = ${humidityScl};`, 'ขา SCL', 'ESP32 ใช้สายนี้ส่งจังหวะนาฬิกา'],
    ['humidity-limit', `const float RH_LIMIT = ${cutoff}.0f;`, 'เกณฑ์ในบททดลอง', 'ค่าขึ้นถึงเกณฑ์จะขึ้นไฟแดง นี่เป็นเกณฑ์เพื่อสาธิตการตัดสินใจ'],
    ['htu-device', 'Adafruit_HTU21DF htu;', 'ระบุชนิดเซนเซอร์', 'สร้างตัวอ่านความชื้นชื่อ htu'],
    ['htu-ready', 'bool htuReady = false;', 'จำว่าเริ่มเซนเซอร์สำเร็จไหม', 'เก็บผลไว้เช็กใน loop()'],
    ['setup-open', 'void setup() {', 'เข้า setup() ครั้งเดียว', 'เตรียมขารับส่งก่อนวนอ่านค่า'],
    ['setup-led', '  pinMode(LED_PIN, OUTPUT);', 'ตั้ง GPIO ให้ส่งออก', 'ดูสถานะขา LED บนภาพบอร์ดเปลี่ยนเป็น OUTPUT'],
    ['setup-wire', '  Wire.begin(SDA_PIN, SCL_PIN);', 'เริ่มสื่อสาร I²C', 'เลือกขาสายข้อมูลและสายจังหวะ'],
    ['setup-htu', '  htuReady = htu.begin(&Wire);', 'เริ่มเซนเซอร์', 'เช็กว่ามี HTU21D ที่ address 0x40'],
    ['setup-close', '}', 'จบ setup()', 'หลังเปิดเครื่องจะไปทำงานใน loop()'],
    ['loop-open', 'void loop() {', 'เริ่มรอบอ่านใหม่', 'humidityRH เป็นค่าที่เก็บใหม่ในแต่ละรอบ'],
    ['read-humidity', '  float humidityRH = htuReady ? htu.readHumidity() : NAN;', 'อ่านแล้วเก็บลงตัวแปร', 'เปลี่ยนแถบหลังบรรทัดนี้ ค่าที่เก็บอยู่ยังเป็นค่าเดิมจนกว่าจะอ่านใหม่'],
    ['humidity-if', '  if (isnan(humidityRH) || humidityRH >= RH_LIMIT) {', 'ดูทางที่ if จะเลือก', 'อ่านไม่ได้หรือความชื้นถึงเกณฑ์ เข้า if ใช้ || หมายถึงเป็นจริงอย่างใดอย่างหนึ่งก็พอ'],
    ['high', '    digitalWrite(LED_PIN, HIGH);', 'ขึ้นไฟแดง', 'ส่ง HIGH ให้ LED ติด เพื่อให้คนเห็นว่ามีเหตุให้ตรวจเครื่อง'],
    ['else', '  } else {', 'ทางที่อ่านได้และต่ำกว่าเกณฑ์', 'ทางนี้ทำงานเมื่อ if ให้ผลเท็จ'],
    ['low', '    digitalWrite(LED_PIN, LOW);', 'ปิดไฟแดง', 'รอบนี้ไม่พบปัญหาจากการอ่านความชื้น'],
    ['humidity-if-close', '  }', 'จบการเลือกทาง', 'มาถึงจุดเดียวกันหลังทำทางใดทางหนึ่ง'],
    ['wait', '  delay(2000);', 'เว้นก่อนอ่าน HTU21D รอบหน้า', 'ตัวอย่างนี้ฝึกอ่านความชื้นอย่างเดียว เวลาเอาไปรวมกับ IR และฝาถัง ให้ใช้ millis() เพื่ออ่านอินพุตอื่นระหว่างรอ'],
    ['loop-close', '}', 'วนรอบถัดไป', 'กลับไปอ่าน humidityRH ใหม่ โดยไม่ย้อนกลับเข้า setup()'],
  ].map(([id, code, title, explain]) => ({ id, code, title, explain }));
  return { id: feederHumidityLesson.id, lines, options: {}, meta: feederHumidityLesson };
}

export function* executeFeederHumidity(machine) {
  const keep = (name, value, scope = 'global / const') => state => { state.vars[name] = { value, scope }; };
  yield* machine.e('wire-include', 'โหลด Wire สำหรับสื่อสาร I²C');
  yield* machine.e('htu-include', 'โหลดส่วนที่ใช้เรียก HTU21D');
  yield* machine.e('led-pin', `เก็บ GPIO${led} ไว้ใน LED_PIN`, keep('LED_PIN', led));
  yield* machine.e('humidity-sda', `เก็บ GPIO${humiditySda} ไว้ใน SDA_PIN`, keep('SDA_PIN', humiditySda));
  yield* machine.e('humidity-scl', `เก็บ GPIO${humidityScl} ไว้ใน SCL_PIN`, keep('SCL_PIN', humidityScl));
  yield* machine.e('humidity-limit', `เก็บ ${cutoff}% RH เป็นเกณฑ์`, keep('RH_LIMIT', cutoff));
  yield* machine.e('htu-device', 'สร้างตัวอ่านความชื้นชื่อ htu');
  yield* machine.e('htu-ready', 'เริ่มจากยังไม่ได้เตรียมเซนเซอร์', keep('htuReady', false, 'global'));
  yield* machine.e('setup-open', 'เข้า setup() ครั้งเดียว', state => {
    state.setupCount++;
    state.phase = 'setup';
    state.stack = ['setup()'];
  });
  yield* machine.e('setup-led', `ตั้ง GPIO${led} เป็น OUTPUT`, state => { state.pins[led] = 'OUTPUT'; });
  yield* machine.e('setup-wire', 'เริ่ม I²C ด้วย SDA และ SCL');
  yield* machine.e('setup-htu', 'ในตัวอย่างนี้พบ HTU21D ที่ address 0x40', keep('htuReady', true, 'global'));
  yield* machine.e('setup-close', 'จบ setup() ต่อไปจะเข้า loop()', state => { state.stack = []; });

  while (true) {
    yield* machine.e('loop-open', 'เริ่มรอบอ่านความชื้นใหม่', state => {
      state.loopCount++;
      state.phase = 'loop';
      state.stack = ['loop()'];
      delete state.vars.humidityRH;
    });
    yield* machine.e('read-humidity', 'อ่าน HTU21D แล้วเก็บค่าที่อ่านใน humidityRH', (state, input) => {
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
