import {meterCases} from './cases.js';
export const getCase=id=>meterCases.find(item=>item.id===id);
export function initialState(id){const c=getCase(id);return {mode:'off',jack:'v',blackJack:'com',red:null,black:null,power:false,fault:c.fault,load:false,gapOpen:false,fuseBlown:false};}
export function guideState(id,state){const c=getCase(id);return {...state,mode:c.mode,blackJack:'com',jack:c.mode==='current'?'ma':'v',red:c.pair[0],black:c.pair[1],power:!c.unpowered&&id!=='current',gapOpen:id==='current'?true:state.gapOpen};}
const pair=(a,b,x,y)=>(a===x&&b===y)||(a===y&&b===x);
export function nodeVoltages(id,s){
 if(!s.power)return Object.fromEntries(getCase(id).points.map(p=>[p.id,0]));
 if(id==='voltage')return {P:s.fault?5:3.3,N:0};
 if(id==='polarity')return {P:s.fault?-3.3:3.3,N:0};
 if(id==='drop')return {S:5,L:s.load?(s.fault?4.2:4.95):5,G:0};
 if(id==='current')return {P:5,A:5,B:s.gapOpen?0:5,N:0};
 return null;
}
const result=(display,unit,message,extra={})=>({display,unit,message,beep:false,severity:'ok',...extra});
const stop=message=>result('—','',message,{severity:'stop'});
export function measure(id,s){
 const c=getCase(id),r=s.red,b=s.black;
 if(!s.jack||!s.blackJack)return stop('ปลั๊ก Banana ยังไม่เสียบครบสองเส้น ลากปลั๊กกลับเข้าช่องมิเตอร์ก่อน');
 if(s.jack===s.blackJack)return stop('หนึ่งช่องเสียบได้หนึ่งปลั๊ก แยกสายดำไป COM และสายแดงไปช่องที่ตรงกับโหมด');
 if(!r||!b)return stop('เลือกหัววัดแดง/ดำ แล้วแตะจุดวัดให้ครบสองจุดก่อน');
 if(!c.points.some(p=>p.id===r)||!c.points.some(p=>p.id===b))return stop('หัววัดต้องอยู่บนจุดในวงจรนี้');
 const sourcePair=id==='drop'?pair(r,b,'S','G'):id==='current'?(pair(r,b,'P','N')||pair(r,b,'A','N')||(!s.gapOpen&&pair(r,b,'B','N'))):['voltage','polarity'].includes(id)?pair(r,b,'P','N'):false;
 if(s.power&&((s.jack==='ma'&&s.blackJack==='com')||(s.jack==='com'&&s.blackJack==='ma'))&&sourcePair&&!s.fuseBlown)return result('FUSE','ภาพจำลอง','ช่อง mA ต่อคร่อมแหล่งจ่าย: เกิดทางลัดผ่านมิเตอร์ ฟิวส์ในภาพจำลองขาด ตัดไฟแล้วเริ่มภาพใหม่ มิเตอร์จริงบางรุ่นอาจอ่าน 0 แทนการขึ้น FUSE',{severity:'fuse',blowFuse:true});
 if((s.jack==='ma'||s.blackJack==='ma')&&s.fuseBlown)return stop('ฟิวส์ช่อง mA ในภาพขาดแล้ว เส้นทางนี้เปิดอยู่ การอ่าน 0 ไม่ยืนยันว่าโหลดไม่กินกระแส ตัดไฟแล้วเริ่มภาพใหม่');
 if(s.blackJack!=='com')return stop('สายดำต้องเสียบ COM เพื่อเป็นจุดอ้างอิง ตัดไฟก่อนย้ายปลั๊กกลับ');
 if(s.mode==='off')return stop('หมุนเลือกโหมดวัดก่อน');
 if(['continuity','ohm','diode'].includes(s.mode)&&s.power)return stop('หยุดวัดโหมดนี้: ถอดไฟทุกแหล่งและตรวจว่าไม่มีแรงดันค้างก่อนใช้ Continuity / Ω / Diode');
 if(s.mode==='current'&&s.jack!=='ma')return stop('การวัดกระแสตัวอย่าง 5mA นี้ต้องใช้ช่อง mA ที่มีฟิวส์ โดยย้ายสายตอนตัดไฟ');
 if(s.mode!=='current'&&s.jack!=='v')return stop('ย้ายสายแดงกลับ VΩ ก่อนใช้โหมดแรงดัน / Continuity / Ω / Diode และถอดไฟก่อนย้ายสาย');
 if(s.mode!==c.mode)return stop(`โจทย์นี้ใช้ ${c.mode==='dcv'?'V⎓':c.mode==='current'?'mA⎓':c.mode==='ohm'?'Ω':c.mode==='diode'?'Diode':'Continuity'} เลือกโหมดให้ตรงกับสิ่งที่ต้องการรู้`);
 if(c.mode==='continuity'){
  if(r===b)return result('0.4','Ω · บี๊บ','หัววัดแตะจุดเดียวกัน ค่าต่ำนี้ยังไม่ได้ยืนยันว่าสองจุดที่ต้องการตรวจต่อถึงกัน',{beep:true});
  const connected=r===b||(id==='continuity'?!s.fault&&pair(r,b,'A','B'):id==='short'?s.fault&&pair(r,b,'P','N'):id==='broken'?pair(r,b,'A','C')||!s.fault:id==='ground'?!s.fault:false);
  return connected?result('0.4','Ω · บี๊บ',id==='short'?'ราง P–N ในภาพต่อถึงกัน เป็นสายลัดที่ต้องแก้ก่อนเปิดไฟ':'สองจุดนี้มีเส้นทางความต้านทานต่ำต่อถึงกัน เกณฑ์เสียงบี๊บขึ้นกับรุ่นมิเตอร์',{beep:true,severity:id==='short'?'notice':'ok'}):result('OL','ไม่บี๊บ',id==='short'?'รางบวกกับ GND ในภาพนี้ไม่ต่อถึงกันโดยตรง':'ไม่พบทางต่อถึงกันในเส้นทางที่วัด ตรวจแถบทองแดง สาย และรอยแบ่งรางต่อ');
 }
 if(c.mode==='dcv'){
  const volts=nodeVoltages(id,s);const v=volts[r]-volts[b];
  const message=!s.power?'แหล่งจ่ายปิดอยู่ จึงวัดได้ 0V ต้องวัดอีกครั้งขณะมีไฟก่อนสรุป':r===b?'หัววัดแตะจุดเดียวกัน จึงได้ความต่างศักย์ 0V':id==='voltage'&&Math.abs(v)>3.6?'ได้ 5V ซึ่งสูงกว่าพิกัดอุปกรณ์ 3.3V ที่กำลังจะต่อ อย่าเพิ่งเชื่อมเข้าขา 3V3':v<0?'ค่าติดลบ: จุดแดงมีศักย์ต่ำกว่าจุดดำ ตรวจหัววัดและขั้วสาย ไม่ใช่หลักฐานว่าแหล่งจ่ายเสีย':id==='drop'&&pair(r,b,'S','L')?`แรงดันตกคร่อมสาย ${Math.abs(v).toFixed(2)}V ลองเทียบตอนโหลดทำงานกับหยุด`:'นี่คือความต่างศักย์ระหว่างจุดแดงกับจุดดำ วัดแบบขนานกับสองจุดที่ต้องการเทียบ';
  return result(v.toFixed(2),'V DC',message,{severity:id==='voltage'&&Math.abs(v)>3.6?'notice':'ok'});
 }
 if(c.mode==='ohm')return r===b?result('0.4','Ω','หัววัดแตะจุดเดียวกัน กำลังวัดทางลัด ไม่ใช่ตัวต้านทาน'):s.fault?result('3.30','kΩ','3.30kΩ = 3300Ω ไม่ใช่ 330Ω ตรวจหน่วยให้ครบ'):result('330.0','Ω','ได้ค่าของ R ประมาณ 330Ω ในภาพนี้ถอดแยกจากทางอื่นแล้ว');
 if(c.mode==='diode')return r===b?result('0.000','V','แตะจุดเดียวกัน จึงไม่ได้วัดคร่อม LED'):!s.fault&&r==='A'&&b==='K'?result('1.850','V · Vf','ทิศเดินหน้า: LED แดงในภาพนำกระแสและมีแรงดันตกประมาณ 1.85V'):result('OL','Diode',s.fault?'LED ในภาพขาด จึงขึ้น OL ทั้งสองทิศ แต่ของจริงต้องพิจารณาแรงดันทดสอบของมิเตอร์ด้วย':'ทิศย้อนจึงขึ้น OL ลองสลับหัววัดก่อนสรุปว่า LED เสีย');
 if(id==='current'){
  if(!s.gapOpen)return stop('ยังไม่ได้เปิดช่องวงจร A–B มิเตอร์ต้องแทรกเป็นทางผ่านอนุกรม ตัดไฟแล้วเปิดช่องก่อน');
  if(!pair(r,b,'A','B')&&!pair(r,b,'P','B'))return stop('แตะคร่อมช่องเปิด A–B เพื่อให้กระแสผ่านมิเตอร์เข้าโหลด ไม่ใช่แตะคร่อมแหล่งจ่าย');
  if(!s.power)return result('0.00','mA','ต่ออนุกรมแล้ว แต่ยังปิดแหล่งจ่าย ตรวจสายก่อนเปิดไฟ');
  const sign=['A','P'].includes(r)?1:-1;
  return result((sign*5).toFixed(2),'mA',sign>0?'5V ÷ 1kΩ = 5mA กระแสผ่านมิเตอร์และโหลดเป็นทางเดียวกัน':'−5mA: กระแสเข้าทาง COM ในการวางหัววัดครั้งนี้ ขนาดยัง 5mA ทิศอ้างอิงของมิเตอร์กลับกัน',{flow:true,sign});
 }
 return stop('เลือกการวัดให้ครบก่อน');
}
