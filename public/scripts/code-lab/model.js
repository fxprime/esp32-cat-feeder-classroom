import {buildProgram} from './content.js';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const createLessonState=()=>({time:0,wait:0,setupCount:0,loopCount:0,phase:'พร้อม',line:null,message:'กดเดินทีละคำสั่งเพื่อเริ่ม',leds:{23:0,22:0,21:0},pins:{},vars:{},stack:[],log:[]});
export class LessonMachine{
 constructor(id,options={},inputs={}){
  this.program=buildProgram(id,options);
  this.id=id;
  this.inputs={button:false,raw:2048,...inputs};
  this.inputHistory=[];
  this.initializeExecution();
 }
 initializeExecution(){
  this.state=createLessonState();
  this.iterator=this.execute();
 }
 setInputs(input){Object.assign(this.inputs,input);this.inputs.raw=clamp(Math.trunc(Number(this.inputs.raw)||0),0,4095);}
 event(line,message,effect=null){return {line,message,effect};}
 advance(input){
  const s=this.state;
  if(s.wait>0){
   const ms=s.wait;
   s.time+=ms;
   s.wait=0;
   s.message=`ครบเวลารอ ${ms} ms แล้ว คำสั่งถัดไปยังไม่ทำจนกดเดินต่อ`;
   return;
  }
  const {value,done}=this.iterator.next();
  if(done)return;
  s.line=value.line;
  s.message=value.message;
  value.effect?.(s,input);
 }
 step(){
  const input={...this.inputs};
  this.inputHistory.push(input);
  this.advance(input);
  return this.snapshot();
 }
 get canRewind(){return this.inputHistory.length>0;}
 rewind(){
  if(this.canRewind){
   this.inputHistory.pop();
   // Rebuild the generator's call stack and branch decisions from the original inputs.
   this.initializeExecution();
   for(const input of this.inputHistory)this.advance(input);
  }
  return this.snapshot();
 }
 snapshot(){return structuredClone(this.state);}
 *e(line,message,effect=null){yield this.event(line,message,effect);}
 *delay(line,ms){yield* this.e(line,`ค้างที่ delay(${ms}) ขา LED ยังเป็นสถานะเดิม`,s=>{s.wait=ms;});}
 *write(line,pin,duty){yield* this.e(line,`สั่ง GPIO${pin} เป็น ${duty>0?duty===255?'HIGH':'PWM '+duty:'LOW'}`,s=>{s.leds[pin]=duty;});}
 *execute(){const id=this.id,{delay}=this.program.options;
 if(id==='for')yield* this.e('pins','เก็บ array pins = {23,22,21} ไว้ใช้เลือกขา',s=>{s.vars.pins={value:'{23, 22, 21}',scope:'global'};});
 else yield* this.e('led-pin','กำหนด LED_PIN = 23 ก่อนเข้า setup()',s=>{s.vars.LED_PIN={value:23,scope:'global / const'};});
 if(id==='blink')yield* this.e('wait-var',`กำหนด waitMs = ${delay}`,s=>{s.vars.waitMs={value:delay,scope:'global / const'};});
 if(id==='condition')yield* this.e('button-pin','กำหนด BUTTON_PIN = 18',s=>{s.vars.BUTTON_PIN={value:18,scope:'global / const'};});
 if(id==='sensor')yield* this.e('sensor-pin','กำหนด SENSOR_PIN = 34 ฟังก์ชัน toDuty ยังไม่รันจนถูกเรียก',s=>{s.vars.SENSOR_PIN={value:34,scope:'global / const'};});
 yield* this.e('setup-open','เข้า setup() ครั้งเดียว',s=>{s.setupCount++;s.phase='setup';s.stack=['setup()'];});
 if(id==='for'){
 for(let i=0;i<3;i++){yield* this.e('setup-for',`i=${i}: ${i}<3 เป็นจริง`,s=>{s.vars.i={value:i,scope:'setup / for'};});yield* this.e('setup-pin',`pins[${i}] = ${[23,22,21][i]} ตั้งขานี้เป็น OUTPUT`,s=>{s.pins[[23,22,21][i]]='OUTPUT';});}
 yield* this.e('setup-for', 'i=3: 3<3 เป็นเท็จ ออกจาก for',s=>{s.vars.i={value:3,scope:'setup / for'};});
 }else if(id==='sensor'){
 yield* this.e('setup-pwm','ตั้ง PWM ของ GPIO23: 5000 Hz / 8 bit',s=>{s.pins[23]='PWM 5kHz / 8bit';});yield* this.e('setup-serial','เปิด Serial 115200',s=>{s.serialReady=true;});
 }else{yield* this.e('setup-led','ตั้ง GPIO23 เป็น OUTPUT',s=>{s.pins[23]='OUTPUT';});if(id==='condition')yield* this.e('setup-button','ตั้ง GPIO18 เป็น INPUT_PULLUP',s=>{s.pins[18]='INPUT_PULLUP';});}
 yield* this.e('setup-close','จบ setup() ต่อไปจะเข้า loop()',s=>{s.stack=[];delete s.vars.i;});
 while(true){
 yield* this.e('loop-open','เริ่ม loop() รอบใหม่',s=>{s.loopCount++;s.phase='loop';s.stack=['loop()'];for(const key of ['state','raw','duty','value','return','times','i'])delete s.vars[key];});
 if(id==='blink'){yield* this.write('high',23,255);yield* this.delay('wait-on',delay);yield* this.write('low',23,0);yield* this.delay('wait-off',delay);}
 else if(id==='condition'){
 yield* this.e('read-button','อ่านปุ่มครั้งนี้แล้วเก็บลง state', (s,input)=>{s.vars.state={value:input.button?'LOW':'HIGH',scope:'loop / local'};});
 const pressed=this.state.vars.state.value==='LOW';yield* this.e('if',`state == LOW เป็น ${pressed?'จริง → เข้า if':'เท็จ → ไป else'}`);
 if(pressed)yield* this.write('high',23,255);else{yield* this.e('else','เลือกทาง else');yield* this.write('low',23,0);}
 yield* this.e('if-close','จบทางเลือก กลับมาทำโค้ดร่วมกัน');yield* this.delay('wait',50);
 }else if(id==='sensor'){
 yield* this.e('read-raw','อ่านเซนเซอร์แล้วเก็บลง raw',(s,input)=>{s.vars.raw={value:input.raw,scope:'loop / local'};});
 yield* this.e('call-duty','ส่ง raw ไปให้ toDuty()');
 yield* this.e('helper-open','เข้าฟังก์ชัน toDuty(value)',s=>{s.stack=['loop()','toDuty(raw)'];s.vars.value={value:s.vars.raw.value,scope:'toDuty / parameter'};});
 const duty=Math.trunc(this.state.vars.value.value*255/4095);
 yield* this.e('helper-return',`return คืนเลข ${duty} ให้จุดเรียก`,s=>{s.vars.return={value:duty,scope:'ค่าที่ส่งกลับ'};});
 yield* this.e('call-duty',`กลับมาที่ loop() เก็บค่าคืนลง duty=${duty}`,s=>{s.stack=['loop()'];s.vars.duty={value:duty,scope:'loop / local'};delete s.vars.value;delete s.vars.return;});
 yield* this.write('write-duty',23,duty);
 yield* this.e('print',`Serial ส่ง raw = ${this.state.vars.raw.value}`,s=>{s.log.push(String(s.vars.raw.value));if(s.log.length>6)s.log.shift();});yield* this.delay('wait',100);
 }else if(id==='for'){
 yield* this.e('for-init','เริ่ม i=0 และตรวจ i<3',s=>{s.vars.i={value:0,scope:'loop / for'};});
 for(let i=0;i<3;i++){
 const pin=[23,22,21][i];yield* this.write('high',pin,255);yield* this.delay('wait',delay);yield* this.write('low',pin,0);
 yield* this.e('for-close',`i++ เป็น ${i+1} → ${i+1}<3 ${i+1<3?'จริง ทำรอบถัดไป':'เท็จ ออกจาก for'}`,s=>{s.vars.i={value:i+1,scope:'loop / for'};});
 }
 delete this.state.vars.i;

 }
 yield* this.e('loop-close','จบรอบนี้ กลับไป loop() รอบใหม่',s=>{s.stack=[];for(const key of ['state','raw','duty','i'])delete s.vars[key];});
 }
 }
}
export function syntaxExample(program,fault='none'){
 const lines=program.lines.map(x=>({...x}));if(fault==='none')return {lines,error:null};
 if(fault==='semicolon'){const target=lines.find(l=>l.id==='high');if(target){target.code=target.code.replace(/;$/,'');return {lines,error:{line:target.id,message:'คำสั่ง digitalWrite(...) นี้ขาด ; ปิดท้าย ตรวจไม่ผ่านก่อนเริ่มจำลอง'}};}}
 if(fault==='brace'){const target=lines.find(l=>l.id==='loop-close');if(target){target.code='// ปีกกาปิดหายไป';return {lines,error:{line:target.id,message:'ปีกกาเปิดและปิดไม่ครบคู่ บล็อก loop() ยังไม่ปิด'}};}}
 return {lines,error:null};
}
