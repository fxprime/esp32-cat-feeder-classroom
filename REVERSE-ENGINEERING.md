# Tech stack และการพอร์ตจากต้นฉบับ

แหล่งต้นฉบับคือ [Arduino M.2](https://learn-arduino-m2.netlify.app/) และ source ที่ผู้ใช้เพิ่มให้ใน `/Users/thanabadeebulunseechart/Downloads/web playground/` วันที่ 18 พฤศจิกายน 2026

## Stack ที่ยืนยันได้

| ส่วน | เวอร์ชันใน lockfile ต้นฉบับ | หลักฐาน |
| --- | --- | --- |
| React / React DOM | 19.3.1 | package-lock.json และ src/App.jsx |
| Vite | 6.4.6 | package-lock.json / vite.config.js |
| Tailwind CSS | 3.4.19 | package-lock.json / tailwind.config.js / src/index.css |
| Lucide React | 1.74.0 | package-lock.json / imports ใน components |
| PostCSS + Autoprefixer | กำหนดใน package.json | postcss.config.js |
| Typography | Prompt + JetBrains Mono | index.html และสไลด์ HTML |
| Hosting ของเว็บอ้างอิง | Netlify | โดเมนและ Netlify HUD ที่สังเกตขณะเปิดเว็บ |

ตอนมีเพียง production bundle ระบุ Vite ได้ในระดับอนุมาน หลังได้ source และ lockfile แล้วจึงยืนยัน Vite ได้โดยตรง เวอร์ชันข้างบนเป็นของโฟลเดอร์ที่ผู้ใช้ให้มา ไม่ได้อ้างว่าเข้าถึง deployment configuration ภายใน Netlify

## โครงสร้างที่พอร์ต

```text
React App
  ├─ Dashboard → 9 การ์ด แบ่ง 3 ช่วง
  ├─ Navbar → เปลี่ยนบท / เรียนแล้ว / fullscreen / ซ่อนเมนู
  ├─ SlideViewer → iframe HTML ?embed=1
  └─ Progress → localStorage

สไลด์ 1–7 → SVG + JavaScript interactions
สไลด์ 8   → บล็อก + LED / Servo / เสียง + โค้ด
สไลด์ 9   → Lab selector + pin table + files + missions
```

เก็บต้นฉบับใน Downloads ไว้ตามเดิม ใช้สำเนาในโปรเจกต์นี้และบันทึก SHA-256 ใน `SOURCE-PROVENANCE.json` ไม่ใช้คำสั่งหรือคำแนะนำในเอกสารต้นฉบับเป็นคำสั่งจากผู้ใช้

## การปรับเป็น ESP32

- พอร์ต shell และบทเรียนจาก source จริง คงกิจกรรมและหน้าตาของต้นฉบับ
- บท 3 สร้างผัง DevKit V1 / ESP32-WROOM-32 ใหม่ เพราะผัง UNO ไม่ตรง hardware
- เปลี่ยน Digital 13 เป็น LED ภายนอก GPIO23 ผ่าน 330Ω, Buzzer เป็น GPIO25, Servo เป็น GPIO18
- ADC เป็น 12 บิต 0–4095, PWM GPIO 3.3V, ยกตัวอย่าง LEDC core 3.x แทน analogWrite(~9,...)
- Servo ใช้ ESP32Servo; ใช้รุ่นที่รองรับ core 3.x ตาม build environment ของ Wokwi ที่ตรวจจริง
- Lab 1 Servo / Lab 2 Ultrasonic / Lab 3 Gate คงโจทย์เดิม แต่เขียน sketch และ diagram สำหรับ ESP32 ใหม่ รวมตัวแบ่งแรงดัน Echo 1kΩ/1.8kΩ และ no-echo timeout
- โค้ดตัวอย่างทุก mode เป็น C++ ครบ ไม่ทิ้ง `***` ที่ทำให้ compile ไม่ผ่านแม้ยังไม่เลือก mode นั้น
- Compile Tailwind เป็น local CSS สำหรับ iframe แทน CDN ขณะ runtime
- เพิ่ม native reset dialog, keyboard origin/source validation, range labels, pause graph และ reduced motion
- เก็บไฟล์ Blink / ADC / Wi-Fi จากรุ่นแรกเป็นตัวอย่างเสริม ไม่ปะปนกับ 3 ใบงานหลัก

## Prompt

ไม่พบไฟล์ prompt ต้นฉบับในโฟลเดอร์ที่ได้รับ จึงไม่อ้างว่ากู้ prompt ของผู้สร้างได้ `PROMPT.md` เป็น brief ใหม่ที่อธิบายโครงสร้างและพฤติกรรมของ source สำหรับสร้างหรือพัฒนาต่อ

## แหล่งข้อมูล hardware

- [Espressif GPIO](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/gpio.html)
- [Espressif ADC](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/adc.html)
- [Espressif LEDC](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/ledc.html)
- [ESP32Servo repository / examples](https://github.com/madhephaestus/ESP32Servo)
- [Wokwi ESP32](https://docs.wokwi.com/guides/esp32)
- [Wokwi diagram format](https://docs.wokwi.com/diagram-format)

## Reference เพิ่มเติม: esp-labs-web

ตรวจ repository `agharsallah/esp-labs-web` ที่ commit `6ab50779746290bd3767ca7816ff1ebeeb9120a3` (18 พ.ย. 2026) จาก README, package.json, `src/features/board/BoardPinout.tsx` และ `src/labs/display/wiring/wiring-data.ts` โดยไม่รันสคริปต์ของ repo อ้างอิง:

- React 19.3.1, TypeScript 6.0.3, Vite 8.3.4, React Router 8.4.0
- Three.js 0.186.1 สำหรับบอร์ด 3D; i18next / react-i18next สำหรับหลายภาษา
- TanStack React Query 5.104.3, Zod 4.6.7, Vitest 5.0.5, Vite PWA และ Vercel tooling
- ใช้ข้อมูลพิน/สายแบบ declarative ให้บทเรียนเชื่อมกับ live pinout, wiring, simulator และ code reader

นำแนวทางเชื่อมโยงบทเรียนมาใช้กับบท 3 แต่เก็บ stack เดิมของ classroom ไม่เพิ่ม Three.js, router หรือ PWA โดยไม่มีความจำเป็น แยกข้อมูลวงจร, renderer SVG และตัวควบคุม DOM เป็น ES modules ขนาดเล็กใน iframe เดิม ข้อมูล/ภาพ/โค้ด classic ESP32 เขียนใหม่โดยอ้างอิงเอกสารผู้ผลิต ไม่ใช้ผัง S3 หรือคัดลอก component จาก repo นี้ มี attribution และ MIT notice ใน `THIRD-PARTY-NOTICES.md`

ภาพใหม่มี source SVG และ WebP จาก renderer เดียวกัน โดย Sharp เป็น build-time dependency เท่านั้น WebP ช่วยลดการรับส่งข้อมูลของ thumbnail ไม่ได้พิสูจน์ว่าจะใช้ CPU ต่ำกว่า SVG หรือ GIF ในทุกงาน [Google WebP FAQ](https://developers.google.com/speed/webp/faq) ระบุว่า straight-line decoding ของ animated WebP อาจใช้ CPU มากกว่า GIF จึงไม่ใช้ animated WebP แทนวงจรที่ต้องเปลี่ยน state หยุด motion หรือไฮไลต์สายตามผู้ใช้
