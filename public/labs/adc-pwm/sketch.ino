// Arduino-ESP32 core 3.x + 2.x compatibility
#include <esp_arduino_version.h>
const int LED = 23;
const int POT = 34;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(LED, 5000, 8);
#else
  ledcSetup(0, 5000, 8);
  ledcAttachPin(LED, 0);
#endif
}

void loop() {
  int raw = analogRead(POT);
  int duty = map(raw, 0, 4095, 0, 255);
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcWrite(LED, duty);
#else
  ledcWrite(0, duty); // Core 2.x takes channel, not pin
#endif
  Serial.println(raw);
  delay(20);
}
