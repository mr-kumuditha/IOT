import { useEffect, useState } from 'react';
import { onValue, query, limitToLast } from 'firebase/database';
import { workerRef, zonesHistoryRef } from '../services/firebase/refs';
import type { Worker } from '../models/worker';
import type { ZoneHistoryEvent } from '../models/zoneHistory';

export const useWorkerDetails = (workerId: string) => {
    const [worker, setWorker] = useState<Worker | null>(null);
    const [zoneHistory, setZoneHistory] = useState<ZoneHistoryEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!workerId) return;

        // Listen to worker details
        const wRef = workerRef(workerId);
        const unsubWorker = onValue(wRef, (snapshot) => {
            if (snapshot.exists()) {
                setWorker({ ...snapshot.val(), id: workerId });
            } else {
                setWorker(null);
            }
            setLoading(false);
        });

        // Listen to latest zone history
        const zRef = query(zonesHistoryRef(workerId), limitToLast(20));
        const unsubZones = onValue(zRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const history: ZoneHistoryEvent[] = Object.keys(data).map(key => data[key]);
                history.sort((a, b) => b.time - a.time); // newest first
                setZoneHistory(history);
            } else {
                setZoneHistory([]);
            }
        });

        return () => {
            unsubWorker();
            unsubZones();
        };
    }, [workerId]);

    return { worker, zoneHistory, loading };
};
