// ============================================================
//  SMART MINING HELMET (ESP32) 
//  ✔ 1 second live updates to /live/W-01
//  ✔ Keep ONLY last 100 telemetry records (auto delete oldest)
//  ✔ Optional telemetry push every 15 sec
// ============================================================

// ================= WiFi =================
#define WIFI_SSID        "SLT-4G_THARINDA"
#define WIFI_PASSWORD    "Kumuditha@123"

// ================= Firebase =================
#define FIREBASE_API_KEY "AIzaSyCSt1mxgNcs8WciD_imKP3jKKqg8YoWgWI"
#define FIREBASE_DATABASE_URL "https://iot-based-mining-helmet-default-rtdb.asia-southeast1.firebasedatabase.app"

// Firebase Auth user
#define FIREBASE_USER_EMAIL    "helmet@mining.local"
#define FIREBASE_USER_PASSWORD "helmet2025"

// Worker info
#define WORKER_ID   "W-01"
#define WORKER_NAME "Helmet Unit 01"

// ================= Rates =================
#define LIVE_UPDATE_MS     1000UL     // ✔ 1 second live updates
#define TELEMETRY_EVERY_MS 15000UL    // ✔ optional history every 15 sec
#define SOS_COOLDOWN_MS    15000UL

// ============================================================
//  INCLUDES
// ============================================================
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>
#include <string.h>
#include <WiFi.h>
#include <time.h>
#include <Firebase_ESP_Client.h>

#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ============================================================
//  PIN DEFINITIONS
// ============================================================
#define SDA_PIN       21
#define SCL_PIN       22
#define DHTPIN        27
#define DHTTYPE       DHT11
#define MQ135_PIN     34
#define BUZZER_PIN    25
#define STOP_BUTTON   26

// ============================================================
//  LCD (20x4)
// ============================================================
LiquidCrystal_I2C lcd(0x27, 20, 4);

// ============================================================
//  SENSOR THRESHOLDS
// ============================================================
const int   GAS_WARN_TH  = 3000;
const int   GAS_EMER_TH  = 4000;
const float TEMP_WARN_TH = 36.0f;
const float TEMP_EMER_TH = 40.0f;
const float HUM_WARN_TH  = 76.0f;
const float HUM_EMER_TH  = 80.0f;

// ============================================================
//  FALL DETECTION PARAMETERS
// ============================================================
const float         IMPACT_THRESHOLD      = 15.0f;
const float         IMPACT_GYRO_THRESHOLD = 3.0f;
const float         STILL_ACCEL_DELTA     = 3.0f;
const float         STILL_GYRO_THRESHOLD  = 1.5f;
const unsigned long STILL_TIME_MS         = 10000;
const unsigned long IMPACT_TIMEOUT_MS     = 8000;
const unsigned long FALL_RESET_MS         = 20000;

// ============================================================
//  OBJECTS
// ============================================================
DHT               dht(DHTPIN, DHTTYPE);
Adafruit_MPU6050  mpu;

FirebaseData      fbdo;
FirebaseData      fbdo2;   // second handle (for list/count/delete)
FirebaseConfig    fbConfig;
FirebaseAuth      fbAuth;

// ============================================================
//  STATE
// ============================================================
bool impactDetected = false;
bool fallDetected   = false;
unsigned long impactTime     = 0;
unsigned long stillStartTime = 0;
unsigned long fallTime       = 0;

float lastAx = 0, lastAy = 0, lastAz = 0;
bool  firstRead = true;

bool firebaseReady   = false;
bool profileWritten  = false;
bool ntpReady        = false;

// ---- SOS edge detection ----
bool sosButtonPrev = false;
unsigned long sosLastFireMs = 0;

// ---- timers ----
unsigned long lastLiveMs     = 0;
unsigned long lastTeleMs     = 0;
unsigned long lastCleanupMs  = 0;

// ============================================================
//  LCD HELPER
// ============================================================
void lcdLine(int row, const char* text) {
  lcd.setCursor(0, row);
  lcd.print(text);
  int len = strlen(text);
  for (int i = len; i < 20; i++) lcd.print(" ");
}

// ============================================================
//  BUZZER (ACTIVE-LOW) + NON-BLOCKING PATTERNS
// ============================================================
void buzzerOn()  { digitalWrite(BUZZER_PIN, LOW); }
void buzzerOff() { digitalWrite(BUZZER_PIN, HIGH); }

