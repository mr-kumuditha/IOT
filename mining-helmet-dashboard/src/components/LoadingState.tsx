import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingStateProps {
    message?: string;
    minHeight?: string | number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
    message = 'Loading data...',
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
                p: 3
            }}
        >
            <CircularProgress size={40} thickness={4} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {message}
            </Typography>
        </Box>
    );
};
