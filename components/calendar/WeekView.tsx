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

  // Format time based on settings
  const formatTime = (date: Date) => {
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
  const currentTimePosition = (currentHour * 60) + (currentMinutes / 60 * 60); // 60px per hour

  return (
    <div className="flex flex-col p-6" style={{height: '100%', maxHeight: '100%', overflow: 'hidden'}}>
      {/* Header with days */}
      <div className="bg-notion-bg border-b border-notion-border" style={{flexShrink: 0}}>
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
      <div style={{flex: 1, minHeight: 0, maxHeight: '100%', overflow: 'hidden', overflowY: 'auto', position: 'relative'}}>
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 gap-px bg-notion-border h-[60px]">
            <div className="bg-notion-sidebar p-2 text-xs text-notion-textLight text-right pr-3">
              {formatHourLabel(hour)}
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
                      style={{ backgroundColor: event.color + '20', color: event.color }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-80 truncate">
                        {formatTime(new Date(event.startDate))} - {formatTime(new Date(event.endDate))}
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
