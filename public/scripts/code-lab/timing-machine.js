import {functionLessons,functionProgram} from './function-lessons.js';
import {serialProgram} from './serial-lesson.js';
import {timingProgram,timingSampleStep} from './timing-lessons.js';
import {loadDriveFirmware} from './drive-controller.js';
import {createLessonState} from './model.js';

const historyLimit = 400;
export class TimingMachine {
  constructor(id, load=loadDriveFirmware) {
    const functionLesson = functionLessons.find(lesson=>lesson.id===id);
    this.program = functionLesson ? functionProgram(id) : id==='serial' ? serialProgram() : timingProgram(id);
    this.mode = functionLesson?.mode ?? (id==='serial' ? 2 : id==='timing-delay' ? 0 : 1);
    this.usesSerial = id==='serial';
    this.functionLesson = !!functionLesson;
    this.load = load;
    this.live = createLessonState();
    if (this.usesSerial) Object.assign(this.live,{serialText:'',serialChunk:''});
    this.history = [structuredClone(this.live)];
    this.cursor = 0;
  }

  get state() { return this.history[this.cursor]; }
  get canRewind() { return this.cursor>0; }
  snapshot() { return this.state; }
  rewind() {
    if (this.canRewind) this.cursor--;
    return this.state;
  }

  publish() {
    this.history.push(structuredClone(this.live));
    if (this.history.length>historyLimit) this.history.shift();
    this.cursor = this.history.length-1;
    return this.state;
  }

  async prepareModule() {
    const [factory,bytes] = await this.load();
    const live = this.live;
    return factory({
      wasmBinary:bytes,
      timingClock:() => live.time,
      timingOutput:pin => { live.pins[pin] = 'OUTPUT'; },
      timingWrite:(pin,high) => { live.leds[pin] = high ? 255 : 0; },
      timingSerial:value => {
        live.log.push(String(value));
        if (live.log.length>6) live.log.shift();
      },
      serialWrite:text => {
        live.serialChunk = text.replace(/\r\n/g,'\n');
        live.serialText = (live.serialText+live.serialChunk).slice(-2048);
      },
      timingCall:line => this.checkpoint(line,undefined,0,true),
      timingTextNumber:(line,text,number) => this.checkpoint(line,text,0,false,number),
      timingStatement:(line,value) => this.checkpoint(line,value),
      timingDelay:(line,wait) => this.checkpoint(line,0,wait),
    });
  }

  checkpoint(index, value, wait=0, calling=false, extra) {
    const {id,explain,variable,flow} = this.program.lines[index];
    const live = this.live;
    live.line = id;
    live.wait = wait;
    live.message = calling ? flow.call.label : explain;
    const effect = calling ? flow?.call : flow?.effect;
    if (effect) live.effect = effect;
    else delete live.effect;
    if (flow?.enter) {
      live.stack = ['loop()',`${flow.enter}()`];
      for (const [name,reference] of Object.entries(flow.references??{})) live.vars[name].reference = reference;
      if(flow.extra)live.vars[flow.extra.name]={value:extra,scope:flow.extra.scope};
    }
    if (flow?.clear && !calling) {
      live.stack = ['loop()'];
      for (const name of flow.clear) delete live.vars[name];
      for (const value of Object.values(live.vars)) delete value.reference;
    }
    if (variable && !calling) {
      const stored = variable.boolean || variable.type==='bool' ? String(Boolean(value))
        : variable.type==='float' ? Number(value.toFixed(3)) : value;
      live.vars[variable.name] = {...live.vars[variable.name],value:stored,scope:variable.scope};
    }
    switch (id) {
      case 'setup-open': live.setupCount++; live.stack = ['setup()']; break;
      case 'loop-open':
        // Sample the virtual ESP32 clock between rounds for the step-by-step view.
        if (this.mode===1 && live.loopCount>0) live.time += timingSampleStep;
        live.loopCount++;
        live.stack = ['loop()'];
        break;
      case 'setup-close': live.stack = []; break;
      case 'loop-close':
        live.stack = [];
        delete live.vars.now;
        delete live.vars.elapsed;
        if (this.usesSerial || this.functionLesson) {
          for (const [name,variable] of Object.entries(live.vars)) {
            if (!variable.scope.startsWith('global')) delete live.vars[name];
          }
        }
        break;
      case 'wait-on':
        if (this.functionLesson) break;
        live.message = this.usesSerial ? `ค้างที่ delay(${wait}) ก่อนพิมพ์ข้อมูลชุดถัดไป`
          : `ค้างที่ delay(${wait}) งานใน loop() และไฟ LED ยังอยู่ที่เดิม`;
        break;
      case 'timing-if': live.message = value ? 'ครบ 1,000 ms แล้ว เข้า if เพื่อสลับไฟ' : 'ยังไม่ถึง 1,000 ms ข้าม if แล้วเริ่ม loop() รอบใหม่'; break;
    }
    return new Promise(resolve => {
      this.wake = resolve;
      this.boundary.resolve(this.publish());
    });
  }

  async step() {
    if (this.cursor<this.history.length-1) return this.history[++this.cursor];
    if (this.live.wait) {
      const wait = this.live.wait;
      this.live.time += wait;
      this.live.wait = 0;
      this.live.message = `ครบเวลารอ ${wait} ms แล้ว พร้อมเดินไปบรรทัดถัดไป`;
      return this.publish();
    }
    this.module ??= await this.prepareModule();
    return new Promise((resolve,reject) => {
      this.boundary = {resolve,reject};
      if (this.wake) {
        const wake = this.wake;
        this.wake = null;
        wake();
      } else {
        const run = this.module.ccall('runTimingLesson',null,['number'],[this.mode],{async:true});
        Promise.resolve(run).catch(error => this.boundary.reject(error));
      }
    });
  }
}
