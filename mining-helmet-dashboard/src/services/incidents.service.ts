import { update, set, push } from "firebase/database";
import { incidentsRef, incidentRef } from "./firebase/refs";
import type { Incident } from "../models/incident";

export const createIncident = async (data: Omit<Incident, 'id'>) => {
    const newIncidentRef = push(incidentsRef);
    if (newIncidentRef.key) {
        const newIncident: Incident = { ...data, id: newIncidentRef.key };
        await set(newIncidentRef, newIncident);
        return newIncidentRef.key;
    }
    return null;
};

export const updateIncidentStatus = async (incidentId: string, status: 'active' | 'resolved') => {
    await update(incidentRef(incidentId), { status });
};
