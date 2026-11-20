import { adapterLab, mountAdapterLab } from './adapter-lab.js';
import { ionCondition } from './ion-condition.js';
import { mountProtectionLab } from './protection-lab.js';

const lithium = {
  lipo: {label:'LiPo 1S', kind:'pouch', min:3.2, nominal:3.7, max:4.2, ah:1, amps:1, app:'เซนเซอร์พกพา จอเล็ก หรืออุปกรณ์ที่ต้องการแบตแบน', budget:'150–350 บาท · แพ็กขนาดเล็ก', detail:'เลือกแพ็กที่มีวงจรป้องกัน ใช้ชุดชาร์จสำหรับ LiPo 1S และแปลงแรงดันให้ตรงกับทางเข้าบอร์ด'},
  ion: {label:'Li-ion 18650 · 1S', kind:'cylinder', min:3.0, nominal:3.6, max:4.2, ah:2.8, amps:2, app:'เครื่องวัดพกพา ตัวบันทึกข้อมูล หรือหุ่นยนต์ขนาดเล็กตามพิกัด', budget:'150–350 บาท · เซลล์พร้อมป้องกัน', detail:'18650 บอกขนาดทรงกระบอก ในแล็บใช้ข้อมูลเซลล์ Molicel P28A เพื่อเทียบกับเกณฑ์วงจรชาร์จตัวอย่าง'},
  drone: {label:'LiPo 4S · โดรน', kind:'pack', min:12.8, nominal:14.8, max:16.8, ah:1.55, amps:20, app:'โดรนหรือโหลดกระแสสูงที่ ESC และมอเตอร์รองรับ 4S', budget:'800–1,600 บาท · แพ็กโดรน', detail:'4S คือ 4 เซลล์อนุกรม ใช้ที่ชาร์จแบบบาลานซ์สำหรับ 4S ส่วน ESP32 รับไฟจากวงจรลดแรงดันที่เหมาะกับบอร์ด'}
};

function batteryArt(kind, label) {
  const cylinders = (count, x, step, y, h, width) => Array.from({length:count},(_,i)=>`
    <g transform="translate(${x+i*step} ${y})">
      <rect x="${width*.28}" y="-8" width="${width*.44}" height="14" rx="3" fill="#b7c7d8"/>
      <rect width="${width}" height="${h}" rx="9" fill="url(#cell-color)" stroke="#28628c" stroke-width="2"/>
      <path d="M3 22h${width-6}" stroke="#dbeafe" stroke-width="2" opacity=".7"/>
      <text x="${width/2}" y="49" text-anchor="middle" class="art-white">+</text>
    </g>`).join('');
  const body = {
    aa: cylinders(4,66,60,53,113,41),
    aaa: cylinders(4,78,53,66,91,29),
    cylinder:cylinders(1,140,0,38,135,79),
    pouch:`<rect x="97" y="42" width="164" height="123" rx="14" fill="#c2d2e5" stroke="#617e9b" stroke-width="3"/><rect x="108" y="56" width="142" height="95" rx="7" fill="#2c6d9d"/><path d="M260 87h25v-28h24" fill="none" stroke="#dc5353" stroke-width="6"/><path d="M261 106h35V70h13" fill="none" stroke="#263c56" stroke-width="6"/><rect x="304" y="52" width="26" height="26" rx="4" fill="#dbeafe"/><text x="177" y="112" text-anchor="middle" class="art-white">1S · LiPo</text>`,
    pack:`<rect x="62" y="39" width="216" height="130" rx="17" fill="#243d58" stroke="#486887" stroke-width="3"/><path d="M75 62h190m-190 28h190m-190 28h190m-190 28h190" stroke="#3d6285" stroke-width="21" stroke-linecap="round"/><path d="M278 108h32v-33h27m-59 52h42V87h17" fill="none" stroke="#e16b58" stroke-width="6"/><rect x="326" y="64" width="25" height="34" rx="4" fill="#ffc857"/><text x="171" y="111" text-anchor="middle" class="art-white">4S · LiPo</text>`
  };
  return `<svg viewBox="0 0 360 218" aria-hidden="true"><defs><linearGradient id="cell-color"><stop stop-color="#256d9f"/><stop offset=".5" stop-color="#459dc8"/><stop offset="1" stop-color="#235c86"/></linearGradient></defs>${body[kind]}<text x="180" y="202" text-anchor="middle">${label}</text></svg>`;
}

