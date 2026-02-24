#pragma once
#include <Arduino.h>

inline String demoTagUID() {
  // Rotates UIDs every few seconds for demo
  int k = (millis() / 8000) % 3;
  if (k == 0) return "A1B2C3D4";
  if (k == 1) return "E5F6G7H8";
  return "I9J0K1L2";
}