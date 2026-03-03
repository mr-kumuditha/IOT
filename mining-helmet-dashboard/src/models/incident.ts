export type IncidentType = 'SOS' | 'FALL' | 'GAS' | 'HEAT' | 'HUMIDITY';
export type IncidentStatus = 'active' | 'resolved';

export interface Incident {
    id: string;
    workerId: string;
    workerName?: string;
    type: IncidentType;
    zone: string;
    time: number;        // epoch ms
    status: IncidentStatus;
    message?: string;    // human-readable threat description
    gasValue?: number;
    tempValue?: number;
    humidityValue?: number;
}

export const INCIDENT_LABELS: Record<IncidentType, { label: string; color: 'error' | 'warning' | 'info' }> = {
    SOS: { label: '🆘 SOS Alert', color: 'error' },
    FALL: { label: '🤸 Fall Detected', color: 'error' },
    GAS: { label: '☣️ Toxic Gas', color: 'error' },
    HEAT: { label: '🌡️ High Temperature', color: 'warning' },
    HUMIDITY: { label: '💧 Humidity Danger', color: 'warning' },
};
