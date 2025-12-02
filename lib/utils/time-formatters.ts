/**
 * Formate une heure pour l'affichage dans le calendrier
 * @param date - Date à formater
 * @param format24h - Si true, utilise format 24h, sinon format 12h
 * @returns Heure formatée (ex: "14:00" ou "2:00 PM")
 */
export function formatTime(date: Date, format24h: boolean = true): string {
  if (format24h) {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}

/**
 * Formate un label d'heure pour les axes du calendrier
 * @param hour - Heure (0-23)
 * @param format24h - Si true, utilise format 24h, sinon format 12h
 * @returns Label formaté (ex: "14:00" ou "2 PM")
 */
export function formatHourLabel(hour: number, format24h: boolean = true): string {
  if (format24h) {
    return `${hour.toString().padStart(2, '0')}:00`;
  } else {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour} ${period}`;
  }
}

/**
 * Formate une durée en minutes en format lisible
 * @param minutes - Durée en minutes
 * @returns Durée formatée (ex: "1h 30min" ou "45min")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}min`;
  }
}


