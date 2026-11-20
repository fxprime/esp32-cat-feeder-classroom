# ผลตรวจเวอร์ชันที่พอร์ตจาก source

ตรวจวันที่ 18 พฤศจิกายน 2026 ผ่าน Ego browser, Node.js 22.12 และ production build ข้อมูลนี้อ้างอิงเวอร์ชันที่ใช้ React shell / HTML slides จากโฟลเดอร์ต้นฉบับที่ผู้ใช้ให้มา

## ผ่านแล้ว

| ส่วน | ผลตรวจ |
| --- | --- |
| Source provenance | เก็บ SHA-256 ของ HTML 9 ไฟล์, source React และ lockfile; ไม่แก้โฟลเดอร์ต้นฉบับใน Downloads |
| Build | สร้างข้อมูล Lab, local Tailwind CSS และ Vite production bundle สำเร็จ |
| JavaScript | compile-check inline scripts ของ HTML ครบ 9 บทผ่าน ไม่พบ placeholder ข้อมูล Lab ค้าง |
| Slides | เปิดผ่าน iframe ครบ 9 บท, title / controls / initialization ทำงาน, ใช้ CSS ภายใน host เดียวกันแทน Tailwind CDN |
| บท 1 | กดเปิด X-Ray ทั้งหมดแล้วปุ่มเปลี่ยนเป็นปิด X-Ray |
| บท 2 | เลือกแสงแล้ว LED active / Servo inactive; เลือกการขยับแล้ว Servo active; สถานะเดินผ่าน Input → Process → Output; reduced motion ยังเดินลำดับจนสำเร็จ |
| บท 3 | คลิก GPIO34 แล้วขึ้น ADC1 / input-only และคำเตือนไม่มี pull-up/down ภายใน |
| บท 4 | เลือกโหมดลัดวงจร 3.3V–GND ได้ |
| บท 5 | เปิดโลหะแล้วปุ่มเปลี่ยนเป็นซ่อนโลหะทั้งหมด |
| บท 6 | Digital ON, ADC สูงสุด 4095, PWM สูงสุด ledcWrite(23, 255), ปุ่มหยุดกราฟเปลี่ยนเป็นเล่นกราฟต่อ |
| บท 7 | ลบ semicolon แล้ว Run แสดงรันไม่ได้; ใส่กลับแล้วเล่น setup และเข้าสู่ loop รอบที่ 1; หยุดได้ |
| Playground | preset Gate มี 7 บล็อก; Servo แสดง 90° ขณะรัน; บล็อกเสียงสร้าง tone(25,...); LED ใช้ GPIO23; หยุด / ล้างได้; วงว่างมีข้อความให้เพิ่มบล็อก |
| Playground export | ดาวน์โหลด sketch.ino ผ่าน browser ได้ มี ESP32Servo, setup, GPIO23 และ Servo GPIO18 ครบ |
| Labs | เลือก Lab 3 แล้วตาราง / โค้ด / diagram เปลี่ยนตรงกัน มี Echo divider 1800Ω และ pulseIn timeout 30000 µs |
| Lab consistency | ไฟล์ sketch/diagram ดาวน์โหลดตรงกับข้อมูลใน labs.mjs; ทุก connection อ้างอิง part ที่มีอยู่; ไม่ต่อ Echo ไป ESP32 ตรง; ทุก mode ไม่มี syntax placeholder *** |
| Missions | ติ๊กมิชชันแล้วเก็บ localStorage แยก lab1 / lab2 / lab3 |
| Progress / reset | ทำเครื่องหมายบท 9 แล้ว reload ยังอยู่; native dialog เปิดได้; Escape คงค่า; ยืนยันล้างทั้ง progress และ missions |
| Navigation | ส่ง ArrowRight จาก iframe บท 2 ไปบท 3 ผ่าน message ที่ตรวจ origin/source; กลับ dashboard และซ่อน / แสดง toolbar ได้ |
| Mobile | ตรวจบท 1, 2, 3, 6, 8, 9 ที่ 390×844: outer width 390 และ iframe scrollWidth ไม่เกิน clientWidth |
| Desktop | ตรวจภาพบท 2 และ Lab ที่ desktop; สไลด์ครอบคลุมพื้นที่เหมือนต้นฉบับ |
| Accessibility | axe-core 4.10.3 ชุด wcag2a/wcag2aa/wcag21aa: dashboard และ iframe บท 2, 8, 9 ไม่พบ violations หลังแก้ contrast, select labels และ focus ของ code scroll regions |
| Production dependencies | npm audit --omit=dev รายงาน 0 vulnerabilities ณ เวลาที่ตรวจ |
| Wokwi Lab 3 | คอมไพล์และเริ่ม simulation สำเร็จด้วย ESP32Servo รุ่นที่รองรับ core 3.x; Serial อ่านระยะประมาณ 35.3 ซม. ผ่านวงจร Echo divider; ใช้คีย์ Home เลื่อนวัตถุเป็น 2.0 ซม. แล้วตรวจพบ Servo เปิดถึง 87° ระหว่างกำลังหมุนไป 90° |

