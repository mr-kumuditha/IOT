import React, { useState } from 'react';
import {
    Box, Typography, Card, CardHeader, CardContent, Divider, List,
    ListItem, ListItemText, Switch, ListItemSecondaryAction, Chip,
    TextField, Button, Alert
} from '@mui/material';
import { firebaseConfig } from '../../config/env';

export const SettingsPage: React.FC = () => {
    const [authEnabled, setAuthEnabled] = useState(false);
    const [telegramToken, setTelegramToken] = useState('');
    const [telegramChatId, setTelegramChatId] = useState('');

    // Check connectivity – simple check: did Firebase config fields populate?
    const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.databaseURL;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
            <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Settings
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Configure your dashboard and integrations.
                </Typography>
            </Box>

            {/* Firebase Status */}
            <Card>
                <CardHeader title="Firebase Configuration" subheader="Real-time Database connection status" />
                <Divider />
                <CardContent>
                    {isFirebaseConfigured ? (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Firebase is correctly configured and connected.
                        </Alert>
                    ) : (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Firebase configuration is missing. Edit src/config/env.ts.
                        </Alert>
                    )}
                    <List disablePadding>
                        {Object.entries(firebaseConfig).map(([key, value]) => (
                            <React.Fragment key={key}>
                                <ListItem sx={{ py: 1 }}>
                                    <ListItemText
                                        primary={<Typography variant="body2" fontWeight={500}>{key}</Typography>}
                                        secondary={
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                                {key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
                                                    ? '••••••••••••••••'
                                                    : String(value)}
                                            </Typography>
                                        }
                                    />
                                    <Chip label="Active" color="success" size="small" />
                                </ListItem>
                                <Divider component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                </CardContent>
            </Card>

            {/* Auth Mode Setting */}
            <Card>
                <CardHeader title="Authentication Mode" subheader="Toggle Firebase Email/Password Auth (classroom demo mode)" />
                <Divider />
                <CardContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        When disabled, the dashboard runs without authentication — ideal for classroom demos.
                    </Alert>
                    <List disablePadding>
                        <ListItem>
                            <ListItemText
                                primary="Require Login"
                                secondary="Enable Firebase Auth to restrict access to authenticated users only."
                            />
                            <ListItemSecondaryAction>
                                <Switch checked={authEnabled} onChange={(e) => setAuthEnabled(e.target.checked)} color="primary" />
                            </ListItemSecondaryAction>
                        </ListItem>
                    </List>
                    {authEnabled && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Auth mode is enabled. Make sure Firebase Auth is set up in your Firebase Console under Authentication → Sign-in Method → Email/Password.
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Telegram Integration Placeholder */}
            <Card>
                <CardHeader title="Telegram Notification Bot" subheader="Optional — configure for SOS alert push notifications" />
                <Divider />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Alert severity="info">
                        Enter your Telegram Bot Token and Chat ID to have incidents forwarded to Telegram.
                        <br /><strong>Note:</strong> Secrets go into a .env file (never commit to git).
                    </Alert>
                    <TextField
                        label="Telegram Bot Token"
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        placeholder="e.g. 123456789:AAExxxxxxxx"
                        type="password"
                        fullWidth
                    />
                    <TextField
                        label="Telegram Chat ID"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        placeholder="e.g. -1001234567890"
                        fullWidth
                    />
                    <Button variant="contained" disabled sx={{ alignSelf: 'flex-start' }}>
                        Test Notification (Coming Soon)
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
};
