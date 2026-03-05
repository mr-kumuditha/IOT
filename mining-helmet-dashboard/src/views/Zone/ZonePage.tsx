import React, { useState } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Avatar, useTheme, CircularProgress, Fade,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import HistoryIcon from '@mui/icons-material/History';
import SensorsIcon from '@mui/icons-material/Sensors';
import { useWorkers } from '../../controllers/useWorkers';
import { useZoneHistory } from '../../controllers/useZoneHistory';

// ── Zone card ──────────────────────────────────────────────────
const ZONES = ['Zone A', 'Zone B'] as const;
type ZoneName = typeof ZONES[number];

const ZONE_COLORS: Record<ZoneName, { main: string; light: string }> = {
    'Zone A': { main: '#6366f1', light: '#6366f115' },
    'Zone B': { main: '#f59e0b', light: '#f59e0b15' },
};

interface ZoneCardProps {
    zone: ZoneName;
    workerNames: string[];
}

const ZoneCard: React.FC<ZoneCardProps> = ({ zone, workerNames }) => {
    const { main, light } = ZONE_COLORS[zone];
    return (
        <Card sx={{
            height: '100%',
            border: '2px solid',
            borderColor: `${main}60`,
            background: light,
            boxShadow: `0 0 24px -8px ${main}50`,
            transition: 'all 0.3s ease',
        }}>
            <CardContent sx={{ p: 3 }}>
                {/* Zone header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Box sx={{
                        width: 42, height: 42, borderRadius: 2,
                        bgcolor: main, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <LocationOnIcon sx={{ color: '#fff', fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>{zone}</Typography>
                        <Typography variant="caption" color="text.secondary">RFID Checkpoint</Typography>
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                        <Chip
                            icon={<SensorsIcon sx={{ fontSize: 14, color: main + ' !important' }} />}
                            label="LIVE"
                            size="small"
                            sx={{
                                bgcolor: `${main}20`, color: main, fontWeight: 800,
                                fontSize: '0.65rem', letterSpacing: 1,
                                animation: 'livePulse 2s ease-in-out infinite',
                                '@keyframes livePulse': {
                                    '0%,100%': { opacity: 1 },
                                    '50%': { opacity: 0.5 },
                                },
                            }}
                        />
                    </Box>
                </Box>

                {/* Worker count badge */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2.5 }}>
                    <Typography variant="h2" fontWeight={900} sx={{ color: main, lineHeight: 1 }}>
                        {workerNames.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {workerNames.length === 1 ? 'worker' : 'workers'}
                    </Typography>
                </Box>

                {/* Worker list */}
                {workerNames.length === 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No workers currently in this zone
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {workerNames.map(name => (
                            <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <Avatar sx={{ width: 30, height: 30, bgcolor: main, fontSize: 12 }}>
                                    {name.charAt(0)}
                                </Avatar>
                                <Typography variant="body2" fontWeight={600}>{name}</Typography>
                                <Chip
                                    label="IN ZONE"
                                    size="small"
                                    sx={{
                                        ml: 'auto', height: 18, fontSize: '0.55rem', fontWeight: 800,
                                        bgcolor: `${main}20`, color: main, letterSpacing: 0.5,
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

// ── Zone History Log ────────────────────────────────────────────
const HistoryLog: React.FC<{ workerId: string; workerName: string }> = ({ workerId, workerName }) => {
    const { events, loading } = useZoneHistory(workerId, 20);
    const theme = useTheme();

    const fmtTime = (ev: { ts: number; time?: string }) => {
        if (ev.time) {
            try {
                const [datePart, timePart] = ev.time.split(' ');
                if (datePart && timePart) {
                    const [, month, day] = datePart.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthStr = monthNames[parseInt(month, 10) - 1] || month;
                    return `${day} ${monthStr} at ${timePart}`;
                }
            } catch (e) {
                // fallback below
            }
            return ev.time;
        }
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Colombo',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: 'short',
        }).format(new Date(ev.ts));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HistoryIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="h6" fontWeight={700}>
                    Zone History — {workerName}
                </Typography>
            </Box>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={28} />
                </Box>
            ) : events.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No zone history yet.
                </Typography>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Zone</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Time (Colombo)</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Card UID</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {events.map((ev, idx) => {
                                const col = ZONE_COLORS[ev.zone as ZoneName]?.main ?? theme.palette.primary.main;
                                return (
                                    <TableRow key={ev.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={ev.zone}
                                                size="small"
                                                sx={{ bgcolor: `${col}20`, color: col, fontWeight: 700, fontSize: '0.7rem' }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                            {fmtTime(ev)}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                                            {ev.uid}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

// ── Main Page ──────────────────────────────────────────────────
export const ZonePage: React.FC = () => {
    const { workers, loading } = useWorkers();
    const [selectedWorker, setSelectedWorker] = useState<{ id: string; name: string } | null>(null);

    // Group workers by currentZone
    const zoneMap: Record<string, string[]> = { 'Zone A': [], 'Zone B': [] };
    workers.forEach(w => {
        if (w.currentZone && zoneMap[w.currentZone]) {
            zoneMap[w.currentZone].push(w.name);
        }
    });

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>

            {/* Header */}
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <PersonPinCircleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" fontWeight={800}>Zone Tracking</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Real-time RFID zone presence — tap a worker row to view their history
                </Typography>
            </Box>

            {/* Zone cards */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Fade in>
                    <Grid container spacing={3}>
                        {ZONES.map(zone => (
                            <Grid key={zone} size={{ xs: 12, md: 6 }}>
                                <ZoneCard
                                    zone={zone}
                                    workerNames={zoneMap[zone]}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Fade>
            )}

            {/* Worker selector for history */}
            {workers.length > 0 && (
                <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                        SELECT WORKER TO VIEW HISTORY
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {workers.map(w => (
                            <Chip
                                key={w.id}
                                label={w.name}
                                onClick={() => setSelectedWorker({ id: w.id, name: w.name })}
                                variant={selectedWorker?.id === w.id ? 'filled' : 'outlined'}
                                color={selectedWorker?.id === w.id ? 'primary' : 'default'}
                                icon={<PersonPinCircleIcon />}
                                sx={{ fontWeight: 600 }}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Zone history log */}
            {selectedWorker && (
                <Fade in key={selectedWorker.id}>
                    <Card sx={{ p: 2.5 }}>
                        <HistoryLog workerId={selectedWorker.id} workerName={selectedWorker.name} />
                    </Card>
                </Fade>
            )}
        </Box>
    );
};
