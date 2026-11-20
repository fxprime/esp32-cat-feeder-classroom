import {servoState} from './model.js';

const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

// A teaching model of a geared position servo. The controller has its own
// state and drives motor acceleration, so the shaft responds to the error.
export function createServoFeedback(pulseUs=1500) {
  let target=servoState(pulseUs).angle;
  let angle=90;
  let velocity=0;
  let integral=0;
  let output=0;
  let p=0,i=0,d=0;
  let settled=true;
  function frame() {
    return {target,actual:angle,error:target-angle,velocity,output,p,i,d,settled};
  }
  return {
    command(pulse) {
      target=servoState(pulse).angle;
      integral=0;
      settled=Math.abs(target-angle)<.3 && Math.abs(velocity)<.5;
      return frame();
    },
    disturb() {
      angle=clamp(angle+(angle>90?-22:22),0,180);
      velocity=0;
      integral=0;
      settled=false;
      return frame();
    },
    step(dt) {
      const seconds=clamp(dt,0,.02);
      const error=target-angle;
      p=.035*error;
      d=-.009*velocity;
      if (Math.abs(p+d)<1) integral=clamp(integral+error*seconds,-8,8);
      i=.018*integral;
      output=clamp(p+i+d,-1,1);
      velocity+=(output*560-velocity*4.5)*seconds;
      angle=clamp(angle+velocity*seconds,0,180);
      if ((angle===0 && velocity<0)||(angle===180 && velocity>0)) velocity=0;
      settled=Math.abs(target-angle)<.3 && Math.abs(velocity)<.5;
      if (settled) {
        output=0;
        p=0;i=0;d=0;
        integral=0;
        velocity=0;
      }
      return frame();
    },
    frame,
  };
}
