/**
 * Clears all mock/seed data from Firebase RTDB.
 * Run with:  npx tsx scripts/clear-mock.ts
 *
 * After running, the database will only contain real data
 * pushed by the ESP32 firmware (W-01 → "Helmet Unit 01" etc.)
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, remove } from "firebase/database";

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

async function clearMock() {
    console.log("🗑️  Clearing mock/seed data from Firebase...\n");

    const paths = [
        "Workers",          // all seed workers (fake names)
        "ZonesHistory",     // all seed zone history
        "Incidents",        // all seed incidents
        "Telemetry",        // all seed telemetry
        "SOS",              // any test SOS events
    ];

    for (const path of paths) {
        await remove(ref(db, path));
        console.log(`  ✅ Cleared  /${path}`);
    }

    console.log("\n✨ Done! Database is clean.");
    console.log("   Power on your ESP32 helmet — it will repopulate /Workers/W-01 automatically.");
    process.exit(0);
}

clearMock().catch(err => {
    console.error("❌ Failed:", err);
    process.exit(1);
});
