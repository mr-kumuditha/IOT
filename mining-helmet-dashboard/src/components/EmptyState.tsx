import React, { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    minHeight?: string | number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon,
    minHeight = 200
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight,
                width: '100%',
                p: 3,
                textAlign: 'center'
            }}
        >
            {icon && (
                <Box sx={{ color: 'text.secondary', mb: 2, opacity: 0.5 }}>
                    {icon}
                </Box>
            )}
            <Typography variant="h6" color="text.secondary" gutterBottom>
                {title}
            </Typography>
            {description && (
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                    {description}
                </Typography>
            )}
        </Box>
    );
};
