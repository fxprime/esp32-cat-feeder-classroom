import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chmodSync, mkdtempSync, readFileSync, writeFileSync, copyFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {functionProgram} from '../public/scripts/code-lab/function-lessons.js';
import {serialProgram} from '../public/scripts/code-lab/serial-lesson.js';
import {instrumentSketch,timingProgram} from '../public/scripts/code-lab/timing-lessons.js';
import {instrumentedDriveCode} from '../public/scripts/code-lab/drive-code.js';

const template = readFileSync(new URL('./drive-firmware.cpp', import.meta.url), 'utf8');
const sketches = [
  ['timing_blocking',timingProgram('timing-delay')],
  ['timing_polling',timingProgram('timing-millis')],
  ['serial_monitor',serialProgram()],
  ['function_return',functionProgram('function-return')],
  ['function_reference',functionProgram('function-reference')],
  ['function_void',functionProgram('function-void')],
];
const timing = sketches.map(([scope,program]) =>
  `namespace ${scope} {\nusing namespace timing_io;\n${instrumentSketch(program)}\n}`,
).join('\n');
const source = template.replace('// TIMING_SKETCHES',timing).replace('// SKETCHES', `namespace blocking {\n${instrumentedDriveCode.delay}\n}\nnamespace polling {\n${instrumentedDriveCode.millis}\n}\nnamespace steering {\n${instrumentedDriveCode.motor}\n}`);
const sourceHash = createHash('sha256').update(source).digest('hex');
const output = new URL('../public/scripts/code-lab/drive-firmware.mjs', import.meta.url);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const temporary = mkdtempSync(join(tmpdir(), 'esp32-drive-build-'));
  try {
    const cpp = join(temporary,'sketch.cpp');
    const glue = join(temporary,'drive-firmware.mjs');
    writeFileSync(cpp,source);
    execFileSync(process.env.EMXX || 'em++', [cpp,'-Oz','-flto','-Wall','-Werror','--no-entry','-sEXPORT_ES6',
      '-sENVIRONMENT=web,node','-sASYNCIFY','-sFILESYSTEM=0','-sINITIAL_MEMORY=1MB','-sEXPORTED_RUNTIME_METHODS=ccall','-o',glue], {stdio:'inherit'});
    writeFileSync(output,`// source-sha256: ${sourceHash}\n${readFileSync(glue,'utf8').replace(/^[ \t]+$/gm,'')}`);
    const wasm = new URL('./drive-firmware.wasm',output);
    copyFileSync(join(temporary,'drive-firmware.wasm'),wasm);
    chmodSync(wasm,0o644);
  } finally {
    rmSync(temporary,{recursive:true,force:true});
  }
}

export function checkDriveFirmwareSource() {
  const header = readFileSync(output,'utf8').split('\n',1)[0];
  if (header !== `// source-sha256: ${sourceHash}`) throw new Error('Run node scripts/build-drive-firmware.mjs to rebuild the displayed C++ sketches.');
}