## ข้อจำกัด

- ยังไม่ได้ทดสอบบอร์ด ESP32 และวงจรจริง Wokwi เป็นการจำลองและไม่ได้รับรอง electrical behavior ทั้งหมด
- ยืนยัน compile/runtime ของใบงานหลัก Lab 3 โดยตรง Lab 1 / 2 ตรวจ source, wiring และ export แล้ว แต่ไม่ได้แยกรันทุก mode บน simulator
- Wokwi build อาจรอคิว และ version ของ core/library ต้องเข้ากัน การทดสอบพบว่า environment นี้ใช้ core 3.x จึงใช้ ESP32Servo ปัจจุบัน ไม่ใช้รุ่น 1.1.2 ที่ต้องพึ่ง LEDC API เก่า
- ภาพบางบทเป็นแผนภาพอธิบายแนวคิด ไม่ใช่ pinout หรือ schematic สำหรับต่อวงจรจริง ให้ใช้ตารางและ diagram ของ Lab พร้อมตรวจบอร์ดจริง
- Playground / syntax walkthrough เล่นโมเดล JavaScript ไม่ใช่ C++ compiler
- Auto-record progress เมื่อเปิดจากเมนูเหมือนต้นฉบับ เป็น self-report สำหรับทบทวน ไม่ใช่ผลสอบหรือ cloud sync
- axe ไม่แทนการทดสอบ screen reader, projector หรือ browser ทุกยี่ห้อ และไม่ได้รับรอง WCAG ทั้งเว็บไซต์
- Build tooling ที่รักษาความเข้ากันกับ Tailwind 3 ยังมี npm audit findings ใน devDependencies งานนี้ไม่ได้ย้ายเครื่องมือทั้งหมดข้าม major version; deployment เป็น static assets

## Wiring Bench / Pinout expansion — 18 พ.ย. 2026

- `npm run build` ผ่าน (Vite production) และ `npm run check:pinout` ตรวจหัวแถว 30 ตำแหน่ง + renderer resolve ขั้วสายทุกวงจรได้ครบ 16 แบบ
- ตรวจ net ของสายไม่ short rail ไป GND / ไม่ผูกไฟภายนอกกับ 3V3 หรือ VIN, ไม่มี input-only GPIO ส่งออก, ไม่มี LEDC core 2 API, Echo ผ่าน 1kΩ/1.8kΩ, BTL speaker คร่อมสอง output และ UART ไขว้ TX/RX
- Browser จริงเปิดทั้ง 16 วงจรผ่านการ์ด เปิดไฟ ปรับ slider ถึงปลายช่วง แสดงผลจำลองและจำนวนสายตรงกับข้อมูลทุกวงจร
- ADC1 filter เหลือ 6 ตำแหน่งและเลือก GPIO34 เริ่มต้น; เลือก GPIO12 แล้วแสดง strapping warning
- Servo สไลเดอร์ 180° ทำให้แขนมี transform 90°; เริ่มเดินสายใหม่ทำให้ไฟดับและปิดการเปิดไฟจนต่อครบ
- DC duty 100% ปิดปุ่มกลับทิศ; เปิด motion แล้ว emulated reduced motion ทำให้ CSS animations เป็น 0 และหยุดสถานะ running
- UART slider ส่งเลขตัวอย่างผ่าน TX17 → RX16 ตามข้อความ; ค้นหา UART เหลือการ์ดเดียว
- Thumbnail ทั้ง 16 โหลดเป็น WebP 600px; รวมประมาณ 266KiB (ขนาดล่าสุดใน `public/assets/wiring/manifest.json`) พร้อม dimensions, lazy-loading และ async decode มี SVG/1200px WebP สำหรับ export
- ตรวจ layout desktop และมือถือ 390×844 ไม่มี page horizontal overflow ภาพย่อเลือกขยายและเลื่อนภายใน panel ได้

