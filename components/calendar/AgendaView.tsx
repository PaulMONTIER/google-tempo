'use client';

import { CalendarEvent } from '@/types';
import { 
  isSameDay, 
  format, 
  addDays, 
  isToday, 
  isTomorrow,
  startOfDay,
  differenceInMinutes
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatTime } from '@/lib/utils/time-formatters';
import { Clock, MapPin, Calendar } from 'lucide-react';

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  timeFormat?: '12h' | '24h';
  daysToShow?: number;
}

/**
 * Vue Agenda - Liste des événements à venir
 * Affiche les événements groupés par jour sur les N prochains jours
 */
export function AgendaView({
  currentDate,
  events,
  onEventClick,
  timeFormat = '24h',
  daysToShow = 14,
}: AgendaViewProps) {
  // Générer les jours à afficher
  const days = Array.from({ length: daysToShow }, (_, i) => addDays(currentDate, i));

  // Grouper les événements par jour
  const getEventsForDay = (day: Date) => {
    return events
      .filter(event => isSameDay(new Date(event.startDate), day))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  // Formater le titre du jour
  const getDayTitle = (day: Date) => {
    if (isToday(day)) return "Aujourd'hui";
    if (isTomorrow(day)) return "Demain";
    return format(day, 'EEEE d MMMM', { locale: fr });
  };

  // Calculer la durée
  const getDuration = (event: CalendarEvent) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const minutes = differenceInMinutes(end, start);
    
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h${remainingMinutes}`;
  };

  // Filtrer les jours qui ont des événements (pour la vue)
  const daysWithEvents = days.filter(day => getEventsForDay(day).length > 0);
  const emptyDays = days.filter(day => getEventsForDay(day).length === 0);

  return (
    <div className="flex flex-col h-full bg-notion-bg overflow-y-auto">
      <div className="px-6 py-4 space-y-6">
        {/* Jours avec événements */}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentDay = isToday(day);
          
          // Ne pas afficher les jours sans événements (sauf aujourd'hui)
          if (dayEvents.length === 0 && !isCurrentDay) return null;

          return (
            <div key={day.toISOString()} className="space-y-3">
              {/* Header du jour */}
              <div className="flex items-center gap-3">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-xl font-semibold text-lg
                  ${isCurrentDay 
                    ? 'bg-notion-blue text-white' 
                    : 'bg-notion-sidebar text-notion-text'
                  }
                `}>
                  {format(day, 'd')}
                </div>
                <div>
                  <h3 className={`font-semibold capitalize ${
                    isCurrentDay ? 'text-notion-blue' : 'text-notion-text'
                  }`}>
                    {getDayTitle(day)}
                  </h3>
                  <p className="text-xs text-notion-textLight">
                    {dayEvents.length === 0 
                      ? 'Aucun événement' 
                      : `${dayEvents.length} événement${dayEvents.length > 1 ? 's' : ''}`
                    }
                  </p>
                </div>
              </div>

              {/* Liste des événements */}
              {dayEvents.length > 0 ? (
                <div className="ml-6 space-y-2">
                  {dayEvents.map((event) => {
                    const eventColor = event.color || '#2383e2';
                    const startTime = formatTime(new Date(event.startDate), timeFormat === '24h');
                    const endTime = formatTime(new Date(event.endDate), timeFormat === '24h');
                    const duration = getDuration(event);

                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick?.(event)}
                        className="group flex gap-4 p-4 rounded-xl cursor-pointer 
                                   transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                                   border border-transparent hover:border-notion-border"
                        style={{ backgroundColor: `${eventColor}10` }}
                      >
                        {/* Barre de couleur */}
                        <div
                          className="w-1 self-stretch rounded-full flex-shrink-0"
                          style={{ backgroundColor: eventColor }}
                        />

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-notion-text group-hover:text-notion-blue transition-colors truncate">
                            {event.title}
                          </h4>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-notion-textLight">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {startTime} - {endTime}
                            </span>
                            <span className="px-2 py-0.5 bg-notion-sidebar rounded-full">
                              {duration}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-notion-textLight">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}

                          {event.description && (
                            <p className="mt-2 text-xs text-notion-textLight line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : isCurrentDay ? (
                <div className="ml-6 p-4 rounded-xl bg-notion-sidebar border border-dashed border-notion-border">
                  <div className="flex items-center gap-2 text-sm text-notion-textLight">
                    <Calendar className="w-4 h-4" />
                    <span>Aucun événement aujourd&apos;hui</span>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {/* Message si aucun événement dans les N prochains jours */}
        {daysWithEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="w-12 h-12 text-notion-textLight mb-4" />
            <h3 className="text-lg font-medium text-notion-text mb-2">
              Aucun événement à venir
            </h3>
            <p className="text-sm text-notion-textLight max-w-xs">
              Vous n&apos;avez pas d&apos;événements planifiés dans les {daysToShow} prochains jours.
              Demandez à Tempo d&apos;en créer un !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

