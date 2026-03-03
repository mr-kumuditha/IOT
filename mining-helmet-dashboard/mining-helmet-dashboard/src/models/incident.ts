export type IncidentType = 'SOS' | 'FALL' | 'GAS' | 'HEAT';
export type IncidentStatus = 'active' | 'resolved';

export interface Incident {
    id: string; // key
    workerId: string;
    type: IncidentType;
    zone: string;
    time: number;
    status: IncidentStatus;
}
