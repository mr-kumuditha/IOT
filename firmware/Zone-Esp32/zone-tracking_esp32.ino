// ============================================================
//  ZONE TRACKING ESP32 — Two RFID Readers + WiFi + Firebase
//  Timezone: Sri Lanka (UTC+5:30)
// ============================================================


// ─────────────────────────────────────────────────────────────
//                      WIFI SETTINGS
// ─────────────────────────────────────────────────────────────
#define WIFI_SSID        "SLT-4G_THARINDA"      // Your WiFi name
#define WIFI_PASSWORD    "Kumuditha@123"        // Your WiFi password


// ─────────────────────────────────────────────────────────────
//                      FIREBASE SETTINGS
// ─────────────────────────────────────────────────────────────
#define FIREBASE_API_KEY      "YOUR_API_KEY"
#define FIREBASE_DATABASE_URL "YOUR_DATABASE_URL"
#define FIREBASE_USER_EMAIL    "helmet@mining.local"
#define FIREBASE_USER_PASSWORD "helmet2025"


// ─────────────────────────────────────────────────────────────
//                      LIBRARIES
// ─────────────────────────────────────────────────────────────
#include <SPI.h>                  // SPI communication for RFID
#include <MFRC522.h>              // RFID library
#include <Wire.h>                 // I2C communication (LCD)
#include <LiquidCrystal_I2C.h>    // I2C LCD library
#include <WiFi.h>                 // WiFi for ESP32
#include <time.h>                 // NTP time functions

#include <Firebase_ESP_Client.h>  // Firebase library
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"


// ─────────────────────────────────────────────────────────────
//                      LCD SETUP
// ─────────────────────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);   // LCD address 0x27, size 16x2


// ─────────────────────────────────────────────────────────────
//                      RFID PINS
// ─────────────────────────────────────────────────────────────
#define SS_A   5     // Zone A SS pin
#define RST_A  4     // Zone A RST pin
#define SS_B   17    // Zone B SS pin
#define RST_B  16    // Zone B RST pin

MFRC522 rfidA(SS_A, RST_A);   // RFID reader for Zone A
MFRC522 rfidB(SS_B, RST_B);   // RFID reader for Zone B


// ─────────────────────────────────────────────────────────────
//                      FIREBASE OBJECTS
// ─────────────────────────────────────────────────────────────
FirebaseData   fbdo;
FirebaseAuth   auth;
FirebaseConfig fbConfig;
bool fbReady = false;   // Firebase ready flag


// ─────────────────────────────────────────────────────────────
//                      TIME (NTP)
// ─────────────────────────────────────────────────────────────
const char* NTP_SERVER = "pool.ntp.org";   // Internet time server

// Configure Sri Lanka timezone (UTC +5:30)
void setupTime() {
  configTime(0, 0, NTP_SERVER);     // Connect to NTP
  setenv("TZ", "LKT-5:30", 1);      // Sri Lanka timezone
  tzset();                          // Apply timezone
}


// ─────────────────────────────────────────────────────────────
//                      DEBOUNCE
// ─────────────────────────────────────────────────────────────
unsigned long lastTapA = 0;                 // Last scan time Zone A
unsigned long lastTapB = 0;                 // Last scan time Zone B
const unsigned long TAP_COOLDOWN_MS = 2000; // 2 seconds delay


// ─────────────────────────────────────────────────────────────
//                      HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

// Convert RFID UID to readable string (XX:XX:XX:XX)
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

// Get readable time (YYYY-MM-DD HH:MM:SS)
String getReadableTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "TIME_FAIL";

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}

// Get epoch time in milliseconds
unsigned long getEpochMs() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return millis();
  time_t now = mktime(&timeinfo);
  return (unsigned long)now * 1000UL;
}

// Print message to LCD line
void lcdLine(int row, String msg) {
  lcd.setCursor(0, row);
  lcd.print("                ");     // Clear row
  lcd.setCursor(0, row);
  lcd.print(msg.substring(0, 16)); // Print max 16 chars
}


// ─────────────────────────────────────────────────────────────
//                      FIREBASE WRITE FUNCTION
// ─────────────────────────────────────────────────────────────
void pushZoneEvent(const char* workerId, const char* workerName,
                   const char* role, const char* zone,
                   const String &uid) {

  if (!fbReady || !Firebase.ready()) return;

  String workerPath = "/Workers/" + String(workerId);

  String readableTime = getReadableTime();   // Human time
  unsigned long epochMs = getEpochMs();      // Epoch time

  // Update worker current data
  Firebase.RTDB.setString(&fbdo, (workerPath + "/currentZone").c_str(), zone);
  Firebase.RTDB.setString(&fbdo, (workerPath + "/name").c_str(), workerName);
  Firebase.RTDB.setString(&fbdo, (workerPath + "/role").c_str(), role);
  Firebase.RTDB.setString(&fbdo, (workerPath + "/lastUpdate").c_str(), readableTime);
  Firebase.RTDB.setInt(&fbdo, (workerPath + "/lastUpdateEpoch").c_str(), epochMs);

  // Create history JSON object
  FirebaseJson json;
  json.set("zone", zone);
  json.set("uid", uid);
  json.set("workerId", workerId);
  json.set("workerName", workerName);
  json.set("time", readableTime);
  json.set("ts", epochMs);

  String historyPath = "/ZonesHistory/" + String(workerId);

  // Push new history record
  Firebase.RTDB.pushJSON(&fbdo, historyPath.c_str(), &json);
}


