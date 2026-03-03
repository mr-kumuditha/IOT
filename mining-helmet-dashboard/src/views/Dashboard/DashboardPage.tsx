import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { KPIGrid } from './components/KPIGrid';
import { WorkersMiniTable } from './components/WorkersMiniTable';
import { LatestIncidents } from './components/LatestIncidents';

export const DashboardPage: React.FC = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
            <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Dashboard Overview
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Real-time safety monitor for mining site personnel.
                </Typography>
            </Box>

            <KPIGrid />

            {/* Grid2 API: use size prop, md:8/4 split starts at 960px — matches common desktop widths */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <WorkersMiniTable />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <LatestIncidents />
                </Grid>
            </Grid>
        </Box>
    );
};