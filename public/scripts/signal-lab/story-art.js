import { tftImageMarkup } from "./tft-image.js";

const svg = inner => `<svg viewBox="0 0 224 134" aria-hidden="true">${inner}</svg>`;
const sensor = (image, color) => svg(`
  <rect x="33" y="24" width="158" height="84" rx="15" fill="${color}" stroke="#b9cde8" stroke-width="2"/>
  <path d="M42 74h38l11-11m43 6h34m-34 9h24l9 10" fill="none" stroke="#9cb8da" stroke-width="2" stroke-linecap="round"/>
  <image href="../assets/sensor-signals/${image}.webp" x="77" y="24" width="70" height="70"/>
  <circle cx="174" cy="40" r="5" class="story-activity-light"/>
`);

export const storyArt = {
  "feeder-ir": svg(`
    <path d="M57 44 94 28v56L57 74Z" fill="#d9f1ff"/>
    <rect x="28" y="35" width="33" height="49" rx="8" fill="#1e6192"/>
    <path class="ir-outbound" d="M56 47l31 6m-6-5 6 5-8 4"/>
    <path class="ir-return" d="M87 53 56 70m7-1-7 1 4-6"/>
    <circle cx="56" cy="47" r="4" fill="#67e8f9"/>
    <circle class="ir-receiver" cx="56" cy="70" r="4" fill="#a78bfa"/>
    <g class="story-cat-arrival"><path d="M87 56l1-23 15 11q10-4 20 0l15-11 2 24q9 24-28 25-31-3-25-26Z" fill="#ffce93" stroke="#a16228" stroke-width="2"/><path d="M99 60h1m25 0h1m-15 8h3" stroke="#72411a" stroke-width="2.5" stroke-linecap="round"/></g>
    <path d="M74 95h76l-9 16H83Z" fill="#a5eafa" stroke="#28779e" stroke-width="2"/>
  `),
  "feeder-stock": svg(`
    <rect x="54" y="22" width="117" height="92" rx="12" fill="#e8f8ff" stroke="#27739a" stroke-width="3"/>
    <path d="M59 107V40h107v67Z" fill="#f9f7f2"/>
    <rect class="story-stock-fill" x="59" y="42" width="107" height="65" rx="3" fill="#dcad64"/>
    <path d="M88 32h48" stroke="#155e75" stroke-width="12" stroke-linecap="round"/>
    <circle cx="98" cy="32" r="4" fill="#bae6fd"/><circle cx="127" cy="32" r="4" fill="#bae6fd"/>
    <path d="M112 39v30m-4-25 4-5 4 5m-8 20 4 5 4-5" fill="none" stroke="#0369a1" stroke-width="2"/>
    <path d="M175 41h20m-15 16h10m-15 16h20m-15 16h10m-15 16h20" stroke="#64748b" stroke-width="2"/>
  `),
  "feeder-rh": svg(`
    <rect x="59" y="24" width="106" height="88" rx="13" fill="#d8f1ff" stroke="#175982" stroke-width="2"/>
    <path d="M76 41h72m-72 12h72m-72 12h72m-72 12h72" stroke="#5b88a5" stroke-width="5" stroke-dasharray="6 4"/>
    <path d="M88 112v11m17-11v11m17-11v11m17-11v11" stroke="#658095" stroke-width="3"/>
    <circle cx="188" cy="53" r="11" fill="#eaf2f8" stroke="#7b9ab1" stroke-width="2" class="story-humidity-state"/>
    <text x="113" y="99" text-anchor="middle" font-size="13" fill="#175982">HTU21D</text>
  `),
  "feeder-piezo": svg(`
    <path d="M27 33l80 31 8-10L36 23Z" fill="#e8d7ff" stroke="#9569be" stroke-width="2"/>
    <ellipse cx="113" cy="94" rx="39" ry="11" fill="#f8d281" stroke="#a77839" stroke-width="2"/>
    <path d="M144 94h32V65h21" stroke="#a170c1" stroke-width="3" fill="none"/>
    <circle cx="103" cy="59" r="8" fill="#bc812f"/><path d="M109 76l5-6m6 5 7-3" stroke="#a85c22" stroke-width="2" stroke-linecap="round"/>
  `),
  "feeder-alert": svg(`
    <circle class="story-light" cx="115" cy="58" r="43" fill="#f87171"/>
    <path d="M95 88V62a20 20 0 1 1 40 0v26Z" fill="#fee2e2" stroke="#b91c1c" stroke-width="2"/>
    <path class="story-emission" d="M96 88V62a19 19 0 1 1 38 0v26Z" fill="#f43f5e"/>
    <path d="M102 88v23m26-23v23" stroke="#64748b" stroke-width="4"/>
  `),
  button: svg(`
    <path d="M43 80v25h89V75" fill="none" stroke="#1976b6" stroke-width="3"/>
    <rect x="21" y="62" width="57" height="26" rx="5" fill="#dbeafe" stroke="#284664" stroke-width="2"/>
    <rect class="story-button-cap" x="34" y="43" width="31" height="25" rx="6" fill="#38bdf8" stroke="#284664" stroke-width="2"/>
    <rect x="116" y="32" width="76" height="67" rx="9" fill="#145b6a"/>
    <rect x="135" y="44" width="38" height="26" rx="3" fill="#cedce5"/>
    <text x="154" y="61" text-anchor="middle" font-size="10" fill="#284664">ESP32</text>
    <circle class="story-input-state" cx="154" cy="84" r="7"/>
  `),
  pir: svg(`
    <g class="story-pir-person" fill="#38bdf8" stroke="#284664" stroke-width="2"><circle cx="28" cy="33" r="9"/><path d="M19 49h18v27H19zM21 77l-6 24m20-24 7 24M18 53l-9 18m29-18 9 13"/></g>
    <rect x="64" y="60" width="53" height="34" rx="6" fill="#145b6a"/>
    <path d="M66 63a25 25 0 0 1 49 0z" fill="#f8fafc" stroke="#70909f" stroke-width="2"/>
    <path d="M78 61q0-25 13-25t13 25M66 54h49M91 37v25" fill="none" stroke="#bdcfdd" stroke-width="1.5"/>
    <path d="M111 81h31" stroke="#1976b6" stroke-width="3"/>
    <rect x="142" y="39" width="67" height="62" rx="7" fill="#145b6a"/>
    <rect x="157" y="50" width="37" height="24" rx="3" fill="#cedce5"/>
    <text x="175" y="65" text-anchor="middle" font-size="9" fill="#284664">ESP32</text><circle class="story-input-state" cx="175" cy="87" r="6"/>
  `),
  gpio: svg(`
    <path d="M12 82h28m-28 21h28m87-12v22h34m18 0h24V60h-10M153 91V70h22V61" fill="none" stroke="#64748b" stroke-width="4" stroke-linejoin="round"/>
    <rect x="40" y="70" width="59" height="46" rx="7" fill="#dbeafe" stroke="#6d96c7" stroke-width="2"/>
    <path d="M56 92q4-8 8 0t8 0t8 0" fill="none" stroke="#1e40af" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="127" cy="91" r="4" fill="#64748b"/><circle cx="153" cy="91" r="4" fill="#64748b"/>
    <path class="story-contact" d="M127 91h25" stroke="#075985" stroke-width="4" stroke-linecap="round"/>
    <circle class="story-light" cx="185" cy="41" r="25" fill="#fbbf24"/>
    <path class="story-bulb" d="M176 56v-3a17 17 0 1 1 18 0v3Z" stroke="#475569" stroke-width="2"/>
    <path d="M178 58h14v7h-14z" fill="#64748b"/>
    <path d="M161 113h4m10 0h4m-14-6v12m10-15v18" fill="none" stroke="#64748b" stroke-width="2.6" stroke-linecap="round"/>
  `),
  pwm: svg(`
    <circle class="story-light" cx="112" cy="56" r="48" fill="#fbbf24"/>
    <path d="M104 88v26m16-26v26" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
    <path d="M92 83V55a20 20 0 0 1 40 0v28Z" fill="#f8fafc" stroke="#b45309" stroke-width="2"/>
    <path class="story-emission" d="M93 83V55a19 19 0 0 1 38 0v28Z" fill="#fbbf24"/>
    <path d="M88 84h48" stroke="#b45309" stroke-width="4" stroke-linecap="round"/>
  `),
  servo: svg(`
    <path d="M39 112h146" stroke="#ccd8e5" stroke-width="3" stroke-linecap="round"/>
    <path d="M61 77a51 51 0 0 1 102 0" fill="none" stroke="#b7cde6" stroke-width="2" stroke-dasharray="4 5"/>
    <rect x="80" y="69" width="64" height="39" rx="9" fill="#d9edfe" stroke="#5987ba" stroke-width="2"/>
    <path d="M87 85h12m-12 8h19" stroke="#91b4d8" stroke-width="2" stroke-linecap="round"/>
    <path class="story-servo-arm" d="M112 77V35" stroke="#0369a1" stroke-width="8" stroke-linecap="round"/>
    <circle cx="112" cy="77" r="6" fill="#e0f2fe" stroke="#0369a1" stroke-width="2"/>
  `),
  uart: svg(`
    <rect x="39" y="31" width="146" height="76" rx="10" fill="#dbeafe" stroke="#7599c5" stroke-width="2"/>
    <rect x="64" y="47" width="96" height="42" rx="6" fill="#102d42" stroke="#6d96c7" stroke-width="2"/>
    <path d="M46 42v53m132-53v53" stroke="#b18840" stroke-width="2" stroke-dasharray="2 5"/>
    <text data-uart-text x="112" y="76" text-anchor="middle" font-size="23" font-weight="700" fill="#9af1bd">…</text>
  `),
  i2c: sensor("sht31", "#e4f6ff"),
  spi: svg(`
    <rect x="42" y="16" width="140" height="103" rx="9" fill="#334155" stroke="#162c43" stroke-width="2"/>
    <rect x="53" y="27" width="118" height="76" rx="3" fill="#102d42"/>
    <defs><clipPath id="story-tft-image"><path data-tft-reveal/></clipPath></defs>
    <g transform="translate(56 30) scale(7)" shape-rendering="crispEdges">
      <g clip-path="url(#story-tft-image)">${tftImageMarkup()}</g>
    </g>
    <path d="M92 111h40" stroke="#d8aa59" stroke-width="5" stroke-dasharray="3 4"/>
  `),
  adc: svg(`
    <path d="M57 34a47 47 0 1 1 0 69" fill="none" stroke="#edc6a7" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 6"/>
    <circle cx="89" cy="68" r="38" fill="#ffedd5" stroke="#d2a36e" stroke-width="2"/>
    <circle cx="89" cy="68" r="28" fill="#fff7ed" stroke="#c78242" stroke-width="2"/>
    <path class="story-knob" d="M89 60V47" stroke="#9a3412" stroke-width="5" stroke-linecap="round"/>
    <path d="M129 68h25l12-8h31m-43 8 12 9h31" fill="none" stroke="#bc7438" stroke-width="2.5" stroke-linecap="round"/>
  `),
  audio: svg(`
    <path d="M36 53h23l37-25a5 5 0 0 1 8 4v69a5 5 0 0 1-8 4L59 81H36a7 7 0 0 1-7-7V60a7 7 0 0 1 7-7Z" fill="#ffedd5" stroke="#b45309" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M59 53v28" stroke="#cd803e" stroke-width="2"/>
    <g class="story-sound-waves" fill="none" stroke="#b45309" stroke-width="4" stroke-linecap="round">
      <path d="M121 49q17 18 0 36"/>
      <path d="M138 40q24 27 0 54"/>
      <path d="M156 31q30 36 0 72"/>
    </g>
  `),
  rs485: svg(`
    <rect x="48" y="25" width="128" height="82" rx="12" fill="#dbeafe" stroke="#7599c5" stroke-width="2"/>
    <path d="M80 46H50L30 58m50 15H50L30 62" fill="none" stroke="#0369a1" stroke-width="3"/>
    <rect x="82" y="44" width="55" height="43" rx="5" fill="#1e4970"/>
    <path d="M72 51h10m-10 12h10m-10 12h10m55-24h10m-10 12h10m-10 12h10" stroke="#628daf" stroke-width="3"/>
    <text x="109" y="71" fill="#dbeeff" text-anchor="middle" font-size="12" font-weight="700">RS485</text>
    <circle cx="156" cy="41" r="4" class="story-activity-light"/>
  `),
  can: svg(`
    <path d="M42 85l9-18 17-6 20-24h49l30 28 16 3 6 17v11H40Z" fill="#dceefe" stroke="#577a9e" stroke-width="2.5"/>
    <path d="M87 42h23v20H70Zm28 0h19l22 20h-41Z" fill="#fff" stroke="#82a9c7" stroke-width="2"/>
    <circle cx="68" cy="94" r="12" fill="#2a4261"/><circle cx="159" cy="94" r="12" fill="#2a4261"/>
    <path d="M77 77h71M86 83h53" fill="none" stroke="#317eb3" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="112" cy="71" r="4" class="story-activity-light"/>
  `),
  battery: svg(`
    <rect x="38" y="43" width="133" height="54" rx="8" fill="#fff7ed" stroke="#b8753e" stroke-width="3"/>
    <path d="M172 57h13v25h-13" fill="#dcab7e" stroke="#b8753e" stroke-width="2"/>
    <rect data-battery-fill x="46" y="51" width="114" height="38" rx="4" fill="#ef9e4e"/>
    <path d="M98 80l8-21h9l-6 11h11l-16 13 3-8Z" fill="#7c3c14"/>
  `),
  ac: svg(`
    <rect x="34" y="26" width="156" height="82" rx="12" fill="#e4effc" stroke="#6e93b9" stroke-width="2"/>
    <rect x="50" y="42" width="78" height="49" rx="6" fill="#2679b8" stroke="#145980" stroke-width="2"/>
    <path d="M59 68q7-16 14 0t14 0t14 0t14 0" fill="none" stroke="#ecfaff" stroke-width="3" stroke-linecap="round"/>
    <rect x="141" y="45" width="32" height="35" rx="5" fill="#17344a"/>
    <text x="157" y="67" fill="#d9f0fe" text-anchor="middle" font-size="10" font-weight="700">ADC</text>
    <circle cx="175" cy="90" r="4" class="story-activity-light"/>
  `),
};