ข้อจำกัด: Wiring Bench เป็นแบบจำลองความสัมพันธ์ ไม่คำนวณแรงดัน/กระแสจริง ไม่ใช่ ESP32 emulator โค้ดใหม่ 16 วงจรยังไม่ได้ compile ใน Arduino toolchain และยังไม่ได้ทดสอบฮาร์ดแวร์จริง (เครื่องนี้ไม่มี arduino-cli) ผล Wokwi 3 Lab เดิมข้างบนเป็นคนละชุดกับตัวอย่างใหม่นี้

- ตรวจรอบสุดท้าย: ESC ห้าม arm ที่ throttle 100%; กลับ 0 แล้ว arm/เร่งจำลองได้; disarm กลับ 0 อัตโนมัติ · ปุ่มเสียง I²S เปิด Web Audio โดยไม่มี error · เปิด code panel แล้วดาวน์โหลด `esp32-i2s.ino` ได้จริง เนื้อหามี `ESP_I2S.h`, `setPins(26,25,22)` และ core 3 API · SVG/WebP export ตอบ HTTP 200
- ตรวจใน React shell ที่ `#slide-3`: iframe โหลดสำเร็จและมีตัวเลือก 30 พิน; ทั้ง root และ iframe กว้าง 390px บนมือถือ ไม่มี page overflow

## แก้ภาพตกหล่นในสไลด์ 4 — 18 พ.ย. 2026

เปลี่ยนภาพบอร์ดเดิมที่ยังมี ATmega328P เป็น SVG ESP32 DevKit V1 / WROOM-32 30 พินจาก renderer เดียวกับบท pinout ต่อสายจาก 3V3 และ GND บนผังจริงให้ถึงวงจร LED เดิม แก้สีแถบ resistor ให้ตรง 330Ω เพิ่มคำอธิบาย SVG และ aria-pressed ของปุ่มเลือกโหมด ตรวจใน React iframe แล้วสลับ normal → short → normal ได้: โหมด short ซ่อนเม็ดสัญญาณและแสดง warning; โหมด normal คืนเม็ดสัญญาณครบ 6 จุด ตรวจภาพ screenshot และ production build ผ่าน ค้น `ATmega`, `328P`, `unoChip`, `unoBoard` ใน public/src/scripts และ dist/slides ไม่พบตกค้าง (ข้อความเปรียบเทียบ Arduino Uno ในบท 3 ตั้งใจคงไว้)

## Breadboard Quiz — 18 พ.ย. 2026

