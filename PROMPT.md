# Prompt พอร์ต Arduino M.2 เป็น ESP32

นี่คือ brief ที่เขียนจาก source และพฤติกรรมที่ตรวจได้ ไม่ใช่ prompt ต้นฉบับของผู้สร้าง

---

พอร์ตเว็บ Interactive Classroom ภาษาไทยจาก source Arduino M.2 ที่แนบให้ เป็น **ESP32 DevKit V1 / ESP32-WROOM-32 รุ่นดั้งเดิม** รักษากิจกรรม ภาพ SVG การเคลื่อนไหว และโครงสร้างสไลด์ต้นฉบับ ไม่ลดกิจกรรมเหลือการ์ดข้อความหรือภาพนิ่ง

ใช้ React + Vite + Tailwind + Lucide, ฟอนต์ Prompt / JetBrains Mono, dashboard 9 การ์ด 3 ช่วง และ toolbar ฉายเต็มพื้นที่ สไลด์เป็น HTML แยก iframe เพื่อให้ CSS / JavaScript ของแต่ละบททำงานเหมือนต้นฉบับ Build Tailwind เป็น CSS ในโปรเจกต์ ไม่โหลด runtime CDN

## 9 บทที่ต้องรักษา

1. **ESP32 คืออะไร** — คลิก / ชี้ X-Ray ของถังขยะ ไฟถนน และต้นไม้ เห็นวงจรและ flowchart ที่เคลื่อนไหว เปิด X-Ray ทั้งหมดได้
2. **Input → Process → Output** — เทียบมนุษย์กับ ESP32 สองแถว ตา / เซนเซอร์ → สมอง / ESP32 → มือ–Servo, ไฟฉาย–LED, ปาก–Buzzer มีการ์ดสรุป 3 ขั้นและโหมด Output 4 แบบ กด “จำลองเหตุการณ์: มีคนเดินเข้าใกล้” แล้วจุดสัญญาณวิ่ง ผ่านการคิด และอุปกรณ์ตอบสนองตามโหมด
3. **Board explorer** — เปลี่ยนรูป UNO เป็น DevKit V1 จริงตามชื่อพิน แบ่ง Power / GPIO / ADC1 คลิกพินแล้วแสดงหน้าที่ ตัวอย่าง และคำเตือน รองรับ keyboard
4. **Electrical safety** — คงการจำลองต่อวงจรถูก / ลัดวงจร และตัวต้านทาน LED เพิ่มกฎ GPIO 3.3V ไม่ทน 5V
5. **Breadboard X-Ray** — คงภาพรู แถบโลหะ ร่องกลาง การเลือกจุด และเปิด / ซ่อนโลหะทั้งหมด
6. **Digital / Analog / PWM** — คงปุ่มเปิดปิดไฟ กราฟสะสมเวลา slider ADC และ PWM presets ปรับ ADC เป็น 0–4095, logic 3.3V, PWM 8-bit 0–255 และ LEDC core 3.x มีปุ่มหยุดกราฟ
7. **setup / loop** — คงการไฮไลต์โค้ดทีละบรรทัด setup ครั้งเดียว loop ซ้ำ ทดลองลบและใส่ semicolon กลับ รันไม่ได้เมื่อ syntax error พร้อมข้อความอธิบาย
8. **Playground** — คง 5 บล็อก: เปิด LED / ปิด LED / รอ / เสียง / Servo; สี LED 4 สี; presets Blink / Alarm / Gate เพิ่มลบบล็อก ปรับค่า รันวน หยุด ล้าง และ empty state สร้าง sketch ทั้งไฟล์พร้อม setup / library และดาวน์โหลดได้ ระบุว่าเป็น visual model ไม่ใช่ compiler
9. **Wokwi Labs** — คง Servo / Ultrasonic / Automatic Gate ตามหน้า Lab จริงของต้นฉบับ UI เลือก Lab, ตารางพิน, library guide, sketch.ino / diagram.json / libraries.txt, copy / download และ 3 มิชชันต่อ Lab พร้อม persistence

