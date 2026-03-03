/**
 * Sensor threshold configuration — aligned with the ESP32 firmware values.
 *
 * NOTE: Gas sensor (MQ-135) returns RAW 12-bit ADC values (0–4095) from
 *       analogRead(), NOT ppm. Adjust GAS_THRESHOLDS to match your firmware's
 *       GAS_WARN_TH and GAS_EMER_TH constants.
 */

export type SensorLevel = 'SAFE' | 'WARNING' | 'DANGER';

// ── Gas (MQ-135) — raw ESP32 ADC units (0–4095) ─────────────────────────────
// Firmware: GAS_WARN_TH = 3000 / GAS_EMER_TH = 4000
export const GAS_THRESHOLDS = {
    safe: 3000,    // < 3000  → SAFE
    warning: 4000, // 3000–4000 → WARNING, > 4000 → DANGER
};

export function getGasLevel(adcValue: number): SensorLevel {
    if (adcValue >= GAS_THRESHOLDS.warning) return 'DANGER';
    if (adcValue >= GAS_THRESHOLDS.safe) return 'WARNING';
    return 'SAFE';
}

// ── Temperature (DHT11) — °C ─────────────────────────────────────────────────
// Firmware: warning > 36°C, emergency > 40°C
export const TEMP_THRESHOLDS = {
    safe: 36,    // < 36°C  → SAFE
    warning: 40, // 36–40°C → WARNING, > 40°C → DANGER
};

export function getTempLevel(celsius: number): SensorLevel {
    if (celsius > TEMP_THRESHOLDS.warning) return 'DANGER';
    if (celsius >= TEMP_THRESHOLDS.safe) return 'WARNING';
    return 'SAFE';
}

// ── Humidity (DHT11) — % ─────────────────────────────────────────────────────
// Firmware: warning > 76%, emergency > 80%
export const HUMIDITY_THRESHOLDS = {
    dangerLow: 20,   // below 20% → DANGER (dry/explosive environment)
    warningLow: 30,   // below 30% → WARNING
    warningHigh: 76,   // above 76% → WARNING  (firmware: 76)
    dangerHigh: 80,   // above 80% → DANGER   (firmware: 80)
};

export function getHumidityLevel(pct: number): SensorLevel {
    if (pct < HUMIDITY_THRESHOLDS.dangerLow || pct > HUMIDITY_THRESHOLDS.dangerHigh) return 'DANGER';
    if (pct < HUMIDITY_THRESHOLDS.warningLow || pct > HUMIDITY_THRESHOLDS.warningHigh) return 'WARNING';
    return 'SAFE';
}

// ── Motion / Fall (MPU6050) ───────────────────────────────────────────────────
// Firmware: 10-second stillness after impact spike confirms a fall
export function getMotionLevel(motion: boolean | undefined): SensorLevel {
    if (motion === true) return 'DANGER';
    return 'SAFE';
}
