<# 🪖 Smart Mining Helmet — IoT Safety Monitoring System

<div align="center">

![Smart Mining Helmet Banner](https://img.shields.io/badge/IoT-Mining%20Safety-orange?style=for-the-badge&logo=arduino&logoColor=white)

**Real-time environmental monitoring and emergency alert system for underground mine workers.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![ESP32](https://img.shields.io/badge/ESP32-Firmware-blue?style=flat-square&logo=espressif)](https://www.espressif.com/)
[![React](https://img.shields.io/badge/Dashboard-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)]()

</div>

---

## 📖 Project Overview

The **Smart Mining Helmet** is an IoT-based wearable safety device designed to protect underground mine workers from life-threatening hazards. Equipped with environmental sensors and real-time cloud connectivity, it continuously monitors:

- Toxic gas concentrations
- Temperature and humidity levels
- Physical impact and fall detection
- Zone location via RFID readers

All data is broadcast every second to a **Firebase Realtime Database** and visualised on a live **React web dashboard**, allowing safety supervisors to remotely monitor every worker's condition, receive automatic alerts, and review full incident history.

> *Mining environments kill hundreds of workers every year due to gas leaks, heat exposure, and fall accidents. This system puts a connected safety net on every helmet.*

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔴 **Real-Time Gas Detection** | MQ-135 sensor detects toxic gas, triggers warning/emergency thresholds |
| 🌡️ **Temperature & Humidity Monitoring** | DHT11 sensor reads thermal conditions, alerts on extremes |
| 🏃 **Fall & Impact Detection** | MPU6050 accelerometer + gyroscope detects falls, triggers SOS |
| 🆘 **Hardware SOS Button** | Physical emergency button fires instant alert to the cloud |
| 📍 **RFID Zone Tracking** | Two RFID readers map workers to named zones in real time |
| 📡 **Live Cloud Dashboard** | 1-second Firebase updates visualised on a React admin panel |
| 📊 **Historical Data Tracking** | Last 100 telemetry records stored per worker |
| 🔔 **Automatic Incident Logging** | Danger and warning events auto-logged to Firebase Incidents list |
| 🔊 **Helmet Buzzer & LCD** | On-device alerts with buzzer patterns and 20×4 I2C LCD |
| 👷 **Worker Registry** | Cloud-managed RFID card-to-worker mapping with live editing |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     UNDERGROUND MINE                        │
│                                                             │
│  ┌────────────────────┐     ┌────────────────────────────┐  │
│  │  Smart Helmet ESP32│     │  Zone Tracking ESP32       │  │
│  │  ─────────────────│     │  ──────────────────────    │  │
│  │  • MQ-135 Gas      │     │  • RFID Reader Zone A      │  │
│  │  • DHT11 Temp/Hum  │     │  • RFID Reader Zone B      │  │
│  │  • MPU6050 IMU     │     │  • I2C LCD Display         │  │
│  │  • SOS Button      │     └──────────┬─────────────────┘  │
│  │  • Buzzer + LCD    │                │ WiFi               │
│  └──────────┬─────────┘                │                    │
│             │ WiFi (1 sec updates)      │                    │
└─────────────┼───────────────────────── ┼────────────────────┘
              ▼                          ▼
      ┌───────────────────────────────────────────┐
      │         Firebase Realtime Database         │
      │   /live/{workerId}     /Workers/{id}       │
      │   /Telemetry/{id}      /Incidents          │
      │   /ZonesHistory/{id}   /SOS/{id}           │
      └────────────────────┬──────────────────────┘
                           │ Firebase SDK
                           ▼
              ┌────────────────────────┐
              │  React Web Dashboard   │
              │  (Vite + MUI)         │
              │  • Overview KPIs      │
              │  • Live Worker Card   │
              │  • Zone Tracking Map  │
              │  • Incident History   │
              │  • Sensor Charts      │
              └────────────────────────┘
```

---

## 🛠️ Technology Stack

### Hardware
| Component | Purpose |
|---|---|
| **ESP32 (x2)** | Helmet MCU + Zone tracking MCU |
| **MQ-135** | Toxic gas detection (raw ADC 0–4095) |
| **DHT11** | Temperature & humidity |
| **MPU6050** | 6-axis accelerometer + gyroscope for fall detection |
| **MFRC522 RFID** | Card readers for zone entry/exit tracking |
| **I2C LCD 20×4 / 16×2** | On-device status display |
| **Active Buzzer** | Audio alerts for danger levels |

### Software
| Technology | Role |
|---|---|
| **Arduino C++ (ESP32)** | Firmware for both MCUs |
| **Firebase Realtime DB** | Cloud data store & live pub/sub |
| **Firebase Auth** | Secure email/password authentication |
| **React 18 + Vite** | Web dashboard frontend |
| **TypeScript** | Type-safe dashboard code |
| **Material UI (MUI v6)** | Dashboard component library |
| **MUI X Charts** | Live sensor graphs |
| **React Router DOM** | Dashboard navigation |
| **NTP (pool.ntp.org)** | Real-time timestamps (Sri Lanka UTC+5:30) |

---

## 📁 Project Structure

```
IoT-Based-Mining-Worker-Safety-Helmet/
│
├── firmware/
│   ├── helmet_esp32/
│   │   └── helmet_esp32.ino        # Main helmet MCU firmware
│   └── Zone-Esp32/
│       └── zone-tracking_esp32.ino # RFID zone tracker firmware
│
├── mining-helmet-dashboard/        # React web dashboard
│   ├── src/
│   │   ├── app/                    # App entry, routing, layout
│   │   ├── components/             # Shared UI components
│   │   ├── config/                 # Thresholds and constants
│   │   ├── controllers/            # Firebase hooks (useWorkers, useLiveSensorData…)
│   │   ├── models/                 # TypeScript interfaces
│   │   ├── services/firebase/      # Firebase init + refs
│   │   ├── utils/                  # Formatters, helpers
│   │   └── views/                  # Page components
│   │       ├── Dashboard/          # Overview with KPI cards
│   │       ├── Workers/            # Live workers list
│   │       ├── WorkerDetails/      # Worker profile + zone timeline
│   │       ├── Monitor/            # Realtime sensor charts
│   │       ├── Incidents/          # Incident history
│   │       ├── Zone/               # Zone tracking view
│   │       ├── WorkerRegistry/     # Cloud RFID card management
│   │       └── Settings/           # Firebase config
│   ├── public/
│   ├── index.html
│   └── package.json
│
├── Project circuit diagram.jpeg
└── README.md
```

---

## 🚀 Installation Guide

### Prerequisites
- Node.js ≥ 18
- Arduino IDE with ESP32 board support installed
- Firebase project with Realtime Database enabled
- Firebase Auth user created (`helmet@mining.local`)

### Dashboard Setup

```bash
# 1. Clone the repository
git clone https://github.com/mr-kumuditha/IoT-Based-Mining-Worker-Safety-Helmet-with-RFID-Zone-Tracking-and-SOS-Alerts.git
cd IoT-Based-Mining-Worker-Safety-Helmet/mining-helmet-dashboard

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Build for production
npm run build
```

### Firebase Configuration

Open the **Settings** page inside the dashboard and enter:
- API Key
- Database URL
- Firebase Auth Email + Password

Or edit `src/services/firebase/rtdb.ts` directly with your project credentials.

### Firmware Upload

1. Open Arduino IDE
2. Install required libraries:
   - `Firebase ESP Client`
   - `MFRC522`
   - `DHT sensor library`
   - `Adafruit MPU6050`
   - `LiquidCrystal I2C`
3. Set your WiFi credentials and Firebase config in the `#define` section at the top of each `.ino` file
4. Select board: **ESP32 Dev Module**
5. Upload

---

## ⚡ Hardware Setup

### Helmet ESP32 Pin Map

| Sensor / Module | ESP32 Pin |
|---|---|
| DHT11 Data | GPIO 27 |
| MQ-135 Analog | GPIO 34 |
| MPU6050 SDA | GPIO 21 |
| MPU6050 SCL | GPIO 22 |
| LCD SDA (20×4) | GPIO 21 |
| LCD SCL (20×4) | GPIO 22 |
| Buzzer | GPIO 25 |
| SOS Button | GPIO 26 |

### Zone Tracker ESP32 Pin Map

| Module | ESP32 Pin |
|---|---|
| RFID Reader A SS | GPIO 5 |
| RFID Reader A RST | GPIO 4 |
| RFID Reader B SS | GPIO 17 |
| RFID Reader B RST | GPIO 16 |
| SPI SCK | GPIO 18 |
| SPI MISO | GPIO 19 |
| SPI MOSI | GPIO 23 |
| LCD SDA (16×2) | GPIO 21 |
| LCD SCL (16×2) | GPIO 22 |

---

## 📋 Usage

### Normal Operation

1. Power on the helmet ESP32 — it connects to WiFi, syncs NTP time, and begins streaming sensor data to `/live/W-01` every **1 second**.
2. The dashboard's **Overview** page shows active worker counts, danger/warning levels, and the latest incidents.
3. When a worker scans their RFID card at a zone entrance, the **Zone Tracker** updates `/Workers/{id}/currentZone` and appends a record to `/ZonesHistory/{id}`.
4. The **Monitor** page displays live-scrolling charts for gas, temperature, and humidity.
5. If any threshold is crossed, an **Incident** is automatically created and the buzzer pattern activates on the helmet.

### SOS Alert

Press the physical SOS button on the helmet → a record is written to `/SOS/{workerId}` → the dashboard flags the emergency immediately.

### Risk Thresholds

| Sensor | Warning | Danger |
|---|---|---|
| Gas (ADC) | ≥ 3000 | ≥ 4000 |
| Temperature | ≥ 36°C | > 40°C |
| Humidity | > 76% or < 30% | > 80% or < 20% |
| Motion | — | Fall detected |

---

## 📸 Screenshots

| Dashboard Overview | Live Worker Monitor |
|---|---|
| *(Coming soon)* | *(Coming soon)* |

| Zone Tracking | Incident History |
|---|---|
| *(Coming soon)* | *(Coming soon)* |

---

## 🔮 Future Improvements

- [ ] **GPS Module** — Precise underground location tracking
- [ ] **LoRa / Mesh Networking** — Communication where WiFi is unavailable
- [ ] **Mobile App** — Push notifications for supervisors on Android/iOS
- [ ] **AI Fall Prediction** — ML model trained on accelerometer data
- [ ] **Battery Monitoring** — Track helmet battery level via ADC
- [ ] **Heart Rate Sensor** — Monitor worker biometrics
- [ ] **Multi-Helmet Support** — Expand beyond single helmet assignment
- [ ] **Telegram / WhatsApp Alerts** — Instant messaging for SOS events
- [ ] **Offline Mode** — Store data on SD card when WiFi drops

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a feature branch** — `git checkout -b feature/your-feature`
3. **Commit your changes** — `git commit -m "feat: add your feature"`
4. **Push to your branch** — `git push origin feature/your-feature`
5. **Open a Pull Request**

Please follow the existing code style and include clear commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

Developed by **Kumuditha Tharinda**  
🔗 [GitHub Profile](https://github.com/mr-kumuditha)

---

<div align="center">

⭐ **If this project helped you, please give it a star!** ⭐

Made with ❤️ for safer mines and protected workers.

</div>
