#include <Arduino.h>
#include "config.h"
#include "sensors_demo.h"
#include "logic_demo.h"

// Demo pins (optional)
static const int SOS_PIN = 18;   // button to GND with INPUT_PULLUP
static const int BUZZER  = 19;   // active buzzer
static const int LED_RED = 23;

unsigned long lastTick = 0;

void setup() {
  Serial.begin(115200);

  pinMode(SOS_PIN, INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  digitalWrite(BUZZER, LOW);
  digitalWrite(LED_RED, LOW);

  Serial.println("Helmet Node (DEMO) started");
  Serial.print("Worker ID: ");
  Serial.println(WORKER_ID);
}

void loop() {
  if (millis() - lastTick < SENSOR_INTERVAL_MS) return;
  lastTick = millis();

  bool sosPressed = digitalRead(SOS_PIN) == LOW;

  SensorPacket p = readSensorsDemo();
  String risk = riskFrom(p, sosPressed);

  // Local alert behavior (demo)
  if (risk == "DANGER") {
    digitalWrite(LED_RED, HIGH);
    digitalWrite(BUZZER, HIGH);
  } else {
    digitalWrite(LED_RED, LOW);
    digitalWrite(BUZZER, LOW);
  }

  // Print as if sending to cloud
  Serial.println("----- HELMET DEMO UPDATE -----");
  Serial.print("temp: "); Serial.println(p.temp);
  Serial.print("hum : "); Serial.println(p.hum);
  Serial.print("gas : "); Serial.println(p.gas);
  Serial.print("fall: "); Serial.println(p.fall ? "YES" : "NO");
  Serial.print("sos : "); Serial.println(sosPressed ? "YES" : "NO");
  Serial.print("risk: "); Serial.println(risk);
  Serial.println("------------------------------");
}