import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    Divider,
    useTheme,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SettingsIcon from '@mui/icons-material/Settings';
import ShieldIcon from '@mui/icons-material/Shield';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import BadgeIcon from '@mui/icons-material/Badge';

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    isMobile: boolean;
    drawerWidth: number;
}

const menuItems = [
    { text: 'Overview', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Live Workers', icon: <PeopleIcon />, path: '/workers' },
    { text: 'Incidents', icon: <WarningAmberIcon />, path: '/incidents' },
    { text: 'Monitor', icon: <MonitorHeartIcon />, path: '/monitor' },
    { text: 'Zone Tracking', icon: <FmdGoodIcon />, path: '/zones' },
    { text: 'Worker Registry', icon: <BadgeIcon />, path: '/registry' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, isMobile, drawerWidth }) => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header matches AppBar default heights exactly */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 1.5,
                    px: 3,
                    height: { xs: 56, sm: 64 }, // AppBar height
                    // Removed the explicit borderBottom to avoid double lines with topbar
                }}
            >
                <ShieldIcon sx={{ color: 'primary.main', fontSize: 26 }} />
                <Typography variant="h6" fontWeight={800} color="primary" letterSpacing={0.5}>
                    Smart Helmet
                </Typography>
            </Box>

            <List sx={{ px: 2, pt: 2, flexGrow: 1 }}>
                {menuItems.map((item) => {
                    const active = location.pathname.startsWith(item.path);
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                selected={active}
                                onClick={() => {
                                    navigate(item.path);
                                    if (isMobile) onClose();
                                }}
                                sx={{
                                    borderRadius: 2,
                                    py: 1,
                                    '&.Mui-selected': {
                                        bgcolor: `${theme.palette.primary.main}18`,
                                        color: 'primary.main',
                                        '& .MuiListItemIcon-root': { color: 'primary.main' },
                                    },
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: active ? 'primary.main' : 'text.secondary' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontWeight: active ? 700 : 500,
                                        fontSize: '0.875rem',
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    IoT Dashboard v1.0
                </Typography>
            </Box>
        </Box>
    );

    // MuiDrawer-paper already has a right border natively in MUI.
    // We just need to define width and remove default borders on the Box to prevent double-lines.
    const paperSx = {
        boxSizing: 'border-box' as const,
        width: drawerWidth,
    };

    return (
        <Box
            component="nav"
            sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            aria-label="mailbox folders"
        >
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={open}
                onClose={onClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': paperSx,
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop Permanent Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': paperSx,
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
};
