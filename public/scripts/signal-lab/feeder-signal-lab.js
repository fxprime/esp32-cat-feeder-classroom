const ir = document.querySelector("[data-feeder-ir]");
const irToggle = document.querySelector("#feeder-ir-toggle");
const irValue = document.querySelector("#feeder-ir-value");
const irWave = document.querySelector("#feeder-ir-wave");
irToggle.addEventListener("click", () => {
  const detected = irToggle.getAttribute("aria-pressed") !== "true";
  ir.dataset.irDetected = String(detected);
  irToggle.setAttribute("aria-pressed", String(detected));
  irValue.textContent = detected ? "0 / LOW · ตรวจพบจากแสงสะท้อน" : "1 / HIGH · ยังตรวจไม่พบ";
  irToggle.textContent = detected ? "ให้แมวถอยออก" : "แมวเข้ามาในระยะ";
  irWave.setAttribute("d", detected ? "M29 16H146V66H285" : "M29 66H146V16H285");
});

const piezo = document.querySelector("[data-feeder-piezo]");
const limit = document.querySelector("#feeder-piezo-limit");
const limitValue = document.querySelector("#feeder-piezo-limit-value");
const limitLine = document.querySelector("#feeder-piezo-threshold");
const wave = document.querySelector("#feeder-piezo-wave");
const output = document.querySelector("#feeder-piezo-result");
const toY = volts => 66 - 51 * volts / 3.3;
let strength = 0;

function renderStrike() {
  const threshold = Number(limit.value);
  limitValue.textContent = `${threshold.toFixed(1)} V`;
  limitLine.setAttribute("d", `M36 ${toY(threshold)}H285`);
  if (!strength) return;

  const voltages = Array.from({ length: 161 }, (_, index) => {
    const ms = index * .25 - 5;
    if (ms < 0) return 1.65;
    const swing = strength * Math.exp(-ms / 9) * Math.sin(ms * 1.7);
    return Math.min(3.3, Math.max(0, 1.65 + swing));
  });
  wave.setAttribute("d", voltages.map((volts, index) =>
    `${index === 0 ? "M" : "L"}${(36 + 249 * index / 160).toFixed(1)} ${toY(volts).toFixed(1)}`
  ).join(" "));
  const peak = Math.max(...voltages);
  output.textContent = `ยอดคลื่น ${peak.toFixed(2)} V · ${peak >= threshold ? "ข้ามเกณฑ์ นับการเคาะครั้งนี้ได้" : "ต่ำกว่าเกณฑ์ ยังไม่นับการเคาะครั้งนี้"}`;
}

const pellet = piezo.querySelector(".feeder-piezo-pellet");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let animation;
for (const button of piezo.querySelectorAll("[data-piezo-strike]")) {
  button.addEventListener("click", () => {
    strength = button.dataset.piezoStrike === "hard" ? 1.55 : .57;
    renderStrike();
    animation?.cancel();
    if (!reduced.matches) {
      animation = pellet.animate([{ transform: "translate(0, 0)" }, { transform: "translate(54px, 41px)" }], { duration: 260, easing: "ease-in" });
    }
  });
}
limit.addEventListener("input", renderStrike);
renderStrike();
