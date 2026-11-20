import { FEEDER_LIMITS } from './feeder/model.js';

export const scopeDetails = {
  function: {
    label: "ฟังก์ชัน · updateGate()",
    input: "ระยะ cm, สถานะสิ่งกีดขวาง blocked, โหมดไฟ mode และจำนวนข้อความค้างส่ง pending",
    output: "สั่งไม้กั้นและไฟ แล้วใช้ return ส่งมุม angle กลับไปให้โค้ดที่เรียก",
    example: "รถอยู่ห่าง 12 ซม. ทางโล่ง เปิดโหมด 1 และมีข้อความค้าง 2 รายการ → เปิดไม้กั้น เปิดไฟโหมด พิมพ์ 2 ข้อความ แล้วคืนค่า 90",
  },
  if: {
    label: "if · ตรวจเงื่อนไขแรก",
    input: "blocked เป็น true หรือ false",
    output: "ถ้ามีสิ่งกีดขวาง ให้ตั้ง angle เป็น 90° และข้ามทางเลือกที่เหลือ",
    example: "มีคนยืนอยู่ใต้ไม้กั้น → ตั้งมุมให้เปิด โดยยังไม่ต้องดูระยะรถ",
  },
  "else-if": {
    label: "else if · ตรวจเงื่อนไขถัดไป",
    input: "เมื่อไม่มีสิ่งกีดขวาง จึงตรวจว่า cm น้อยกว่า 20 หรือเปล่า",
    output: "ถ้ารถเข้ามาใกล้กว่า 20 ซม. ให้ตั้ง angle เป็น 90°",
    example: "ทางโล่งและรถอยู่ห่าง 12 ซม. → ตั้งมุมให้เปิด",
  },
  else: {
    label: "else · ทางเลือกที่เหลือ",
    input: "เข้ามาเมื่อเงื่อนไขก่อนหน้าทั้งหมดให้ผล false",
    output: "ตั้ง angle เป็น 0° แล้วไปทำคำสั่งหลังชุด if",
    example: "ทางโล่งและรถยังอยู่ห่าง 30 ซม. → ตั้งมุมให้ปิด",
  },
  switch: {
    label: "switch · เลือกตามค่า",
    input: "ค่า mode ใช้เทียบกับป้าย case",
    output: "เริ่มที่ case ที่ค่าตรงกัน หรือไป default แล้วใช้ break ออกจาก switch",
    example: "เลือกโหมด 1 → ไปที่ case 1 เปิดไฟโหมด ถ้าเลือก 0 → ไปที่ default ปิดไฟโหมด",
  },
  case: {
    label: "case 1 · เมื่อค่าตรงกับ 1",
    input: "switch เลือกทางนี้เมื่อ mode เป็น 1",
    output: "เปิดไฟที่ GPIO27 แล้ว break ออกจาก switch ตัวแปร ledPin อยู่ในปีกกาคู่นี้",
    example: "เปิดโหมด 1 → ไฟบอกโหมดสว่าง พอออกจากบล็อกก็ใช้ชื่อ ledPin ตรงนี้ต่อไม่ได้",
  },
  default: {
    label: "default · เมื่อไม่มี case ที่ตรง",
    input: "ค่า mode ที่ไม่ตรงกับ case ใดเลย",
    output: "ปิดไฟที่ GPIO27 แล้ว break ออกจาก switch",
    example: "เลือกโหมด 0 → ไม่มี case 0 จึงใช้ default เพื่อปิดไฟโหมด",
  },
  block: {
    label: "{ } · บล็อกกำหนดขอบเขต",
    input: "บล็อกนี้เข้าตามลำดับ และอ่าน angle ที่ประกาศในฟังก์ชันได้",
    output: "สร้างค่า open ให้ for ข้างในใช้ พอพ้นปีกกาปิด ชื่อ open ก็หมดขอบเขต",
    example: "ถ้ามุมเป็น 90° ให้จดไว้ในตัวแปรชั่วคราวว่าไม้กั้นเปิด เพื่อใช้สั่งไฟสองดวง",
  },
  for: {
    label: "for · ทำซ้ำตามตัวนับ",
    input: "เริ่ม pin ที่ 25 ตรวจว่าไม่เกิน 26 แล้วเพิ่ม pin ทีละ 1 หลังจบแต่ละรอบ",
    output: "สั่ง GPIO25 และ GPIO26 ให้แสดงสถานะ open เหมือนกัน",
    example: "ไม้กั้นเปิด → รอบแรกเปิดไฟพิน 25 รอบถัดไปเปิดไฟพิน 26 แล้วหยุด",
  },
  while: {
    label: "while · วนขณะที่เงื่อนไขยังจริง",
    input: "ก่อนเริ่มแต่ละรอบ ตรวจว่า pending ยังมากกว่า 0 ไหม",
    output: "พิมพ์หนึ่งข้อความและลด pending ลง 1 ต่อรอบ พอเหลือ 0 ก็ไปต่อ",
    example: "มีข้อความค้าง 2 รายการ → พิมพ์ 2 ครั้ง ถ้าเริ่มจาก 0 ก็ข้ามลูปเลย",
  },
};

