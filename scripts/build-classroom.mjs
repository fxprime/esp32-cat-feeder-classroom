import { readFile, writeFile, mkdir } from "node:fs/promises";
import { classroomLabs } from "../src/classroom/labs.mjs";
const root = new URL("../", import.meta.url);
const template = await readFile(
  new URL("scripts/templates/wokwi.html", root),
  "utf8",
);
await writeFile(
  new URL("public/slides/lesson-10.html", root),
  template.replace("__ESP32_LABS__", JSON.stringify(classroomLabs)),
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
console.log("Prepared source-derived classroom and 3 ESP32 labs");
