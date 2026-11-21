// Shared behavior for the user-supplied classroom slides.
(() => {
  document.documentElement.lang = "th";
  const embedded = new URLSearchParams(location.search).get("embed") === "1";
  if (embedded) document.documentElement.classList.add("is-embedded");
  document.addEventListener("keydown", (event) => {
    if (
      event.target.closest("input,textarea,select,[contenteditable],dialog[open]") ||
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
  const graphPause = document.getElementById("pauseGraphs");
  graphPause?.addEventListener("click", () => {
    window.esp32PauseGraphs = !window.esp32PauseGraphs;
    graphPause.textContent = window.esp32PauseGraphs ? "เล่นกราฟต่อ" : "หยุดกราฟ";
  });
})();
