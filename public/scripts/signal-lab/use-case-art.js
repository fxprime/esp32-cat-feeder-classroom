import { tftImageMarkup } from "./tft-image.js";
import { storyArt } from "./story-art.js";

const ink = "#284664";
const blue = "#1976b6";
const pale = "#dbeeff";
const mint = "#8be2c8";
const amber = "#ffd47d";
const paper = "#fff";
const scene = drawing => `<svg viewBox="8 10 128 82" aria-hidden="true" focusable="false"><g stroke="${ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`;

function board(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <rect width="53" height="43" rx="7" fill="${blue}"/>
    <path d="M8 8v27M46 8v27" stroke="${amber}" stroke-width="4" stroke-dasharray="1 5"/>
    <rect x="16" y="7" width="21" height="14" rx="2" fill="#b8d9ec"/>
    <path d="M20 13h13m-13 4h10" stroke="#6686a3" stroke-width="1.5"/>
    <rect x="16" y="25" width="11" height="8" rx="2" fill="${ink}"/>
    <circle cx="34" cy="29" r="2.5" fill="${mint}" stroke="none"/>
    <path d="M20 38h13v8H20z" fill="${paper}"/>
  </g>`;
}

function clock(x, y) {
  return `<g transform="translate(${x} ${y})">
    <circle r="20" fill="${paper}"/><path d="M0-11V0l8 4" fill="none"/>
    <circle r="2.5" fill="${ink}" stroke="none"/>
    <path d="M-12-19l-5-5m29 5 5-5" fill="none" stroke="${blue}"/>
  </g>`;
}

const art = {
  doorbell: scene(`<rect x="43" y="18" width="54" height="68" rx="12" fill="${pale}"/><circle cx="70" cy="53" r="15" fill="${amber}"/><path d="M62 52q0-10 8-10t8 10v7H62zM66 65h8" fill="none"/>`),
  pir: scene(`<rect x="27" y="50" width="62" height="33" rx="6" fill="${blue}"/><path d="M29 51a29 29 0 0 1 58 0z" fill="${paper}"/><path d="M40 49q0-28 18-28t18 28M29 42h58" fill="none" stroke="#aac6d9"/><circle cx="112" cy="33" r="8" fill="${amber}"/><path d="M104 47h16v22h-16zM106 69l-5 15m17-15 6 15" fill="${pale}"/>`),
  inputBoard: scene(`${board(45, 30, 1.15)}<path d="M12 58h29m-7-6 7 6-7 6" fill="none" stroke="${blue}"/>`),
  scheduler: scene(`
    <path d="M19 85h106" stroke="#c8def0"/>
    <rect x="30" y="27" width="88" height="51" rx="9" fill="${pale}"/>
    ${board(42, 36, .83)}
    ${clock(102, 28)}
  `),
  irrigation: scene(`
    <path d="M9 87h127" stroke="#c8def0"/>
    <rect x="12" y="41" width="47" height="31" rx="5" fill="${pale}"/>
    <path d="M21 56h9l12-9m-1 9h9M28 72v7m17-7v7" fill="none"/>
    <path d="M60 55h16V33h19" fill="none" stroke="${blue}" stroke-width="6"/>
    <circle cx="75" cy="55" r="8" fill="${pale}"/><path d="m72 57 3-5 3 5" fill="none" stroke="${blue}"/>
    <path d="M98 41q-5 8 0 8t0-8m11 0q-5 8 0 8t0-8" fill="#38a7e1" stroke="none"/>
    <path d="M106 76V52m0 15q-21 0-18-13 12 0 18 13m0-4q19-1 17-13-11-1-17 13" fill="${mint}"/>
    <path d="M85 73h43l-6 13H91z" fill="#f4b58a"/>
  `),
  dimmer: scene(`
    <path d="M20 87h107" stroke="#c8def0"/>
    <rect x="28" y="26" width="83" height="54" rx="10" fill="${paper}"/>
    <path d="M42 39h18m-9 20h17m-8-8v16" stroke="${blue}"/>
    <circle cx="92" cy="54" r="12" fill="${pale}"/><path d="M92 48v12m-6-6h12" stroke="${blue}"/>
    ${board(24, 59, .57)}
  `),
  cabinet: scene(`
    <path d="M20 84h111M34 77V30h78v47" fill="none"/>
    <rect x="29" y="23" width="93" height="34" rx="4" fill="#d8e9f7"/>
    <path d="M76 24v32M63 39v6m24-6v6" fill="none"/>
    <path d="M40 59h72l14 23H26z" fill="#ffe7a8" stroke="none"/>
    <path d="M40 58h71" stroke="#e79516" stroke-width="4"/>
    <path d="M20 84h111" stroke="${ink}"/>
  `),
  feeder: scene(`
    <path d="M16 88h111" stroke="#c8def0"/>
    <path d="M37 22h53v41l-12 13H50L37 63Z" fill="${pale}"/>
    <path d="M36 25h55v9H36z" fill="${blue}"/>
    <path d="M50 47h26l-7 13H57z" fill="${amber}"/>
    <rect x="82" y="55" width="25" height="15" rx="4" fill="${mint}"/>
    <path d="M88 60H66" stroke="${blue}"/>
    <path d="M49 78h35l-7 10H56z" fill="#f8bd87"/>
    <circle cx="63" cy="70" r="3" fill="#b96d35" stroke="none"/>
    <circle cx="70" cy="75" r="3" fill="#b96d35" stroke="none"/>
  `),
  doorPanel: scene(`
    <path d="M17 86h110" stroke="#c8def0"/>
    <path d="M27 84V22h54v62" fill="${pale}"/>
    <rect x="36" y="31" width="34" height="53" rx="1" fill="${paper}"/>
    <circle cx="62" cy="58" r="2.5" fill="${amber}"/>
    ${board(77, 45, .83)}
  `),
  welcomePanel: scene(`
    <path d="M17 86h110" stroke="#c8def0"/>
    <rect x="13" y="28" width="72" height="46" rx="6" fill="#102d42"/>
    <text x="49" y="58" text-anchor="middle" font-size="19" font-weight="700" fill="#9af1bd" stroke="none">hello</text>
    ${board(81, 42, .84)}
  `),
  greenhouseHub: scene(`
    <path d="M16 87h112" stroke="#c8def0"/>
    <rect x="24" y="24" width="94" height="57" rx="9" fill="${paper}"/>
    <path d="M38 48h30m-30 11h24m-24 11h34" stroke="#80b5d3"/>
    <path d="M46 31q-8 9 0 9t0-9" fill="#58beed" stroke="none"/>
    ${board(72, 38, .82)}
  `),
  greenhouse: scene(`
    <path d="M12 87h120" stroke="#c8def0"/>
    <path d="M18 48l52-26 53 26v34H18Z" fill="#dcf8ef"/>
    <path d="M40 42v40m31-33v33m28-44v44M19 48h104" fill="none" stroke="#70a49c"/>
    <path d="M42 79V62m0 8q-12-2-13-11 11 0 13 11m0-3q13-2 14-11-11 0-14 11" fill="${mint}"/>
    <rect x="79" y="47" width="30" height="29" rx="6" fill="${paper}"/>
    <image href="../assets/sensor-signals/sht31.webp" x="81" y="49" width="26" height="26" stroke="none"/>
  `),
  photoSource: scene(`
    <path d="M16 87h110" stroke="#c8def0"/>
    <rect x="24" y="26" width="92" height="53" rx="9" fill="${pale}"/>
    <rect x="34" y="40" width="32" height="23" rx="3" fill="${paper}"/>
    <path d="m37 59 8-8 5 4 7-7 5 5" fill="none" stroke="${blue}"/>
    <circle cx="44" cy="46" r="2" fill="#f99a59" stroke="none"/>
    ${board(68, 32, .85)}
  `),
  tft: scene(`
    <path d="M21 87h104" stroke="#c8def0"/>
    <rect x="28" y="21" width="89" height="59" rx="8" fill="#334155"/>
    <rect x="35" y="26" width="75" height="46" rx="3" fill="#102d42" stroke="none"/>
    <g transform="translate(37 27) scale(4.4)" shape-rendering="crispEdges" stroke="none">${tftImageMarkup()}</g>
    <path d="M60 76h27" stroke="${amber}" stroke-width="3.5" stroke-dasharray="2 4"/>
  `),
  joystick: scene(`
    <path d="M18 87h109" stroke="#c8def0"/>
    <path d="M31 66h82l10 16H21z" fill="#e1effb"/>
    <path d="M66 67l9-22" stroke="${ink}" stroke-width="8"/>
    <circle cx="78" cy="40" r="16" fill="#fbb780"/>
    <circle cx="99" cy="74" r="3" fill="${blue}" stroke="none"/>
    <path d="M107 34H98m9 0-5-5m5 5-5 5" fill="none" stroke="${blue}"/>
  `),
  remote: scene(`
    <path d="M19 87h106" stroke="#c8def0"/>
    <rect x="25" y="22" width="94" height="59" rx="14" fill="${paper}"/>
    <circle cx="46" cy="52" r="12" fill="${pale}"/>
    <path d="M39 52h14m-7-7v14" stroke="${blue}"/>
    ${board(68, 34, .8)}
  `),
  kitchenTimer: scene(`
    <path d="M17 87h111" stroke="#c8def0"/>
    <rect x="30" y="21" width="85" height="58" rx="12" fill="#fff0d8"/>
    ${clock(72, 49)}
    <path d="M31 43h10m61 0h10" stroke="#b77732"/>
  `),
  speaker: scene(`
    <path d="M20 87h112" stroke="#c8def0"/>
    <rect x="34" y="25" width="52" height="57" rx="8" fill="#feebd9"/>
    <circle cx="60" cy="55" r="17" fill="#f8bf81"/><circle cx="60" cy="55" r="8" fill="#fbddba"/>
    <path d="M94 45q10 10 0 20m10-27q16 16 0 32m10-39q22 22 0 45" fill="none" stroke="#b76e31"/>
  `),
  homeHub: scene(`
    <path d="M14 87h115" stroke="#c8def0"/>
    <path d="M19 49 61 21l43 28v32H19z" fill="${pale}"/>
    ${board(47, 42, .88)}
  `),
  roomSensor: scene(`
    <rect x="38" y="20" width="66" height="64" rx="10" fill="${pale}"/>
    <path d="M55 52V38a6 6 0 1 1 12 0v14a10 10 0 1 1-12 0" fill="#fff"/>
    <path d="M61 44v16" stroke="#d2774e" stroke-width="4"/>
    <path d="M83 41c0 6-9 12-9 17a9 9 0 1 0 18 0c0-5-9-11-9-17Z" fill="#8ad8f5"/>
  `),
  co2Sensor: scene(`
    <rect x="34" y="21" width="77" height="63" rx="10" fill="#dcf7ed"/>
    <rect x="45" y="34" width="55" height="23" rx="4" fill="#173c45"/>
    <text x="72" y="50" fill="#bbf5ec" text-anchor="middle" stroke="none" font-size="15" font-weight="700">CO₂</text>
    <path d="M50 66h45m-45 6h45" stroke="#6da292" stroke-width="2"/>
  `),
  lightSensor: scene(`
    <rect x="34" y="21" width="77" height="63" rx="10" fill="#fff6d3"/>
    <circle cx="72" cy="51" r="14" fill="${amber}"/>
    <path d="M72 27v6m0 36v6M48 51h6m36 0h6M55 34l5 5m24 24 5 5m0-34-5 5M60 63l-5 5" stroke="#b78128" stroke-width="2"/>
  `),
  vehicleGateway: scene(`
    <path d="M19 68l14-11 15-20h49l22 22 9 9v13H18Z" fill="${pale}"/>
    <circle cx="41" cy="79" r="9" fill="${ink}"/><circle cx="105" cy="79" r="9" fill="${ink}"/>
    ${board(57, 42, .63)}
  `),
  wheelSpeed: scene(`
    <circle cx="65" cy="52" r="29" fill="#52677f"/>
    <circle cx="65" cy="52" r="16" fill="${pale}"/>
    <circle cx="65" cy="52" r="5" fill="#52677f"/>
    <path d="M76 33l14 1v20H78" fill="#f59c70"/>
    <path d="M92 38h22V65" stroke="#739ab5" stroke-width="3" fill="none"/>
  `),
  engineTemp: scene(`
    <path d="M35 38h13v-9h35v9h19l11 16v24H45L30 63V46Z" fill="${pale}"/>
    <path d="M65 57V43a5 5 0 0 1 10 0v14a9 9 0 1 1 -10 0Z" fill="#fff"/>
    <path d="M70 46v17" stroke="#d46e50" stroke-width="3"/>
  `),
  carDash: scene(`
    <rect x="27" y="31" width="90" height="50" rx="9" fill="#dceffc"/>
    <path d="M46 66a25 25 0 0 1 50 0" fill="#fff"/>
    <path d="M71 64l12-11" stroke="#d36b54" stroke-width="3"/>
    <circle cx="71" cy="64" r="3" fill="${ink}"/>
  `),
  batteryDivider: scene(`
    <rect x="15" y="37" width="62" height="34" rx="5" fill="#fff2d9"/>
    <path d="M77 47h8v13h-8M28 53h14m-7-7v14" stroke="#ac6830"/>
    <path d="M52 53h11m24 0h7l4-7 6 14 6-14 6 14 4-7h12" fill="none" stroke="#ac6830"/>
  `),
  analogMeter: scene(`
    <rect x="21" y="20" width="102" height="65" rx="10" fill="${pale}"/>
    <path d="M29 54h10l6 9 10-22 9 13h12" fill="none" stroke="${blue}"/>
    ${board(72, 37, .86)}
  `),
  zmptModule: scene(`
    <rect x="17" y="28" width="110" height="53" rx="8" fill="#94d6e8"/>
    <rect x="42" y="36" width="53" height="36" rx="6" fill="#2679b8"/>
    <path d="M48 55q5-12 10 0t10 0t10 0t11 0" fill="none" stroke="#eaf8ff" stroke-width="2.5"/>
    <rect x="24" y="44" width="12" height="22" rx="3" fill="#e0edc9"/>
    <path d="M102 42h16m-16 10h16m-16 11h16" stroke="#496e9a"/>
  `),
};

const endpoint = (name, artwork) => ({ name, illustration: art[artwork] });

const feederEndpoint = (name, id) => ({ name, illustration: storyArt[id] });
const feederBoard = endpoint("ESP32", "inputBoard");

export const useCaseArt = {
  "feeder-ir": {
    left: { name: "IR สะท้อนที่ชาม", illustration: storyArt["feeder-ir"].replace("<svg ", '<svg data-ir-detected="true" ') },
    right: feederBoard, signals: ["HIGH / LOW"],
  },
  "feeder-stock": { left: feederBoard, right: feederEndpoint("HC-SR04 ที่ปากถัง", "feeder-stock"), signals: ["TRIG 10 µs", "ECHO บอกระยะ"] },
  "feeder-rh": { left: feederBoard, right: feederEndpoint("DHT22 ในถัง", "feeder-rh"), signals: ["เริ่มอ่าน", "ข้อมูลความชื้น"] },
  "feeder-piezo": { left: feederEndpoint("แผ่นรับแรงกระแทก", "feeder-piezo"), right: feederBoard, signals: ["แรงดันหลังปรับระดับ"] },
  "feeder-alert": { left: feederBoard, right: feederEndpoint("ไฟแดง", "feeder-alert"), signals: ["HIGH ให้ไฟแดงติด"] },
  button: { left: endpoint("ปุ่มกริ่งหน้าบ้าน", "doorbell"), right: endpoint("ESP32 · GPIO19", "inputBoard"), signals: ["LOW = กดปุ่ม"] },
  pir: { left: endpoint("PIR ที่ทางเดิน", "pir"), right: endpoint("ESP32 · GPIO26", "inputBoard"), signals: ["HIGH = ตรวจพบ"] },
  gpio: { left: endpoint("ESP32 ตั้งเวลา", "scheduler"), right: endpoint("รีเลย์ + ปั๊มน้ำ", "irrigation"), signals: ["HIGH เริ่ม · LOW หยุด"] },
  pwm: { left: endpoint("ESP32 ตัวหรี่ไฟ", "dimmer"), right: endpoint("แถบ LED ใต้ตู้", "cabinet"), signals: ["PWM หรี่ไฟ"] },
  servo: { left: endpoint("ESP32 ตั้งเวลา", "scheduler"), right: endpoint("เซอร์โวเปิดช่องอาหาร", "feeder"), signals: ["พัลส์สั่งมุม"] },
  uart: { left: endpoint("ESP32 บอร์ด A · TX", "doorPanel"), right: endpoint("ESP32 บอร์ด B · RX", "welcomePanel"), signals: ["hello"] },
  i2c: { left: endpoint("ESP32", "greenhouseHub"), right: endpoint("SHT31", "greenhouse"), signals: ["สั่งวัด", "อุณหภูมิ + ความชื้น"] },
  spi: { left: endpoint("ESP32 ในกรอบรูป", "photoSource"), right: endpoint("จอ TFT ILI9341", "tft"), signals: ["คำสั่ง + สี RGB565"] },
  adc: { left: endpoint("คันโยกรีโมต", "joystick"), right: endpoint("ADC ของ ESP32", "remote"), signals: ["แรงดัน"] },
  audio: { left: endpoint("DAC ของนาฬิกา", "kitchenTimer"), right: endpoint("แอมป์ + ลำโพง", "speaker"), signals: ["คลื่นเสียง"] },
  rs485: {
    nodes: [
      {...endpoint("ESP32 เกตเวย์", "homeHub"), detail: "ผ่าน RS‑485 transceiver"},
      {...endpoint("อุณหภูมิ", "roomSensor"), detail: "Modbus ID 1"},
      {...endpoint("CO₂", "co2Sensor"), detail: "Modbus ID 2"},
      {...endpoint("แสง", "lightSensor"), detail: "Modbus ID 3"},
    ],
  },
  can: {
    nodes: [
      {...endpoint("เกตเวย์รถ", "vehicleGateway"), detail: "รับและส่งข้อความ"},
      {...endpoint("กล่อง ABS", "wheelSpeed"), detail: "อ่านเซนเซอร์ล้อ"},
      {...endpoint("ECU เครื่องยนต์", "engineTemp"), detail: "อ่านอุณหภูมิเครื่อง"},
      {...endpoint("หน้าปัด", "carDash"), detail: "แสดงความเร็ว"},
    ],
  },
  battery: { left: endpoint("แบตเตอรี่ + ตัวแบ่งแรงดัน", "batteryDivider"), right: endpoint("ADC ของ ESP32", "analogMeter"), signals: ["ครึ่งหนึ่งของแรงดัน"] },
  ac: { left: endpoint("ZMPT101B", "zmptModule"), right: endpoint("ADC ของ ESP32", "analogMeter"), signals: ["รูปคลื่น AC ฝั่งวัด"] },
};
