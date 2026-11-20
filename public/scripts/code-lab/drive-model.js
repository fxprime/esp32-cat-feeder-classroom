export const driveTrack = {radius:11, straight:24, laneWidth:2.2, start:3.8, lanes:4};
const {radius,straight,laneWidth,start,lanes}=driveTrack;
const arc=Math.PI*radius;
export const lapLength=2*(straight+arc);
const marks=[straight,straight+arc,2*straight+arc,lapLength];
export const driveKinds=['delay','millis'];
const startingLane={delay:0,millis:2};
const motorModes={follow:0,curve:1,right:2,left:3};

export const driveCourse = {
  step:10,
  pollEvery:20,
  boxHalf:.5,
  dropHeight:1.45,
  dropAhead:8.25,
  gravity:9.81,
  nose:1.18,
  lookAhead:6.6,
  brakeRate:15,
  acceleration:15,
  maxWheelSpeed:9,
  cruiseSpeed:5.4,
  turnDuration:5500,
  minTurnDuration:1000,
  maxTurnDuration:6200,
  dodgeRightMs:600,
  dodgeLeftMs:1200,
  dodgeRate:1.45,
  axleWidth:1.1,
};

export function laneOffset(lane) {
  return (lane-(lanes-1)/2)*laneWidth;
}

const wrap = station=>((station%lapLength)+lapLength)%lapLength;
const nearestStation=(from,to)=>from+wrap(to-from+lapLength/2)-lapLength/2;

function section(station) {
  const s=wrap(station);
  const index=marks.findIndex(mark=>mark>s);
  return {s,index,until:marks[index]-s};
}

export function trackPoint(station, offset=0) {
  const {s,index}=section(station);
  const r=radius+offset;
  const half=straight/2;
  if (index===0) return {x:r,z:s-half,yaw:0};
  if (index===2) return {x:-r,z:half-(s-straight-arc),yaw:-Math.PI};
  const first=index===1;
  const turn=(s-(first?straight:2*straight+arc))/radius;
  const sign=first?1:-1;
  return {x:sign*r*Math.cos(turn),z:sign*(half+r*Math.sin(turn)),yaw:-(first?0:Math.PI)-turn};
}

function scaleAround(index, offset) {
  return index%2 ? (radius+offset)/radius : 1;
}

export function advanceStation(from, meters, offset) {
  let station=from;
  let remaining=meters;
  while (remaining>1e-7) {
    const {index,until}=section(station+1e-8);
    const scale=scaleAround(index,offset);
    const part=Math.min(remaining,until*scale);
    station+=part/scale;
    remaining-=part;
  }
  return station;
}

function gapTo(from, to, offset) {
  if (to<from) return -gapTo(to,from,offset);
  let station=from, meters=0;
  while (to-station>1e-7) {
    const {index,until}=section(station+1e-8);
    const part=Math.min(to-station,until);
    meters+=part*scaleAround(index,offset);
    station+=part;
  }
  return meters;
}

function createCar(kind) {
  const lane=startingLane[kind];
  return {station:start,lane,offset:laneOffset(lane),speed:0,motor:'idle',dodgePhase:0,
    curveStartedAt:null,curveDuration:0,lastTurnMarker:null,offTrack:false,
    laneChanges:0,lastDodgeAt:null,boxes:[],detectedAt:null,lastReadAt:null,brakedAt:null,hitAt:null,
    headingError:0,leftPwm:0,rightPwm:0,leftSpeed:0,rightSpeed:0,
    hitWhileWaiting:false,traceLine:null,lineVisits:new Map(),motorLine:null,motorVisits:new Map()};
}

export function heightAt(box,time) {
  const seconds=Math.max(0,(time-box.releasedAt)/1000);
  return Math.max(0,driveCourse.dropHeight-driveCourse.gravity*seconds**2/2);
}

export function carPose(car) {
  const pose=trackPoint(car.station,car.offset);
  return {...pose,yaw:pose.yaw+car.headingError};
}

