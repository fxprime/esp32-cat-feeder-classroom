#include <Arduino.h>
#include <DHTesp.h>

constexpr int TRIG_PIN = 26;
constexpr int ECHO_PIN = 27;
constexpr int DHT_PIN = 32;
constexpr int IR_PIN = 33;
constexpr int FULL_CM = 6;
constexpr int EMPTY_CM = 24;

class DebouncedInput {
  uint8_t pin;
  bool raw = HIGH;
  bool stable = HIGH;
  uint32_t changedAt = 0;
public:
  explicit DebouncedInput(uint8_t pinNumber) : pin(pinNumber) {}
  void begin() {
    pinMode(pin, INPUT_PULLUP);
    raw = stable = digitalRead(pin);
    changedAt = millis();
  }
  bool fell(uint32_t now) {
    const bool reading = digitalRead(pin);
    if (reading != raw) {
      raw = reading;
      changedAt = now;
    }
    if (stable == raw || now - changedAt < 30) return false;
    stable = raw;
    return stable == LOW;
  }
  bool active() const { return stable == LOW; }
};


DHTesp dht;
float humidity = NAN;
float distanceCm = NAN;
uint32_t lastHumidity;
uint32_t lastDistance;

void setupSensors() {
  dht.setup(DHT_PIN, DHTesp::DHT22);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  lastHumidity = lastDistance = millis();
}

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  // Only long enough for a hopper this small. A missing echo returns 0.
  const uint32_t echo = pulseIn(ECHO_PIN, HIGH, 6000);
  return echo ? echo / 58.0f : NAN;
}

int estimateFood(float cm) {
  if (!isfinite(cm) || cm < 2 || cm > 60) return -1;
  const float fraction = (EMPTY_CM - cm) / (EMPTY_CM - FULL_CM);
  return lroundf(constrain(fraction, 0.0f, 1.0f) * 100);
}

void sampleSensors(uint32_t now) {
  if (now - lastDistance >= 250) {
    lastDistance = now;
    distanceCm = readDistanceCm();
  }
  if (now - lastHumidity >= 2100) {
    lastHumidity = now;
    humidity = dht.getHumidity();
    if (dht.getStatus() != DHTesp::ERROR_NONE) humidity = NAN;
  }
}


// Lab 2: ดูค่าดิบและความหมายของเซนเซอร์ใน Serial Monitor
DebouncedInput bowlBeam(IR_PIN);

void setup() {
  Serial.begin(115200);
  setupSensors();
  bowlBeam.begin();
  Serial.println("READY - first humidity reading in about 2 seconds");
}

void loop() {
  const uint32_t now = millis();
  sampleSensors(now);
  if (bowlBeam.fell(now)) Serial.println("ARRIVAL: beam blocked");

  static uint32_t lastPrint = 0;
  if (now - lastPrint >= 2100) {
    lastPrint = now;
    Serial.printf("RH: %.1f %% | distance: %.1f cm | food: %d%% | IR: %s\n",
      humidity, distanceCm, estimateFood(distanceCm), bowlBeam.active() ? "LOW" : "HIGH");
    if (!isfinite(humidity) || estimateFood(distanceCm) < 0) Serial.println("SENSOR_READING_INVALID");
  }
}
