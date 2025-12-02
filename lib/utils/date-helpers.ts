/**
 * Ajoute un nombre de jours à une date
 * @param date - Date de départ
 * @param days - Nombre de jours à ajouter (peut être négatif)
 * @returns Nouvelle date avec les jours ajoutés
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Formate une date en label lisible pour les créneaux libres
 * @param date - Date à formater
 * @returns String formatée (ex: "lundi 15 janvier à 14h00")
 */
export function formatSlotLabel(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Vérifie si une date est passée
 * @param date Date à vérifier
 * @returns true si la date est passée, false sinon
 */
export function isPast(date: Date): boolean {
  return new Date(date) < new Date();
}