// ─────────────────────────────────────────────────────────────
//                      HANDLE RFID CARD
// ─────────────────────────────────────────────────────────────
void handleCard(MFRC522 &rfid, const char* zoneName) {

  String uid = uidToString(rfid);
  
  if (!fbReady || !Firebase.ready()) {
    lcdLine(0, "WiFi/FB Offline");
    lcdLine(1, uid);
    delay(1000);
    return;
  }

  lcdLine(0, "Checking Cloud..");
  lcdLine(1, uid);

  // 1. Check if UID exists in Firebase /Cards/{uid}
  String cardPath = "/Cards/" + uid;
  if (Firebase.RTDB.getJSON(&fbdo, cardPath.c_str())) {
    
    FirebaseJson &json = fbdo.jsonObject();
    FirebaseJsonData jsonData;
    
    // Check if workerId exists inside the JSON
    json.get(jsonData, "workerId");
    if (jsonData.success) {
      String workerId = jsonData.stringValue;
      
      json.get(jsonData, "workerName");
      String workerName = jsonData.success ? jsonData.stringValue : "Unknown Worker";
      
      json.get(jsonData, "role");
      String role = jsonData.success ? jsonData.stringValue : "Unknown Role";

      // 2. We found a mapped worker! Update LCD & push event
      lcdLine(0, "Zone: " + String(zoneName));
      lcdLine(1, workerName);

      pushZoneEvent(workerId.c_str(), workerName.c_str(), role.c_str(), zoneName, uid);
      
      delay(200);
      return;
    }
  }

  // 3. Card not mapped in Firebase
  lcdLine(0, "Unregistered! ");
  lcdLine(1, uid);
  delay(1000);
}


// ─────────────────────────────────────────────────────────────
//                      SETUP
// ─────────────────────────────────────────────────────────────
void setup() {

  Serial.begin(115200);

  // LCD start
  Wire.begin(21, 22);
  lcd.begin(16, 2);
  lcd.backlight();

  // RFID start
  SPI.begin(18, 19, 23);
  rfidA.PCD_Init();
  rfidB.PCD_Init();

  // Connect WiFi
  lcdLine(0, "Connecting WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  lcdLine(0, "WiFi Connected");

  // Setup NTP time
  setupTime();

  // Wait up to 20 seconds for time sync
  time_t nowT = time(nullptr);
  int tries = 0;

  while (nowT < 1577836800L && tries++ < 40) {
    delay(500);
    nowT = time(nullptr);
  }

  if (nowT < 1577836800L)
    lcdLine(1, "NTP Failed");
  else
    lcdLine(1, "Time Synced");

  // Firebase init
  fbConfig.api_key = FIREBASE_API_KEY;
  fbConfig.database_url = FIREBASE_DATABASE_URL;
  auth.user.email = FIREBASE_USER_EMAIL;
  auth.user.password = FIREBASE_USER_PASSWORD;

  Firebase.begin(&fbConfig, &auth);
  Firebase.reconnectWiFi(true);
  fbReady = true;

  lcdLine(0, "RFID Ready");
  lcdLine(1, "Scan Card...");
}


// ─────────────────────────────────────────────────────────────
//                      LOOP
// ─────────────────────────────────────────────────────────────
void loop() {

  // Zone A reader
  if (rfidA.PICC_IsNewCardPresent() && rfidA.PICC_ReadCardSerial()) {
    if (millis() - lastTapA > TAP_COOLDOWN_MS) {
      lastTapA = millis();
      handleCard(rfidA, "Zone A");
    }
    rfidA.PICC_HaltA();
    rfidA.PCD_StopCrypto1();
  }

  // Zone B reader
  if (rfidB.PICC_IsNewCardPresent() && rfidB.PICC_ReadCardSerial()) {
    if (millis() - lastTapB > TAP_COOLDOWN_MS) {
      lastTapB = millis();
      handleCard(rfidB, "Zone B");
    }
    rfidB.PICC_HaltA();
    rfidB.PCD_StopCrypto1();
  }
}