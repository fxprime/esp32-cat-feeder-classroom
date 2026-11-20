// Teaching models: ideal 12-bit ADC and a nominal 1–2 ms position servo.
export const ADC_MAX=4095, ADC_LEVELS=4096, ADC_FULL_SCALE=3.3;
export const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export function quantizeVoltage(voltage,bits=12){
 if(!Number.isInteger(bits)||bits<1||bits>16)throw new RangeError('ADC resolution must be 1–16 bits');
 const v=clamp(Number(voltage)||0,0,ADC_FULL_SCALE),levels=2**bits,lsb=ADC_FULL_SCALE/levels;
 const code=Math.min(levels-1,Math.floor(v/lsb));
 return {voltage:v,code,bits,levels,binary:code.toString(2).padStart(bits,'0'),lsb,lower:code*lsb,upper:(code+1)*lsb};
}
export function adcSample(voltage){return quantizeVoltage(voltage,12);}
export function pwmState(duty){
 const d=clamp(Number(duty)||0,0,100);
 return {duty:d,frequency:5000,periodUs:200,highV:3.3,lowV:0,onUs:200*d/100,averageV:3.3*d/100};
}
export function servoState(pulseUs){
 const pulse=clamp(Number(pulseUs)||1500,1000,2000);
 return {pulseUs:pulse,frequency:50,periodUs:20000,duty:pulse/200,angle:(pulse-1000)*.18};
}
export function servoLoopFrame(target, start, progress) {
 const drive = clamp((progress - .18) / .72, 0, 1);
 const actual = Math.round(start + (target - start) * drive * (2 - drive));
 const error = target - actual;
 const phase = drive === 0 ? 'reading' : error === 0 ? 'settled' : 'driving';
 return {actual, error, phase};
}
export function fastPlaygroundLoop(program) {
 const ledWrites = program.filter(item => item.type === 'led_on' || item.type === 'led_off');
 let level = Number(ledWrites.at(-1)?.type === 'led_on');
 const slots = program.map(item => {
  if (item.type === 'led_on') level = 1;
  if (item.type === 'led_off') level = 0;
  return level;
 });
 const duty = slots.length ? slots.reduce((sum, level) => sum + level, 0) / slots.length : 0;
 return {
  slots,
  duty,
  servo: program.findLast(item => item.type === 'servo')?.val,
  tone: program.findLast(item => item.type === 'beep')?.val,
 };
}
export function squarePoints(periodUs,onUs,windowUs,width=520){
 const high=22,low=94,pts=[];
 if(onUs<=0)return `0,${low} ${width},${low}`;
 if(onUs>=periodUs)return `0,${high} ${width},${high}`;
 for(let time=0;time<windowUs;time+=periodUs){
  const x=time/windowUs*width,end=Math.min(time+onUs,windowUs)/windowUs*width;
  pts.push(`${x},${low}`,`${x},${high}`,`${end},${high}`,`${end},${low}`);
 }
 pts.push(`${width},${low}`);return pts.join(' ');
}
export function invariantAnswer(values){return values.length===2&&values.includes('timing')&&values.includes('levels');}

// Ideal SAR teaching sequence, referred to the external full-scale input range.
export function sarTrace(voltage,bits=3){
 const sample=quantizeVoltage(voltage,bits),steps=[];let code=0;
 for(let bit=bits-1;bit>=0;bit--){
  const trial=code+2**bit,trialVoltage=trial*sample.lsb,keep=sample.voltage>=trialVoltage;
  if(keep)code=trial;
  steps.push({bit,trial,trialVoltage,keep,code,decided:code.toString(2).padStart(bits,'0').slice(0,bits-bit),lower:code*sample.lsb,upper:Math.min(sample.levels,code+2**bit)*sample.lsb});
 }
 return {sample,steps,code};
}
