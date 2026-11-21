import {boardSVG, boardTerminal} from '../pinout/diagrams.js';
import {tactileSVG} from './tactile.js';
import {feederHumidityLesson} from './feeder-humidity.js';
import {FEEDER_PINS} from '../feeder/model.js';
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function benchSVG(id,state,inputs){
 const pins=id==='for'?[23,22,21]:[23],h=320;
 const board={x:123,y:24,width:106,height:172};
 const [groundX,groundY]=boardTerminal('GND',board,1);
 const blend=(a,b,t)=>'#'+[0,2,4].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
 const leds=pins.map((pin,i)=>{const y=pins.length===1?150:85+i*85,duty=state.leds[pin]||0,on=duty>0,c=pin===23?(id===feederHumidityLesson.id||id==='blink'?'#dc2626':'#e8914d'):pin===22?'#4f9bc2':'#6fa268';
 const [signalX,signalY]=boardTerminal(pin,board);
 const signalLane=246+i*12, returnLane=255+i*12;
 return `<g><path d="M${signalX} ${signalY}H${signalLane}V${y}H293m45 0h62M432 ${y+16}v27H${returnLane}V${groundY}H${groundX}" fill="none" stroke="${on?c:'#a6b8b6'}" stroke-width="3"/><rect x="293" y="${y-9}" width="45" height="18" rx="5" fill="#ddc399" stroke="#ad8c57"/><path d="M305 ${y-8}v16m10-16v16" stroke="#be6e34" stroke-width="4"/><text x="315" y="${y-18}" text-anchor="middle" class="cl-svg-small">330Ω</text><circle data-led-glow="${pin}" cx="417" cy="${y-4}" r="28" fill="${c}" opacity="${duty/255*.25}"/><path data-output-target="led-${pin}" data-led-pin="${pin}" d="M402 ${y+15}v-21a15 15 0 0 1 30 0v21Z" fill="${on?blend('d8dfdf',c.slice(1),duty/255):'#d8dfdf'}" stroke="${on?c:'#95a8aa'}" stroke-width="2"/><text x="467" y="${y-1}" class="cl-svg-value">${on?duty===255?'ON':Math.round(duty/255*100)+'%':'OFF'}</text><g data-output-target="gpio-${pin}"><text data-gpio-pin="${pin}" x="255" y="${y+20}" class="cl-svg-small">GPIO${pin}</text><text x="255" y="${y+38}" class="cl-svg-small">${state.pins[pin]||'ยังไม่ตั้งขา'}</text></g></g>`;
 }).join('');
 const [sdaX,sdaY]=boardTerminal(FEEDER_PINS.humiditySda,board);
 const [sclX,sclY]=boardTerminal(FEEDER_PINS.humidityScl,board);
 const [adcX,adcY]=boardTerminal(34,board);
 const [buttonX,buttonY]=boardTerminal(18,board);
 const [leftGroundX,leftGroundY]=boardTerminal('GND',board,0);
 const input=id===feederHumidityLesson.id?`<g><path d="M${sdaX} ${sdaY}H238V207H106V220" stroke="#548e98" stroke-width="3" fill="none"/><path d="M${sclX} ${sclY}H244V212H123V220" stroke="#7c62ae" stroke-width="3" fill="none"/><rect data-input-point="${FEEDER_PINS.humiditySda}" x="75" y="220" width="80" height="55" rx="7" fill="#d7e7f4" stroke="#7d9ab4"/><rect x="106" y="227" width="18" height="17" rx="3" fill="#304960"/><circle cx="115" cy="235.5" r="2" fill="#aac2d0"/><text x="115" y="253" text-anchor="middle" class="cl-svg-small">I²C</text><text x="115" y="266" text-anchor="middle" class="cl-svg-small">HTU21D</text><text x="115" y="302" text-anchor="middle" class="cl-svg-value">${inputs.humidity===null?'อ่านไม่ได้':inputs.humidity+'% RH'}</text></g>`:id==='condition'?`<g><path d="M${leftGroundX} ${leftGroundY}H53V218H66m92 0h83V${buttonY}H${buttonX}" fill="none" stroke="#64748b" stroke-width="3"/>${tactileSVG(inputs.button,'x="68" y="202" width="88" height="88"')}<text data-input-point="18" x="115" y="309" text-anchor="middle" class="cl-svg-small">GPIO18 → ปุ่ม → GND · ${inputs.button?'LOW':'HIGH'}</text><text data-output-target="gpio-18" x="172" y="251" class="cl-svg-small">${state.pins[18]||'ยังไม่ตั้งขา'}</text></g>`:id==='sensor'?`<g><path d="M${adcX} ${adcY}H57V239H90" fill="none" stroke="#9c772f" stroke-width="3"/><circle data-input-point="34" cx="115" cy="239" r="24" fill="#d4c3a5" stroke="#ad976f"/><g transform="rotate(${inputs.raw/4095*270-135} 115 239)"><path d="M115 239v-17" stroke="#fff" stroke-width="5"/></g><text x="115" y="285" text-anchor="middle" class="cl-svg-value">ADC ${inputs.raw}</text></g>`:'';
 return `<svg viewBox="0 0 550 ${h}" role="img" aria-label="บอร์ด ESP32 และสถานะ LED จากคำสั่งที่ทำแล้ว"><rect width="550" height="${h}" rx="16" fill="#eff6ff"/>${boardSVG(board)}<text x="176" y="217" text-anchor="middle" class="cl-svg-small">DevKitC V4</text>${leds}${input}</svg>`;
}
