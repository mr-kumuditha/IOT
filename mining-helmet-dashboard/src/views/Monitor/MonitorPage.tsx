import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Grid, MenuItem, TextField,
    InputAdornment, Alert, Chip, CircularProgress,
} from '@mui/material';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DangerousIcon from '@mui/icons-material/Dangerous';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { useWorkers } from '../../controllers/useWorkers';
import { useLiveSensorData } from '../../controllers/useLiveSensorData';
import { SensorCard } from './components/SensorCard';
import {
    getGasLevel, getTempLevel, getHumidityLevel, getMotionLevel,
} from '../../config/thresholds';

// ── 3-level icon helper ────────────────────────────────────────
const LevelBadge: React.FC<{ level: 'SAFE' | 'WARNING' | 'DANGER' }> = ({ level }) => {
    if (level === 'DANGER') return <DangerousIcon sx={{ color: 'error.main', fontSize: 20 }} />;
    if (level === 'WARNING') return <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 20 }} />;
    return <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />;
};

export const MonitorPage: React.FC = () => {
    const { workers, loading: workersLoading } = useWorkers();
    const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');

    const effectiveId = useMemo(() => {
        if (selectedWorkerId) return selectedWorkerId;
        return workers[0]?.id ?? '';
    }, [selectedWorkerId, workers]);

    // Read from /live/W-01 — 1-second realtime feed
    const { liveData, chartSeries, loading: liveLoading } = useLiveSensorData(effectiveId, 60);

    if (workersLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    // Sensor levels from live data
    const gasLevel = liveData ? getGasLevel(liveData.gas) : 'SAFE';
    const tempLevel = liveData ? getTempLevel(liveData.temp) : 'SAFE';
    const humidityLevel = liveData ? getHumidityLevel(liveData.humidity) : 'SAFE';
    const motionLevel = getMotionLevel(liveData?.motion);

    const lastUpdate = liveData?.timestamp;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>

            {/* ── Header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <MonitorHeartIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                    <Box>
                        <Typography variant="h4" fontWeight="bold">Sensor Monitor</Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            1-second realtime feed · MQ-135 · DHT11 · MPU6050
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Live pulse chip */}
                    {liveData && (
                        <Chip
                            icon={<MonitorHeartIcon sx={{ fontSize: '1rem !important' }} />}
                            label={`Live · ${liveData.riskLevel}`}
                            color={
                                liveData.riskLevel === 'DANGER' ? 'error' :
                                    liveData.riskLevel === 'WARNING' ? 'warning' : 'success'
                            }
                            size="small"
                            sx={{ fontWeight: 700 }}
                        />
                    )}

                    {/* Worker selector */}
                    <TextField
                        select
                        size="small"
                        label="Worker"
                        value={selectedWorkerId}
                        onChange={e => setSelectedWorkerId(e.target.value)}
                        sx={{ minWidth: 200 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <MonitorHeartIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    >
                        <MenuItem value="">Auto-select</MenuItem>
                        {workers.map(w => (
                            <MenuItem key={w.id} value={w.id}>
                                {w.name ?? w.id} ({w.id})
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>
            </Box>

            {/* No data */}
            {!liveData && !liveLoading && (
                <Alert severity="info">
                    No live data for this worker yet. Make sure the ESP32 is running and writing to <code>/live/{effectiveId}</code>.
                </Alert>
            )}

            {liveLoading && !liveData && (
                <Alert severity="info" icon={<CircularProgress size={18} />}>
                    Waiting for first data packet from helmet…
                </Alert>
            )}

            {/* ── Sensor cards grid ── */}
            {liveData && (
                <Grid container spacing={3}>

                    {/* Gas (MQ-135) */}
                    <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                        <SensorCard
                            title="Gas Monitor (MQ-135)"
                            unit="ADC"
                            displayValue={`${liveData.gas}`}
                            level={gasLevel}
                            min={0}
                            max={4095}
                            chartData={chartSeries}
                            chartKey="gas"
                            lastUpdate={lastUpdate}
                            thresholds={{ safe: '<3000', warning: '3K-4K', danger: '>4000' }}
                        />
                    </Grid>

                    {/* Temperature (DHT11) */}
                    <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                        <SensorCard
                            title="Temperature (DHT11)"
                            unit="°C"
                            displayValue={`${liveData.temp.toFixed(1)}°`}
                            level={tempLevel}
                            min={0}
                            max={60}
                            chartData={chartSeries}
                            chartKey="temp"
                            lastUpdate={lastUpdate}
                            thresholds={{ safe: '<36°', warning: '36°-40°', danger: '>40°' }}
                        />
                    </Grid>

                    {/* Humidity (DHT11) */}
                    <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                        <SensorCard
                            title="Humidity (DHT11)"
                            unit="%"
                            displayValue={`${liveData.humidity.toFixed(0)}%`}
                            level={humidityLevel}
                            min={0}
                            max={100}
                            chartData={chartSeries}
                            chartKey="humidity"
                            lastUpdate={lastUpdate}
                            thresholds={{ safe: '<76%', warning: '76%-80%', danger: '>80%' }}
                        />
                    </Grid>

                    {/* Motion / Fall (MPU6050) */}
                    <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                        <Box
                            sx={{
                                height: '100%',
                                border: theme => `2px solid ${liveData.motion ? theme.palette.error.light : theme.palette.divider}`,
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                transition: 'border-color 0.4s',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" fontWeight={700}>
                                    Motion / Fall (MPU6050)
                                </Typography>
                                <Box
                                    component="span"
                                    sx={{
                                        px: 1.5, py: 0.4, borderRadius: 1,
                                        bgcolor: motionLevel === 'DANGER' ? 'error.main' : 'success.main',
                                        color: '#fff', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 0.5,
                                    }}
                                >
                                    {motionLevel}
                                </Box>
                            </Box>

                            {/* Big status + icon */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography
                                    variant="h2" fontWeight={800}
                                    sx={{ color: motionLevel === 'DANGER' ? 'error.main' : 'success.main', lineHeight: 1 }}
                                >
                                    {liveData.motion ? 'FALL' : 'OK'}
                                </Typography>

                                {/* 3-level symbol */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                                    {liveData.motion
                                        ? <DangerousIcon sx={{ color: 'error.main', fontSize: 36 }} />
                                        : <CheckCircleIcon sx={{ color: 'success.main', fontSize: 36 }} />
                                    }
                                    <DirectionsRunIcon
                                        sx={{
                                            color: liveData.motion ? 'error.main' : 'text.disabled',
                                            fontSize: 20,
                                        }}
                                    />
                                </Box>
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                                {liveData.motion
                                    ? '⚠️ Fall / sudden motion detected! Immediate check required.'
                                    : '✓ No abnormal motion detected.'}
                            </Typography>

                            {lastUpdate && (
                                <Typography variant="caption" color="text.secondary">
                                    Last updated: {new Date(lastUpdate).toLocaleTimeString()}
                                </Typography>
                            )}

                            {/* 3 level indicator row */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                                {(['SAFE', 'WARNING', 'DANGER'] as const).map(lvl => (
                                    <Box
                                        key={lvl}
                                        sx={{
                                            flex: 1, textAlign: 'center', py: 0.5, borderRadius: 1,
                                            bgcolor: motionLevel === lvl
                                                ? (lvl === 'DANGER' ? 'error.main' : lvl === 'WARNING' ? 'warning.main' : 'success.main')
                                                : 'action.hover',
                                            color: motionLevel === lvl ? '#fff' : 'text.disabled',
                                            fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.5,
                                        }}
                                    >
                                        <LevelBadge level={lvl} />
                                        <Typography variant="caption" display="block" fontWeight={700}>{lvl}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};
