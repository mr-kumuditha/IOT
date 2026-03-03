import React, { ReactNode } from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'primary', subtitle }) => {
    const theme = useTheme();
    const colorMap = {
        primary: theme.palette.primary.main,
        secondary: theme.palette.secondary.main,
        error: theme.palette.error.main,
        warning: theme.palette.warning.main,
        info: theme.palette.info.main,
        success: theme.palette.success.main,
    };

    const iconColor = colorMap[color];

    return (
        <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    backgroundColor: iconColor
                }}
            />
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography color="text.secondary" variant="overline" sx={{ fontWeight: 600, letterSpacing: 1 }}>
                            {title}
                        </Typography>
                        <Typography variant="h3" sx={{ mt: 1, mb: subtitle ? 1 : 0, fontWeight: 700 }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    {icon && (
                        <Box sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: `${iconColor}15`,
                            color: iconColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {icon}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};