#define BUZ_NONE     0
#define BUZ_GAS_WARN 1
#define BUZ_ENV_WARN 2
#define BUZ_FALL     3
#define BUZ_EMER     4

int buzPattern = BUZ_NONE;
unsigned long buzLastMs = 0;
int buzStep = 0;
bool buzStateOn = false;

void startBuzzer(int p) {
  if (buzPattern != p) {
    buzPattern = p;
    buzLastMs = 0;
    buzStep = 0;
    buzStateOn = false;
    buzzerOff();
  }
}
void stopBuzzer() { buzPattern = BUZ_NONE; buzzerOff(); }

void buzzerTick() {
  if (buzPattern == BUZ_NONE) return;

  unsigned long now = millis();
  if (buzLastMs == 0) buzLastMs = now;

  int onMs = 0, offMs = 0, maxSteps = 0;

  switch (buzPattern) {
    case BUZ_GAS_WARN: onMs = 200; offMs = 200; maxSteps = 6; break;
    case BUZ_ENV_WARN: onMs = 700; offMs = 500; maxSteps = 2; break;
    case BUZ_FALL:     onMs = 100; offMs = 100; maxSteps = 12; break;
    case BUZ_EMER:     onMs = 80;  offMs = 80;  maxSteps = 999999; break;
    default: break;
  }

  unsigned long interval = buzStateOn ? (unsigned long)onMs : (unsigned long)offMs;

  if (now - buzLastMs >= interval) {
    buzLastMs = now;
    buzStateOn = !buzStateOn;

    if (buzStateOn) buzzerOn(); else buzzerOff();
    buzStep++;

    if (buzPattern != BUZ_EMER && buzStep >= maxSteps) stopBuzzer();
  }
}

// ============================================================
//  TIME (NTP) — Sri Lanka (UTC+5:30)
// ============================================================
String getReadableTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "TIME_FAIL";

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}

String getLastUpdateString() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "TIME_FAIL";

  char buffer[40];
  strftime(buffer, sizeof(buffer), "Last Update : %d %b %Y | %H:%M:%S", &timeinfo);
  return String(buffer);
}

unsigned long nowEpochMs() {
  time_t now = time(nullptr);
  if (now < 100000) return 0;
  return (unsigned long)now * 1000UL;
}

// ============================================================
//  RISK LEVEL
// ============================================================
String computeRiskLevel(int gas, float temp, float hum, bool fall) {
  if (fall)                 return "DANGER";
  if (gas >= GAS_EMER_TH)   return "DANGER";
  if (temp > TEMP_EMER_TH)  return "DANGER";
  if (hum > HUM_EMER_TH)    return "DANGER";

  if (gas >= GAS_WARN_TH)   return "WARNING";
  if (temp > TEMP_WARN_TH)  return "WARNING";
  if (hum > HUM_WARN_TH)    return "WARNING";

  return "SAFE";
}

// ============================================================
//  FIREBASE: write static profile once
// ============================================================
void writeProfileOnce() {
  if (!Firebase.ready() || profileWritten) return;

  String basePath = "/Workers/" + String(WORKER_ID);
  bool ok1 = Firebase.RTDB.setString(&fbdo, (basePath + "/name").c_str(), WORKER_NAME);
  bool ok2 = Firebase.RTDB.setString(&fbdo, (basePath + "/id").c_str(), WORKER_ID);

  if (!ok1 || !ok2) {
    Serial.print("[FB] Profile write error: ");
    Serial.println(fbdo.errorReason());
    return;
  }
  profileWritten = true;
}

// ============================================================
//  SOS: /SOS/W-01
// ============================================================
void writeSosToFirebase() {
  if (!Firebase.ready()) return;

  unsigned long tsMs = nowEpochMs();
  if (tsMs == 0) tsMs = millis();

  FirebaseJson sosJson;
  sosJson.set("active",     true);
  sosJson.set("time",       (double)tsMs);
  sosJson.set("workerName", WORKER_NAME);
  sosJson.set("workerId",   WORKER_ID);

  if (!Firebase.RTDB.setJSON(&fbdo, ("/SOS/" + String(WORKER_ID)).c_str(), &sosJson)) {
    Serial.print("[FB] SOS error: ");
    Serial.println(fbdo.errorReason());
    return;
  }
  Serial.println("[FB] >>> SOS sent!");
}

