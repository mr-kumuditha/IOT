export type ZoneInfo = {
    zoneName: string;
    time: number;
};

export type SensorData = {
    temp: number;
    humidity: number;
    gas: number;
    motion: boolean;
};

export type WorkerRiskLevel = 'SAFE' | 'WARNING' | 'DANGER' | 'UNKNOWN';

export interface Worker {
    id: string; // The workerId from the key
    name: string;
    role: string;
    currentZone: string;
    riskLevel: WorkerRiskLevel;
    lastUpdate?: number;
    lastSensors?: SensorData;
}
