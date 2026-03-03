import { set, ref } from "firebase/database";
import { telemetryRef } from "./firebase/refs";
import type { TelemetryPoint } from "../models/telemetry";
import { rtdb } from "./firebase/rtdb";

export const addTelemetryPoint = async (workerId: string, data: TelemetryPoint) => {
    const pointRef = ref(rtdb, `Telemetry/${workerId}/${data.timestamp}`);
    await set(pointRef, data);
};
