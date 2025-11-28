'use client';

import { CalendarEvent } from '@/types';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  getWeek
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
  weekStartsOn?: 0 | 1;
  showWeekNumbers?: boolean;
  timeFormat?: '12h' | '24h';
}

export function MonthView({
  currentDate,
  events,
  onEventClick,
  onDayClick,
  weekStartsOn = 1,
  showWeekNumbers = false,
  timeFormat = '24h'
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Day names based on week start
  const dayNames = weekStartsOn === 1
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Format time based on settings
  const formatTime = (date: Date) => {
    if (timeFormat === '12h') {
      return format(date, 'h:mm a');
    }
    return format(date, 'HH:mm');
  };

  // Get week numbers for display
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getEventsForDay = (day: Date) => {
    return events.filter(event =>
      isSameDay(new Date(event.startDate), day)
    );
  };

  return (
    <div className="flex flex-col p-4" style={{height: '100%', maxHeight: '100%', overflow: 'hidden'}}>
      {/* Days of week header */}
      <div className={`grid gap-px bg-notion-border mb-2 ${showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'}`} style={{flexShrink: 0}}>
        {showWeekNumbers && (
          <div className="bg-notion-sidebar py-2 px-3 text-center text-xs font-semibold text-notion-textLight">
            Sem
          </div>
        )}
        {dayNames.map((day) => (
          <div
            key={day}
            className="bg-notion-sidebar py-2 px-3 text-center text-xs font-semibold text-notion-textLight"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - uses CSS grid to fill available height */}
      <div
        className="grid gap-px bg-notion-border"
        style={{
          flex: 1,
          minHeight: 0,
          gridTemplateRows: `repeat(${weeks.length}, 1fr)`,
          overflow: 'hidden'
        }}
      >
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className={`grid gap-px bg-notion-border ${showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'}`}
            style={{minHeight: 0}}
          >
            {showWeekNumbers && (
              <div className="bg-notion-sidebar p-2 flex items-start justify-center">
                <span className="text-xs font-medium text-notion-textLight">
                  {getWeek(week[0], { weekStartsOn })}
                </span>
              </div>
            )}
            {week.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);

              return (
                <div
                  key={day.toString()}
                  onClick={() => onDayClick?.(day)}
                  className={`bg-notion-bg p-2 cursor-pointer hover:bg-notion-hover transition-colors flex flex-col ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  }`}
                  style={{minHeight: 0, overflow: 'hidden'}}
                >
                  <div className="flex items-center justify-between mb-1" style={{flexShrink: 0}}>
                    <span
                      className={`text-sm font-medium ${
                        isDayToday
                          ? 'bg-notion-blue text-white rounded-full w-6 h-6 flex items-center justify-center'
                          : isCurrentMonth
                          ? 'text-notion-text'
                          : 'text-notion-textLight'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="space-y-1 overflow-hidden flex-1" style={{minHeight: 0}}>
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        className="text-xs p-1 rounded truncate hover:shadow-sm transition-shadow cursor-pointer overflow-hidden"
                        style={{ backgroundColor: event.color + '20', color: event.color }}
                      >
                        {formatTime(new Date(event.startDate))} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-notion-textLight pl-1">
                        +{dayEvents.length - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
