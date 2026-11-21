import {boardSVG, boardTerminal} from '../pinout/diagrams.js';

export function sourceCircuitSVG(voltage) {
 const angle=voltage/3.3*270-135, value=voltage.toFixed(4);
 const board={x:351,y:20,width:124,height:248};
 const [x,powerY]=boardTerminal('3V3',board);
 const [,adcY]=boardTerminal(34,board);
 const [,groundY]=boardTerminal('GND',board,0);
 const wire=(d,color)=>`<path d="${d}" fill="none" stroke="#fff" stroke-width="8"/><path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round"/>`;
 return `<title>ตัวต้านทานปรับค่าได้ส่ง ${value} โวลต์จากขากลางไป GPIO34 ของ ESP32-DevKitC V4</title>
  ${wire(`M78 208V243H244V${powerY}H${x}`,'#c65156')}
  ${wire(`M108 208V225H278V${adcY}H${x}`,'#ce8b2c')}
  ${wire(`M138 208V264H312V${groundY}H${x}`,'#496e91')}
  ${boardSVG(board)}
  <circle cx="108" cy="118" r="60" fill="#f0e0c0" stroke="#a48c62" stroke-width="3"/>
  <circle cx="108" cy="118" r="42" fill="#786c59"/>
  <g transform="rotate(${angle} 108 118)"><path d="M108 118V84" stroke="#fff1c9" stroke-width="6" stroke-linecap="round"/></g>
  <text x="108" y="30" font-size="19" text-anchor="middle" fill="#715a36">ปุ่มหมุน 10 kΩ</text>
  <path d="M78 174v34m30-34v34m30-34v34" stroke="#8e958c" stroke-width="5"/>
  <text x="170" y="184" font-size="19" fill="#a86d25">${value} V</text>
  <text x="170" y="206" font-size="12" fill="#745d48">ขากลางเทียบกับ GND</text>
  <text x="${x-8}" y="${powerY-8}" font-size="12" fill="#8d323b" text-anchor="end">3V3</text>
  <text x="${x-8}" y="${adcY-8}" font-size="12" fill="#755124" text-anchor="end">GPIO34</text>
  <text x="${x-8}" y="${groundY-8}" font-size="12" fill="#456578" text-anchor="end">GND</text>
  <text x="414" y="285" font-size="12" text-anchor="middle" fill="#36536a">ESP32-DevKitC V4</text>`;
}

export function potentiometerTrackSVG(voltage){
 const x=448-voltage/3.3*380,label=Math.min(365,Math.max(155,x));
 return `<title>ภายในปุ่มหมุน ขากลางแตะแถบความต้านทานที่ตำแหน่งซึ่งให้ ${voltage.toFixed(4)} โวลต์</title><text x="48" y="19" font-size="17" fill="#af5155">3.3 V</text><text x="467" y="19" text-anchor="end" font-size="17" fill="#50748c">GND · 0 V</text><path d="M48 40h420" stroke="#6a766d" stroke-width="3"/><rect x="68" y="30" width="380" height="20" rx="7" fill="#cab28a" stroke="#9c835c"/><path d="M${x} 74V51m-6 7 6-7 6 7" stroke="#b67b28" stroke-width="3" fill="none"/><text x="${label}" y="98" text-anchor="middle" font-size="17" fill="#9b6b2c">ขากลางแตะตรงนี้ → ${voltage.toFixed(4)} V</text>`;
}
