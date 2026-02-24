const DemoDB = {
    workers: {
        A1B2C3D4: { name: "Worker 01", currentZone: "Gate A", riskLevel: "SAFE", lastUpdate: Date.now() },
        E5F6G7H8: { name: "Worker 02", currentZone: "Tunnel Entry", riskLevel: "WARNING", lastUpdate: Date.now() },
    },
    incidents: []
};

// fake live updates
function tickDemo() {
    const zones = ["Gate A", "Tunnel Entry", "Storage Area", "Medical Point", "Exit Zone"];
    const risks = ["SAFE", "WARNING", "DANGER"];

    Object.keys(DemoDB.workers).forEach((id) => {
        const w = DemoDB.workers[id];
        w.currentZone = zones[Math.floor(Math.random() * zones.length)];
        w.riskLevel = risks[Math.floor(Math.random() * risks.length)];
        w.lastUpdate = Date.now();

        if (w.riskLevel === "DANGER") {
            DemoDB.incidents.unshift({
                id: "INC_" + w.lastUpdate + "_" + id,
                workerId: id,
                type: Math.random() > 0.5 ? "SOS" : "FALL",
                zone: w.currentZone,
                time: w.lastUpdate,
                status: "active"
            });
            DemoDB.incidents = DemoDB.incidents.slice(0, 6);
        }
    });
}
setInterval(tickDemo, 2500);