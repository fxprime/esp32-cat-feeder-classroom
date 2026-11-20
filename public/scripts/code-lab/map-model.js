export function mapValue({value,inMin,inMax,outMin,outMax}) {
  const values=[value,inMin,inMax,outMin,outMax];
  if(!values.every(v=>Number.isInteger(v)&&Math.abs(v)<=10000))throw new Error('กรอกจำนวนเต็มระหว่าง −10000 ถึง 10000 ให้ครบ');
  if(inMin===inMax)throw new Error('in min กับ in max ต้องต่างกัน จึงจะมีช่วงให้แปลง');
  const delta=value-inMin,run=inMax-inMin,rise=outMax-outMin;
  const quotient=Math.trunc(delta*rise/run);
  return {value,inMin,inMax,outMin,outMax,delta,run,rise,ratio:delta/run,quotient,result:quotient+outMin};
}
