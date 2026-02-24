#include <Arduino.h>
#include "rfid_demo.h"

static const char* ZONE_NAME = "Tunnel Entry";
unsigned long lastTap = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("RFID Checkpoint (DEMO) started");
  Serial.print("Zone: ");
  Serial.println(ZONE_NAME);
}

void loop() {
  if (millis() - lastTap < 5000) return;
  lastTap = millis();

  String uid = demoTagUID();

  Serial.println("----- RFID DEMO TAP -----");
  Serial.print("uid : "); Serial.println(uid);
  Serial.print("zone: "); Serial.println(ZONE_NAME);
  Serial.println("-------------------------");
}