import { useEffect, useRef } from 'react';
import { onValue, ref, set, push } from 'firebase/database';
import { rtdb } from '../services/firebase/rtdb';
import {
    getGasLevel, getTempLevel, getHumidityLevel, getMotionLevel,
} from '../config/thresholds';
import type { LiveSensorData } from './useLiveSensorData';

/**
 * Runs as a background service inside DashboardLayout.
 * Watches /live/W-01 and /system/helmetAssignment.
 * On every sensor update:
 *  1. Computes the overall riskLevel from all sensors
 *  2. Writes it to /Workers/{assignedWorkerId}/riskLevel
 *  3. If level is WARNING or DANGER and the type changed → creates an incident
 */
export const useRiskPropagation = () => {
    const assignedRef = useRef<string>('W-01');
    const lastRiskRef = useRef<string>('SAFE');
    const workerNameRef = useRef<string>('');
    const workerZoneRef = useRef<string>('');

    useEffect(() => {
        // Track helmet assignment
        const assignmentUnsub = onValue(ref(rtdb, 'system/helmetAssignment'), snap => {
            assignedRef.current = snap.exists() ? snap.val() : 'W-01';
        });

        // Track assigned worker's name and zone (for incident records)
        const workerInfoUnsub = onValue(ref(rtdb, `Workers/${assignedRef.current}`), snap => {
            if (snap.exists()) {
                const d = snap.val();
                workerNameRef.current = d.name ?? assignedRef.current;
                workerZoneRef.current = d.currentZone ?? '';
            }
        });

        // Main: watch live data from the helmet (always writes to W-01 path)
        const liveUnsub = onValue(ref(rtdb, 'live/W-01'), (snap) => {
            if (!snap.exists()) return;
            const data = snap.val() as LiveSensorData;

            // Native ESP32 risk level assessment
            const overall = data.riskLevel || 'SAFE';

            const assignedId = assignedRef.current;

            // Write risk level to the assigned worker
            set(ref(rtdb, `Workers/${assignedId}/riskLevel`), overall).catch(() => { });

            // If level worsened, push an incident
            if (overall !== 'SAFE' && overall !== lastRiskRef.current) {
                const ts = data.timestamp ?? Date.now();
                const workerName = workerNameRef.current || assignedId;
                const zone = workerZoneRef.current || 'Unknown Zone';

                const gasLevel = getGasLevel(data.gas ?? 0);
                const tempLevel = getTempLevel(data.temp ?? 0);
                const humidityLevel = getHumidityLevel(data.humidity ?? 50);
                const motionLevel = getMotionLevel(data.motion);

                // Determine which sensor triggered it
                let type: string = 'GAS';
                let message = '';
                if (motionLevel === 'DANGER') {
                    type = 'FALL';
                    message = 'Fall detected by MPU6050 accelerometer';
                } else if (gasLevel === overall) {
                    type = 'GAS';
                    message = `Toxic gas level: ${data.gas} ADC (threshold: 3000)`;
                } else if (tempLevel === overall) {
                    type = 'HEAT';
                    message = `High temperature: ${data.temp?.toFixed(1)}°C (threshold: 36°C)`;
                } else if (humidityLevel === overall) {
                    type = 'HUMIDITY';
                    message = `Humidity out of range: ${data.humidity?.toFixed(0)}%`;
                }

                push(ref(rtdb, 'Incidents'), {
                    workerId: assignedId,
                    workerName: workerName,
                    type,
                    zone,
                    time: ts,
                    status: 'active',
                    message,
                    gasValue: data.gas,
                    tempValue: data.temp,
                    humidityValue: data.humidity,
                }).catch(() => { });
            }

            lastRiskRef.current = overall;
        });

        return () => {
            assignmentUnsub();
            workerInfoUnsub();
            liveUnsub();
        };
    }, []);
};
