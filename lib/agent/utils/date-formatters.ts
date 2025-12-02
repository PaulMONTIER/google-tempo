/**
 * Formate la date actuelle pour le prompt système
 * @returns Date formatée en français (ex: "lundi 15 janvier 2024")
 */
export function formatCurrentDate(): string {
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return dateFormatter.format(now);
}

/**
 * Formate l'heure actuelle pour le prompt système
 * @returns Heure formatée en français avec timezone Paris (ex: "14:30")
 */
export function formatCurrentTime(): string {
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
  return timeFormatter.format(now);
}

/**
 * Construit le prompt système dynamique en remplaçant les placeholders
 * @param template Template du prompt avec placeholders {current_date} et {current_time}
 * @param date Date formatée
 * @param time Heure formatée
 * @returns Prompt système avec valeurs remplacées
 */
export function buildDynamicSystemPrompt(template: string, date: string, time: string): string {
  return template
    .replace('{current_date}', date)
    .replace('{current_time}', time);
}

