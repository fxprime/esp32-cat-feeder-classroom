#include <Arduino.h>
constexpr int PIEZO_PIN = 34;

// เสริม: นับแรงกระทบเม็ดอาหารผ่านวงจรปรับสัญญาณ 0–3.3 V
// เลือก Serial Plotter 115200 เพื่อเทียบสัญญาณกับเกณฑ์ หรือ Serial Monitor ดู count
constexpr uint16_t THRESHOLD_MV = 800;
constexpr uint32_t QUIET_MS = 60;
uint32_t lastPlotAt = 0;
uint32_t lastGrainAt = 0;
uint32_t count = 0;
bool wasAbove = false;
uint16_t peakMv = 0;

void setup() {
  Serial.begin(115200);
  analogSetPinAttenuation(PIEZO_PIN, ADC_11db);
}

void loop() {
  const uint32_t now = millis();
  const uint16_t mv = analogReadMilliVolts(PIEZO_PIN);
  if (mv > peakMv) peakMv = mv;
  const bool above = mv >= THRESHOLD_MV;
  if (above && !wasAbove && (count == 0 || now - lastGrainAt >= QUIET_MS)) {
    count++;
    lastGrainAt = now;
  }
  wasAbove = above;

  if (Serial.available() && Serial.read() == 'r') count = 0;
  if (now - lastPlotAt >= 16) {
    lastPlotAt = now;
    // Show the peak held during the last plot interval so short spikes stay visible.
    Serial.printf("piezo_mV:%u\tthreshold_mV:%u\tcount:%lu\n", (unsigned)peakMv,
                  (unsigned)THRESHOLD_MV, (unsigned long)count);
    peakMv = 0;
  }
  delay(1);
}
