/**
 * Classe responsable de la gestion des couleurs d'accent
 */
export class AccentColorManager {
  /**
   * Applique une couleur d'accent au document
   * @param color - Couleur d'accent (hex string)
   * @param currentTheme - Thème actuel ('light' ou 'dark')
   */
  static applyAccentColor(color: string, currentTheme: 'light' | 'dark'): void {
    const root = document.documentElement;
    
    // Set the hex value for inline styles
    root.style.setProperty('--accent-color', color);
    
    // Calculate RGB values for Tailwind
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Set RGB values (space-separated for Tailwind 3 opacity modifier support)
    root.style.setProperty('--accent-color-rgb', `${r} ${g} ${b}`);
    
    // Set light version for backgrounds
    root.style.setProperty(
      '--accent-color-light',
      `rgba(${r}, ${g}, ${b}, 0.1)`
    );
  }
}


