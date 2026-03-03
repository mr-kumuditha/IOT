import { useEffect, useState } from 'react';
import { onValue, ref, set } from 'firebase/database';
import { rtdb } from '../services/firebase/rtdb';

const ASSIGNMENT_PATH = 'system/helmetAssignment';

export const useHelmetAssignment = () => {
    const [assignedWorkerId, setAssignedWorkerId] = useState<string>('W-01');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const r = ref(rtdb, ASSIGNMENT_PATH);
        const unsub = onValue(r, snap => {
            setAssignedWorkerId(snap.exists() ? snap.val() : 'W-01');
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const assignHelmet = async (workerId: string) => {
        await set(ref(rtdb, ASSIGNMENT_PATH), workerId);
    };

    return { assignedWorkerId, assignHelmet, loading };
};
