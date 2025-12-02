# PLAN D'ACTION RIGOUREUX - REFACTORISATION GOOGLE-TEMPO

## 📋 INSTRUCTIONS POUR CURSOR AUTO MODE

Ce document contient un plan d'action séquentiel pour résoudre les problèmes identifiés lors de l'audit.

**RÈGLES IMPORTANTES :**

- ✅ **CRITIQUE** = Instructions à suivre EXACTEMENT comme spécifié
- 🔄 **FLEXIBLE** = Cursor peut adapter l'implémentation selon le contexte
- ⚠️ Toujours tester après chaque étape
- ⚠️ Commiter après chaque étape complétée
- ⚠️ Ne jamais passer à l'étape suivante si la précédente a des erreurs

---

## PHASE 1 : DUPLICATION DE CODE (CRITIQUE) ⚡

### ÉTAPE 1.1 : Créer le module de formatage de temps ✅ CRITIQUE

**Fichier à créer :** `lib/utils/time-formatters.ts`

**Contenu EXACT à implémenter :**

```typescript
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
```

**Tests à ajouter :** Créer `lib/utils/__tests__/time-formatters.test.ts` (contenu flexible)

---

### ÉTAPE 1.2 : Mise à jour de MonthView.tsx ✅ CRITIQUE

**Fichier :** `components/calendar/MonthView.tsx`

**Actions EXACTES :**

1. **Ajouter l'import en haut du fichier :**
   ```typescript
   import { formatTime } from '@/lib/utils/time-formatters';
   ```

2. **Supprimer les lignes 50-55** (fonction `formatTime` locale)

3. **Remplacer tous les appels** à l'ancienne fonction par la nouvelle :
   - Chercher : `formatTime(new Date(event.start))`
   - Remplacer par : `formatTime(new Date(event.start), true)`
   - Faire de même pour `event.end`

4. **Vérifier** qu'il n'y a plus de fonction `formatTime` définie localement

**Résultat attendu :** MonthView.tsx devrait avoir ~163 lignes (5 lignes supprimées)

---

### ÉTAPE 1.3 : Mise à jour de WeekView.tsx ✅ CRITIQUE

**Fichier :** `components/calendar/WeekView.tsx`

**Actions EXACTES :**

1. **Ajouter les imports en haut du fichier :**
   ```typescript
   import { formatTime, formatHourLabel } from '@/lib/utils/time-formatters';
   ```

2. **Supprimer les lignes 42-47** (fonction `formatTime` locale)

3. **Supprimer les lignes 50-57** (fonction `formatHourLabel` locale - ajuster numérotation après suppression précédente)

4. **Remplacer tous les appels** :
   - `formatTime(new Date(...))` → `formatTime(new Date(...), true)`
   - `formatHourLabel(hour)` → `formatHourLabel(hour, true)`

5. **Vérifier** qu'il n'y a plus de fonctions locales `formatTime` ou `formatHourLabel`

**Résultat attendu :** WeekView.tsx devrait avoir ~162 lignes (11 lignes supprimées)

---

### ÉTAPE 1.4 : Mise à jour de DayView.tsx ✅ CRITIQUE

**Fichier :** `components/calendar/DayView.tsx`

**Actions EXACTES :**

1. **Ajouter les imports en haut du fichier :**
   ```typescript
   import { formatTime, formatHourLabel } from '@/lib/utils/time-formatters';
   ```

2. **Supprimer les lignes 28-33** (fonction `formatTime` locale)

3. **Supprimer les lignes 36-43** (fonction `formatHourLabel` locale - ajuster numérotation)

4. **Remplacer tous les appels** :
   - `formatTime(new Date(...))` → `formatTime(new Date(...), true)`
   - `formatHourLabel(hour)` → `formatHourLabel(hour, true)`

5. **Vérifier** qu'il n'y a plus de fonctions locales

**Résultat attendu :** DayView.tsx devrait avoir ~219 lignes (11 lignes supprimées)

