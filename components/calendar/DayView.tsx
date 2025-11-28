'use client';

import { CalendarEvent } from '@/types';
import { isSameDay, format, getHours, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';

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

  // Format time based on settings
  const formatTimeValue = (date: Date) => {
    if (timeFormat === '12h') {
      return format(date, 'h:mm a');
    }
    return format(date, 'HH:mm');
  };

  // Format hour label
  const formatHourLabel = (hour: number) => {
    if (timeFormat === '12h') {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour} ${period}`;
    }
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
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
  const currentTimePosition = (currentHour * 80) + (currentMinutes / 60 * 80); // 80px per hour

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
      const eventPosition = eventHour * 80; // 80px per hour

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
    <div className="flex flex-col p-6" style={{height: '100%', maxHeight: '100%', overflow: 'hidden'}}>
      <div className="bg-notion-bg border-b border-notion-border p-4" style={{flexShrink: 0}}>
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
        style={{flex: 1, minHeight: 0, maxHeight: '100%', overflow: 'hidden', overflowY: 'auto', position: 'relative'}}
        onScroll={handleScroll}
      >
        {/* Badge événements cachés en haut */}
        {eventsAbove > 0 && (
          <div
            style={{
              position: 'sticky',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              marginBottom: '8px',
              width: 'fit-content',
              transition: 'all 0.3s ease',
              opacity: 0.95
            }}
          >
            ↑ {eventsAbove} événement{eventsAbove > 1 ? 's' : ''} au-dessus
          </div>
        )}

        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div key={hour} className="flex gap-4 h-[80px] border-b border-notion-border overflow-hidden">
              <div className="w-20 text-sm text-notion-textLight text-right flex-shrink-0 flex items-center justify-end">
                {formatHourLabel(hour)}
              </div>
              <div className="flex-1 h-full">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="h-full px-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-center"
                    style={{ backgroundColor: event.color + '20', borderLeft: '4px solid ' + event.color }}
                  >
                    <div className="font-semibold text-notion-text text-sm truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-notion-textLight truncate">
                      {formatTimeValue(new Date(event.startDate))} - {formatTimeValue(new Date(event.endDate))}
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
            style={{
              position: 'sticky',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              marginTop: '8px',
              width: 'fit-content',
              transition: 'all 0.3s ease',
              opacity: 0.95
            }}
          >
            ↓ {eventsBelow} événement{eventsBelow > 1 ? 's' : ''} en dessous
          </div>
        )}

        {/* Current time indicator line */}
        {isCurrentDay && (
          <div
            style={{
              position: 'absolute',
              top: `${currentTimePosition}px`,
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: '#e74c3c',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '-6px',
                top: '-5px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#e74c3c'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