- `npm run check:quiz` ผ่าน: รับตำแหน่งรูหลายแบบ, R อยู่ก่อนหรือหลัง LED, 3 แขนงอิสระ และรางล่างที่มี jumper ถูกต้อง; ปฏิเสธขาลอย, LED กลับขั้ว, ข้ามร่องโดยไม่ต่อสาย, ไฟลัดวงจร, R ถูก bypass, LED หลายดวงแชร์ resistor bank และรู/ขาที่เสียบซ้ำ
- Browser จริง: ตรวจวงจรว่างแล้วคงอยู่การ์ดแรก ไม่มีไฟ LED/ไม่มีคำตอบแสดง; ลากเมาส์ค้างเห็น ghost wire ก่อนปล่อย (จำนวนสายยัง 0) ปล่อยที่รูแล้วมีสายถาวร; ย้าย R ขาเดิมจาก A3 → A4 แล้ว undo กลับได้
- ต่อการ์ดแรกด้วยการลาก/คลิกและ native selects แล้วตรวจผ่าน หลัง 2 วินาทีแสดงการ์ด LED 3 ดวงซึ่งเริ่มไม่มีสายคำตอบ ความคืบหน้าการ์ดแรกถูกบันทึกและ reload กลับมาเริ่มการ์ดสองได้
- แก้ touch drag ให้ใช้ native HTML button handles ซ้อนตรงจุดต่อบนภาพ SVG (สเกลตำแหน่งตาม viewBox) เพราะ touch-action บน SVG graphics ไม่ป้องกันการ pan ได้แน่นอนใน browser ที่ทดสอบ Capture pointer บน handle และใช้ SVG matrix หา endpoint ทดสอบ CDP touchStart → touchMove → touchEnd ได้ ghost wire และสายถาวรจริง โดยยังเลื่อนแผงจากพื้นที่ว่างได้
- ป้องกัน CSS embed เดิมซ่อนหัวการ์ด: ใช้ส่วนหัวการ์ดแบบ div ภายใน article แทน header ที่ถูก selector เดิมซ่อน; ปุ่ม/ชื่อรูเป็น HTML controls ที่มี accessible name และทางเลือก native selects ไม่ต้องลากอย่างเดียว
- ทดสอบผ่านครบสองการ์ดจริง: การ์ด 2 มีสาย 12 เส้นและ LED ติดครบ 3 ดวง แล้วเปลี่ยนเป็นสรุปผลอัตโนมัติ ดูวงจรที่ทำผ่านแล้วมี 12 เส้นและปิดตัวแก้ไข Reload ยังคงผลครบ 2 ข้อ
- ทดสอบสลับเรียนรู้ → Quiz ระหว่างทำแล้วสายที่ยังไม่ส่งยังอยู่ ทดสอบเพิ่มสายด้วย Enter บนจุดต่อและ native selects ผ่าน Native handles ป้องกัน touch pan เฉพาะจุดจับ ไม่ปิดการเลื่อนทั้งหน้า เพิ่ม overflow-x:clip ที่กรอบ Quiz เพื่อไม่ให้ entrance transform ขยาย layout viewport บนมือถือ
- ทดสอบใน React iframe `?quiz=1#slide-5` บนมือถือ 390px: หัวคำถามมองเห็น, native point controls ครบ, ต่อสายจริงได้ 1 เส้น, reduced motion มี animation 0, root กว้าง 390px และ frame ไม่มี horizontal page overflow; สลับกลับ X-Ray เปิดแถบโลหะครบ 54 กลุ่มและกลับ Quiz ยังคงสายเดิม

## กระแส DC และ short feedback ใน Quiz — 18 พ.ย. 2026

- เปลี่ยนทางเข้า: แม้ URL มี `quiz=1` ก็เปิดหน้าเรียนรู้ Breadboard ก่อน ผู้เรียนต้องกดปุ่มเข้า Quiz ใต้แผงหรือแท็บด้านบน มีปุ่มกลับสำรวจในทุกการ์ด/สรุปผล
- เพิ่ม solver DC แบบ nodal/KCL และ piecewise-linear LED แสดง I/V/กำลังตามสายที่ต่อเอง ไม่ใช่ตัวเลขจากเฉลย สมมติฐานแสดงใน UI: Vs3.3V, Rs0.5Ω, limit100mA, wire0.1Ω, R330Ω, LED Vf2V+Rd10Ω และ ideal copper rails ค่ากระแสนี้ไม่ใช่ผลวัดหรือพิกัดป้องกัน ESP32 จริง
- `npm run check:current` ผ่านสูตรและสถานะ open/reversed/1–3 LED branches, R ด้านใดก็ได้, source short โดยยังต่ออุปกรณ์ไม่ครบ, shortหลายสาย/หลายแขนง, CC voltage collapse, overcurrentLED, resistor-only load, rail bridges, ทิศกระแสในแถบโลหะ และ flow renderer; สุ่ม passive circuits ด้วย seed คงที่ 150 แบบได้ค่าจำกัดและไม่มี NaN
- Browser: เริ่มจากหน้าเรียนรู้แม้ลิงก์เก่ามี quiz=1; P2→N2 ทำให้กรอบ/สายแดงและมี shake 420ms × 2 ครั้ง, I100.00mA และแรงดันราง0.01V (CC model) พร้อม 5 เส้นทางกระแส ลบสายแล้ว I0 และเส้นกระแสหาย วงจร LED+R สาย4เส้นได้3.81mA, LEDΔV2.04V, RΔV1.26V / 4.80mW
- Mobile touch ย้ายปลาย R ไป D3 ได้และยังมีกระแส3.81mA ต่อถูกทั้งสองการ์ดเลื่อนไปข้อถัดไป/สรุปได้ ค่ารวม3LED11.41mA และมี36ช่วงกระแส Review ยังคงค่าตามวงจรของผู้เรียนและห้ามแก้ไข Reduced motion หยุด animationเป็น0 แต่เส้น/ลูกศร36ช่วงและตัวเลขยังอยู่
- แก้ teardown ตอนเปลี่ยนจำนวนอุปกรณ์ให้หยุด pointer โดยไม่ repaint รูปเก่าด้วยข้อมูลการ์ดใหม่ ป้องกันการเปลี่ยนการ์ดค้างหลังเพิ่ม current renderer
- การแสดง LED/เส้นกระแสระหว่างทำเป็นพฤติกรรมของวงจรที่ผู้เรียนต่อเองตามคำขอใหม่ แทนพฤติกรรมรุ่นก่อนที่เปิด LED เฉพาะหลังตรวจผ่าน ไม่สร้างการต่อเฉลยหรือย้ายสายอัตโนมัติ
- ยืนยันใน React iframe บนมือถือ390px: แม้ URLเก่ามีquiz=1 หน้าแรกยังเป็นบท Breadboard พร้อมCTA; กดQuizแล้วเห็นหัวการ์ดและค่ากระแส ต่อP2→N2ได้100.00mA พร้อมค่าเดียวกันบนsourcebadge, reduced motion มีanimation0, rootWidth390 / frameWidth382 ไม่มีpage overflow ปุ่มกลับสำรวจคืนหน้าเรียนและซ่อนQuizได้

