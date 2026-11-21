import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { labs } from "../src/content.js";

const root = fileURLToPath(new URL("../public/labs/", import.meta.url));
for (const lab of labs) {
  const parts = [
    { type: "board-esp32-devkit-c-v4", id: "esp", top: 30, left: 0, attrs: {} },
  ];
  const connections = [];
  if (lab.id !== "wifi") {
    parts.push(
      {
        type: "wokwi-led",
        id: "led",
        top: 0,
        left: 220,
        attrs: { color: "green" },
      },
      {
        type: "wokwi-resistor",
        id: "r1",
        top: 60,
        left: 160,
        rotate: 90,
        attrs: { value: "330" },
      },
    );
    connections.push(
      ["esp:23", "r1:1", "green", []],
      ["r1:2", "led:A", "green", []],
      ["led:C", "esp:GND.1", "black", []],
    );
  }
  if (lab.id === "adc-pwm") {
    parts.push({
      type: "wokwi-potentiometer",
      id: "pot",
      top: 150,
      left: 200,
      attrs: { value: "512" },
    });
    connections.push(
      ["pot:VCC", "esp:3V3", "red", []],
      ["pot:GND", "esp:GND.2", "black", []],
      ["pot:SIG", "esp:34", "blue", []],
    );
  }
  const diagram = {
    version: 1,
    author: "ESP32 Lab",
    editor: "wokwi",
    parts,
    connections,
    dependencies: {},
    serialMonitor: { display: "always", newline: "lf" },
  };
  await mkdir(`${root}/${lab.id}`, { recursive: true });
  await writeFile(`${root}/${lab.id}/sketch.ino`, lab.code);
  await writeFile(
    `${root}/${lab.id}/diagram.json`,
    JSON.stringify(diagram, null, 2) + "\n",
  );
}
console.log("Exported 3 ESP32 labs: sketch.ino + diagram.json");
