export const REMINDER_DAYS = [14, 7, 5, 4, 3, 2, 1, 0] as const; // J-14, J-7, J-5, J-4, J-3, J-2, J-1, Jour J

export const REMINDER_MESSAGES = {
  GOAL_APPROACHING: (days: number, title: string) => 
    days === 0 
      ? `🎯 ${title} est aujourd'hui ! Prêt(e) ?`
      : `⏰ ${title} dans ${days} jour${days > 1 ? 's' : ''}`,
  PREPARATION_REMINDER: (title: string) => 
    `📚 N'oubliez pas de préparer : ${title}`,
} as const;


