import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Grid, Chip, MenuItem, TextField,
    Paper, Alert, Tooltip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton } from '@mui/material';
import SensorsIcon from '@mui/icons-material/Sensors';
import HardwareIcon from '@mui/icons-material/Hardware';
import { useWorkerDetails } from '../../controllers/useWorkerDetails';
import { useWorkers } from '../../controllers/useWorkers';
import { useHelmetAssignment } from '../../controllers/useHelmetAssignment';
import { useLiveSensorData } from '../../controllers/useLiveSensorData';
import { WorkerProfileCard } from './components/WorkerProfileCard';
import { ZoneTimeline } from './components/ZoneTimeline';
import { SensorCharts } from './components/SensorCharts';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { formatTimeAgo } from '../../utils/format';

export const WorkerDetailsPage: React.FC = () => {
    const { workerId } = useParams<{ workerId: string }>();
    const navigate = useNavigate();

    const { worker, zoneHistory, loading } = useWorkerDetails(workerId || '');
    const { workers } = useWorkers();
    const { assignedWorkerId, assignHelmet } = useHelmetAssignment();

    // The helmet ALWAYS writes to W-01 path in firmware
    const { liveData, chartSeries } = useLiveSensorData('W-01', 60);

    const [lastUpdated, setLastUpdated] = useState<string>('');

    useEffect(() => {
        if (worker?.lastUpdate) {
            const interval = setInterval(() => {
                setLastUpdated(formatTimeAgo(worker.lastUpdate));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [worker?.lastUpdate]);

    if (loading) return <LoadingState />;

    if (!worker) return (
        <EmptyState
            title="Worker Not Found"
            description={`No worker found with ID "${workerId}"`}
            minHeight={400}
        />
    );

    // Is THIS worker currently assigned the helmet?
    const isHelmetAssigned = assignedWorkerId === workerId;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>

            {/* ── Header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate('/workers')}>
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                        {worker.name}
                        {isHelmetAssigned && (
                            <Chip
                                icon={<SensorsIcon sx={{ fontSize: '14px !important' }} />}
                                label="HELMET ASSIGNED"
                                color="success"
                                size="small"
                                sx={{ ml: 1.5, fontWeight: 800, fontSize: '0.65rem' }}
                            />
                        )}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {worker.id}  •  {worker.role || 'No role'}
                        {lastUpdated && ` · Last zone scan: ${lastUpdated}`}
                    </Typography>
                </Box>
            </Box>

            {/* ── Helmet Assignment Banner ── */}
            <Paper
                elevation={0}
                sx={{
                    p: 2, borderRadius: 2,
                    border: '2px solid',
                    borderColor: isHelmetAssigned ? 'success.main' : 'divider',
                    bgcolor: isHelmetAssigned ? 'success.50' : 'background.paper',
                    display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                }}
            >
                <HardwareIcon sx={{ color: isHelmetAssigned ? 'success.main' : 'text.disabled', fontSize: 28 }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={800}>
                        🪖 Helmet Assignment
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Assign the physical helmet to a worker — their profile will show live sensor data
                    </Typography>
                </Box>
                <Tooltip title="Select which worker is currently wearing the physical helmet">
                    <TextField
                        select
                        size="small"
                        label="Helmet wearer"
                        value={assignedWorkerId}
                        onChange={e => assignHelmet(e.target.value)}
                        sx={{ minWidth: 200 }}
                    >
                        {workers.map(w => (
                            <MenuItem key={w.id} value={w.id}>
                                {w.name || w.id}  ({w.id})
                            </MenuItem>
                        ))}
                    </TextField>
                </Tooltip>
            </Paper>

            {/* ── Main grid: Profile + Zone timeline ── */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 5, lg: 4 }}>
                    <WorkerProfileCard
                        worker={worker}
                        isHelmetAssigned={isHelmetAssigned}
                        liveData={isHelmetAssigned ? liveData : null}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 7, lg: 8 }}>
                    <ZoneTimeline history={zoneHistory} />
                </Grid>
            </Grid>

            {/* ── Live sensor charts (only if helmet assigned to this worker) ── */}
            {isHelmetAssigned ? (
                <SensorCharts data={chartSeries} />
            ) : (
                <Alert severity="info" icon={<SensorsIcon />}>
                    Helmet is currently assigned to <strong>{
                        workers.find(w => w.id === assignedWorkerId)?.name ?? assignedWorkerId
                    }</strong>.
                    Assign the helmet to <strong>{worker.name}</strong> above to view live sensor charts.
                </Alert>
            )}
        </Box>
    );
};