/**
 * Types pour les actions en attente de confirmation
 */

export interface PendingEvent {
  id: string; // UUID temporaire (pending-{timestamp})
  title: string;
  startDateTime: string; // ISO 8601
  endDateTime: string;
  description?: string;
  location?: string;
  attendees?: string[];
}

export type PendingActionType = 'create' | 'delete' | 'batch_delete';

export interface PendingEventResponse {
  type: 'pending_event' | 'pending_batch_event';
  actionType: PendingActionType; // 🆕 Type d'action
  event: PendingEvent;
  message: string; // Message de l'agent "Voici l'événement proposé..."
  eventId?: string; // 🆕 Pour la suppression, ID de l'événement existant
  eventIds?: string[]; // 🆕 Pour la suppression batch
  count?: number; // 🆕 Nombre d'événements pour le batch
}

export interface ConfirmEventRequest {
  event: PendingEvent;
  action: 'accept' | 'modify' | 'reject';
  actionType: PendingActionType; // 🆕 Type d'action originale
  eventId?: string; // 🆕 Pour la suppression simple
  eventIds?: string[]; // 🆕 Pour la suppression batch
  rejectionReason?: string;
  modifiedEvent?: Partial<PendingEvent>;
}

export interface ConfirmEventResponse {
  success: boolean;
  event?: any; // L'événement créé/supprimé dans Google Calendar
  error?: string;
  nextPrompt?: string; // Pour demander une alternative après refus
}
