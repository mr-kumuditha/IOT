import React, { useState } from 'react';
import {
    Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, InputAdornment, MenuItem, IconButton,
    Chip, Avatar, Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterListIcon from '@mui/icons-material/FilterList';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import FmdBadIcon from '@mui/icons-material/FmdBad';
import { useWorkers } from '../../controllers/useWorkers';
import { StatusChip } from '../../components/StatusChip';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { formatTimeAgo } from '../../utils/format';

// Worker is "active" if they scanned a zone within the last 30 minutes
const ACTIVE_THRESHOLD_MS = 30 * 60 * 1000;

const ActivityChip: React.FC<{ lastUpdate?: number }> = ({ lastUpdate }) => {
    if (!lastUpdate) {
        return <Chip label="Never scanned" size="small" color="default" variant="outlined" />;
    }
    const isActive = Date.now() - lastUpdate < ACTIVE_THRESHOLD_MS;
    return (
        <Chip
            label={isActive ? 'Active' : 'Offline'}
            size="small"
            color={isActive ? 'success' : 'default'}
            variant={isActive ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700, fontSize: '0.65rem' }}
        />
    );
};

export const WorkersPage: React.FC = () => {
    const { workers, loading } = useWorkers();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [zoneFilter, setZoneFilter] = useState('ALL');
    const [riskFilter, setRiskFilter] = useState('ALL');

    if (loading) return <LoadingState />;

    const uniqueZones = Array.from(new Set(workers.map(w => w.currentZone))).filter(Boolean);

    const filteredWorkers = workers.filter(worker => {
        const matchesSearch = (worker.name || '').toLowerCase().includes(search.toLowerCase()) ||
            worker.id.toLowerCase().includes(search.toLowerCase()) ||
            (worker.role || '').toLowerCase().includes(search.toLowerCase());
        const matchesZone = zoneFilter === 'ALL' || worker.currentZone === zoneFilter;
        const matchesRisk = riskFilter === 'ALL' || worker.riskLevel === riskFilter;
        return matchesSearch && matchesZone && matchesRisk;
    });

    // Sort: active workers first, then by ID
    const sorted = [...filteredWorkers].sort((a, b) => {
        const aActive = a.lastUpdate && Date.now() - a.lastUpdate < ACTIVE_THRESHOLD_MS ? 0 : 1;
        const bActive = b.lastUpdate && Date.now() - b.lastUpdate < ACTIVE_THRESHOLD_MS ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return a.id.localeCompare(b.id);
    });

    const activeCount = workers.filter(w => w.lastUpdate && Date.now() - w.lastUpdate < ACTIVE_THRESHOLD_MS).length;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>

            {/* ── Header ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>Workers</Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {workers.length} registered &nbsp;·&nbsp;
                        <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>{activeCount} active</Box>
                        &nbsp;·&nbsp;
                        <Box component="span" sx={{ color: 'text.disabled' }}>{workers.length - activeCount} offline</Box>
                    </Typography>
                </Box>

                {/* Zone summary pills */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {uniqueZones.map(zone => {
                        const count = workers.filter(w => w.currentZone === zone).length;
                        return (
                            <Chip
                                key={zone}
                                icon={<FmdGoodIcon />}
                                label={`${zone}: ${count}`}
                                color="primary"
                                variant="outlined"
                                size="small"
                                sx={{ fontWeight: 700 }}
                            />
                        );
                    })}
                </Box>
            </Box>

            <Card sx={{ p: 2 }}>
                {/* ── Filters ── */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    <TextField
                        size="small"
                        placeholder="Search name, ID or role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start"><SearchIcon /></InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: 250, flexGrow: 1 }}
                    />
                    <TextField
                        select size="small" label="Zone" value={zoneFilter}
                        onChange={(e) => setZoneFilter(e.target.value)}
                        sx={{ minWidth: 140 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start"><FilterListIcon fontSize="small" /></InputAdornment>
                            ),
                        }}
                    >
                        <MenuItem value="ALL">All Zones</MenuItem>
                        {uniqueZones.map(zone => <MenuItem key={zone} value={zone}>{zone}</MenuItem>)}
                    </TextField>
                    <TextField
                        select size="small" label="Risk Level" value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="ALL">All Levels</MenuItem>
                        <MenuItem value="SAFE">Safe</MenuItem>
                        <MenuItem value="WARNING">Warning</MenuItem>
                        <MenuItem value="DANGER">Danger</MenuItem>
                    </TextField>
                </Box>

                {sorted.length === 0 ? (
                    <EmptyState
                        title="No workers found"
                        description="Tap any RFID card at a zone reader — workers appear here automatically."
                    />
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Worker</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Current Zone</TableCell>
                                    <TableCell>Last Scan</TableCell>
                                    <TableCell>Risk</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Details</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sorted.map((worker) => {
                                    const initials = (worker.name || worker.id).substring(0, 2).toUpperCase();
                                    return (
                                        <TableRow key={worker.id} hover>

                                            {/* Name + avatar */}
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 13, fontWeight: 800 }}>
                                                        {initials}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {worker.name || worker.id}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                            {worker.id}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            {/* Role */}
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {worker.role || '—'}
                                                </Typography>
                                            </TableCell>

                                            {/* Zone */}
                                            <TableCell>
                                                {worker.currentZone ? (
                                                    <Chip
                                                        icon={<FmdGoodIcon sx={{ fontSize: '14px !important' }} />}
                                                        label={worker.currentZone}
                                                        size="small" color="primary" variant="outlined"
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        icon={<FmdBadIcon sx={{ fontSize: '14px !important' }} />}
                                                        label="Not scanned"
                                                        size="small" color="default" variant="outlined"
                                                    />
                                                )}
                                            </TableCell>

                                            {/* Last scan */}
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {worker.lastUpdate ? formatTimeAgo(worker.lastUpdate) : '—'}
                                                </Typography>
                                            </TableCell>

                                            {/* Risk */}
                                            <TableCell>
                                                <StatusChip level={worker.riskLevel ?? 'UNKNOWN'} />
                                            </TableCell>

                                            {/* Active / Offline */}
                                            <TableCell>
                                                <ActivityChip lastUpdate={worker.lastUpdate} />
                                            </TableCell>

                                            <TableCell align="right">
                                                <Tooltip title="View worker details">
                                                    <IconButton
                                                        size="small" color="primary"
                                                        onClick={() => navigate(`/workers/${worker.id}`)}
                                                    >
                                                        <OpenInNewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>

                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>
        </Box>
    );
};
