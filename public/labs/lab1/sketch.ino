#include <Arduino.h>

#include <ESP32Servo.h>

constexpr int SERVO_PIN = 18;
constexpr int BUZZER_PIN = 25;
constexpr int MEAL_PIN = 19;
constexpr int BEEP_MS = 600;
constexpr int PORTION_MS = 1100;

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


// Lab 1: เปลี่ยนการกดหนึ่งครั้งให้เป็นเสียงและการเปิดฝาหนึ่งรอบ
Servo flap;
DebouncedInput mealButton(MEAL_PIN);

enum class Step { Ready, Beep, Open };
Step step = Step::Ready;
uint32_t stepAt;

void setup() {
  Serial.begin(115200);
  mealButton.begin();
  pinMode(BUZZER_PIN, OUTPUT);
  flap.setPeriodHertz(50);
  flap.attach(SERVO_PIN, 1000, 2000);
  flap.write(0);
  Serial.println("READY - press MEAL");
}

void loop() {
  const uint32_t now = millis();
  const bool pressed = mealButton.fell(now);
  if (step == Step::Ready && pressed) {
    tone(BUZZER_PIN, 1800, BEEP_MS);
    stepAt = now;
    step = Step::Beep;
    Serial.println("BEEP");
  } else if (step == Step::Beep && now - stepAt >= BEEP_MS) {
    flap.write(90);
    stepAt = now;
    step = Step::Open;
    Serial.println("FLAP OPEN");
  } else if (step == Step::Open && now - stepAt >= PORTION_MS) {
    flap.write(0);
    step = Step::Ready;
    Serial.println("FLAP CLOSED");
  }
  // พักการอ่านขา 1 ms ต่อรอบ คืนเวลาให้ตัวจำลอง · จับเวลาฝาด้วย millis()
  delay(1);
}