## Physical placement + PWM/ADC — 18 พ.ย. 2026

- Production build ผ่านพร้อม regression checks เดิม และ `check:placement` / `check:signals` ใหม่ (4096 ADC bins, binary, boundaries, sample hold; rotation/occupancy/bounds/real electrical state)
- Chrome/Ego desktop: ลากตัว R1 แล้วมี 2 snap targets ปัก A3/A6; หมุน LED ด้วย R; ปัก LED D7/D8 และต่อ 3 jumpers ได้ 3.81mA ตรวจผ่านแล้วเลื่อนไปการ์ด 2 อัตโนมัติ
- การ์ด 2 ปัก 6 อุปกรณ์ + 9 jumpers ได้ LED ทั้งสามประมาณ3.80mA/ดวง รวม11.40mA ตรวจผ่าน/สรุป/บันทึก poses ครบ2และ6ชิ้นใน storage v2; หมุน R ที่ปักแล้ว ย้อนกลับ ถอนและคืนอุปกรณ์ได้; รูที่มีขาอุปกรณ์อื่นแล้วถูกปฏิเสธ
- P2→N2 ยังขึ้น short 100.00mA และ red wire โดยไม่ต้องปักอุปกรณ์ครบ; ค่าจำลองจำกัดกระแสตามสมมติฐานเดิม ไม่ใช่ผลวัดจริง
- ใน React iframe มือถือ390×844: เริ่มบท5ที่เรียนรู้ก่อน Quiz; ส่ง touchStart/move/end ลาก LED จากถาดไปปัก D8/D9 ได้ มี2snap targets/ไม่มี pointercancel กลางทาง; root width390/frame width382 ไม่มี page overflow; fit board เป็นทางเลือก ส่วนค่าปกติเลื่อนดูแผงภายในได้
- PWM UI: duty10→90 เวลาHIGH20→180µs แต่5kHz/200µs/0–3.3Vคงเดิม; Servo1000→2000µs มุม0→180°/duty5→10% และ50Hz/20msคงเดิม; ฐานเวลาเดียวกัน20msแสดง100รอบ LED/1รอบServo; Quizผิดไม่ผ่านและเลือกสองข้อที่ถูกจึงอธิบายผล
- ADC UI: เก็บ1.650Vแล้วเลื่อนสดเป็น2.800V ตัวอย่างยัง1.650V และผล2048/1000 0000 0000; ใช้ค่ากลับหน้าหลักได้; 0V→0/0000 0000 0000; 3.3V→4095/1111 1111 1111; ขั้นบันไดแสดง8ช่วง12บิตและ bin interval จริงตามแบบจำลอง
- Native dialog ใน iframe: autofocusปุ่มปิด, Escapeปิด, focusกลับ opener, คืนสถานะ pause graph; ArrowRight ใน dialog ไม่เลื่อนไปบทถัดไป; มือถือdialog clientWidth348/scrollWidth348 ไม่มีแนวนอนล้น และอ่านส่วนล่างได้ด้วยscroll
- จำลองไม่มี `HTMLButtonElement.prototype.commandForElement` ก่อนเริ่มหน้า: โหลด local invoker polyfill แบบ conditional, เปิด/ปิด dialog ได้และคืน focus/graph pause; เบราว์เซอร์ native ไม่ต้องโหลด bundleนี้
- Keyboard Enterเลือก/Rหมุนอุปกรณ์ได้; reduced-motionมี running animations0 และไม่เปลี่ยนเป็นภาพวนใหม่ในบท6; Servo transitionปิดตามprefers-reduced-motion

