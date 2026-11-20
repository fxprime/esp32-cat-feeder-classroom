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
