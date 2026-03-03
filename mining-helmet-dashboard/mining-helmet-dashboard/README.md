# ⛏️ Mining Worker Safety Helmet — IoT Dashboard

A modern, premium React dashboard for real-time monitoring of mining site workers using RFID zone tracking, SOS detection, and environmental sensor data.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| UI | Material UI v7 + MUI X Charts v8 |
| Database | Firebase Realtime Database (RTDB) |
| Routing | React Router v7 |
| Date formatting | date-fns |

---

## 📁 Project Structure (MVC-ish)

```
src/
  app/            → App.tsx, routes.tsx, theme.ts, layout/
  models/         → TypeScript data types (worker, incident, telemetry, zoneHistory)
  services/       → Firebase read/write functions
  controllers/    → Custom React hooks (useWorkers, useIncidents, etc.)
  views/          → Page components (Dashboard, Workers, WorkerDetails, Incidents, Settings)
  components/     → Shared UI widgets (StatusChip, StatCard, LoadingState, EmptyState)
  utils/          → Formatting helpers
  config/         → env.ts with Firebase config
```

---

## 🚀 Setup & Run

### 1. Install dependencies

```bash
cd mining-helmet-dashboard
npm install --legacy-peer-deps
```

> Use `--legacy-peer-deps` if you encounter peer dependency conflicts.

### 2. Firebase Configuration

Firebase config is already included in `src/config/env.ts`. If you need to update it, edit the file directly:

```ts
// src/config/env.ts
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  ...
};
```

> ⚠️ For production, move secrets to a `.env` file and access via `import.meta.env.VITE_*`.

### 3. Set Firebase RTDB Rules (for classroom demo)

In the Firebase Console → Realtime Database → Rules, set:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> ⚠️ Use auth rules in production.

### 4. Seed Database with Sample Data

Install `tsx` and run the seed script once:

```bash
npm install -D tsx
npx tsx scripts/seed.ts
```

This creates:
- 4 sample workers with sensor readings
- 3 incidents (2 active, 1 resolved)
- Zone history for W-01
- 60 telemetry time-series points for W-01

### 5. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 📸 Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | KPI cards, workers table, latest incidents |
| `/workers` | Full list with search + zone/risk filters |
| `/workers/:workerId` | Profile card, zone timeline, live sensor charts |
| `/incidents` | List with filters and "Mark Resolved" action |
| `/settings` | Firebase status, auth mode toggle, Telegram bot config |

---

## 📊 RTDB Data Structure

```json
{
  "Workers": {
    "W-01": {
      "name": "Ahmad bin Razali",
      "role": "Driller",
      "currentZone": "Zone A - Shaft 1",
      "riskLevel": "SAFE",
      "lastUpdate": 1719830000000,
      "lastSensors": { "temp": 28.5, "humidity": 62, "gas": 120, "motion": true }
    }
  },
  "ZonesHistory": {
    "W-01": {
      "-abc123": { "zoneName": "Zone A - Shaft 1", "time": 1719830000000 }
    }
  },
  "Incidents": {
    "-xyz789": {
      "workerId": "W-03",
      "type": "GAS",
      "zone": "Zone C - Access Tunnel",
      "time": 1719826400000,
      "status": "active"
    }
  },
  "Telemetry": {
    "W-01": {
      "1719830000000": { "timestamp": 1719830000000, "gas": 135, "humidity": 64, "temp": 29.1 }
    }
  }
}
```

---

## 🔥 Real-time Behavior

- **Workers, Incidents, Zone History**: use `onValue()` from Firebase RTDB — triggers once immediately and again on every update.
- **Sensor Charts**: Reads from `/Telemetry/{workerId}` path (true time-series). If ESP32 hasn't written there yet, the dashboard automatically falls back to polling `/Workers/{workerId}/lastSensors` every 2 seconds and builds a rolling window chart in browser state.

---

## 🔐 Authentication Mode

- The Settings page has a toggle for Auth Mode.
- When **disabled** (default): dashboard runs without login — perfect for classroom demos.
- When **enabled**: You must configure Firebase Auth (Email/Password) in the Firebase Console under Authentication → Sign-in Method.

---

## 🚢 Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init hosting
firebase login
firebase init hosting

# Build the project
npm run build

# Deploy
firebase deploy --only hosting
```

Set the public directory to `dist` and configure as a single-page app when prompted.

---

## 📡 ESP32 Integration

For the ESP32 to write telemetry, push data to this path:

```
/Telemetry/{workerId}/{timestamp}
```

Example Arduino/C++ snippet (using Firebase Arduino SDK):
```cpp
String path = "/Telemetry/W-01/" + String(millis());
FirebaseJson json;
json.set("timestamp", (int)time(nullptr) * 1000);
json.set("gas", gasValue);
json.set("humidity", humValue);
json.set("temp", tempValue);
Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json);
```

---

## 📚 References

- [Firebase Web SDK v9 Modular Docs](https://firebase.google.com/docs/web/setup)
- [Firebase RTDB `onValue` Reference](https://firebase.google.com/docs/database/web/read-and-write#listen_for_value_events)
- [MUI Material v7 Components](https://mui.com/material-ui/all-components/)
- [MUI X Charts v8 LineChart](https://mui.com/x/react-charts/lines/)