## ADC แบบไม้บรรทัด 8 → 4096 ช่อง — 18 พ.ย. 2026

- แทนกราฟซูม8ขั้นจาก4096ด้วยภาพเต็มช่วงที่อยู่นิ่ง เริ่มADC3บิต8ช่อง0–7 และเปลี่ยนเป็น12บิต4096ช่องโดยคงแรงดันเดิมไว้ ให้ลองได้ทันทีโดยไม่ต้องผ่าน4หน้าก่อน
- ศึกษาและลิงก์แหล่งสอนต้นทาง Adafruit MakeCode (เริ่ม3บิต) และ Microchip Quantization (แบ่งแรงดันเป็นช่วง) เขียนภาพ/คำไทยเอง ไม่คัดลอกภาพหรือบทความ
- Unit checks: 1.00/1.20/1.30V → 2/2/3 ที่3บิต; 1.0000/1.0004/1.0010V → 1241/1241/1242 ที่12บิต; ช่อง3บิตครบ8ช่อง, endpoints0/7, ความกว้างช่องต่างกัน512เท่า, regression4096bins/binary/PWM/Servoเดิมผ่าน
- Browser UI: presetทั้งสองโหมดให้เลขตามข้างต้น ไฮไลต์ช่องตรงcode, เปลี่ยน8→4096ที่1.30Vยังคง1.30Vและได้1613; snapshot1242ยังคง1242เมื่อเลื่อนสด2.8Vเป็น3475, นำ1242กลับsliderหลักและคืนfocus/สถานะpauseได้
- React iframe390×844: root390/frame382/dialog348ไม่มีhorizontal overflow; แยกsliderให้คงมองเห็นขณะดูภาพและเลข มีcontainer queriesและขนาดสัมผัส44px; ใช้CDPtouchแตะแถบได้แรงดัน1.825V/code4พร้อมaria-valuetext, preset1.20V/code2, mode12ที่3.3V/code4095และเก็บ/นำค่าไปใช้ได้; Escapeปิด/คืนfocus/คืนpausefalse
- ภาพ4096ช่องไม่ได้แทนด้วย8หรือจำนวนเส้นหยาบสมมติ มีคำบอกว่าเส้นแบ่งถี่เกินจะเห็นแยกที่ขนาดนี้ และแสดงเลข/ขอบของช่องจากmodelจริง สูตรและbinaryเป็นdetailsเสริม
- ตรวจเพิ่มที่320px: root320/frame312/dialog278และscrollWidth278, ปุ่มpresetสูง56.94px; 1.2374V/code2 กดArrowRightหนึ่งครั้งเป็น1.2375V/code3โดยไม่เปลี่ยนบท; โหมด12บิตที่0Vได้0; sticky controlsวัดinsetจริงตามขนาดหัวและแถบปรับ พร้อมscroll-padding226.98pxเพื่อไม่บังfocus

## ADC source → pin → physical converter — 18 พ.ย. 2026

- เพิ่มSVGpot10kΩ3ขาพร้อมสาย3V3/GPIO34/GND และแถบความต้านทาน/จุดแตะของwiper หมุน50%แล้วได้1.6500Vและcode4ในdemo3บิต;75%ได้2.4750V/code6 แรงดันสื่อถึงขากลางเทียบGND ไม่ใช่จำนวนข้อมูลจากเซนเซอร์
- อธิบายอุปกรณ์ภายในSAR ADCและที่มาของระดับจากจำนวนรหัส จำกัดด้วยbits; แยกADC1_CH6(inputchannel)จาก4096ระดับ; แยกVrefภายใน≈1.1Vจากไฟ3.3Vที่เลี้ยงpotและระบุattenuation/แบบจำลองสอน
- Model SARตรวจเทียบกับquantizeที่3/12บิตและ0V/ขอบช่วง/3.3V; browserกดที่1Vได้DAC1.65→.825→1.2375V, bits0__→01_→010, รหัส2และช่วง.825ถึงก่อน1.2375V; เปลี่ยน1.3Vresettrace/ผลเทียบเก่าหาย
- Desktop snapshotเดิมยังทำงาน:1.3Vเก็บ1613 เลื่อน2.8Vสดได้3475 snapshotยัง1613และนำ1613กลับหน้าหลักได้; ปิดคืนfocus/pause
- React iframeมือถือ390px: root390/frame382/dialog348/scroll348 ไม่มีpage overflow, source75%/2.475VและSAR110=6ถูกต้อง; Escapeปิด เปิดใหม่scrollTop0/SARdetailsปิด/แรงดันกลับ1V; ใช้native details+summaryและปุ่มกดทีละรอบ ไม่มีauto animationเพิ่ม
- ภาพขยายpotแสดงแถบR10kและตำแหน่งwiperสอดคล้องแรงดัน;320px: page320/dialog286/scroll286 ไม่มีแนวนอนล้น, CDPtouchที่กลางsliderได้1.6500Vและdemo code4; codeตัวอย่างanalogRead(34)และภาพGPIO34/ADC1_CH6ถูกต้อง