---

### ÉTAPE 1.5 : Tests et validation ⚠️

**Actions :**
1. Lancer `npm run build` - DOIT réussir sans erreurs
2. Tester l'application en mode dev
3. Vérifier que les heures s'affichent correctement dans :
   - Vue mois
   - Vue semaine
   - Vue jour
4. Commiter : `git commit -m "feat: centralize time formatting utilities"`

---

## PHASE 2 : REFACTORISATION SETTINGS PROVIDER (CRITIQUE) ⚡

### ÉTAPE 2.1 : Créer le Theme Manager ✅ CRITIQUE

**Fichier à créer :** `lib/theme/theme-manager.ts`

**Contenu EXACT à implémenter :**

```typescript
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
```

---

### ÉTAPE 2.2 : Créer l'Accent Color Manager ✅ CRITIQUE

**Fichier à créer :** `lib/theme/accent-color-manager.ts`

**Contenu EXACT à implémenter :**

```typescript
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
```

---

### ÉTAPE 2.3 : Simplifier SettingsProvider 🔄 FLEXIBLE

**Fichier :** `components/providers/settings-provider.tsx`

**Actions CRITIQUES :**

1. **Ajouter les imports en haut du fichier :**
   ```typescript
   import { ThemeManager } from '@/lib/theme/theme-manager';
   import { AccentColorManager } from '@/lib/theme/accent-color-manager';
   ```

2. **Supprimer les fonctions locales :**
   - Fonction `applyTheme` (toute la fonction)
   - Fonction `applyThemeDirectly` (toute la fonction)
   - Tout le code lié au calcul des couleurs d'accent

3. **Remplacer les appels :**
   - `applyTheme(settings.theme)` → `ThemeManager.applyTheme(settings.theme)`
   - `applyThemeDirectly(newTheme)` → `ThemeManager.applyTheme(newTheme)`
   - Code de gestion des couleurs → `AccentColorManager.applyAccentColor(settings.accentColor, effectiveTheme)`

**Actions FLEXIBLES :**

- Réorganiser le code du provider pour plus de clarté
- Simplifier la logique des useEffect si possible
- Améliorer les commentaires

**Objectif :** Réduire le fichier à ~100-120 lignes

---

### ÉTAPE 2.4 : Tests et validation ⚠️

**Actions :**
1. Lancer `npm run build` - DOIT réussir
2. Tester le changement de thème (light/dark/system)
3. Tester le changement de couleur d'accent
4. Vérifier que le thème persiste après rechargement
5. Commiter : `git commit -m "refactor: extract theme management logic"`

---

## PHASE 3 : REFACTORISATION NOTIFICATION SYSTEM (CRITIQUE) ⚡

### ÉTAPE 3.1 : Créer les types de notifications ✅ CRITIQUE

**Fichier à créer :** `types/notifications.ts`

**Contenu EXACT :**

```typescript
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

export interface NotificationContextType {
  showNotification: (message: string, type: NotificationType, duration?: number) => void;
}
```

---

### ÉTAPE 3.2 : Extraire NotificationCard ✅ CRITIQUE

**Fichier à créer :** `components/notifications/NotificationCard.tsx`

**Actions CRITIQUES :**

1. Copier le composant `NotificationCard` depuis `NotificationSystem.tsx`
2. Ajouter les imports nécessaires :
   ```typescript
   import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
   import type { Notification } from '@/types/notifications';
   ```
3. Ajouter la prop `onClose` :
   ```typescript
   interface NotificationCardProps {
     notification: Notification;
     onClose: (id: string) => void;
   }
   ```
4. Exporter le composant : `export default NotificationCard;`

**Structure attendue :**
- ~50-60 lignes
- Un seul composant : `NotificationCard`
- Props bien typées

---

### ÉTAPE 3.3 : Extraire NotificationContainer ✅ CRITIQUE

**Fichier à créer :** `components/notifications/NotificationContainer.tsx`

**Actions CRITIQUES :**

