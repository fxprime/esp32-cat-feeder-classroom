#include <WiFi.h>
#include <HTTPClient.h>

void setup() {
  Serial.begin(115200);
  // Wokwi only. For hardware, replace with your 2.4 GHz network.
  WiFi.begin("Wokwi-GUEST", "", 6);
  unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 15000) {
    delay(250);
    Serial.print(".");
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi timeout. Reset to retry.");
    return;
  }
  Serial.print("Connected: ");
  Serial.println(WiFi.localIP());
  HTTPClient http;
  // Public demo endpoint: no secrets or personal data.
  http.begin("http://httpbin.org/get?device=esp32&lesson=3");
  http.setTimeout(5000);
  int status = http.GET();
  Serial.printf("HTTP status: %d\n", status);
  if (status > 0) Serial.println(http.getString());
  else Serial.println("Request failed. Check network or endpoint.");
  http.end();
}

void loop() {
  delay(1000);
}
