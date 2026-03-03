import { format } from 'date-fns';

export const formatDateTime = (timestampMs: number): string => {
    return format(new Date(timestampMs), 'MMM dd, yyyy HH:mm:ss');
};

export const formatTime = (timestampMs: number): string => {
    return format(new Date(timestampMs), 'HH:mm:ss');
};
