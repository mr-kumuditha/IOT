import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { getAppTheme } from './theme';
import { AppRoutes } from './routes';

export const App: React.FC = () => {
    // In a real app we might store mode in localStorage or context
    const mode = 'light';
    const theme = getAppTheme(mode);

    return (
        <ThemeProvider theme={theme}>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </ThemeProvider>
    );
};
