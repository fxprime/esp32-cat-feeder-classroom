export async function createDriveController(factory, bytes, kind, inputs) {
  let clock=0;
  let sleep=null;
  let stepBoundary=null;
  // The main sketch can suspend inside Asyncify while the independent motor task runs.
  const [module, motors]=await Promise.all([
    factory({
      wasmBinary:bytes,
      clock:()=>clock,
      turnMs:inputs.turnMs,
      sensor:sensor=>Number(inputs.sensor(sensor,clock)),
      motor:(command,value)=>inputs.motor(command,clock,value),
      trace:line=>inputs.trace('loop',line,clock),
      sleep:duration=>new Promise(resolve=>{
        sleep={until:clock+duration,duration,resolve};
        stepBoundary.resolve();
      }),
    }),
    factory({
      wasmBinary:bytes,
      telemetry:inputs.telemetry,
      pwm:(pin,duty)=>Number(inputs.pwm(pin,duty)),
      trace:line=>inputs.trace('motor',line,clock),
    }),
  ]);
  module._setupController(kind==='delay' ? 0 : 1);

  function stepLoop(time) {
    if (sleep && time<sleep.until) return;
    return new Promise((resolve,reject)=>{
      stepBoundary={resolve,reject};
      if (sleep) {
        const wake=sleep.resolve;
        sleep=null;
        wake();
      } else {
        Promise.resolve(module.ccall('stepController',null,[],[],{async:true})).then(
          ()=>stepBoundary.resolve(),
          error=>stepBoundary.reject(error),
        );
      }
    });
  }

  return {
    get waitingUntil() { return sleep?.until ?? null; },
    get waitDuration() { return sleep?.duration ?? null; },
    async advance(time,runLoop=true) {
      clock=time;
      if (runLoop) await stepLoop(time);
      motors._stepMotors();
    },
  };
}

let firmware;

export function loadDriveFirmware() {
  firmware ??= Promise.all([
    import('./drive-firmware.mjs'),
    fetch(new URL('drive-firmware.wasm',import.meta.url)).then(response=>{
      if (!response.ok) throw new Error(`Firmware download failed (${response.status})`);
      return response.arrayBuffer();
    }),
  ]).then(([module,bytes])=>[module.default,bytes]).catch(error=>{
    firmware=null;
    throw error;
  });
  return firmware;
}

export async function loadDriveControllers() {
  const [factory,bytes]=await loadDriveFirmware();
  return (kind,inputs)=>createDriveController(factory,bytes,kind,inputs);
}
