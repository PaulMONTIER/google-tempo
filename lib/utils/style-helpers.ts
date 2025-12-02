import { Z_INDEX, DURATIONS, CALENDAR } from '@/lib/constants/ui-constants';

/**
 * Styles communs pour les layouts de calendrier
 * 
 * Usage : Appliquer aux conteneurs principaux des vues calendrier (DayView, WeekView, MonthView)
 * 
 * Limitations :
 * - container : Nécessite un parent avec une hauteur définie (flex ou height)
 * - header : Doit être utilisé avec flexbox (flexShrink: 0)
 * - scrollable : Nécessite un parent flex avec flex-direction: column
 */
export const calendarLayoutStyles = {
  container: {
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
  } as React.CSSProperties,
  header: {
    flexShrink: 0,
  } as React.CSSProperties,
  scrollable: {
    flex: 1,
    minHeight: 0,
    maxHeight: '100%',
    overflow: 'hidden',
    overflowY: 'auto' as const,
    position: 'relative' as const,
  } as React.CSSProperties,
};

/**
 * Styles pour les badges d'événements cachés
 * 
 * Usage : Badges affichés dans DayView pour indiquer les événements hors de la zone visible
 * 
 * Limitations :
 * - Nécessite un parent avec position: relative et overflow: auto/scroll
 * - Utilise var(--accent-color) : dépend de la couleur d'accent configurée
 * - Position sticky : peut ne pas fonctionner dans certains contextes flex/grid complexes
 * 
 * Exemple d'utilisation :
 * ```tsx
 * <div style={{ ...hiddenEventBadgeStyles.base, ...hiddenEventBadgeStyles.top }}>
 *   ↑ {count} événements au-dessus
 * </div>
 * ```
 */
export const hiddenEventBadgeStyles = {
  base: {
    position: 'sticky' as const,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: Z_INDEX.badge,
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    width: 'fit-content',
    transition: `all ${DURATIONS.animation}ms ease`,
    opacity: 0.95,
  } as React.CSSProperties,
  top: {
    top: 0,
    marginBottom: '8px',
  } as React.CSSProperties,
  bottom: {
    bottom: 0,
    marginTop: '8px',
  } as React.CSSProperties,
};

/**
 * Styles pour l'indicateur de temps actuel
 * 
 * Usage : Ligne rouge horizontale indiquant l'heure actuelle dans les vues calendrier (DayView, WeekView)
 * 
 * Limitations :
 * - Nécessite un parent avec position: relative
 * - La position top doit être calculée dynamiquement (ex: `${hour * CALENDAR.hourHeight}px`)
 * - Couleur fixe (#e74c3c) : ne s'adapte pas au thème (peut être amélioré avec CSS variables)
 * 
 * Exemple d'utilisation :
 * ```tsx
 * <div style={{ ...currentTimeIndicatorStyles.line, top: `${position}px` }}>
 *   <div style={currentTimeIndicatorStyles.dot} />
 * </div>
 * ```
 */
export const currentTimeIndicatorStyles = {
  line: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: '#e74c3c',
    zIndex: Z_INDEX.base,
    pointerEvents: 'none' as const,
  } as React.CSSProperties,
  dot: {
    position: 'absolute' as const,
    left: '-6px',
    top: '-5px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#e74c3c',
  } as React.CSSProperties,
};

/**
 * Helper pour obtenir les styles d'événement avec couleur dynamique
 * 
 * Usage : Styles pour les événements dans DayView (avec bordure gauche colorée)
 * 
 * Limitations :
 * - Format couleur attendu : hex string (ex: "#2383e2") ou rgb/rgba
 * - L'opacité du background est fixée à 20 (hex: "20" = ~12.5% d'opacité)
 * - La bordure est fixée à 4px solid
 * - Ne gère pas les couleurs nommées CSS (red, blue, etc.) - utiliser hex/rgb
 * 
 * @param color - Couleur de l'événement au format hex (ex: "#2383e2")
 * @returns Styles React avec backgroundColor et borderLeft
 * 
 * @example
 * ```tsx
 * <div style={getEventStyles(event.color || '#2383e2')}>
 *   {event.title}
 * </div>
 * ```
 */
export function getEventStyles(color: string) {
  return {
    backgroundColor: `${color}20`,
    borderLeft: `4px solid ${color}`,
  } as React.CSSProperties;
}

/**
 * Helper pour obtenir les styles d'événement avec couleur (sans bordure)
 * 
 * Usage : Styles pour les événements dans WeekView (sans bordure, couleur de texte)
 * 
 * Limitations :
 * - Format couleur attendu : hex string (ex: "#2383e2") ou rgb/rgba
 * - L'opacité du background est fixée à 20 (hex: "20" = ~12.5% d'opacité)
 * - La couleur de texte utilise directement la couleur fournie
 * - Ne gère pas les couleurs nommées CSS (red, blue, etc.) - utiliser hex/rgb
 * 
 * @param color - Couleur de l'événement au format hex (ex: "#2383e2")
 * @returns Styles React avec backgroundColor et color
 * 
 * @example
 * ```tsx
 * <div style={getEventColorStyles(event.color || '#2383e2')}>
 *   {event.title}
 * </div>
 * ```
 */
export function getEventColorStyles(color: string) {
  return {
    backgroundColor: `${color}20`,
    color: color,
  } as React.CSSProperties;
}

