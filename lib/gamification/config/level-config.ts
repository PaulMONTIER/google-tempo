/**
 * Calcule le niveau à partir de l'XP
 * Formule hybride : Linéaire pour niveaux 1-10, puis exponentiel
 * 
 * Niveaux 1-10 : level = floor(xp / 100) + 1
 *   - Niveau 1 → 2 : 100 XP
 *   - Niveau 2 → 3 : 200 XP
 *   - ...
 *   - Niveau 10 : 1000 XP
 * 
 * Niveaux 11+ : level = floor(sqrt((xp - 1000) / 50)) + 10
 *   - Niveau 11 : 1050 XP
 *   - Niveau 12 : 1200 XP
 *   - Niveau 20 : 5000 XP
 *   - Niveau 50 : 50,000 XP
 */
export function calculateLevel(xp: number): number {
  if (xp < 1000) {
    // Niveaux 1-10 : progression linéaire
    return Math.floor(xp / 100) + 1;
  }
  
  // Niveaux 11+ : progression exponentielle
  return Math.floor(Math.sqrt((xp - 1000) / 50)) + 10;
}

/**
 * Calcule l'XP nécessaire pour un niveau donné
 */
export function xpForLevel(level: number): number {
  if (level <= 10) {
    return (level - 1) * 100;
  }
  
  const adjustedLevel = level - 10;
  return Math.pow(adjustedLevel, 2) * 50 + 1000;
}

/**
 * Calcule l'XP nécessaire pour le prochain niveau
 */
export function xpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  return nextLevelXp - currentXp;
}

/**
 * Calcule le pourcentage de progression vers le prochain niveau
 */
export function progressToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const progress = currentXp - currentLevelXp;
  const total = nextLevelXp - currentLevelXp;
  return Math.min(100, Math.max(0, (progress / total) * 100));
}

/**
 * Plafond de niveau (optionnel)
 */
export const MAX_LEVEL = 100;


