import { push, set } from "firebase/database";
import { zonesHistoryRef } from "./firebase/refs";

export const addZoneHistoryEvent = async (workerId: string, zoneName: string, time: number) => {
    const newRef = push(zonesHistoryRef(workerId));
    await set(newRef, { zoneName, time });
};
