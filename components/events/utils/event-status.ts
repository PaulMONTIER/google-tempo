import { CalendarEvent } from '@/types';
import { isPast } from '@/lib/utils/date-helpers';

export type EventStatus = 'completed' | 'in-progress' | 'pending';

export interface StatusConfig {
  icon: string;
  color: string;
  label: string;
  bgColor: string;
}

/**
 * Détermine le statut d'un événement basé sur sa date
 * @param evt Événement à analyser
 * @returns Statut de l'événement
 */
export function getEventStatus(evt: CalendarEvent): EventStatus {
  if (evt.status) return evt.status;
  const now = new Date();
  const evtStart = new Date(evt.startDate);
  const evtEnd = new Date(evt.endDate);

  if (isPast(evtEnd)) return 'completed';
  if (now >= evtStart && now <= evtEnd) return 'in-progress';
  return 'pending';
}

/**
 * Retourne la configuration d'affichage pour un statut
 * @param status Statut de l'événement
 * @returns Configuration d'affichage
 */
export function getStatusConfig(status: string): StatusConfig {
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
}

