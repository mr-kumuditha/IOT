import React from 'react';
import { Card, CardContent, Typography, Avatar, Box, Divider } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import type { Worker } from '../../../models/worker';
import { StatusChip } from '../../../components/StatusChip';
import { formatTimeAgo } from '../../../utils/format';

interface WorkerProfileCardProps {
    worker: Worker;
}

export const WorkerProfileCard: React.FC<WorkerProfileCardProps> = ({ worker }) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mr: 2 }}>
                        <PersonIcon fontSize="large" />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            {worker.name}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            ID: {worker.id} • {worker.role}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Current Zone</Typography>
                        <Typography variant="body1" fontWeight={500}>{worker.currentZone}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Risk Status</Typography>
                        <Box sx={{ mt: 0.5 }}><StatusChip level={worker.riskLevel} /></Box>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Last Update</Typography>
                        <Typography variant="body2">{formatTimeAgo(worker.lastUpdate)}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Environmental</Typography>
                        <Typography variant="body2">
                            {worker.lastSensors ? 'Active Reading' : 'No Data'}
                        </Typography>
                    </Box>
                </Box>

                {worker.lastSensors && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Latest Sensor Snapshot</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Temp</Typography>
                                <Typography variant="body2" fontWeight="bold">{worker.lastSensors.temp}°C</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Humidity</Typography>
                                <Typography variant="body2" fontWeight="bold">{worker.lastSensors.humidity}%</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Gas</Typography>
                                <Typography variant="body2" fontWeight="bold" color={worker.lastSensors.gas > 300 ? 'error.main' : 'inherit'}>
                                    {worker.lastSensors.gas} ppm
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};
