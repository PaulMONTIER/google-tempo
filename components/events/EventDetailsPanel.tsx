'use client';

import { useState, useEffect } from 'react';
import { AlignLeft, Sparkles, Youtube, ExternalLink, Globe, Loader2 } from 'lucide-react';
import { CalendarEvent } from '@/types';
import { EventHeader } from './EventHeader';
import { EventInfo } from './EventInfo';
import { EventTree } from './EventTree';
import { Z_INDEX, DURATIONS } from '@/lib/constants/ui-constants';

interface EventDetailsPanelProps {
  event: CalendarEvent | null;
  onClose: () => void;
  allEvents?: CalendarEvent[];
  onEdit?: (event: CalendarEvent) => void;
  onGenerateRevision?: (event: CalendarEvent) => void;
}

export function EventDetailsPanel({ event, onClose, allEvents = [], onEdit, onGenerateRevision }: EventDetailsPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedResources, setEnrichedResources] = useState<any[] | null>(null);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      requestAnimationFrame(() => setIsVisible(true));
      setEnrichedResources(null); // Reset when opening a new event
      setEnrichError(null);
    } else {
      setIsVisible(false);
    }
  }, [event]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, DURATIONS.animation);
  };

  const handleEnrich = async () => {
    if (!event) return;
    setIsEnriching(true);
    setEnrichError(null);
    try {
      const response = await fetch('/api/events/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          description: event.description
        })
      });
      const data = await response.json();
      if (data.success) {
        setEnrichedResources(data.resources);
      } else {
        setEnrichError(`${data.message || 'Erreur'} (ID: ${event.id})`);
      }
    } catch (error: any) {
      console.error('Error enriching event:', error);
      setEnrichError(`Erreur: ${error.message} (ID: ${event.id})`);
    } finally {
      setIsEnriching(false);
    }
  };

  if (!event) return null;

  const isRevisionSession = event.title.startsWith('📚');

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity`}
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
          className={`bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
            }`}
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            transitionDuration: `${DURATIONS.animation}ms`,
          }}
        >
          {/* Header avec bande de couleur */}
          <EventHeader event={event} onClose={handleClose} />

          {/* Divider subtil */}
          <div className="px-8">
            <div className="h-px bg-white/5" />
          </div>

          {/* Content avec scroll */}
          <div className="flex-1 overflow-y-auto px-8 py-6 text-gray-200">
            <EventInfo event={event} />

            <EventTree event={event} allEvents={allEvents} />

            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="p-2.5 rounded-lg bg-white/5"
                  >
                    <AlignLeft className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Description
                  </div>
                </div>
                <div className="pl-0 text-base text-gray-300 leading-relaxed bg-black/20 rounded-lg p-4 border border-white/5">
                  {event.description}
                </div>
              </div>
            )}

            {/* Suggested Resources (Enrichment) */}
            {(event.extendedProps?.suggestedResources || enrichedResources) && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-indigo-500/10">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Ressources suggérées
                  </div>
                </div>
                <div className="space-y-3">
                  {(() => {
                    let resources = enrichedResources;
                    if (!resources && event.extendedProps?.suggestedResources) {
                      try {
                        const raw = event.extendedProps.suggestedResources;
                        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                        // Handle compact format (t, u, y) or full format (title, url, type)
                        resources = parsed.map((r: any) => ({
                          title: r.title || r.t || '',
                          url: r.url || r.u || '',
                          type: r.type || r.y || 'web'
                        }));
                      } catch (e) {
                        console.error('Error parsing suggestedResources:', e);
                        resources = [];
                      }
                    }

                    return resources?.map((res: any, i: number) => (
                      <a
                        key={i}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center flex-shrink-0">
                          {res.type === 'youtube' ? (
                            <Youtube className="w-5 h-5 text-red-500" />
                          ) : (
                            <Globe className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate group-hover:text-indigo-300 transition-colors">
                            {res.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {res.type === 'youtube' ? 'YouTube' : 'Ressource externe'}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                      </a>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Enrich Button if no resources */}
            {!event.extendedProps?.suggestedResources && !enrichedResources && (
              <div className="mb-6">
                <button
                  onClick={handleEnrich}
                  disabled={isEnriching}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-indigo-400 font-medium group"
                >
                  {isEnriching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Recherche de ressources...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Enrichir cet événement avec l'IA
                    </>
                  )}
                </button>
                {enrichError && (
                  <p className="mt-2 text-center text-xs text-red-400">
                    {enrichError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer avec actions */}
          <div className="px-8 py-5 border-t border-white/10 bg-white/5 rounded-b-2xl flex gap-3">
            <button
              className="flex-1 px-6 py-3 bg-transparent border border-white/10 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition-all"
              onClick={handleClose}
            >
              Fermer
            </button>

            {/* Bouton Générer Programme (Masqué si session de révision) */}
            {!isRevisionSession && (
              <button
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold transition-all hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                onClick={() => {
                  onGenerateRevision?.(event);
                  handleClose();
                }}
              >
                <Sparkles className="w-4 h-4" />
                Générer un programme
              </button>
            )}

            <button
              className="flex-1 px-6 py-3 bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white transition-all hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onEdit?.(event)}
              disabled={!onEdit}
            >
              Modifier
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
