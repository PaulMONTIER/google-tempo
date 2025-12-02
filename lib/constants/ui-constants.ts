/**
 * Constantes UI centralisées pour l'application
 */

/**
 * Niveaux de z-index pour la superposition des éléments
 * 
 * Hiérarchie (du plus bas au plus haut) :
 * - base (10) : Éléments de base (lignes de temps, indicateurs)
 * - badge (20) : Badges et indicateurs secondaires
 * - dropdown (45) : Menus déroulants, tooltips (sous les notifications)
 * - notification (50) : Notifications toast (au-dessus des dropdowns)
 * - modalOverlay (60) : Overlay des modales
 * - modal (70) : Contenu des modales (au-dessus de tout)
 */
export const Z_INDEX = {
  /** Éléments de base (lignes de temps, indicateurs) */
  base: 10,
  /** Badges et indicateurs secondaires */
  badge: 20,
  /** Menus déroulants, tooltips (sous les notifications) */
  dropdown: 45,
  /** Notifications toast (au-dessus des dropdowns) */
  notification: 50,
  /** Overlay des modales */
  modalOverlay: 60,
  /** Contenu des modales (au-dessus de tout) */
  modal: 70,
} as const;

/**
 * Durées en millisecondes pour les animations et timeouts
 */
export const DURATIONS = {
  /** 1 minute en millisecondes */
  oneMinute: 60000,
  /** 5 secondes */
  fiveSeconds: 5000,
  /** 2 secondes */
  twoSeconds: 2000,
  /** Animation standard (300ms) */
  animation: 300,
  /** Animation longue (500ms) */
  animationLong: 500,
} as const;

/**
 * Constantes spécifiques au calendrier
 */
export const CALENDAR = {
  /** Hauteur d'une heure en pixels (vue jour/semaine) */
  hourHeight: 80,
  /** Hauteur d'une ligne horaire en pixels (vue semaine) */
  hourLineHeight: 60,
} as const;

/**
 * Tailles de breakpoints (pour référence, Tailwind les gère déjà)
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

