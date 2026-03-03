import React, { useState } from 'react';
import {
    Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, MenuItem, InputAdornment, Button,
    Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Avatar, Tooltip,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import DangerousIcon from '@mui/icons-material/Dangerous';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useIncidents } from '../../controllers/useIncidents';
import { updateIncidentStatus } from '../../services/incidents.service';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import type { Incident, IncidentType } from '../../models/incident';

// ── helpers ────────────────────────────────────────────────────────────────
const INCIDENT_CONFIG: Record<string, {
    label: string; emoji: string; chipColor: 'error' | 'warning' | 'info' | 'default';
}> = {
    SOS: { label: 'SOS Alert', emoji: '🆘', chipColor: 'error' },
    FALL: { label: 'Fall Detected', emoji: '🤸', chipColor: 'error' },
    GAS: { label: 'Toxic Gas', emoji: '☣️', chipColor: 'error' },
    HEAT: { label: 'High Temperature', emoji: '🌡️', chipColor: 'warning' },
    HUMIDITY: { label: 'Humidity Danger', emoji: '💧', chipColor: 'warning' },
};

const TypeBadge: React.FC<{ type: IncidentType }> = ({ type }) => {
    const cfg = INCIDENT_CONFIG[type] ?? { label: type, emoji: '⚠️', chipColor: 'default' };
    return (
        <Chip
            label={`${cfg.emoji} ${cfg.label}`}
            color={cfg.chipColor}
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
        />
    );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
    <Chip
        icon={status === 'active' ? <DangerousIcon /> : <CheckCircleIcon />}
        label={status === 'active' ? 'Active' : 'Resolved'}
        color={status === 'active' ? 'error' : 'success'}
        variant={status === 'active' ? 'filled' : 'outlined'}
        size="small"
        sx={{ fontWeight: 700, textTransform: 'capitalize' }}
    />
);

// ── component ──────────────────────────────────────────────────────────────
export const IncidentsPage: React.FC = () => {
    const { incidents, loading } = useIncidents();
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [resolveTarget, setResolveTarget] = useState<Incident | null>(null);
    const [resolving, setResolving] = useState(false);

    if (loading) return <LoadingState />;

    const filtered = incidents.filter(i => {
        const matchType = typeFilter === 'ALL' || i.type === typeFilter;
        const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
        return matchType && matchStatus;
    });

    const activeCount = incidents.filter(i => i.status === 'active').length;
    const resolvedCount = incidents.filter(i => i.status === 'resolved').length;

    const handleResolve = async () => {
        if (!resolveTarget) return;
        setResolving(true);
        await updateIncidentStatus(resolveTarget.id, 'resolved');
        setResolving(false);
        setResolveTarget(null);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>

            {/* ── Header ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>Incidents</Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Safety events detected by the helmet system
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Chip
                        icon={<DangerousIcon />}
                        label={`${activeCount} Active`}
                        color="error"
                        variant={activeCount > 0 ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700 }}
                    />
                    <Chip
                        icon={<CheckCircleIcon />}
                        label={`${resolvedCount} Resolved`}
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                    />
                </Box>
            </Box>

            <Card sx={{ p: 2 }}>
                {/* ── Filters ── */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <TextField
                        select size="small" label="Threat Type" value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        sx={{ minWidth: 170 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><FilterListIcon fontSize="small" /></InputAdornment> }}
                    >
                        <MenuItem value="ALL">All Types</MenuItem>
                        {(['SOS', 'FALL', 'GAS', 'HEAT', 'HUMIDITY'] as IncidentType[]).map(t => (
                            <MenuItem key={t} value={t}>
                                {INCIDENT_CONFIG[t]?.emoji ?? ''} {INCIDENT_CONFIG[t]?.label ?? t}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select size="small" label="Status" value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="ALL">All Statuses</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                    </TextField>
                </Box>

                {filtered.length === 0 ? (
                    <EmptyState
                        title="No Incidents"
                        description="No safety incidents detected yet. Incidents are created automatically when helmet sensors detect danger."
                        minHeight={250}
                    />
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date & Time</TableCell>
                                    <TableCell>Worker</TableCell>
                                    <TableCell>Zone</TableCell>
                                    <TableCell>Threat Type</TableCell>
                                    <TableCell>Details</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.map((incident) => {
                                    const workerLabel = incident.workerName || incident.workerId;
                                    const initials = workerLabel.substring(0, 2).toUpperCase();
                                    return (
                                        <TableRow key={incident.id} hover
                                            sx={{ bgcolor: incident.status === 'active' ? 'error.50' : 'inherit' }}
                                        >
                                            {/* Date / Time */}
                                            <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.78rem' }}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {new Date(incident.time).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(incident.time).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            {/* Worker */}
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 12, fontWeight: 800 }}>
                                                        {initials}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={700}>{workerLabel}</Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                            {incident.workerId}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            {/* Zone */}
                                            <TableCell>
                                                <Chip
                                                    label={incident.zone || '—'}
                                                    size="small" variant="outlined" color="primary"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </TableCell>

                                            {/* Type */}
                                            <TableCell><TypeBadge type={incident.type} /></TableCell>

                                            {/* Details / message */}
                                            <TableCell sx={{ maxWidth: 220 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {incident.message || '—'}
                                                </Typography>
                                                {/* Sensor snapshot */}
                                                {(incident.gasValue !== undefined || incident.tempValue !== undefined) && (
                                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                        {incident.gasValue !== undefined && (
                                                            <Chip label={`Gas: ${incident.gasValue}`} size="small" sx={{ fontSize: '0.6rem' }}
                                                                color={incident.gasValue >= 4000 ? 'error' : incident.gasValue >= 3000 ? 'warning' : 'default'} />
                                                        )}
                                                        {incident.tempValue !== undefined && (
                                                            <Chip label={`${incident.tempValue?.toFixed(1)}°C`} size="small" sx={{ fontSize: '0.6rem' }}
                                                                color={incident.tempValue >= 40 ? 'error' : incident.tempValue >= 36 ? 'warning' : 'default'} />
                                                        )}
                                                        {incident.humidityValue !== undefined && (
                                                            <Chip label={`${incident.humidityValue?.toFixed(0)}%`} size="small" sx={{ fontSize: '0.6rem' }} />
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell><StatusBadge status={incident.status} /></TableCell>

                                            {/* Actions */}
                                            <TableCell align="right">
                                                {incident.status === 'active' && (
                                                    <Tooltip title="Mark as resolved">
                                                        <Button
                                                            size="small" variant="outlined" color="success"
                                                            startIcon={<CheckCircleIcon />}
                                                            onClick={() => setResolveTarget(incident)}
                                                        >
                                                            Resolve
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>

            {/* ── Resolve confirm dialog ── */}
            <Dialog open={!!resolveTarget} onClose={() => setResolveTarget(null)}>
                <DialogTitle>Resolve Incident?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Mark the <strong>{resolveTarget && INCIDENT_CONFIG[resolveTarget.type]?.label}</strong> incident
                        for <strong>{resolveTarget?.workerName || resolveTarget?.workerId}</strong> in{' '}
                        <strong>{resolveTarget?.zone}</strong> as resolved?
                        <br /><br />
                        <em style={{ fontSize: '0.85em', opacity: 0.7 }}>{resolveTarget?.message}</em>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResolveTarget(null)}>Cancel</Button>
                    <Button onClick={handleResolve} color="success" variant="contained" disabled={resolving}>
                        {resolving ? 'Resolving…' : 'Confirm Resolved'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
