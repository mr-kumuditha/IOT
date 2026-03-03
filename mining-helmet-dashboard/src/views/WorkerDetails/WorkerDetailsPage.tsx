import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Chip } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton } from '@mui/material';
import { useWorkerDetails } from '../../controllers/useWorkerDetails';
import { useTelemetrySeries } from '../../controllers/useTelemetrySeries';
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
    const { data: telemetryData } = useTelemetrySeries(workerId || '');
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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate('/workers')}>
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                        Worker Details
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Live monitoring for {worker.name}
                    </Typography>
                </Box>
                {lastUpdated && (
                    <Chip label={`Last updated: ${lastUpdated}`} variant="outlined" size="small" />
                )}
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 5, lg: 4 }}>
                    <WorkerProfileCard worker={worker} />
                </Grid>
                <Grid size={{ xs: 12, md: 7, lg: 8 }}>
                    <ZoneTimeline history={zoneHistory} />
                </Grid>
            </Grid>

            <SensorCharts data={telemetryData} />
        </Box>
    );
};