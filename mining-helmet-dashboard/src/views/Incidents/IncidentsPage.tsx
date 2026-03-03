import React, { useState } from 'react';
import {
    Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, MenuItem, InputAdornment, Button,
    Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useIncidents } from '../../controllers/useIncidents';
import { updateIncidentStatus } from '../../services/incidents.service';
import { StatusChip } from '../../components/StatusChip';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { formatDateTime } from '../../utils/time';
import type { Incident, IncidentType } from '../../models/incident';

export const IncidentsPage: React.FC = () => {
    const { incidents, loading } = useIncidents();
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [resolveTarget, setResolveTarget] = useState<Incident | null>(null);
    const [resolving, setResolving] = useState(false);

    if (loading) return <LoadingState />;

    const filteredIncidents = incidents.filter(incident => {
        const matchType = typeFilter === 'ALL' || incident.type === typeFilter;
        const matchStatus = statusFilter === 'ALL' || incident.status === statusFilter;
        return matchType && matchStatus;
    });

    const handleResolve = async () => {
        if (!resolveTarget) return;
        setResolving(true);
        await updateIncidentStatus(resolveTarget.id, 'resolved');
        setResolving(false);
        setResolveTarget(null);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
            <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Incidents
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    View, filter, and resolve safety incidents.
                </Typography>
            </Box>

            <Card sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <TextField
                        select
                        size="small"
                        label="Type"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        sx={{ minWidth: 150 }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><FilterListIcon fontSize="small" /></InputAdornment>
                        }}
                    >
                        <MenuItem value="ALL">All Types</MenuItem>
                        {(['SOS', 'FALL', 'GAS', 'HEAT'] as IncidentType[]).map(t => (
                            <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="ALL">All Status</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                    </TextField>

                    <Box sx={{ flexGrow: 1 }} />
                    <Chip label={`${filteredIncidents.filter(i => i.status === 'active').length} active`} color="error" />
                </Box>

                {filteredIncidents.length === 0 ? (
                    <EmptyState title="No Incidents Found" description="Try adjusting your filters." minHeight={250} />
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Time</TableCell>
                                    <TableCell>Worker ID</TableCell>
                                    <TableCell>Zone</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredIncidents.map((incident) => (
                                    <TableRow key={incident.id} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.8rem' }}>
                                            {formatDateTime(incident.time)}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{incident.workerId}</TableCell>
                                        <TableCell>{incident.zone}</TableCell>
                                        <TableCell><StatusChip type={incident.type} /></TableCell>
                                        <TableCell><StatusChip status={incident.status} /></TableCell>
                                        <TableCell align="right">
                                            {incident.status === 'active' && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="success"
                                                    onClick={() => setResolveTarget(incident)}
                                                >
                                                    Mark Resolved
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>

            <Dialog open={!!resolveTarget} onClose={() => setResolveTarget(null)}>
                <DialogTitle>Resolve Incident?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Mark the <strong>{resolveTarget?.type}</strong> incident in zone <strong>{resolveTarget?.zone}</strong> as resolved?
                        This will update the incident status in Firebase.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResolveTarget(null)}>Cancel</Button>
                    <Button onClick={handleResolve} color="success" variant="contained" disabled={resolving}>
                        {resolving ? 'Resolving...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
