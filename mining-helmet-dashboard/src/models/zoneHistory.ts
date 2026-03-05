export interface ZoneHistoryEvent {
    zone: string;       // "Zone A" or "Zone B"  (written by firmware as "zone")
    ts: number;         // epoch ms               (written by firmware as "ts")
    workerId: string;
    workerName: string;
    uid: string;        // raw RFID UID
    time?: string;      // Human-readable time from ESP
}
