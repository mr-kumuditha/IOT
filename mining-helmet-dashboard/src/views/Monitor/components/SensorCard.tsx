import React from 'react';
import {
    Card, CardContent, CardHeader, Divider, Box, Typography, Chip,
    LinearProgress, useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DangerousIcon from '@mui/icons-material/Dangerous';
import { LineChart } from '@mui/x-charts/LineChart';
import type { TelemetryPoint } from '../../../models/telemetry';
import type { SensorLevel } from '../../../config/thresholds';

interface SensorCardProps {
    title: string;
    unit: string;
    displayValue: string;
    level: SensorLevel;
    min: number;
    max: number;
    chartData: TelemetryPoint[];
    chartKey: keyof Pick<TelemetryPoint, 'gas' | 'humidity' | 'temp'>;
    lastUpdate?: number;
    thresholds: {
        safe: string;
        warning: string;
        danger: string;
    };
}

// ── Level → chip color ────────────────────────────────────────
const levelChipColor = (level: SensorLevel) => {
    if (level === 'DANGER') return 'error' as const;
    if (level === 'WARNING') return 'warning' as const;
    return 'success' as const;
};

// ── Level → icon ──────────────────────────────────────────────
const LevelIcon: React.FC<{ level: SensorLevel; size?: number }> = ({ level, size = 28 }) => {
    const base = { fontSize: size };
    if (level === 'DANGER') return <DangerousIcon sx={{ ...base }} />;
    if (level === 'WARNING') return <WarningAmberIcon sx={{ ...base }} />;
    return <CheckCircleIcon sx={{ ...base }} />;
};

// ── Level → label + description ───────────────────────────────
const levelMeta = (level: SensorLevel) => {
    if (level === 'DANGER') return { label: 'DANGER', desc: 'Immediate action required!' };
    if (level === 'WARNING') return { label: 'WARNING', desc: 'Monitor carefully' };
    return { label: 'SAFE', desc: 'Normal operating range' };
};

export const SensorCard: React.FC<SensorCardProps> = ({
    title, unit, displayValue, level, min, max, chartData, chartKey, lastUpdate, thresholds
}) => {
    const theme = useTheme();

    const timestamps = chartData.map(d => new Date(d.timestamp));
    const values = chartData.map(d => d[chartKey] as number);

    const numericValue = values.length > 0 ? values[values.length - 1] : 0;
    const normalized = Math.min(100, Math.max(0, ((numericValue - min) / (max - min)) * 100));

    const accentColor =
        level === 'DANGER' ? theme.palette.error.main :
            level === 'WARNING' ? theme.palette.warning.main :
                theme.palette.success.main;

    const chartColor =
        level === 'DANGER' ? theme.palette.error.main :
            level === 'WARNING' ? theme.palette.warning.main :
                theme.palette.info.main;

    const borderColor =
        level === 'DANGER' ? theme.palette.error.main :
            level === 'WARNING' ? theme.palette.warning.main :
                theme.palette.divider;

    const meta = levelMeta(level);

    return (
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: `2px solid`,
            borderColor: level === 'SAFE' ? theme.palette.divider : `${accentColor}80`,
            boxShadow: level === 'DANGER' ? `0 0 20px -5px ${theme.palette.error.main}60` : 1,
            transition: 'all 0.4s ease'
        }}>

            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5, pb: '20px !important' }}>

                {/* ── Title & Current Status Badge ── */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                        {title}
                    </Typography>
                    <Chip
                        icon={<LevelIcon level={level} size={16} />}
                        label={meta.label}
                        color={levelChipColor(level)}
                        size="small"
                        sx={{ fontWeight: 800, letterSpacing: 0.5, height: 24, '& .MuiChip-icon': { color: 'inherit' } }}
                    />
                </Box>

                {/* ── Big Value ── */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 1 }}>
                    <Typography
                        variant="h3"
                        fontWeight={800}
                        sx={{ color: accentColor, lineHeight: 1, fontFamily: 'monospace' }}
                    >
                        {displayValue}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                        {unit}
                    </Typography>
                </Box>

                {/* ── Gauge bar ── */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{min}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{max}</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={normalized}
                        color={levelChipColor(level)}
                        sx={{ height: 6, borderRadius: 3 }}
                    />
                </Box>

                {/* ── Real-time line chart ── */}
                <Box sx={{ width: '100%', height: 160, mb: 1.5 }}>
                    {chartData.length < 2 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Typography variant="caption" color="text.secondary">
                                Collecting data points…
                            </Typography>
                        </Box>
                    ) : (
                        <LineChart
                            xAxis={[{
                                data: timestamps,
                                scaleType: 'time',
                                tickNumber: 3,
                                valueFormatter: (val: string | number | Date) => {
                                    const dateVal = val instanceof Date ? val : new Date(val);
                                    return new Intl.DateTimeFormat('en-GB', {
                                        timeZone: 'Asia/Colombo',
                                        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
                                    }).format(dateVal);
                                }
                            }]}
                            series={[{
                                data: values,
                                color: chartColor,
                                showMark: false,
                                curve: 'catmullRom',
                                area: true,
                            }]}
                            margin={{ top: 5, right: 5, left: 30, bottom: 20 }}
                            sx={{ '& .MuiAreaElement-root': { fillOpacity: 0.1 } }}
                        />
                    )}
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                {/* ── 3-Level Indicators Row (Compact & Always Colored) ── */}
                <Box sx={{ display: 'flex', gap: 0.75, mt: 'auto' }}>
                    {(['SAFE', 'WARNING', 'DANGER'] as const).map(lvl => {
                        const isActive = level === lvl;
                        const lvlColor = lvl === 'DANGER' ? 'error.main' : lvl === 'WARNING' ? 'warning.main' : 'success.main';
                        return (
                            <Box
                                key={lvl}
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    py: 0.75, // slightly more padding for bigger text
                                    borderRadius: 1,
                                    bgcolor: isActive ? lvlColor : `${lvlColor}15`,
                                    color: isActive ? '#fff' : lvlColor,
                                    border: '1px solid',
                                    borderColor: isActive ? lvlColor : `${lvlColor}30`,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <LevelIcon level={lvl} size={16} />
                                <Typography variant="caption" sx={{ mt: 0.25, fontWeight: 800, fontSize: '0.65rem', letterSpacing: 0.5 }}>
                                    {lvl}
                                </Typography>
                                {/* INCREASED SIZE FOR THRESHOLD TEXT (e.g. <3000) */}
                                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, opacity: isActive ? 1 : 0.9, mt: 0 }}>
                                    {lvl === 'SAFE' ? thresholds.safe : lvl === 'WARNING' ? thresholds.warning : thresholds.danger}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>

                {/* ── Last alert time — only on DANGER ── */}
                {level === 'DANGER' && lastUpdate && (() => {
                    const t = new Date(lastUpdate);
                    const hh = String(t.getHours()).padStart(2, '0');
                    const mm = String(t.getMinutes()).padStart(2, '0');
                    const ss = String(t.getSeconds()).padStart(2, '0');
                    return (
                        <Typography
                            variant="caption"
                            sx={{ display: 'block', mt: 1.5, textAlign: 'center', color: 'error.main', fontWeight: 800, fontFamily: 'monospace' }}
                        >
                            ⚠ Last recorded: {hh}:{mm}:{ss}
                        </Typography>
                    );
                })()}

            </CardContent>
        </Card>
    );
};
