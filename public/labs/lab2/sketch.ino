#include <Arduino.h>
#include <Wire.h>

constexpr int TRIG_PIN = 26;
constexpr int ECHO_PIN = 27;
constexpr int SDA_PIN = 21;
constexpr int SCL_PIN = 22;
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


constexpr uint8_t HTU21D_ADDRESS = 0x40;
constexpr uint8_t HTU21D_MEASURE_RH = 0xF5;  // No-hold mode: release I²C during conversion.
constexpr uint32_t RH_CONVERSION_MS = 25;
constexpr uint32_t RH_PERIOD_MS = 2100;
bool humidityPending = false;
float humidity = NAN;
float distanceCm = NAN;
uint32_t lastHumidity;
uint32_t lastDistance;

void setupSensors() {
  Wire.begin(SDA_PIN, SCL_PIN, 100000);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  lastDistance = millis();
  lastHumidity = lastDistance - RH_PERIOD_MS;
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

// HTU21D sends two data bytes and CRC-8 (polynomial 0x31).
uint8_t htuCrc(uint8_t high, uint8_t low) {
  uint8_t crc = 0;
  const uint8_t bytes[] = {high, low};
  for (uint8_t byte : bytes) {
    crc ^= byte;
    for (int bit = 0; bit < 8; ++bit) {
      crc = (crc & 0x80) ? (crc << 1) ^ 0x31 : crc << 1;
    }
  }
  return crc;
}

float readHumidityResult() {
  if (Wire.requestFrom(HTU21D_ADDRESS, 3) != 3) return NAN;
  uint8_t high = Wire.read();
  uint8_t low = Wire.read();
  uint8_t crc = Wire.read();
  if (htuCrc(high, low) != crc) return NAN;
  uint16_t raw = (uint16_t(high) << 8) | (low & 0xFC);
  return constrain(-6.0f + 125.0f * raw / 65536.0f, 0.0f, 100.0f);
}

void sampleSensors(uint32_t now) {
  if (now - lastDistance >= 250) {
    lastDistance = now;
    distanceCm = readDistanceCm();
  }
  if (humidityPending && now - lastHumidity >= RH_CONVERSION_MS) {
    humidity = readHumidityResult();
    humidityPending = false;
  } else if (!humidityPending && now - lastHumidity >= RH_PERIOD_MS) {
    lastHumidity = now;
    Wire.beginTransmission(HTU21D_ADDRESS);
    Wire.write(HTU21D_MEASURE_RH);
    humidityPending = Wire.endTransmission() == 0;
    if (!humidityPending) humidity = NAN;
  }
}


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