1. Copier le composant `NotificationContainer` depuis `NotificationSystem.tsx`
2. Ajouter les imports :
   ```typescript
   import type { Notification } from '@/types/notifications';
   import NotificationCard from './NotificationCard';
   ```
3. Ajouter les props nécessaires :
   ```typescript
   interface NotificationContainerProps {
     notifications: Notification[];
     onClose: (id: string) => void;
   }
   ```
4. Exporter : `export default NotificationContainer;`

**Structure attendue :**
- ~30-40 lignes
- Utilise `NotificationCard`
- Gère l'affichage de la liste

---

### ÉTAPE 3.4 : Simplifier NotificationSystem ✅ CRITIQUE

**Fichier :** `components/notifications/NotificationSystem.tsx`

**Actions CRITIQUES :**

1. **Ajouter les imports :**
   ```typescript
   import type { Notification, NotificationContextType, NotificationType } from '@/types/notifications';
   import NotificationContainer from './NotificationContainer';
   ```

2. **Supprimer :**
   - Interface `Notification` locale (utiliser celle de `types`)
   - Interface `NotificationContextType` locale
   - Composant `NotificationCard` (déjà extrait)
   - Composant `NotificationContainer` (déjà extrait)

3. **Garder uniquement :**
   - Le Context
   - Le Provider avec la logique de gestion
   - Le hook `useNotification`

**Résultat attendu :**
- ~80-100 lignes (au lieu de 206)
- Structure claire : Context → Provider → Hook → Export

---

### ÉTAPE 3.5 : Tests et validation ⚠️

**Actions :**
1. Lancer `npm run build`
2. Tester l'affichage des notifications (success, error, info, warning)
3. Tester la fermeture manuelle et automatique
4. Vérifier que plusieurs notifications s'empilent correctement
5. Commiter : `git commit -m "refactor: split notification system into modules"`

---

## PHASE 4 : SYSTÈME DE LOGGING (FLEXIBLE) 🔄

### ÉTAPE 4.1 : Créer le système de logging 🔄 FLEXIBLE

**Fichier à créer :** `lib/utils/logger.ts`

**Contraintes CRITIQUES :**

- DOIT supporter les niveaux : `debug`, `info`, `warn`, `error`
- DOIT respecter la variable d'environnement `NODE_ENV`
- DOIT désactiver les logs debug en production
- DOIT préfixer les logs avec un timestamp

**Implémentation FLEXIBLE :** Cursor peut choisir l'approche (classe, fonctions, singleton)

**Exemple de structure attendue :**

```typescript
// Les logs debug ne doivent PAS apparaître en production
logger.debug('Message de debug');  // Visible uniquement en dev
logger.info('Message info');       // Toujours visible
logger.warn('Attention');          // Toujours visible
logger.error('Erreur');            // Toujours visible
```

---

### ÉTAPE 4.2 : Remplacer les console.log 🔄 FLEXIBLE

**Fichiers concernés (49 occurrences) :**

- `lib/agent/nodes/agent-node.ts` (9 console.log)
- `app/api/chat/route.ts` (9 console.log)
- `lib/agent/tools/calendar/*.ts` (multiples)
- Autres fichiers identifiés dans l'audit

**Actions CRITIQUES :**

1. Remplacer TOUS les `console.log` par `logger.debug`
2. Remplacer TOUS les `console.error` par `logger.error`
3. Remplacer TOUS les `console.warn` par `logger.warn`
4. Ne PAS toucher aux `console.log` dans les tests

**Actions FLEXIBLES :**

- Améliorer les messages de log si pertinent
- Ajouter du contexte aux logs si nécessaire

**Méthode recommandée :**

- Traiter fichier par fichier
- Ajouter l'import en haut : `import { logger } from '@/lib/utils/logger';`
- Faire les remplacements
- Vérifier que ça compile

---

### ÉTAPE 4.3 : Tests et validation ⚠️