const gate = {
  scope: "function", head: "int updateGate(int cm, bool blocked, int mode, int pending)",
  body: [
    "int angle = 0;",
    { scope: "if", head: "if (blocked)", body: ["angle = 90;"] },
    { scope: "else-if", head: "else if (cm < 20)", body: ["angle = 90;"] },
    { scope: "else", head: "else", body: ["angle = 0;"] },
    "gate.write(angle);", "",
    {
      scope: "switch", head: "switch (mode)", body: [
        { scope: "case", head: "case 1:", body: ["const int ledPin = 27;", "digitalWrite(ledPin, HIGH);", "break;"] },
        { scope: "default", head: "default:", body: ["digitalWrite(27, LOW);", "break;"] },
      ],
    },
    "",
    {
      scope: "block", head: "", body: [
        "const bool open = angle == 90;",
        { scope: "for", head: "for (int pin = 25; pin <= 26; pin++)", body: ["digitalWrite(pin, open);"] },
      ],
    },
    "",
    { scope: "while", head: "while (pending > 0)", body: ['Serial.println("Gate event");', "pending--;"] },
    "return angle;",
  ],
};

const feeder = {
  scope: "function",
  head: "bool canDispense(float humidityRH, int foodPercent)",
  body: [
    "const bool sensorFault = isnan(humidityRH) || foodPercent < 0;",
    "const bool tooHumid = humidityRH >= " + FEEDER_LIMITS.humidity + ".0f;",
    "const bool empty = foodPercent <= " + FEEDER_LIMITS.emptyPercent + ";",
    "",
    {
      scope: "if", head: "if (sensorFault || tooHumid || empty)",
      body: ["return false;"],
    },
    { scope: "else", head: "else", body: ["return true;"] },
  ],
};

export const feederScopeDetails = {
  function: {
    label: "ฟังก์ชัน · canDispense()",
    input: "humidityRH คือความชื้นในถัง และ foodPercent คือระดับอาหารที่ประมาณจากระยะ",
    output: "คืน true ให้ไปทำขั้นต่อไป หรือ false ให้ฝายังปิด ค่าเฉพาะในปีกกาคู่นี้ เช่น tooHumid หมดขอบเขตเมื่อออกจากฟังก์ชัน",
    example: "ก่อนเปิดฝา ส่งค่าที่เพิ่งอ่านมาถามว่า ตอนนี้จ่ายอาหารได้ไหม",
  },
  if: {
    label: "if · มีเหตุให้งดมื้อนี้",
    input: "sensorFault, tooHumid และ empty คั่นด้วย || ซึ่งถามว่าอย่างน้อยหนึ่งค่าเป็นจริงไหม",
    output: "ถ้าอย่างใดอย่างหนึ่งเป็นจริง ทำคำสั่งในปีกกานี้แล้วคืน false ทันที",
    example: "ความชื้น 76% RH ทำให้ tooHumid จริง → คืน false → ฝายังปิด",
  },
  else: {
    label: "else · ผ่านเงื่อนไขที่ตรวจ",
    input: "มาถึงเมื่อ if ด้านบนเป็นเท็จ",
    output: "ทำเฉพาะคำสั่งในปีกกานี้ และคืน true ให้ผู้เรียก",
    example: "อ่านเซนเซอร์ได้ ความชื้น 55% RH และมีอาหาร → ไปขั้นบี๊บก่อนเปิดฝา",
  },
};

export function buildScopeExample(kind = 'gate') {
  const lines = [];
  const ranges = new Map();

  function render(block, depth) {
    const indent = "  ".repeat(depth);
    const head = block.head ? block.head + " {" : "{";
    const start = lines.length;
    lines.push({ code: indent + head, scope: block.scope, edge: "open" });
    for (const child of block.body) {
      if (typeof child === "string") {
        lines.push({ code: child ? indent + "  " + child : "", scope: block.scope });
      } else {
        render(child, depth + 1);
      }
    }
    lines.push({ code: indent + "}", scope: block.scope, edge: "close" });
    ranges.set(block.scope, { start, end: lines.length - 1 });
  }

  render(kind === 'feeder' ? feeder : gate, 0);
  return { lines, ranges };
}
