/**
 * Seed script to populate Firebase RTDB with sample data.
 * Run once to populate the database:
 *    npx tsx scripts/seed.ts
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCSt1mxgNcs8WciD_imKP3jKKqg8YoWgWI",
    authDomain: "iot-based-mining-helmet.firebaseapp.com",
    databaseURL: "https://iot-based-mining-helmet-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "iot-based-mining-helmet",
    storageBucket: "iot-based-mining-helmet.firebasestorage.app",
    messagingSenderId: "358910961991",
    appId: "1:358910961991:web:cd27b93871d447189c8462",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function seed() {
    console.log("Seeding database...");

    const now = Date.now();
    const workers = {
        "W-01": {
            name: "Ahmad bin Razali",
            role: "Driller",
            currentZone: "Zone A - Shaft 1",
            riskLevel: "SAFE",
            lastUpdate: now,
            lastSensors: { temp: 28.5, humidity: 62, gas: 120, motion: true },
        },
        "W-02": {
            name: "Rajan Kumar",
            role: "Blasting Engineer",
            currentZone: "Zone B - Level 3",
            riskLevel: "WARNING",
            lastUpdate: now,
            lastSensors: { temp: 33.1, humidity: 75, gas: 250, motion: true },
        },
        "W-03": {
            name: "Lim Wei Xian",
            role: "Surveyor",
            currentZone: "Zone C - Access Tunnel",
            riskLevel: "DANGER",
            lastUpdate: now,
            lastSensors: { temp: 36.0, humidity: 88, gas: 420, motion: false },
        },
        "W-04": {
            name: "Muthu Selvam",
            role: "Machine Operator",
            currentZone: "Zone A - Shaft 1",
            riskLevel: "SAFE",
            lastUpdate: now,
            lastSensors: { temp: 29.0, humidity: 65, gas: 100, motion: true },
        },
    };

    for (const [id, data] of Object.entries(workers)) {
        await set(ref(db, `Workers/${id}`), data);
        console.log(`Added worker: ${id}`);
    }

    // Zone history for W-01
    await push(ref(db, "ZonesHistory/W-01"), { zoneName: "Zone A - Shaft 1", time: now - 1800000 });
    await push(ref(db, "ZonesHistory/W-01"), { zoneName: "Zone B - Level 3", time: now - 900000 });
    await push(ref(db, "ZonesHistory/W-01"), { zoneName: "Zone A - Shaft 1", time: now });

    // Incidents
    const incidents = [
        { workerId: "W-03", type: "GAS", zone: "Zone C - Access Tunnel", time: now - 3600000, status: "active" },
        { workerId: "W-02", type: "HEAT", zone: "Zone B - Level 3", time: now - 1800000, status: "active" },
        { workerId: "W-01", type: "SOS", zone: "Zone A - Shaft 1", time: now - 7200000, status: "resolved" },
    ];

    for (const incident of incidents) {
        const newRef = push(ref(db, "Incidents"));
        await set(newRef, { ...incident, id: newRef.key });
        console.log(`Added incident: ${newRef.key}`);
    }

    // Telemetry for W-01 (60 points)
    console.log("Seeding telemetry for W-01...");
    for (let i = 59; i >= 0; i--) {
        const ts = now - i * 2000;
        await set(ref(db, `Telemetry/W-01/${ts}`), {
            timestamp: ts,
            gas: Math.round(100 + Math.random() * 50),
            humidity: Math.round(60 + Math.random() * 15),
            temp: parseFloat((28 + Math.random() * 3).toFixed(1)),
        });
    }

    console.log("✅ Seed complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
