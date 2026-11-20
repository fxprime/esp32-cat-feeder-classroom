// Electrical connectivity is checked by nets, never by a fixed answer/slot map.
export const railSplitAfter = 9;

export const challenges = [
  { id: 'one-led', count: 1, title: 'Mini 1 · ต่อไฟแดงแจ้งปัญหา',
    prompt: 'ไฟ 3.3 V และ GND เข้ารางบนฝั่งซ้าย ปัก LED แดง 1 ดวงกับ R 330 Ω ถ้าใช้รางขวา ให้ต่อจัมเปอร์ + ไป + และ − ไป − ข้ามรอยตัด',
    parts: 'LED สีแดง × 1 · R 330Ω × 1',
    success: 'ไฟแดงพร้อมใช้งาน กระแสไหลผ่านตัวต้านทานกับ LED กลับสู่ GND ตอนรวมเครื่องให้ย้ายต้นทางของแขนงจากราง 3.3 V ไปที่ GPIO23 เพื่อให้ ESP32 สั่งติดได้' },
  { id: 'three-leds', count: 3, title: 'โจทย์เสริม · ทำให้ LED ทั้ง 3 ดวงสว่าง',
    prompt: 'ต่อ LED แดง 3 ดวงให้สว่างพร้อมกัน แต่ละดวงใช้ R 330 Ω ของตัวเอง ไฟเข้ารางบนฝั่งซ้าย ถ้าใช้รางอีกครึ่งหนึ่งให้ต่อจัมเปอร์ข้ามรอยตัด',
    parts: 'LED สีแดง × 3 · R 330Ω × 3',
    success: 'สำเร็จ! LED ทั้ง 3 ดวงอยู่คนละแขนง มีตัวต้านทานของตัวเอง และใช้แหล่งจ่าย 3.3V / GND ร่วมกัน' },
];
export function createLayout(count, splitRails = true) {
  const points = [];
  const pairCenters = count === 1 ? [285] : [285, 590, 895];
  for (let i = 0; i < count; i++) {
    const ledX = pairCenters[i] - 75, rX = pairCenters[i] + 70;
    points.push(
      { id: `L${i+1}.A`, x: ledX-15, y: 221, label: `LED ${i+1} ขา A แอโนด (+)`, type: 'leg' },
      { id: `L${i+1}.K`, x: ledX+15, y: 209, label: `LED ${i+1} ขา K แคโทด (−)`, type: 'leg' },
      { id: `R${i+1}.1`, x: rX-42, y: 221, label: `R ${i+1} ขา 1`, type: 'leg' },
      { id: `R${i+1}.2`, x: rX+42, y: 221, label: `R ${i+1} ขา 2`, type: 'leg' },
    );
  }
  const rows = [['P',326,'rail.P','รางบน +'],['N',360,'rail.N','รางบน −'],
    ...'ABCDE'.split('').map((r,i)=>[r,423+i*24,'upper',r]),
    ...'FGHIJ'.split('').map((r,i)=>[r,583+i*24,'lower',r]),
    ['BP',734,'rail.BP','รางล่าง +'],['BN',768,'rail.BN','รางล่าง −']];
  for (const [row,y,group,label] of rows) for(let col=1; col<=18; col++) {
    const isRail = group.startsWith('rail.');
    const rightHalf = col > railSplitAfter;
    points.push({
      id: `${row}${col}`, x: 180 + (col - 1) * 44, y,
      net: isRail ? (splitRails && rightHalf ? `${group}.right` : group) : `${group}.${col}`,
      label: isRail ? [label, splitRails ? `ฝั่ง${rightHalf ? 'ขวา' : 'ซ้าย'}` : '', `ช่อง ${col}`].filter(Boolean).join(' ') : `${label}${col}`,
      type: 'hole', locked: col === 1 && (row === 'P' || row === 'N'),
    });
  }
  return { points, pairs: pairCenters.map((center,i)=>({ledX:center-75,rX:center+70,index:i+1})) };
}
export function connectionError(wires, from, to, count, ignoreId=null) {
  const points = new Map(createLayout(count).points.map(p=>[p.id,p]));
  const a=points.get(from),b=points.get(to);
  if(!a||!b||from===to||a.locked||b.locked)return 'เลือกจุดต่อที่ยังว่างสองจุด';
  if(a.type==='leg'&&b.type==='leg')return 'เสียบขาอุปกรณ์ลงรู breadboard โดยเลือกขาหนึ่งขาและรูหนึ่งรู';
  const others=wires.filter(w=>w.id!==ignoreId);
  if(others.some(w=>[w.from,w.to].includes(from)||[w.from,w.to].includes(to)))return 'รูหรือขานี้มีสายอยู่แล้ว เลือกสายเดิมเพื่อลบ หรือย้ายปลายสายก่อน';
  return null;
}
export function validateCircuit(wires,count,splitRails=true) {
  if(!Array.isArray(wires)||wires.length>80||![1,3].includes(count))return false;
  const layout=createLayout(count,splitRails);
  const parent=new Map();
  function root(x){if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,root(parent.get(x)));return parent.get(x);}
  function join(a,b){parent.set(root(a),root(b));}
  for(const p of layout.points){root(p.id);if(p.net)join(p.id,p.net);}
  const occupied=new Set(),ids=new Set();
  for(const w of wires){
    if(!w||typeof w.id!=='string'||ids.has(w.id)||connectionError([],w.from,w.to,count))return false;
    if(occupied.has(w.from)||occupied.has(w.to))return false;
    ids.add(w.id);occupied.add(w.from);occupied.add(w.to);join(w.from,w.to);
  }
  // All component legs must actually be inserted. Rail feed holes are fixed.
  if(layout.points.some(p=>p.type==='leg'&&!occupied.has(p.id)))return false;
  const positive=root('rail.P'),negative=root('rail.N');
  if(positive===negative)return false;
  const resistors=[];
  for(let i=1;i<=count;i++){
    const a=root(`R${i}.1`),b=root(`R${i}.2`);
    if(a===b)return false; // resistor bypassed by a shared breadboard strip
    resistors.push({id:`R${i}`,a,b});
  }
  // Paths here traverse resistors only; LEDs are forward-directed boundaries.
  function paths(start,end){
    if(start===end)return [[]];
    return resistors.filter(r=>(r.a===start&&r.b===end)||(r.b===start&&r.a===end)).map(r=>[r.id]);
  }
  const used=new Set();
  for(let i=1;i<=count;i++){
    const anode=root(`L${i}.A`),cathode=root(`L${i}.K`);
    if(anode===cathode)return false;
    const possible=paths(positive,anode).flatMap(before=>paths(cathode,negative).map(after=>[...before,...after])).filter(path=>path.length===1&&!used.has(path[0]));
    if(possible.length!==1)return false;
    used.add(possible[0][0]);
  }
  // Three LEDs must have three independent current-limiting resistors.
  return used.size===count;
}
