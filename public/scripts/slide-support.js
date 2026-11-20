// Shared behavior for the user-supplied classroom slides.
(() => {
  document.documentElement.lang = "th";
  const embedded = new URLSearchParams(location.search).get("embed") === "1";
  if (embedded) document.documentElement.classList.add("is-embedded");
  document.addEventListener("keydown", (event) => {
    if (
      event.target.closest("input,textarea,select,[contenteditable]") ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    )
      return;
    if (
      ["ArrowLeft", "ArrowRight", "f", "F"].includes(event.key) &&
      embedded &&
      parent !== window
    ) {
      event.preventDefault();
      parent.postMessage(
        { type: "SLIDE_NAV_KEY", key: event.key },
        location.origin,
      );
    }
  });
  document.querySelectorAll('input[type="range"]').forEach((input) => {
    if (
      !input.hasAttribute("aria-label") &&
      !document.querySelector(`label[for="${input.id}"]`)
    ) {
      input.setAttribute(
        "aria-label",
        { analogSlider: "ค่า ADC 0 ถึง 4095", pwmSlider: "PWM duty cycle" }[
          input.id
        ] || "ปรับค่าการทดลอง",
      );
    }
  });
  // Graph sampling should be pausable even when reduced motion is not enabled.
  if (document.querySelector("#digitalWaveLine")) {
    const button = document.createElement("button");
    button.id = "pauseGraphs";
    button.type = "button";
    button.className =
      "fixed bottom-3 right-3 z-40 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow";
    button.textContent = "หยุดกราฟ";
    button.addEventListener("click", () => {
      window.esp32PauseGraphs = !window.esp32PauseGraphs;
      button.textContent = window.esp32PauseGraphs ? "เล่นกราฟต่อ" : "หยุดกราฟ";
    });
    document.body.appendChild(button);
  }
})();