// ============================================================
//  LIVE UPDATE: /live/W-01  (dashboard listens here for realtime)
// ============================================================
void writeLiveToFirebase(int gas, float temp, float hum, bool fall, const String &riskLevel) {
  if (!Firebase.ready()) return;

  unsigned long tsMs = nowEpochMs();
  if (tsMs == 0) tsMs = millis();

  FirebaseJson live;
  String readableTs = getReadableTime();
  String lastUpdateStr = getLastUpdateString();
  
  if (readableTs == "TIME_FAIL") {
      live.set("timestamp", (double)tsMs);
  } else {
      live.set("timestamp", readableTs);
      live.set("lastUpdate", lastUpdateStr);
  }
  live.set("gas",       gas);
  live.set("temp",      temp);
  live.set("humidity",  hum);
  live.set("motion",    fall);
  live.set("riskLevel", riskLevel);
  live.set("workerId",  WORKER_ID);
  live.set("workerName",WORKER_NAME);

  if (!Firebase.RTDB.setJSONAsync(&fbdo, ("/live/" + String(WORKER_ID)).c_str(), &live)) {
    Serial.print("[FB] live error (Async): ");
    Serial.println(fbdo.errorReason());
  }
}

// ============================================================
//  TELEMETRY PUSH: /Telemetry/W-01/{pushId}
// ============================================================
void pushTelemetry(int gas, float temp, float hum, bool fall, const String &riskLevel) {
  if (!Firebase.ready()) return;

  unsigned long tsMs = nowEpochMs();
  if (tsMs == 0) tsMs = millis();

  FirebaseJson tele;
  tele.set("timestamp", (double)tsMs);
  tele.set("gas",       gas);
  tele.set("temp",      temp);
  tele.set("humidity",  hum);
  tele.set("motion",    fall);
  tele.set("riskLevel", riskLevel);

  if (!Firebase.RTDB.pushJSON(&fbdo, ("/Telemetry/" + String(WORKER_ID)).c_str(), &tele)) {
    Serial.print("[FB] Telemetry push error: ");
    Serial.println(fbdo.errorReason());
  }
}

// ============================================================
//  KEEP ONLY LAST 100 TELEMETRY RECORDS (auto delete oldest)
//  Strategy:
//    - Get keys ordered by key (push IDs are time-ordered)
//    - If count > 100, delete first (count-100) keys
//  Run this occasionally (e.g., every 30s) to reduce load.
// ============================================================
bool getFirstKeyOfTelemetry(String &outKey) {
  String path = "/Telemetry/" + String(WORKER_ID);

  QueryFilter q;
  q.orderBy("$key");
  q.limitToFirst(1);

  if (!Firebase.RTDB.getJSON(&fbdo2, path.c_str(), &q)) {
    Serial.print("[FB] getFirstKey error: ");
    Serial.println(fbdo2.errorReason());
    return false;
  }

  FirebaseJson *json = fbdo2.jsonObjectPtr();
  if (!json) return false;

  FirebaseJsonData jd;
  // Get the first (only) key by iterating known behavior: JSON keys exist at top-level.
  // FirebaseJson in this library can export to string; we parse a simple way:
  String raw;
  json->toString(raw, true);

  int p1 = raw.indexOf('\"');
  if (p1 < 0) return false;
  int p2 = raw.indexOf('\"', p1 + 1);
  if (p2 < 0) return false;

  outKey = raw.substring(p1 + 1, p2);
  return outKey.length() > 0;
}

int getTelemetryCount() {

  String path = "/Telemetry/" + String(WORKER_ID);

  if (!Firebase.RTDB.getJSON(&fbdo2, path.c_str())) {
    Serial.print("[FB] getTelemetryCount error: ");
    Serial.println(fbdo2.errorReason());
    return -1;
  }

  FirebaseJson *json = fbdo2.jsonObjectPtr();
  if (!json) return -1;

  size_t count = json->iteratorBegin();   // gets total items

  int type;
  String key, value;

  for (size_t i = 0; i < count; i++) {
    json->iteratorGet(i, type, key, value);
  }

  json->iteratorEnd();

  return (int)count;
}
void cleanupTelemetryKeepLast100() {
  if (!Firebase.ready()) return;

  int count = getTelemetryCount();
  if (count <= 100 && count >= 0) return;

  if (count < 0) return;

  int toDelete = count - 100;
  Serial.printf("[FB] Telemetry count=%d, deleting %d old records...\n", count, toDelete);

  for (int i = 0; i < toDelete; i++) {
    String firstKey;
    if (!getFirstKeyOfTelemetry(firstKey)) break;

    String delPath = "/Telemetry/" + String(WORKER_ID) + "/" + firstKey;
    if (!Firebase.RTDB.deleteNode(&fbdo2, delPath.c_str())) {
      Serial.print("[FB] deleteNode error: ");
      Serial.println(fbdo2.errorReason());
      break;
    }
    delay(20); // small delay to avoid spamming
  }
}

