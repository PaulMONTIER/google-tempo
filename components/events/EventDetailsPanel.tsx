'use client';

import { useState, useEffect } from 'react';
import { AlignLeft } from '@/components/icons';
import { CalendarEvent } from '@/types';
import { EventHeader } from './EventHeader';
import { EventInfo } from './EventInfo';
import { EventTree } from './EventTree';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface EventDetailsPanelProps {
  event: CalendarEvent | null;
  onClose: () => void;
  allEvents?: CalendarEvent[]; // Liste complète des événements pour construire l'arbre
}

export function EventDetailsPanel({ event, onClose, allEvents = [] }: EventDetailsPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (event) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [event]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, DURATIONS.animation);
  };

  if (!event) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity`}
        style={{ 
          zIndex: Z_INDEX.modalOverlay, 
          transitionDuration: `${DURATIONS.animation}ms`,
          opacity: isVisible ? 1 : 0
        }}
        onClick={handleClose}
      />

      {/* Modal centré */}
      <div
        className={`fixed inset-0 flex items-center justify-center p-4 transition-all`}
        style={{ 
          zIndex: Z_INDEX.modal, 
          transitionDuration: `${DURATIONS.animation}ms`,
          opacity: isVisible ? 1 : 0
        }}
      >
        <div
          className={`bg-notion-bg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all ${
            isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            transitionDuration: `${DURATIONS.animation}ms`,
          }}
        >
          {/* Header avec bande de couleur */}
          <EventHeader event={event} onClose={handleClose} />

          {/* Divider subtil */}
          <div className="px-8">
            <div className="h-px bg-gradient-to-r from-transparent via-notion-border to-transparent" />
          </div>

          {/* Content avec scroll */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <EventInfo event={event} />

            <EventTree event={event} allEvents={allEvents} />

            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="p-2.5 rounded-lg"
                    style={{
                      backgroundColor: `${event.color}10`,
                    }}
                  >
                    <AlignLeft className="w-5 h-5" style={{ color: event.color }} />
                  </div>
                  <div className="text-xs font-semibold text-notion-textLight uppercase tracking-wide">
                    Description
                  </div>
                </div>
                <div className="pl-0 text-base text-notion-text leading-relaxed bg-notion-sidebar/30 rounded-lg p-4">
                  {event.description}
                </div>
              </div>
            )}
          </div>

          {/* Footer avec actions */}
          <div className="px-8 py-5 border-t border-notion-border bg-notion-sidebar/20 rounded-b-2xl flex gap-3">
            <button
              className="flex-1 px-6 py-3 bg-notion-bg border-2 border-notion-border rounded-xl text-sm font-semibold text-notion-text hover:bg-notion-hover hover:border-notion-textLight transition-all"
              onClick={handleClose}
            >
              Fermer
            </button>
            <button
              className="flex-1 px-6 py-3 bg-notion-blue rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              Modifier l'événement
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
