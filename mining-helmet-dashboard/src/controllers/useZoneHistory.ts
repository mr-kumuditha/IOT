import { useEffect, useState } from 'react';
import { onValue, query, limitToLast } from 'firebase/database';
import { zonesHistoryRef } from '../services/firebase/refs';

export interface ZoneEvent {
    id: string;
    zone: string;
    uid: string;
    workerId: string;
    workerName: string;
    ts: number;
    time?: string;
}

export const useZoneHistory = (workerId: string, limit = 20) => {
    const [events, setEvents] = useState<ZoneEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!workerId) return;
        const q = query(zonesHistoryRef(workerId), limitToLast(limit));
        const unsub = onValue(q, snap => {
            const arr: ZoneEvent[] = [];
            snap.forEach(child => {
                arr.unshift({ id: child.key!, ...child.val() });
            });
            setEvents(arr);
            setLoading(false);
        });
        return () => unsub();
    }, [workerId, limit]);

    return { events, loading };
};
