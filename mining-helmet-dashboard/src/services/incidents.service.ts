import { update, set, push, remove } from "firebase/database";
import { incidentsRef, incidentRef } from "./firebase/refs";
import type { Incident } from "../models/incident";

export const createIncident = async (data: Omit<Incident, 'id'>) => {
    const newRef = push(incidentsRef);
    if (newRef.key) {
        await set(newRef, { ...data, id: newRef.key });
        return newRef.key;
    }
    return null;
};

export const updateIncidentStatus = async (incidentId: string, status: 'active' | 'resolved') => {
    await update(incidentRef(incidentId), { status });
};

// Permanently remove a resolved incident from Firebase
export const deleteIncident = async (incidentId: string) => {
    await remove(incidentRef(incidentId));
};
