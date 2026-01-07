'use client';

import { X } from '@/components/ui/icons';
import { CalendarEvent } from '@/types';

interface EventHeaderProps {
  event: CalendarEvent;
  onClose: () => void;
}

/**
 * Header de l'événement avec bande de couleur
 */
export function EventHeader({ event, onClose }: EventHeaderProps) {
  return (
    <div className="relative">
      <div
        className="h-2 rounded-t-2xl"
        style={{ backgroundColor: event.color }}
      />
      <div className="px-8 pt-6 pb-4">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-notion-hover rounded-lg transition-colors group"
        >
          <X className="w-5 h-5 text-notion-textLight group-hover:text-notion-text" />
        </button>

        <div className="pr-12">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: event.color }}
            />
            <span className="text-xs font-semibold text-notion-textLight uppercase tracking-wider">
              Événement
            </span>
          </div>
          <h2 className="text-3xl font-bold text-notion-text leading-tight mb-1">
            {event.title}
          </h2>
        </div>
      </div>
    </div>
  );
}

