// ============================================================
//  ZONE TRACKING ESP32 — Two RFID Readers + WiFi + Firebase RTDB
//  Zone A: SS=5  RST=4   | Zone B: SS=17 RST=16
//  Writes:
//    /Workers/{workerId}/currentZone
//    /Workers/{workerId}/lastUpdate
//    /ZonesHistory/{workerId}/{pushId}  (zone + uid + ts)
// ============================================================

// ──── WiFi ────────────────────────────────────────────────────
#define WIFI_SSID        "SLT-4G_THARINDA"
#define WIFI_PASSWORD    "Kumuditha@123"

// ──── Firebase ────────────────────────────────────────────────
#define FIREBASE_API_KEY      "AIzaSyCSt1mxgNcs8WciD_imKP3jKKqg8YoWgWI"
#define FIREBASE_DATABASE_URL "https://iot-based-mining-helmet-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_USER_EMAIL    "helmet@mining.local"
#define FIREBASE_USER_PASSWORD "helmet2025"

// ──── UID → Worker mapping ────────────────────────────────────
// NOTE: uidToString() makes uppercase hex with ":" separators.
// Put the exact same format here (example "12:34:AB:CD").
struct CardMapping {
  const char* uid;
  const char* workerId;
  const char* workerName;
};

const CardMapping CARDS[] = {
  { "12:34:AB:CD", "W-01", "Helmet Unit 01" },
  { "98:76:EF:01", "W-02", "Helmet Unit 02" },
};
const int CARD_COUNT = sizeof(CARDS) / sizeof(CARDS[0]);

// ──── Includes ────────────────────────────────────────────────
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <time.h>

#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ──── LCD ─────────────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ──── RFID pins ───────────────────────────────────────────────
#define SS_A   5
#define RST_A  4
#define SS_B   17
#define RST_B  16

MFRC522 rfidA(SS_A, RST_A);
MFRC522 rfidB(SS_B, RST_B);

// ESP32 default VSPI pins (safe to be explicit)
#define SPI_SCK   18
#define SPI_MISO  19
#define SPI_MOSI  23

// ──── Firebase objects ────────────────────────────────────────
FirebaseData   fbdo;
FirebaseAuth   auth;
FirebaseConfig fbConfig;

bool firebaseConfigured = false;

// ──── NTP ─────────────────────────────────────────────────────
// Colombo UTC+5:30
const long GMT_OFFSET_SEC = 5 * 3600 + 30 * 60;
const int  DST_OFFSET_SEC = 0;

unsigned long nowEpochMs() {
  time_t now = time(nullptr);
  if (now < 100000) return 0;               // not synced
  return (unsigned long)now * 1000UL;
}

// ──── Helpers ─────────────────────────────────────────────────
void lcdLine(int row, const String &msg) {
  lcd.setCursor(0, row);
  lcd.print("                ");
  lcd.setCursor(0, row);
  lcd.print(msg.substring(0, 16));
}

String uidToString(MFRC522 &rfid) {
  String s;
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) s += "0";
    s += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) s += ":";
  }
  s.toUpperCase();
  return s;
}

const CardMapping* lookupCard(const String &uid) {
  for (int i = 0; i < CARD_COUNT; i++) {
    if (uid == CARDS[i].uid) return &CARDS[i];
  }
  return nullptr;
}

// Debounce so same card doesn’t spam Firebase
String lastUidA = "";
String lastUidB = "";
unsigned long lastTapA = 0;
unsigned long lastTapB = 0;
const unsigned long TAP_COOLDOWN_MS = 1500;

bool allowTap(const char* zoneName, const String& uid) {
  unsigned long now = millis();
  if (strcmp(zoneName, "Zone A") == 0) {
    if (uid == lastUidA && (now - lastTapA) < TAP_COOLDOWN_MS) return false;
    lastUidA = uid; lastTapA = now; return true;
  } else {
    if (uid == lastUidB && (now - lastTapB) < TAP_COOLDOWN_MS) return false;
    lastUidB = uid; lastTapB = now; return true;
  }
}

