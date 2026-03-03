import { useEffect, useState, useRef } from 'react';
import { onValue, ref } from 'firebase/database';
import { rtdb } from '../services/firebase/rtdb';
import type { TelemetryPoint } from '../models/telemetry';

export interface LiveSensorData {
    gas: number;
    temp: number;
    humidity: number;
    motion: boolean;
    riskLevel: string;
    workerId: string;
    workerName: string;
    timestamp: number;
}

/**
 * Subscribes to /live/{workerId} — the 1-second realtime feed from the ESP32.
 * Also maintains a rolling chart series of up to maxPoints readings.
 */
export const useLiveSensorData = (workerId: string, maxPoints = 60) => {
    const [liveData, setLiveData] = useState<LiveSensorData | null>(null);
    const [chartSeries, setChartSeries] = useState<TelemetryPoint[]>([]);
    const [loading, setLoading] = useState(true);

    // Store latest data in ref so the rolling series appender always has freshest value
    const liveRef = useRef<LiveSensorData | null>(null);

    useEffect(() => {
        if (!workerId) return;

        const livePath = ref(rtdb, `live/${workerId}`);

        const unsub = onValue(livePath, (snapshot) => {
            setLoading(false);

            if (!snapshot.exists()) {
                setLiveData(null);
                return;
            }

            const data = snapshot.val() as LiveSensorData;
            liveRef.current = data;
            setLiveData(data);

            // Append to rolling chart series
            setChartSeries(prev => {
                const point: TelemetryPoint = {
                    timestamp: data.timestamp ?? Date.now(),
                    gas: data.gas,
                    temp: data.temp,
                    humidity: data.humidity,
                };
                const next = [...prev, point];
                return next.length > maxPoints
                    ? next.slice(next.length - maxPoints)
                    : next;
            });
        });

        return () => unsub();
    }, [workerId, maxPoints]);

    return { liveData, chartSeries, loading };
};
