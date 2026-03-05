import { useEffect, useState } from 'react';
import { onValue } from 'firebase/database';
import { workersRef } from '../services/firebase/refs';
import type { Worker } from '../models/worker';

// Timestamps smaller than this are Arduino millis() fallback, not real epoch
const MIN_VALID_EPOCH_MS = 1_577_836_800_000; // Jan 1 2020 00:00 UTC

const normalizeTimestamp = (ts?: string | number): number | undefined => {
    if (!ts) return undefined;

    if (typeof ts === 'string') {
        const d = new Date(ts.replace(' ', 'T') + '+05:30');
        const timeMs = d.getTime();
        return isNaN(timeMs) ? undefined : timeMs;
    }

    if (typeof ts === 'number') {
        if (ts < MIN_VALID_EPOCH_MS) return undefined;
        return ts;
    }

    return undefined;
};

export const useWorkers = () => {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onValue(workersRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const workersArray: Worker[] = Object.keys(data).map((key) => ({
                    ...data[key],
                    id: key,
                    // Normalize bad timestamps from Arduino millis() fallback
                    lastUpdate: normalizeTimestamp(data[key].lastUpdate),
                }));
                // Sort by ID
                workersArray.sort((a, b) => a.id.localeCompare(b.id));
                setWorkers(workersArray);
            } else {
                setWorkers([]);
            }
            setLoading(false);
        }, (error) => {
            console.error('Error fetching workers:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { workers, loading };
};
