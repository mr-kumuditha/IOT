// ============================================================
//  ESP32 RFID ZONE TRACKING SYSTEM
//  Two RFID Readers + WiFi + Firebase + LCD
//
//  Zone A -> Reader 1
//  Zone B -> Reader 2
//
//  Reads UID -> checks Firebase -> updates worker zone
//  Saves zone history in Firebase
//
//  Timezone: Sri Lanka (UTC +5:30)
// ============================================================



// ------------------------------------------------------------
// WIFI SETTINGS
// ------------------------------------------------------------
#define WIFI_SSID "SLT-4G_THARINDA"
#define WIFI_PASSWORD "Kumuditha@123"



// ------------------------------------------------------------
// FIREBASE SETTINGS
// ------------------------------------------------------------
#define FIREBASE_API_KEY "AIzaSyCSt1mxgNcs8WciD_imKP3jKKqg8YoWgWI"

#define FIREBASE_DATABASE_URL "https://iot-based-mining-helmet-default-rtdb.asia-southeast1.firebasedatabase.app/"

#define FIREBASE_USER_EMAIL "helmet@mining.local"
#define FIREBASE_USER_PASSWORD "helmet2025"



// ------------------------------------------------------------
// LIBRARIES
// ------------------------------------------------------------
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <time.h>

#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"



// ------------------------------------------------------------
// LCD SETUP
// ------------------------------------------------------------
LiquidCrystal_I2C lcd(0x27, 16, 2);



// ------------------------------------------------------------
// RFID PIN DEFINITIONS
// ------------------------------------------------------------
#define SS_A 5
#define RST_A 4

#define SS_B 17
#define RST_B 16

MFRC522 rfidA(SS_A, RST_A);
MFRC522 rfidB(SS_B, RST_B);



// ------------------------------------------------------------
// FIREBASE OBJECTS
// ------------------------------------------------------------
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig fbConfig;

bool fbReady = false;



// ------------------------------------------------------------
// NTP TIME SERVER
// ------------------------------------------------------------
const char* NTP_SERVER = "pool.ntp.org";



// ------------------------------------------------------------
// SCAN COOLDOWN
// Prevents repeated scans
// ------------------------------------------------------------
unsigned long lastTapA = 0;
unsigned long lastTapB = 0;

const unsigned long TAP_COOLDOWN_MS = 2000;



// ------------------------------------------------------------
// LCD PRINT FUNCTION
// Clears row then prints text
// ------------------------------------------------------------
void lcdLine(int row, String text)
{
  lcd.setCursor(0, row);
  lcd.print("                ");   // clear line
  lcd.setCursor(0, row);
  lcd.print(text.substring(0,16));
}



// ------------------------------------------------------------
// CONVERT RFID UID TO STRING
// Example: 51:2D:A9:02
// ------------------------------------------------------------
String uidToString(MFRC522 &rfid)
{
  String uid="";

  for(byte i=0;i<rfid.uid.size;i++)
  {
    if(rfid.uid.uidByte[i] < 0x10) uid+="0";

    uid += String(rfid.uid.uidByte[i],HEX);

    if(i<rfid.uid.size-1)
    uid += ":";
  }

  uid.toUpperCase();

  return uid;
}



// ------------------------------------------------------------
// GET HUMAN READABLE TIME
// ------------------------------------------------------------
String getReadableTime()
{
  struct tm timeinfo;

  if(!getLocalTime(&timeinfo))
  return "TIME_FAIL";

  char buffer[25];

  strftime(buffer,sizeof(buffer),"%Y-%m-%d %H:%M:%S",&timeinfo);

  return String(buffer);
}



// ------------------------------------------------------------
// GET EPOCH TIME (milliseconds)
// ------------------------------------------------------------
unsigned long getEpochMs()
{
  struct tm timeinfo;

  if(!getLocalTime(&timeinfo))
  return millis();

  time_t now=mktime(&timeinfo);

  return (unsigned long)now*1000UL;
}



