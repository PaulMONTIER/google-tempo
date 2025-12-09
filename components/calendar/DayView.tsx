'use client';

import { CalendarEvent } from '@/types';
import { isSameDay, format, getHours, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { formatTime, formatHourLabel } from '@/lib/utils/time-formatters';
import { CALENDAR, DURATIONS } from '@/lib/constants/ui-constants';
import { calendarLayoutStyles, currentTimeIndicatorStyles } from '@/lib/utils/style-helpers';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  timeFormat?: '12h' | '24h';
}

export function DayView({
  currentDate,
  events,
  onEventClick,
  timeFormat = '24h'
}: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, DURATIONS.oneMinute);
    return () => clearInterval(interval);
  }, []);

  const getEventsForHour = (hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventHour = getHours(eventStart);
      return isSameDay(eventStart, currentDate) && eventHour === hour;
    });
  };

  const isCurrentDay = isToday(currentDate);
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTimePosition = (currentHour * CALENDAR.hourHeight) + (currentMinutes / 60 * CALENDAR.hourHeight);

  return (
    <div className="flex flex-col h-full bg-notion-bg">
      {/* Header */}
      <div className="px-6 py-5 border-b border-notion-border">
        <div className="text-center">
          <p className="text-xs font-medium text-notion-textLight uppercase tracking-wide">
            {format(currentDate, 'EEEE', { locale: fr })}
          </p>
          <p className="text-xl font-semibold text-notion-text mt-1">
            {format(currentDate, 'd MMMM yyyy', { locale: fr })}
          </p>
        </div>
      </div>

      {/* Grille */}
      <div className="flex-1 overflow-y-auto" style={calendarLayoutStyles.scrollable}>
        <div className="relative">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(hour);
            return (
              <div
                key={hour}
                className="flex"
                style={{ minHeight: `${CALENDAR.hourHeight}px` }}
              >
                <div className="w-16 flex-shrink-0 text-right pr-4 pt-0.5">
                  <span className="text-xs text-notion-textLight">
                    {formatHourLabel(hour, timeFormat === '24h')}
                  </span>
                </div>

                <div className="flex-1 border-t border-notion-border pr-2">
                  {hourEvents.map((event) => {
                    const eventColor = event.color || '#2383e2';
                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick?.(event)}
                        className="group flex items-start gap-4 h-full py-2.5 px-4 rounded-lg cursor-pointer transition-colors hover:shadow-sm"
                        style={{
                          backgroundColor: `${eventColor}20`,
                          minHeight: `${CALENDAR.hourHeight - 8}px`
                        }}
                      >
                        {/* Barre verticale */}
                        <div
                          className="w-1 self-stretch rounded-full"
                          style={{ backgroundColor: eventColor }}
                        />

                        {/* Texte */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="text-sm text-notion-text font-medium truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-notion-textLight">
                            {formatTime(new Date(event.startDate), timeFormat === '24h')} – {formatTime(new Date(event.endDate), timeFormat === '24h')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {isCurrentDay && (
            <div style={{ ...currentTimeIndicatorStyles.line, top: `${currentTimePosition}px` }}>
              <div style={currentTimeIndicatorStyles.dot} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
