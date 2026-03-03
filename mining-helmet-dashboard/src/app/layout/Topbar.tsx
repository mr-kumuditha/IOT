import React, { useState, useEffect, useRef } from 'react';
import {
    AppBar, Toolbar, Typography, IconButton, Box, Avatar, Divider,
    useTheme, Chip, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    DialogContentText, Fade, LinearProgress,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CellTowerIcon from '@mui/icons-material/CellTower';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useSosListener } from '../../controllers/useSosListener';
import { useHelmetAssignment } from '../../controllers/useHelmetAssignment';
import { useWorkers } from '../../controllers/useWorkers';
import { createIncident } from '../../services/incidents.service';
import { set, ref } from 'firebase/database';
import { rtdb } from '../../services/firebase/rtdb';

// Colombo = UTC+5:30
const getColomboTime = () => {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Colombo',
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(new Date());
};

const SOS_DISPLAY_SECONDS = 6;

interface TopbarProps {
    onMobileMenuOpen: () => void;
    isMobile: boolean;
    drawerWidth: number;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuOpen, isMobile, drawerWidth }) => {
    const theme = useTheme();

    // ── Colombo real-time clock ──────────────────────────────
    const [colomboClock, setColomboTime] = useState(getColomboTime);
    useEffect(() => {
        const t = setInterval(() => setColomboTime(getColomboTime()), 1000);
        return () => clearInterval(t);
    }, []);

    const [pulse, setPulse] = useState(true);
    const [secondsAgo, setSecondsAgo] = useState(0);
    const lastRefreshRef = useRef(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setPulse(p => !p);
            lastRefreshRef.current = Date.now();
            setSecondsAgo(0);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const tick = setInterval(() => {
            setSecondsAgo(Math.floor((Date.now() - lastRefreshRef.current) / 1000));
        }, 500);
        return () => clearInterval(tick);
    }, []);

    // ── Manual SOS dialog ────────────────────────────────────
    const { assignedWorkerId } = useHelmetAssignment();
    const { workers } = useWorkers();
    const assignedWorker = workers.find(w => w.id === assignedWorkerId);

    const [manualSosOpen, setManualSosOpen] = useState(false);
    const [manualCountdown, setManualCountdown] = useState(SOS_DISPLAY_SECONDS);
    const [sosSaving, setSosSaving] = useState(false);

    const openManualSos = () => {
        setManualCountdown(SOS_DISPLAY_SECONDS);
        setManualSosOpen(true);
    };

    const handleConfirmSos = async () => {
        setSosSaving(true);
        const zone = assignedWorker?.currentZone ?? 'Unknown Zone';
        const workerName = assignedWorker?.name ?? assignedWorkerId;
        const ts = Date.now();
        // Save SOS incident
        await createIncident({
            workerId: assignedWorkerId,
            workerName,
            type: 'SOS',
            zone,
            time: ts,
            status: 'active',
            message: 'Manual SOS triggered from admin dashboard',
        });
        // Force DANGER on assigned worker
        set(ref(rtdb, `Workers/${assignedWorkerId}/riskLevel`), 'DANGER').catch(() => { });
        setSosSaving(false);
        setManualSosOpen(false);
    };

    const closeManualSos = () => {
        setManualSosOpen(false);
        setManualCountdown(SOS_DISPLAY_SECONDS);
    };

    useEffect(() => {
        if (!manualSosOpen) return;
        const tick = setInterval(() => {
            setManualCountdown(prev => {
                if (prev <= 1) { setManualSosOpen(false); clearInterval(tick); return SOS_DISPLAY_SECONDS; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(tick);
    }, [manualSosOpen]);

    // ── Helmet SOS listener ──────────────────────────────────
    const { sosEvent } = useSosListener();
    const [helmetSosOpen, setHelmetSosOpen] = useState(false);
    const [countdown, setCountdown] = useState(SOS_DISPLAY_SECONDS);
    const lastSosTimeRef = useRef<number>(0);

    // Auto-open when a new SOS event arrives from Firebase
    useEffect(() => {
        if (sosEvent && sosEvent.active && sosEvent.time !== lastSosTimeRef.current) {
            lastSosTimeRef.current = sosEvent.time;
            setCountdown(SOS_DISPLAY_SECONDS);
            setHelmetSosOpen(true);
        }
    }, [sosEvent]);

    // 6-second countdown + auto-close
    useEffect(() => {
        if (!helmetSosOpen) return;

        const tick = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    setHelmetSosOpen(false);
                    clearInterval(tick);
                    return SOS_DISPLAY_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(tick);
    }, [helmetSosOpen]);

    const closeHelmetSos = () => {
        setHelmetSosOpen(false);
        setCountdown(SOS_DISPLAY_SECONDS);
    };

    const progress = ((SOS_DISPLAY_SECONDS - countdown) / SOS_DISPLAY_SECONDS) * 100;

    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                color="inherit"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                }}
            >
                <Toolbar sx={{ gap: 1 }}>
                    {isMobile && (
                        <IconButton color="inherit" aria-label="open drawer" edge="start"
                            onClick={onMobileMenuOpen} sx={{ mr: 1 }}>
                            <MenuIcon />
                        </IconButton>
                    )}

                    {/* Live pulse chip */}
                    <Chip
                        icon={
                            <CellTowerIcon sx={{
                                fontSize: '1rem !important',
                                color: pulse ? 'success.main' : 'success.dark',
                                transition: 'color 0.4s',
                            }} />
                        }
                        label={secondsAgo === 0 ? 'Live' : `${secondsAgo}s ago`}
                        size="small"
                        variant="outlined"
                        sx={{
                            borderColor: 'success.main', color: 'success.main',
                            fontWeight: 700, fontSize: '0.7rem',
                            '& .MuiChip-icon': { ml: 0.5 },
                            opacity: pulse ? 1 : 0.6,
                            transition: 'opacity 0.4s',
                        }}
                    />

                    {/* ── 🕐 Premium Colombo Clock ── */}
                    <Box
                        sx={{
                            display: { xs: 'none', sm: 'flex' },
                            alignItems: 'center',
                            gap: 1,
                            px: 1.75,
                            py: 0.75,
                            borderRadius: 2.5,
                            position: 'relative',
                            background: theme => theme.palette.mode === 'dark'
                                ? 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)'
                                : 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 100%)',
                            border: '1px solid transparent',
                            backgroundClip: 'padding-box',
                            boxShadow: theme => theme.palette.mode === 'dark'
                                ? '0 0 0 1px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
                                : '0 0 0 1px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        {/* Glowing icon */}
                        <AccessTimeIcon
                            sx={{
                                fontSize: 18,
                                color: 'primary.main',
                                filter: 'drop-shadow(0 0 4px currentColor)',
                                animation: 'clockGlow 2s ease-in-out infinite alternate',
                                '@keyframes clockGlow': {
                                    from: { opacity: 0.7, filter: 'drop-shadow(0 0 2px currentColor)' },
                                    to: { opacity: 1, filter: 'drop-shadow(0 0 6px currentColor)' },
                                },
                            }}
                        />

                        <Box>
                            {/* Time — large, bold, monospace */}
                            <Typography
                                sx={{
                                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                    fontWeight: 800,
                                    fontSize: '0.92rem',
                                    letterSpacing: 1.5,
                                    lineHeight: 1.1,
                                    display: 'block',
                                    background: theme => theme.palette.mode === 'dark'
                                        ? 'linear-gradient(90deg, #a78bfa, #60a5fa)'
                                        : 'linear-gradient(90deg, #6d28d9, #2563eb)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                {/* Show only the time part (last 8 chars: HH:MM:SS) */}
                                {colomboClock.slice(-8)}
                            </Typography>

                            {/* Date — small, muted */}
                            <Typography
                                sx={{
                                    fontSize: '0.6rem',
                                    fontWeight: 600,
                                    letterSpacing: 0.75,
                                    lineHeight: 1,
                                    color: 'text.secondary',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {/* Show date + weekday part (everything except last 9 chars) */}
                                {colomboClock.slice(0, -9)} · LKT
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Manual SOS button */}
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<WarningAmberIcon />}
                        onClick={() => openManualSos()}
                        size="small"
                        sx={{
                            fontWeight: 800, letterSpacing: 1, px: 2,
                            animation: 'sosPulse 2s infinite',
                            '@keyframes sosPulse': {
                                '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.4)' },
                                '50%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' },
                            },
                        }}
                    >
                        SOS
                    </Button>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton color="inherit"><NotificationsIcon /></IconButton>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1.5 }} />
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem', fontWeight: 'bold' }}>
                            A
                        </Avatar>
                        {!isMobile && (
                            <Typography variant="subtitle2" fontWeight={600} ml={1}>Admin Space</Typography>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* ── Manual SOS Dialog ── */}
            <SosDialog
                open={manualSosOpen}
                onClose={closeManualSos}
                onConfirm={handleConfirmSos}
                saving={sosSaving}
                title="🚨 SOS Emergency Alert"
                workerName={assignedWorker?.name ?? 'Admin Dashboard'}
                timestamp={new Date().toLocaleTimeString()}
                autoClose={false}
                countdown={manualCountdown}
                progress={((SOS_DISPLAY_SECONDS - manualCountdown) / SOS_DISPLAY_SECONDS) * 100}
            />

            {/* ── Helmet Physical Button SOS Dialog (auto-close 6s) ── */}
            <SosDialog
                open={helmetSosOpen}
                onClose={closeHelmetSos}
                title={`🚨 Helmet SOS — ${sosEvent?.workerName ?? sosEvent?.workerId ?? 'Unknown Worker'}`}
                workerName={sosEvent?.workerName ?? sosEvent?.workerId ?? ''}
                timestamp={sosEvent ? new Date(sosEvent.time).toLocaleTimeString() : ''}
                autoClose
                countdown={countdown}
                progress={progress}
            />
        </>
    );
};