## Code structure lesson (บท 7) — 18 พ.ย. 2026

- สร้าง6ตัวอย่าง setup/loop, INPUT_PULLUP+if/else, ADCvariables+return+PWM, for/arrayLED3, functioncall+parameter, delay/millis2boards แสดงC++/SVG/ตัวแปร/stack/counters/virtualtime/Serial มีstep/play/pause/resetและดาวน์โหลดตามค่าที่เลือก
- `check:code` ผ่าน:setupครั้งเดียวถึงloop3, delayคงLEDก่อนคำสั่งLOW, snapshotปุ่มและADC, return127จากraw2048แม้อินพุตเปลี่ยน4095, forเลือก23/22/21ตามarray, blink(2)กลับcallerและscopeถูกต้อง, pulse250–350msเห็น0vs1, syntaxgatesและSSR6panels/ซ่อน5panels
- Desktop browserเดินผ่านทั้ง6:HIGHแสดงGPIO23ON/setup1/loop1; ลบ;แล้วเริ่มไม่ได้/setup0; อ่านปุ่มHIGHแล้วกดLOWก่อนifยังใช้HIGHและLEDoff; raw2048คงเดิมและduty127แม้slider4095; forรอบi1เปิด22; stack loop→blink(2)→loop; timingdelay0/millis1
- Rootiframe keyboardArrowRightย้ายfocusจากblinkไปconditionโดยยังเลือกblinkและhashยังslide7; Enterจึงเลือกcondition; beforematchเลือกfunctionและเปิดpanelถูกต้อง; inactiveuntil-foundpanelsไม่บังpointerบนpanelที่เลือก
- ดาวน์โหลดinoหลังปรับ1000msได้ไฟล์ตรงค่า waitMs=1000; กดplayแล้วสลับตัวอย่างปุ่มกลับเป็นเล่นและยกเลิกtimer
- Mobile390×844: root390/frame390 ไม่มีhorizontal overflow, controlsstickyพร้อมLEDdockON/line7/loop1แม้เลื่อนอ่านโค้ด; timingpulseยังได้0vs1; nativecontrols44px; ไม่มีautoanimationตอนเปิด
- Turnitout:ใช้หน้าเว็บจริง https://turnitout.streamlit.app กับintro6บท+คำถาม6ข้อ มีprotectedAPIterms ผล1320อักขระเหมือนต้นฉบับ ดูinput/outputhashใน docs/humanizer-check.json ไม่อ้างว่าเครื่องมือแก้ข้อความที่ไม่เปลี่ยน
- ขอบเขต:เล่นตามโมเดลตัวอย่างและvirtualtime ไม่ได้คอมไพล์C++/จำลองชิปจริง; codeนำไปลองWokwiหรือบอร์ดต่อได้ แต่ไม่ได้ตรวจคอมไพล์ด้วยArduino toolchain ในรอบนี้ อ้างอิงAPIจากArduino/Espressif และdelayจากofficialsource(vTaskDelay)
- Compatibility:ลบnativefocusGroupก่อนโหลดหน้าแล้วโหลดfocusgroup-polyfillแบบconditionalจริง ArrowRightยังย้ายfocusไปcondition;320pxroot/frame320ไม่มีoverflow, touchsliderADCได้3374แต่memoryยังว่างและLEDoffเพราะโค้ดยังไม่อ่าน เป็นพฤติกรรมที่ต้องการ
