const usbCable = 'M206 200H250Q270 200 270 222V245Q270 268 292 268H417Q438 268 438 247V225';
const returnPath = 'M438 236V247Q438 281 417 281H292Q257 281 257 245V222Q257 213 250 213H206';

export const usbScene = `
  <title id="usb-scene-title">โน้ตบุ๊กจ่ายไฟให้ ESP32 และอุปกรณ์ที่เลือก</title>
  <defs>
    <pattern id="power-dots" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.25" fill="#bfd3e9"/>
    </pattern>
    <linearGradient id="power-screen" x2="0" y2="1">
      <stop stop-color="#213f61"/><stop offset="1" stop-color="#122841"/>
    </linearGradient>
    <marker id="power-forward" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0L7 3.5 0 7Z" fill="#0284c7"/>
    </marker>
    <marker id="power-reverse" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0L7 3.5 0 7Z" fill="#dc2626"/>
    </marker>
  </defs>
  <rect width="940" height="350" fill="url(#power-dots)"/>
  <path d="M40 238H898" stroke="#d7e5f3" stroke-width="2"/>
  <g>
    <rect x="44" y="73" width="151" height="113" rx="12" fill="#1e293b" stroke="#526779" stroke-width="3"/>
    <rect x="54" y="84" width="131" height="87" rx="5" fill="url(#power-screen)"/>
    <circle cx="120" cy="79" r="2" fill="#a5c2dd"/>
    <path d="M66 106h43m-43 13h26m-26 13h51" stroke="#6ec7ef" stroke-width="4" stroke-linecap="round" opacity=".72"/>
    <text x="120" y="157" class="scene-screen" text-anchor="middle">USB 2.0</text>
    <path d="M45 182H195L222 203Q225 214 211 216H33Q18 215 23 204Z" fill="#a7b8cd" stroke="#526779" stroke-width="3"/>
    <path d="M49 188h138l9 8H39Z" fill="#dae6f2"/><path d="M94 203h55" stroke="#657c96" stroke-width="3" stroke-linecap="round"/>
    <rect x="205" y="194" width="16" height="13" rx="3" fill="#172f4a" class="usb-socket"/>
    <text x="119" y="53" text-anchor="middle" class="scene-label">โน้ตบุ๊กเก่า</text>
    <text x="120" y="262" text-anchor="middle" class="scene-small">พอร์ตตัวอย่าง 500mA</text>
  </g>
  <g>
    <rect x="376" y="58" width="125" height="169" rx="11" fill="#14655d" stroke="#0b423d" stroke-width="3"/>
    <rect x="401" y="72" width="75" height="77" rx="7" fill="#d8e1e9" stroke="#9baabd" stroke-width="2"/>
    <path d="M410 82h49v8h-41v8h34" stroke="#9baabd" stroke-width="2" fill="none"/>
    <text x="439" y="132" class="scene-chip" text-anchor="middle">ESP32</text>
    <path d="M387 86v115m103-115v115" stroke="#e3be70" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 12"/>
    <rect x="418" y="162" width="40" height="32" rx="4" fill="#162f39"/>
    <rect x="419" y="202" width="38" height="24" rx="4" fill="#c7d5e3" stroke="#778da7" stroke-width="2"/>
    <circle class="board-power" cx="472" cy="183" r="5" fill="#94a3b8"/>
    <text x="439" y="39" text-anchor="middle" class="scene-label">ESP32 DevKit</text>
  </g>
  <path class="cable-return" d="${returnPath}"/>
  <path class="usb-cable" d="${usbCable}"/>
  <path class="scene-flow usb-flow" d="${usbCable}" marker-end="url(#power-forward)"/>
  <g class="usb-plug-left">
    <rect x="219" y="192" width="32" height="17" rx="5" fill="#334155"/>
    <path d="M220 196h-12v9h12" fill="#cbd5e1"/>
    <path d="M226 201h15" stroke="#8ea6bd" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g class="usb-plug-right">
    <rect x="426" y="225" width="24" height="24" rx="6" fill="#334155"/>
    <path d="M429 227v-10h18v10" fill="#cbd5e1"/>
    <path d="M432 235h12" stroke="#8ea6bd" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g class="usb-voltage">
    <rect x="266" y="302" width="247" height="30" rx="15" fill="#e0f2fe"/>
    <text x="389" y="323" class="scene-voltage" text-anchor="middle">4.90V เข้า VBUS · ค่าตัวอย่าง</text>
  </g>

  <g class="usb-device-slot" data-state="board">
    <g class="usb-device" data-device="board">
      <rect x="620" y="103" width="247" height="115" rx="20" fill="#f4f9ff" stroke="#bcd3ed" stroke-width="2" stroke-dasharray="7 7"/>
      <text x="743" y="154" text-anchor="middle" class="scene-label">ช่องทดลองโหลด</text>
      <text x="743" y="186" text-anchor="middle" class="scene-small">เลือก LED, Servo หรือ Motor</text>
    </g>
    <g class="usb-device" data-device="led">
      <path class="load-feed" d="M501 149H636M701 149H742V172H771"/>
      <path class="cable-return" d="M805 185v48H523q-20 0-20-20v-36"/>
      <path class="scene-flow load-flow" d="M501 149H636M701 149H742V172H771" marker-end="url(#power-forward)"/>
      <rect x="637" y="137" width="64" height="24" rx="9" fill="#e6c68b" stroke="#9d6737" stroke-width="2"/>
      <path d="M649 139v20m13-20v20m15-20v20m13-20v20" stroke="#98513f" stroke-width="4"/>
      <circle class="led-glow" cx="788" cy="142" r="41" fill="#fcd34d"/>
      <path class="led-bulb" d="M767 172v-33a21 21 0 0 1 42 0v33Z" fill="#fde68a" stroke="#b7791f" stroke-width="3"/>
      <path d="M771 174v12m34-12v12" stroke="#64748b" stroke-width="4"/>
      <text x="720" y="84" text-anchor="middle" class="scene-label">LED + ตัวต้านทาน</text>
      <text x="668" y="122" text-anchor="middle" class="scene-small">330Ω</text>
      <text x="631" y="184" text-anchor="middle" class="scene-small">GPIO · 3.3V</text>
    </g>
    <g class="usb-device" data-device="servo">
      <path class="load-feed" d="M458 224H548v-63H693"/>
      <path class="cable-return" d="M492 188H552v-8H693"/>
      <path class="signal-wire" d="M498 122H566V142H693"/>
      <path class="scene-flow load-flow" d="M458 224H548v-63H693" marker-end="url(#power-forward)"/>
      <rect x="685" y="126" width="140" height="85" rx="12" fill="#3186cb" stroke="#1f5889" stroke-width="3"/>
      <path d="M696 195h116M704 205h100" stroke="#5baee5" stroke-width="3"/>
      <circle cx="774" cy="151" r="16" fill="#c7e6fa"/>
      <g transform="translate(774 151)">
        <g class="servo-motion"><path d="M0 0v-62" stroke="#172f4a" stroke-width="13" stroke-linecap="round"/><circle cy="-49" r="2.8" fill="#c7e6fa"/></g>
        <circle r="5" fill="#e2f0fc"/>
      </g>
      <text x="742" y="61" text-anchor="middle" class="scene-label">Servo</text>
      <text x="615" y="128" text-anchor="middle" class="scene-small">SIG</text>
      <text x="752" y="262" text-anchor="middle" class="scene-small">กระแสพุ่งตอนเริ่มขยับ</text>
    </g>
    <g class="usb-device" data-device="motor">
      <path class="signal-wire" d="M501 120H619V137"/>
      <path class="load-feed" d="M458 224H579v-55h37M697 169H748"/>
      <path class="cable-return" d="M497 194h51v48h119q13 0 13-16v-32m18-5h50"/>
      <path class="scene-flow load-flow" d="M458 224H579v-55h37M697 169H748" marker-end="url(#power-forward)"/>
      <rect x="615" y="136" width="82" height="64" rx="10" fill="#a93337" stroke="#72262e" stroke-width="3"/>
      <rect x="637" y="148" width="36" height="27" rx="4" fill="#2d2935"/>
      <text x="656" y="225" text-anchor="middle" class="scene-small">Driver</text>
      <rect x="747" y="140" width="65" height="58" rx="13" fill="#a9bccf" stroke="#526779" stroke-width="3"/>
      <path d="M756 145v48m11-48v48m11-48v48" stroke="#dbe7f3" stroke-width="3"/>
      <path d="M811 168h24" stroke="#64748b" stroke-width="8"/>
      <g transform="translate(853 168)">
        <g class="motor-wheel">
          <circle r="38" fill="#27374a" stroke="#0f2438" stroke-width="3"/>
          <circle r="27" fill="#91abc4" stroke="#526779" stroke-width="2"/>
          <path d="M0-24V24M-24 0H24M-17-17l34 34m0-34l-34 34" stroke="#e2eaf3" stroke-width="5"/>
          <circle r="9" fill="#27516e"/>
        </g>
      </g>
      <text x="804" y="70" text-anchor="middle" class="scene-label">DC Motor + ล้อ</text>
      <text x="562" y="106" text-anchor="middle" class="scene-small">PWM</text>
      <g class="motor-hand" transform="translate(846 187)">
        <g>
          <path d="M60 66l-13-13-18-4Q16 43 11 31L3 17Q0 12 4 9q5-3 9 2l8 9L9-4q-3-6 2-8 4-2 8 4l10 17-5-15q-2-6 3-8 5-1 8 5l6 17-2-12q-1-6 4-6 5-1 6 5l4 14q9-2 13 6l7 25 12 9Z" fill="#fed7aa" stroke="#b87650" stroke-width="2"/>
          <path d="M46 55l22-14 20 18-26 20Z" fill="#367cb7" stroke="#25577c" stroke-width="2"/>
        </g>
      </g>
    </g>
  </g>
  <path class="reverse-flow" d="M812 168H698H617H578V224H438V247Q438 268 417 268H292Q270 268 270 245V222Q270 200 250 200H207" marker-end="url(#power-reverse)"/>
  <g class="fault-visual">
    <g class="fault-smoke" fill="#66758b">
      <circle cx="209" cy="167" r="12"/><circle cx="225" cy="157" r="14"/><circle cx="217" cy="139" r="12"/><circle cx="236" cy="124" r="15"/>
    </g>
    <path d="M218 185l11-21 4 12 13-8-11 22-6-11Z" fill="#f59e0b" stroke="#c2410c" stroke-width="2"/>
    <rect x="25" y="286" width="205" height="31" rx="15" fill="#fee2e2"/>
    <text x="127" y="307" text-anchor="middle" fill="#9f1239" class="scene-small">ตัวอย่างพอร์ตเสียหาย</text>
  </g>
`;
