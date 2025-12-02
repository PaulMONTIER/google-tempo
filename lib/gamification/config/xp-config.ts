export const XP_REWARDS = {
  TASK_CREATED: 20,
  TASK_COMPLETED: 30,
  QUIZ_COMPLETED: 50,
  QUIZ_MULTIPLIER: 1.5,
} as const;

export const STREAK_BONUS = {
  MIN_STREAK: 7,
  MULTIPLIER: 1.5,
} as const;

export type XpActionType = 'task_created' | 'task_completed' | 'quiz_completed';


