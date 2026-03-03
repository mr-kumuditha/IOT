import { useEffect, useState } from 'react';
import { onValue } from 'firebase/database';
import { incidentsRef } from '../services/firebase/refs';
import type { Incident } from '../models/incident';

export const useIncidents = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onValue(incidentsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const incidentsArray: Incident[] = Object.keys(data).map((key) => ({
                    ...data[key],
                    id: key,
                }));
                // Sort descending by time
                incidentsArray.sort((a, b) => b.time - a.time);
                setIncidents(incidentsArray);
            } else {
                setIncidents([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching incidents:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { incidents, loading };
};
