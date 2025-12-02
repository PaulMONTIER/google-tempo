import { Theme } from '@/types';

/**
 * Classe responsable de l'application des thèmes au document
 */
export class ThemeManager {
  /**
   * Applique un thème au document
   * @param theme - Thème à appliquer ('light', 'dark', ou 'system')
   */
  static applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    // Supprimer les anciennes classes
    root.classList.remove('light', 'dark');
    
    // Déterminer le thème effectif
    let effectiveTheme: 'light' | 'dark' = theme === 'system' 
      ? this.getSystemTheme() 
      : theme;
    
    // Appliquer la classe
    root.classList.add(effectiveTheme);
  }
  
  /**
   * Obtient le thème système actuel
   * @returns 'light' ou 'dark'
   */
  static getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  /**
   * Écoute les changements de thème système
   * @param callback - Fonction appelée lors du changement
   * @returns Fonction de nettoyage
   */
  static watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
    if (typeof window === 'undefined') return () => {};
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }
}