// ============================================================
//  SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(300);

  Wire.begin(SDA_PIN, SCL_PIN);

  lcd.init();         // if blank LCD: change to lcd.begin();
  lcd.backlight();
  lcd.clear();

  pinMode(BUZZER_PIN, OUTPUT);
  buzzerOff();
  pinMode(STOP_BUTTON, INPUT_PULLUP);

  dht.begin();

  if (!mpu.begin()) {
    lcdLine(0, "MPU6050 ERROR");
    lcdLine(1, "Check I2C Wiring");
    lcdLine(2, "SDA=21 SCL=22");
    lcdLine(3, " ");
    while (1) delay(10);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  lcdLine(0, "SMART MINING HELMET");
  lcdLine(1, "Connecting WiFi...");
  lcdLine(2, WIFI_SSID);
  lcdLine(3, " ");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int wifiTry = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTry < 30) {
    delay(400);
    wifiTry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    lcdLine(1, "WiFi Connected!");
    String ip = WiFi.localIP().toString();
    lcdLine(2, ip.c_str());

    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    setenv("TZ", "LKT-5:30", 1);
    tzset();
    time_t nowT = time(nullptr);
    int tries = 0;
    while (nowT < 100000 && tries < 30) {
      delay(300);
      nowT = time(nullptr);
      tries++;
    }
    ntpReady = (nowT >= 100000);

    fbConfig.api_key      = FIREBASE_API_KEY;
    fbConfig.database_url = FIREBASE_DATABASE_URL;

    fbAuth.user.email    = FIREBASE_USER_EMAIL;
    fbAuth.user.password = FIREBASE_USER_PASSWORD;

    fbConfig.token_status_callback = tokenStatusCallback;

    Firebase.begin(&fbConfig, &fbAuth);
    Firebase.reconnectWiFi(true);

    firebaseReady = true;
    lcdLine(3, "Firebase Init OK");
  } else {
    lcdLine(1, "WiFi FAILED");
    lcdLine(2, "Offline mode only");
    lcdLine(3, " ");
  }

  delay(1200);
  lcd.clear();
}

