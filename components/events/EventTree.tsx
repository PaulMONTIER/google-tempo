'use client';

import { CheckCircle } from '@/components/icons';
import { CalendarEvent } from '@/types';
import { buildEventTree, type EventTree } from './utils/event-tree-builder';
import { getEventStatus, getStatusConfig } from './utils/event-status';
import { formatDateTime } from '@/lib/utils/date-formatters';

interface EventTreeProps {
  event: CalendarEvent;
  allEvents: CalendarEvent[];
}

/**
 * Composant affichant l'arbre de progression d'un événement
 */
export function EventTree({ event, allEvents }: EventTreeProps) {
  const eventTree = buildEventTree(event, allEvents);

  if (!eventTree) {
    return null;
  }

  return (
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
                {formatDateTime(new Date(eventTree.main.startDate))}
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
                      {formatDateTime(new Date(childEvent.startDate))}
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
  );
}

