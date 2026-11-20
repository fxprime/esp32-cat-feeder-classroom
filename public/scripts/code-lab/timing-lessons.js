export const timingSampleStep = 250;
const wiring = 'GPIO23 → R 330Ω → LED (+), LED (−) → GND';
export const timingLessons = [
  {
    id:'timing-delay', label:'delay()', title:'สั่งให้โค้ดรอ 1 วินาที',
    intro:'ทุกครั้งที่เข้า loop() โปรแกรมจะนับงาน 1 ครั้ง ส่งเลขไปที่ Serial Monitor แล้วรอก่อนสลับไฟ LED',
    challenge:'ตอนที่อยู่บรรทัด delay() ค่า samples และไฟ LED เปลี่ยนไหม?',
    wiring, file:'06a_delay.ino',
  },
  {
    id:'timing-millis', label:'millis()', title:'จับเวลาไปพร้อมกับทำงานอื่น',
    intro:'ทุกครั้งที่เข้า loop() โปรแกรมยังนับงานและส่งเลขไปที่ Serial Monitor เมื่อเช็กว่าผ่านไป 1 วินาทีจึงสลับไฟ LED',
    challenge:'ก่อนครบ 1 วินาที ค่า now, elapsed และ samples เปลี่ยนอย่างไร แล้ว lastToggle จะเปลี่ยนตอนไหน?',
    wiring, file:'06b_millis.ino',
  },
];

const line = (id, code, title, explain, at='after', variable=null) => ({id,code,title,explain,at,variable});
export {line as sketchLine};
const global = (id, code, name, explain, constant=false) => line(id,code,'เก็บค่าเริ่มต้น',explain,'global',{name,scope:constant?'global / const':'global',boolean:name==='ledOn'});

export function timingProgram(id) {
  const meta = timingLessons.find(lesson => lesson.id===id);
  const polling = id==='timing-millis';
  const blink = indent => [
    line('toggle',indent+'ledOn = !ledOn;','กลับค่า ledOn','สลับ true กับ false แล้วเก็บกลับใน ledOn','after',{name:'ledOn',scope:'global',boolean:true}),
    line('timing-write',indent+'digitalWrite(LED_PIN, ledOn ? HIGH : LOW);','สั่งขา LED','ใช้ ledOn เลือก HIGH ให้ไฟติด หรือ LOW ให้ไฟดับ'),
  ];
  const lines = [
    global('led-pin','const int LED_PIN = 23;','LED_PIN','เก็บหมายเลขขา LED ไว้ใน LED_PIN',true),
    global('interval','const unsigned long intervalMs = 1000;','intervalMs','ตั้งช่วงเวลาให้ไฟสลับทุก 1,000 ms',true),
    global('led-state','bool ledOn = false;','ledOn','เริ่มด้วยไฟดับ'),
    global('samples','unsigned long samples = 0;','samples','นับจำนวนครั้งที่ทำงานใน loop()'),
    ...(polling?[global('last-start','unsigned long lastToggle = 0;','lastToggle','เก็บเวลาครั้งล่าสุดที่สลับไฟ เริ่มที่ 0 ms')]:[]),
    line('setup-open','void setup() {','setup()','เริ่มตั้งค่าบอร์ดครั้งเดียว'),
    line('setup-led','  pinMode(LED_PIN, OUTPUT);','ตั้งขาออก','ตั้ง GPIO23 ให้ส่งสัญญาณออก'),
    line('setup-serial','  Serial.begin(115200);','เปิด Serial','เตรียมส่งตัวนับให้คอมพิวเตอร์ดู'),
    line('setup-close','}','จบ setup()','ต่อไปจะเข้า loop()','before'),
    line('loop-open','void loop() {','เริ่ม loop()','เริ่มทำงานรอบใหม่'),
    line('print','  Serial.println(++samples);','นับงานแล้วส่งให้ Serial','เพิ่ม samples ทีละ 1 แล้วส่งค่าที่ได้ไปยัง Serial Monitor','after',{name:'samples',scope:'global'}),
    ...(polling?[
      line('read-clock','  const unsigned long now = millis();','อ่านเวลาปัจจุบัน','millis() คืนเวลาที่ผ่านไปตั้งแต่เริ่มรัน หน่วยเป็น ms','after',{name:'now',scope:'loop / const'}),
      line('elapsed','  const unsigned long elapsed = now - lastToggle;','หาว่าผ่านมากี่มิลลิวินาที','เอาเวลาปัจจุบันลบเวลาที่สลับไฟครั้งล่าสุด','after',{name:'elapsed',scope:'loop / const'}),
      line('timing-if','  if (elapsed >= intervalMs) {','เช็กว่าครบช่วงหรือยัง','ถ้าครบ 1,000 ms ก็เข้าไปสลับไฟ ถ้ายังไม่ครบก็จบรอบแล้วทำงานรอบต่อไป','test'),
      line('stamp','    lastToggle = now;','จำเวลาใหม่','เก็บ now เป็นจุดเริ่มของช่วงถัดไป','after',{name:'lastToggle',scope:'global'}),
      ...blink('    '),
      line('if-close','  }','จบส่วนสลับไฟ','กลับมาที่ loop()','before'),
    ]:[
      line('wait-on','  delay(intervalMs);','พักที่บรรทัดนี้','ระหว่างรอ loop() ยังไปบรรทัดถัดไปไม่ได้','sleep'),
      ...blink('  '),
    ]),
    line('loop-close','}','จบ loop() รอบนี้','กลับไปเริ่มรอบถัดไป','before'),
  ];
  return {meta,lines};
}

// The displayed sketch is the source of the WebAssembly build. Add checkpoints
// after statements so the player can show the actual output and variable values.
export function instrumentSketch(program) {
  const globals = [];
  const body = program.lines.map(({id,code,at,variable,flow}, index) => {
    const value = variable?.expression ?? variable?.name ?? (id==='timing-if'?'elapsed >= intervalMs':'0');
    const isString = variable?.type==='string';
    const trace = flow?.extra ? 'timingTextNumber' : isString || variable?.type==='text' ? 'timingText' : 'timingStatement';
    const args = [index,isString?`${value}.c_str()`:value];
    if(flow?.extra)args.push(flow.extra.name);
    const statement = `${trace}(${args.join(', ')})`;
    switch (at) {
      case 'none': return code;
      case 'call': return `  timingCall(${index});\n${code}\n  ${statement};`;
      case 'return': return code.replace(/return (.*);/, `return timingReturn(${index}, $1);`);
      case 'global': globals.push(`  ${statement};`); return code;
      case 'before': return `  ${statement};\n${code}`;
      case 'test': return `  if ((${statement}, ${value})) {`;
      case 'sleep': return code.replace('delay(', 'timingDelay(').replace(');', `, ${index});`);
      default: return `${code}\n  ${statement};`;
    }
  });
  return [...body,'void showGlobals() {',...globals,'}'].join('\n');
}
