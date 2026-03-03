import { useEffect, useState } from 'react';
import { onValue } from 'firebase/database';
import { workersRef } from '../services/firebase/refs';
import type { Worker } from '../models/worker';

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
                }));
                setWorkers(workersArray);
            } else {
                setWorkers([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching workers:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { workers, loading };
};
