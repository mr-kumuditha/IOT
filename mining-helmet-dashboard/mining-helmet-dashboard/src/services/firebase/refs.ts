import { ref } from "firebase/database";
import { rtdb } from "./rtdb";

export const workersRef = ref(rtdb, 'Workers');
export const workerRef = (workerId: string) => ref(rtdb, `Workers/${workerId}`);

export const incidentsRef = ref(rtdb, 'Incidents');
export const incidentRef = (incidentId: string) => ref(rtdb, `Incidents/${incidentId}`);

export const zonesHistoryRef = (workerId: string) => ref(rtdb, `ZonesHistory/${workerId}`);

export const telemetryRef = (workerId: string) => ref(rtdb, `Telemetry/${workerId}`);
