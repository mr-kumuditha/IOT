// ============================================================
//  ZONE TRACKING ESP32 — Two RFID Readers + WiFi + Firebase RTDB
//  Zone A: SS=5  RST=4   | Zone B: SS=17 RST=16
//
//  Writes:
//    /Workers/{workerId}/currentZone
//    /Workers/{workerId}/name
//    /Workers/{workerId}/id
//    /Workers/{workerId}/role
//    /Workers/{workerId}/lastUpdate          (NTP epoch ms, fallback millis)
//
//    /ZonesHistory/{workerId}/{pushId}
//      - zone, uid, workerId, workerName, ts
//
//  Fixes included:
//   - LCD begin(args) compatible with your LiquidCrystal_I2C library
//   - Uses leading "/" in RTDB paths
//   - Does NOT overwrite riskLevel (helmet node owns that)
//   - Adds lastUpdate
//   - Debounce to prevent repeated scans spamming Firebase
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
// UIDs printed as uppercase XX:XX:XX:XX — exact match required.
struct CardMapping {
  const char* uid;
  const char* workerId;
  const char* workerName;
  const char* role;
};

const CardMapping CARDS[] = {
  // RFID Tag
  { "51:2D:A9:02", "W-01", "Kumuditha",  "Site Supervisor"   },
  // RFID Cards 1-7
  { "BA:9B:61:16", "W-02", "Worker 02",  "Driller"           },
  { "FA:E6:6A:16", "W-03", "Worker 03",  "Blasting Engineer" },
  { "AA:5C:62:16", "W-04", "Worker 04",  "Surveyor"          },
  { "73:10:0F:05", "W-05", "Worker 05",  "Machine Operator"  },
  { "2A:12:65:16", "W-06", "Worker 06",  "Ground Support"    },
  { "0A:D3:61:16", "W-07", "Worker 07",  "Ventilation Tech"  },
  { "AA:23:6C:05", "W-08", "Worker 08",  "Safety Officer"    },
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

// ──── Hardware ────────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);

// RFID wiring
#define SS_A   5
#define RST_A  4
#define SS_B   17
#define RST_B  16

MFRC522 rfidA(SS_A, RST_A);
MFRC522 rfidB(SS_B, RST_B);

// ──── Firebase objects ────────────────────────────────────────
FirebaseData   fbdo;
FirebaseAuth   auth;
FirebaseConfig fbConfig;
bool fbReady = false;

// ──── NTP ─────────────────────────────────────────────────────
const char* NTP_SERVER = "pool.ntp.org";
const long  GMT_OFFSET = 5 * 3600 + 30 * 60;  // UTC+5:30 Colombo

// ──── Debounce (prevents spam writes) ─────────────────────────
unsigned long lastTapA = 0;
unsigned long lastTapB = 0;
const unsigned long TAP_COOLDOWN_MS = 2000;

// ──── Helpers ─────────────────────────────────────────────────
String uidToString(MFRC522 &rfid) {
  String s = "";
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

void lcdLine(int row, const String &msg) {
  lcd.setCursor(0, row);
  lcd.print("                "); // clear 16 chars
  lcd.setCursor(0, row);
  lcd.print(msg.substring(0, 16));
}

// NTP epoch ms, fallback to millis if NTP not ready
unsigned long getTimestampMs() {
  struct tm ti;
  if (!getLocalTime(&ti)) return millis();
  time_t epoch = mktime(&ti);
  if (epoch < 100000) return millis();
  return (unsigned long)epoch * 1000UL;
}

// ──── Firebase: write zone → /Workers  +  push → /ZonesHistory ─
void pushZoneEvent(const char* workerId, const char* workerName,
                   const char* role,     const char* zone,
                   const String &uid) {
  if (!fbReady || !Firebase.ready()) return;

  String workerPath = "/Workers/";
  workerPath += workerId;

  // Timestamp for this zone event
  unsigned long ts = getTimestampMs();

  // Worker profile (written on every tap)
  // NOTE: We do NOT write riskLevel here, helmet node owns that value.
  Firebase.RTDB.setString(&fbdo, (workerPath + "/currentZone").c_str(), zone);
  Firebase.RTDB.setString(&fbdo, (workerPath + "/name").c_str(),        workerName);
  Firebase.RTDB.setString(&fbdo, (workerPath + "/id").c_str(),          workerId);
  Firebase.RTDB.setString(&fbdo, (workerPath + "/role").c_str(),        role);
  Firebase.RTDB.setInt   (&fbdo, (workerPath + "/lastUpdate").c_str(),  (int)ts);

  // Zone history event
  FirebaseJson json;
  json.set("zone",       zone);
  json.set("uid",        uid.c_str());
  json.set("workerId",   workerId);
  json.set("workerName", workerName);
  json.set("ts",         (int)ts);

  String histPath = "/ZonesHistory/";
  histPath += workerId;

  if (!Firebase.RTDB.pushJSON(&fbdo, histPath.c_str(), &json)) {
    Serial.print("[FB] ZonesHistory push error: ");
    Serial.println(fbdo.errorReason());
  } else {
    Serial.printf("[FB] %s (%s) -> %s @ %lu\n", workerId, workerName, zone, ts);
  }
}

// ──── Handle a detected card ──────────────────────────────────
void handleCard(MFRC522 &rfid, const char* zoneName) {
  String uid = uidToString(rfid);
  Serial.printf("[%s] UID: %s\n", zoneName, uid.c_str());

  const CardMapping* card = lookupCard(uid);
  if (card) {
    lcdLine(0, String("Zone: ") + zoneName);
    lcdLine(1, card->workerName);
    pushZoneEvent(card->workerId, card->workerName, card->role, zoneName, uid);
  } else {
    // Unknown card — just show UID
    lcdLine(0, String("Zone: ") + zoneName);
    lcdLine(1, "UID:" + uid.substring(uid.length() > 11 ? uid.length() - 11 : 0));
    Serial.println("  (Unknown card — add UID to CARDS table)");
  }

  delay(150);
}

// ──── setup ───────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(200);

  // LCD
  Wire.begin(21, 22);
  lcd.begin(16, 2);     // ✅ FIX for your library
  lcd.backlight();
  lcdLine(0, "Starting...");
  lcdLine(1, "");

  // SPI + RFID
  SPI.begin(18, 19, 23);
  pinMode(SS_A, OUTPUT); digitalWrite(SS_A, HIGH);
  pinMode(SS_B, OUTPUT); digitalWrite(SS_B, HIGH);
  delay(50);
  rfidA.PCD_Init(); delay(50);
  rfidB.PCD_Init(); delay(50);
  Serial.println("RFID readers ready.");

  // WiFi
  lcdLine(0, "WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries++ < 20) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi OK: " + WiFi.localIP().toString());
    lcdLine(0, "WiFi OK");
    configTime(GMT_OFFSET, 0, NTP_SERVER);

    // Wait for NTP sync — up to 20 seconds (critical for correct timestamps)
    lcdLine(0, "NTP syncing...");
    time_t nowT = time(nullptr);
    int ttry = 0;
    while (nowT < 1577836800L && ttry++ < 40) { // 1577836800 = Jan 1 2020
      delay(500);
      nowT = time(nullptr);
      Serial.print(".");
    }
    if (nowT >= 1577836800L) {
      Serial.println("\nNTP OK: epoch=" + String((long)nowT));
      lcdLine(0, "NTP OK");
    } else {
      Serial.println("\nNTP FAILED — timestamps will be wrong!");
      lcdLine(0, "NTP FAIL");
    }
  } else {
    Serial.println("\nWiFi FAILED — offline mode");
    lcdLine(0, "WiFi FAIL");
  }

  // Firebase
  fbConfig.api_key      = FIREBASE_API_KEY;
  fbConfig.database_url = FIREBASE_DATABASE_URL;
  auth.user.email       = FIREBASE_USER_EMAIL;
  auth.user.password    = FIREBASE_USER_PASSWORD;
  fbConfig.token_status_callback = tokenStatusCallback;

  Firebase.begin(&fbConfig, &auth);
  Firebase.reconnectWiFi(true);
  fbReady = true;

  lcdLine(0, "RFID Zone Ready");
  lcdLine(1, "Scan card...");
  Serial.println("Zone tracker ready.");
}

// ──── loop ────────────────────────────────────────────────────
void loop() {
  // Zone A
  if (rfidA.PICC_IsNewCardPresent() && rfidA.PICC_ReadCardSerial()) {
    if (millis() - lastTapA > TAP_COOLDOWN_MS) {
      lastTapA = millis();
      handleCard(rfidA, "Zone A");
    }
    rfidA.PICC_HaltA();
    rfidA.PCD_StopCrypto1();
  }

  // Zone B
  if (rfidB.PICC_IsNewCardPresent() && rfidB.PICC_ReadCardSerial()) {
    if (millis() - lastTapB > TAP_COOLDOWN_MS) {
      lastTapB = millis();
      handleCard(rfidB, "Zone B");
    }
    rfidB.PICC_HaltA();
    rfidB.PCD_StopCrypto1();
  }
}