import React, { useState } from 'react';
import {
    Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, InputAdornment, MenuItem, IconButton,
    Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useWorkers } from '../../controllers/useWorkers';
import { StatusChip } from '../../components/StatusChip';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';

export const WorkersPage: React.FC = () => {
    const { workers, loading } = useWorkers();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [zoneFilter, setZoneFilter] = useState('ALL');
    const [riskFilter, setRiskFilter] = useState('ALL');

    if (loading) return <LoadingState />;

    const uniqueZones = Array.from(new Set(workers.map(w => w.currentZone))).filter(Boolean);

    const filteredWorkers = workers.filter(worker => {
        const matchesSearch = worker.name.toLowerCase().includes(search.toLowerCase()) ||
            worker.id.toLowerCase().includes(search.toLowerCase());
        const matchesZone = zoneFilter === 'ALL' || worker.currentZone === zoneFilter;
        const matchesRisk = riskFilter === 'ALL' || worker.riskLevel === riskFilter;

        return matchesSearch && matchesZone && matchesRisk;
    });

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Live Workers
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Tracking {workers.length} active personnel on site.
                    </Typography>
                </Box>
                <Button variant="contained" color="primary">
                    Export Report
                </Button>
            </Box>

            <Card sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    <TextField
                        size="small"
                        placeholder="Search name or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: 250, flexGrow: 1 }}
                    />

                    <TextField
                        select
                        size="small"
                        label="Zone Filter"
                        value={zoneFilter}
                        onChange={(e) => setZoneFilter(e.target.value)}
                        sx={{ minWidth: 150 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FilterListIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    >
                        <MenuItem value="ALL">All Zones</MenuItem>
                        {uniqueZones.map(zone => (
                            <MenuItem key={zone} value={zone}>{zone}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        label="Risk Level"
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="ALL">All Levels</MenuItem>
                        <MenuItem value="SAFE">Safe</MenuItem>
                        <MenuItem value="WARNING">Warning</MenuItem>
                        <MenuItem value="DANGER">Danger</MenuItem>
                    </TextField>
                </Box>

                {filteredWorkers.length === 0 ? (
                    <EmptyState title="No workers found" description="Try adjusting your filters or search term." />
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Current Zone</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredWorkers.map((worker) => (
                                    <TableRow key={worker.id} hover>
                                        <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                                            {worker.id}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{worker.name}</TableCell>
                                        <TableCell>{worker.role}</TableCell>
                                        <TableCell>{worker.currentZone}</TableCell>
                                        <TableCell>
                                            <StatusChip level={worker.riskLevel} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => navigate(`/workers/${worker.id}`)}
                                                title="View Details"
                                            >
                                                <OpenInNewIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>
        </Box>
    );
};
