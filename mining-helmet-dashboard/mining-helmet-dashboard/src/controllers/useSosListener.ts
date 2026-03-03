import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { rtdb } from '../services/firebase/rtdb';

export interface SosEvent {
    workerId: string;
    workerName: string;
    time: number;      // epoch ms
    active: boolean;
}

/**
 * Listens to /SOS node in Firebase.
 * Returns the latest active SOS event (if any).
 * The firmware writes to /SOS/{workerId} when the helmet button is pressed.
 */
export const useSosListener = () => {
    const [sosEvent, setSosEvent] = useState<SosEvent | null>(null);

    useEffect(() => {
        const sosRef = ref(rtdb, 'SOS');

        const unsub = onValue(sosRef, (snapshot) => {
            if (!snapshot.exists()) {
                setSosEvent(null);
                return;
            }

            const data = snapshot.val();

            // Find any worker with active SOS, pick the most recent
            let latest: SosEvent | null = null;
            Object.keys(data).forEach(workerId => {
                const entry = data[workerId];
                if (entry?.active) {
                    if (!latest || entry.time > latest.time) {
                        latest = {
                            workerId,
                            workerName: entry.workerName ?? workerId,
                            time: entry.time,
                            active: true,
                        };
                    }
                }
            });

            setSosEvent(latest);
        });

        return () => unsub();
    }, []);

    return { sosEvent };
};
