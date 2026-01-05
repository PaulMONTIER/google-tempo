'use client';

import { CalendarEvent } from '@/types';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  format,
  getHours,
  getMinutes,
  differenceInMinutes
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { formatHourLabel, formatTime } from '@/lib/utils/time-formatters';
import { CALENDAR, DURATIONS } from '@/lib/constants/ui-constants';
import { calendarLayoutStyles, currentTimeIndicatorStyles } from '@/lib/utils/style-helpers';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  weekStartsOn?: 0 | 1;
  timeFormat?: '12h' | '24h';
}

// Palette minimaliste
function getEventColor(color: string) {
  const colors: Record<string, { bg: string; border: string }> = {
    '#2383e2': { bg: 'rgba(66, 133, 244, 0.12)', border: '#4285f4' },
    '#e74c3c': { bg: 'rgba(234, 67, 53, 0.12)', border: '#ea4335' },
    '#2ecc71': { bg: 'rgba(52, 168, 83, 0.12)', border: '#34a853' },
    '#f39c12': { bg: 'rgba(251, 188, 4, 0.12)', border: '#fbbc04' },
    '#9b59b6': { bg: 'rgba(142, 68, 173, 0.12)', border: '#8e44ad' },
  };
  return colors[color] || { bg: `${color}1a`, border: color };
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, DURATIONS.oneMinute);
    return () => clearInterval(interval);
  }, []);

  // Récupère les événements pour un jour donné
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.startDate), day));
  };

  // Calcule la position et hauteur d'un événement
  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const startHour = getHours(start);
    const startMinute = getMinutes(start);
    const durationMinutes = differenceInMinutes(end, start);

    const top = (startHour * CALENDAR.hourLineHeight) + (startMinute / 60 * CALENDAR.hourLineHeight);
    const height = Math.max((durationMinutes / 60) * CALENDAR.hourLineHeight, 20); // Min 20px

    return { top, height };
  };

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
              <div key={day.toString()} className="bg-notion-bg p-3 text-center">
                <div className="text-xs font-medium text-notion-textLight uppercase">
                  {format(day, 'EEE', { locale: fr })}
                </div>
                <div className={`text-lg font-semibold mt-1 ${isDayToday
                  ? 'bg-notion-blue text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                  : 'text-notion-text'
                  }`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time grid */}
      <div style={calendarLayoutStyles.scrollable}>
        <div className="grid grid-cols-8 gap-px bg-notion-border">
          {/* Colonne des heures */}
          <div className="bg-notion-sidebar">
            {hours.map((hour) => (
              <div
                key={hour}
                className="text-xs text-notion-textLight text-right pr-3 flex items-start justify-end"
                style={{ height: `${CALENDAR.hourLineHeight}px`, paddingTop: '4px' }}
              >
                {formatHourLabel(hour, timeFormat === '24h')}
              </div>
            ))}
          </div>

          {/* Colonnes des jours avec événements positionnés */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            return (
              <div key={day.toString()} className="bg-notion-bg relative">
                {/* Lignes horaires */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-notion-border hover:bg-notion-hover/50 transition-colors"
                    style={{ height: `${CALENDAR.hourLineHeight}px` }}
                  />
                ))}

                {/* Événements positionnés absolument */}
                {dayEvents.map((event) => {
                  const { top, height } = getEventPosition(event);
                  const eventColor = event.color || '#2383e2';
                  const startTime = formatTime(new Date(event.startDate), timeFormat === '24h');

                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className="absolute left-1 right-1 cursor-pointer rounded-lg overflow-hidden transition-all duration-150 hover:shadow-md hover:z-10 flex gap-2 px-2 py-1"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: `${eventColor}20`,
                      }}
                    >
                      {/* Barre verticale */}
                      <div
                        className="w-1 self-stretch rounded-full flex-shrink-0"
                        style={{ backgroundColor: eventColor }}
                      />

                      {/* Contenu */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="text-xs font-medium text-notion-text truncate">
                          {event.title}
                        </div>
                        {height > 30 && (
                          <div className="text-[10px] text-notion-textLight">
                            {startTime}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Current time indicator */}
        {isCurrentWeek && (
          <div style={{ ...currentTimeIndicatorStyles.line, top: `${currentTimePosition}px` }}>
            <div style={currentTimeIndicatorStyles.dot} />
          </div>
        )}
      </div>
    </div>
  );
}

