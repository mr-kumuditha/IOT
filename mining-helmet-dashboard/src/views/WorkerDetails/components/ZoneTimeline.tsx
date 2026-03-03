import React from 'react';
import { Card, CardHeader, CardContent, Divider, Typography } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, timelineItemClasses } from '@mui/lab';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { ZoneHistoryEvent } from '../../../models/zoneHistory';
import { formatTime } from '../../../utils/time';
import { EmptyState } from '../../../components/EmptyState';

interface ZoneTimelineProps {
    history: ZoneHistoryEvent[];
}

export const ZoneTimeline: React.FC<ZoneTimelineProps> = ({ history }) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader title="Zone Tracking History" />
            <Divider />
            <CardContent sx={{ pt: 1, maxHeight: 400, overflowY: 'auto' }}>
                {history.length === 0 ? (
                    <EmptyState title="No Tracking Data" minHeight={200} />
                ) : (
                    <Timeline
                        sx={{
                            [`& .${timelineItemClasses.root}:before`]: {
                                flex: 0,
                                padding: 0,
                            },
                        }}
                    >
                        {history.map((event, index) => (
                            <TimelineItem key={`${event.time}-${index}`}>
                                <TimelineSeparator>
                                    <TimelineDot color={index === 0 ? 'primary' : 'grey'}>
                                        <LocationOnIcon fontSize="small" />
                                    </TimelineDot>
                                    {index < history.length - 1 && <TimelineConnector />}
                                </TimelineSeparator>
                                <TimelineContent sx={{ py: '12px', px: 2 }}>
                                    <Typography variant="subtitle2" component="span" fontWeight={index === 0 ? 'bold' : 'normal'}>
                                        {event.zoneName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatTime(event.time)}
                                    </Typography>
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                    </Timeline>
                )}
            </CardContent>
        </Card>
    );
};
