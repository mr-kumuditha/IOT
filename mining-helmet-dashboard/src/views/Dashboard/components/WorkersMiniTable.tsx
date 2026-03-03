import React from 'react';
import {
    Card, CardHeader, CardContent, Divider, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { useWorkers } from '../../../controllers/useWorkers';
import { StatusChip } from '../../../components/StatusChip';
import { LoadingState } from '../../../components/LoadingState';

export const WorkersMiniTable: React.FC = () => {
    const { workers, loading } = useWorkers();
    const navigate = useNavigate();

    if (loading) return <Card><LoadingState minHeight={300} /></Card>;

    // Sort workers to show Danger/Warning first
    const displayWorkers = [...workers].sort((a, b) => {
        const riskScore = { DANGER: 3, WARNING: 2, UNKNOWN: 1, SAFE: 0 };
        return riskScore[b.riskLevel] - riskScore[a.riskLevel];
    }).slice(0, 5);

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader title="Workers Overview" subheader="Quick view of site personnel" />
            <Divider />
            <CardContent sx={{ p: 0 }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Zone</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Details</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayWorkers.map((worker) => (
                                <TableRow key={worker.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                                        {worker.name}
                                    </TableCell>
                                    <TableCell>{worker.currentZone}</TableCell>
                                    <TableCell>
                                        <StatusChip level={worker.riskLevel} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="primary" onClick={() => navigate(`/workers/${worker.id}`)}>
                                            <OpenInNewIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {displayWorkers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No workers currently active
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};
