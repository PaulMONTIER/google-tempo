'use client';

import { CalendarEvent } from '@/types';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachHourOfInterval,
  isSameDay,
  isToday,
  format,
  startOfDay,
  endOfDay,
  isWithinInterval,
  getHours
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { formatTime, formatHourLabel } from '@/lib/utils/time-formatters';
import { CALENDAR, DURATIONS, Z_INDEX } from '@/lib/constants/ui-constants';
import { calendarLayoutStyles, currentTimeIndicatorStyles, getEventColorStyles } from '@/lib/utils/style-helpers';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  weekStartsOn?: 0 | 1;
  timeFormat?: '12h' | '24h';
}

export function WeekView({
  currentDate,
  events,
  onEventClick,
  weekStartsOn = 1,
  timeFormat = '24h'
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, DURATIONS.oneMinute);
    return () => clearInterval(interval);
  }, []);

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventHour = getHours(eventStart);
      return isSameDay(eventStart, day) && eventHour === hour;
    });
  };

  // Calculate position of current time line
  const isCurrentWeek = days.some(day => isToday(day));
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTimePosition = (currentHour * CALENDAR.hourLineHeight) + (currentMinutes / 60 * CALENDAR.hourLineHeight);

  return (
    <div className="flex flex-col p-6" style={calendarLayoutStyles.container}>
      {/* Header with days */}
      <div className="bg-notion-bg border-b border-notion-border" style={calendarLayoutStyles.header}>
        <div className="grid grid-cols-8 gap-px bg-notion-border">
          <div className="bg-notion-sidebar p-3"></div>
          {days.map((day) => {
            const isDayToday = isToday(day);
            return (
              <div
                key={day.toString()}
                className="bg-notion-bg p-3 text-center"
              >
                <div className={`text-xs font-medium text-notion-textLight uppercase`}>
                  {format(day, 'EEE', { locale: fr })}
                </div>
                <div
                  className={`text-lg font-semibold mt-1 ${
                    isDayToday
                      ? 'bg-notion-blue text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                      : 'text-notion-text'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time grid */}
      <div style={calendarLayoutStyles.scrollable}>
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 gap-px bg-notion-border" style={{ height: `${CALENDAR.hourLineHeight}px` }}>
            <div className="bg-notion-sidebar p-2 text-xs text-notion-textLight text-right pr-3">
              {formatHourLabel(hour, timeFormat === '24h')}
            </div>
            {days.map((day) => {
              const hourEvents = getEventsForDayAndHour(day, hour);
              return (
                <div key={day.toString() + hour} className="bg-notion-bg p-1 hover:bg-notion-hover transition-colors overflow-hidden">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className="text-xs p-1 rounded mb-1 cursor-pointer hover:shadow-sm transition-shadow overflow-hidden"
                      style={getEventColorStyles(event.color || '#2383e2')}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-80 truncate">
                        {formatTime(new Date(event.startDate), timeFormat === '24h')} - {formatTime(new Date(event.endDate), timeFormat === '24h')}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}

        {/* Current time indicator line */}
        {isCurrentWeek && (
          <div
            style={{ ...currentTimeIndicatorStyles.line, top: `${currentTimePosition}px` }}
          >
            <div style={currentTimeIndicatorStyles.dot} />
          </div>
        )}
      </div>
    </div>
  );
}
