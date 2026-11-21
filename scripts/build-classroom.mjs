import { readFile, writeFile, mkdir } from "node:fs/promises";
import { classroomLabs } from "../src/classroom/labs.mjs";
import { FEEDER_LAB_URL } from "../src/classroom/data/lessons.js";
import { FEEDER_PINS } from "../public/scripts/feeder/model.js";
const root = new URL("../", import.meta.url);
const template = await readFile(
  new URL("scripts/templates/wokwi.html", root),
  "utf8",
);
await writeFile(
  new URL("public/slides/lesson-10.html", root),
  template
    .replace("__FEEDER_LAB_URL__", FEEDER_LAB_URL)
    .replace("__ESP32_LABS__", JSON.stringify(classroomLabs)),
);
for (const [key, lab] of Object.entries(classroomLabs)) {
  const path = new URL(`public/labs/${key}/`, root);
  await mkdir(path, { recursive: true });
  await writeFile(new URL("sketch.ino", path), lab.ino);
  await writeFile(new URL("diagram.json", path), lab.json);
  // Current Wokwi uses core 3.x; use its compatible ESP32Servo release.
  await writeFile(
    new URL("libraries.txt", path),
    lab.libraries.length ? lab.libraries.join("\n") + "\n" : "",
  );
}
const piezoPath = new URL("public/labs/piezo/", root);
await mkdir(piezoPath, { recursive: true });
const piezoSketch = await readFile(new URL("src/classroom/feeder-firmware/piezo.ino", root), "utf8");
await writeFile(new URL("sketch.ino", piezoPath),
  `#include <Arduino.h>\nconstexpr int PIEZO_PIN = ${FEEDER_PINS.piezo};\n\n${piezoSketch}`);
console.log("Prepared classroom, 3 ESP32 labs, and the optional Piezo sketch");
