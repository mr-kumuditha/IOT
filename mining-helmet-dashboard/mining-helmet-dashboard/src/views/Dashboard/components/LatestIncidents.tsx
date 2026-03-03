import React from 'react';
import { Card, CardHeader, CardContent, List, ListItem, ListItemText, Typography, Divider, Box } from '@mui/material';
import { useIncidents } from '../../../controllers/useIncidents';
import { StatusChip } from '../../../components/StatusChip';
import { formatTimeAgo } from '../../../utils/format';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export const LatestIncidents: React.FC = () => {
    const { incidents, loading } = useIncidents();

    if (loading) return <Card><LoadingState minHeight={300} /></Card>;

    const displayIncidents = incidents.slice(0, 5);

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader title="Latest Incidents" />
            <Divider />
            <CardContent sx={{ p: 0 }}>
                {displayIncidents.length === 0 ? (
                    <EmptyState
                        title="No Incidents"
                        description="The site is operating safely."
                        icon={<CheckCircleOutlineIcon sx={{ fontSize: 48 }} color="success" />}
                        minHeight={250}
                    />
                ) : (
                    <List sx={{ p: 0 }}>
                        {displayIncidents.map((incident, index) => (
                            <React.Fragment key={incident.id}>
                                <ListItem alignItems="flex-start" sx={{ px: 3, py: 2 }}>
                                    <ListItemText
                                        disableTypography
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="subtitle1" fontWeight={600} component="span">
                                                    {incident.zone}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" component="span">
                                                    {formatTimeAgo(incident.time)}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box component="span" sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                <StatusChip type={incident.type} />
                                                <StatusChip status={incident.status} />
                                                <Typography variant="caption" component="span" sx={{ ml: 1, alignSelf: 'center' }}>
                                                    Worker: {incident.workerId}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < displayIncidents.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};
