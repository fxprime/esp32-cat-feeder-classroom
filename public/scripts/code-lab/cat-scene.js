import {duck} from './function-lessons.js';
import {esc} from './drawing.js';

const scene = contents => `<svg class="cl-cat-art" viewBox="0 0 360 184" aria-hidden="true">
 <rect width="360" height="184" rx="17" fill="#eaf7ff"/>
 <path d="M0 146Q112 124 215 147T360 146v38H0Z" fill="#d8eff8"/>
 <path d="M45 34v14m-7-7h14m265 16v12m-6-6h12" stroke="#7dd3fc" stroke-width="2.5" stroke-linecap="round"/>
 <circle cx="64" cy="69" r="4" fill="#a5e4f2"/><circle cx="281" cy="37" r="4" fill="#a5e4f2"/>
 ${contents}
</svg>`;

const mochi = (x,y,scale=1) => `<g transform="translate(${x} ${y}) scale(${scale})">
 <ellipse cy="57" rx="54" ry="8" fill="#6eb4c624"/>
 <path d="M28 45q38 2 39-21q1-11-9-9" fill="none" stroke="#c48052" stroke-width="10" stroke-linecap="round"/>
 <ellipse cy="35" rx="34" ry="26" fill="#f0bc89" stroke="#bc7c56" stroke-width="2"/>
 <ellipse cx="-18" cy="55" rx="11" ry="6" fill="#ffddb2"/><ellipse cx="18" cy="55" rx="11" ry="6" fill="#ffddb2"/>
 <path d="M-39-4l4-45 33 22h6l31-22 5 45" fill="#ffce97" stroke="#bc7c56" stroke-width="2.5" stroke-linejoin="round"/>
 <path d="M-31-16l2-21 17 14m43 7-2-21-17 14" fill="#f39595"/>
 <ellipse cy="1" rx="45" ry="33" fill="#ffcf97" stroke="#bc7c56" stroke-width="2.2"/>
 <path d="M-10-28l4 10m9-11-1 12m11-9-4 8" fill="none" stroke="#d9905b" stroke-width="3" stroke-linecap="round"/>
 <circle cx="-15" cy="0" r="4" fill="#423448"/><circle cx="15" cy="0" r="4" fill="#423448"/>
 <ellipse cx="-26" cy="10" rx="6" ry="3" fill="#f394a3"/><ellipse cx="26" cy="10" rx="6" ry="3" fill="#f394a3"/>
 <path d="M-3 8h6l-3 4zm3 4q-3 7-9 3m9-3q3 7 9 3m-36-8-15-4m15 10-15 2m69-8 15-4m-15 10 15 2" fill="none" stroke="#704955" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</g>`;

const duckArt = (x,y) => `<g transform="translate(${x} ${y})">
 <ellipse cy="52" rx="52" ry="8" fill="#6eb4c624"/>
 <path d="M-9 42v13m22-13v13m-26 0h13m9 0h13" stroke="#d9763a" stroke-width="5" stroke-linecap="round"/>
 <path d="M-40 13q-16-5-16-15q17 6 29 7" fill="#ffdf7c" stroke="#d0a253" stroke-width="2"/>
 <ellipse cx="-7" cy="22" rx="42" ry="29" fill="#ffdf7c" stroke="#d0a253" stroke-width="2"/>
 <ellipse cx="-19" cy="24" rx="16" ry="10" fill="#f6be55"/>
 <circle cx="15" cy="-12" r="27" fill="#ffe395" stroke="#d0a253" stroke-width="2"/>
 <path d="M33-9q14-7 23 0q2 10-22 13z" fill="#f18a4d"/>
 <circle cx="23" cy="-16" r="3.6" fill="#423448"/><circle cx="23" cy="-4" r="4" fill="#f5a28f"/>
</g>`;

const treats = count => Array.from({length:Math.min(count,6)},(_,i)=>{
 const x=(i%3-1)*19;
 const y=i<3?-16:-30;
 return `<rect x="${x-5}" y="${y}" width="10" height="10" rx="3" fill="#b66f4a" stroke="#925239" stroke-width="1.4" transform="rotate(${i%2?12:-12} ${x} ${y})"/>`;
}).join('');

const value = (state,name) => state.vars[name]?.value;
const verdict = (answer, other) => {
 if(answer===undefined)return 'รอคำตอบ';
 return answer==='true'?'true · ใช่แมว':`false · ${other}`;
};

export function catScene(id,state){
 if(id==='function-void'){
  const count=value(state,'bowl')??0;
  const art=scene(`${mochi(102,104)}<g transform="translate(254 134)" data-output-target="cat-bowl">
   <ellipse cy="24" rx="60" ry="7" fill="#6e8ec324"/>
   <path d="M-52-5l9 23q43 19 86 0l9-23Z" fill="#9e9aee" stroke="#766eca" stroke-width="2"/>
   <ellipse cy="-5" rx="52" ry="10" fill="#c9c4ff" stroke="#766eca" stroke-width="2"/>${treats(count)}
  </g>`);
  return `${art}<div class="cl-cat-caption"><span>ขนมในชามของโมจิ</span><strong data-cat-bowl>${count} ชิ้น</strong></div>`;
 }
 if(id==='function-reference'){
  const snack=value(state,'snack'), count=value(state,'pieces')??0;
  const packed=snack==='Tuna';
  const art=scene(`${mochi(105,104)}<g transform="translate(251 120)" data-output-target="cat-snack">
   <rect x="-48" y="-25" width="96" height="55" rx="13" fill="${packed?'#f7acc5':'#e3e8f6'}" stroke="${packed?'#be6e92':'#9baacb'}" stroke-width="2"/>
   <rect x="-53" y="-30" width="106" height="15" rx="6" fill="${packed?'#ffdae8':'#f0f4ff'}" stroke="${packed?'#be6e92':'#9baacb'}" stroke-width="2"/>
   ${packed?'<path d="M-18 6q16-18 34 0q-18 18-34 0m0 0-13-8v16z" fill="#fff4de" stroke="#ad617e" stroke-width="2"/><circle cx="9" cy="5" r="2" fill="#654258"/>':'<path d="M-11 6h22" stroke="#a6b4ce" stroke-width="2.5" stroke-linecap="round"/>'}
  </g>`);
  return `${art}<div class="cl-cat-caption"><span>${packed?'ทูน่าในกล่อง':'กล่องขนมของโมจิ'}</span><strong data-output-target="cat-pieces">${count} ชิ้น</strong></div>`;
 }
 const voice=value(state,'voice');
 const catAnswer=value(state,'isCat'), duckAnswer=value(state,'isDuckCat');
 return `${scene(mochi(99,100,.96)+duckArt(255,104))}
 <div class="cl-cat-cases">
  <div><b>โมจิ</b><span data-output-target="cat-voice">${voice?esc(voice):'รอฟังเสียง'} · ${value(state,'legs')??'–'} ขา</span><strong data-output-target="cat-answer" data-result="${catAnswer??'pending'}">${verdict(catAnswer,'ลองฟังอีกที')}</strong></div>
  <div><b>เจ้าเป็ด</b><span>${duck.voice} · ${duck.legs} ขา</span><strong data-output-target="duck-answer" data-result="${duckAnswer??'pending'}">${verdict(duckAnswer,'เสียงเป็ด')}</strong></div>
 </div>`;
}
