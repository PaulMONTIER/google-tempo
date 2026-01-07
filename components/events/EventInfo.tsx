'use client';

import { Clock, MapPin, Calendar } from '@/components/ui/icons';
import { CalendarEvent } from '@/types';
import { formatDateLong, formatTime } from '@/lib/utils/date-formatters';

interface EventInfoProps {
  event: CalendarEvent;
}

/**
 * Composant affichant les informations de base de l'événement (date, heure, lieu)
 */
export function EventInfo({ event }: EventInfoProps) {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Date */}
        <div className="flex items-start gap-4">
          <div
            className="p-3 rounded-xl flex-shrink-0"
            style={{
              backgroundColor: `${event.color}15`,
            }}
          >
            <Calendar className="w-6 h-6" style={{ color: event.color }} />
          </div>
          <div className="flex-1 pt-1">
            <div className="text-xs font-semibold text-notion-textLight uppercase tracking-wide mb-2">
              Date
            </div>
            <div className="text-base font-semibold text-notion-text capitalize">
              {formatDateLong(startDate)}
            </div>
          </div>
        </div>

        {/* Heure */}
        <div className="flex items-start gap-4">
          <div
            className="p-3 rounded-xl flex-shrink-0"
            style={{
              backgroundColor: `${event.color}15`,
            }}
          >
            <Clock className="w-6 h-6" style={{ color: event.color }} />
          </div>
          <div className="flex-1 pt-1">
            <div className="text-xs font-semibold text-notion-textLight uppercase tracking-wide mb-2">
              Horaire
            </div>
            <div className="text-base font-semibold text-notion-text">
              {formatTime(startDate)} - {formatTime(endDate)}
            </div>
            <div className="text-sm text-notion-textLight mt-1">
              {durationMinutes} min
            </div>
          </div>
        </div>
      </div>

      {/* Lieu */}
      {event.location && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="p-2.5 rounded-lg"
              style={{
                backgroundColor: `${event.color}10`,
              }}
            >
              <MapPin className="w-5 h-5" style={{ color: event.color }} />
            </div>
            <div className="text-xs font-semibold text-notion-textLight uppercase tracking-wide">
              Lieu
            </div>
          </div>
          <div className="pl-0 text-base font-medium text-notion-text bg-notion-sidebar/30 rounded-lg p-4">
            {event.location}
          </div>
        </div>
      )}
    </>
  );
}

