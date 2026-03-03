import { createTheme } from '@mui/material/styles';

export const getAppTheme = (mode: 'light' | 'dark') => createTheme({
    palette: {
        mode,
        primary: {
            main: '#2563eb', // Modern blue
            light: '#60a5fa',
            dark: '#1d4ed8',
        },
        secondary: {
            main: '#10b981', // Emerald
        },
        error: {
            main: '#ef4444',
            light: '#f87171',
            dark: '#b91c1c', // Ruby red for danger
        },
        warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706', // Amber for warnings
        },
        info: {
            main: '#3b82f6',
        },
        success: {
            main: '#10b981',
        },
        background: {
            default: mode === 'light' ? '#f8fafc' : '#0f172a',
            paper: mode === 'light' ? '#ffffff' : '#1e293b',
        },
        text: {
            primary: mode === 'light' ? '#0f172a' : '#f8fafc',
            secondary: mode === 'light' ? '#64748b' : '#94a3b8',
        }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '2rem',
        },
        h2: {
            fontWeight: 700,
            fontSize: '1.75rem',
        },
        h3: {
            fontWeight: 600,
            fontSize: '1.5rem',
        },
        h4: {
            fontWeight: 600,
            fontSize: '1.25rem',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.125rem',
        },
        h6: {
            fontWeight: 600,
            fontSize: '1rem',
        },
        button: {
            textTransform: 'none', // Modern look
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12, // More rounded corners
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: mode === 'light'
                        ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                        : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
                    border: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
    },
});