// ------------------------------------------------------------
// SAVE ZONE EVENT TO FIREBASE
// ------------------------------------------------------------
void pushZoneEvent(const char* workerId,
                   const char* workerName,
                   const char* role,
                   const char* zone,
                   const String &uid)
{

  if(!fbReady || !Firebase.ready())
  return;


  String workerPath="/Workers/";
  workerPath+=workerId;


  String readableTime=getReadableTime();
  unsigned long epochMs=getEpochMs();


  // Update worker live location
  Firebase.RTDB.setString(&fbdo,(workerPath+"/currentZone").c_str(),zone);
  Firebase.RTDB.setString(&fbdo,(workerPath+"/name").c_str(),workerName);
  Firebase.RTDB.setString(&fbdo,(workerPath+"/role").c_str(),role);
  Firebase.RTDB.setString(&fbdo,(workerPath+"/lastUpdate").c_str(),readableTime);
  Firebase.RTDB.setInt(&fbdo,(workerPath+"/lastUpdateEpoch").c_str(),epochMs);


  // Create zone history record
  FirebaseJson json;

  json.set("zone",zone);
  json.set("uid",uid);
  json.set("workerId",workerId);
  json.set("workerName",workerName);
  json.set("time",readableTime);
  json.set("ts",epochMs);


  String historyPath="/ZonesHistory/";
  historyPath+=workerId;


  Firebase.RTDB.pushJSON(&fbdo,historyPath.c_str(),&json);

}



// ------------------------------------------------------------
// HANDLE CARD SCAN
// ------------------------------------------------------------
void handleCard(MFRC522 &rfid,const char* zoneName)
{

  String uid=uidToString(rfid);

  Serial.println("Card UID: "+uid);


  if(!fbReady || !Firebase.ready())
  {
    lcdLine(0,"WiFi/FB Offline");
    lcdLine(1,uid);
    delay(1500);
    return;
  }


  lcdLine(0,"Checking Cloud");
  lcdLine(1,uid);


  // Check UID in Firebase
  String cardPath="/Cards/"+uid;


  if(Firebase.RTDB.getJSON(&fbdo,cardPath.c_str()))
  {

    FirebaseJson &json=fbdo.jsonObject();
    FirebaseJsonData result;


    json.get(result,"workerId");

    if(result.success)
    {

      String workerId=result.stringValue;

      json.get(result,"workerName");
      String workerName=result.success?result.stringValue:"Unknown";

      json.get(result,"role");
      String role=result.success?result.stringValue:"Worker";


      lcdLine(0,"Zone: "+String(zoneName));
      lcdLine(1,workerName);


      pushZoneEvent(workerId.c_str(),
                    workerName.c_str(),
                    role.c_str(),
                    zoneName,
                    uid);


      delay(1000);

      return;
    }
  }


  // Unknown card
  lcdLine(0,"Unregistered");
  lcdLine(1,uid);

  delay(1500);

}



// ------------------------------------------------------------
// SETUP FUNCTION
// ------------------------------------------------------------
void setup()
{

  Serial.begin(115200);


  // Start LCD
  Wire.begin(21,22);

  lcd.begin(16,2);
  lcd.backlight();



  // Start SPI for RFID
  SPI.begin(18,19,23);


  rfidA.PCD_Init();
  rfidB.PCD_Init();


  // Connect WiFi
  lcdLine(0,"Connecting WiFi");

  WiFi.begin(WIFI_SSID,WIFI_PASSWORD);

  while(WiFi.status()!=WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }


  lcdLine(0,"WiFi Connected");


  // Setup NTP Time
  configTime(0,0,NTP_SERVER);
  setenv("TZ","LKT-5:30",1);
  tzset();


  time_t now=time(nullptr);

  int tries=0;


  while(now<1577836800L && tries++<40)
  {
    delay(500);
    now=time(nullptr);
  }


  if(now<1577836800L)
  lcdLine(1,"Time Failed");
  else
  lcdLine(1,"Time Synced");



  // Firebase Setup
  fbConfig.api_key=FIREBASE_API_KEY;
  fbConfig.database_url=FIREBASE_DATABASE_URL;

  auth.user.email=FIREBASE_USER_EMAIL;
  auth.user.password=FIREBASE_USER_PASSWORD;

  Firebase.begin(&fbConfig,&auth);

  Firebase.reconnectWiFi(true);

  fbReady=true;



  lcdLine(0,"RFID Ready");
  lcdLine(1,"Scan Card");

}



// ------------------------------------------------------------
// MAIN LOOP
// ------------------------------------------------------------
void loop()
{


  // Zone A
  if(rfidA.PICC_IsNewCardPresent() && rfidA.PICC_ReadCardSerial())
  {

    if(millis()-lastTapA>TAP_COOLDOWN_MS)
    {
      lastTapA=millis();

      handleCard(rfidA,"Zone A");
    }

    rfidA.PICC_HaltA();
    rfidA.PCD_StopCrypto1();
  }



  // Zone B
  if(rfidB.PICC_IsNewCardPresent() && rfidB.PICC_ReadCardSerial())
  {

    if(millis()-lastTapB>TAP_COOLDOWN_MS)
    {
      lastTapB=millis();

      handleCard(rfidB,"Zone B");
    }

    rfidB.PICC_HaltA();
    rfidB.PCD_StopCrypto1();
  }

}