// ============================================================
//  LOOP
// ============================================================
void loop() {
  // ---- SOS edge detection ----
  bool sosButtonNow = (digitalRead(STOP_BUTTON) == LOW);
  if (sosButtonNow && !sosButtonPrev) {
    if (firebaseReady && (sosLastFireMs == 0 || (millis() - sosLastFireMs > SOS_COOLDOWN_MS))) {
      writeSosToFirebase();
      sosLastFireMs = millis();
    }
  }
  sosButtonPrev = sosButtonNow;

  bool emergencyMode = sosButtonNow;

  if (firebaseReady && Firebase.ready()) writeProfileOnce();

  // ---- Read sensors ----
  int gasValue = analogRead(MQ135_PIN);

  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();
  bool dhtOk = !(isnan(temp) || isnan(hum));
  if (!dhtOk) { temp = 0.0f; hum = 0.0f; }

  sensors_event_t a, g, t;
  mpu.getEvent(&a, &g, &t);

  float ax = a.acceleration.x, ay = a.acceleration.y, az = a.acceleration.z;
  float gx = g.gyro.x,         gy = g.gyro.y,         gz = g.gyro.z;

  float accelMag = sqrt(ax*ax + ay*ay + az*az);
  float gyroMag  = sqrt(gx*gx + gy*gy + gz*gz);

  float accelDelta = 0.0f;
  if (!firstRead) {
    float dx = ax - lastAx, dy = ay - lastAy, dz = az - lastAz;
    accelDelta = sqrt(dx*dx + dy*dy + dz*dz);
  } else {
    firstRead = false;
  }
  lastAx = ax; lastAy = ay; lastAz = az;

  // ---- Fall detection ----
  if (!impactDetected && !fallDetected &&
      (accelMag > IMPACT_THRESHOLD || gyroMag > IMPACT_GYRO_THRESHOLD)) {
    impactDetected = true;
    impactTime     = millis();
    stillStartTime = 0;
  }

  if (impactDetected && !fallDetected) {
    bool isStill = (accelDelta < STILL_ACCEL_DELTA) && (gyroMag < STILL_GYRO_THRESHOLD);
    if (isStill) {
      if (stillStartTime == 0) stillStartTime = millis();
      if (millis() - stillStartTime >= STILL_TIME_MS) {
        fallDetected   = true;
        fallTime       = millis();
        impactDetected = false;
      }
    } else {
      stillStartTime = 0;
      if (millis() - impactTime > IMPACT_TIMEOUT_MS) impactDetected = false;
    }
  }

  if (fallDetected && (millis() - fallTime > FALL_RESET_MS)) fallDetected = false;

  // ---- Risk ----
  String riskLevel = computeRiskLevel(gasValue, dhtOk ? temp : 0, dhtOk ? hum : 0, fallDetected);

  // ---- 1s LIVE update ----
  if (firebaseReady && (millis() - lastLiveMs >= LIVE_UPDATE_MS)) {
    lastLiveMs = millis();
    writeLiveToFirebase(gasValue, dhtOk ? temp : 0, dhtOk ? hum : 0, fallDetected, riskLevel);
  }

  // ---- Optional telemetry every 15 sec ----
  if (firebaseReady && (millis() - lastTeleMs >= TELEMETRY_EVERY_MS)) {
    lastTeleMs = millis();
    pushTelemetry(gasValue, dhtOk ? temp : 0, dhtOk ? hum : 0, fallDetected, riskLevel);
  }

  // ---- Cleanup keep only last 100 (every 30 sec) ----
  if (firebaseReady && (millis() - lastCleanupMs >= 30000UL)) {
    lastCleanupMs = millis();
    cleanupTelemetryKeepLast100();
  }

  // ---- LCD ----
  char line0[21], line1[21];
  snprintf(line0, sizeof(line0), "Gas:%4d W:%d E:%d", gasValue, GAS_WARN_TH, GAS_EMER_TH);
  lcdLine(0, line0);

  if (dhtOk) snprintf(line1, sizeof(line1), "Temp:%2.1fC Hum:%2.0f%%", temp, hum);
  else       snprintf(line1, sizeof(line1), "DHT11 SENSOR ERROR ");
  lcdLine(1, line1);

  bool wifiOk = (WiFi.status() == WL_CONNECTED);

  // ---- Alerts ----
  if (emergencyMode) {
    lcdLine(2, "EMERGENCY...!");
    lcdLine(3, "HELP COMING SOON....");
    startBuzzer(BUZ_EMER);
  } else if (gasValue >= GAS_EMER_TH) {
    lcdLine(2, "GAS EMERGENCY!");
    lcdLine(3, "Evacuate Immediately");
    startBuzzer(BUZ_EMER);
  } else if (gasValue >= GAS_WARN_TH) {
    lcdLine(2, "GAS WARNING");
    lcdLine(3, "Check Ventilation");
    startBuzzer(BUZ_GAS_WARN);
  } else if (fallDetected) {
    lcdLine(2, "FALL DETECTED!");
    lcdLine(3, "Rescue Notified!");
    startBuzzer(BUZ_FALL);
  } else if (dhtOk && (temp > TEMP_EMER_TH || hum > HUM_EMER_TH)) {
    lcdLine(2, "ENV EMERGENCY!");
    lcdLine(3, "Temp/Humidity High");
    startBuzzer(BUZ_EMER);
  } else if (dhtOk && (temp > TEMP_WARN_TH || hum > HUM_WARN_TH)) {
    lcdLine(2, "ENV WARNING");
    lcdLine(3, "Monitor Conditions");
    startBuzzer(BUZ_ENV_WARN);
  } else {
    lcdLine(2, wifiOk ? "STATUS: NORMAL [WiFi]" : "STATUS: NORMAL      ");

    if (impactDetected) {
      char line3[21];
      unsigned long secLeft = 0;
      if (stillStartTime > 0) {
        unsigned long elapsed = millis() - stillStartTime;
        secLeft = (elapsed >= STILL_TIME_MS) ? 0 : (STILL_TIME_MS - elapsed) / 1000;
      }
      snprintf(line3, sizeof(line3), "Fall Check: %lus    ", secLeft);
      lcdLine(3, line3);
    } else {
      lcdLine(3, ntpReady ? "Monitoring Active..." : "Monitoring (No NTP)");
    }

    stopBuzzer();
  }

  buzzerTick();
  delay(100);
}@
