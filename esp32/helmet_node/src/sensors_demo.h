#pragma once
#include <Arduino.h>

struct SensorPacket {
  float temp;
  float hum;
  int gas;
  bool fall;
};

inline SensorPacket readSensorsDemo() {
  SensorPacket p;

  // Fake but believable values
  p.temp = 29.5 + (millis() % 800) / 100.0;   // 29.5 to 37.5
  p.hum  = 55.0 + (millis() % 300) / 10.0;    // 55 to 85
  p.gas  = 180 + (millis() % 200);            // 180 to 380
  p.fall = (millis() / 15000) % 2 == 1;       // flips every 15 sec

  return p;
}