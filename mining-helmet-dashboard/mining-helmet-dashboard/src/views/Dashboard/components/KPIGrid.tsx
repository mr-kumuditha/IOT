import React from 'react';
import { Grid } from '@mui/material';
import { StatCard } from '../../../components/StatCard';
import { useWorkers } from '../../../controllers/useWorkers';
import { useIncidents } from '../../../controllers/useIncidents';
import PeopleIcon from '@mui/icons-material/People';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formatTimeAgo } from '../../../utils/format';

export const KPIGrid: React.FC = () => {
    const { workers } = useWorkers();
    const { incidents } = useIncidents();

    const activeWorkers = workers.length;
    const dangerCount = workers.filter(w => w.riskLevel === 'DANGER').length;
    const warningCount = workers.filter(w => w.riskLevel === 'WARNING').length;
    const activeIncidents = incidents.filter(i => i.status === 'active');
    const lastIncidentTime = incidents.length > 0 ? formatTimeAgo(incidents[0].time) : 'No incidents';

    // Using Grid2 API: `size` prop instead of `item xs={} md={}` (MUI v6+)
    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard
                    title="Active Workers"
                    value={activeWorkers}
                    icon={<PeopleIcon />}
                    color="info"
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard
                    title="Danger Level"
                    value={dangerCount}
                    icon={<ErrorOutlineIcon />}
                    color="error"
                    subtitle={dangerCount > 0 ? 'Immediate action required' : 'All clear'}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard
                    title="Warnings"
                    value={warningCount}
                    icon={<WarningAmberIcon />}
                    color="warning"
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard
                    title="Active Incidents"
                    value={activeIncidents.length}
                    icon={<AccessTimeIcon />}
                    color="secondary"
                    subtitle={`Last incident: ${lastIncidentTime}`}
                />
            </Grid>
        </Grid>
    );
};