// Lab 2: ดูค่าดิบและความหมายของเซนเซอร์ใน Serial Monitor
DebouncedInput bowlPresence(IR_PIN);

void setup() {
  Serial.begin(115200);
  setupSensors();
  bowlPresence.begin();
  Serial.println("READY - first humidity reading in about 2 seconds");
}

void loop() {
  const uint32_t now = millis();
  sampleSensors(now);
  if (bowlPresence.fell(now)) Serial.println("ARRIVAL: reflective IR detected");

  static uint32_t lastPrint = 0;
  if (now - lastPrint >= 2100) {
    lastPrint = now;
    Serial.printf("RH: %.1f %% | distance: %.1f cm | food: %d%% | IR: %s\n",
      humidity, distanceCm, estimateFood(distanceCm), bowlPresence.active() ? "LOW" : "HIGH");
    if (!isfinite(humidity) || estimateFood(distanceCm) < 0) Serial.println("SENSOR_READING_INVALID");
  }
  // พักการอ่านขา 1 ms ต่อรอบ คืนเวลาให้ตัวจำลอง · จับเวลาฝาด้วย millis()
  delay(1);
}
