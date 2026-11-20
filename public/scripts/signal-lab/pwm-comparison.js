import {initServoFeedback} from './servo-feedback.js';
import {pwmState,servoState,squarePoints,invariantAnswer} from './model.js';
const $=s=>document.querySelector(s);
const meters=items=>items.map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('');
function compare(){
 const p=pwmState($('#compare-led-duty').value),s=servoState($('#servo-pulse').value),same=$('#same-timebase').checked;
 $('#compare-led-duty').value=p.duty;$('#compare-led-duty-value').textContent=`${p.duty}%`;
 $('#led-timing').innerHTML=meters([['ความถี่คงที่','5,000 Hz'],['คาบคงที่','200 µs'],['เวลา HIGH',`${p.onUs.toFixed(0)} µs`],['ระดับแรงดันคงที่','0 / 3.3 V']]);
 $('#compare-led-glow').setAttribute('opacity',String(p.duty/100*.6));$('#compare-led-body').setAttribute('fill',`hsl(42 90% ${90-p.duty*.35}%)`);
 $('#compare-led-wave').setAttribute('points',squarePoints(200,p.onUs,same?20000:1000));
 $('#led-axis').textContent=same?'0 → 20 ms · 100 รอบ':'0 → 1 ms · 5 รอบ';
 $('#servo-pulse-value').textContent=`${s.pulseUs.toLocaleString('en-US')} µs`;
 $('#servo-timing').innerHTML=meters([['ความถี่คงที่','50 Hz'],['คาบคงที่','20 ms'],['Duty cycle',`${s.duty.toFixed(2)}%`],['มุมในแบบจำลอง',`${s.angle.toFixed(0)}°`]]);
 $('#compare-servo-wave').setAttribute('points',squarePoints(20000,s.pulseUs,20000));
 const flapAngle = Math.min(s.angle, 90);
 $('#servo-arm').style.setProperty('--servo-angle', `${flapAngle - 90}deg`);
 const feeder = $('.pwm-feeder-demo');
 if (feeder) {
  feeder.dataset.open = String(flapAngle >= 60);
  const position = s.angle === 0 ? 'ฝาปิด' : s.angle < 90 ? 'ฝาเปิดบางส่วน' : s.angle === 90 ? 'ฝาเปิด' : 'เลยช่วงฝาในโครงงาน';
  const status = $('#pwm-feeder-state'), label = `${s.angle.toFixed(0)}° · ${position}`;
  if (status.textContent !== label) status.textContent = label;
 }
 $('#servo-meaning').textContent=`${(s.pulseUs/1000).toFixed(2)} ms → ${s.angle.toFixed(0)}° (${s.duty.toFixed(2)}% ของคาบ)`;
 $('#compare-time-note').textContent=same?'ฐานเวลาเท่ากัน: ใน 20 ms LED เปิด–ปิด 100 รอบ ส่วน Servo ส่งพัลส์ 1 รอบ (ที่ duty 0% / 100% คลื่น LED ไม่มีขอบสลับ)':'ตอนนี้กราฟ LED ซูมช่วง 1 ms ส่วน Servo แสดง 20 ms · เปิด “ฐานเวลาเดียวกัน” เพื่อเทียบจำนวนรอบโดยตรง';
}
$('#compare-led-duty').addEventListener('input',compare);
$('#servo-pulse').addEventListener('input',compare);$('#same-timebase').addEventListener('change',compare);compare();

for (const button of document.querySelectorAll('[data-feeder-pulse]')) {
 button.addEventListener('click', () => {
  const input = $('#servo-pulse');
  input.value = button.dataset.feederPulse;
  input.dispatchEvent(new Event('input', { bubbles: true }));
 });
}
initServoFeedback();

$('#pwm-invariant-quiz').addEventListener('submit',e=>{
 e.preventDefault();const values=[...new FormData(e.currentTarget).getAll('invariant')],correct=invariantAnswer(values),feedback=$('#pwm-quiz-feedback');
 feedback.textContent=correct?'ถูกต้อง! ความถี่ / คาบ และระดับ HIGH / LOW เท่าเดิม สิ่งที่เปลี่ยนคือเวลา HIGH และกำลังเฉลี่ยของ LED เพราะเราตรึงความถี่ไว้ในการทดลองนี้':'ยังไม่ครบหรือมีข้อที่เปลี่ยนไปปนอยู่ ลองเทียบมิเตอร์ที่ duty 10% กับ 90% แล้วตอบใหม่ได้';
 feedback.dataset.correct=String(correct);
});
