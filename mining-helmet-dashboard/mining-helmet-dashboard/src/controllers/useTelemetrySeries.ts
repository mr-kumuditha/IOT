import { useEffect, useState } from 'react';
import { onValue, query, limitToLast, ref } from 'firebase/database';
import { rtdb } from '../services/firebase/rtdb';
import type { TelemetryPoint } from '../models/telemetry';
import type { Worker } from '../models/worker';
import { workerRef } from '../services/firebase/refs';

// 60 points representing last 120 seconds if updating every 2 seconds
export const useTelemetrySeries = (workerId: string, maxPoints: number = 60) => {
    const [data, setData] = useState<TelemetryPoint[]>([]);
    const [loading, setLoading] = useState(true);

    // Strategy: Try to read from /Telemetry/{workerId}
    // If no Telemetry node exists, fallback to polling /Workers/{workerId}/lastSensors every 2 seconds

    useEffect(() => {
        if (!workerId) return;

        let useFallback = false;
        let fallbackInterval: ReturnType<typeof setInterval>;

        // 1. Try to connect to real Telemetry series
        const tRef = query(ref(rtdb, `Telemetry/${workerId}`), limitToLast(maxPoints));
        const unsubTelemetry = onValue(tRef, (snapshot) => {
            if (snapshot.exists()) {
                useFallback = false;
                const telemetryObj = snapshot.val();
                const points: TelemetryPoint[] = Object.keys(telemetryObj).map(key => telemetryObj[key]);
                // Sort ascending by time for chart
                points.sort((a, b) => a.timestamp - b.timestamp);
                setData(points);
                setLoading(false);
            } else {
                // Telemetry doesn't exist, we fallback
                if (!useFallback) {
                    useFallback = true;
                    setData([]);
                    setLoading(false);
                }
            }
        });

        // 2. Setup the fallback strategy if pure telemetry series is missing
        const wRef = workerRef(workerId);
        let currentWorkerSensors: Worker['lastSensors'] | null = null;

        const unsubWorker = onValue(wRef, (snapshot) => {
            if (snapshot.exists() && useFallback) {
                const w: Worker = snapshot.val();
                currentWorkerSensors = w.lastSensors;
            }
        });

        // We simulate time series state purely on frontend if no Telemetry path
        fallbackInterval = setInterval(() => {
            if (useFallback && currentWorkerSensors) {
                setData(prev => {
                    const newPoint: TelemetryPoint = {
                        timestamp: Date.now(),
                        gas: currentWorkerSensors!.gas,
                        humidity: currentWorkerSensors!.humidity,
                        temp: currentWorkerSensors!.temp,
                    };
                    const newData = [...prev, newPoint];
                    if (newData.length > maxPoints) {
                        return newData.slice(newData.length - maxPoints);
                    }
                    return newData;
                });
            }
        }, 2000);

        return () => {
            unsubTelemetry();
            unsubWorker();
            clearInterval(fallbackInterval);
        };
    }, [workerId, maxPoints]);

    return { data, loading };
};
