import React from 'react';
import { Card, CardHeader, CardContent, Divider, Typography, Chip } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, timelineItemClasses } from '@mui/lab';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { ZoneHistoryEvent } from '../../../models/zoneHistory';
import { EmptyState } from '../../../components/EmptyState';

interface ZoneTimelineProps {
    history: ZoneHistoryEvent[];
}

const formatTs = (ts: number | undefined) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('en-LK', { day: '2-digit', month: 'short' }) + ' ' +
        d.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const ZONE_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'error' | 'warning'> = {
    'Zone A': 'primary',
    'Zone B': 'success',
};

export const ZoneTimeline: React.FC<ZoneTimelineProps> = ({ history }) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title="Zone Tracking History"
                subheader={`${history.length} recent scan${history.length !== 1 ? 's' : ''}`}
            />
            <Divider />
            <CardContent sx={{ pt: 1, maxHeight: 420, overflowY: 'auto' }}>
                {history.length === 0 ? (
                    <EmptyState
                        title="No Zone Scans Yet"
                        description="Tap an RFID card at Zone A or B reader to see history here."
                        minHeight={200}
                    />
                ) : (
                    <Timeline
                        sx={{
                            [`& .${timelineItemClasses.root}:before`]: {
                                flex: 0,
                                padding: 0,
                            },
                            mt: 0, pt: 0,
                        }}
                    >
                        {history.map((event, index) => {
                            const zoneName = event.zone || 'Unknown Zone';
                            const color = ZONE_COLORS[zoneName] ?? 'primary';
                            return (
                                <TimelineItem key={`${event.ts}-${index}`}>
                                    <TimelineSeparator>
                                        <TimelineDot color={index === 0 ? color : 'grey'} variant={index === 0 ? 'filled' : 'outlined'}>
                                            <LocationOnIcon sx={{ fontSize: 14 }} />
                                        </TimelineDot>
                                        {index < history.length - 1 && <TimelineConnector />}
                                    </TimelineSeparator>
                                    <TimelineContent sx={{ py: '10px', px: 2 }}>
                                        <Chip
                                            label={zoneName}
                                            size="small"
                                            color={index === 0 ? color : 'default'}
                                            variant={index === 0 ? 'filled' : 'outlined'}
                                            sx={{ fontWeight: 700, mb: 0.5 }}
                                        />
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {formatTs(event.ts)}
                                        </Typography>
                                        {event.uid && (
                                            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', fontSize: '0.6rem' }}>
                                                UID: {event.uid}
                                            </Typography>
                                        )}
                                    </TimelineContent>
                                </TimelineItem>
                            );
                        })}
                    </Timeline>
                )}
            </CardContent>
        </Card>
    );
};