// ──── Firebase: write zone + history ──────────────────────────
void pushZoneEvent(const char* workerId, const char* workerName, const char* zone, const String &uid) {
  if (!Firebase.ready()) return;

  String basePath = "/Workers/" + String(workerId);

  // Current worker state
  if (!Firebase.RTDB.setString(&fbdo, (basePath + "/currentZone").c_str(), zone)) {
    Serial.print("[FB] currentZone error: "); Serial.println(fbdo.errorReason());
  }
  Firebase.RTDB.setString(&fbdo, (basePath + "/name").c_str(), workerName);
  Firebase.RTDB.setString(&fbdo, (basePath + "/id").c_str(), workerId);

  // Timestamp (epoch ms)
  unsigned long ts = nowEpochMs();
  if (ts == 0) ts = millis(); // fallback if NTP not ready

  Firebase.RTDB.setInt(&fbdo, (basePath + "/lastUpdate").c_str(), (int)ts);

  // History event
  FirebaseJson json;
  json.set("zone",       zone);
  json.set("uid",        uid.c_str());
  json.set("workerId",   workerId);
  json.set("workerName", workerName);
  json.set("ts",         (int)ts);

  String histPath = "/ZonesHistory/" + String(workerId);
  if (!Firebase.RTDB.pushJSON(&fbdo, histPath.c_str(), &json)) {
    Serial.print("[FB] ZonesHistory push error: "); Serial.println(fbdo.errorReason());
  } else {
    Serial.printf("[FB] %s -> %s @ %lu\n", workerId, zone, ts);
  }
}

// ──── Handle a detected card ──────────────────────────────────
void handleCard(MFRC522 &rfid, const char* zoneName) {
  String uid = uidToString(rfid);
  Serial.printf("[%s] UID: %s\n", zoneName, uid.c_str());

  if (!allowTap(zoneName, uid)) {
    // stop crypto & return quickly
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  const CardMapping* card = lookupCard(uid);

  lcdLine(0, String("Zone: ") + zoneName);

  if (card) {
    lcdLine(1, card->workerName);
    pushZoneEvent(card->workerId, card->workerName, zoneName, uid);
  } else {
    lcdLine(1, "UID:" + uid.substring(uid.length() > 11 ? uid.length() - 11 : 0));
    Serial.println("  Unknown card. Add UID to CARDS[] table.");
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// ──── Setup ───────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(200);

  // LCD
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lcdLine(0, "Starting...");
  lcdLine(1, "");

  // SPI + RFID
  SPI.begin(SPI_SCK, SPI_MISO, SPI_MOSI);

  // Important: both SS pins OUTPUT HIGH before init
  pinMode(SS_A, OUTPUT); digitalWrite(SS_A, HIGH);
  pinMode(SS_B, OUTPUT); digitalWrite(SS_B, HIGH);

  delay(60);
  rfidA.PCD_Init();
  delay(60);
  rfidB.PCD_Init();
  delay(60);

  Serial.println("RFID readers ready.");

  // WiFi
  lcdLine(0, "WiFi connecting");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries++ < 25) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] OK: " + WiFi.localIP().toString());
    lcdLine(0, "WiFi OK");
    lcdLine(1, WiFi.localIP().toString());

    // NTP
    configTime(GMT_OFFSET_SEC, DST_OFFSET_SEC, "pool.ntp.org", "time.nist.gov");
    time_t nowT = time(nullptr);
    int ttry = 0;
    while (nowT < 100000 && ttry++ < 25) { delay(300); nowT = time(nullptr); }

    // Firebase
    fbConfig.api_key      = FIREBASE_API_KEY;
    fbConfig.database_url = FIREBASE_DATABASE_URL;

    auth.user.email    = FIREBASE_USER_EMAIL;
    auth.user.password = FIREBASE_USER_PASSWORD;

    fbConfig.token_status_callback = tokenStatusCallback;

    Firebase.begin(&fbConfig, &auth);
    Firebase.reconnectWiFi(true);
    firebaseConfigured = true;

    lcdLine(0, "Firebase init");
    lcdLine(1, "Scan card...");
    Serial.println("[FB] init requested");
  } else {
    Serial.println("[WiFi] FAILED (offline)");
    lcdLine(0, "WiFi FAIL");
    lcdLine(1, "Offline mode");
  }

  delay(900);
  lcdLine(0, "RFID Zone Ready");
  lcdLine(1, "Scan card...");
  Serial.println("Zone tracker ready.");
}

// ──── Loop ────────────────────────────────────────────────────
void loop() {
  // If WiFi/Firebase not ready, you can still read cards and show LCD.
  // Firebase writes will be skipped by Firebase.ready() check.

  // Zone A
  if (rfidA.PICC_IsNewCardPresent() && rfidA.PICC_ReadCardSerial()) {
    handleCard(rfidA, "Zone A");
  }

  // Zone B
  if (rfidB.PICC_IsNewCardPresent() && rfidB.PICC_ReadCardSerial()) {
    handleCard(rfidB, "Zone B");
  }

  // Small delay helps stability
  delay(40);
}