'use client';

import { CalendarEvent } from '@/types';
import { isSameDay, format, getHours, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { formatTime, formatHourLabel } from '@/lib/utils/time-formatters';
import { CALENDAR, DURATIONS } from '@/lib/constants/ui-constants';
import { calendarLayoutStyles, hiddenEventBadgeStyles, currentTimeIndicatorStyles, getEventStyles } from '@/lib/utils/style-helpers';

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
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);

  // Update current time every minute
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

  // Calculate position of current time line
  const isCurrentDay = isToday(currentDate);
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTimePosition = (currentHour * CALENDAR.hourHeight) + (currentMinutes / 60 * CALENDAR.hourHeight);

  // Get all events for today
  const todayEvents = events.filter(event => isSameDay(new Date(event.startDate), currentDate));

  // Calculate hidden events
  const getHiddenEventsCount = () => {
    const visibleTopPosition = scrollTop;
    const visibleBottomPosition = scrollTop + clientHeight;

    let eventsAbove = 0;
    let eventsBelow = 0;

    todayEvents.forEach(event => {
      const eventStart = new Date(event.startDate);
      const eventHour = getHours(eventStart);
      const eventPosition = eventHour * CALENDAR.hourHeight;

      if (eventPosition < visibleTopPosition) {
        eventsAbove++;
      } else if (eventPosition > visibleBottomPosition) {
        eventsBelow++;
      }
    });

    return { eventsAbove, eventsBelow };
  };

  const { eventsAbove, eventsBelow } = getHiddenEventsCount();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    setScrollHeight(target.scrollHeight);
    setClientHeight(target.clientHeight);
  };

  return (
    <div className="flex flex-col p-6" style={calendarLayoutStyles.container}>
      <div className="bg-notion-bg border-b border-notion-border p-4" style={calendarLayoutStyles.header}>
        <div className="text-center">
          <div className="text-sm font-medium text-notion-textLight uppercase">
            {format(currentDate, 'EEEE', { locale: fr })}
          </div>
          <div className="text-2xl font-semibold text-notion-text mt-1">
            {format(currentDate, 'd MMMM yyyy', { locale: fr })}
          </div>
        </div>
      </div>

      <div
        style={calendarLayoutStyles.scrollable}
        onScroll={handleScroll}
      >
        {/* Badge événements cachés en haut */}
        {eventsAbove > 0 && (
          <div
            style={{ ...hiddenEventBadgeStyles.base, ...hiddenEventBadgeStyles.top }}
          >
            ↑ {eventsAbove} événement{eventsAbove > 1 ? 's' : ''} au-dessus
          </div>
        )}

        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div key={hour} className={`flex gap-4 border-b border-notion-border overflow-hidden`} style={{ height: `${CALENDAR.hourHeight}px` }}>
              <div className="w-20 text-sm text-notion-textLight text-right flex-shrink-0 flex items-center justify-end">
                {formatHourLabel(hour, timeFormat === '24h')}
              </div>
              <div className="flex-1 h-full">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="h-full px-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-center"
                    style={getEventStyles(event.color || '#2383e2')}
                  >
                    <div className="font-semibold text-notion-text text-sm truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-notion-textLight truncate">
                      {formatTime(new Date(event.startDate), timeFormat === '24h')} - {formatTime(new Date(event.endDate), timeFormat === '24h')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Badge événements cachés en bas */}
        {eventsBelow > 0 && (
          <div
            style={{ ...hiddenEventBadgeStyles.base, ...hiddenEventBadgeStyles.bottom }}
          >
            ↓ {eventsBelow} événement{eventsBelow > 1 ? 's' : ''} en dessous
          </div>
        )}

        {/* Current time indicator line */}
        {isCurrentDay && (
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
