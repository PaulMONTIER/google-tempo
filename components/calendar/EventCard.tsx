'use client';

import { CalendarEvent } from '@/types';
import { formatTime } from '@/lib/utils/time-formatters';

interface EventCardProps {
    event: CalendarEvent;
    variant?: 'compact' | 'default' | 'expanded';
    timeFormat?: '12h' | '24h';
    onClick?: () => void;
}

// Palette minimaliste inspirée Apple/Notion
function getMinimalColor(color: string) {
    const colors: Record<string, { bg: string; border: string; dot: string }> = {
        '#2383e2': { bg: 'rgba(66, 133, 244, 0.08)', border: 'rgba(66, 133, 244, 0.2)', dot: '#4285f4' },
        '#e74c3c': { bg: 'rgba(234, 67, 53, 0.08)', border: 'rgba(234, 67, 53, 0.2)', dot: '#ea4335' },
        '#2ecc71': { bg: 'rgba(52, 168, 83, 0.08)', border: 'rgba(52, 168, 83, 0.2)', dot: '#34a853' },
        '#f39c12': { bg: 'rgba(251, 188, 4, 0.08)', border: 'rgba(251, 188, 4, 0.2)', dot: '#fbbc04' },
        '#9b59b6': { bg: 'rgba(142, 68, 173, 0.08)', border: 'rgba(142, 68, 173, 0.2)', dot: '#8e44ad' },
    };

    return colors[color] || {
        bg: `${color}0a`,
        border: `${color}20`,
        dot: color
    };
}

export function EventCard({ event, variant = 'default', timeFormat = '24h', onClick }: EventCardProps) {
    const colors = getMinimalColor(event.color || '#2383e2');
    const startTime = formatTime(new Date(event.startDate), timeFormat === '24h');
    const endTime = formatTime(new Date(event.endDate), timeFormat === '24h');

    // Variant compact (pour WeekView)
    if (variant === 'compact') {
        return (
            <div
                onClick={onClick}
                className="group cursor-pointer rounded-md px-2 py-1.5 transition-all duration-150 hover:shadow-sm"
                style={{
                    backgroundColor: colors.bg,
                    borderLeft: `3px solid ${colors.dot}`,
                }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-800 truncate">
                        {event.title}
                    </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                    {startTime}
                </div>
            </div>
        );
    }

    // Variant expanded (pour DayView)
    if (variant === 'expanded') {
        return (
            <div
                onClick={onClick}
                className="group cursor-pointer rounded-xl px-4 py-2 h-full transition-all duration-200 hover:shadow-md border"
                style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    borderLeftWidth: '4px',
                    borderLeftColor: colors.dot,
                }}
            >
                <div className="flex flex-col h-full justify-center">
                    {/* Titre */}
                    <h3 className="font-medium text-gray-900 truncate text-sm">
                        {event.title}
                    </h3>

                    {/* Horaire */}
                    <div className="text-xs text-gray-500 mt-0.5">
                        {startTime} – {endTime}
                    </div>

                    {/* Lieu (si présent) */}
                    {event.location && (
                        <div className="text-xs text-gray-400 mt-1 truncate">
                            {event.location}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Variant default
    return (
        <div
            onClick={onClick}
            className="group cursor-pointer rounded-lg px-3 py-2 transition-all duration-150 hover:shadow-sm border"
            style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
            }}
        >
            <div className="flex items-center gap-2">
                {/* Point de couleur */}
                <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors.dot }}
                />

                {/* Titre */}
                <span className="text-xs font-medium text-gray-800 truncate flex-1">
                    {event.title}
                </span>
            </div>

            {/* Horaire */}
            <div className="text-[10px] text-gray-500 mt-1 ml-4">
                {startTime} – {endTime}
            </div>
        </div>
    );
}