## Hardware และโค้ด

- GPIO23 ใช้ LED ภายนอกผ่าน 330Ω ไม่สมมติ built-in LED GPIO2 ทุกบอร์ด
- Servo signal GPIO18 ใช้ ESP32Servo และไฟ 5V ที่เหมาะสมกับ GND ร่วม
- Buzzer GPIO25, Ultrasonic TRIG26 / ECHO27
- HC-SR04 Echo ต้องผ่านตัวแบ่ง 1kΩ / 1.8kΩ ห้ามต่อ 5V เข้า GPIO ตรง
- ADC1 เช่น GPIO34 input-only ไม่มี internal pull-up/down; ระวัง GPIO6–11, boot strapping pins และ VIN/5V
- อ่าน pulseIn ด้วย timeout และจัดการ duration == 0 ว่าไม่มี echo ไม่ใช่ระยะ 0
- Lab code ต้อง compile ได้ครบทุก switch case ไม่ใส่ placeholder ที่เป็น syntax error ใน default sketch
- แยกคำแนะนำ core 3.x กับ simulator core 2.x; pin library ให้ตรงเวอร์ชัน
- สร้างข้อมูลไฟล์ดาวน์โหลดกับโค้ดที่แสดงจากข้อมูลชุดเดียว

## พฤติกรรมและตรวจรับ

- ใช้ hash #slide-1 ถึง #slide-9 และคง bookmark #1 ถึง #9
- Progress แยก key ESP32, รองรับ storage เสีย / ถูกปิด, ไม่อ้าง cloud sync
- ใช้ native dialog ยืนยันก่อน reset ทั้ง progress และ missions
- ← → เปลี่ยนบทจาก iframe ได้ และ F fullscreen เมื่อไม่กำลังแก้ input/select ตรวจ origin และ source ของ postMessage
- รองรับจอฉายและมือถือ 390px ไม่มี horizontal overflow ของหน้า
- เคารพ prefers-reduced-motion ทั้ง CSS animation และ requestAnimationFrame; มีหยุดกราฟ / หยุด Playground
- อย่าแก้ไฟล์ source ต้นฉบับใน Downloads บันทึก provenance/hash ของไฟล์ที่ใช้
- ทดสอบครบ 9 บท, GPIO explorer, X-Ray, graph sliders, semicolon demo, Servo/Buzzer Playground, copy/download, mission persistence, reset และ production build
- รายงานสิ่งที่ทดสอบได้จริง แยก Wokwi จาก hardware จริง และไม่อ้างว่าได้ prompt ต้นฉบับหากไม่พบ

ส่งมอบ source ที่แก้, README, รายงาน stack จาก package/lockfile, prompt ฉบับนี้ และผลตรวจพร้อมข้อจำกัด

## ขยาย Pinout เป็น Wiring Bench

บท 3 ต้องมีผัง DevKit V1 30 พินสำหรับ ESP32-WROOM-32 รุ่นดั้งเดิม อธิบายทุกขาที่ออกหัวแถว รวมพินที่ห้ามใช้/ไม่ออกหัวแถวในหมายเหตุ กรองตาม peripheral โดยแยกทิศทางของ GPIO34–39 ที่รับสัญญาณ UART RX / SPI MISO / I²S DIN ได้แต่ส่งออกไม่ได้

ให้เลือกจากพินหรืองานที่จะทำ แล้วเปิด 16 วงจร ได้แก่ Servo, DAC speaker, I²S speaker, DC motor driver, Brushless ESC, Active/Passive Buzzer, Button, Pot, LDR, DHT22, HC-SR04, I²C sensor, SPI RFID, DS18B20 และ UART สองบอร์ด ทุกวงจรต้องมีภาพเวกเตอร์ที่ไฮไลต์สายได้ รายการเดินสายทีละเส้น ไฟเลี้ยง/ราง breadboard อุปกรณ์ ข้อจำกัด และโค้ด Arduino-ESP32 core 3.x จากข้อมูลชุดเดียว