export function dropTarget(car) {
  const lane=Math.max(0,Math.min(lanes-1,Math.round(car.offset/laneWidth+(lanes-1)/2)));
  const offset=laneOffset(lane);
  return {station:advanceStation(car.station,driveCourse.dropAhead,offset),lane,offset};
}

export function initialDriveFrame() {
  return {time:0,lastDrop:null,drops:0,
    delay:{...createCar('delay'),mode:'idle',lap:1},millis:{...createCar('millis'),mode:'idle',lap:1}};
}

function motorTelemetry(car,signal) {
  switch (signal) {
    case 'requestedSpeed': return car.hitAt===null && !car.offTrack && car.motor!=='brake' && car.motor!=='idle' ? driveCourse.cruiseSpeed : 0;
    case 'motorMode': return motorModes[car.motor] ?? motorModes.follow;
    case 'laneRadius': return radius+laneOffset(car.lane);
    case 'wheelSpeed': return car.speed;
    case 'laneError': return laneOffset(car.lane)-car.offset;
    case 'headingError': return car.headingError;
    case 'trackCurvature': return section(car.station).index%2 ? -1/(radius+car.offset) : 0;
    default: throw new Error(`Unknown motor signal: ${signal}`);
  }
}

const wrapAngle=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));

export async function createDriveRace(instantiate,turnMs=()=>driveCourse.turnDuration) {
  const cars=Object.fromEntries(driveKinds.map(kind=>[kind,createCar(kind)]));
  const controllers={};
  const {step,pollEvery,boxHalf,nose,brakeRate,acceleration,lookAhead,maxWheelSpeed,axleWidth}=driveCourse;
  let time=0, lastDrop=null, drops=0;

  function takeTurnMarker(car) {
    const {s,index}=section(car.station);
    if (index%2===0 || s-marks[index-1]>.4) return false;
    const marker=Math.floor(car.station/lapLength)*2+(index-1)/2;
    if (marker===car.lastTurnMarker) return false;
    car.lastTurnMarker=marker;
    return true;
  }

  function readSensor(kind, sensor, at) {
    const car=cars[kind];
    if (sensor==='turn') return takeTurnMarker(car);
    const ahead=sensor==='ahead';
    if (ahead) car.lastReadAt=at;
    const testOffset=ahead ? car.offset : laneOffset(car.lane+1);
    const found=car.boxes.some(box=>{
      if (Math.abs(box.offset-testOffset)>=1.15) return false;
      const aligned=nearestStation(car.station,box.station);
      if (Math.abs(aligned-car.station)>10) return false;
      const gap=gapTo(car.station,aligned,testOffset);
      // The front sensor reads once the box descends into its field. The side check
      // also reserves space for crates currently falling into the target lane.
      if (ahead) return heightAt(box,time)<=.82 && gap>=0 && gap-nose-boxHalf<=lookAhead;
      return gap>=-2 && gap<=8;
    });
    if (ahead && found && car.detectedAt===null) car.detectedAt=at;
    return ahead ? found : !found;
  }

  function applyMotor(kind,command,at,value) {
    const car=cars[kind];
    if (car.hitAt!==null || car.offTrack) return;
    if (command==='brake' && car.motor!=='brake') car.brakedAt=at;
    if (command==='curve' && value!==undefined) {
      car.curveStartedAt=at;
      car.curveDuration=value;
    }
    car.dodgePhase=command==='right' ? value : command==='left' ? 2 : 0;
    if (car.dodgePhase===1) {
      car.laneChanges+=1;
      car.lastDodgeAt=at;
    }
    car.motor=command;
  }

  for (const kind of driveKinds) {
    const car=cars[kind];
    controllers[kind]=await instantiate(kind,{
      turnMs,
      sensor:(sensor,at)=>readSensor(kind,sensor,at),
      motor:(command,at,value)=>applyMotor(kind,command,at,value),
      telemetry:signal=>motorTelemetry(car,signal),
      pwm:(pin,duty)=>{
        if (pin===25) car.leftPwm=duty;
        else if (pin===26) car.rightPwm=duty;
        else return false;
        return true;
      },
      trace:(task,line,at)=>{
        if (task==='motor') {
          car.motorLine=line;
          car.motorVisits.set(line,at);
        } else {
          car.traceLine=line;
          car.lineVisits.set(line,at);
        }
      },
    });
    await controllers[kind].advance(0);
  }

  function move(kind) {
    const car=cars[kind];
    if (car.hitAt!==null || car.offTrack) return;
    const dt=step/1000;
    const wheel=(speed,duty)=>{
      const target=duty*maxWheelSpeed/255;
      const rate=duty===0 ? brakeRate : acceleration;
      return speed+Math.max(-rate*dt,Math.min(rate*dt,target-speed));
    };
    car.leftSpeed=wheel(car.leftSpeed,car.leftPwm);
    car.rightSpeed=wheel(car.rightSpeed,car.rightPwm);
    const speed=(car.leftSpeed+car.rightSpeed)/2;
    const rotation=(car.leftSpeed-car.rightSpeed)/axleWidth*dt;
    const travelled=(car.speed+speed)*dt/2;
    const before=car.station;
    const yawBefore=trackPoint(before).yaw;
    car.station=advanceStation(before,Math.max(0,travelled*Math.cos(car.headingError+rotation/2)),car.offset);
    const turnOfTrack=wrapAngle(trackPoint(car.station).yaw-yawBefore);
    const deltaHeading=rotation-turnOfTrack;
    car.offset+=travelled*Math.sin(car.headingError+deltaHeading/2);
    car.headingError=wrapAngle(car.headingError+deltaHeading);
    car.speed=speed;
    for (const box of car.boxes) {
      if (Math.abs(box.offset-car.offset)>=1.2 || heightAt(box,time)>1.02) continue;
      const aligned=nearestStation(before,box.station);
      if (Math.abs(aligned-before)>4) continue;
      if (gapTo(car.station,aligned,car.offset)<=nose+boxHalf && gapTo(before,aligned,car.offset)>=-nose-boxHalf) {
        car.hitAt=time;
        car.hitWhileWaiting=controllers[kind].waitingUntil>time;
        car.speed=0;
        car.leftSpeed=0;
        car.rightSpeed=0;
        car.dodgePhase=0;
        box.hitAt=time;
        return;
      }
    }
    if (Math.abs(car.offset)>lanes*laneWidth/2+1) {
      car.offTrack=true;
      car.speed=0;
      car.leftSpeed=0;
      car.rightSpeed=0;
    }
  }

  function carView(kind) {
    const car=cars[kind];
    const mode=car.hitAt!==null ? 'collision'
      : car.offTrack ? 'off-track' : car.dodgePhase ? 'dodging' : car.motor==='curve' ? 'turning'
      : car.motor==='brake' ? (car.speed>0?'braking':'stopped') : 'driving';
    const lap=Math.floor((car.station-start)/lapLength)+1;
    return {...car,mode,lap,waitingUntil:controllers[kind].waitingUntil,waitDuration:controllers[kind].waitDuration};
  }

  return {
    get time() { return time; },
    drop() {
      lastDrop=time;
      drops+=1;
      for (const kind of driveKinds) {
        const car=cars[kind];
        car.boxes.push({...dropTarget(car),releasedAt:time,hitAt:null});
      }
    },
    async advanceTo(target) {
      while (time+step<=target) {
        time+=step;
        for (const kind of driveKinds) move(kind);
        if (time%pollEvery===0) {
          for (const kind of driveKinds) {
            const car=cars[kind];
            await controllers[kind].advance(time,car.hitAt===null && !car.offTrack);
          }
        }
      }
    },
    frame() {
      return {time,lastDrop,drops,delay:carView('delay'),millis:carView('millis')};
    },
  };
}
