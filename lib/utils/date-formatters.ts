import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate une date en format court (ex: "lun. 15 jan.")
 * @param date Date à formater
 * @returns Date formatée en format court
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Formate une date en format long (ex: "lundi 15 janvier 2024")
 * @param date Date à formater
 * @returns Date formatée en format long
 */
export function formatDateLong(date: Date): string {
  return format(date, 'EEEE d MMMM yyyy', { locale: fr });
}

/**
 * Formate une heure selon le format demandé (12h ou 24h)
 * @param date Date contenant l'heure à formater
 * @param timeFormat Format d'heure ('12h' ou '24h')
 * @returns Heure formatée
 */
export function formatTime(date: Date, timeFormat: '12h' | '24h' = '24h'): string {
  if (timeFormat === '12h') {
    return format(date, 'h:mm a');
  }
  return format(date, 'HH:mm');
}

/**
 * Formate une date avec l'heure (ex: "lundi 15 janvier 2024 à 14:30")
 * @param date Date à formater
 * @param timeFormat Format d'heure ('12h' ou '24h')
 * @returns Date et heure formatées
 */
export function formatDateTime(date: Date, timeFormat: '12h' | '24h' = '24h'): string {
  const dateStr = formatDateLong(date);
  const timeStr = formatTime(date, timeFormat);
  return `${dateStr} à ${timeStr}`;
}

/**
 * Formate une date pour les prompts LLM (ex: "lundi 15 janvier")
 * @param date Date à formater
 * @returns Date formatée pour LLM
 */
export function formatDateForLLM(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