**Actions :**
1. Build : `npm run build`
2. Tester en dev : les logs debug doivent être visibles
3. Tester en prod : `NODE_ENV=production npm run build && npm start`
4. Les logs debug ne doivent PAS apparaître
5. Les logs info/warn/error doivent apparaître
6. Commiter : `git commit -m "feat: implement centralized logging system"`

---

## PHASE 5 : GESTION D'ERREURS API (FLEXIBLE) 🔄

### ÉTAPE 5.1 : Créer l'Error Handler 🔄 FLEXIBLE

**Fichier à créer :** `lib/api/error-handler.ts`

**Contraintes CRITIQUES :**

- DOIT retourner des réponses `NextResponse` standardisées
- DOIT inclure les codes HTTP appropriés
- DOIT logger les erreurs
- DOIT gérer les erreurs connues vs inconnues

**Structure minimale attendue :**

```typescript
// Fonction pour gérer les erreurs API
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Implémentation flexible
}

// Types d'erreurs personnalisés (optionnel mais recommandé)
export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}
```

**Format de réponse standardisé CRITIQUE :**

```typescript
{
  error: string,           // Message d'erreur
  details?: unknown,       // Détails additionnels (optionnel)
  code?: string            // Code d'erreur (optionnel)
}
```

---

### ÉTAPE 5.2 : Mettre à jour les routes API 🔄 FLEXIBLE

**Fichiers concernés :**

- `app/api/chat/route.ts`
- `app/api/analyze-trees/route.ts`
- `app/api/calendar/events/route.ts`
- Toutes les autres routes API

**Actions CRITIQUES :**

1. Importer l'error handler en haut de chaque fichier
2. Entourer le code d'un `try-catch` si pas déjà fait
3. Utiliser `handleApiError` dans le `catch`
4. Respecter le format de réponse standardisé

**Actions FLEXIBLES :**

- Améliorer la gestion d'erreurs spécifiques
- Ajouter des validations de paramètres
- Améliorer les messages d'erreur

**Exemple de transformation :**

```typescript
// AVANT
try {
  // code
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}

// APRÈS
try {
  // code
} catch (error) {
  return handleApiError(error, 'route-name');
}
```

---

### ÉTAPE 5.3 : Tests et validation ⚠️

**Actions :**
1. Build : `npm run build`
2. Tester les routes API avec des cas d'erreur :
   - Paramètres manquants
   - Données invalides
   - Erreurs serveur
3. Vérifier que les erreurs sont bien loggées
4. Vérifier que les réponses sont standardisées
5. Commiter : `git commit -m "feat: standardize API error handling"`

---

## PHASE 6 : OPTIMISATIONS DIVERSES (FLEXIBLE) 🔄

### ÉTAPE 6.1 : Centraliser les constantes UI 🔄 FLEXIBLE

**Fichier à créer :** `lib/constants/ui-constants.ts`

**Contraintes CRITIQUES :**

- DOIT exporter des constantes typées
- DOIT couvrir : z-index, durées, tailles, breakpoints

**Structure minimale :**

```typescript
export const Z_INDEX = {
  modal: 60,
  modalOverlay: 70,
  // etc.
} as const;

export const DURATIONS = {
  oneMinute: 60000,
  // etc.
} as const;

export const CALENDAR = {
  hourHeight: 80,
  // etc.
} as const;
```

**Implémentation FLEXIBLE :** Cursor décide quelles valeurs extraire et comment organiser

---

### ÉTAPE 6.2 : Centraliser les types locaux 🔄 FLEXIBLE

**Action CRITIQUE :** Déplacer les interfaces/types locaux vers `types/index.ts` ou créer des fichiers dédiés

**Fichiers concernés :**

- `components/rules/RulesPanel.tsx` : interface `Rule`
- Autres types locaux identifiés

**Implémentation FLEXIBLE :**

- Cursor peut créer `types/rules.ts`, `types/ui.ts`, etc.
- Ou tout mettre dans `types/index.ts`

---

