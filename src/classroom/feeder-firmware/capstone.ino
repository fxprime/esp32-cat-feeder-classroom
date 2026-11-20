// Lab 3: กด MEAL หรือพิมพ์ m ทาง Serial เพื่อจำลองถึงมื้อ
// ส่ง r จะลองส่งหมายเลขมื้อเดิมซ้ำโดยไม่เปิดฝาอีกครั้ง
Servo flap;
DebouncedInput mealButton(MEAL_PIN);
DebouncedInput bowlPresence(IR_PIN);
enum class Phase { Idle, Beep, Dispense, Watch, Blocked };
Phase phase = Phase::Idle;
uint32_t phaseAt = 0;
uint32_t lastMealId = 0;

void report(const char *event, bool notify = false) {
  Serial.printf("MEAL %lu | %s\n", (unsigned long)lastMealId, event);
  if (notify) queueTelegramAlert(event);
}

void blockMeal(const char *reason) {
  flap.write(0);
  noTone(BUZZER_PIN);
  digitalWrite(RED_LED_PIN, HIGH);
  phase = Phase::Blocked;
  report(reason, true);
}

const char *checkFoodAndHumidity() {
  const int percent = estimateFood(distanceCm);
  if (!isfinite(humidity) || humidity < 0 || humidity > 100 || percent < 0) {
    return "BLOCK_SENSOR_READ";
  }
  if (humidity >= MAX_RH) return "BLOCK_HUMIDITY";
  if (percent <= EMPTY_PERCENT) return "BLOCK_EMPTY";
  return nullptr;
}

void requestMeal(uint32_t id, uint32_t now) {
  if (id == 0 || id <= lastMealId) {
    report("DUPLICATE_IGNORED");
    return;
  }
  if (phase == Phase::Beep || phase == Phase::Dispense) {
    report("BUSY_IGNORED");
    return;
  }
  lastMealId = id;
  Serial.printf("CHECK | RH %.1f%% | food %d%%\n", humidity, estimateFood(distanceCm));
  if (const char *reason = checkFoodAndHumidity()) {
    blockMeal(reason);
    return;
  }
  digitalWrite(RED_LED_PIN, LOW);
  if (estimateFood(distanceCm) <= LOW_PERCENT) report("LOW_STOCK", true);
  tone(BUZZER_PIN, 1800, BEEP_MS);
  phase = Phase::Beep;
  phaseAt = now;
  report("BEEP");
}

void setup() {
  Serial.begin(115200);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  mealButton.begin();
  bowlPresence.begin();
  setupSensors();
  flap.setPeriodHertz(50);
  flap.attach(SERVO_PIN, 1000, 2000);
  flap.write(0);
  startTelegram();
  Serial.println("READY - wait 2.1 seconds for DHT22; MEAL or m, duplicate test r");
}

void loop() {
  const uint32_t now = millis();
  sampleSensors(now);
  if (bowlPresence.fell(now) && phase != Phase::Watch) report("BOWL_IR_DETECTED");
  const int command = Serial.available() ? Serial.read() : -1;
  const bool pressed = mealButton.fell(now);
  if (pressed || command == 'm') requestMeal(lastMealId + 1, now);
  if (command == 'r') requestMeal(lastMealId, now);

  switch (phase) {
    case Phase::Beep:
      if (now - phaseAt >= BEEP_MS) {
        if (const char *reason = checkFoodAndHumidity()) {
          blockMeal(reason);
          break;
        }
        flap.write(90);
        phase = Phase::Dispense;
        phaseAt = now;
        report("FLAP_OPEN");
      }
      break;
    case Phase::Dispense:
      if (now - phaseAt >= PORTION_MS) {
        flap.write(0);
        phase = Phase::Watch;
        phaseAt = now;
        report("DISPENSED");
      }
      break;
    case Phase::Watch:
      if (bowlPresence.active()) {
        report("CAT_AT_BOWL");
        phase = Phase::Idle;
      } else if (now - phaseAt >= WATCH_MS) {
        report("NO_ARRIVAL");
        phase = Phase::Idle;
      }
      break;
    default:
      break;
  }
  // พักการอ่านขา 1 ms ต่อรอบ คืนเวลาให้ตัวจำลอง · จับเวลาฝาด้วย millis()
  delay(1);
}