วาดวงจรและข้อมูล classic ESP32 เองโดยอ้างอิงแนวทาง esp-labs-web (MIT); อย่าคัดลอก pin map ESP32-S3 หรืออ้างว่ากู้ prompt ต้นฉบับได้ ใช้ SVG สำหรับโต้ตอบ WebP ขนาดพอดีสำหรับ thumbnails และดาวน์โหลด Motion opt-in มีหยุดและ reduced motion เสียงสาธิตเป็น Web Audio ที่กดเล่นเองและจำกัดเวลา ตรวจพลังงานแยก, common GND, divider, BTL speaker และ GPIO input-only ด้วย assertions ที่มีประโยชน์

## Breadboard Quiz แบบการ์ดในบท 5

เพิ่มแท็บ Quiz พร้อมการ์ด 2 ข้อ: LED ดวงเดียว + R 330Ω และ LED สีแดง 3 ดวงกับ R 330Ω แยกแต่ละดวง ไฟ 3.3V/GND เสียบ power rail แล้ว ต้องลากแต่ละขาไปรูพร้อมเส้นสายตาม pointer จริง มี click/tap สองจุดและ native select เป็นทางเลือก ตรวจ electrical nets ของ breadboard โดยรับหลายตำแหน่งรูและตัวต้านทานก่อน/หลัง LED ได้ ไม่บังคับ exact-hole answer map ไม่แสดงเฉลยระหว่างทำหรือบอกสีถูกผิดรายสาย ตรวจผิดให้ลองใหม่ แสดงพฤติกรรม LED/กระแสจากวงจรที่ผู้เรียนต่อเองระหว่างทำ ตรวจถูกครบจึงอธิบายและเลื่อนไปการ์ดถัดไปอัตโนมัติ บันทึกข้อที่ผ่านและดูวงจรของตัวเองย้อนหลังได้ ไม่สร้างปุ่มข้ามไปโจทย์ที่ยังไม่ผ่าน รักษา X-Ray เดิมและแยกโมดูล validator / renderer / pointer UI ชัดเจน


## ผลกระแสและการลัดวงจรใน Quiz

เริ่มบท 5 ที่หน้าเรียน Breadboard เสมอ ไม่เข้า Quiz อัตโนมัติจาก query เก่า ให้มีปุ่มเข้า Quiz หลังแผงเรียนรู้และปุ่มกลับไปสำรวจในทุกการ์ด ใน Quiz ตรวจลัดวงจรจากทางเดินสายระหว่างราง + และ GND โดยไม่ต้องรอให้เสียบอุปกรณ์ครบ ถ้าลัดให้สั่นช่วงสั้นและไฮไลต์สาย/กรอบแดง พร้อมเส้นทางตามกระแสที่คำนวณจริงจากการต่อของผู้เรียน รวมแถบโลหะภายใน breadboard และทางกลับ GND

ใช้ DC nodal analysis + piecewise-linear LED ไม่แทนด้วยตัวเลขคงที่หรือค่ากระแสลัดวงจรอนันต์ กำหนดแหล่งจ่ายจำลอง 3.3V, Rs 0.5Ω, limit100mA, สาย0.1Ω, R330Ω และ LED Vf2V+Rd10Ω ให้ผู้เรียนเปิดดูสมมติฐานได้ ระบุว่าเป็นผลคำนวณ ไม่ใช่ค่าที่วัดจาก ESP32 และ limit100mA ไม่ใช่พิกัดป้องกันจริงของบอร์ด มี current/voltage ราย LED/R และรวมทั้งวงจร อธิบายโหมด CV/CC เมื่อเกิดลัดวงจร มี pause flow, reduced motion, หยุด motion เมื่อหน้าหรือภาพไม่ปรากฏ และไม่มีการเฉลยวงจรที่ไม่ได้ต่อเอง

