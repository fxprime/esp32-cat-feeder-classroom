import {functionLessons,functionProgram} from './function-lessons.js';
import {serialLesson,serialProgram} from './serial-lesson.js';
import {feederHumidityLesson,feederHumidityProgram} from './feeder-humidity.js';
export const examples=[
 {id:'blink',label:'setup / loop',title:'รู้จัก setup() และ loop() ด้วยไฟแดงดวงเดิม',intro:'setup() เตรียมขา LED ครั้งเดียว จากนั้น loop() เปิดไฟ รอ ปิดไฟ แล้วเริ่มรอบใหม่ ลองดูว่าพอกลับรอบที่ 2 โปรแกรมย้อนเข้า setup() หรือไม่',challenge:'เปลี่ยนเวลารอเป็น 1000 ms ไฟจะเปลี่ยนช้าหรือเร็วขึ้น?',wiring:'GPIO23 → R 330Ω → LED (+), LED (−) → GND',file:'01_setup_loop.ino'},
 feederHumidityLesson,
 {id:'condition',label:'if / else',title:'อ่านปุ่ม แล้วเลือกทางทำงาน',intro:'ปุ่มนี้ต่อระหว่าง GPIO18 กับ GND และเปิด INPUT_PULLUP ไว้ ไม่กดอ่านได้ HIGH กดแล้วอ่านได้ LOW โปรแกรมอ่านค่าก่อน แล้วจึงเลือกทาง if หรือ else',challenge:'อ่านค่าปุ่มแล้วลองเปลี่ยนปุ่มก่อนถึง if โปรแกรมจะใช้ค่าใหม่หรือค่าที่อ่านเก็บไว้?',wiring:'ปุ่ม: GPIO18 ↔ GND (INPUT_PULLUP) · LED: GPIO23 → 330Ω → LED → GND',file:'02_if_else.ino'},
 {id:'sensor',label:'ตัวแปร / return',title:'รับค่าเซนเซอร์ เก็บไว้ แล้วคำนวณต่อ',intro:'analogRead() อ่านค่ามาเก็บใน raw ฟังก์ชัน toDuty() แปลงช่วงตัวเลขแล้วส่งผลกลับมาเก็บใน duty จากนั้น ledcWrite() จึงปรับไฟ ลองเลื่อนเซนเซอร์ระหว่างแต่ละคำสั่ง',challenge:'ถ้าเลื่อนเซนเซอร์หลังอ่าน raw แล้ว ไฟจะเปลี่ยนทันทีหรือรออ่านรอบถัดไป?',wiring:'ปุ่มหมุน: ขากลาง → GPIO34, ปลาย → 3.3V/GND · LED ที่ GPIO23 ผ่าน 330Ω',file:'03_variables_return.ino'},
 {id:'for',label:'for / array',title:'ใช้โค้ดชุดเดียว ไล่เปิด LED 3 ดวง',intro:'array เก็บหมายเลขขาไว้ 3 ค่า ส่วน i เป็นตำแหน่งที่กำลังเลือก เริ่มจาก 0, 1, 2 เมื่อ i เป็น 3 เงื่อนไข i < 3 จะเป็นเท็จและออกจาก for',challenge:'รอบที่ i = 1 โปรแกรมกำลังเปิด GPIO ใด? ทำไมไม่ใช่ขา 1?',wiring:'GPIO23, GPIO22, GPIO21 → ตัวต้านทาน 330Ω และ LED แยกดวง → GND ร่วม',file:'04_for_array.ino'},
 {id:'function',label:'ฟังก์ชัน'},
 {id:'timing',label:'delay / millis',title:'รถสองคันบนลู่วิ่งรอบสนามฟุตบอล',intro:'ลองปล่อยกล่องช่วงทางตรงกับช่วงที่รถกำลังเลี้ยว แล้วดูว่าแต่ละคันอ่านเซนเซอร์ทันเมื่อไหร่',file:'06_delay_vs_millis.ino'},
 serialLesson,
];
const line=(id,code,title,explain)=>({id,code,title,explain});
export function buildProgram(id,options={}){
 if(id===serialLesson.id)return serialProgram();
 if(id===feederHumidityLesson.id)return feederHumidityProgram();
 if(functionLessons.some(lesson=>lesson.id===id))return functionProgram(id);
 const delay=Math.min(1500,Math.max(250,Number(options.delay)||500)),a=[];
 const add=(...args)=>a.push(line(...args));
 const led=()=>add('led-pin','const int LED_PIN = 23;','ค่าคงที่และชนิดข้อมูล','const กำหนดค่าที่ไม่เปลี่ยนขณะรัน int คือจำนวนเต็ม LED_PIN เป็นชื่อที่ใช้แทนหมายเลขขา 23');
 const setup=(extra=[])=>{add('setup-open','void setup() {','setup()','ฟังก์ชันที่ระบบเรียกครั้งเดียวหลังเปิดเครื่องหรือรีเซ็ต void หมายถึงไม่มีค่าส่งกลับ');for(const x of extra)add(...x);add('setup-close','}','ปีกกาปิดบล็อก','ปีกกา { } กำหนดขอบเขตของฟังก์ชัน ไม่ต้องมี ; หลังปีกกาปิดฟังก์ชันนี้');};
 const output=['setup-led','  pinMode(LED_PIN, OUTPUT);','ตั้งทิศทางขา','pinMode() ตั้ง GPIO23 ให้ส่งสัญญาณออก OUTPUT เป็นค่าที่ส่งให้ฟังก์ชันในวงเล็บ'];
 if(id==='blink'){
 led();add('wait-var',`const int waitMs = ${delay};`,'ตั้งชื่อให้เวลา','waitMs เก็บเวลารอหน่วยมิลลิวินาที เปลี่ยนค่าตรงนี้แล้ว delay() ทั้งสองแห่งใช้ค่าเดียวกัน');setup([output]);
 add('loop-open','void loop() {','loop()','หลัง setup() ระบบเรียก loop() ซ้ำ เมื่อถึงปีกกาปิดจะกลับมาเริ่ม loop() รอบใหม่');
 add('high','  digitalWrite(LED_PIN, HIGH);','เรียกฟังก์ชันพร้อมอาร์กิวเมนต์','ส่งชื่อขากับระดับ HIGH ให้ digitalWrite() LED ที่ต่อผ่าน R จึงติด ; ใช้จบคำสั่งนี้');
 add('wait-on','  delay(waitMs);','รอโดยคงสถานะเดิม','โค้ดใน loop นี้รออยู่ตรงนี้ LED ยังคงติดจนกว่าจะมีคำสั่งเปลี่ยนขา');
 add('low','  digitalWrite(LED_PIN, LOW);','สั่งขาเป็น LOW','LED ดับเมื่อคำสั่งนี้ทำงาน ไม่ได้ดับเองเพียงเพราะผ่าน delay()');add('wait-off','  delay(waitMs);','รอขณะไฟดับ','เมื่อครบเวลา โปรแกรมจะจบ loop() รอบนี้และเริ่มรอบถัดไป');add('loop-close','}','จบหนึ่งรอบ','กลับไป loop() ไม่ย้อน setup() จนกว่าจะรีเซ็ต');
 }else if(id==='condition'){
 led();add('button-pin','const int BUTTON_PIN = 18;','ชื่อขารับสัญญาณ','BUTTON_PIN เป็นขาที่ต่อปุ่ม ขาหนึ่งของปุ่มต่อ GPIO18 อีกขาต่อ GND');setup([output,['setup-button','  pinMode(BUTTON_PIN, INPUT_PULLUP);','เปิดตัวดึงขึ้นภายใน','ไม่กดปุ่ม ขาถูกดึงเป็น HIGH กดปุ่มเชื่อม GND จึงอ่านได้ LOW']]);
 add('loop-open','void loop() {','เริ่มรอบอ่านปุ่ม','ตัวแปร state ในบล็อกนี้สร้างใหม่แต่ละรอบ');add('read-button','  int state = digitalRead(BUTTON_PIN);','ตัวแปรเก็บผลอ่าน','digitalRead() คืน HIGH หรือ LOW ค่าเก็บไว้ใน state การเปลี่ยนปุ่มภายหลังไม่ได้ย้อนเปลี่ยนผลที่อ่านแล้ว');add('if','  if (state == LOW) {','เปรียบเทียบค่า','== ใช้ถามว่าเท่ากันหรือไม่ ต่างจาก = ที่ใช้กำหนดค่า เมื่อเป็นจริงจึงเข้าบล็อกนี้');add('high','    digitalWrite(LED_PIN, HIGH);','ทางที่เป็นจริง','ทำบรรทัดนี้เฉพาะเมื่อ state เป็น LOW');add('else','  } else {','ทางเลือกอีกทาง','else ทำงานเมื่อเงื่อนไข if เป็นเท็จ แต่ละรอบเลือกทำหนึ่งทาง');add('low','    digitalWrite(LED_PIN, LOW);','ทางที่เป็นเท็จ','ทำบรรทัดนี้เมื่อไม่ได้อ่านว่า LOW');add('if-close','  }','จบเงื่อนไข','หลังเลือกทางแล้ว ทั้งสองทางมารวมกันตรงนี้');add('wait','  delay(50);','เว้นระยะก่อนอ่านใหม่','รอ 50 ms แล้วจึงเริ่มอ่านปุ่มรอบใหม่ ตัวอย่างนี้ยังไม่จำลองการเด้งของหน้าสัมผัส');add('loop-close','}','จบรอบ','รอบถัดไปอ่านค่าปุ่มอีกครั้ง');
 }else if(id==='sensor'){
 led();add('sensor-pin','const int SENSOR_PIN = 34;','ขา ADC','ขากลางปุ่มหมุนต่อ GPIO34 ขา ADC รับแรงดัน และ analogRead() คืนค่าเลขดิบ');add('helper-open','int toDuty(int value) {','ฟังก์ชันที่คืนจำนวนเต็ม','int ด้านหน้าเป็นชนิดค่าที่คืน ส่วน int value ในวงเล็บเป็นพารามิเตอร์รับค่าตอนเรียก');add('helper-return','  return map(value, 0, 4095, 0, 255);','return ส่งค่ากลับ','แปลงเลขดิบ 0–4095 เป็น duty 0–255 แล้วคืนให้จุดเรียก ใช้จำนวนเต็มจึงตัดเศษ');add('helper-close','}','จบฟังก์ชันช่วย','การประกาศฟังก์ชันไว้ไม่ได้ทำให้มันรัน ต้องมีคำสั่งเรียก');setup([['setup-pwm','  ledcAttach(LED_PIN, 5000, 8);','ตั้ง PWM ของ ESP32','Arduino-ESP32 core 3.x: ผูกขากับ PWM 5000 Hz ความละเอียด 8 บิต (0–255)'],['setup-serial','  Serial.begin(115200);','เตรียมช่องข้อความ','ตั้งการสื่อสาร Serial เพื่อส่งค่าที่อ่านให้คอมพิวเตอร์']]);
 add('loop-open','void loop() {','เริ่มรอบใหม่','raw และ duty เป็นตัวแปรภายใน loop() เกิดขึ้นใหม่แต่ละรอบ');add('read-raw','  int raw = analogRead(SENSOR_PIN);','รับค่าเข้า raw','เก็บภาพค่าขณะอ่านไว้ เลื่อนแถบเซนเซอร์หลังบรรทัดนี้แล้ว raw ยังไม่เปลี่ยนจนอ่านใหม่');add('call-duty','  int duty = toDuty(raw);','ส่งค่าให้ฟังก์ชัน','เรียก toDuty() โดยส่งค่าที่อยู่ใน raw ไปเป็นพารามิเตอร์ value');add('write-duty','  ledcWrite(LED_PIN, duty);','ใช้ค่าที่คำนวณได้','PWM เปลี่ยนเมื่อคำสั่งนี้ทำงาน ไฟไม่ได้เปลี่ยนจากการประกาศตัวแปรเพียงอย่างเดียว');add('print','  Serial.println(raw);','ส่งผลให้มองเห็น','พิมพ์ raw ไปยัง Serial Monitor หนึ่งบรรทัด ข้อความนี้เป็นค่าที่อ่านเก็บไว้ในรอบนี้');add('wait','  delay(100);','เว้นระยะ','รอ 100 ms ก่อนอ่านค่าใหม่');add('loop-close','}','จบรอบ','ค่าตัวแปรภายในรอบหมดขอบเขต รอบใหม่จะอ่านใหม่');
 }else if(id==='for'){
 add('pins','const int pins[] = {23, 22, 21};','array เก็บหลายค่า','pins[0] คือ23 pins[1] คือ22 และ pins[2] คือ21 หมายเลขตำแหน่งเริ่มจาก0');
 setup([['setup-for','  for (int i = 0; i < 3; i++) {','for สำหรับเตรียมทุกขา','ตั้ง i เป็น0 ตรวจ i<3 แล้วทำบล็อก เมื่อจบบล็อกจึงเพิ่ม i'],['setup-pin','    pinMode(pins[i], OUTPUT);','เลือกขาจาก array','เลือกหมายเลขขาที่ตำแหน่ง i ไม่ใช่ใช้ค่า i เป็นขา GPIO'],['setup-for-close','  }','กลับไปตรวจ for','เตรียมขาถัดไปจน i<3 เป็นเท็จ']]);
 add('loop-open','void loop() {','เริ่มรอบไฟวิ่ง','for ด้านในจะไล่ครบ3ตำแหน่งใน loop() รอบเดียว');add('for-init','  for (int i = 0; i < 3; i++) {','เริ่ม → ตรวจ → เพิ่ม','int i=0 เริ่มค่า, i<3 เป็นเงื่อนไข, i++ เพิ่มหลังจบบล็อก');add('high','    digitalWrite(pins[i], HIGH);','เปิดดวงที่เลือก','เลือก GPIO ตาม pins[i] LED ดวงอื่นยังคงสถานะเดิม');add('wait',`    delay(${delay});`,'เว้นเวลาให้เห็นไฟ','ดวงที่เลือกติดค้างระหว่างรอ');add('low','    digitalWrite(pins[i], LOW);','ปิดก่อนเลือกดวงถัดไป','ทำบรรทัดนี้ก่อนเพิ่ม i');add('for-close','  }','เพิ่ม i แล้วตรวจใหม่','i++ เพิ่ม1 ถ้า i เป็น3 จะไม่เข้าบล็อกอีก เพราะ3<3เป็นเท็จ');add('loop-close','}','วนไฟวิ่งรอบใหม่','ออกจาก for แล้วจบ loop() จึงเริ่ม loop() รอบถัดไป');

 }
 return {id,lines:a,options:{delay},meta:examples.find(e=>e.id===id)};
}
