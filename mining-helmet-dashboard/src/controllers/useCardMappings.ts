import { useState, useEffect } from 'react';
import { onValue } from 'firebase/database';
import { getCardsRef, type CardMapping } from '../services/cards.service';

export const useCardMappings = () => {
    const [cards, setCards] = useState<CardMapping[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onValue(getCardsRef(), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const cardsArray = Object.keys(data).map(uid => ({
                    uid,
                    ...data[uid],
                }));
                // Sort by workerName
                cardsArray.sort((a, b) => a.workerName.localeCompare(b.workerName));
                setCards(cardsArray);
            } else {
                setCards([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { cards, loading };
};