const panels = {
  adapter: `<div class="power-card-heading"><div><h2 id="other-title">Adapter จากไฟบ้าน</h2><p>เสียบ Adapter เข้ากับไฟ AC แล้วใช้ไฟ DC ที่หัวจ่ายเลี้ยงงานได้โดยไม่ต้องเปิดคอม</p></div></div>
  ${adapterLab}
  <div class="power-quick"><p><strong>ย่านใช้งาน</strong> 5V · โหลด 0–2A · กำลังรวมสูงสุด 10W ตามป้าย</p><p><strong>เหมาะกับ</strong> จอแสดงผล เซนเซอร์ประจำที่ หรืองานที่เปิดทิ้งไว้ ข้อจำกัดคือต้องอยู่ใกล้เต้ารับ</p><p><strong>งบคร่าว ๆ</strong> 100–300 บาท สำหรับ Adapter 5V 2A</p></div>`,
  aa: `<div class="power-card-heading"><div><h2 id="other-title">ถ่านขนาด AA / AAA</h2><p>ขนาดรังถ่านเหมือนเดิมได้ แต่แรงดันต่อก้อนและความจุเปลี่ยนตามชนิด ลองเทียบ 4 ก้อนต่ออนุกรม</p></div></div>
  <div class="source-layout"><figure class="source-art" id="aa-art"></figure>
  <div class="source-activity">
    <label>ขนาดถ่าน <select id="aa-size"><option value="aa">AA</option><option value="aaa">AAA</option></select></label>
    <label>ชนิดถ่าน <select id="aa-kind"><option value="alkaline">อัลคาไลน์ · 1.5V/ก้อน</option><option value="nimh">NiMH ชาร์จได้ · 1.2V/ก้อน</option></select></label>
    <label>รูปแบบการใช้งาน <select id="aa-duty"><option value="sleep">เซนเซอร์ตื่นเป็นช่วง · 0.05W เฉลี่ย</option><option value="wifi">ESP32 เปิด Wi-Fi ต่อเนื่อง · 0.75W เฉลี่ย</option></select></label>
    <div class="source-result" id="aa-result" role="status"></div>
    <p>Wi-Fi ดึงกระแสเป็นช่วง ๆ ถ่านอัลคาไลน์อาจแรงดันตกและต้องเปลี่ยนบ่อย ถ้าต้องใช้รังถ่านบ่อย ๆ เลือก NiMH ชาร์จได้และตัวแปลงไฟที่รับช่วงแรงดันของแพ็ก</p>
  </div></div>
  <div class="power-quick"><p><strong>ย่านตัวอย่าง</strong> 4 ก้อน · อัลคาไลน์ 6.0V nominal หรือ NiMH 4.8V nominal · โหลด 0.05–0.75W ในการเทียบ</p><p><strong>เหมาะกับ</strong> รีโมต ของเล่นเล็ก และเซนเซอร์ที่หลับระหว่างงาน AAA เล็กกว่าแต่ความจุน้อยกว่า AA รุ่นใกล้กัน</p><p><strong>งบคร่าว ๆ</strong> อัลคาไลน์ 4 ก้อน 40–140 บาท · NiMH พร้อมที่ชาร์จ 350–500 บาท</p></div>`,
  lithium: `<div class="power-card-heading"><div><h2 id="other-title">แบตลิเธียม · LiPo และ Li-ion 18650</h2><p>วัดแบตเพิ่งชาร์จเต็มจะได้แรงดันสูงกว่าค่า nominal ที่พิมพ์บนแพ็ก ทั้งช่วงนี้ต้องอยู่ในพิกัดวงจรที่รับไฟ</p><a class="lp-jump-link" href="#lp-ion">ไปที่ฉากจำลอง 18650</a></div></div>
  <div class="source-layout"><figure class="source-art" id="lithium-art"></figure>
  <div class="source-activity">
    <label>รูปแบบแบตเตอรี่ <select id="lithium-kind">${Object.entries(lithium).map(([id,pack])=>`<option value="${id}">${pack.label}</option>`).join('')}</select></label>
    <div class="voltage-band" id="lithium-band"></div>
    <div class="source-result" id="lithium-result" role="status"></div>
    <p id="lithium-detail"></p>
  </div></div>
  <div class="power-quick"><p><strong>เหมาะกับ</strong> <span id="lithium-application"></span></p><p><strong>งบคร่าว ๆ</strong> <span id="lithium-budget"></span></p><p><strong>ก่อนเลือก</strong> อ่านพิกัดกระแสของแพ็กและวงจรป้องกัน ใช้ที่ชาร์จตรงจำนวนเซลล์และชนิดแบต</p></div>
  ${ionCondition}`
};

