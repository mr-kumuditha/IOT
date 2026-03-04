import { get, set, ref, remove } from 'firebase/database';
import { rtdb } from './firebase/rtdb';

export interface CardMapping {
    uid: string;
    workerId: string;
    workerName: string;
    role: string;
}

export const getCardsRef = () => ref(rtdb, 'Cards');
export const getCardRef = (uid: string) => ref(rtdb, `Cards/${uid}`);

export const getAllCards = async (): Promise<CardMapping[]> => {
    const snapshot = await get(getCardsRef());
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    return Object.keys(data).map(uid => ({
        uid,
        ...data[uid]
    }));
};

export const linkCardToWorker = async (uid: string, workerId: string, workerName: string, role: string) => {
    // Format UID properly (e.g. 51:2D:A9:02)
    const formattedUid = uid.toUpperCase().replace(/[^A-F0-9:]/g, '');
    await set(getCardRef(formattedUid), {
        workerId,
        workerName,
        role
    });
};

export const deleteCardMapping = async (uid: string) => {
    await remove(getCardRef(uid));
};
