'use client';

import { useState, useEffect } from 'react';
import { X, Clock, MapPin, AlignLeft, Calendar, CheckCircle } from '@/components/icons';
import { CalendarEvent } from '@/types';
import { format, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    setTimeout(onClose, 300);
  };

  if (!event) return null;

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  // Construire l'arbre de dépendances
  const buildEventTree = () => {
    if (!event.parentEventId && !allEvents.some(e => e.parentEventId === event.id)) {
      return null; // Pas de relations
    }

    // Trouver l'événement principal (racine)
    let mainEvent = event;
    if (event.parentEventId) {
      mainEvent = allEvents.find(e => e.id === event.parentEventId) || event;
    }

    // Trouver tous les événements enfants
    const childEvents = allEvents
      .filter(e => e.parentEventId === mainEvent.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return {
      main: mainEvent,
      children: childEvents,
    };
  };

  const eventTree = buildEventTree();

  // Déterminer le statut automatiquement basé sur la date si non défini
  const getEventStatus = (evt: CalendarEvent): 'completed' | 'in-progress' | 'pending' => {
    if (evt.status) return evt.status;
    const now = new Date();
    const evtStart = new Date(evt.startDate);
    const evtEnd = new Date(evt.endDate);

    if (isPast(evtEnd)) return 'completed';
    if (now >= evtStart && now <= evtEnd) return 'in-progress';
    return 'pending';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: '✅',
          color: '#4dab9a',
          label: 'Complété',
          bgColor: '#4dab9a15',
        };
      case 'in-progress':
        return {
          icon: '🔄',
          color: 'var(--accent-color)',
          label: 'En cours',
          bgColor: 'var(--accent-color-light)',
        };
      default:
        return {
          icon: '⏳',
          color: '#9b9a97',
          label: 'À venir',
          bgColor: '#9b9a9715',
        };
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Modal centré */}
      <div
        className={`fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`bg-notion-bg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all duration-300 ${
            isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Header avec bande de couleur */}
          <div className="relative">
            <div
              className="h-2 rounded-t-2xl"
              style={{ backgroundColor: event.color }}
            />
            <div className="px-8 pt-6 pb-4">
              <button
                onClick={handleClose}
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

          {/* Divider subtil */}
          <div className="px-8">
            <div className="h-px bg-gradient-to-r from-transparent via-notion-border to-transparent" />
          </div>

          {/* Content avec scroll */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
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
                    {format(startDate, 'EEEE d MMMM yyyy', { locale: fr })}
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
                    {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                  </div>
                  <div className="text-sm text-notion-textLight mt-1">
                    {durationMinutes} min
                  </div>
                </div>
              </div>
            </div>

            {/* Arbre de progression */}
            {eventTree && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2.5 rounded-lg"
                    style={{
                      backgroundColor: `${event.color}10`,
                    }}
                  >
                    <CheckCircle className="w-5 h-5" style={{ color: event.color }} />
                  </div>
                  <div className="text-xs font-semibold text-notion-textLight uppercase tracking-wide">
                    Progression
                  </div>
                </div>

                <div className="space-y-1">
                  {/* Événement principal */}
                  <div
                    className="relative pl-6 py-3 rounded-lg transition-all"
                    style={{
                      backgroundColor: eventTree.main.id === event.id ? `${event.color}10` : 'transparent',
                      borderLeft: `3px solid ${eventTree.main.color}`,
                    }}
                  >
                    {/* Ligne connectrice pour l'événement principal */}
                    {eventTree.children.length > 0 && (
                      <div
                        className="absolute left-[11px] top-[100%] w-0.5 h-2 bg-notion-border"
                      />
                    )}

                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getStatusConfig(getEventStatus(eventTree.main)).icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-notion-text flex items-center gap-2">
                          {eventTree.main.title}
                          {eventTree.main.id === event.id && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-notion-blue/10 text-notion-blue rounded">
                              Actuel
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-notion-textLight mt-1">
                          {format(new Date(eventTree.main.startDate), 'EEEE d MMMM à HH:mm', { locale: fr })}
                        </div>
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getStatusConfig(getEventStatus(eventTree.main)).bgColor,
                          color: getStatusConfig(getEventStatus(eventTree.main)).color,
                        }}
                      >
                        {getStatusConfig(getEventStatus(eventTree.main)).label}
                      </div>
                    </div>
                  </div>

                  {/* Événements de préparation */}
                  {eventTree.children.map((childEvent, index) => {
                    const status = getEventStatus(childEvent);
                    const config = getStatusConfig(status);
                    const isLast = index === eventTree.children.length - 1;

                    return (
                      <div key={childEvent.id} className="relative pl-6">
                        {/* Ligne connectrice verticale */}
                        {!isLast && (
                          <div
                            className="absolute left-[11px] top-0 w-0.5 h-full bg-notion-border"
                          />
                        )}

                        {/* Point de connexion */}
                        <div
                          className="absolute left-[8px] top-[18px] w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: config.color,
                            border: '2px solid white',
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                          }}
                        />

                        {/* Ligne horizontale */}
                        <div
                          className="absolute left-[17px] top-[18px] w-4 h-0.5"
                          style={{ backgroundColor: config.color }}
                        />

                        <div
                          className="ml-5 py-3 px-4 rounded-lg transition-all"
                          style={{
                            backgroundColor: childEvent.id === event.id ? `${event.color}10` : 'white',
                            border: `1px solid ${childEvent.id === event.id ? event.color + '40' : '#e9e9e7'}`,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{config.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-notion-text text-sm flex items-center gap-2">
                                {childEvent.title}
                                {childEvent.id === event.id && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-notion-blue/10 text-notion-blue rounded">
                                    Actuel
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-notion-textLight mt-0.5">
                                {format(new Date(childEvent.startDate), 'EEEE d MMMM à HH:mm', { locale: fr })}
                              </div>
                            </div>
                            <div
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: config.bgColor,
                                color: config.color,
                              }}
                            >
                              {config.label}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Barre de progression globale */}
                <div className="mt-4 p-3 bg-notion-sidebar/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-notion-textLight">Progression globale</span>
                    <span className="text-xs font-semibold text-notion-text">
                      {eventTree.children.filter(e => getEventStatus(e) === 'completed').length}/{eventTree.children.length + 1} complété
                    </span>
                  </div>
                  <div className="w-full h-2 bg-notion-border rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${((eventTree.children.filter(e => getEventStatus(e) === 'completed').length + (getEventStatus(eventTree.main) === 'completed' ? 1 : 0)) / (eventTree.children.length + 1)) * 100}%`,
                        backgroundColor: '#4dab9a',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

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

            {/* Lieu */}
            {event.location && (
              <div>
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