## อุปกรณ์ปักบน Breadboard และการทดลองบท 6

Quiz บท 5 ให้ลากตัว LED / R ทั้งตัว หมุนทีละ 90° แล้วปักสองขาลงรูจริง ห้ามย้ายตำแหน่งเพื่อเฉลยให้ผู้เรียน รูหนึ่งรูรับขาหรือสายได้หนึ่งจุด ปักลงแถบเดียวกันได้ทางกายภาพแต่ต้องตรวจความถูกต้องทางไฟฟ้าแยกกัน ถอน หมุน ย้าย ย้อนกลับได้ ตำแหน่งและมุมต้องร่วมในวงจร DC/current flow และบันทึกความคืบหน้า มีทางเลือกกดเลือกชื่อรูโดยไม่ลากและรองรับ touch

บท 6 เพิ่มเปรียบเทียบ LED PWM 5 kHz กับ Servo 50 Hz แบบ interactive แยก duty/เวลา HIGH/คาบ/ความถี่และความหมายกำลังเฉลี่ยกับมุมสั่ง มีฐานเวลา 20 ms เท่ากันและ Quiz เลือกค่าที่ไม่เปลี่ยนเมื่อตรึงความถี่ไว้ Servo ช่วง 1–2 ms/0–180° เป็นสมมติฐานการสอน

มี native dialog ADC แบบไม้บรรทัดแรงดัน ไม่ใช้กราฟซูมขั้นบันไดอัตโนมัติ เริ่มจาก ADC ตัวอย่าง3บิต8ช่องจริง0–7 ที่เห็นทุกขอบช่อง แรงดัน1.00/1.20Vอ่านได้2เหมือนกัน และ1.30Vข้ามไปได้3 จากนั้นใช้แรงดันเดิมเปลี่ยนเป็นESP32 12บิต4096ช่อง0–4095 บนสเกล0–3.3Vเดิม ไม่แอบใช้8ขั้นแทน4096ขั้นและไม่วาดเส้นจำนวนสมมติแทนช่องจริง อธิบายว่าที่ภาพขนาดนี้เส้นแบ่ง4096ช่องถี่เกินกว่าจะเห็นแยก และแสดงขอบช่วง/เลขจริงให้แทน

สื่อความหมายหลักว่าอยู่ในช่วงเดิมได้เลขเดิม ข้ามขอบช่วงเลขจึงเปลี่ยน เริ่มนับช่องที่0จึงลงท้าย4095 ให้ตัวอย่างfine mode1.0000/1.0004/1.0010V อ่าน1241/1241/1242 กดอ่านเก็บsnapshotแล้วเลื่อนแรงดันต่อได้ snapshotต้องไม่เปลี่ยนจนกดอ่านใหม่ ใช้ค่าที่เก็บกลับหน้าหลักได้ สูตรและbinaryเก็บในdetailsเสริม ขาADCรับแรงดันได้แต่CPUอ่านเลขหลังแปลง ใช้แบบfloorและระบุideal range/attenuation/calibrationของจริงตามEspressif

บนมือถือให้เห็นแถบปรับแรงดันกับผลอ่านพร้อมกันได้ ปรับlayoutตามcontainer, native slider/keyboard/touchและaria-valuetext, ปุ่มสัมผัสอย่างน้อย44px ใช้conditional Invoker Commands polyfillและคืนfocus/สถานะpausegraphเมื่อปิด อ้างอิงแนวการสอนAdafruit MakeCodeและMicrochipในdialogและREADME

## เชื่อม ADC กับอุปกรณ์จริงก่อนใช้ภาพแทนช่วง

เริ่มdialogด้วยpotentiometer10kΩ3ขา: ปลาย1→3.3V, ขากลาง2→GPIO34/ADC1_CH6, ปลาย3→GND ใช้SVGสายจริงและจุดแตะเลื่อนบนแถบความต้านทาน อธิบายว่าแรงดันที่ADCรับคือขากลางเทียบGND เซนเซอร์analogAOก็ส่งแรงดันเข้าในลักษณะนี้ `analogRead(34)` สั่งADCในชิปและคืนเลขให้CPU

