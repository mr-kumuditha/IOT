import React from 'react';
import { Card, CardContent, CardHeader, Divider, Box, useTheme, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import type { TelemetryPoint } from '../../../models/telemetry';
import { formatTime } from '../../../utils/time';

interface SensorChartsProps {
    data: TelemetryPoint[];
}

export const SensorCharts: React.FC<SensorChartsProps> = ({ data }) => {
    const theme = useTheme();

    if (data.length === 0) {
        return (
            <Card>
                <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                    <Typography color="text.secondary">Waiting for telemetry data...</Typography>
                </CardContent>
            </Card>
        );
    }

    const timestamps = data.map(d => new Date(d.timestamp));
    const gasData = data.map(d => d.gas);
    const tempData = data.map(d => d.temp);
    const humData = data.map(d => d.humidity);

    return (
        <Card>
            <CardHeader title="Live Environmental Telemetry" subheader="Real-time multi-sensor readings" />
            <Divider />
            <CardContent>
                <Box sx={{ width: '100%', height: 400 }}>
                    <LineChart
                        xAxis={[{
                            data: timestamps,
                            scaleType: 'time',
                            valueFormatter: (date) => formatTime(date.getTime()),
                            tickNumber: 5
                        }]}
                        series={[
                            {
                                id: 'Gas',
                                data: gasData,
                                label: 'Gas Level (ppm)',
                                color: theme.palette.error.main,
                                showMark: false,
                                curve: 'catmullRom'
                            },
                            {
                                id: 'Temp',
                                data: tempData,
                                label: 'Temp (°C)',
                                color: theme.palette.warning.main,
                                showMark: false,
                                curve: 'catmullRom'
                            },
                            {
                                id: 'Humidity',
                                data: humData,
                                label: 'Humidity (%)',
                                color: theme.palette.info.main,
                                showMark: false,
                                curve: 'catmullRom'
                            }
                        ]}
                        margin={{ top: 50, right: 30, left: 40, bottom: 30 }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
};
