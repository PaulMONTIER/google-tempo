import { REMINDER_DAYS } from './config/reminder-config';
import { addDays, startOfDay, isAfter, isBefore, isSameDay } from 'date-fns';

export interface ReminderDate {
  daysBefore: number; // J-14, J-7, etc.
  date: Date;
  isActive: boolean; // Si le rappel doit être affiché maintenant
}

/**
 * Calcule toutes les dates de rappel pour un événement goal
 * @param goalDate - Date de l'événement objectif
 * @returns Liste des dates de rappel avec leur statut actif
 */
export function calculateReminderDates(goalDate: Date): ReminderDate[] {
  const goal = startOfDay(goalDate);
  const today = startOfDay(new Date());
  
  return REMINDER_DAYS.map((daysBefore) => {
    const reminderDate = startOfDay(addDays(goal, -daysBefore));
    
    // Un rappel est actif s'il est aujourd'hui ou dans le passé, mais pas trop ancien (max 1 jour)
    const isActive = 
      (isSameDay(reminderDate, today) || isBefore(reminderDate, today)) &&
      !isAfter(reminderDate, addDays(today, 1)); // Pas plus d'un jour dans le passé
    
    return {
      daysBefore,
      date: reminderDate,
      isActive,
    };
  });
}

/**
 * Récupère les rappels actifs pour un événement goal
 * @param goalDate - Date de l'événement objectif
 * @param currentDate - Date actuelle (par défaut: aujourd'hui)
 * @returns Liste des rappels actifs uniquement
 */
export function getActiveReminders(goalDate: Date, currentDate: Date = new Date()): ReminderDate[] {
  const allReminders = calculateReminderDates(goalDate);
  const today = startOfDay(currentDate);
  
  return allReminders.filter((reminder) => {
    const reminderDay = startOfDay(reminder.date);
    
    // Rappel actif s'il est aujourd'hui ou hier (pour ne pas rater les rappels du jour)
    return isSameDay(reminderDay, today) || isSameDay(reminderDay, addDays(today, -1));
  });
}

/**
 * Vérifie si un rappel doit être envoyé
 * @param reminderDate - Date du rappel
 * @param currentDate - Date actuelle
 * @returns true si le rappel doit être envoyé
 */
export function shouldSendReminder(reminderDate: Date, currentDate: Date = new Date()): boolean {
  const reminder = startOfDay(reminderDate);
  const today = startOfDay(currentDate);
  
  // Envoyer le rappel s'il est aujourd'hui
  return isSameDay(reminder, today);
}


