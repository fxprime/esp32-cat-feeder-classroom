#include <Arduino.h>
#include <DHTesp.h>

#include <ESP32Servo.h>

constexpr int RED_LED_PIN = 23;
constexpr int SERVO_PIN = 18;
constexpr int BUZZER_PIN = 25;
constexpr int MEAL_PIN = 19;
constexpr int BEEP_MS = 600;
constexpr int PORTION_MS = 1100;
constexpr int TRIG_PIN = 26;
constexpr int ECHO_PIN = 27;
constexpr int DHT_PIN = 32;
constexpr int IR_PIN = 33;
constexpr int FULL_CM = 6;
constexpr int EMPTY_CM = 24;
constexpr int MAX_RH = 70;
constexpr int EMPTY_PERCENT = 5;
constexpr int LOW_PERCENT = 20;
constexpr int WATCH_MS = 8000;

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


// Optional teacher demo. Keep teacher-secrets.h private and off Wokwi.
#if __has_include("teacher-secrets.h")
#include "teacher-secrets.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <time.h>

QueueHandle_t alertQueue = nullptr;

bool sendAlert(const char *event) {
  WiFiClientSecure tls;
  tls.setCACert(TELEGRAM_ROOT_CA);
  tls.setTimeout(3500);

  HTTPClient request;
  request.setConnectTimeout(3500);
  request.setTimeout(3500);
  String url = String("https://api.telegram.org/bot") + TELEGRAM_TOKEN + "/sendMessage";
  if (!request.begin(tls, url)) return false;

  request.addHeader("Content-Type", "application/json");
  const char *message = "เครื่องให้อาหารแมวอ่านเซนเซอร์ไม่ได้ · งดจ่ายมื้อนี้";
  if (!strcmp(event, "BLOCK_HUMIDITY")) message = "ในถังชื้นเกินเกณฑ์ · งดจ่ายมื้อนี้";
  if (!strcmp(event, "BLOCK_EMPTY")) message = "อาหารในถังหมด · งดจ่ายมื้อนี้";
  if (!strcmp(event, "LOW_STOCK")) message = "อาหารในถังใกล้หมด";
  const String body = String("{\"chat_id\":\"") + TELEGRAM_CHAT_ID + "\",\"text\":\"" + message + "\"}";
  const int status = request.POST(body);
  request.end();
  return status == 200;
}

void telegramWorker(void *) {
  WiFi.mode(WIFI_STA);
  WiFi.begin(FEEDER_WIFI_SSID, FEEDER_WIFI_PASSWORD);
  configTime(0, 0, "time.cloudflare.com", "pool.ntp.org");
  const char *event = nullptr;
  for (;;) {
    if (xQueueReceive(alertQueue, &event, portMAX_DELAY) != pdPASS) continue;
    while (WiFi.status() != WL_CONNECTED || time(nullptr) < 1700000000) {
      vTaskDelay(pdMS_TO_TICKS(2000));
    }
    // One attempt per event. Server response may be lost after a successful send.
    Serial.println(sendAlert(event) ? "TELEGRAM_SENT" : "TELEGRAM_SEND_FAILED");
  }
}

void startTelegram() {
  alertQueue = xQueueCreate(8, sizeof(const char *));
  if (!alertQueue) return;
  if (xTaskCreate(telegramWorker, "teacher-alerts", 8192, nullptr, 1, nullptr) != pdPASS) {
    vQueueDelete(alertQueue);
    alertQueue = nullptr;
  }
}

void queueTelegramAlert(const char *event) {
  if (!alertQueue || xQueueSend(alertQueue, &event, 0) != pdPASS) {
    Serial.println("TELEGRAM_QUEUE_UNAVAILABLE");
  } else {
    Serial.println("TELEGRAM_QUEUED");
  }
}
#else
void startTelegram() {}
void queueTelegramAlert(const char *) {
  Serial.println("TELEGRAM_SIMULATED (no message sent)");
}
#endif


// Lab 3: กด MEAL หรือพิมพ์ m ทาง Serial เพื่อจำลองถึงมื้อ
// ส่ง r จะลองส่งหมายเลขมื้อเดิมซ้ำโดยไม่เปิดฝาอีกครั้ง
Servo flap;
DebouncedInput mealButton(MEAL_PIN);
DebouncedInput bowlBeam(IR_PIN);
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
  bowlBeam.begin();
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
  if (bowlBeam.fell(now) && phase != Phase::Watch) report("BOWL_BEAM_BLOCKED");
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
      if (bowlBeam.active()) {
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
}
