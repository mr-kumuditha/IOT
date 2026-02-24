#pragma once
#include <Arduino.h>
#include "sensors_demo.h"

inline String riskFrom(const SensorPacket& p, bool sosPressed) {
  if (sosPressed) return "DANGER";
  if (p.fall) return "DANGER";
  if (p.gas > 320 || p.temp > 36.5) return "WARNING";
  return "SAFE";
}