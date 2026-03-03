// ============================================================
//  ZONE TRACKING ESP32 — Two RFID Readers + WiFi + Firebase
//  Zone A (Reader A SS=5, RST=4) | Zone B (Reader B SS=17, RST=16)
//  LCD 20x2 I2C @0x27
//  Firebase: /Workers/{id}/currentZone  +  /ZonesHistory/{id}/{pushId}
// ============================================================

// ──── WiFi ────────────────────────────────────────────────────
#define WIFI_SSID        "SLT-4G_THARINDA"
#define WIFI_PASSWORD    "Kumuditha@123"

// ──── Firebase ────────────────────────────────────────────────
#define FIREBASE_API_KEY      "AIzaSyCSt1mxgNcs8WciD_imKP3jKKqg8YoWgWI"
#define FIREBASE_DATABASE_URL "https://iot-based-mining-helmet-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_USER_EMAIL    "helmet@mining.local"
#define FIREBASE_USER_PASSWORD "helmet2025"

// ──── UID → Worker mapping (add your cards here) ─────────────
// Run once without this table to read UIDs from Serial, then fill in.
struct CardMapping {
    const char* uid;       // e.g. "AB:12:CD:34"
    const char* workerId;  // e.g. "W-01"
    const char* workerName;
};

const CardMapping CARDS[] = {
    { "12:34:AB:CD", "W-01", "Helmet Unit 01" },
    { "98:76:EF:01", "W-02", "Helmet Unit 02" },
    // ← Add more cards here
};
const int CARD_COUNT = sizeof(CARDS) / sizeof(CARDS[0]);

// ──── Includes ────────────────────────────────────────────────
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ──── Hardware ────────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);

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
const long  GMT_OFFSET  = 5 * 3600 + 30 * 60;  // UTC+5:30 Colombo

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

long getTimestamp() {
    struct tm ti;
    if (!getLocalTime(&ti)) return millis();
    return mktime(&ti) * 1000LL;
}

// ──── Firebase: write zone to /Workers + push to /ZonesHistory ─
void pushZoneEvent(const char* workerId, const char* workerName, const char* zone, const String &uid) {
    if (!fbReady || !Firebase.ready()) return;

    String workerPath = "Workers/";
    workerPath += workerId;

    // Update currentZone on the worker profile
    Firebase.RTDB.setString(&fbdo, (workerPath + "/currentZone").c_str(), zone);
    Firebase.RTDB.setString(&fbdo, (workerPath + "/name").c_str(), workerName);
    Firebase.RTDB.setString(&fbdo, (workerPath + "/id").c_str(), workerId);

    // Push a history event
    long ts = getTimestamp();
    FirebaseJson json;
    json.set("zone",       zone);
    json.set("uid",        uid.c_str());
    json.set("workerId",   workerId);
    json.set("workerName", workerName);
    json.set("ts",         ts);

    String histPath = "ZonesHistory/";
    histPath += workerId;
    Firebase.RTDB.pushJSON(&fbdo, histPath.c_str(), &json);

    Serial.printf("[FB] %s → %s @ %ld\n", workerId, zone, ts);
}

// ──── Handle a detected card ──────────────────────────────────
void handleCard(MFRC522 &rfid, const char* zoneName) {
    String uid = uidToString(rfid);
    Serial.printf("[%s] UID: %s\n", zoneName, uid.c_str());

    const CardMapping* card = lookupCard(uid);
    if (card) {
        lcdLine(0, String("Zone: ") + zoneName);
        lcdLine(1, card->workerName);
        pushZoneEvent(card->workerId, card->workerName, zoneName, uid);
    } else {
        // Unknown card — just show UID
        lcdLine(0, String("Zone: ") + zoneName);
        lcdLine(1, "UID:" + uid.substring(uid.length() > 11 ? uid.length() - 11 : 0));
        Serial.println("  (Unknown card — add UID to CARDS table)");
    }
    delay(400);
}

// ──── setup ───────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(200);

    // LCD
    Wire.begin(21, 22);
    lcd.begin();
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
    } else {
        Serial.println("\nWiFi FAILED — offline mode");
        lcdLine(0, "WiFi FAIL");
    }

    // Firebase
    fbConfig.api_key           = FIREBASE_API_KEY;
    fbConfig.database_url      = FIREBASE_DATABASE_URL;
    auth.user.email            = FIREBASE_USER_EMAIL;
    auth.user.password         = FIREBASE_USER_PASSWORD;
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
        handleCard(rfidA, "Zone A");
        rfidA.PICC_HaltA();
        rfidA.PCD_StopCrypto1();
    }

    // Zone B
    if (rfidB.PICC_IsNewCardPresent() && rfidB.PICC_ReadCardSerial()) {
        handleCard(rfidB, "Zone B");
        rfidB.PICC_HaltA();
        rfidB.PCD_StopCrypto1();
    }
}