// ── Reusable SOS Dialog ───────────────────────────────────────
interface SosDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    saving?: boolean;
    title: string;
    workerName: string;
    timestamp: string;
    autoClose: boolean;
    countdown: number | null;
    progress: number;
}

const SosDialog: React.FC<SosDialogProps> = ({
    open, onClose, onConfirm, saving, title, workerName, timestamp, autoClose, countdown, progress,
}) => (
    <Dialog
        open={open}
        onClose={onClose}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
            sx: {
                borderRadius: 3,
                border: '2px solid',
                borderColor: 'error.main',
                overflow: 'hidden',
            },
        }}
    >
        {/* Red countdown progress bar at top */}
        {autoClose && (
            <LinearProgress
                variant="determinate"
                value={progress}
                color="error"
                sx={{ height: 5, bgcolor: 'error.light' }}
            />
        )}

        {/* Red header */}
        <Box sx={{ bgcolor: 'error.main', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <WarningAmberIcon sx={{
                color: '#fff', fontSize: 40,
                animation: 'warnPulse 0.8s infinite alternate',
                '@keyframes warnPulse': { from: { opacity: 1 }, to: { opacity: 0.4 } },
            }} />
            <Box>
                <Typography variant="h5" fontWeight={800} color="#fff">{title}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                    Mining Site Safety System
                    {autoClose && countdown !== null && ` · Auto-closing in ${countdown}s`}
                </Typography>
            </Box>
        </Box>

        <DialogTitle sx={{ pt: 3, pb: 0 }}>
            <Typography variant="h6" fontWeight={700} color="error.main">
                Emergency Signal Activated
            </Typography>
        </DialogTitle>

        <DialogContent sx={{ py: 2 }}>
            <DialogContentText component="div">
                <Box sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.light', borderRadius: 2, p: 2, mb: 2 }}>
                    <Typography variant="body1" fontWeight={600} color="error.dark" gutterBottom>
                        ⚠️ SOS triggered {workerName ? `by ${workerName}` : 'from admin dashboard'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        • Rescue team has been notified immediately<br />
                        • Emergency services are being alerted<br />
                        • All workers: evacuate to nearest safe zone<br />
                        • Stay calm and follow emergency procedures
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.disabled">
                    Alert triggered at: {timestamp}
                </Typography>
            </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>
                Cancel
            </Button>
            {onConfirm && (
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                    startIcon={<WarningAmberIcon />}
                    disabled={saving}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                    {saving ? 'Saving…' : `Confirm SOS${autoClose && countdown !== null ? ` (${countdown}s)` : ''}`}
                </Button>
            )}
            {!onConfirm && (
                <Button
                    onClick={onClose}
                    variant="contained"
                    color="error"
                    startIcon={<WarningAmberIcon />}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                    Acknowledge &amp; Close{autoClose && countdown !== null ? ` (${countdown}s)` : ''}
                </Button>
            )}
        </DialogActions>
    </Dialog>
);