export function showSourcePanel(panel, source) {
  panel.innerHTML = panels[source];
  const field = id => panel.querySelector('#' + id);
  if (source === 'adapter') return mountAdapterLab(field('adapter-lab'));
  if (source === 'aa') {
    const update = () => {
      const size = field('aa-size').value;
      const nimh = field('aa-kind').value === 'nimh';
      const wifi = field('aa-duty').value === 'wifi';
      const voltage = nimh ? 4.8 : 6;
      const capacity = (nimh ? {aa:1.9,aaa:.75} : {aa:2,aaa:.8})[size];
      const watts = wifi ? .75 : .05;
      const hours = voltage*capacity*.8/watts;
      const label = size.toUpperCase();
      field('aa-art').innerHTML = batteryArt(size, `${label} × 4 · ${voltage.toFixed(1)}V nominal`);
      field('aa-result').textContent = `~${Math.round(hours)} ชม. จากการคำนวณ (${voltage.toFixed(1)}V × ${capacity.toFixed(2)}Ah × 80% ÷ ${watts.toFixed(2)}W) ใช้ความจุสมมติและประสิทธิภาพแปลงไฟ 80% ถ่านจริงอาจหมดเร็วกว่านี้เมื่อโหลดพุ่ง`;
    };
    for (const id of ['aa-size','aa-kind','aa-duty']) field(id).addEventListener('change', update);
    update();
  }
  if (source === 'lithium') {
    const picker = field('lithium-kind');
    const update = () => {
      const pack = lithium[picker.value];
      field('lithium-art').innerHTML = batteryArt(pack.kind, pack.label);
      field('lithium-band').innerHTML = [
        ['จุดหยุดใช้ตัวอย่าง',pack.min],['Nominal',pack.nominal],['ชาร์จเต็ม',pack.max]
      ].map(([name,v])=>`<div><span>${name}</span><strong>${v.toFixed(1)}V</strong></div>`).join('');
      field('lithium-result').textContent = `~${(pack.nominal*pack.ah).toFixed(1)}Wh สะสม · โหลดตัวอย่าง ${pack.amps}A ใช้ ~${(pack.nominal*pack.amps).toFixed(1)}W ที่แรงดัน nominal`;
      field('lithium-detail').textContent = pack.detail + ' จุดหยุดใช้จริงให้ดูคู่มือแบตและอุปกรณ์';
      field('lithium-application').textContent = pack.app;
      field('lithium-budget').textContent = pack.budget;
    };
    picker.addEventListener('change', update);
    update();
    return mountProtectionLab(field('lp-ion'));
  }
}
