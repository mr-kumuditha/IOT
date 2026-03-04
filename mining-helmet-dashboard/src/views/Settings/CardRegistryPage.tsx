import React, { useState } from 'react';
import {
    Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Tooltip, Avatar, MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { useCardMappings } from '../../controllers/useCardMappings';
import { linkCardToWorker, deleteCardMapping } from '../../services/cards.service';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';

export const CardRegistryPage: React.FC = () => {
    const { cards, loading } = useCardMappings();

    const [addOpen, setAddOpen] = useState(false);
    const [uid, setUid] = useState('');
    const [workerName, setWorkerName] = useState('');
    const [role, setRole] = useState('Miner');
    const [saving, setSaving] = useState(false);

    // Auto-generate next Worker ID (e.g. W-01, W-02)
    const getNextWorkerId = () => {
        if (cards.length === 0) return 'W-01';
        const ids = cards.map(c => {
            const num = parseInt(c.workerId.replace('W-', ''), 10);
            return isNaN(num) ? 0 : num;
        });
        const maxId = Math.max(...ids);
        return `W-${(maxId + 1).toString().padStart(2, '0')}`;
    };

    const handleOpenAdd = () => {
        setUid('');
        setWorkerName('');
        setRole('Miner');
        setAddOpen(true);
    };

    const handleSave = async () => {
        if (!uid || !workerName) return;
        setSaving(true);
        try {
            const newWorkerId = getNextWorkerId();
            await linkCardToWorker(uid, newWorkerId, workerName, role);
            setAddOpen(false);
            setUid('');
            setWorkerName('');
            setRole('Miner');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingState />;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
            {/* ── Header ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>Worker Registry</Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Map physical RFID cards to workers dynamically
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAdd}
                    sx={{ px: 3, borderRadius: 2, fontWeight: 700 }}
                >
                    Register Worker
                </Button>
            </Box>

            <Card sx={{ p: 2 }}>
                {cards.length === 0 ? (
                    <EmptyState
                        title="No Workers Registered"
                        description="Click 'Register Worker' to add your first RFID card tracking mapping."
                        minHeight={300}
                    />
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Worker</TableCell>
                                    <TableCell>Worker ID</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>RFID Card UID</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cards.map((c) => (
                                    <TableRow key={c.uid} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}>
                                                    {c.workerName.substring(0, 2).toUpperCase()}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={700}>{c.workerName}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{c.workerId}</TableCell>
                                        <TableCell>{c.role || '—'}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{c.uid}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Remove Registration">
                                                <IconButton color="error" onClick={() => deleteCardMapping(c.uid)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>

            {/* ── Add / Edit Dialog ── */}
            <Dialog open={addOpen} onClose={() => !saving && setAddOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Register New Worker Card</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Worker Name"
                            value={workerName}
                            onChange={e => setWorkerName(e.target.value)}
                            fullWidth size="small"
                        />
                        <TextField
                            select
                            label="Role"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            fullWidth size="small"
                        >
                            <MenuItem value="Miner">Miner</MenuItem>
                            <MenuItem value="Site Supervisor">Site Supervisor</MenuItem>
                            <MenuItem value="Engineer">Engineer</MenuItem>
                            <MenuItem value="Safety Officer">Safety Officer</MenuItem>
                            <MenuItem value="Vehicle Operator">Vehicle Operator</MenuItem>
                        </TextField>
                        <TextField
                            label="RFID Card UID (e.g. 51:2D:A9:02)"
                            value={uid}
                            onChange={e => setUid(e.target.value.toUpperCase())}
                            fullWidth size="small"
                            placeholder="XX:XX:XX:XX"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setAddOpen(false)} disabled={saving} color="inherit">Cancel</Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving || !uid || !workerName}
                        startIcon={<SaveIcon />}
                    >
                        {saving ? 'Saving...' : 'Save Mapping'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
