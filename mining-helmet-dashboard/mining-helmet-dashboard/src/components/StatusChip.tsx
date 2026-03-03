import React from 'react';
import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import type { WorkerRiskLevel } from '../models/worker';
import type { IncidentStatus, IncidentType } from '../models/incident';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
    level?: WorkerRiskLevel;
    type?: IncidentType;
    status?: IncidentStatus;
}

export const StatusChip: React.FC<StatusChipProps> = ({ level, type, status, ...props }) => {
    let color: 'success' | 'warning' | 'error' | 'default' | 'info' = 'default';
    let label = 'Unknown';

    if (level) {
        label = level;
        if (level === 'SAFE') color = 'success';
        else if (level === 'WARNING') color = 'warning';
        else if (level === 'DANGER') color = 'error';
    } else if (type) {
        label = type;
        if (type === 'SOS' || type === 'FALL') color = 'error';
        else if (type === 'HEAT' || type === 'GAS') color = 'warning';
    } else if (status) {
        label = status.toUpperCase();
        if (status === 'active') color = 'error';
        else if (status === 'resolved') color = 'success';
    }

    return (
        <Chip
            label={label}
            color={color}
            size="small"
            sx={{ fontWeight: 'bold' }}
            {...props}
        />
    );
};
