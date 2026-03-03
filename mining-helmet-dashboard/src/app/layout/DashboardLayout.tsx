import React, { useState } from 'react';
import { Box, CssBaseline, useTheme, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { useRiskPropagation } from '../../controllers/useRiskPropagation';

export const DRAWER_WIDTH = 260;

export const DashboardLayout: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    // ── Background service: propagates helmet risk → assigned worker ──
    useRiskPropagation();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <CssBaseline />

            <Topbar
                onMobileMenuOpen={handleDrawerToggle}
                isMobile={isMobile}
                drawerWidth={DRAWER_WIDTH}
            />

            <Sidebar
                open={mobileOpen}
                onClose={handleDrawerToggle}
                isMobile={isMobile}
                drawerWidth={DRAWER_WIDTH}
            />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    mt: { xs: '56px', sm: '64px' },
                    p: { xs: 2, sm: 3, md: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    overflowX: 'hidden',
                }}
            >
                {/* 
                  Removed the maxWidth wrapper per user request. 
                  Content now flows 100% seamlessly across the admin content zone 
                */}
                <Outlet />
            </Box>
        </Box>
    );
};
