import React, { useState } from 'react';
import {
    Card, CardContent, Typography, Avatar, Box, Divider,
    IconButton, TextField, Tooltip, Chip, CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SensorsIcon from '@mui/icons-material/Sensors';
import type { Worker } from '../../../models/worker';
import { StatusChip } from '../../../components/StatusChip';
import { formatTimeAgo } from '../../../utils/format';
import { updateWorker } from '../../../services/workers.service';

interface WorkerProfileCardProps {
    worker: Worker;
    isHelmetAssigned?: boolean;   // true = this worker currently wears the helmet
    liveData?: {
        gas: number; temp: number; humidity: number;
        motion: boolean; riskLevel: string; timestamp: number;
    } | null;
}

export const WorkerProfileCard: React.FC<WorkerProfileCardProps> = ({
    worker, isHelmetAssigned = false, liveData,
}) => {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState(worker.name);
    const [role, setRole] = useState(worker.role ?? '');

    const handleSave = async () => {
        setSaving(true);
        await updateWorker(worker.id, { name, role });
        setSaving(false);
        setEditing(false);
    };

    const handleCancel = () => {
        setName(worker.name);
        setRole(worker.role ?? '');
        setEditing(false);
    };

    // Pick avatar initials
    const initials = (name || worker.id).substring(0, 2).toUpperCase();

    return (
        <Card sx={{ height: '100%', overflow: 'visible' }}>
            <CardContent>

                {/* ── Avatar + Name + Edit controls ── */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, gap: 2 }}>
                    <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
                        {initials}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {editing ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <TextField
                                    label="Name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    size="small"
                                    fullWidth
                                    autoFocus
                                />
                                <TextField
                                    label="Role"
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                    size="small"
                                    fullWidth
                                />
                            </Box>
                        ) : (
                            <>
                                <Typography variant="h6" fontWeight={800} noWrap>{worker.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {worker.id}  •  {worker.role || 'No role set'}
                                </Typography>
                                {isHelmetAssigned && (
                                    <Chip
                                        icon={<SensorsIcon sx={{ fontSize: '14px !important' }} />}
                                        label="HELMET LIVE"
                                        color="success"
                                        size="small"
                                        sx={{ mt: 0.5, fontWeight: 800, fontSize: '0.6rem', letterSpacing: 0.5 }}
                                    />
                                )}
                            </>
                        )}
                    </Box>

                    {/* Edit / Save / Cancel buttons */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 'auto' }}>
                        {editing ? (
                            <>
                                <Tooltip title="Save">
                                    <span>
                                        <IconButton size="small" color="primary" onClick={handleSave} disabled={saving}>
                                            {saving ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                    <IconButton size="small" onClick={handleCancel}>
                                        <CancelIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </>
                        ) : (
                            <Tooltip title="Edit name / role">
                                <IconButton size="small" onClick={() => setEditing(true)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* ── Quick stats grid ── */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Current Zone</Typography>
                        <Typography variant="body2" fontWeight={700}>
                            {worker.currentZone || '—'}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Risk Status</Typography>
                        <Box sx={{ mt: 0.25 }}>
                            <StatusChip level={worker.riskLevel ?? 'UNKNOWN'} />
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Last Zone Scan</Typography>
                        <Typography variant="body2">{worker.lastUpdate ? formatTimeAgo(worker.lastUpdate) : '—'}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Helmet</Typography>
                        <Typography variant="body2" fontWeight={700} color={isHelmetAssigned ? 'success.main' : 'text.disabled'}>
                            {isHelmetAssigned ? '✓ Wearing' : 'Not assigned'}
                        </Typography>
                    </Box>
                </Box>

                {/* ── Live sensor panel (only if helmet assigned) ── */}
                {isHelmetAssigned && liveData && (
                    <Box sx={{
                        p: 2, borderRadius: 2,
                        bgcolor: 'success.50',
                        border: '1px solid',
                        borderColor: 'success.light',
                    }}>
                        <Typography variant="subtitle2" fontWeight={800} color="success.dark" gutterBottom>
                            🪖 Live Helmet Sensors
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Temperature</Typography>
                                <Typography variant="body2" fontWeight={800}>{liveData.temp.toFixed(1)} °C</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Humidity</Typography>
                                <Typography variant="body2" fontWeight={800}>{liveData.humidity.toFixed(0)} %</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Gas (ADC)</Typography>
                                <Typography
                                    variant="body2"
                                    fontWeight={800}
                                    color={liveData.gas > 3000 ? 'error.main' : 'inherit'}
                                >
                                    {liveData.gas}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Motion</Typography>
                                <Typography
                                    variant="body2"
                                    fontWeight={800}
                                    color={liveData.motion ? 'error.main' : 'success.main'}
                                >
                                    {liveData.motion ? '⚠ FALL' : '✓ OK'}
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Updated: {new Date(liveData.timestamp).toLocaleTimeString()}
                        </Typography>
                    </Box>
                )}

                {isHelmetAssigned && !liveData && (
                    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Waiting for helmet data…
                        </Typography>
                    </Box>
                )}

            </CardContent>
        </Card>
    );
};
