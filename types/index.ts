export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  color?: string;
  htmlLink?: string; // Lien direct vers l'événement dans Google Calendar
  reminders?: Reminder[];
  // Champs pour la gestion des dépendances et progression
  parentEventId?: string; // ID de l'événement parent
  status?: 'pending' | 'in-progress' | 'completed'; // Statut de progression
  eventType?: 'main' | 'preparation' | 'subtask'; // Type d'événement
  order?: number; // Ordre dans la séquence
  extendedProps?: any; // Métadonnées supplémentaires (ex: ressources suggérées)
}

export interface Reminder {
  id: string;
  eventId: string;
  time: Date;
  type: 'notification' | 'email' | 'call';
  sent: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    events?: CalendarEvent[];
    action?: 'create' | 'update' | 'delete' | 'search' | 'none' | 'pending';
  };
}

export interface AIResponse {
  message: string;
  events?: CalendarEvent[];
  action?: 'create' | 'update' | 'delete' | 'search' | 'none' | 'pending';
  error?: string;
}

export type ViewMode = 'month' | 'week' | 'day' | 'agenda' | 'arbre';

export interface ConflictInfo {
  hasConflict: boolean;
  conflictingEvents?: CalendarEvent[];
}

export type Theme = 'light' | 'dark' | 'system';

export type AccentColor = string;

/**
 * Interface pour une règle automatique
 */
export interface Rule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  createdAt: Date;
}

// Export des types pour la confirmation d'événements
export * from './pending-event';
