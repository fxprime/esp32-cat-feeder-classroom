import {sketchLine as line} from './timing-lessons.js';

export const serialLesson = {
  id:'serial', label:'Serial print', title:'ส่งค่าจาก ESP32 ไปที่ Serial Monitor',
  intro:'เดินโค้ดทีละบรรทัดแล้วดูว่าตัวเลขและข้อความไปต่อท้ายบรรทัดเดิม ขึ้นบรรทัดใหม่ หรือถูกจัดรูปแบบยังไง',
  challenge:'ถ้าตัด \\n ออกจาก Serial.printf() ข้อความรอบถัดไปจะเริ่มตรงไหน?',
  wiring:'เชื่อม ESP32 ผ่าน USB แล้วเปิด Serial Monitor ที่ 115200 baud',
  file:'07_serial_print.ino',
};

const stored = (name,type) => ({name,type,scope:'loop / const'});

export function serialProgram() {
  return {meta:serialLesson,lines:[
    line('setup-open','void setup() {','setup()','เตรียมการสื่อสารกับคอมพิวเตอร์ครั้งเดียว'),
    line('setup-serial','  Serial.begin(115200);','เปิด Serial','ตั้งความเร็วการสื่อสารเป็น 115200 baud'),
    line('setup-close','}','จบ setup()','ต่อไปจะเข้า loop()','before'),
    line('loop-open','void loop() {','เริ่ม loop()','เก็บค่าตัวอย่างไว้ในตัวแปรก่อนส่ง'),
    line('serial-raw','  const int raw = 2056;','จำนวนเต็ม','เก็บค่าตัวอย่างจาก ADC ใน raw','after',stored('raw','integer')),
    line('serial-volts','  const float volts = 1.657f;','เลขทศนิยม','เก็บแรงดันตัวอย่าง 1.657 โวลต์ใน volts','after',stored('volts','float')),
    line('serial-status','  const char status[] = "OK";','ข้อความ','เก็บตัวอักษร O และ K ใน status','after',stored('status','text')),
    line('serial-print-label','  Serial.print("ADC = ");','print() · ต่อบรรทัดเดิม','ส่งป้ายชื่อแล้วค้างตำแหน่งไว้ต่อท้าย'),
    line('serial-print-raw','  Serial.print(raw);','print() · ส่งค่าตัวแปร','ส่งค่าจาก raw ไปต่อท้าย ADC = บนบรรทัดเดียวกัน'),
    line('serial-print-volts-label','  Serial.print(" | V = ");','print() · คั่นข้อความ','ต่อข้อความคั่นก่อนส่งค่าแรงดัน'),
    line('serial-println-volts','  Serial.println(volts, 2);','println() · ส่งแล้วขึ้นบรรทัดใหม่','พิมพ์ volts เป็นทศนิยม 2 ตำแหน่ง จากนั้นย้ายตำแหน่งพิมพ์ไปบรรทัดใหม่'),
    line('serial-print-status-label','  Serial.print("Status = ");','print() · ต่อบรรทัดเดิม','เริ่มบรรทัดนี้ด้วยป้ายชื่อสถานะ'),
    line('serial-println-status','  Serial.println(status);','println() · ส่งข้อความในตัวแปร','พิมพ์ข้อความที่เก็บใน status แล้วขึ้นบรรทัดใหม่'),
    line('serial-printf-summary','  Serial.printf("ADC=%d | V=%.2f | %s\\n", raw, volts, status);','printf() · จัดรูปแบบหลายค่า','%d รับจำนวนเต็ม %.2f พิมพ์เลขทศนิยม 2 ตำแหน่ง %s รับข้อความ และ \\n ขึ้นบรรทัดใหม่'),
    line('wait-on','  delay(1000);','เว้นจังหวะก่อนส่งรอบถัดไป','พักหนึ่งวินาทีก่อนพิมพ์ข้อมูลชุดถัดไป','sleep'),
    line('loop-close','}','จบรอบนี้','กลับไปเริ่ม loop() รอบถัดไป','before'),
  ]};
}