แสดงADCอยู่ภายในESP32พร้อมวงจรsample/hold(capacitor+switch), DACภายในADC, comparator และSAR อย่าสอนเป็นflash ADCที่มี4096ช่องอุปกรณ์แยกกัน VrefภายในclassicESP32ออกแบบราว1.1V, attenuationปรับช่วงรับ; 3.3Vในภาพคือไฟเลี้ยงpotไม่ใช่Vrefจริง ช่วง0–3.3V/รหัสfloorเป็นแบบจำลองอธิบายหลักการเท่านั้น

คำว่า“ช่อง”ต้องแทนด้วย“ช่วงแรงดันที่อ่านได้เลขเดียวกัน” มีที่มาจากfinitebinarycodes เช่น3บิต8ค่าและ12บิต4096ค่า แยกจากชื่อinputchannel ADC1_CH6 ให้native detailsกดทดลองSAR3รอบที่1V: เทียบ1.65/.825/1.2375V ได้010→2 และชี้ช่วง.825ถึงก่อน1.2375V เปลี่ยนแรงดันต้องresettrace เปิดdialogใหม่ต้องเริ่มเรื่องอุปกรณ์จริงที่บนสุด

## บท7: โครงสร้างโค้ดที่เห็นผลกับอุปกรณ์

ทำ6ตัวอย่างnative tabs: setup/loop, if/elseปุ่มGPIO18INPUT_PULLUP, variablesADC GPIO34และtoDuty return→LEDC GPIO23 core3.x, for/array GPIO23/22/21LEDแยกR330Ω, blink(times)ฟังก์ชันมีcallstack, และdelay1000เทียบmillisโดยปุ่มสั้น100ms ทุกตัวอย่างผูกC++ที่แสดงกับtraceของโมเดล มีstep/play/pause/reset, เลือกบรรทัดอ่านคำอธิบาย, counterssetup/loop, เวลาเสมือน, LED/wiringSVG, memoryscopeและSerial ปรับตัวเลขแล้วโค้ดและโมเดลต้องตรงกัน ดาวน์โหลดinoได้

ห้ามปรับผลLEDตามinputทันทีถ้าโค้ดยังไม่อ่าน/สั่งoutput ต้องมีsnapshot raw/state, returnvalueและfunctionstackถูกต้อง setupเรียกครั้งเดียวต่อreset, loopซ้ำ, forเลือกpins[i]ตามค่าarrayไม่ใช้iเป็นGPIO ไวยากรณ์อธิบาย;จบstatementและ{}ขอบเขต ไม่อ้างว่าทุกบรรทัดต้องมี;หรือcompilererrorเกิดระหว่างรันที่บรรทัดนั้น

เล่าdelayว่าเป็นการรอในloop task ไม่ใช่ทำESP32ทุกส่วนหยุด แบบจำลองเวลาให้millisอ่านทุก10ms/วงdelayอ่านทุก1000ms มีบอกสมมติฐานชัดและtimeline0–1200msสำหรับpulse250–350ms ให้จำนวนการกดที่เห็น0เทียบ1 หยุดplayเมื่อinactive/hidden มีแถบLED/บรรทัดปัจจุบันอยู่กับcontrolsมือถือ และเปิดเฉพาะtabpanelที่เลือกโดยpanelซ่อนไม่บังปุ่ม

ใช้TurnitoutHumanizerกับคำอธิบายตามความต้องการในsessionนี้ ตรวจtechnicaltermsหลังประมวลผลเสมอ หากข้อความภาษาไทยไม่เปลี่ยนให้บอกตามจริง เก็บผลตรวจไว้เพื่อreview ไม่อ้างรับประกันหลบdetectorหรือคัดลอกengineproprietary