### ÉTAPE 6.3 : Réduire les styles inline 🔄 FLEXIBLE

**Fichiers concernés :**

- `components/calendar/DayView.tsx`
- `components/calendar/WeekView.tsx`
- `components/events/EventDetailsPanel.tsx`

**Action CRITIQUE :** Extraire les styles inline répétés vers :

- Constantes (si simples)
- Hooks personnalisés (si dynamiques)
- Classes Tailwind (si réutilisables)

**Implémentation FLEXIBLE :** Cursor choisit la meilleure approche selon le contexte

---

### ÉTAPE 6.4 : Tests finaux et validation ⚠️

**Actions :**
1. Build complet : `npm run build`
2. Tests manuels de l'application
3. Vérifier les performances (pas de régression)
4. Commiter : `git commit -m "refactor: optimize constants, types, and styles"`

---

## 📊 CHECKLIST FINALE

**Avant de considérer le travail terminé :**

- [ ] **Phase 1 :** Duplication de code éliminée
  - [ ] `time-formatters.ts` créé et testé
  - [ ] MonthView, WeekView, DayView mis à jour
  - [ ] Aucune duplication de `formatTime`/`formatHourLabel`

- [ ] **Phase 2 :** SettingsProvider refactorisé
  - [ ] ThemeManager créé et fonctionnel
  - [ ] AccentColorManager créé et fonctionnel
  - [ ] SettingsProvider < 120 lignes

- [ ] **Phase 3 :** NotificationSystem refactorisé
  - [ ] Types exportés dans `types/notifications.ts`
  - [ ] NotificationCard extrait
  - [ ] NotificationContainer extrait
  - [ ] NotificationSystem < 100 lignes

- [ ] **Phase 4 :** Logging centralisé
  - [ ] Logger créé avec niveaux debug/info/warn/error
  - [ ] Tous les `console.log` remplacés
  - [ ] Logs debug désactivés en production

- [ ] **Phase 5 :** Gestion d'erreurs standardisée
  - [ ] Error handler créé
  - [ ] Toutes les routes API utilisent l'error handler
  - [ ] Format de réponse cohérent

- [ ] **Phase 6 :** Optimisations
  - [ ] Constantes UI centralisées
  - [ ] Types locaux déplacés
  - [ ] Styles inline réduits

- [ ] **Tests globaux**
  - [ ] `npm run build` réussit sans erreurs
  - [ ] Aucune régression fonctionnelle
  - [ ] Application testée en dev et prod
  - [ ] Tous les commits effectués

---

## 🎯 MÉTRIQUES DE SUCCÈS

**Avant refactorisation :**
- Fichiers > 150 lignes : 6
- Console.log : 49 occurrences
- Duplications : 3 identifiées

**Après refactorisation (objectifs) :**
- Fichiers > 150 lignes : 2 maximum (DayView peut rester volumineux)
- Console.log : 0 occurrences (remplacés par logger)
- Duplications : 0
- Nouveaux modules créés : ~8-10
- Lignes de code économisées : ~150-200

---

## ⚠️ NOTES IMPORTANTES POUR CURSOR

- **Ordre des phases :** Respecter l'ordre, chaque phase s'appuie sur la précédente
- **Tests systématiques :** Tester après CHAQUE étape
- **Commits réguliers :** Commiter après chaque phase complétée
- **En cas d'erreur :** NE PAS continuer, corriger d'abord
- **Types TypeScript :** Toujours vérifier que `npm run build` passe
- **Imports :** Utiliser les alias `@/` pour tous les imports
- **Format :** Respecter le formatage existant du projet (Prettier/ESLint)

---

## 🔧 COMMANDES UTILES

```bash
# Build et vérification des types
npm run build

# Dev mode
npm run dev

# Lint
npm run lint

# Format (si configuré)
npm run format
```

---

**Document créé le :** 2025-11-29  
**Version :** 1.0  
**Basé sur :** Audit complet du projet Google-Tempo
